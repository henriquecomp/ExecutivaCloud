import { User, View } from '../../types';
import { isCompanyAdmin, isLegalOrgAdmin } from '../../utils/tenantScope';
import { SidebarNavItem } from './SidebarNavItem';

/** Módulos permitidos para executivo e secretária (sem configurações administrativas). */
const staffOnlyViews: View[] = [
  'dashboard',
  'agenda',
  'tasks',
  'documents',
  'contacts',
  'finances',
];

export function getVisibleNavItems(
  currentUser: User | null,
  allNavItems: SidebarNavItem[],
): SidebarNavItem[] {
  if (!currentUser) return [];

  switch (currentUser.role) {
    case 'executive':
    case 'secretary':
      return allNavItems.filter((item) => staffOnlyViews.includes(item.view));
    case 'admin': {
      if (isLegalOrgAdmin(currentUser)) {
        return allNavItems.filter((item) => item.view !== 'legalOrganizations');
      }
      if (isCompanyAdmin(currentUser)) {
        const hidden: View[] = ['legalOrganizations', 'organizations'];
        return allNavItems.filter((item) => !hidden.includes(item.view));
      }
      return allNavItems;
    }
    case 'master':
    default:
      return allNavItems;
  }
}
