'use client';

import { ReactNode } from 'react';

import { type AccountType } from '@/lib/roles';
import { useRequireRole } from '@/lib/useRequireRole';

export default function RequireRoleGate({
  role,
  children,
}: {
  role: AccountType;
  children: ReactNode;
}) {
  const { ready } = useRequireRole(role);

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--bg-page)' }}
      >
        <p style={{ color: 'var(--fg-muted)', fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  return <>{children}</>;
}
