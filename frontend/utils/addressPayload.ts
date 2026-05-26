/** Normalização de endereço para API (complemento sempre null|string, nunca undefined em updates). */

export function normalizeComplement(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export interface OrgAddressFields {
  cnpj: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement?: string | null;
}

export function buildOrgAddressPayload(fields: OrgAddressFields): OrgAddressFields & { complement: string | null } {
  return {
    cnpj: fields.cnpj,
    street: fields.street.trim(),
    number: fields.number.trim(),
    neighborhood: fields.neighborhood.trim(),
    city: fields.city.trim(),
    state: fields.state.trim().toUpperCase().slice(0, 2),
    zipCode: fields.zipCode,
    complement: normalizeComplement(fields.complement),
  };
}
