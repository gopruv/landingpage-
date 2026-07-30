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

/** Strict role match — no dev bypass. Each role only accesses its own dashboard. */
export function allowsDashboardRole(
  me: { account_type: string } | null,
  required: AccountType,
): boolean {
  if (!me) return false;
  return me.account_type === required;
}
