"""Persistência do campo complement em org legal e empresa."""

from app.core.security import hash_password
from app.models.legal_organization_model import LegalOrganization
from app.models.organization_model import Organization
from app.models import user_model as user_models

VALID_CNPJ = "11222333000181"
VALID_CNPJ_MASKED = "11.222.333/0001-81"
VALID_CNPJ_B = "04252011000110"
VALID_CNPJ_B_MASKED = "04.252.011/0001-10"
VALID_CEP = "01310100"
VALID_CEP_MASKED = "01310-100"


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
        complement="Sala 1",
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
        complement="Bloco B",
    )
    db.add(org)
    db.flush()
    return org


def _create_master(db, email: str = "master-addr@test.com") -> user_models.Usuario:
    u = user_models.Usuario(
        name="Master Addr",
        email=email,
        hashed_password=hash_password("secret123"),
        is_active=True,
        role="master",
        legal_organization_id=None,
        organization_id=None,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def _auth_headers(client, email: str = "master-addr@test.com") -> dict:
    r = client.post("/auth/login", json={"email": email, "password": "secret123"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['accessToken']}"}


def _full_org_payload(legal_id: int, **overrides):
    base = {
        "name": "Empresa Atualizada",
        "legalOrganizationId": legal_id,
        "cnpj": VALID_CNPJ_B,
        "street": "Rua A",
        "number": "10",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01310200",
    }
    base.update(overrides)
    return base


def test_organization_update_persists_and_clears_complement(client, db_session):
    lo = _seed_legal_org(db_session)
    org = _seed_company(db_session, lo)
    _create_master(db_session)
    db_session.commit()
    headers = _auth_headers(client)

    r1 = client.put(
        f"/organizations/{org.id}",
        json=_full_org_payload(lo.id, complement="Novo complemento"),
        headers=headers,
    )
    assert r1.status_code == 200, r1.text
    assert r1.json().get("complement") == "Novo complemento"

    r2 = client.get(f"/organizations/{org.id}", headers=headers)
    assert r2.json().get("complement") == "Novo complemento"

    r3 = client.put(
        f"/organizations/{org.id}",
        json=_full_org_payload(lo.id, complement=None),
        headers=headers,
    )
    assert r3.status_code == 200, r3.text
    assert r3.json().get("complement") is None


def test_legal_organization_update_persists_and_clears_complement(client, db_session):
    lo = _seed_legal_org(db_session)
    db_session.commit()

    payload = {
        "name": "Org Atualizada",
        "cnpj": VALID_CNPJ,
        "street": "Av Paulista",
        "number": "100",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": VALID_CEP,
        "complement": "Andar 2",
    }
    r1 = client.put(f"/legal-organizations/{lo.id}", json=payload)
    assert r1.status_code == 200, r1.text
    assert r1.json().get("complement") == "Andar 2"

    payload["complement"] = None
    r2 = client.put(f"/legal-organizations/{lo.id}", json=payload)
    assert r2.status_code == 200, r2.text
    assert r2.json().get("complement") is None


def test_legal_organization_update_rejects_cnpj_change(client, db_session):
    lo = _seed_legal_org(db_session)
    db_session.commit()

    payload = {
        "name": "Org Atualizada",
        "cnpj": VALID_CNPJ_B,
        "street": "Av Paulista",
        "number": "100",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": VALID_CEP,
    }
    r = client.put(f"/legal-organizations/{lo.id}", json=payload)
    assert r.status_code == 400, r.text
    assert r.json()["detail"] == "CNPJ não pode ser alterado."


def test_organization_update_rejects_cnpj_change(client, db_session):
    lo = _seed_legal_org(db_session)
    org = _seed_company(db_session, lo)
    _create_master(db_session, email="master-cnpj-rej@test.com")
    db_session.commit()
    headers = _auth_headers(client, email="master-cnpj-rej@test.com")

    r = client.put(
        f"/organizations/{org.id}",
        json=_full_org_payload(lo.id, cnpj=VALID_CNPJ),
        headers=headers,
    )
    assert r.status_code == 400, r.text
    assert r.json()["detail"] == "CNPJ não pode ser alterado."


def test_legal_organization_update_accepts_same_cnpj_masked(client, db_session):
    lo = _seed_legal_org(db_session)
    db_session.commit()

    payload = {
        "name": "Org Atualizada",
        "cnpj": VALID_CNPJ_MASKED,
        "street": "Av Paulista",
        "number": "100",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": VALID_CEP_MASKED,
        "complement": "Sala 9",
    }
    r = client.put(f"/legal-organizations/{lo.id}", json=payload)
    assert r.status_code == 200, r.text
    assert r.json().get("complement") == "Sala 9"
    assert r.json().get("cnpj") == VALID_CNPJ


def test_organization_update_accepts_same_cnpj_masked(client, db_session):
    lo = _seed_legal_org(db_session)
    org = _seed_company(db_session, lo)
    _create_master(db_session, email="master-cnpj-mask@test.com")
    db_session.commit()
    headers = _auth_headers(client, email="master-cnpj-mask@test.com")

    r = client.put(
        f"/organizations/{org.id}",
        json=_full_org_payload(
            lo.id,
            cnpj=VALID_CNPJ_B_MASKED,
            zipCode="01310-200",
            complement="Mantém CNPJ",
        ),
        headers=headers,
    )
    assert r.status_code == 200, r.text
    assert r.json().get("complement") == "Mantém CNPJ"
    assert r.json().get("cnpj") == VALID_CNPJ_B
