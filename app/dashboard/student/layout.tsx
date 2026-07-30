import { ReactNode } from 'react';

import RequireRoleGate from '@/components/RequireRoleGate';

export default function StudentDashboardLayout({ children }: { children: ReactNode }) {
  return <RequireRoleGate role="student">{children}</RequireRoleGate>;
}
