'use client';

import RequireRoleGate from '@/components/RequireRoleGate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RequireRoleGate role="admin">{children}</RequireRoleGate>;
}
