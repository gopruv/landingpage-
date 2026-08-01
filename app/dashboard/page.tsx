'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { dashboardPathForRole } from '@/lib/roles';
import { isAdminOnlyAuth } from '@/lib/platformGates';

export default function DashboardHome() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await api.auth.me() as { account_type: string };
        const { account_type } = data;

        if (isAdminOnlyAuth() && account_type !== 'admin') {
          router.push('/dashboard/auth?error=admin_only');
          return;
        }

        router.push(dashboardPathForRole(account_type));
      } catch {
        router.push('/dashboard/auth');
      }
    };

    checkAuth();
  }, [router]);

  return null;
}
