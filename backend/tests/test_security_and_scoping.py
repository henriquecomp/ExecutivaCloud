"""Testes de bootstrap master, bloqueio POST /users/, escopo de executivos e validadores."""

import os

from app.core.security import hash_password
from app.models.executive_model import Executive
from app.models.legal_organization_model import LegalOrganization
from app.models.organization_model import Organization
from app.models import user_model as user_models

VALID_CNPJ = "11222333000181"
VALID_CNPJ_B = "04252011000110"
INVALID_CNPJ = "11111111111111"
VALID_CEP = "01310100"


def _seed_legal_org(db, cnpj: str = VALID_CNPJ) -> LegalOrganization:
    lo = LegalOrganization(
        name="Org Legal Test",
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
    db.flush()
    return lo


def _seed_company(db, legal_org: LegalOrganization, cnpj: str = VALID_CNPJ_B) -> Organization:
    org = Organization(
        name="Empresa Test",
        legalOrganizationId=legal_org.id,
        cnpj=cnpj,
        street="Rua A",
        number="10",
        neighborhood="Centro",
        city="São Paulo",
        state="SP",
        zipCode="01310200",
        complement=None,
    )
    db.add(org)
    db.flush()
    return org


def _create_user(db, *, email: str, role: str, org_id=None, legal_id=None, password="secret123"):
    u = user_models.Usuario(
        name="Test User",
        email=email,
        hashed_password=hash_password(password),
        is_active=True,
        role=role,
        legal_organization_id=legal_id,
        organization_id=org_id,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _login(client, email: str, password: str = "secret123") -> str:
    r = client.post("/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["accessToken"]


def test_bootstrap_master_requires_valid_token(client):
    body = {"email": "master@test.com", "password": "secret123", "fullName": "Master"}
    assert client.post("/auth/bootstrap-master", json=body).status_code == 403
    assert (
        client.post(
            "/auth/bootstrap-master",
            json=body,
            headers={"X-Setup-Token": "wrong"},
        ).status_code
        == 403
    )
    r = client.post(
        "/auth/bootstrap-master",
        json=body,
        headers={"X-Setup-Token": os.environ["EXECUTIVA_SETUP_TOKEN"]},
    )
    assert r.status_code == 201, r.text
    assert r.json()["user"]["role"] == "master"
    assert client.post(
        "/auth/bootstrap-master",
        json=body,
        headers={"X-Setup-Token": os.environ["EXECUTIVA_SETUP_TOKEN"]},
    ).status_code == 400


def test_post_users_blocks_master_role(client, db_session):
    r = client.post(
        "/users/",
        json={
            "fullName": "Bad Master",
            "email": "badmaster@test.com",
            "password": "secret123",
            "role": "master",
        },
    )
    assert r.status_code == 422 or r.status_code == 403


def test_post_users_rejects_master_even_if_schema_bypassed(client, db_session):
    """Garantia extra: serviço bloqueia master mesmo se validação Pydantic falhar."""
    from app.schemas.user_schema import UsuarioCreate
    from app.services.user_service import UserService
    from fastapi import HTTPException
    import pytest

    data = UsuarioCreate.model_construct(
        name="X",
        email="x@y.com",
        password="secret123",
        role="master",
    )
    service = UserService(db=db_session)
    with pytest.raises(HTTPException) as exc:
        service.create_user(data)
    assert exc.value.status_code == 403


def test_executive_list_scoped_by_role(client, db_session):
    lo = _seed_legal_org(db_session)
    org_a = _seed_company(db_session, lo, VALID_CNPJ_B)
    org_b = _seed_company(db_session, lo, "11444777000161")

    ex_a = Executive(full_name="Exec A", work_email="a@corp.com", organization_id=org_a.id)
    ex_b = Executive(full_name="Exec B", work_email="b@corp.com", organization_id=org_b.id)
    db_session.add_all([ex_a, ex_b])
    db_session.commit()

    _create_user(
        db_session,
        email="adminco@test.com",
        role="admin_company",
        org_id=org_a.id,
    )
    _create_user(
        db_session,
        email="adminlo@test.com",
        role="admin_legal_organization",
        legal_id=lo.id,
    )
    _create_user(db_session, email="master@test.com", role="master")

    token_co = _login(client, "adminco@test.com")
    r_co = client.get("/executives/", headers={"Authorization": f"Bearer {token_co}"})
    assert r_co.status_code == 200
    ids_co = {e["id"] for e in r_co.json()}
    assert ex_a.id in ids_co
    assert ex_b.id not in ids_co

    token_lo = _login(client, "adminlo@test.com")
    r_lo = client.get("/executives/", headers={"Authorization": f"Bearer {token_lo}"})
    assert r_lo.status_code == 200
    ids_lo = {e["id"] for e in r_lo.json()}
    assert ex_a.id in ids_lo and ex_b.id in ids_lo

    token_master = _login(client, "master@test.com")
    r_master = client.get("/executives/", headers={"Authorization": f"Bearer {token_master}"})
    assert len(r_master.json()) >= 2


def test_organization_create_rejects_invalid_cnpj(client, db_session):
    lo = _seed_legal_org(db_session, VALID_CNPJ_B)
    payload = {
        "name": "Nova Empresa",
        "legalOrganizationId": lo.id,
        "cnpj": INVALID_CNPJ,
        "street": "Rua X",
        "number": "1",
        "neighborhood": "Centro",
        "city": "SP",
        "state": "SP",
        "zipCode": VALID_CEP,
    }
    r = client.post("/organizations/", json=payload)
    assert r.status_code == 422


def test_legal_organization_create_rejects_invalid_cep(client, db_session):
    payload = {
        "name": "Org Nova",
        "cnpj": VALID_CNPJ,
        "street": "Rua Y",
        "number": "2",
        "neighborhood": "Bairro",
        "city": "Cidade",
        "state": "SP",
        "zipCode": "123",
    }
    r = client.post("/legal-organizations/", json=payload)
    assert r.status_code == 422
