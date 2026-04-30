# ExecutivaCloud

Aplicação web para gestão operacional de secretariado executivo, com foco em organização de estruturas corporativas, pessoas, agenda, tarefas, documentos e contatos em ambiente multiempresa.

## Para que a aplicação serve

A `ExecutivaCloud` centraliza o trabalho de secretaria executiva e times administrativos em um único sistema.  
Ela permite:

- cadastrar e organizar grupos empresariais (`Organizações Jurídicas`), empresas e departamentos;
- gerir perfis de executivos e secretárias com vínculo entre eles;
- controlar agenda, contatos, tarefas e documentos por executivo;
- administrar usuários por perfil (`master`, `admin`, `secretary`, `executive`);
- convidar usuários por link seguro para primeiro acesso;
- gerar dados de apoio para relatórios operacionais;
- receber relatórios de problema por e-mail via backend (SMTP/Brevo).

## Stack e arquitetura em uso

- **Frontend:** React 19 + TypeScript + Vite + Axios (`frontend/`)
- **Backend:** FastAPI + SQLAlchemy + Alembic + Uvicorn (`backend/`)
- **Banco:** SQLite (arquivo persistido em volume Docker)
- **Infra local:** Docker Compose com 2 serviços:
  - `web` em `http://localhost:8080`
  - `api` em `http://localhost:8098` (docs em `/docs`)

## Funcionalidades prontas e integradas (front + backend)

As áreas abaixo possuem tela no frontend, serviço HTTP e rota FastAPI ativa:

- **Autenticação e onboarding**
  - login
  - cadastro inicial de organização + admin
  - bootstrap de usuário master
  - convite de usuários e definição de senha
  - completar perfil de executivo/secretária no primeiro acesso
- **Gestão estrutural**
  - organizações jurídicas
  - organizações/empresas
  - departamentos
- **Gestão de pessoas**
  - executivos
  - secretárias
  - usuários e permissões
- **Operação diária por executivo**
  - agenda/eventos + tipos de evento
  - contatos + tipos de contato
  - tarefas
  - documentos + categorias de documentos
- **Apoio e administração**
  - relatórios
  - reportar problema por e-mail

## Rotas FastAPI ativas na aplicação

Carregadas em `backend/app/main.py`:

- `/users/management`
- `/users`
- `/auth`
- `/legal-organizations`
- `/organizations`
- `/departments`
- `/executives`
- `/secretaries`
- `/event-types`
- `/events`
- `/document-categories`
- `/documents`
- `/contact-types`
- `/contacts`
- `/tasks`
- `/reports`
- `/support`

## Como executar

### Docker (recomendado)

```bash
git clone https://github.com/henriquecomp/executivacloud.git
cd executivacloud
docker compose up --build
```

Acessos:

- Frontend: `http://localhost:8080`
- API (Swagger): `http://localhost:8098/docs`

### Variáveis importantes

- `VITE_API_URL`: URL da API acessível pelo navegador
- `CORS_ORIGINS`: origens permitidas no backend
- `FRONTEND_BASE_URL`: base usada em fluxos de convite
- `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME`: envio de e-mail no backend via API Brevo
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`: fallback SMTP opcional
- `SUPPORT_REPORT_TO`: caixa de destino dos relatórios de problema

## Limpeza cirúrgica aplicada

Foram removidos arquivos obsoletos/não utilizados em runtime:

- `backend/app/routers/login.py` (router legado não carregado no `main.py`)
- `backend/app/schemas/login_schema.py` (schema legado sem uso)
- `frontend/context/AuthContext.tsx` (contexto antigo sem importações)
- `frontend/components/AppointmentsView.tsx` (componente órfão sem uso na navegação atual)
- `backend/README.md` (documentação genérica/desatualizada)
- `backend/app/core/config.py` (arquivo vazio e sem uso)
- tipo `Appointment` removido de `frontend/types.ts` por não haver consumo no app

## Observações de escopo atual

- O módulo principal em produção está centrado em agenda, contatos, tarefas, documentos, gestão de usuários e estrutura organizacional.
- A base do frontend possui elementos de finanças, mas o eixo totalmente integrado e persistido hoje é o conjunto descrito na seção **Funcionalidades prontas e integradas**.
