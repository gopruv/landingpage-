'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import { api, ApiError } from './api';
import { allowsDashboardRole } from './devAccess';

export function useRequireAdmin() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/dashboard/auth');
        return;
      }

      try {
        const profile = await api.auth.me() as { account_type?: string; email?: string };
        if (!allowsDashboardRole(profile.email, 'admin', profile.account_type)) {
          const role = profile.account_type ?? 'unknown';
          const email = profile.email ?? session.user.email ?? 'your account';
          setDenied(
            `Signed in as ${email} (${role}). Set account_type to "admin" in Supabase → public.users, then sign out and back in.`,
          );
          return;
        }
        setReady(true);
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Could not load profile';
        setDenied(
          `${msg} (${session.user.email}). Ensure public.users has id = ${session.user.id} with account_type = admin.`,
        );
      }
    });
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/dashboard/auth');
  };

  return { ready, denied, signOut };
}
