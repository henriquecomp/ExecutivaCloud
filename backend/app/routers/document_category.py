from typing import List, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.schemas import document_category_schema as schemas
from app.services.document_category_service import DocumentCategoryService

router = APIRouter(prefix="/document-categories", tags=["Document Categories"])


@router.get("/", response_model=List[schemas.DocumentCategory])
def get_all_categories(
    skip: int = 0,
    limit: int = 1000,
    service: DocumentCategoryService = Depends(DocumentCategoryService),
):
    return service.get_all_categories(skip=skip, limit=limit)


@router.get("/{category_id}", response_model=schemas.DocumentCategory)
def get_category(
    category_id: int,
    service: DocumentCategoryService = Depends(DocumentCategoryService),
):
    db_item = service.get_category(category_id)
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria não encontrada.")
    return db_item


@router.post("/", response_model=schemas.DocumentCategory, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: schemas.DocumentCategoryCreate,
    service: DocumentCategoryService = Depends(DocumentCategoryService),
):
    try:
        return service.create_category(payload)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@router.put("/{category_id}", response_model=schemas.DocumentCategory)
def update_category(
    category_id: int,
    payload: schemas.DocumentCategoryUpdate,
    service: DocumentCategoryService = Depends(DocumentCategoryService),
):
    try:
        return service.update_category(category_id, payload)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrada" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)


@router.delete("/{category_id}", response_model=Dict[str, str])
def delete_category(
    category_id: int,
    service: DocumentCategoryService = Depends(DocumentCategoryService),
):
    try:
        return service.delete_category(category_id)
    except ValueError as error:
        detail = str(error)
        status_code = status.HTTP_404_NOT_FOUND if "não encontrada" in detail else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=detail)
