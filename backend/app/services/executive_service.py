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
        return self.repository.create(db, executive_data)

    def get_executive(self, db: Session, actor: user_models.Usuario, executive_id: int):
        assert_executive_manager(actor)
        executive = self.repository.get_by_id(db, executive_id)
        if not executive:
            raise HTTPException(status_code=404, detail="Executivo não encontrado")
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
        new_org = update_data.get("organization_id")
        if new_org is not None:
            from app.models.executive_model import Executive

            probe = Executive(organization_id=new_org)
            if not executive_in_manager_scope(db, actor, probe):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Sem permissão para mover executivo para esta empresa.",
                )
        return self.repository.update(db, db_executive, update_data)

    def delete_executive(self, db: Session, actor: user_models.Usuario, executive_id: int):
        db_executive = self.get_executive(db, actor, executive_id)
        self.repository.delete(db, db_executive)
        return {"detail": "Executivo removido com sucesso"}
