import json
from typing import Any, Dict, List, Optional

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models.executive_model import Executive
from app.models.secretary_model import Secretary
from app.models.user_model import Usuario

_TOP_BODY_KEYS = frozenset(
    {"id", "executiveIds", "organizationId", "fullName", "workEmail", "jobTitle"},
)


def _parse_org_id(raw: Any) -> Optional[int]:
    if raw is None or raw == "":
        return None
    try:
        return int(raw)
    except (TypeError, ValueError):
        return None


def _parse_executive_ids(raw: Any) -> List[int]:
    if not raw:
        return []
    out: List[int] = []
    for x in raw:
        try:
            out.append(int(x))
        except (TypeError, ValueError):
            continue
    return out


def _body_to_parts(body: Dict[str, Any]) -> tuple[str, Optional[int], Optional[str], Optional[str], Optional[str], List[int]]:
    full_name = (body.get("fullName") or body.get("full_name") or "").strip()
    if not full_name:
        raise ValueError("Nome completo é obrigatório.")
    org_id = _parse_org_id(body.get("organizationId"))
    work_email = body.get("workEmail") or body.get("work_email")
    if work_email is not None:
        work_email = str(work_email).strip() or None
    job_title = body.get("jobTitle") or body.get("job_title")
    if job_title is not None:
        job_title = str(job_title).strip() or None
    exec_ids = _parse_executive_ids(body.get("executiveIds"))
    extra = {k: v for k, v in body.items() if k not in _TOP_BODY_KEYS}
    profile = json.dumps(extra, ensure_ascii=False) if extra else None
    return full_name, org_id, work_email, job_title, profile, exec_ids


def secretary_to_dict(sec: Secretary) -> Dict[str, Any]:
    exec_ids = [ex.id for ex in (sec.executives or [])]
    out: Dict[str, Any] = {
        "id": str(sec.id),
        "fullName": sec.full_name,
        "organizationId": str(sec.organization_id) if sec.organization_id is not None else None,
        "workEmail": sec.work_email,
        "jobTitle": sec.job_title,
        "executiveIds": [str(i) for i in exec_ids],
    }
    if sec.profile_json:
        try:
            extra = json.loads(sec.profile_json)
            if isinstance(extra, dict):
                for k, v in extra.items():
                    if k not in out:
                        out[k] = v
        except json.JSONDecodeError:
            pass
    return out


class SecretaryService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def list_secretaries(self, skip: int = 0, limit: int = 2000) -> List[Dict[str, Any]]:
        rows = (
            self.db.query(Secretary)
            .options(joinedload(Secretary.executives))
            .offset(skip)
            .limit(limit)
            .all()
        )
        return [secretary_to_dict(s) for s in rows]

    def get_secretary(self, secretary_id: int) -> Dict[str, Any]:
        sec = (
            self.db.query(Secretary)
            .options(joinedload(Secretary.executives))
            .filter(Secretary.id == secretary_id)
            .first()
        )
        if not sec:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secretária não encontrada.")
        return secretary_to_dict(sec)

    def create_secretary(self, body: Dict[str, Any]) -> Dict[str, Any]:
        full_name, org_id, work_email, job_title, profile, exec_ids = _body_to_parts(body)
        sec = Secretary(
            full_name=full_name,
            organization_id=org_id,
            work_email=work_email,
            job_title=job_title,
            profile_json=profile,
        )
        self.db.add(sec)
        self.db.flush()
        self._set_executives(sec, exec_ids)
        self.db.commit()
        self.db.refresh(sec)
        return self.get_secretary(sec.id)

    def update_secretary(self, secretary_id: int, body: Dict[str, Any]) -> Dict[str, Any]:
        sec = (
            self.db.query(Secretary)
            .options(joinedload(Secretary.executives))
            .filter(Secretary.id == secretary_id)
            .first()
        )
        if not sec:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secretária não encontrada.")
        full_name, org_id, work_email, job_title, profile, exec_ids = _body_to_parts({**secretary_to_dict(sec), **body})
        sec.full_name = full_name
        sec.organization_id = org_id
        sec.work_email = work_email
        sec.job_title = job_title
        sec.profile_json = profile
        self._set_executives(sec, exec_ids)
        self.db.commit()
        self.db.refresh(sec)
        return self.get_secretary(sec.id)

    def _set_executives(self, sec: Secretary, exec_ids: List[int]) -> None:
        executives: List[Executive] = []
        for eid in exec_ids:
            ex = self.db.query(Executive).filter(Executive.id == eid).first()
            if ex:
                executives.append(ex)
        sec.executives = executives

    def delete_secretary(self, secretary_id: int) -> Dict[str, str]:
        linked = (
            self.db.query(Usuario)
            .filter(Usuario.secretary_external_id == str(secretary_id))
            .first()
        )
        if linked:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Existe usuário de login vinculado a esta secretária. Remova ou altere o usuário antes.",
            )
        sec = self.db.query(Secretary).filter(Secretary.id == secretary_id).first()
        if not sec:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Secretária não encontrada.")
        self.db.delete(sec)
        self.db.commit()
        return {"message": "Secretária excluída com sucesso."}
