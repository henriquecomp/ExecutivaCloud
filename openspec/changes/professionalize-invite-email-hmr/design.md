## Context

Hoje `send_invite_email` em `backend/app/services/email_service.py` envia apenas `text/plain` via SMTP, com texto curto e genérico. O mesmo helper é usado no cadastro público de organização e nos convites internos. O produto na UI é “Executiva Cloud”; o usuário pediu que o e-mail tenha a cara profissional da **HMR**.

## Goals / Non-Goals

**Goals:**

- Conteúdo institucional em pt-BR, saudação pelo nome, CTA claro para criar senha e rodapé com aviso de segurança.
- Branding HMR + Executiva Cloud (assunto, cabeçalho e assinatura).
- Envio multipart: `text/html` + alternativa `text/plain` (compatibilidade com clientes que não renderizam HTML).
- Manter a assinatura de `send_invite_email(to_email, full_name, set_password_link)` para não espalhar mudanças nos callers.

**Non-Goals:**

- Redesign do e-mail de redefinição de senha ou do report de problema (podem seguir o padrão depois).
- Hospedar logo em CDN ou anexar imagem inline nesta primeira entrega (HTML tipográfico + cores do produto; logo opcional em iteração futura).
- Alterar geração de token, validade do convite ou URL do fluxo `set-password`.
- Traduzir para outros idiomas.

## Decisions

1. **HTML + texto puro no mesmo envio**  
   Estender o helper SMTP para aceitar corpo HTML opcional (`set_content` + `add_alternative(..., subtype="html")`), sem quebrar os e-mails só-texto existentes.

2. **Identidade visual alinhada ao app**  
   Layout simples e responsivo (largura ~600px): fundo slate claro, faixa/cabeçalho indigo, botão CTA indigo, tipografia segura para e-mail (system / Arial). Textos: “HMR” como marca institucional e “Executiva Cloud” como produto.

3. **Copy sugerida (pt-BR)**  
   - Assunto: `Bem-vindo ao Executiva Cloud | HMR — defina sua senha`  
   - Corpo: boas-vindas pelo nome; contexto de acesso à plataforma; botão “Criar minha senha”; link textual de fallback; validade implícita (“use o botão abaixo”); rodapé “Se você não solicitou este acesso, ignore este e-mail.” e assinatura “Equipe HMR · Executiva Cloud”.

4. **Um template, todos os convites**  
   Cadastro pela tela de login e convites internos compartilham o mesmo template profissional — o primeiro e-mail do usuário fica consistente.

## Risks / Trade-offs

- **[Risk]** Clientes de e-mail bloqueiam HTML ou botões → **Mitigation** alternativa text/plain com o mesmo link.
- **[Risk]** Copy/cores da HMR oficiais diferem do que propomos → **Mitigation** textos e cores ficam centralizados em `email_service.py` (ou helper de template) para ajuste rápido; validar com o usuário na implementação se houver kit de marca.
- **[Trade-off]** Sem logo embutido na v1; presença de marca via tipografia e cores.
