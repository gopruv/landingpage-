'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { clearInvalidAuthSession } from '@/lib/authSession';
import { supabase } from '@/lib/supabase';
import { isAdminOnlyAuth } from '@/lib/platformGates';
import { dashboardPathForRole } from '@/lib/roles';

function readCallbackParams(searchParams: URLSearchParams): URLSearchParams {
  if (typeof window === 'undefined') return searchParams;
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) return new URLSearchParams(hash);
  return searchParams;
}

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const params = readCallbackParams(searchParams);
      const access_token  = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const account_type  = params.get('account_type');

      if (!access_token || !refresh_token) {
        router.push('/dashboard/auth?error=missing_tokens');
        return;
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        await clearInvalidAuthSession();
        router.push('/dashboard/auth?error=session_error');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.error('[callback] session not persisted after setSession');
        router.push('/dashboard/auth?error=session_error');
        return;
      }

      if (isAdminOnlyAuth() && account_type !== 'admin') {
        await supabase.auth.signOut();
        router.push('/dashboard/auth?error=admin_only');
        return;
      }

      const map: Record<string, string> = {
        student:  '/dashboard/student',
        reviewer: '/dashboard/reviewer',
        admin:    '/dashboard/admin',
      };
      window.location.href = map[account_type ?? ''] || dashboardPathForRole(account_type ?? undefined);
      // Clear tokens from the address bar
      if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
      <p style={{ color: 'var(--fg-muted)' }}>Signing you in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--fg-muted)' }}>Loading...</p>
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
