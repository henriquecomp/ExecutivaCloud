import { User, View } from '../../types';
import { SidebarNavItem } from './SidebarNavItem';

/** Módulos permitidos para executivo e secretária (sem configurações administrativas). */
const staffOnlyViews: View[] = [
  'dashboard',
  'agenda',
  'tasks',
  'documents',
  'contacts',
  'finances',
  'reports',
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
      if (currentUser.organizationId) {
        const hidden: View[] = ['legalOrganizations', 'organizations'];
        return allNavItems.filter((item) => !hidden.includes(item.view));
      }
      if (currentUser.legalOrganizationId) {
        return allNavItems.filter((item) => item.view !== 'legalOrganizations');
      }
      return allNavItems;
    }
    case 'master':
    default:
      return allNavItems;
  }
}
