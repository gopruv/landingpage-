'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSafeSession } from './authSession';
import { supabase } from './supabase';

export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const session = await getSafeSession({ refresh: true });
        if (cancelled) return;
        if (!session) {
          router.replace('/dashboard/auth');
        } else {
          setReady(true);
        }
      } catch {
        if (!cancelled) router.replace('/dashboard/auth');
      }
    }

    void check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/dashboard/auth');
  };

  return { ready, signOut };
}
