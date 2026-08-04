# Verificação CAPTCHA no cadastro público

## Purpose

Validação server-side de CAPTCHA (Cloudflare Turnstile) no endpoint público de cadastro de organização jurídica.

## Requirements

### Requirement: Verificação server-side de CAPTCHA
O backend DEVE validar o `captchaToken` do cadastro público contra o provedor Cloudflare Turnstile (ou configurado via variáveis de ambiente) antes de qualquer lógica de criação de tenant.

#### Scenario: Verificação bem-sucedida
- **WHEN** o backend recebe `captchaToken` aceito pelo endpoint `siteverify` do Turnstile
- **THEN** a validação de CAPTCHA é considerada aprovada

#### Scenario: Chave secreta ausente em produção
- **WHEN** `TURNSTILE_SECRET_KEY` não está configurada e o ambiente exige CAPTCHA
- **THEN** o cadastro público falha de forma segura (sem criar tenant)
