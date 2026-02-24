from sqlalchemy.orm import Session
from app.models import department_model as models
from typing import List, Optional, Dict, Any


class DepartmentRepository:
    def __init__(self, db: Session):
        self.db = db
        self.model = models.Department

    def get_all(self) -> List[models.Department]:
        return self.db.query(self.model).all()

    def get_by_id(self, dept_id: int) -> Optional[models.Department]:
        return self.db.query(self.model).filter(self.model.id == dept_id).first()

    def get_by_name_and_org(
        self, name: str, org_id: int
    ) -> Optional[models.Department]:
        return (
            self.db.query(self.model)
            .filter(self.model.name == name, self.model.organizationId == org_id)
            .first()
        )

    def get_by_organization_id(self, org_id: int) -> List[models.Department]:
        return (
            self.db.query(self.model).filter(self.model.organizationId == org_id).all()
        )

    def create(self, dept_data: Dict[str, Any]) -> models.Department:
        db_dept = self.model(**dept_data)
        self.db.add(db_dept)
        self.db.commit()
        self.db.refresh(db_dept)
        return db_dept

    def update(
        self, db_dept: models.Department, update_data: Dict[str, Any]
    ) -> models.Department:
        for key, value in update_data.items():
            setattr(db_dept, key, value)
        self.db.commit()
        self.db.refresh(db_dept)
        return db_dept

    def delete(self, db_dept: models.Department):
        self.db.delete(db_dept)
        self.db.commit()
