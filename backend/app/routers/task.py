from datetime import date
from typing import List, Optional, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import task_schema as schemas
from app.services.task_service import TaskService


router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("/", response_model=List[schemas.Task])
def get_all_tasks(
    skip: int = 0,
    limit: int = 1000,
    executive_id: Optional[int] = None,
    service: TaskService = Depends(TaskService),
):
    return service.get_all_tasks(skip=skip, limit=limit, executive_id=executive_id)


@router.get("/{task_id}", response_model=schemas.Task)
def get_task(
    task_id: int,
    service: TaskService = Depends(TaskService),
):
    db_item = service.get_task(task_id)
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada.")
    return db_item


@router.post("/", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: schemas.TaskCreate,
    service: TaskService = Depends(TaskService),
):
    try:
        return service.create_task(payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.post("/bulk", response_model=List[schemas.Task], status_code=status.HTTP_201_CREATED)
def create_tasks_bulk(
    payloads: List[schemas.TaskCreate],
    service: TaskService = Depends(TaskService),
):
    try:
        return service.create_many_tasks(payloads)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.put("/{task_id}", response_model=schemas.Task)
def update_task(
    task_id: int,
    payload: schemas.TaskUpdate,
    service: TaskService = Depends(TaskService),
):
    try:
        return service.update_task(task_id, payload)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrada" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/{task_id}", response_model=Dict[str, str])
def delete_task(
    task_id: int,
    service: TaskService = Depends(TaskService),
):
    try:
        return service.delete_task(task_id)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrada" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/recurrence/{recurrence_id}", response_model=schemas.RecurrenceDeleteResult)
def delete_tasks_by_recurrence(
    recurrence_id: str,
    from_due_date: Optional[date] = None,
    service: TaskService = Depends(TaskService),
):
    result = service.delete_by_recurrence(recurrence_id=recurrence_id, from_due_date=from_due_date)
    return result
