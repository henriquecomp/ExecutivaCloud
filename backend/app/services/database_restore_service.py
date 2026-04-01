"""Restaura dados de backup JSON nas tabelas de negócio (SQLite)."""

import json
from typing import Dict

from fastapi import Depends
from sqlalchemy import delete, update
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.contact_model import Contact
from app.models.contact_type_model import ContactType
from app.models.department_model import Department
from app.models.document_category_model import DocumentCategory
from app.models.document_model import Document
from app.models.event_model import Event
from app.models.event_type_model import EventType
from app.models.executive_model import Executive
from app.models.secretary_model import Secretary
from app.models.legal_organization_model import LegalOrganization
from app.models.organization_model import Organization
from app.models.report_model import Report
from app.models.task_model import Task
from app.schemas import contact_schema as contact_schemas
from app.schemas import contact_type_schema as contact_type_schemas
from app.schemas import department_schema as department_schemas
from app.schemas import document_schema as document_schemas
from app.schemas import event_schema as event_schemas
from app.schemas import event_type_schema as event_type_schemas
from app.schemas import executive_schema as executive_schemas
from app.schemas import legal_organization_schema as legal_org_schemas
from app.schemas import organization_schema as organization_schemas
from app.schemas import settings_backup_schema as backup_schemas
from app.schemas import task_schema as task_schemas
from app.services.task_service import _row_dict_with_json_safe_recurrence


def _event_row_dict(payload: event_schemas.EventCreate) -> dict:
    data = payload.model_dump(exclude_unset=True, by_alias=False)
    if "recurrence" not in data:
        return data
    if payload.recurrence is None:
        data["recurrence"] = None
    else:
        data["recurrence"] = payload.recurrence.model_dump(
            by_alias=False, mode="json", exclude_none=True
        )
    return data


def _map_key(m: Dict[str, int], raw_id) -> int | None:
    if raw_id is None:
        return None
    return m.get(str(raw_id))


class DatabaseRestoreService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db

    def _clear_business_data(self) -> None:
        self.db.execute(delete(Report))
        self.db.execute(delete(Task))
        self.db.execute(delete(Event))
        self.db.execute(delete(Contact))
        self.db.execute(delete(Document))
        self.db.execute(delete(Secretary))
        self.db.execute(update(Executive).values(reports_to_executive_id=None))
        self.db.execute(delete(Executive))
        self.db.execute(delete(Department))
        self.db.execute(delete(Organization))
        self.db.execute(delete(LegalOrganization))
        self.db.execute(delete(EventType))
        self.db.execute(delete(ContactType))
        self.db.execute(delete(DocumentCategory))
        self.db.flush()

    def restore(self, data: backup_schemas.SettingsBackupData) -> None:
        lo_map: Dict[str, int] = {}
        org_map: Dict[str, int] = {}
        dept_map: Dict[str, int] = {}
        et_map: Dict[str, int] = {}
        ct_map: Dict[str, int] = {}
        dc_map: Dict[str, int] = {}
        exec_map: Dict[str, int] = {}

        try:
            self._clear_business_data()

            for lo in data.legal_organizations:
                old_id = str(lo.get("id", ""))
                body = {k: v for k, v in lo.items() if k != "id"}
                dto = legal_org_schemas.LegalOrganizationCreate.model_validate(body)
                row = LegalOrganization(**dto.model_dump(by_alias=False))
                self.db.add(row)
                self.db.flush()
                if old_id:
                    lo_map[old_id] = row.id

            for org in data.organizations:
                old_id = str(org.get("id", ""))
                body = {k: v for k, v in org.items() if k != "id"}
                lid = body.get("legalOrganizationId")
                if lid is not None:
                    mapped = _map_key(lo_map, lid)
                    if mapped is None:
                        raise ValueError("Backup inválido: empresa sem organização jurídica correspondente.")
                    body["legalOrganizationId"] = mapped
                dto = organization_schemas.OrganizationCreate.model_validate(body)
                row = Organization(**dto.model_dump(by_alias=False))
                self.db.add(row)
                self.db.flush()
                if old_id:
                    org_map[old_id] = row.id

            for dept in data.departments:
                old_id = str(dept.get("id", ""))
                body = {k: v for k, v in dept.items() if k != "id"}
                oid = body.get("organizationId")
                if oid is not None:
                    mapped = _map_key(org_map, oid)
                    if mapped is None:
                        raise ValueError("Backup inválido: departamento sem empresa correspondente.")
                    body["organizationId"] = mapped
                dto = department_schemas.DepartmentCreate.model_validate(body)
                row = Department(**dto.model_dump(by_alias=False))
                self.db.add(row)
                self.db.flush()
                if old_id:
                    dept_map[old_id] = row.id

            for et in data.event_types:
                old_id = str(et.get("id", ""))
                body = {k: v for k, v in et.items() if k not in ("id",)}
                color = body.get("color") or "#3b82f6"
                if len(str(color)) < 4:
                    color = "#3b82f6"
                body["color"] = color
                dto = event_type_schemas.EventTypeCreate.model_validate(body)
                row = EventType(**dto.model_dump(by_alias=False))
                self.db.add(row)
                self.db.flush()
                if old_id:
                    et_map[old_id] = row.id

            for ct in data.contact_types:
                old_id = str(ct.get("id", ""))
                body = {k: v for k, v in ct.items() if k != "id"}
                color = body.get("color") or "#64748b"
                if len(str(color)) < 4:
                    color = "#64748b"
                dto = contact_type_schemas.ContactTypeCreate.model_validate(
                    {"name": body["name"], "color": color}
                )
                row = ContactType(**dto.model_dump(by_alias=False))
                self.db.add(row)
                self.db.flush()
                if old_id:
                    ct_map[old_id] = row.id

            for dc in data.document_categories:
                old_id = str(dc.get("id", ""))
                body = {k: v for k, v in dc.items() if k != "id"}
                row = DocumentCategory(name=body["name"])
                self.db.add(row)
                self.db.flush()
                if old_id:
                    dc_map[old_id] = row.id

            for ex in data.executives:
                old_id = str(ex.get("id", ""))
                body = {k: v for k, v in ex.items() if k != "id"}
                if body.get("organizationId") is not None:
                    mid = _map_key(org_map, body["organizationId"])
                    body["organizationId"] = mid
                if body.get("departmentId") is not None:
                    mid = _map_key(dept_map, body["departmentId"])
                    body["departmentId"] = mid
                body.pop("reportsToExecutiveId", None)
                dto = executive_schemas.ExecutiveCreate.model_validate(body)
                row = Executive(**dto.model_dump(by_alias=False))
                self.db.add(row)
                self.db.flush()
                if old_id:
                    exec_map[old_id] = row.id

            for ex in data.executives:
                old_id = str(ex.get("id", ""))
                rpt = ex.get("reportsToExecutiveId")
                if not rpt or not old_id:
                    continue
                new_exec_id = exec_map.get(old_id)
                new_reports_to = _map_key(exec_map, rpt)
                if new_exec_id is None or new_reports_to is None:
                    continue
                row = self.db.get(Executive, new_exec_id)
                if row:
                    row.reports_to_executive_id = new_reports_to
            self.db.flush()

            for sec in data.secretaries:
                body = {k: v for k, v in sec.items() if k not in ("id", "executiveIds")}
                oid = body.get("organizationId")
                if oid is not None and str(oid).strip() != "":
                    mid = _map_key(org_map, oid)
                    body["organizationId"] = mid
                else:
                    body["organizationId"] = None
                full_name = (body.get("fullName") or "—").strip() or "—"
                work_email = body.get("workEmail")
                if work_email is not None:
                    work_email = str(work_email).strip() or None
                job_title = body.get("jobTitle")
                if job_title is not None:
                    job_title = str(job_title).strip() or None
                profile_keys = frozenset(
                    {"fullName", "workEmail", "jobTitle", "organizationId"},
                )
                extra = {k: v for k, v in body.items() if k not in profile_keys}
                profile_json = json.dumps(extra, ensure_ascii=False) if extra else None
                row = Secretary(
                    full_name=full_name,
                    organization_id=body.get("organizationId"),
                    work_email=work_email,
                    job_title=job_title,
                    profile_json=profile_json,
                )
                self.db.add(row)
                self.db.flush()
                for raw_eid in sec.get("executiveIds") or []:
                    new_eid = _map_key(exec_map, raw_eid)
                    if new_eid is None:
                        continue
                    ex_row = self.db.get(Executive, new_eid)
                    if ex_row:
                        row.executives.append(ex_row)

            self.db.flush()

            for ev in data.events:
                body = {k: v for k, v in ev.items() if k != "id"}
                eid = body.get("executiveId")
                if eid is None:
                    continue
                mapped_ex = _map_key(exec_map, eid)
                if mapped_ex is None:
                    continue
                body["executiveId"] = mapped_ex
                et_raw = body.get("eventTypeId")
                if et_raw is not None:
                    mapped_et = _map_key(et_map, et_raw)
                    body["eventTypeId"] = mapped_et
                payload = event_schemas.EventCreate.model_validate(body)
                row = Event(**_event_row_dict(payload))
                self.db.add(row)

            for c in data.contacts:
                body = {k: v for k, v in c.items() if k != "id"}
                eid = body.get("executiveId")
                if eid is None:
                    continue
                mapped_ex = _map_key(exec_map, eid)
                if mapped_ex is None:
                    continue
                body["executiveId"] = mapped_ex
                ct_raw = body.get("contactTypeId")
                if ct_raw is not None:
                    mapped_ct = _map_key(ct_map, ct_raw)
                    body["contactTypeId"] = mapped_ct
                dto = contact_schemas.ContactCreate.model_validate(body)
                self.db.add(Contact(**dto.model_dump(by_alias=False)))

            for t in data.tasks:
                body = {k: v for k, v in t.items() if k != "id"}
                eid = body.get("executiveId")
                if eid is None:
                    continue
                mapped_ex = _map_key(exec_map, eid)
                if mapped_ex is None:
                    continue
                body["executiveId"] = mapped_ex
                payload = task_schemas.TaskCreate.model_validate(body)
                self.db.add(Task(**_row_dict_with_json_safe_recurrence(payload)))

            for d in data.documents:
                body = {k: v for k, v in d.items() if k != "id"}
                eid = body.get("executiveId")
                if eid is None:
                    continue
                mapped_ex = _map_key(exec_map, eid)
                if mapped_ex is None:
                    continue
                body["executiveId"] = mapped_ex
                cat_raw = body.get("categoryId")
                if cat_raw is not None:
                    mapped_dc = _map_key(dc_map, cat_raw)
                    body["categoryId"] = mapped_dc
                dto = document_schemas.DocumentCreate.model_validate(body)
                self.db.add(Document(**dto.model_dump(by_alias=False)))

            self.db.commit()
        except Exception:
            self.db.rollback()
            raise
