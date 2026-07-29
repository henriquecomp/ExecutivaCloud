## ADDED Requirements

### Requirement: Organization Management
The system SHALL allow authenticated users with appropriate permissions to manage `Organization` entities within their `LegalOrganization`.

#### Scenario: Create new organization
- **WHEN** an `admin_legal_organization` submits valid details for a new `Organization`
- **THEN** the system creates the `Organization` linked to the user's `LegalOrganization`

#### Scenario: Update organization address
- **WHEN** an admin updates the address of an `Organization`
- **THEN** the system MUST validate that all required address fields (CNPJ, street, number, neighborhood, city, state, zipCode) are provided together

#### Scenario: Clear optional complement
- **WHEN** an admin updates an `Organization` and clears the complement field
- **THEN** the frontend sends `null` for the complement
- **THEN** the backend updates the database record to `null`
