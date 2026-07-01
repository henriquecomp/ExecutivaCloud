"""Invariantes de hierarquia tenant: organização jurídica (matriz) → empresa → usuário."""

from typing import Any, Optional

from fastapi import HTTPException, status

LEGAL_ORG_ADMIN = "admin_legal_organization"
COMPANY_ADMIN = "admin_company"
MASTER = "master"


def validate_user_tenant_scope(
    *,
    role: str,
    legal_organization_id: Optional[int],
    organization_id: Optional[int],
) -> None:
    """
    Garante vínculos coerentes com o papel.
    - admin_legal_organization: legal_organization_id obrigatório; organization_id deve ser NULL.
    - admin_company: organization_id obrigatório.
    - master: sem vínculo de tenant; não aplica validação de organização/empresa.
    """
    if role == MASTER:
        return

    if role == LEGAL_ORG_ADMIN:
        if legal_organization_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrador da organização deve estar vinculado à organização jurídica (matriz).",
            )
        if organization_id is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrador da organização não pode estar vinculado a uma empresa específica.",
            )
        return

    if role == COMPANY_ADMIN:
        if organization_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Administrador da empresa deve estar vinculado a uma empresa.",
            )
        return


def normalize_user_scope_fields(
    *,
    role: str,
    legal_organization_id: Optional[int],
    organization_id: Optional[int],
) -> dict[str, Any]:
    """Normaliza campos antes de persistir (ex.: limpa organization_id para admin de matriz)."""
    legal_organization_id = legal_organization_id
    organization_id = organization_id

    if role == LEGAL_ORG_ADMIN:
        organization_id = None

    return {
        "legal_organization_id": legal_organization_id,
        "organization_id": organization_id,
    }
