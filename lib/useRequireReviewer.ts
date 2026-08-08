'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import { api, ApiError } from './api';
import { allowsDashboardRole } from './devAccess';

export function useRequireReviewer() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        setLoading(false);
        router.replace('/dashboard/auth');
        return;
      }

      try {
        const profile = await api.auth.me() as { account_type?: string; email?: string };
        if (!allowsDashboardRole(profile.email, 'reviewer', profile.account_type)) {
          setDenied(
            `Signed in as ${profile.email ?? session.user.email} (${profile.account_type ?? 'unknown'}). Reviewer access required.`,
          );
          return;
        }
        setReady(true);
      } catch (e) {
        setDenied(
          e instanceof ApiError ? e.message : 'Could not load profile',
        );
      } finally {
        setLoading(false);
      }
    });
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/dashboard/auth');
  };

  return { ready, loading, denied, signOut };
}
