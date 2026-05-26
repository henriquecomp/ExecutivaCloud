import type { SystemRole, User } from '../types';

export function isLegalOrgAdmin(user: User): boolean {
  return user.systemRole === 'admin_legal_organization';
}

export function isCompanyAdmin(user: User): boolean {
  return user.systemRole === 'admin_company';
}

export function isMaster(user: User): boolean {
  return user.systemRole === 'master';
}

export function isTenantAdmin(user: User): boolean {
  return isLegalOrgAdmin(user) || isCompanyAdmin(user);
}

/** @deprecated Prefer isLegalOrgAdmin / isCompanyAdmin com systemRole */
export function isAdminForLegalOrgLegacy(user: User): boolean {
  return user.role === 'admin' && isLegalOrgAdmin(user);
}

export function isOrgAdminLegacy(user: User): boolean {
  return user.role === 'admin' && isCompanyAdmin(user);
}
