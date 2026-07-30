'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSafeSession } from '@/lib/authSession';
import { supabase } from '@/lib/supabase';

const DASHBOARD_MAP: Record<string, string> = {
  student: '/dashboard/student',
  reviewer: '/dashboard/reviewer',
  admin: '/dashboard/admin',
};

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getSafeSession({ refresh: true }).then(async (session) => {
      if (!session) return;
      const { data: profile } = await supabase
        .from('users')
        .select('account_type')
        .eq('id', session.user.id)
        .single();
      const dest = DASHBOARD_MAP[profile?.account_type ?? ''];
      if (dest) router.replace(dest);
    });
  }, [router]);

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  // Handle magic link callback
  if (token && type) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div
          className="w-full max-w-md p-8 border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderRadius: '2px',
            borderColor: 'var(--border)',
          }}
        >
          <h1 className="text-2xl font-semibold mb-4" style={{ color: 'var(--fg)' }}>
            Signing you in...
          </h1>
          <p style={{ color: 'var(--fg-muted)' }}>
            Please wait while we verify your login link.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/auth/magic-link`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'An error occurred. Please try again.');
      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--bg-page)' }}
    >
      <div
        className="w-full max-w-md p-8"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '2px',
          border: '1px solid',
          borderColor: 'var(--border)',
        }}
      >
        <div className="mb-8">
          <h1 className="text-h1 mb-2" style={{ color: 'var(--orange)' }}>
            Orcred
          </h1>
          <p style={{ color: 'var(--fg-muted)' }}>
            Enter your email to receive a login link
          </p>
        </div>

        {success ? (
          <div className="space-y-4">
            <div
              className="p-4"
              style={{
                backgroundColor: 'var(--orange-tint)',
                borderRadius: '2px',
                border: '1px solid var(--orange)',
              }}
            >
              <p style={{ color: 'var(--orange)' }} className="font-semibold">
                Check your email
              </p>
              <p style={{ color: 'var(--fg-muted)', marginTop: '8px' }}>
                We've sent a login link to {email}. Click the link to sign in.
              </p>
            </div>
            <button
              onClick={() => setSuccess(false)}
              className="w-full btn-secondary"
            >
              Send another link
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-label mb-2"
                style={{ color: 'var(--orange)' }}
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-3"
                style={{
                  backgroundColor: 'var(--bg-page)',
                  borderRadius: '2px',
                  border: '1px solid',
                  borderColor: 'var(--border)',
                  color: 'var(--fg)',
                }}
              />
            </div>

            {error && (
              <div
                className="p-3 text-sm"
                style={{
                  backgroundColor: '#ffdad6',
                  borderRadius: '2px',
                  color: '#ba1a1a',
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Sending...' : 'Send Login Link'}
            </button>
          </form>
        )}

        <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
          <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>
            First time here?{' '}
            <Link href="/" style={{ color: 'var(--orange)' }} className="font-semibold">
              Learn about Orcred
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
          <p style={{ color: 'var(--fg-muted)' }}>Loading...</p>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
