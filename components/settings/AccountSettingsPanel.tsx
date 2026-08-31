'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

const BORDER = '1px solid rgba(15,13,12,0.1)';

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  border: '1px solid rgba(15,13,12,0.14)',
  fontSize: 14,
  fontFamily: 'Inter, system-ui, sans-serif',
};

interface AccountSettings {
  id: string;
  email: string;
  full_name: string;
  account_type: 'admin' | 'reviewer' | 'student';
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  reviewer: 'Reviewer',
  student: 'Student',
};

function profileLinkForRole(role: string): string | null {
  if (role === 'student') return '/dashboard/student/profile';
  if (role === 'reviewer') return '/dashboard/reviewer/profile';
  return null;
}

export default function AccountSettingsPanel({ embedded }: { embedded?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [account, setAccount] = useState<AccountSettings | null>(null);
  const [fullName, setFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.account.settings() as { data?: AccountSettings };
        const d = res.data;
        if (!d) throw new Error('Could not load account');
        setAccount(d);
        setFullName(d.full_name ?? '');
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await api.account.updateSettings({ full_name: fullName.trim() }) as { data?: AccountSettings };
      if (res.data) setAccount(res.data);
      setMessage('Profile updated.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const sendRecoveryLink = async () => {
    setRecoveryLoading(true);
    setError('');
    setMessage('');
    try {
      await api.account.sendRecoveryLink();
      setMessage(`Login link sent to ${account?.email}. Check your inbox.`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send recovery link');
    } finally {
      setRecoveryLoading(false);
    }
  };

  const requestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await api.account.requestEmailChange({ new_email: newEmail.trim() }) as {
        data?: { message: string; pending_email: string };
      };
      setMessage(res.data?.message ?? 'Check your new inbox to confirm the email change.');
      setNewEmail('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Email change failed');
    } finally {
      setEmailLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: embedded ? 24 : 40, textAlign: 'center', color: 'rgba(15,13,12,0.45)' }}>
        Loading settings…
      </div>
    );
  }

  const profileHref = account ? profileLinkForRole(account.account_type) : null;

  return (
    <div style={{ display: 'grid', gap: 20, maxWidth: 640 }}>
      {error && (
        <div style={{ padding: '12px 14px', background: 'rgba(186,26,26,0.08)', border: '1px solid rgba(186,26,26,0.2)', color: '#ba1a1a', fontSize: 13 }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ padding: '12px 14px', background: 'rgba(0,122,74,0.08)', border: '1px solid rgba(0,122,74,0.2)', color: '#007a4a', fontSize: 13 }}>
          {message}
        </div>
      )}

      <section style={{ background: '#fff', border: BORDER, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#eb4511', margin: '0 0 6px' }}>
          Account
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 16px' }}>Profile</h2>
        {account && (
          <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.55)', margin: '0 0 16px' }}>
            Role: <strong>{ROLE_LABELS[account.account_type] ?? account.account_type}</strong>
            {' · '}
            Member since {new Date(account.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        )}
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label>
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} />
          </label>
          <label>
            Email
            <input value={account?.email ?? ''} disabled style={{ ...inputStyle, opacity: 0.65 }} />
          </label>
          <button
            type="submit"
            disabled={saving}
            style={{ alignSelf: 'flex-start', padding: '10px 18px', background: '#eb4511', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          >
            {saving ? 'Saving…' : 'Save name'}
          </button>
        </form>
        {profileHref && (
          <p style={{ fontSize: 13, margin: '16px 0 0' }}>
            <Link href={profileHref} style={{ color: '#eb4511' }}>
              Edit full {account?.account_type} profile →
            </Link>
          </p>
        )}
      </section>

      <section style={{ background: '#fff', border: BORDER, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#eb4511', margin: '0 0 6px' }}>
          Security
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Account recovery</h2>
        <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.55)', lineHeight: 1.6, margin: '0 0 14px' }}>
          Orcred uses magic links — no password. Send a fresh login link to your current email if you are locked out on another device.
        </p>
        <button
          type="button"
          onClick={sendRecoveryLink}
          disabled={recoveryLoading}
          style={{ padding: '10px 18px', background: '#1a1a2e', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          {recoveryLoading ? 'Sending…' : 'Send login link to my email'}
        </button>
      </section>

      <section style={{ background: '#fff', border: BORDER, padding: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#eb4511', margin: '0 0 6px' }}>
          Email
        </p>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px' }}>Change email</h2>
        <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.55)', lineHeight: 1.6, margin: '0 0 14px' }}>
          We will send a confirmation link to your new address. Your login email updates after you confirm.
        </p>
        <form onSubmit={requestEmailChange} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label>
            New email
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              placeholder="you@company.com"
              style={inputStyle}
            />
          </label>
          <button
            type="submit"
            disabled={emailLoading}
            style={{ alignSelf: 'flex-start', padding: '10px 18px', background: '#fff', color: '#0f0d0c', border: '1px solid rgba(15,13,12,0.2)', fontWeight: 600, cursor: 'pointer' }}
          >
            {emailLoading ? 'Requesting…' : 'Request email change'}
          </button>
        </form>
      </section>
    </div>
  );
}
