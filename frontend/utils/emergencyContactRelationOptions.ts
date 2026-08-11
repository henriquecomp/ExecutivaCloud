export const EMERGENCY_CONTACT_RELATION_OPTIONS = [
  'Cônjuge',
  'Companheiro(a)',
  'Filho(a)',
  'Enteado(a)',
  'Pai',
  'Mãe',
  'Irmão(ã)',
  'Avô(ó)',
  'Neto(a)',
  'Outro',
] as const;

export type EmergencyContactRelation = (typeof EMERGENCY_CONTACT_RELATION_OPTIONS)[number];

/** Inclui valor legado fora da lista para não perder dado ao editar. */
export function relationSelectOptions(currentValue?: string): string[] {
  const v = (currentValue ?? '').trim();
  if (!v || EMERGENCY_CONTACT_RELATION_OPTIONS.includes(v as EmergencyContactRelation)) {
    return [...EMERGENCY_CONTACT_RELATION_OPTIONS];
  }
  return [...EMERGENCY_CONTACT_RELATION_OPTIONS, v];
}
