"""Série de tarefas: expansão no backend."""

from app.core.recurrence import expand_dates, RecurrenceParams
from app.core.security import hash_password
from app.models.executive_model import Executive
from app.models.legal_organization_model import LegalOrganization
from app.models.organization_model import Organization
from app.models import user_model as user_models
from datetime import date


VALID_CEP = "01310100"
VALID_CNPJ = "11222333000181"
VALID_CNPJ_B = "04252011000110"


def _seed_exec(db_session):
    lo = LegalOrganization(
        name="Org Legal T",
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
        name="Empresa T",
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
        full_name="Exec Tasks",
        work_email="exec.tasks@corp.com",
        organization_id=org.id,
    )
    db_session.add(ex)
    db_session.flush()
    db_session.add(
        user_models.Usuario(
            name="Admin T",
            email="admin.tasks@corp.com",
            hashed_password=hash_password("secret123"),
            is_active=True,
            role="admin_company",
            legal_organization_id=lo.id,
            organization_id=org.id,
            needs_profile_completion=False,
        )
    )
    db_session.commit()
    return ex


def test_expand_dates_monthly():
    occ = expand_dates(
        date(2026, 1, 15),
        RecurrenceParams(frequency="monthly", interval=1, count=3),
    )
    assert occ == [date(2026, 1, 15), date(2026, 2, 15), date(2026, 3, 15)]


def test_create_task_series(client, db_session):
    ex = _seed_exec(db_session)
    r = client.post(
        "/tasks/series",
        json={
            "title": "Relatório",
            "dueDate": "2026-04-01",
            "priority": "Média",
            "status": "A Fazer",
            "executiveId": ex.id,
            "recurrence": {"frequency": "weekly", "interval": 1, "daysOfWeek": [3], "count": 4},
        },
    )
    assert r.status_code == 201, r.text
    rows = r.json()
    assert len(rows) == 4
    assert len({row["recurrenceId"] for row in rows}) == 1


def test_replace_task_series(client, db_session):
    ex = _seed_exec(db_session)
    created = client.post(
        "/tasks/series",
        json={
            "title": "Old",
            "dueDate": "2026-05-01",
            "priority": "Baixa",
            "status": "A Fazer",
            "executiveId": ex.id,
            "recurrence": {"frequency": "daily", "interval": 1, "count": 3},
        },
    )
    assert created.status_code == 201, created.text
    rid = created.json()[0]["recurrenceId"]
    replaced = client.put(
        f"/tasks/series/{rid}",
        json={
            "title": "New",
            "dueDate": "2026-06-01",
            "priority": "Alta",
            "status": "A Fazer",
            "executiveId": ex.id,
            "recurrence": {"frequency": "daily", "interval": 1, "count": 2},
        },
    )
    assert replaced.status_code == 200, replaced.text
    assert len(replaced.json()) == 2
    assert all(t["title"] == "New" for t in replaced.json())
