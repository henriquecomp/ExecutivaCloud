"""Gestor direto (reports_to_executive_id) é opcional em toda a cadeia."""

from app.core.security import hash_password
from app.models.executive_model import Executive
from app.models.legal_organization_model import LegalOrganization
from app.models.organization_model import Organization
from app.models import user_model as user_models
from app.schemas.executive_schema import ExecutiveProfileComplete


VALID_CPF = "52998224725"
VALID_CEP = "01310100"
VALID_CNPJ = "11222333000181"
VALID_CNPJ_B = "04252011000110"


def _minimal_complete_payload(**overrides):
    base = {
        "fullName": "Maria Silva",
        "cpf": VALID_CPF,
        "rg": "1234567",
        "rgIssuer": "SSP",
        "rgIssueDate": "2010-01-15",
        "birthDate": "1990-05-20",
        "nationality": "Brasileira",
        "civilStatus": "Solteiro(a)",
        "workEmail": "maria@corp.com",
        "workPhone": "11999998888",
        "zipCode": VALID_CEP,
        "street": "Av Paulista",
        "number": "1000",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "jobTitle": "Gerente",
        "bankInfo": "Banco 001 | Ag 1234 | Cc 56789-0",
    }
    base.update(overrides)
    return base


def test_profile_complete_schema_allows_missing_manager():
    parsed = ExecutiveProfileComplete.model_validate(_minimal_complete_payload())
    assert parsed.reports_to_executive_id is None


def test_profile_complete_schema_coerces_empty_manager_to_none():
    parsed = ExecutiveProfileComplete.model_validate(
        _minimal_complete_payload(reportsToExecutiveId="")
    )
    assert parsed.reports_to_executive_id is None

    parsed_null = ExecutiveProfileComplete.model_validate(
        _minimal_complete_payload(reportsToExecutiveId=None)
    )
    assert parsed_null.reports_to_executive_id is None


def test_complete_profile_persists_null_manager(client, db_session):
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
        full_name="Maria Silva",
        work_email="maria@corp.com",
        organization_id=org.id,
    )
    db_session.add(ex)
    db_session.flush()
    db_session.add(
        user_models.Usuario(
            name="Maria Silva",
            email="maria@corp.com",
            hashed_password=hash_password("secret123"),
            is_active=True,
            role="executive",
            legal_organization_id=lo.id,
            organization_id=org.id,
            executive_id=ex.id,
            needs_profile_completion=True,
        )
    )
    db_session.commit()

    login = client.post(
        "/auth/login", json={"email": "maria@corp.com", "password": "secret123"}
    )
    assert login.status_code == 200, login.text
    token = login.json()["accessToken"]

    payload = _minimal_complete_payload(organizationId=org.id)
    # Sem reportsToExecutiveId e com departmentId vazio — não pode falhar
    payload["departmentId"] = ""
    r = client.post(
        "/auth/complete-profile/executive",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200, r.text
    assert r.json().get("needsProfileCompletion") is False

    db_session.refresh(ex)
    assert ex.reports_to_executive_id is None
    assert ex.department_id is None
    assert ex.job_title == "Gerente"


def test_complete_profile_rejects_duplicate_cpf(client, db_session):
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
    other = Executive(
        full_name="Outro Exec",
        work_email="outro@corp.com",
        organization_id=org.id,
        cpf=VALID_CPF,
    )
    db_session.add(other)
    db_session.flush()
    ex = Executive(
        full_name="Maria Silva",
        work_email="maria@corp.com",
        organization_id=org.id,
    )
    db_session.add(ex)
    db_session.flush()
    db_session.add(
        user_models.Usuario(
            name="Maria Silva",
            email="maria@corp.com",
            hashed_password=hash_password("secret123"),
            is_active=True,
            role="executive",
            legal_organization_id=lo.id,
            organization_id=org.id,
            executive_id=ex.id,
            needs_profile_completion=True,
        )
    )
    db_session.commit()

    login = client.post(
        "/auth/login", json={"email": "maria@corp.com", "password": "secret123"}
    )
    assert login.status_code == 200, login.text
    token = login.json()["accessToken"]

    payload = _minimal_complete_payload(organizationId=org.id, cpf=VALID_CPF)
    r = client.post(
        "/auth/complete-profile/executive",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 400, r.text
    assert "cpf" in r.json()["detail"].lower()
    db_session.refresh(ex)
    user = (
        db_session.query(user_models.Usuario)
        .filter(user_models.Usuario.email == "maria@corp.com")
        .first()
    )
    assert user is not None
    assert user.needs_profile_completion is True

