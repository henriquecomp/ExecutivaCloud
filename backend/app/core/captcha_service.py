"""Verificação server-side de Cloudflare Turnstile."""

import logging
import os

import httpx

logger = logging.getLogger(__name__)

TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"
CAPTCHA_VALIDATION_ERROR = "Não foi possível validar a verificação de segurança."


class CaptchaVerificationError(Exception):
    """Token de CAPTCHA ausente, inválido ou não verificado."""


def verify_turnstile_token(token: str, *, remote_ip: str | None = None) -> None:
    secret = os.getenv("TURNSTILE_SECRET_KEY", "").strip()
    if not secret:
        logger.error("TURNSTILE_SECRET_KEY não configurada")
        raise CaptchaVerificationError(CAPTCHA_VALIDATION_ERROR)

    cleaned = (token or "").strip()
    if not cleaned:
        raise CaptchaVerificationError(CAPTCHA_VALIDATION_ERROR)

    payload: dict[str, str] = {"secret": secret, "response": cleaned}
    if remote_ip:
        payload["remoteip"] = remote_ip

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(TURNSTILE_VERIFY_URL, data=payload)
            response.raise_for_status()
            data = response.json()
    except Exception as exc:
        logger.warning("Falha ao verificar Turnstile: %s", exc)
        raise CaptchaVerificationError(CAPTCHA_VALIDATION_ERROR) from exc

    if not data.get("success"):
        logger.info("Turnstile rejeitou token: %s", data.get("error-codes"))
        raise CaptchaVerificationError(CAPTCHA_VALIDATION_ERROR)
