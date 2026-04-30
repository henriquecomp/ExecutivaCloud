import os
import smtplib
from email.message import EmailMessage
import httpx


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


def _send_via_brevo_api(to_email: str, subject: str, body: str) -> bool:
    api_key = os.getenv("BREVO_API_KEY", "").strip()
    if not api_key:
        return False

    sender_email = (
        os.getenv("BREVO_SENDER_EMAIL", "").strip()
        or os.getenv("SMTP_FROM", "").strip()
        or os.getenv("SMTP_USER", "").strip()
    )
    sender_name = os.getenv("BREVO_SENDER_NAME", "Executiva Cloud").strip() or "Executiva Cloud"
    if not sender_email:
        raise RuntimeError(
            "BREVO_API_KEY configurada, mas remetente ausente. "
            "Defina BREVO_SENDER_EMAIL (ou SMTP_FROM)."
        )

    payload = {
        "sender": {"email": sender_email, "name": sender_name},
        "to": [{"email": to_email}],
        "subject": subject,
        "textContent": body,
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": api_key,
    }
    response = httpx.post(
        "https://api.brevo.com/v3/smtp/email",
        json=payload,
        headers=headers,
        timeout=30.0,
    )
    response.raise_for_status()
    return True


def _send_smtp_text(to_email: str, subject: str, body: str) -> bool:
    host = os.getenv("SMTP_HOST", "").strip()
    if not host:
        return False

    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "").strip()
    password = os.getenv("SMTP_PASSWORD", "").strip()
    from_addr = os.getenv("SMTP_FROM", user or "noreply@localhost")

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.set_content(body)

    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.starttls()
        if user:
            smtp.login(user, password)
        smtp.send_message(msg)
    return True


def _send_email_text(to_email: str, subject: str, body: str) -> None:
    if _send_via_brevo_api(to_email, subject, body):
        return
    if _send_smtp_text(to_email, subject, body):
        return
    print(f"[email dev] To: {to_email}\nSubject: {subject}\n{body}")


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
        or os.getenv("BREVO_SENDER_EMAIL", "").strip()
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
