'use client';

import { useRequireReviewer } from '@/lib/useRequireReviewer';

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const { ready, loading, denied, signOut } = useRequireReviewer();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#faf7f2', fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.45)' }}>Loading reviewer dashboard…</p>
      </div>
    );
  }

  if (denied) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#faf7f2', fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px',
      }}>
        <div style={{
          maxWidth: '480px', backgroundColor: '#fff',
          border: '1px solid rgba(15,13,12,0.1)', padding: '32px', textAlign: 'center',
        }}>
          <p style={{ fontSize: '15px', color: '#0f0d0c', marginBottom: '20px', lineHeight: 1.6 }}>{denied}</p>
          <button
            onClick={signOut}
            style={{
              padding: '9px 24px', backgroundColor: '#eb4511', color: '#fff',
              border: 'none', fontSize: '13px', cursor: 'pointer',
            }}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  if (!ready) return null;

  return <>{children}</>;
}
