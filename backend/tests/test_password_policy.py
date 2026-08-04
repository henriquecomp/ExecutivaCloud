"""Testes da política de senha NIST/OWASP e fluxo complete-invite."""

import secrets
from datetime import datetime, timedelta, timezone

import pytest
from pydantic import ValidationError

from app.core.invite_token import hash_invite_token
from app.core.password_policy import MAX_LENGTH, MIN_LENGTH, validate_password
from app.models import user_model as user_models
from app.models.user_invite_token_model import UserInviteToken
from app.schemas.auth_schema import CompleteInviteRequest


def test_validate_password_accepts_valid():
    validate_password("frase-segura-longa")


def test_validate_password_rejects_short():
    with pytest.raises(ValueError, match="pelo menos 8"):
        validate_password("abc123")


def test_validate_password_rejects_long():
    with pytest.raises(ValueError, match="no máximo 64"):
        validate_password("a" * (MAX_LENGTH + 1))


def test_validate_password_rejects_common():
    with pytest.raises(ValueError, match="muito comum"):
        validate_password("password123")


def test_complete_invite_request_validates_password():
    with pytest.raises(ValidationError) as exc:
        CompleteInviteRequest(
            token="a" * 12,
            password="123",
            passwordConfirm="123",
        )
    assert "at least 8" in str(exc.value)

    with pytest.raises(ValidationError) as exc:
        CompleteInviteRequest(
            token="a" * 12,
            password="password123",
            passwordConfirm="password123",
        )
    assert "muito comum" in str(exc.value)

    req = CompleteInviteRequest(
        token="a" * 12,
        password="minha-frase-segura",
        passwordConfirm="minha-frase-segura",
    )
    assert req.password == "minha-frase-segura"


def _seed_invite(db_session, *, email: str = "invite@test.com") -> str:
    raw_token = secrets.token_urlsafe(32)
    user = user_models.Usuario(
        name="Convidado Teste",
        email=email,
        hashed_password="placeholder",
        is_active=True,
        role="admin_company",
    )
    db_session.add(user)
    db_session.flush()
    invite = UserInviteToken(
        user_id=user.id,
        token_hash=hash_invite_token(raw_token),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db_session.add(invite)
    db_session.commit()
    return raw_token


def test_complete_invite_rejects_mismatch(client, db_session):
    token = _seed_invite(db_session)
    r = client.post(
        "/auth/complete-invite",
        json={
            "token": token,
            "password": "senha-valida-longa",
            "passwordConfirm": "outra-senha-valida",
        },
    )
    assert r.status_code == 400
    assert r.json()["detail"] == "As senhas não coincidem."


def test_complete_invite_rejects_common_password(client, db_session):
    token = _seed_invite(db_session, email="invite2@test.com")
    r = client.post(
        "/auth/complete-invite",
        json={
            "token": token,
            "password": "password123",
            "passwordConfirm": "password123",
        },
    )
    assert r.status_code == 422
    assert "muito comum" in str(r.json())


def test_complete_invite_accepts_valid_password(client, db_session):
    token = _seed_invite(db_session, email="invite3@test.com")
    password = "x" * MIN_LENGTH
    r = client.post(
        "/auth/complete-invite",
        json={
            "token": token,
            "password": password,
            "passwordConfirm": password,
        },
    )
    assert r.status_code == 200, r.text
    assert r.json()["accessToken"]
    assert r.json()["user"]["email"] == "invite3@test.com"
