import type { Role, User } from '../shared/types';

export interface NavItem {
  testId: string;
  label: string;
  to: string;
  end?: boolean;
}

export const LANDING_PATHS: Record<Role, string> = {
  customer: '/customer',
  staff: '/staff',
  admin: '/admin',
};

export function navItemsFor(user: User): NavItem[] {
  if (user.role === 'customer') {
    return [
      { testId: 'nav-book', label: 'Book', to: '/customer', end: true },
      { testId: 'nav-services', label: 'Services', to: '/customer/services' },
      { testId: 'nav-tickets', label: 'My Tickets', to: '/customer/tickets' },
      { testId: 'nav-history', label: 'History', to: '/customer/history' },
    ];
  }
  if (user.role === 'staff') {
    return [
      { testId: 'nav-desk', label: 'Queue Desk', to: '/staff', end: true },
      { testId: 'nav-display', label: 'Queue Display', to: `/display?branchId=${user.branchId ?? ''}` },
    ];
  }
  return [
    { testId: 'nav-dashboard', label: 'Dashboard', to: '/admin', end: true },
    { testId: 'nav-monitor', label: 'Monitor', to: '/admin/monitor' },
    { testId: 'nav-branches', label: 'Branches', to: '/admin/branches' },
    { testId: 'nav-services-admin', label: 'Services', to: '/admin/services' },
    { testId: 'nav-staff-admin', label: 'Staff', to: '/admin/staff' },
  ];
}
