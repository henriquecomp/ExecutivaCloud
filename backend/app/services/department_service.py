from sqlalchemy.orm import Session
from fastapi import Depends
from app.repositories.department_repository import DepartmentRepository
from app.repositories.organization_repository import (
    OrganizationRepository,
)  # Dependência
from app.schemas import department_schema as schemas
from app.models import department_model as models
from app.core.database import get_db
from typing import List, Optional


class DepartmentService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.repository = DepartmentRepository(db=db)
        self.org_repo = OrganizationRepository(db=db)  # Dependência

    def get_all_departments(self) -> List[models.Department]:
        return self.repository.get_all()

    def get_department(self, dept_id: int) -> Optional[models.Department]:
        return self.repository.get_by_id(dept_id)

    def get_departments_by_org(self, org_id: int) -> List[models.Department]:
        return self.repository.get_by_organization_id(org_id)

    def create_department(
        self, dept_data: schemas.DepartmentCreate
    ) -> models.Department:
        # Lógica de Negócio: Verificar se a Organização pai existe
        if not self.org_repo.get_by_id(dept_data.organizationId):
            raise ValueError("A Empresa (organizationId) não existe.")

        # Lógica de Negócio: Verificar duplicidade de nome *naquela organização*
        if self.repository.get_by_name_and_org(
            dept_data.name, dept_data.organizationId
        ):
            raise ValueError("Este nome de departamento já existe nesta empresa.")

        dept_dict = dept_data.model_dump()
        return self.repository.create(dept_dict)

    def update_department(
        self, dept_id: int, update_data: schemas.DepartmentUpdate
    ) -> models.Department:
        db_dept = self.repository.get_by_id(dept_id)
        if not db_dept:
            raise ValueError("Departamento não encontrado.")

        update_dict = update_data.model_dump(exclude_unset=True)

        # Lógica de Negócio: Checar unicidade se o nome ou orgId mudarem
        new_name = update_dict.get("name", db_dept.name)
        new_org_id = update_dict.get("organizationId", db_dept.organizationId)

        if "name" in update_dict or "organizationId" in update_dict:
            if new_name != db_dept.name or new_org_id != db_dept.organizationId:
                if "organizationId" in update_dict:
                    # Se mudou de organização, verificar se a nova existe
                    if not self.org_repo.get_by_id(new_org_id):
                        raise ValueError("A nova Empresa (organizationId) não existe.")

                if self.repository.get_by_name_and_org(new_name, new_org_id):
                    raise ValueError(
                        "Este nome de departamento já existe na empresa de destino."
                    )

        return self.repository.update(db_dept, update_dict)

    def delete_department(self, dept_id: int):
        db_dept = self.repository.get_by_id(dept_id)
        if not db_dept:
            raise ValueError("Departamento não encontrado.")

        # Lógica de Negócio: Adicionar verificação de executivos vinculados
        # (Requer que o modelo Executive tenha o relacionamento `department`)
        # if db_dept.executives:
        #    raise ValueError("Não é possível excluir. Este departamento possui executivos vinculados.")

        self.repository.delete(db_dept)
        return {"message": "Departamento deletado com sucesso"}
