'use client';

import RequireRoleGate from '@/components/RequireRoleGate';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return <RequireRoleGate role="student">{children}</RequireRoleGate>;
}
