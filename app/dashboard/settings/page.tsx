'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { api } from '@/lib/api';
import AccountSettingsPanel from '@/components/settings/AccountSettingsPanel';

const DASHBOARD_BY_ROLE: Record<string, string> = {
  admin: '/dashboard/admin',
  reviewer: '/dashboard/reviewer',
  student: '/dashboard/student',
};

export default function SettingsPage() {
  const { ready } = useRequireAuth();
  const [dashboardHref, setDashboardHref] = useState('/dashboard/admin');

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const res = await api.account.settings() as { data?: { account_type?: string } };
        const role = res.data?.account_type;
        if (role && DASHBOARD_BY_ROLE[role]) setDashboardHref(DASHBOARD_BY_ROLE[role]);
      } catch {
        /* keep default */
      }
    })();
  }, [ready]);

  if (!ready) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#faf7f2', padding: '32px 24px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href={dashboardHref} style={{ fontSize: 13, color: 'rgba(15,13,12,0.5)' }}>
          ← Dashboard
        </Link>
        <h1 style={{ fontSize: 28, fontWeight: 500, margin: '16px 0 24px' }}>Settings</h1>
        <AccountSettingsPanel />
      </div>
    </div>
  );
}
