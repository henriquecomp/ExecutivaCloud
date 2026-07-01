"""Testes de validadores brasileiros (CNPJ alfanumérico, nomes compostos)."""

import pytest
from pydantic import ValidationError

from app.core.br_validators import validate_cnpj, validate_two_word_name
from app.schemas.auth_schema import RegisterOrganizationRequest

VALID_NUMERIC_CNPJ = "11222333000181"
VALID_ALPHANUMERIC_CNPJ = "12ABC34501DE35"
INVALID_CNPJ = "11111111111111"


def test_validate_cnpj_numeric_still_valid():
    assert validate_cnpj(VALID_NUMERIC_CNPJ) == VALID_NUMERIC_CNPJ


def test_validate_cnpj_alphanumeric():
    assert validate_cnpj(VALID_ALPHANUMERIC_CNPJ) == VALID_ALPHANUMERIC_CNPJ
    assert validate_cnpj("12.ABC.345/01DE-35") == VALID_ALPHANUMERIC_CNPJ


def test_validate_cnpj_rejects_invalid():
    with pytest.raises(ValueError, match="CNPJ inválido"):
        validate_cnpj(INVALID_CNPJ)


def test_validate_two_word_name():
    assert validate_two_word_name("STELLANTIS DO BRASIL", "Razão social") == "STELLANTIS DO BRASIL"
    with pytest.raises(ValueError, match="dois nomes"):
        validate_two_word_name("STELLANTIS", "Razão social")


def test_register_organization_request_requires_email_confirm():
    base = {
        "legalName": "Matriz Nova Ltda",
        "legalCnpj": VALID_NUMERIC_CNPJ,
        "legalStreet": "Rua A",
        "legalNumber": "1",
        "legalNeighborhood": "Centro",
        "legalCity": "São Paulo",
        "legalState": "SP",
        "legalZipCode": "01310100",
        "adminName": "Admin Matriz",
        "adminEmail": "admin@example.com",
        "adminEmailConfirm": "admin@example.com",
    }
    req = RegisterOrganizationRequest(**base)
    assert req.adminEmail == "admin@example.com"

    with pytest.raises(ValidationError) as exc:
        RegisterOrganizationRequest(**{**base, "adminEmailConfirm": "outro@example.com"})
    assert "E-mail e confirmação não coincidem" in str(exc.value)


def test_register_organization_request_rejects_single_word_legal_name():
    with pytest.raises(ValidationError) as exc:
        RegisterOrganizationRequest(
            legalName="Matriz",
            legalCnpj=VALID_NUMERIC_CNPJ,
            legalStreet="Rua A",
            legalNumber="1",
            legalNeighborhood="Centro",
            legalCity="São Paulo",
            legalState="SP",
            legalZipCode="01310100",
            adminName="Admin Matriz",
            adminEmail="admin@example.com",
            adminEmailConfirm="admin@example.com",
        )
    assert "dois nomes" in str(exc.value)
