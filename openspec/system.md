# Executiva Cloud - System Constitution for AIs

This document serves as the strict constitution and system prompt for all AI assistants working on the Executiva Cloud project. It defines the architectural baseline, design patterns, and strict rules that must be followed.

## 1. Strict Rules (Regras Estritas)

You MUST adhere to the following rules at all times:
1. **NUNCA reescreva ou remova funções existentes, a menos que explicitamente solicitado.** (NEVER rewrite or remove existing functions unless explicitly requested).
2. **Siga o padrão existente para rotas Python e o padrão existente para componentes React.** (Follow the existing pattern for Python routes and the existing pattern for React components).
3. **Preserve os testes e as validações de tipos atuais.** (Preserve current tests and type validations).
4. **Sempre escreva as specs (design.md, proposal.md e tasks.md) em portugues do brasil**
4. **Toda a documentação do software deve ser em portugues do brasil**

## 2. Tech Stack & Styling

- **Frontend:** React 19, TypeScript, Vite, Axios.
- **Styling:** **Tailwind CSS**. Utility classes are used directly in the `className` attribute. Do not introduce new CSS-in-JS libraries (like Styled Components) or custom CSS files unless strictly necessary.
- **Backend:** FastAPI, SQLAlchemy, Alembic, Pydantic.
- **Database:** SQLite.

## 3. Folder Structure

### Frontend (`frontend/`)
- `components/`: React components. Views are suffixed with `*View.tsx` (e.g., `OrganizationsView.tsx`).
- `components/ui/`: Reusable, atomized UI components (e.g., `AppButton.tsx`, `AppInput.tsx`, `DataTable.tsx`). Always reuse these before creating new ones.
- `services/`: API communication layer. One `*Service.ts` file per domain (e.g., `organizationService.ts`).
- `utils/`: Helper functions (e.g., `apiError.ts`, `brValidators.ts`).
- `types.ts`: Centralized TypeScript interfaces representing domain models.

### Backend (`backend/app/`)
- `routers/`: FastAPI endpoints. Grouped by domain (e.g., `organization.py`).
- `services/`: Business logic layer. Receives DB sessions and handles core rules.
- `repositories/`: Database access layer (SQLAlchemy queries).
- `schemas/`: Pydantic models for request/response validation.
- `models/`: SQLAlchemy ORM models.
- `core/`: Core configurations, security, and validators.

## 4. Design Patterns & Architecture

### Backend Pattern (FastAPI)
The backend strictly follows a layered architecture:
**Router → Service → Repository → Model**
- **Routers** handle HTTP requests, inject dependencies (`Depends`), and return Pydantic schemas.
- **Services** contain business logic and call repositories.
- **Repositories** contain all SQLAlchemy queries.
- **Schemas** (Pydantic) use `Field(alias="camelCase")` and `ConfigDict(populate_by_name=True, from_attributes=True)` to ensure the API contract matches the frontend's expectations.

### Frontend Pattern (React)
The frontend strictly separates UI from data fetching:
**View Component → TS Service → Axios (`api.ts`)**
- **Views** consume services and types. They NEVER import `axios` or `api` directly.
- **Services** import `api` from `./api.ts`, contain a private `map*` function to normalize API responses (e.g., converting IDs to strings), and export CRUD methods.

## 5. Naming Conventions

- **Frontend Variables & JSON Payloads:** `camelCase` (e.g., `legalOrganizationId`).
- **Frontend Components:** `PascalCase` (e.g., `RegisterOrganizationView`).
- **Backend Variables & Functions:** `snake_case` (e.g., `legal_organization_id`).
- **Backend Query Parameters:** `snake_case` (e.g., `?executive_id=1`).
- **Backend Models & Schemas:** `PascalCase` (e.g., `OrganizationCreate`).

## 6. Error Handling

- **Backend:** Raise `HTTPException`. The `detail` string MUST be in **Brazilian Portuguese (pt-BR)** as it is exposed to the end user.
- **Frontend:** Catch errors and process them using `getApiErrorMessage(err, 'fallback')` from `frontend/utils/apiError.ts`. Display errors in the UI using the `FormDangerAlert` component.

## 7. Validations & Types

- **Backend:** Use custom Pydantic validators from `app.core.br_validators` (e.g., `RequiredCnpj`, `RequiredCep`, `RequiredUf`) for Brazilian data formats.
- **Frontend:** Use validation functions from `frontend/utils/brValidators.ts` (e.g., `validateCNPJ`, `validateCEP`) before submitting forms.
- **Type Safety:** Ensure that any modification to a backend Pydantic schema is immediately mirrored in the frontend `types.ts` and the corresponding `map*` function in the TS service.
