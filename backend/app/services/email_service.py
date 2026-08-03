import html
import os
import smtplib
from email.message import EmailMessage


def _clean_env_secret(raw: str) -> str:
    """Strip whitespace, UTF-8 BOM, and optional surrounding quotes from .env values."""
    s = raw.strip().lstrip("\ufeff")
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "\"'":
        s = s[1:-1].strip()
    return s


def build_set_password_link(raw_token: str, frontend_base: str) -> str:
    base = frontend_base.rstrip("/")
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


def _send_smtp_text(to_email: str, subject: str, body: str, html_body: str | None = None) -> None:
    host, port, user, password, from_addr = _smtp_settings()

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.set_content(body)
    if html_body:
        msg.add_alternative(html_body, subtype="html")

    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(msg)


def _send_email_text(to_email: str, subject: str, body: str, html_body: str | None = None) -> None:
    _send_smtp_text(to_email, subject, body, html_body=html_body)


def _invite_email_plain(full_name: str, set_password_link: str) -> str:
    return (
        f"Olá, {full_name},\n\n"
        "Seja bem-vindo(a) ao Executiva Cloud, plataforma da HMR.\n\n"
        "Seu acesso foi preparado. Para começar, defina sua senha pelo link abaixo:\n\n"
        f"{set_password_link}\n\n"
        "Se você não solicitou este acesso, ignore este e-mail.\n\n"
        "Atenciosamente,\n"
        "Equipe HMR · Executiva Cloud\n"
    )


def _invite_email_html(full_name: str, set_password_link: str) -> str:
    safe_name = html.escape(full_name)
    safe_link = html.escape(set_password_link, quote=True)
    return f"""\
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bem-vindo ao Executiva Cloud</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr>
            <td style="background-color:#1e293b;padding:28px 32px;">
              <p style="margin:0;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#cbd5e1;font-weight:bold;">HMR</p>
              <h1 style="margin:8px 0 0;font-size:22px;line-height:1.3;color:#ffffff;font-weight:bold;">Executiva Cloud</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:16px;line-height:1.5;">Olá, <strong>{safe_name}</strong>,</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">
                Seja bem-vindo(a) ao <strong>Executiva Cloud</strong>, a plataforma da <strong>HMR</strong> para gestão executiva.
              </p>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:#334155;">
                Seu acesso foi preparado. Clique no botão abaixo para criar sua senha e entrar na plataforma.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 28px;">
                <tr>
                  <td style="border-radius:8px;background-color:#0f172a;">
                    <a href="{safe_link}" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">
                      Criar minha senha
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748b;">
                Se o botão não funcionar, copie e cole este link no navegador:
              </p>
              <p style="margin:0 0 28px;font-size:13px;line-height:1.5;word-break:break-all;">
                <a href="{safe_link}" style="color:#334155;">{safe_link}</a>
              </p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#64748b;">
                Se você não solicitou este acesso, ignore este e-mail.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">
                Equipe HMR · Executiva Cloud
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def send_invite_email(to_email: str, full_name: str, set_password_link: str) -> None:
    subject = "Bem-vindo ao Executiva Cloud | HMR — defina sua senha"
    body = _invite_email_plain(full_name, set_password_link)
    html_body = _invite_email_html(full_name, set_password_link)
    _send_email_text(to_email, subject, body, html_body=html_body)


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
