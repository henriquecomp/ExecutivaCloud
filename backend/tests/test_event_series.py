"""Série de eventos: expansão no backend, sem bulk do cliente."""

from datetime import datetime, timedelta

from app.core.recurrence import MAX_OCCURRENCES, expand_datetimes, RecurrenceParams
from app.core.security import hash_password
from app.models.executive_model import Executive
from app.models.legal_organization_model import LegalOrganization
from app.models.organization_model import Organization
from app.models import user_model as user_models


VALID_CEP = "01310100"
VALID_CNPJ = "11222333000181"
VALID_CNPJ_B = "04252011000110"


def _seed_exec(db_session):
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
        full_name="Exec Agenda",
        work_email="exec.agenda@corp.com",
        organization_id=org.id,
    )
    db_session.add(ex)
    db_session.flush()
    db_session.add(
        user_models.Usuario(
            name="Admin",
            email="admin.agenda@corp.com",
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


def test_expand_daily_count():
    start = datetime(2026, 1, 1, 10, 0, 0)
    occ = expand_datetimes(
        start,
        RecurrenceParams(frequency="daily", interval=1, count=5),
    )
    assert len(occ) == 5
    assert occ[0] == start
    assert occ[4] == datetime(2026, 1, 5, 10, 0, 0)


def test_expand_weekly_days():
    # Quarta 2026-01-07
    start = datetime(2026, 1, 7, 9, 0, 0)
    occ = expand_datetimes(
        start,
        RecurrenceParams(
            frequency="weekly",
            interval=1,
            days_of_week=[3],  # Wednesday
            count=3,
        ),
    )
    assert len(occ) == 3
    assert all(d.weekday() == 2 for d in occ)  # Python Wed=2
    assert occ[0] == start


def test_expand_rejects_over_max():
    start = datetime(2026, 1, 1, 8, 0, 0)
    end = start.date() + timedelta(days=MAX_OCCURRENCES + 30)
    try:
        expand_datetimes(
            start,
            RecurrenceParams(frequency="daily", interval=1, end_date=end),
        )
        assert False, "expected ValueError"
    except ValueError as e:
        assert str(MAX_OCCURRENCES) in str(e)


def test_create_event_series_daily(client, db_session):
    ex = _seed_exec(db_session)
    payload = {
        "title": "Standup",
        "startTime": "2026-03-01T09:00:00",
        "endTime": "2026-03-01T09:30:00",
        "executiveId": ex.id,
        "recurrence": {"frequency": "daily", "interval": 1, "count": 4},
    }
    r = client.post("/events/series", json=payload)
    assert r.status_code == 201, r.text
    rows = r.json()
    assert len(rows) == 4
    assert len({row["recurrenceId"] for row in rows}) == 1
    assert rows[0]["title"] == "Standup"
    assert rows[0]["startTime"].startswith("2026-03-01T09:00")
    assert rows[3]["startTime"].startswith("2026-03-04T09:00")


def test_create_event_series_six_months_weekly(client, db_session):
    ex = _seed_exec(db_session)
    payload = {
        "title": "Reunião",
        "startTime": "2026-01-05T14:00:00",  # Monday
        "endTime": "2026-01-05T15:00:00",
        "executiveId": ex.id,
        "recurrence": {
            "frequency": "weekly",
            "interval": 1,
            "daysOfWeek": [1],
            "endDate": "2026-07-05",
        },
    }
    r = client.post("/events/series", json=payload)
    assert r.status_code == 201, r.text
    rows = r.json()
    assert len(rows) > 20
    assert len(rows) <= MAX_OCCURRENCES
    assert all(row["recurrenceId"] == rows[0]["recurrenceId"] for row in rows)


def test_replace_event_series(client, db_session):
    ex = _seed_exec(db_session)
    create = client.post(
        "/events/series",
        json={
            "title": "Old",
            "startTime": "2026-02-01T10:00:00",
            "endTime": "2026-02-01T11:00:00",
            "executiveId": ex.id,
            "recurrence": {"frequency": "daily", "interval": 1, "count": 3},
        },
    )
    assert create.status_code == 201, create.text
    rid = create.json()[0]["recurrenceId"]

    replace = client.put(
        f"/events/series/{rid}",
        json={
            "title": "New",
            "startTime": "2026-02-10T10:00:00",
            "endTime": "2026-02-10T11:00:00",
            "executiveId": ex.id,
            "recurrence": {"frequency": "daily", "interval": 1, "count": 2},
        },
    )
    assert replace.status_code == 200, replace.text
    rows = replace.json()
    assert len(rows) == 2
    assert all(row["title"] == "New" for row in rows)

    listed = client.get(f"/events/?executive_id={ex.id}")
    assert listed.status_code == 200
    assert len(listed.json()) == 2


def test_bulk_endpoint_removed(client, db_session):
    ex = _seed_exec(db_session)
    r = client.post(
        "/events/bulk",
        json=[
            {
                "title": "X",
                "startTime": "2026-01-01T10:00:00",
                "endTime": "2026-01-01T11:00:00",
                "executiveId": ex.id,
            }
        ],
    )
    assert r.status_code in (404, 405, 422)
