## ADDED Requirements

### Requirement: Public Tenant Registration
The system SHALL provide a public endpoint to register a new `LegalOrganization` and its first administrative user.

#### Scenario: Successful registration
- **WHEN** a user submits valid organization details (CNPJ, address) and admin details (name, email)
- **THEN** the system creates a `LegalOrganization` and a user with the role `admin_legal_organization`
- **THEN** the system sends an invitation email to the admin user to set their password

#### Scenario: Invalid CNPJ
- **WHEN** a user submits an invalid CNPJ
- **THEN** the system rejects the request with a validation error in pt-BR

#### Scenario: Incomplete Address
- **WHEN** a user submits an address missing required fields (e.g., neighborhood or city)
- **THEN** the system rejects the request with a validation error

### Requirement: Address Normalization
The system SHALL normalize address fields and handle optional fields correctly.

#### Scenario: Optional complement
- **WHEN** a user submits the registration form with an empty complement
- **THEN** the frontend sends `null` for the `legalComplement` field
- **THEN** the backend stores `null` in the database
