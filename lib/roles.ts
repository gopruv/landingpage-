import { isAdminOnlyAuth } from '@/lib/platformGates';

export type AccountType = 'student' | 'reviewer' | 'admin';

export const DASHBOARD_BY_ROLE: Record<AccountType, string> = {
  student: '/dashboard/student',
  reviewer: '/dashboard/reviewer',
  admin: '/dashboard/admin',
};

export function dashboardPathForRole(accountType: string | undefined): string {
  if (accountType && accountType in DASHBOARD_BY_ROLE) {
    return DASHBOARD_BY_ROLE[accountType as AccountType];
  }
  return '/dashboard/auth';
}

/**
 * Route access: admins may preview student and reviewer dashboards.
 * When admin-only auth is on, only admins may access any dashboard route.
 */
export function allowsDashboardRole(
  me: { account_type: string } | null,
  required: AccountType,
): boolean {
  if (!me) return false;
  if (me.account_type === 'admin') return true;
  if (isAdminOnlyAuth()) return false;
  return me.account_type === required;
}
