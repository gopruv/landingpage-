'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from './api';
import { getSafeSession } from './authSession';
import {
  type AccountType,
  allowsDashboardRole,
  dashboardPathForRole,
} from './roles';
import { supabase } from './supabase';

export function useRequireRole(required: AccountType) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const session = await getSafeSession({ refresh: true });
      if (cancelled) return;

      if (!session) {
        router.replace('/dashboard/auth');
        return;
      }

      try {
        const me = await api.auth.me() as { account_type: string; email?: string };

        if (!allowsDashboardRole(me, required)) {
          router.replace(dashboardPathForRole(me.account_type));
          return;
        }

        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) router.replace('/dashboard/auth');
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [router, required]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/dashboard/auth');
  };

  return { ready, signOut };
}

export function useSignOut() {
  const router = useRouter();

  return async () => {
    await supabase.auth.signOut();
    router.replace('/dashboard/auth');
  };
}
