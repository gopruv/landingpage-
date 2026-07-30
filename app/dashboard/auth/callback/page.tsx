'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const access_token  = searchParams.get('access_token');
      const refresh_token = searchParams.get('refresh_token');
      const account_type  = searchParams.get('account_type');

      if (!access_token || !refresh_token) {
        router.push('/dashboard/auth?error=missing_tokens');
        return;
      }

      const { error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (error) {
        console.error('[callback] setSession error:', error.message);
        router.push('/dashboard/auth?error=session_error');
        return;
      }

      // Full navigation so auth cookie is visible to middleware on the next request
      const map: Record<string, string> = {
        student:  '/dashboard/student',
        reviewer: '/dashboard/reviewer',
        admin:    '/dashboard/admin',
      };
      window.location.href = map[account_type ?? ''] || '/dashboard';
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
