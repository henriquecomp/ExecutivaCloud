## Context

The Executiva Cloud platform operates as a multi-tenant system. The root tenant is the `LegalOrganization` (Organização Jurídica), which represents the main entity paying for the service. Inside a `LegalOrganization`, there can be multiple sub-organizations or branches, represented by the `Organization` entity.

Currently, the registration of a `LegalOrganization` is a public endpoint (`/auth/register-organization`) that also creates the first administrative user (`admin_legal_organization`). The `Organization` management is an internal, authenticated process.

This design document formalizes the existing architecture and data flow for these processes to serve as a baseline specification.

## Goals / Non-Goals

**Goals:**
- Document the data models and schemas for `LegalOrganization` and `Organization`.
- Document the frontend service layer (`authService`, `legalOrganizationService`, `organizationService`).
- Formalize the validation rules (CNPJ, CEP, UF) and payload normalization logic.

**Non-Goals:**
- Introduce new features or change existing behaviors.
- Document user invitation flows beyond the initial `admin_legal_organization` creation.

## Decisions

1. **Separation of LegalOrganization and Organization:**
   - *Rationale*: A single legal entity might have multiple branches or operational units. Separating them allows for more granular access control and data segregation while keeping billing centralized at the `LegalOrganization` level.
   
2. **Public Registration Endpoint (`/auth/register-organization`):**
   - *Rationale*: Allows self-service onboarding for new clients. It must create both the tenant and the first admin user atomically to ensure the tenant is immediately usable.

3. **Address Validation and Normalization:**
   - *Rationale*: Uses custom Pydantic validators (`RequiredCnpj`, `RequiredCep`, `RequiredUf`) and frontend masks to ensure data consistency. Optional fields like `complement` are sent as `null` when empty, rather than omitted, to allow clearing existing values.

4. **Frontend Service Layer Pattern:**
   - *Rationale*: All HTTP calls go through `api.ts`. Domain-specific services (e.g., `organizationService.ts`) map the API responses to TypeScript interfaces defined in `types.ts`, normalizing IDs to strings.

## Risks / Trade-offs

- **Risk: Incomplete Address Data** → *Mitigation*: The backend enforces full address validation (street, number, neighborhood, city, state, zipCode) on creation and when updating any address field.
- **Risk: Orphaned Tenants** → *Mitigation*: The registration endpoint creates the `LegalOrganization` and the `admin_legal_organization` user in a single transaction. If the user creation fails, the tenant creation is rolled back.
