from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import report_schema as schemas
from app.services.report_service import ReportService


router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/", response_model=List[schemas.Report])
def get_all_reports(
    skip: int = 0,
    limit: int = 1000,
    service: ReportService = Depends(ReportService),
):
    return service.get_all_reports(skip=skip, limit=limit)


@router.get("/{report_id}", response_model=schemas.Report)
def get_report(
    report_id: int,
    service: ReportService = Depends(ReportService),
):
    db_item = service.get_report(report_id)
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relatório não encontrado.")
    return db_item


@router.post("/", response_model=schemas.Report, status_code=status.HTTP_201_CREATED)
def create_report(
    payload: schemas.ReportCreate,
    service: ReportService = Depends(ReportService),
):
    try:
        return service.create_report(payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.put("/{report_id}", response_model=schemas.Report)
def update_report(
    report_id: int,
    payload: schemas.ReportUpdate,
    service: ReportService = Depends(ReportService),
):
    try:
        return service.update_report(report_id, payload)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/{report_id}", response_model=Dict[str, str])
def delete_report(
    report_id: int,
    service: ReportService = Depends(ReportService),
):
    try:
        return service.delete_report(report_id)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrado" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)
