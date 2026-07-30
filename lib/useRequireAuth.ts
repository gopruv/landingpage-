'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSafeSession } from './authSession';
import { supabase } from './supabase';

export function useRequireAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getSafeSession({ refresh: true }).then((session) => {
      if (!session) {
        router.replace('/dashboard/auth');
      } else {
        setReady(true);
      }
    });
  }, [router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace('/dashboard/auth');
  };

  return { ready, signOut };
}
