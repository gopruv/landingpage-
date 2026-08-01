/** When true (default), only users with account_type=admin in public.users may sign in. */
export function isAdminOnlyAuth(): boolean {
  return process.env.NEXT_PUBLIC_ADMIN_ONLY_AUTH !== 'false';
}

/** When true, students can submit verification applications from the dashboard. */
export function isStudentApplyEnabled(): boolean {
  return process.env.NEXT_PUBLIC_STUDENT_APPLY_ENABLED === 'true';
}

export const WAITLIST_PATH = '/join-waitlist';
