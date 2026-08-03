## 1. Backend — envio multipart

- [x] 1.1 Em `email_service.py`, estender o envio SMTP para aceitar corpo HTML opcional (multipart: text/plain + text/html) sem quebrar e-mails só-texto existentes
- [x] 1.2 Manter assinatura pública de `send_invite_email(to_email, full_name, set_password_link)`

## 2. Backend — template do convite

- [x] 2.1 Reescrever assunto e corpo text/plain do convite com tom institucional HMR + Executiva Cloud
- [x] 2.2 Implementar versão HTML do convite (cabeçalho/marca, saudação, CTA, link de fallback, rodapé de segurança)
- [x] 2.3 Garantir que o link `set_password_link` aparece no HTML e no texto puro

## 3. Verificação

- [x] 3.1 Cadastrar organização (ou disparar convite de teste) e conferir assunto, HTML e fallback no cliente de e-mail
- [x] 3.2 Confirmar que redefinição de senha e report de problema continuam enviando como antes (só texto)
