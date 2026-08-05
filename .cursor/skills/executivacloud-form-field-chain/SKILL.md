---
name: executivacloud-form-field-chain
description: >-
  Checklist to keep form fields consistent from UI fill through FE validation,
  payload, types, Pydantic, and DB nullability/foreign keys. Use when adding or
  changing form fields, required/optional behavior, profile completion, selects
  with FKs (gestor, departamento, empresa), or when a field looks required but
  must be optional (or the reverse).
---

# Executiva Cloud — form field chain checklist

The way the field is filled on screen (required vs optional, empty value, ID)
MUST match typing and persistence. Copy this checklist and tick every layer.

## 0. Decide the on-screen contract

- [ ] **Required** or **optional**?
- [ ] Empty meaning: omit / `null` / keep previous? (prefer `null` to clear FKs)
- [ ] Value kind: free text, date, enum, or **FK id** (empresa / departamento / gestor)?

## 1. UI (`frontend/components/**`)

- [ ] Label: `*` only if required; `(opcional)` if optional (see `AppLabel` `optional`)
- [ ] No HTML `required` on optional fields
- [ ] Optional selects: empty option like `Nenhum` / `Sem X` — not a fake mandatory “Selecione”
- [ ] `disabled` / `readOnly` only when product locks the field (e.g. empresa no 1º acesso)
- [ ] Same field updated in **all** forms that edit the entity (modal, complete-profile, admin)

## 2. FE validation (`frontend/utils/*Validation.ts` or equivalent)

- [ ] Required fields produce error messages (pt-BR)
- [ ] Optional fields **absent** from the required checks
- [ ] Optional email/format: validate only when non-empty

## 3. Payload (`frontend/utils/*Payload.ts` / service body)

- [ ] Reuse existing normalizers (`normalizeExecutivePayload`, `addressPayload`, …)
- [ ] Optional text: `""` → `null` (or omit only if PATCH semantics allow)
- [ ] Optional FK/ID: `cleanOptionalId` → `null` or `Number(id)` — **never** `""`
- [ ] camelCase keys aligned with Pydantic aliases

## 4. Types + mapper

- [ ] `frontend/types.ts`: optional with `?`; domain IDs as `string`
- [ ] `map*` in `*Service.ts`: `String(id)`, handle `camelCase` and `snake_case`
- [ ] List filters for FK dropdowns match product (e.g. same empresa, active account)

## 5. Backend schema (`backend/app/schemas/`)

- [ ] Required: `Field(...)` / non-Optional
- [ ] Optional: `Optional[T] = Field(None, alias="camelCase")`
- [ ] Optional int FKs: `mode="before"` coerce `""` / `None` → `None`
- [ ] `ConfigDict(populate_by_name=True, from_attributes=True)`

## 6. Model + migration (`models/` + Alembic)

- [ ] Column `nullable=` matches required/optional on screen
- [ ] `ForeignKey(...)` present for relation fields; ON DELETE policy intentional
- [ ] Nullability/FK change → **new** Alembic revision (never rewrite applied ones)
- [ ] See rule `executivacloud-alembic-migrations.mdc`

## 7. Service / router

- [ ] Business rules do not re-require an optional field
- [ ] Error `detail` in **pt-BR** if validation fails
- [ ] Complete-profile / invite paths included if they write the same column

## 8. Tests

- [ ] Schema/unit: optional omitted, `null`, and `""` → `None`
- [ ] API/integration: submit as on screen; DB column matches (`NULL` or value)
- [ ] If required: empty payload → 422 with clear `detail`

## Done when

- [ ] UI contract ≡ FE validation ≡ payload ≡ Pydantic ≡ DB nullability/FK
- [ ] No half-stack change (form without schema, or schema without UI)

## Related

- Rule: `.cursor/rules/executivacloud-form-field-chain.mdc`
- Contract: `.cursor/rules/executivacloud-contract-and-services.mdc`
- Example: optional `reportsToExecutiveId` (Gestor direto) — UI `(opcional)` + `Nenhum`, payload `null`, `Optional[int]`, `nullable=True` FK
