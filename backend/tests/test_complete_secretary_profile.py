"""Complete-profile da secretária: e-mail travado; depto/gestor opcionais/omitidos."""

from app.core.security import hash_password
from app.models.executive_model import Executive
from app.models.legal_organization_model import LegalOrganization
from app.models.organization_model import Organization
from app.models.secretary_model import Secretary
from app.models import user_model as user_models

VALID_CEP = "01310100"
VALID_CNPJ = "11222333000181"
VALID_CNPJ_B = "04252011000110"


def _seed(db_session):
    lo = LegalOrganization(
        name="Org Legal",
        cnpj=VALID_CNPJ,
        street="Av Paulista",
        number="100",
        neighborhood="Bela Vista",
        city="São Paulo",
        state="SP",
        zipCode=VALID_CEP,
    )
    db_session.add(lo)
    db_session.flush()
    org = Organization(
        name="Empresa",
        legalOrganizationId=lo.id,
        cnpj=VALID_CNPJ_B,
        street="Rua A",
        number="10",
        neighborhood="Centro",
        city="São Paulo",
        state="SP",
        zipCode="01310200",
    )
    db_session.add(org)
    db_session.flush()
    ex = Executive(
        full_name="Exec Linked",
        work_email="exec@corp.com",
        organization_id=org.id,
    )
    db_session.add(ex)
    db_session.flush()
    sec = Secretary(
        full_name="Ana Silva",
        organization_id=org.id,
        work_email="sec@corp.com",
        profile_json='{"departmentId":"99","reportsToExecutiveId":"1"}',
    )
    db_session.add(sec)
    db_session.flush()
    sec.executives.append(ex)
    user = user_models.Usuario(
        name="Ana Silva",
        email="sec@corp.com",
        hashed_password=hash_password("secret123"),
        is_active=True,
        role="secretary",
        legal_organization_id=lo.id,
        organization_id=org.id,
        secretary_external_id=str(sec.id),
        needs_profile_completion=True,
    )
    db_session.add(user)
    db_session.commit()
    return org, sec, ex, user


def _login(client, email: str = "sec@corp.com") -> str:
    r = client.post("/auth/login", json={"email": email, "password": "secret123"})
    assert r.status_code == 200, r.text
    return r.json()["accessToken"]


def test_complete_secretary_profile_without_dept_manager(client, db_session):
    org, sec, ex, _user = _seed(db_session)
    token = _login(client)
    payload = {
        "fullName": "Ana Silva Santos",
        "workEmail": "sec@corp.com",
        "organizationId": org.id,
        "jobTitle": "Assistente",
        "workPhone": "11999998888",
    }
    r = client.post(
        "/auth/complete-profile/secretary",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    assert r.json().get("needsProfileCompletion") is False

    db_session.refresh(sec)
    assert sec.full_name == "Ana Silva Santos"
    assert sec.work_email == "sec@corp.com"
    assert sec.job_title == "Assistente"
    # profile_json preservou depto/gestor existentes (omitidos no body)
    assert sec.profile_json is not None
    assert "departmentId" in sec.profile_json
    assert [e.id for e in sec.executives] == [ex.id]


def test_complete_secretary_profile_rejects_wrong_email(client, db_session):
    org, _sec, _ex, _user = _seed(db_session)
    token = _login(client)
    r = client.post(
        "/auth/complete-profile/secretary",
        json={
            "fullName": "Ana Silva Santos",
            "workEmail": "outro@corp.com",
            "organizationId": org.id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 400
    assert "e-mail" in r.json()["detail"].lower()


def test_complete_secretary_profile_rejects_empty_full_name(client, db_session):
    org, _sec, _ex, _user = _seed(db_session)
    token = _login(client)
    r = client.post(
        "/auth/complete-profile/secretary",
        json={
            "fullName": "   ",
            "workEmail": "sec@corp.com",
            "organizationId": org.id,
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 400, r.text
    assert "nome" in r.json()["detail"].lower()
    user = (
        db_session.query(user_models.Usuario)
        .filter(user_models.Usuario.email == "sec@corp.com")
        .first()
    )
    assert user is not None
    assert user.needs_profile_completion is True
