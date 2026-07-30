import { ReactNode } from 'react';

import RequireRoleGate from '@/components/RequireRoleGate';

export default function ReviewerDashboardLayout({ children }: { children: ReactNode }) {
  return <RequireRoleGate role="reviewer">{children}</RequireRoleGate>;
}
