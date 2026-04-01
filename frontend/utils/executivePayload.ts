import type { Executive } from '../types';

/** Alinha com o payload enviado pelo cadastro de executivo (Executiva Cloud). */
export function normalizeExecutivePayload(executive: Partial<Executive>): Record<string, unknown> {
  const { id: _omitId, ...rest } = executive;
  void _omitId;
  const cleanText = (value?: string) => {
    if (value == null) return undefined;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  };

  return {
    ...rest,
    fullName: cleanText(rest.fullName),
    workEmail: cleanText(rest.workEmail),
    cpf: cleanText(rest.cpf),
    rg: cleanText(rest.rg),
    rgIssuer: cleanText(rest.rgIssuer),
    rgIssueDate: cleanText(rest.rgIssueDate),
    birthDate: cleanText(rest.birthDate),
    nationality: cleanText(rest.nationality),
    placeOfBirth: cleanText(rest.placeOfBirth),
    motherName: cleanText(rest.motherName),
    fatherName: cleanText(rest.fatherName),
    civilStatus: cleanText(rest.civilStatus),
    workPhone: cleanText(rest.workPhone),
    extension: cleanText(rest.extension),
    personalEmail: cleanText(rest.personalEmail),
    personalPhone: cleanText(rest.personalPhone),
    street: cleanText(rest.street),
    linkedinProfileUrl: cleanText(rest.linkedinProfileUrl),
    jobTitle: cleanText(rest.jobTitle),
    costCenter: cleanText(rest.costCenter),
    employeeId: cleanText(rest.employeeId),
    hireDate: cleanText(rest.hireDate),
    workLocation: cleanText(rest.workLocation),
    photoUrl: cleanText(rest.photoUrl),
    bio: cleanText(rest.bio),
    education: cleanText(rest.education),
    languages: cleanText(rest.languages),
    emergencyContactName: cleanText(rest.emergencyContactName),
    emergencyContactPhone: cleanText(rest.emergencyContactPhone),
    emergencyContactRelation: cleanText(rest.emergencyContactRelation),
    dependentsInfo: cleanText(rest.dependentsInfo),
    bankInfo: cleanText(rest.bankInfo),
    compensationInfo: cleanText(rest.compensationInfo),
    systemAccessLevels: cleanText(rest.systemAccessLevels),
    organizationId: cleanText(rest.organizationId),
    departmentId: cleanText(rest.departmentId),
    reportsToExecutiveId: cleanText(rest.reportsToExecutiveId),
  };
}
