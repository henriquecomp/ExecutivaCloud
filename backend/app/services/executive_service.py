from sqlalchemy.orm import Session
from fastapi import Depends
from app.repositories.executive_repository import ExecutiveRepository
from app.schemas import executive_schema as schemas
from app.models import executive_model as models
from app.core.database import get_db
from typing import List, Optional


class ExecutiveService:
    def __init__(self, db: Session = Depends(get_db)):
        self.db = db
        self.repository = ExecutiveRepository(db=db)

    def _to_snake_case(self, data: dict) -> dict:
        """Converte chaves de camelCase para snake_case para o modelo SQLAlchemy"""
        mapping = {
            "fullName": "full_name",
            "rgIssuer": "rg_issuer",
            "rgIssueDate": "rg_issue_date",
            "birthDate": "birth_date",
            "placeOfBirth": "place_of_birth",
            "motherName": "mother_name",
            "fatherName": "father_name",
            "civilStatus": "civil_status",
            "workEmail": "work_email",
            "workPhone": "work_phone",
            "personalEmail": "personal_email",
            "personalPhone": "personal_phone",
            "linkedinProfileUrl": "linkedin_profile_url",
            "jobTitle": "job_title",
            "organizationId": "organization_id",
            "departmentId": "department_id",
            "costCenter": "cost_center",
            "employeeId": "employee_id",
            "reportsToExecutiveId": "reports_to_executive_id",
            "hireDate": "hire_date",
            "workLocation": "work_location",
            "photoUrl": "photo_url",
            "emergencyContactName": "emergency_contact_name",
            "emergencyContactPhone": "emergency_contact_phone",
            "emergencyContactRelation": "emergency_contact_relation",
            "dependentsInfo": "dependents_info",
            "bankInfo": "bank_info",
            "compensationInfo": "compensation_info",
            "systemAccessLevels": "system_access_levels",
        }
        new_data = {}
        for k, v in data.items():
            new_key = mapping.get(
                k, k
            )  # Se não estiver no mapa, usa a original (ex: cpf, rg, bio)
            new_data[new_key] = v
        return new_data

    def get_executive(self, exec_id: int) -> Optional[models.Executive]:
        return self.repository.get_by_id(exec_id)

    def get_all_executives(
        self, skip: int = 0, limit: int = 100
    ) -> List[models.Executive]:
        return self.repository.get_all(skip=skip, limit=limit)

    def create_executive(self, exec_data: schemas.ExecutiveCreate) -> models.Executive:
        # Validação de Unicidade de CPF
        if exec_data.cpf:
            if self.repository.get_by_cpf(exec_data.cpf):
                raise ValueError("CPF já cadastrado.")

        # Validação de Email Corporativo
        if exec_data.workEmail:
            existing = self.repository.get_by_email(exec_data.workEmail)
            if existing:
                raise ValueError("Email corporativo já cadastrado.")

        # Converte para dict e mapeia para snake_case
        data_dict = exec_data.model_dump()
        db_data = self._to_snake_case(data_dict)

        return self.repository.create(db_data)

    def update_executive(
        self, exec_id: int, update_data: schemas.ExecutiveUpdate
    ) -> models.Executive:
        db_exec = self.repository.get_by_id(exec_id)
        if not db_exec:
            raise ValueError("Executivo não encontrado.")

        # Converte para dict, removendo nulos, e mapeia
        data_dict = update_data.model_dump(exclude_unset=True)

        # Validação CPF na edição
        if "cpf" in data_dict and data_dict["cpf"] != db_exec.cpf:
            if self.repository.get_by_cpf(data_dict["cpf"]):
                raise ValueError("Novo CPF já pertence a outro executivo.")

        db_data = self._to_snake_case(data_dict)
        return self.repository.update(db_exec, db_data)

    def delete_executive(self, exec_id: int):
        db_exec = self.repository.get_by_id(exec_id)
        if not db_exec:
            raise ValueError("Executivo não encontrado.")
        self.repository.delete(db_exec)
        return {"message": "Executivo deletado com sucesso"}
