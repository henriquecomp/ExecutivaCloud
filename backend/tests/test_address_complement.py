"""Persistência do campo complement em org legal e empresa."""

from app.models.legal_organization_model import LegalOrganization
from app.models.organization_model import Organization

VALID_CNPJ = "11222333000181"
VALID_CNPJ_B = "04252011000110"
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
    db_session.commit()

    r1 = client.put(
        f"/organizations/{org.id}",
        json=_full_org_payload(lo.id, complement="Novo complemento"),
    )
    assert r1.status_code == 200, r1.text
    assert r1.json().get("complement") == "Novo complemento"

    r2 = client.get(f"/organizations/{org.id}")
    assert r2.json().get("complement") == "Novo complemento"

    r3 = client.put(
        f"/organizations/{org.id}",
        json=_full_org_payload(lo.id, complement=None),
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
