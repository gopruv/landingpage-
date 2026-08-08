'use client';

import RequireRoleGate from '@/components/RequireRoleGate';

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  return <RequireRoleGate role="reviewer">{children}</RequireRoleGate>;
}
