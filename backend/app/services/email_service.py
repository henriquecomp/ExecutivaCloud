import os
import smtplib
from email.message import EmailMessage


def _frontend_base_url() -> str:
    return os.getenv("FRONTEND_BASE_URL", "http://localhost:3000").rstrip("/")


def build_set_password_link(raw_token: str) -> str:
    base = _frontend_base_url()
    return f"{base}/?flow=set-password&token={raw_token}"


def send_invite_email(to_email: str, full_name: str, set_password_link: str) -> None:
    subject = "Executiva Cloud — defina sua senha"
    body = (
        f"Olá, {full_name}.\n\n"
        "Você foi convidado para acessar o Executiva Cloud.\n"
        "Clique no link abaixo para criar sua senha:\n\n"
        f"{set_password_link}\n\n"
        "Se você não esperava este e-mail, ignore-o.\n"
    )
    host = os.getenv("SMTP_HOST", "").strip()
    if not host:
        print(f"[email dev] To: {to_email}\nSubject: {subject}\n{body}")
        return

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
