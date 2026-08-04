"""Testes de anti-enumeração e CAPTCHA no cadastro público de organização."""

from unittest.mock import patch

from app.core.security import hash_password
from app.models.legal_organization_model import LegalOrganization
from app.models import user_model as user_models
from app.services.auth_service import REGISTER_ORGANIZATION_SUCCESS_MESSAGE

VALID_CEP = "01310100"
VALID_CNPJ = "11444777000161"
VALID_CNPJ_B = "04252011000110"


def _register_payload(**overrides):
    base = {
        "legalName": "Matriz Nova",
        "legalCnpj": VALID_CNPJ,
        "legalStreet": "Rua Registro",
        "legalNumber": "50",
        "legalNeighborhood": "Centro",
        "legalCity": "São Paulo",
        "legalState": "SP",
        "legalZipCode": VALID_CEP,
        "legalComplement": "Sala 1",
        "adminName": "Admin Matriz",
        "adminEmail": "orgadmin@newtenant.com",
        "adminEmailConfirm": "orgadmin@newtenant.com",
        "captchaToken": "test-captcha-token",
    }
    base.update(overrides)
    return base


def _seed_legal_org(db, cnpj: str = VALID_CNPJ) -> LegalOrganization:
    lo = LegalOrganization(
        name="Org Existente",
        cnpj=cnpj,
        street="Av Paulista",
        number="100",
        neighborhood="Bela Vista",
        city="São Paulo",
        state="SP",
        zipCode=VALID_CEP,
        complement=None,
    )
    db.add(lo)
    db.commit()
    db.refresh(lo)
    return lo


def _seed_user(db, email: str = "existente@test.com") -> user_models.Usuario:
    user = user_models.Usuario(
        name="Usuario Existente",
        email=email,
        hashed_password=hash_password("senha-valida-longa"),
        is_active=True,
        role="admin_company",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@patch("app.services.auth_service.verify_turnstile_token")
@patch("app.services.auth_service.send_invite_email")
def test_register_organization_success_message(mock_send_email, mock_captcha, client, db_session):
    mock_captcha.return_value = None
    email = "novo-tenant@test.com"
    r = client.post(
        "/auth/register-organization",
        json=_register_payload(adminEmail=email, adminEmailConfirm=email),
        headers={"X-Frontend-Base-URL": "http://localhost:5173"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["message"] == REGISTER_ORGANIZATION_SUCCESS_MESSAGE
    mock_send_email.assert_called_once()
    user = db_session.query(user_models.Usuario).filter(user_models.Usuario.email == email).first()
    assert user is not None


@patch("app.services.auth_service.verify_turnstile_token")
@patch("app.services.auth_service.send_invite_email")
def test_register_organization_duplicate_email_generic_response(
    mock_send_email, mock_captcha, client, db_session
):
    mock_captcha.return_value = None
    existing_email = "duplicado@test.com"
    _seed_user(db_session, existing_email)
    count_before = db_session.query(user_models.Usuario).count()

    r = client.post(
        "/auth/register-organization",
        json=_register_payload(adminEmail=existing_email, adminEmailConfirm=existing_email),
        headers={"X-Frontend-Base-URL": "http://localhost:5173"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["message"] == REGISTER_ORGANIZATION_SUCCESS_MESSAGE
    mock_send_email.assert_not_called()
    assert db_session.query(user_models.Usuario).count() == count_before


@patch("app.services.auth_service.verify_turnstile_token")
@patch("app.services.auth_service.send_invite_email")
def test_register_organization_duplicate_cnpj_generic_response(
    mock_send_email, mock_captcha, client, db_session
):
    mock_captcha.return_value = None
    _seed_legal_org(db_session, VALID_CNPJ)
    count_before = db_session.query(LegalOrganization).count()

    r = client.post(
        "/auth/register-organization",
        json=_register_payload(legalCnpj=VALID_CNPJ, adminEmail="outro@test.com", adminEmailConfirm="outro@test.com"),
        headers={"X-Frontend-Base-URL": "http://localhost:5173"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["message"] == REGISTER_ORGANIZATION_SUCCESS_MESSAGE
    mock_send_email.assert_not_called()
    assert db_session.query(LegalOrganization).count() == count_before


def test_register_organization_rejects_missing_captcha(client):
    payload = _register_payload()
    del payload["captchaToken"]
    r = client.post(
        "/auth/register-organization",
        json=payload,
        headers={"X-Frontend-Base-URL": "http://localhost:5173"},
    )
    assert r.status_code == 422


@patch("app.services.auth_service.verify_turnstile_token")
def test_register_organization_rejects_invalid_captcha(mock_captcha, client):
    from app.core.captcha_service import CaptchaVerificationError

    mock_captcha.side_effect = CaptchaVerificationError("Não foi possível validar a verificação de segurança.")
    r = client.post(
        "/auth/register-organization",
        json=_register_payload(),
        headers={"X-Frontend-Base-URL": "http://localhost:5173"},
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "Não foi possível validar a verificação de segurança."
