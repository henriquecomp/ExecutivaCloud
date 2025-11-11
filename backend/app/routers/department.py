from fastapi import APIRouter, Depends, HTTPException, status
from app.services.department_service import DepartmentService
from app.schemas import department_schema as schemas
from typing import List, Dict, Any

router = APIRouter(
    prefix="/departments",
    tags=["Departments"]
)

@router.post("/", response_model=schemas.Department, status_code=status.HTTP_201_CREATED)
def create_department(
    dept: schemas.DepartmentCreate, 
    service: DepartmentService = Depends(DepartmentService)
):
    """
    Cria um novo Departamento.
    """
    try:
        return service.create_department(dept)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/by-organization/{org_id}", response_model=List[schemas.Department])
def get_departments_by_organization(
    org_id: int,
    service: DepartmentService = Depends(DepartmentService)
):
    """
    Lista todos os Departamentos de uma Empresa específica.
    """
    return service.get_departments_by_org(org_id)

@router.get("/{dept_id}", response_model=schemas.Department)
def get_department(
    dept_id: int, 
    service: DepartmentService = Depends(DepartmentService)
):
    """
    Busca um Departamento pelo ID.
    """
    db_dept = service.get_department(dept_id)
    if db_dept is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Departamento não encontrado")
    return db_dept

@router.put("/{dept_id}", response_model=schemas.Department)
def update_department(
    dept_id: int, 
    dept_data: schemas.DepartmentUpdate,
    service: DepartmentService = Depends(DepartmentService)
):
    """
    Atualiza um Departamento.
    """
    try:
        updated_dept = service.update_department(dept_id, dept_data)
        return updated_dept
    except ValueError as e:
        if "não encontrado" in str(e):
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.delete("/{dept_id}", response_model=Dict[str, str])
def delete_department(
    dept_id: int,
    service: DepartmentService = Depends(DepartmentService)
):
    """
    Deleta um Departamento.
    """
    try:
        return service.delete_department(dept_id)
    except ValueError as e:
        if "não encontrado" in str(e):
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))