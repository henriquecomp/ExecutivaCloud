# Executiva Cloud Project Context

**Product language:** User-facing strings in the app and API error messages (`detail`) remain **Brazilian Portuguese (pt-BR)**. These rules and developer documentation are in **English**.

## Stack

- **Frontend:** React 19 + TypeScript + Vite + Axios (`frontend/`)
- **Backend:** FastAPI + SQLAlchemy + Alembic + Uvicorn (`backend/`)
- **Database:** SQLite (persisted in Docker volume)
- **Infra:** Docker Compose — `web` on `:8080`, `api` on `:8098` (OpenAPI at `/docs`)

## Delivery priorities (in order)

1. **No frontend/backend regressions.** Any API contract change must go through the full stack: Pydantic schema → router → TS service → mapper → `types.ts` → affected views. Never ship half of this flow.
2. **Reuse before creating.** Search existing components and utilities before writing new code. Only add a new file when no reusable equivalent exists.
3. **Match repository conventions.** New code should read as if written by the same author — naming, imports, formatting, and abstractions consistent with the codebase.

## API contract rules

- Request/response JSON uses **camelCase** (Pydantic aliases). Query parameters use **snake_case**.
- URL path IDs: use `Number(id)` in TS services when the backend expects numeric path segments.
- Pydantic schemas use `Field(alias="camelCase")` and `ConfigDict(populate_by_name=True, from_attributes=True)`.
- Error `detail` strings exposed to users: **pt-BR** (project convention).

## Frontend service rules

- All HTTP traffic goes through `frontend/services/api.ts` (axios). Do not use `fetch()` or instantiate axios elsewhere.
- One `*Service.ts` file per domain under `frontend/services/`. Pattern: import `api`, private `map*` function (normalize IDs to `string`), export an object with CRUD-style methods.
- Views consume only `*Service` modules and types from `frontend/types.ts` — never import `api` directly in a view.
- When adding fields: update the mapper and `types.ts` in the same change.

## Component atomization and reuse

Before adding a new file under `frontend/components/`, check for an existing building block:

| Need | Existing component |
|---|---|
| Button | `ui/AppButton.tsx` (primary, secondary, ghost) |
| Text field | `ui/AppInput.tsx` |
| Select | `ui/AppSelect.tsx` |
| Textarea | `ui/AppTextarea.tsx` |
| Label | `ui/AppLabel.tsx` (supports `optional`) |
| Search | `ui/AppSearchInput.tsx` |
| Table | `ui/DataTable.tsx` |
| Page header | `ui/PageHeader.tsx` |
| Filter bar | `ui/ToolbarPanel.tsx` |
| Form actions row | `ui/FormActions.tsx` |
| Error alert | `ui/FormDangerAlert.tsx` |
| Modal | `Modal.tsx` (use `panelClassName` for width) |
| Confirmation | `ConfirmationModal.tsx` |
| Pagination | `Pagination.tsx` |
| Layout switcher | `ViewSwitcher.tsx` (card/list/table) |
| Checkbox/Radio | `ui/controlTokens.ts` (`checkboxClass`, `radioClass`) |
| Icons | `Icons.tsx` (use `createIcon` or `IconWrapper` for new icons) |
| Edit/delete styles | `ui/typeManagementStyles.ts` |
| Color swatch | `ui/TypeColorSwatch.tsx` |
| Color field | `ui/TypeColorFormField.tsx` |

Only add a new component if nothing fits **or** the extraction is clearly reusable in **≥2** places; otherwise compose inline in the view with the components above.

## Error handling

- Use `getApiErrorMessage(err, 'fallback')` from `frontend/utils/apiError.ts` for API errors.
- Show form errors with `FormDangerAlert`.
- Reuse payload helpers when they exist (e.g. `normalizeExecutivePayload`).

## Delivery checklist

Before considering work complete:

- List touched files; no orphaned HTTP calls or stale types.
- If backend changed: Alembic migration included when the DB schema changes.
- If endpoints were added: router registered in `backend/app/main.py`.
- TS service `map*` updated for all new fields.
- `types.ts` interfaces match the current Pydantic schema.
- Existing UI components reused where applicable.
- `VITE_API_URL` / `CORS_ORIGINS` updated if host/port changed.
- New icons added via `createIcon` in `Icons.tsx`; no duplicated SVGs.
- Icon-only buttons have `aria-label` and `type="button"`.

## Overall architecture

```
Backend (FastAPI)                          Frontend (React 19 + Vite)
─────────────────                          ──────────────────────────
model (SQLAlchemy)                         types.ts  (domain interfaces)
  ↕                                            ↑
schema (Pydantic, camelCase aliases)       services/*Service.ts  (map* + axios)
  ↕                                            ↑
repository → service → router             components/*View.tsx / ui/*
```

- Request/response JSON between frontend and backend uses **camelCase** (Pydantic `alias` with `populate_by_name=True`).
- API query parameters use **snake_case** (`executive_id`, `skip`, `limit`). Rebuild queries in TS services with `URLSearchParams`.
- Path segment IDs: backend often expects `int`; in TS services convert with `Number(id)`.

## Backend schemas and routers

- Pydantic schemas in `backend/app/schemas/<name>_schema.py` with `Field(alias="camelCase")` and `ConfigDict(populate_by_name=True, from_attributes=True)`.
- Routers in `backend/app/routers/<name>.py` with `APIRouter(prefix="/<resource>", tags=[...])`.
- Services in `backend/app/services/<name>_service.py` receive `db: Session` via `Depends(get_db)`.
- Repositories in `backend/app/repositories/<name>_repository.py`.
- Error `detail` strings for users: **pt-BR**, aligned with `getApiErrorMessage` on the frontend (`frontend/utils/apiError.ts`).

## Payload normalization

- When a helper already exists (e.g. `normalizeExecutivePayload` in `frontend/utils/executivePayload.ts`), reuse it instead of duplicating cleanup logic.
- Trim text fields; send empty strings as `null` to the API when that matches existing behavior.
- **Optional fields on PATCH/PUT** (e.g. `complement`): send JSON `null` to clear a value. Do not send `undefined` (omitted key) if the intent is to erase the stored value.

## Authentication

- JWT stored in `localStorage` under `accessToken`.
- Request interceptor in `frontend/services/api.ts` attaches `Authorization: Bearer <token>`.
- `authService` in `frontend/services/authService.ts` centralizes login, logout, invite, and profile completion.
- Do not duplicate token persistence outside `authService`.
