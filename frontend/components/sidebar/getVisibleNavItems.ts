import { User, View } from '../../types';
import { SidebarNavItem } from './SidebarNavItem';

export function getVisibleNavItems(
  currentUser: User | null,
  allNavItems: SidebarNavItem[],
): SidebarNavItem[] {
  if (!currentUser) return [];

  switch (currentUser.role) {
    case 'executive': {
      const executiveViews: View[] = [
        'dashboard',
        'agenda',
        'documents',
        'contacts',
        'finances',
        'tasks',
        'reports',
        'settings',
      ];
      return allNavItems.filter((item) => executiveViews.includes(item.view));
    }
    case 'secretary': {
      const secretaryHiddenViews: View[] = ['organizations', 'legalOrganizations'];
      return allNavItems.filter((item) => !secretaryHiddenViews.includes(item.view));
    }
    case 'admin':
      if (currentUser.organizationId) {
        const adminHiddenViews: View[] = ['legalOrganizations'];
        return allNavItems.filter((item) => !adminHiddenViews.includes(item.view));
      }
      return allNavItems;
    case 'master':
    default:
      return allNavItems;
  }
}
