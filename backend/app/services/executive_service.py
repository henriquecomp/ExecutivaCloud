from typing import Optional

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.executive_repository import ExecutiveRepository
from app.schemas.executive_schema import ExecutiveCreate, ExecutiveUpdate
from app.models import user_model as user_models
from app.services.executive_scope import (
    assert_executive_manager,
    executive_in_manager_scope,
    scoped_executives_query,
)


def raise_if_cpf_taken(
    repository: ExecutiveRepository,
    db: Session,
    cpf: Optional[str],
    *,
    exclude_id: Optional[int] = None,
) -> None:
    if not cpf:
        return
    existing = repository.get_by_cpf(db, cpf, exclude_id=exclude_id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF já cadastrado.",
        )


def integrity_error_detail(exc: IntegrityError) -> str:
    msg = str(getattr(exc, "orig", None) or exc).lower()
    if "cpf" in msg:
        return "CPF já cadastrado."
    if "work_email" in msg or "email" in msg:
        return "Email de trabalho já cadastrado."
    return "Não foi possível salvar: dados conflitantes ou inválidos."


class ExecutiveService:
    def __init__(self):
        self.repository = ExecutiveRepository()

    def list_executives(
        self,
        db: Session,
        actor: user_models.Usuario,
        skip: int = 0,
        limit: int = 100,
    ):
        if actor.role in ("executive", "secretary"):
            return scoped_executives_query(db, actor).offset(skip).limit(limit).all()
        assert_executive_manager(actor)
        return scoped_executives_query(db, actor).offset(skip).limit(limit).all()

    def create_executive(
        self, db: Session, actor: user_models.Usuario, executive_data: ExecutiveCreate
    ):
        assert_executive_manager(actor)
        org_id = executive_data.organization_id
        if org_id is not None:
            from app.models.executive_model import Executive

            probe = Executive(organization_id=org_id)
            if not executive_in_manager_scope(db, actor, probe):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Sem permissão para criar executivo nesta empresa.",
                )
        existing = self.repository.get_by_email(db, executive_data.work_email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email de trabalho já cadastrado.",
            )
        raise_if_cpf_taken(self.repository, db, executive_data.cpf)
        try:
            return self.repository.create(db, executive_data)
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=integrity_error_detail(e),
            ) from e

    def get_executive(self, db: Session, actor: user_models.Usuario, executive_id: int):
        executive = self.repository.get_by_id(db, executive_id)
        if not executive:
            raise HTTPException(status_code=404, detail="Executivo não encontrado")
        if actor.role == "executive" and actor.executive_id == executive_id:
            return executive
        assert_executive_manager(actor)
        if not executive_in_manager_scope(db, actor, executive):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Executivo fora do seu escopo.")
        return executive

    def update_executive(
        self,
        db: Session,
        actor: user_models.Usuario,
        executive_id: int,
        executive_data: ExecutiveUpdate,
    ):
        db_executive = self.get_executive(db, actor, executive_id)
        update_data = executive_data.model_dump(exclude_unset=True, by_alias=False)
        if "organization_id" in update_data:
            new_org = update_data.get("organization_id")
            # Mesma empresa no payload não é movimentação (comum em "Meus dados" com empresa travada).
            if new_org != db_executive.organization_id:
                if actor.role == "executive" and actor.executive_id == executive_id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Não é permitido alterar a empresa do próprio cadastro.",
                    )
                if new_org is not None:
                    from app.models.executive_model import Executive

                    probe = Executive(organization_id=new_org)
                    if not executive_in_manager_scope(db, actor, probe):
                        raise HTTPException(
                            status_code=status.HTTP_403_FORBIDDEN,
                            detail="Sem permissão para mover executivo para esta empresa.",
                        )
                else:
                    assert_executive_manager(actor)
        if "cpf" in update_data:
            raise_if_cpf_taken(
                self.repository, db, update_data.get("cpf"), exclude_id=executive_id
            )
        try:
            return self.repository.update(db, db_executive, update_data)
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=integrity_error_detail(e),
            ) from e

    def delete_executive(self, db: Session, actor: user_models.Usuario, executive_id: int):
        db_executive = self.get_executive(db, actor, executive_id)
        self.repository.delete(db, db_executive)
        return {"detail": "Executivo removido com sucesso"}
