import hashlib
import hmac
import os


def hash_invite_token(raw_token: str) -> str:
    pepper = os.getenv("JWT_SECRET", "altere-esta-chave-em-producao")
    digest = hashlib.sha256(f"{pepper}:{raw_token}".encode("utf-8")).hexdigest()
    return digest


def verify_invite_token(raw_token: str, stored_hash: str) -> bool:
    return hmac.compare_digest(hash_invite_token(raw_token), stored_hash)
