"""Testes de bootstrap master, bloqueio POST /users/, escopo de executivos e validadores."""

import os
from unittest.mock import patch

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
    assert (
        "Administrador da empresa deve estar vinculado a uma empresa."
        not in r.text
    )
    r_dup = client.post(
        "/auth/bootstrap-master",
        json=body,
        headers={"X-Setup-Token": os.environ["EXECUTIVA_SETUP_TOKEN"]},
    )
    assert r_dup.status_code == 400
    assert r_dup.json()["detail"] == "O superusuário já foi cadastrado."


def test_bootstrap_master_skips_company_admin_validation(client):
    from app.core.tenant_scope import validate_user_tenant_scope

    validate_user_tenant_scope(
        role="master",
        legal_organization_id=None,
        organization_id=None,
    )

    body = {"email": "master2@test.com", "password": "secret123", "fullName": "Master Two"}
    r = client.post(
        "/auth/bootstrap-master",
        json=body,
        headers={"X-Setup-Token": os.environ["EXECUTIVA_SETUP_TOKEN"]},
    )
    assert r.status_code == 201, r.text
    assert (
        "Administrador da empresa deve estar vinculado a uma empresa."
        not in r.text
    )


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


def test_executive_lists_peers_in_same_company(client, db_session):
    """Gestor direto: lista executivos da mesma empresa com conta ativa."""
    lo = _seed_legal_org(db_session)
    org_a = _seed_company(db_session, lo, VALID_CNPJ_B)
    org_b = _seed_company(db_session, lo, "11444777000161")

    peer = Executive(full_name="Peer Active", work_email="peer@corp.com", organization_id=org_a.id)
    inactive_ex = Executive(
        full_name="Peer Inactive", work_email="inactive@corp.com", organization_id=org_a.id
    )
    no_user_ex = Executive(
        full_name="No Account", work_email="nouser@corp.com", organization_id=org_a.id
    )
    self_ex = Executive(full_name="Self Exec", work_email="self@corp.com", organization_id=org_a.id)
    other = Executive(full_name="Other Company", work_email="other@corp.com", organization_id=org_b.id)
    db_session.add_all([peer, inactive_ex, no_user_ex, self_ex, other])
    db_session.commit()

    db_session.add(
        user_models.Usuario(
            name="Peer Active",
            email="peer@corp.com",
            hashed_password=hash_password("secret123"),
            is_active=True,
            role="executive",
            legal_organization_id=lo.id,
            organization_id=org_a.id,
            executive_id=peer.id,
        )
    )
    db_session.add(
        user_models.Usuario(
            name="Peer Inactive",
            email="inactive@corp.com",
            hashed_password=hash_password("secret123"),
            is_active=False,
            role="executive",
            legal_organization_id=lo.id,
            organization_id=org_a.id,
            executive_id=inactive_ex.id,
        )
    )
    db_session.add(
        user_models.Usuario(
            name="Self Exec",
            email="self@corp.com",
            hashed_password=hash_password("secret123"),
            is_active=True,
            role="executive",
            legal_organization_id=lo.id,
            organization_id=None,
            executive_id=self_ex.id,
            needs_profile_completion=True,
        )
    )
    db_session.commit()

    token = _login(client, "self@corp.com")
    r = client.get("/executives/?limit=2000", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200, r.text
    ids = {e["id"] for e in r.json()}
    assert peer.id in ids
    assert self_ex.id in ids
    assert inactive_ex.id not in ids
    assert no_user_ex.id not in ids
    assert other.id not in ids
    for row in r.json():
        assert row.get("organizationId") == org_a.id


def test_organization_create_rejects_invalid_cnpj(client, db_session):
    lo = _seed_legal_org(db_session, VALID_CNPJ_B)
    db_session.commit()
    _create_user(
        db_session,
        email="lo-cnpj@test.com",
        role="admin_legal_organization",
        legal_id=lo.id,
    )
    token = _login(client, "lo-cnpj@test.com")
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
    r = client.post(
        "/organizations/",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 422


def test_organization_tenant_visibility_and_create_scope(client, db_session):
    """Matriz vê/cria só suas empresas; master vê todas; cross-tenant bloqueado."""
    lo_a = _seed_legal_org(db_session, "11444777000161")
    lo_b = _seed_legal_org(db_session, "06990590000123")
    org_a = _seed_company(db_session, lo_a, "04252011000110")
    org_b = Organization(
        name="Empresa Outra Matriz",
        legalOrganizationId=lo_b.id,
        cnpj="23145757000179",
        street="Rua B",
        number="20",
        neighborhood="Centro",
        city="Rio",
        state="RJ",
        zipCode="20040020",
        complement=None,
    )
    db_session.add(org_b)
    db_session.flush()
    db_session.commit()

    _create_user(
        db_session,
        email="admin-a@test.com",
        role="admin_legal_organization",
        legal_id=lo_a.id,
    )
    _create_user(
        db_session,
        email="admin-b@test.com",
        role="admin_legal_organization",
        legal_id=lo_b.id,
    )
    _create_user(db_session, email="master-org@test.com", role="master")

    token_a = _login(client, "admin-a@test.com")
    token_b = _login(client, "admin-b@test.com")
    token_master = _login(client, "master-org@test.com")
    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}
    headers_master = {"Authorization": f"Bearer {token_master}"}

    r_a = client.get("/organizations/", headers=headers_a)
    assert r_a.status_code == 200, r_a.text
    ids_a = {o["id"] for o in r_a.json()}
    assert org_a.id in ids_a
    assert org_b.id not in ids_a

    r_b = client.get("/organizations/", headers=headers_b)
    ids_b = {o["id"] for o in r_b.json()}
    assert org_b.id in ids_b
    assert org_a.id not in ids_b

    r_master = client.get("/organizations/", headers=headers_master)
    ids_master = {o["id"] for o in r_master.json()}
    assert org_a.id in ids_master and org_b.id in ids_master

    create_payload = {
        "name": "Filial Nova A",
        "legalOrganizationId": lo_b.id,  # tentativa de vincular à outra matriz
        "cnpj": "58929179000146",
        "street": "Rua Nova",
        "number": "1",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": VALID_CEP,
    }
    r_create = client.post("/organizations/", json=create_payload, headers=headers_a)
    assert r_create.status_code == 201, r_create.text
    assert r_create.json()["legalOrganizationId"] == lo_a.id

    r_cross = client.put(
        f"/organizations/{org_b.id}",
        json={
            "name": "Hack Tentativa",
            "legalOrganizationId": lo_b.id,
            "cnpj": org_b.cnpj,
            "street": "Rua B",
            "number": "20",
            "neighborhood": "Centro",
            "city": "Rio",
            "state": "RJ",
            "zipCode": "20040020",
        },
        headers=headers_a,
    )
    assert r_cross.status_code == 403, r_cross.text

    r_unauth = client.get("/organizations/")
    assert r_unauth.status_code == 401


def test_executive_can_read_own_organization_only(client, db_session):
    """Onboarding: executive lê só a própria empresa; não muta; não vê outra."""
    lo_a = _seed_legal_org(db_session, "11444777000161")
    lo_b = _seed_legal_org(db_session, "06990590000123")
    org_a = _seed_company(db_session, lo_a, "04252011000110")
    org_b = Organization(
        name="Empresa Outra",
        legalOrganizationId=lo_b.id,
        cnpj="23145757000179",
        street="Rua B",
        number="20",
        neighborhood="Centro",
        city="Rio",
        state="RJ",
        zipCode="20040020",
        complement=None,
    )
    db_session.add(org_b)
    db_session.flush()

    ex = Executive(
        full_name="Executivo Onboard",
        work_email="exec-onboard@test.com",
        organization_id=org_a.id,
    )
    db_session.add(ex)
    db_session.flush()
    db_session.commit()

    user = _create_user(
        db_session,
        email="exec-onboard@test.com",
        role="executive",
        org_id=org_a.id,
        legal_id=lo_a.id,
    )
    user.executive_id = ex.id
    db_session.commit()

    token = _login(client, "exec-onboard@test.com")
    headers = {"Authorization": f"Bearer {token}"}

    r_list = client.get("/organizations/", headers=headers)
    assert r_list.status_code == 200, r_list.text
    ids = {o["id"] for o in r_list.json()}
    assert ids == {org_a.id}

    r_own = client.get(f"/organizations/{org_a.id}", headers=headers)
    assert r_own.status_code == 200, r_own.text
    assert r_own.json()["id"] == org_a.id

    r_other = client.get(f"/organizations/{org_b.id}", headers=headers)
    assert r_other.status_code == 403, r_other.text

    r_create = client.post(
        "/organizations/",
        json={
            "name": "Hack Empresa",
            "legalOrganizationId": lo_a.id,
            "cnpj": "58929179000146",
            "street": "Rua X",
            "number": "1",
            "neighborhood": "Centro",
            "city": "SP",
            "state": "SP",
            "zipCode": VALID_CEP,
        },
        headers=headers,
    )
    assert r_create.status_code == 403, r_create.text


def test_register_organization_creates_legal_org_admin(client, db_session):
    """Cadastro público de organização: admin da matriz, sem organization_id."""
    email = "orgadmin@newtenant.com"
    payload = {
        "legalName": "Matriz Nova",
        "legalCnpj": "11444777000161",
        "legalStreet": "Rua Registro",
        "legalNumber": "50",
        "legalNeighborhood": "Centro",
        "legalCity": "São Paulo",
        "legalState": "SP",
        "legalZipCode": VALID_CEP,
        "legalComplement": "Sala 1",
        "adminName": "Admin Matriz",
        "adminEmail": email,
        "adminEmailConfirm": email,
        "captchaToken": "test-captcha-token",
    }
    with patch("app.services.auth_service.send_invite_email"), patch(
        "app.services.auth_service.verify_turnstile_token"
    ):
        r = client.post(
            "/auth/register-organization",
            json=payload,
            headers={"X-Frontend-Base-URL": "http://localhost:5173"},
        )
    assert r.status_code in (200, 201), r.text

    user = db_session.query(user_models.Usuario).filter(user_models.Usuario.email == email).first()
    assert user is not None
    assert user.role == "admin_legal_organization"
    assert user.legal_organization_id is not None
    assert user.organization_id is None


def test_legal_org_admin_cannot_have_organization_id(db_session):
    import pytest
    from fastapi import HTTPException
    from app.core.tenant_scope import validate_user_tenant_scope

    lo = _seed_legal_org(db_session, "06990590000123")
    with pytest.raises(HTTPException) as exc:
        validate_user_tenant_scope(
            role="admin_legal_organization",
            legal_organization_id=lo.id,
            organization_id=99,
        )
    assert exc.value.status_code == 400


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
