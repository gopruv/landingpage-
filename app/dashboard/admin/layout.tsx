import { ReactNode } from 'react';

import RequireRoleGate from '@/components/RequireRoleGate';

export default function AdminDashboardLayout({ children }: { children: ReactNode }) {
  return <RequireRoleGate role="admin">{children}</RequireRoleGate>;
}
