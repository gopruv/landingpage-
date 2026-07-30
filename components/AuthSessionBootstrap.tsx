'use client';

import { useEffect } from 'react';

import { purgeAncientAuthSession } from '@/lib/authSession';

/** Clears very old auth cookies on load — no Supabase refresh request. */
export default function AuthSessionBootstrap() {
  useEffect(() => {
    void purgeAncientAuthSession();
  }, []);

  return null;
}
