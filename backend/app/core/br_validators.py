"""Validadores e limites para campos brasileiros e texto livre."""

import re
from typing import Annotated, Optional

from pydantic import BeforeValidator, Field

FREE_TEXT_MAX = 100
EMAIL_MAX = 254
CNPJ_DIGITS = 14
CPF_DIGITS = 11
CEP_DIGITS = 8
UF_LEN = 2
PHONE_MAX = 20
URL_MAX = 255


def normalize_digits(value: str | None) -> str:
    if value is None:
        return ""
    return re.sub(r"\D", "", str(value))


def normalize_cnpj_raw(value: str | None) -> str:
    if value is None:
        return ""
    return re.sub(r"[^A-Za-z0-9]", "", str(value)).upper()


def _cnpj_char_value(char: str) -> int:
    return ord(char) - 48


def _cnpj_check_digits(base12: str) -> str:
    w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    s1 = sum(_cnpj_char_value(base12[i]) * w1[i] for i in range(12))
    r1 = s1 % 11
    d1 = 0 if r1 < 2 else 11 - r1
    w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    base13 = base12 + str(d1)
    s2 = sum(_cnpj_char_value(base13[i]) * w2[i] for i in range(13))
    r2 = s2 % 11
    d2 = 0 if r2 < 2 else 11 - r2
    return f"{d1}{d2}"


def validate_two_word_name(value: str | None, field_label: str = "Nome") -> str:
    if value is None or not str(value).strip():
        raise ValueError(f"{field_label} é obrigatório.")
    parts = [p for p in str(value).strip().split() if p]
    if len(parts) < 2:
        raise ValueError(f"{field_label} deve conter pelo menos dois nomes.")
    return str(value).strip()


def validate_cnpj(value: str | None) -> str:
    if value is None or not str(value).strip():
        raise ValueError("CNPJ é obrigatório.")
    normalized = normalize_cnpj_raw(value)
    if not re.match(r"^[A-Z0-9]{12}\d{2}$", normalized):
        raise ValueError(
            "CNPJ deve ter 14 caracteres (12 alfanuméricos e 2 dígitos verificadores)."
        )
    if len(set(normalized)) == 1:
        raise ValueError("CNPJ inválido.")
    base12, dv = normalized[:12], normalized[12:]
    if _cnpj_check_digits(base12) != dv:
        raise ValueError("CNPJ inválido.")
    return normalized


def validate_cnpj_optional(value: str | None) -> str | None:
    if value is None or not str(value).strip():
        return None
    return validate_cnpj(value)


def validate_cpf(value: str | None) -> str:
    if value is None or not str(value).strip():
        raise ValueError("CPF é obrigatório.")
    digits = normalize_digits(value)
    if len(digits) != CPF_DIGITS:
        raise ValueError("CPF deve conter 11 dígitos.")
    if digits == digits[0] * CPF_DIGITS:
        raise ValueError("CPF inválido.")
    for length in (9, 10):
        weights = list(range(length + 1, 1, -1))
        total = sum(int(digits[i]) * weights[i] for i in range(length))
        digit = 0 if total % 11 < 2 else 11 - (total % 11)
        if int(digits[length]) != digit:
            raise ValueError("CPF inválido.")
    return digits


def validate_cpf_optional(value: str | None) -> str | None:
    if value is None or not str(value).strip():
        return None
    return validate_cpf(value)


def validate_cep(value: str | None) -> str:
    if value is None or not str(value).strip():
        raise ValueError("CEP é obrigatório.")
    digits = normalize_digits(value)
    if len(digits) != CEP_DIGITS:
        raise ValueError("CEP deve conter 8 dígitos.")
    return digits


def validate_cep_optional(value: str | None) -> str | None:
    if value is None or not str(value).strip():
        return None
    return validate_cep(value)


def validate_uf(value: str | None) -> str:
    if value is None or not str(value).strip():
        raise ValueError("UF é obrigatória.")
    uf = str(value).strip().upper()
    if len(uf) != UF_LEN or not uf.isalpha():
        raise ValueError("UF deve ter 2 letras.")
    return uf


def validate_uf_optional(value: str | None) -> str | None:
    if value is None or not str(value).strip():
        return None
    return validate_uf(value)


def _strip_optional_str(v: str | None) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None


def _normalize_complement(v: str | None) -> str | None:
    """Aceita null para limpar complemento; string vazia vira null."""
    if v is None:
        return None
    s = str(v).strip()
    if not s:
        return None
    if len(s) > FREE_TEXT_MAX:
        raise ValueError(f"Complemento não pode exceder {FREE_TEXT_MAX} caracteres.")
    return s


OptionalComplement = Annotated[Optional[str], BeforeValidator(_normalize_complement)]

RequiredCnpj = Annotated[str, BeforeValidator(validate_cnpj)]
OptionalCnpj = Annotated[Optional[str], BeforeValidator(validate_cnpj_optional)]
RequiredCep = Annotated[str, BeforeValidator(validate_cep)]
OptionalCep = Annotated[Optional[str], BeforeValidator(validate_cep_optional)]
RequiredUf = Annotated[str, BeforeValidator(validate_uf)]
OptionalUf = Annotated[Optional[str], BeforeValidator(validate_uf_optional)]
OptionalCpf = Annotated[Optional[str], BeforeValidator(validate_cpf_optional)]

FieldStr100 = Field(..., min_length=1, max_length=FREE_TEXT_MAX)
OptionalFieldStr100 = Field(None, max_length=FREE_TEXT_MAX)
