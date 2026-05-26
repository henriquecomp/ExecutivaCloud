---
name: executivacloud-tenant-and-address
description: >-
  Checklist for org/company/user changes: tenant hierarchy (systemRole),
  complement on all forms, migrations, and pytest. Use when editing
  organizations, legal organizations, auth registration, or address fields.
---

# Executiva Cloud — tenant and address checklist

## 1. Tenant hierarchy

- [ ] Backend: `validate_user_tenant_scope` for role + IDs
- [ ] `admin_legal_organization` → `organization_id` is NULL
- [ ] Frontend: `User.systemRole` set in `mapApiUserToAppUser`
- [ ] Nav/views use `isLegalOrgAdmin` / `isCompanyAdmin` from `tenantScope.ts`
- [ ] Test: register organization → user role and IDs

## 2. Complement and address

- [ ] All forms listed in rule `executivacloud-address-and-complement.mdc`
- [ ] Shared [`OrganizationCompanyForm.tsx`](frontend/components/OrganizationCompanyForm.tsx) for company modals
- [ ] `buildOrgAddressPayload` / `normalizeComplement` — `null` not `undefined` on update
- [ ] Tests in `test_address_complement.py`

## 3. Migrations

- [ ] New revision only; never remove applied migrations
- [ ] See rule `executivacloud-alembic-migrations.mdc`

## 4. Full stack (contract rule)

Model → schema → service → router → TS service → types → views → pytest
