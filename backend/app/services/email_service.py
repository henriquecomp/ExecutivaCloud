import os
import smtplib
from email.message import EmailMessage

def _clean_env_secret(raw: str) -> str:
    """Strip whitespace, UTF-8 BOM, and optional surrounding quotes from .env values."""
    s = raw.strip().lstrip("\ufeff")
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "\"'":
        s = s[1:-1].strip()
    return s


def _frontend_base_url() -> str:
    return os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")


def build_set_password_link(raw_token: str) -> str:
    base = _frontend_base_url()
    return f"{base}/?flow=set-password&token={raw_token}"


def send_password_reset_email(to_email: str, full_name: str, set_password_link: str) -> None:
    subject = "Executiva Cloud — redefinição de senha"
    body = (
        f"Olá, {full_name}.\n\n"
        "Foi solicitada a redefinição da sua senha no Executiva Cloud.\n"
        "Clique no link abaixo para escolher uma nova senha:\n\n"
        f"{set_password_link}\n\n"
        "Se você não solicitou, ignore este e-mail. Sua senha atual permanece ativa.\n"
    )
    _send_email_text(to_email, subject, body)


def _smtp_settings() -> tuple[str, int, str, str, str]:
    host = _clean_env_secret(os.getenv("SMTP_HOST", ""))
    user = _clean_env_secret(os.getenv("SMTP_USER", ""))
    password = _clean_env_secret(os.getenv("SMTP_PASSWORD", ""))
    from_addr = _clean_env_secret(
        os.getenv("SMTP_FROM", "") or user or "noreply@localhost"
    )
    port = int(_clean_env_secret(os.getenv("SMTP_PORT", "587")) or "587")

    missing = []
    if not host:
        missing.append("SMTP_HOST")
    if not user:
        missing.append("SMTP_USER")
    if not password:
        missing.append("SMTP_PASSWORD")

    if missing:
        raise RuntimeError(
            "Configuração SMTP incompleta para envio de e-mail. "
            f"Defina: {', '.join(missing)}."
        )
    return host, port, user, password, from_addr


def _send_smtp_text(to_email: str, subject: str, body: str) -> None:
    host, port, user, password, from_addr = _smtp_settings()

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.set_content(body)

    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(msg)


def _send_email_text(to_email: str, subject: str, body: str) -> None:
    _send_smtp_text(to_email, subject, body)


def send_invite_email(to_email: str, full_name: str, set_password_link: str) -> None:
    subject = "Executiva Cloud — defina sua senha"
    body = (
        f"Olá, {full_name}.\n\n"
        "Você foi convidado para acessar o Executiva Cloud.\n"
        "Clique no link abaixo para criar sua senha:\n\n"
        f"{set_password_link}\n\n"
        "Se você não esperava este e-mail, ignore-o.\n"
    )
    _send_email_text(to_email, subject, body)


def _support_target_email() -> str:
    return (
        os.getenv("SUPPORT_REPORT_TO", "").strip()
        or os.getenv("SMTP_FROM", "").strip()
        or os.getenv("SMTP_USER", "").strip()
        or "suporte@localhost"
    )


def send_problem_report_email(
    *,
    context: str,
    category: str,
    reporter_email: str,
    reporter_name: str,
    description: str,
    screen_label: str | None = None,
    page_url: str | None = None,
    user_agent: str | None = None,
) -> None:
    subject_scope = "Login" if context == "login" else (screen_label or "Aplicação")
    subject = f"Executiva Cloud — Report de problema — {subject_scope} — {category}"
    body_lines = [
        f"Categoria: {category}",
        f"Contexto: {context}",
        f"Nome do usuário: {reporter_name or '(não informado)'}",
        f"E-mail de contato: {reporter_email}",
        f"Tela: {screen_label or '-'}",
        f"URL: {page_url or '-'}",
        f"Navegador: {user_agent or '-'}",
        "",
        "Descrição:",
        description.strip(),
    ]
    _send_email_text(_support_target_email(), subject, "\n".join(body_lines))
