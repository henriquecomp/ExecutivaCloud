## Why

The Executiva Cloud platform requires a robust and secure way to register and manage organizations (tenants). This change formalizes the specifications for the Organization Registration flow, ensuring that both frontend and backend contracts are clearly documented, including the distinction between `LegalOrganization` (the root tenant) and `Organization` (the company/branch level), as well as the creation of the initial administrative user.

## What Changes

- Document the existing `LegalOrganization` registration flow (public endpoint).
- Document the `Organization` (Company) creation flow.
- Formalize the payload structures, including address validation (CEP, CNPJ, UF) and optional fields (e.g., complement).
- Formalize the creation of the `admin_legal_organization` user during the root tenant registration.
- Ensure all frontend and backend contracts adhere to the project's standards (camelCase JSON, pt-BR error messages, centralized services).

## Capabilities

### New Capabilities
- `legal-organization-registration`: The public flow for creating a new root tenant (`LegalOrganization`) and its first administrator user.
- `organization-management`: The internal flow for managing sub-organizations (`Organization`/Company) within a `LegalOrganization`.

### Modified Capabilities

## Impact

- **Frontend**: `RegisterOrganizationView`, `authService`, `organizationService`, `legalOrganizationService`.
- **Backend**: `auth` router, `organization` router, `legal_organization` router, and their respective schemas and services.
- **Database**: `legal_organizations` and `organizations` tables.
