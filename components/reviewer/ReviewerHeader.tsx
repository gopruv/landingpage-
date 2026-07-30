'use client';

import Link from 'next/link';

const BORDER = '1px solid rgba(15,13,12,0.1)';

export default function ReviewerHeader({
  subtitle,
  onSignOut,
  onDashboardClick,
}: {
  subtitle?: string;
  onSignOut: () => void;
  /** When set (e.g. in-app application view), title resets to the list instead of routing. */
  onDashboardClick?: () => void;
}) {
  const titleStyle = { fontSize: 24, fontWeight: 500, margin: 0, color: '#0f0d0c', textDecoration: 'none' as const };

  return (
    <header style={{ borderBottom: BORDER, padding: '20px 32px', backgroundColor: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          {onDashboardClick ? (
            <button
              type="button"
              onClick={onDashboardClick}
              style={{ ...titleStyle, background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}
            >
              Reviewer Dashboard
            </button>
          ) : (
            <Link href="/dashboard/reviewer" style={titleStyle}>
              Reviewer Dashboard
            </Link>
          )}
          {subtitle && (
            <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.45)', marginTop: 4, marginBottom: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <Link
            href="/dashboard/reviewer/profile"
            style={{ padding: '8px 14px', fontSize: 12, border: BORDER, textDecoration: 'none', color: 'inherit' }}
          >
            Profile
          </Link>
          <button
            type="button"
            onClick={onSignOut}
            style={{ padding: '8px 14px', fontSize: 12, color: '#eb4511', background: 'transparent', border: '1px solid #eb4511', cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
