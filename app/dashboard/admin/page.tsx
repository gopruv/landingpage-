'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useSignOut } from '@/lib/useRequireRole';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Analytics {
  applications: { total: number; this_month: number; last_month: number };
  scores:        { average: number; pass_rate_all_time: number };
  credentials:   { total: number; linkedin_conversion_pct: number };
  revenue:       { all_time: number; this_month: number };
}

interface Application {
  id:           string;
  project_name: string;
  tech_stack:   string;
  status:       string;
  submitted_at: string;
  payment_at:   string | null;
  utr_number:   string | null;
  users:        { full_name: string; email: string } | null;
  reviewer_assignments: Array<{
    session_date: string | null;
    status:       string;
    reviewers:    { full_name: string } | null;
  }>;
  scores: Array<{ total_score: number; final_score: number | null; passed: boolean }>;
}

interface Reviewer {
  id:                 string;
  full_name:          string;
  email:              string;
  linkedin_url:       string | null;
  sessions_completed: number;
  average_score:      number | null;
  pass_rate:          number | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtRevenue(paise: number) {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000)   return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${r === 0 ? '0' : r.toLocaleString('en-IN')}`;
}

function statusMeta(status: string): { bg: string; color: string; label: string } {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    submitted:         { bg: 'rgba(235,69,17,0.1)',  color: '#eb4511', label: 'Submitted' },
    payment_pending:   { bg: 'rgba(235,69,17,0.1)',  color: '#eb4511', label: 'Payment Pending' },
    awaiting_reviewer: { bg: 'rgba(184,121,0,0.12)', color: '#9a6500', label: 'Awaiting Reviewer' },
    scheduled:         { bg: 'rgba(0,122,74,0.1)',   color: '#007a4a', label: 'Scheduled' },
    completed:         { bg: 'rgba(0,95,163,0.1)',   color: '#005fa3', label: 'Completed' },
    cancelled:         { bg: 'rgba(15,13,12,0.07)',  color: '#6b6460', label: 'Cancelled' },
  };
  return map[status] ?? { bg: 'rgba(15,13,12,0.07)', color: '#6b6460', label: status.replace(/_/g, ' ') };
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const FONT = 'Inter, system-ui, sans-serif';
const BG   = '#faf7f2';
const BORDER = '1px solid rgba(15,13,12,0.1)';

// ── Component ─────────────────────────────────────────────────────────────────

type View = 'dashboard' | 'applications' | 'reviewers' | 'settings';

export default function AdminDashboard() {
  const signOut = useSignOut();
  const [view, setView] = useState<View>('dashboard');
  const [analytics,    setAnalytics]    = useState<Analytics | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appTotal,     setAppTotal]     = useState(0);
  const [reviewers,    setReviewers]    = useState<Reviewer[]>([]);

  const [loadingA,    setLoadingA]    = useState(true);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingR,    setLoadingR]    = useState(true);

  const [tableTab, setTableTab] = useState<'all' | 'awaiting_reviewer' | 'scheduled' | 'completed'>('all');
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);

  // Fetch analytics
  useEffect(() => {
    (async () => {
      setLoadingA(true);
      try {
        const res = await api.admin.analytics() as any;
        setAnalytics(res?.data ?? res);
      } catch { /* silent */ }
      finally { setLoadingA(false); }
    })();
  }, []);

  // Fetch applications
  const fetchApps = useCallback(async () => {
    setLoadingApps(true);
    try {
      const p: Record<string, string> = { page: String(page) };
      if (tableTab !== 'all') p.status = tableTab;
      if (search) p.search = search;
      const res = await api.admin.applications(new URLSearchParams(p).toString()) as any;
      setApplications(res?.data ?? []);
      setAppTotal(res?.total ?? 0);
    } catch { /* silent */ }
    finally { setLoadingApps(false); }
  }, [tableTab, search, page]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  // Fetch reviewers
  useEffect(() => {
    (async () => {
      setLoadingR(true);
      try {
        const res = await api.admin.reviewers() as any;
        setReviewers(res?.data ?? []);
      } catch { /* silent */ }
      finally { setLoadingR(false); }
    })();
  }, []);

  // Derived counts from loaded applications (all pages would need backend; use analytics for top cards)
  const awaiting  = applications.filter(a => a.status === 'awaiting_reviewer').length;
  const scheduled = applications.filter(a => a.status === 'scheduled').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, fontFamily: FONT }}>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(250,247,242,0.94)',
        backdropFilter: 'blur(14px)',
        borderBottom: BORDER,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="26" height="26" viewBox="0 0 42 42" fill="none">
              <circle cx="21" cy="21" r="20" fill="#eb4511" />
            </svg>
            <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f0d0c' }}>Orcred</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {(['dashboard', 'applications', 'reviewers', 'settings'] as View[]).map(v => {
              const active = view === v;
              const label  = v.charAt(0).toUpperCase() + v.slice(1);
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '13px',
                    fontWeight: active ? 600 : 400,
                    color: active ? '#0f0d0c' : 'rgba(15,13,12,0.45)',
                    backgroundColor: active ? 'rgba(15,13,12,0.07)' : 'transparent',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    letterSpacing: '-0.01em',
                    fontFamily: FONT,
                    transition: 'background-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => !active && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(15,13,12,0.04)')}
                  onMouseLeave={e => !active && ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
                >
                  {label}
                </button>
              );
            })}
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#eb4511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>A</span>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f0d0c', lineHeight: 1.2 }}>Admin</div>
              <div style={{ fontSize: '11px', color: 'rgba(15,13,12,0.4)', lineHeight: 1.2 }}>Manager</div>
            </div>
            <button
              onClick={signOut}
              style={{ marginLeft: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#eb4511', background: 'transparent', border: '1px solid #eb4511', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT }}
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '36px 40px 80px' }}>

        {/* Page title */}
        <h1 style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.03em', color: '#0f0d0c', margin: '0 0 28px' }}>
          {view.charAt(0).toUpperCase() + view.slice(1)}
        </h1>

        {/* ── Settings placeholder ── */}
        {view === 'settings' && (
          <div style={{ padding: '60px', textAlign: 'center', fontSize: '14px', color: 'rgba(15,13,12,0.35)', backgroundColor: '#fff', border: BORDER }}>
            Settings coming soon.
          </div>
        )}

        {/* ── Reviewers full view ── */}
        {view === 'reviewers' && (
          <div>
            {loadingR ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                {[1,2,3].map(i => <div key={i} style={{ height: '140px', backgroundColor: 'rgba(15,13,12,0.04)', border: BORDER }} />)}
              </div>
            ) : reviewers.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center', fontSize: '14px', color: 'rgba(15,13,12,0.35)', backgroundColor: '#fff', border: BORDER }}>No reviewers yet.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
                {reviewers.map(r => <ReviewerCard key={r.id} reviewer={r} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Dashboard + Applications views ── */}
        {(view === 'dashboard' || view === 'applications') && <>

        {/* ── 4 Stat cards ─────────────────────────────────────────── */}
        {view === 'dashboard' && <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {loadingA ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: '110px', backgroundColor: 'rgba(15,13,12,0.04)', border: BORDER }} />
            ))
          ) : analytics ? (
            <>
              <StatCard
                icon="📋"
                label="Total Applications"
                value={analytics.applications.total}
                sub={`${analytics.applications.this_month} this month`}
                accent="#eb4511"
              />
              <StatCard
                icon="⏳"
                label="Awaiting Reviewer"
                value={awaiting}
                sub="Need assignment"
                accent="#9a6500"
              />
              <StatCard
                icon="📅"
                label="Sessions Scheduled"
                value={scheduled}
                sub="Upcoming reviews"
                accent="#007a4a"
              />
              <StatCard
                icon="🎓"
                label="Credentials Issued"
                value={analytics.credentials.total}
                sub={`${analytics.scores.pass_rate_all_time}% pass rate`}
                accent="#005fa3"
              />
            </>
          ) : null}
        </div>}

        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: view === 'dashboard' ? '1fr 340px' : '1fr', gap: '16px', alignItems: 'start' }}>

          {/* ── LEFT: Applications table ─────────────────────────── */}
          <div style={{ backgroundColor: '#fff', border: BORDER }}>

            {/* Table header */}
            <div style={{ padding: '18px 20px 0', borderBottom: BORDER }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f0d0c', letterSpacing: '-0.01em' }}>
                  Applications
                  {appTotal > 0 && <span style={{ marginLeft: '6px', fontSize: '13px', fontWeight: 400, color: 'rgba(15,13,12,0.38)' }}>{appTotal}</span>}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SearchInput value={search} onChange={v => { setSearch(v); setPage(1); }} />
                </div>
              </div>

              {/* Tab filters */}
              <div style={{ display: 'flex', gap: '2px' }}>
                {([
                  { key: 'all',              label: 'All' },
                  { key: 'awaiting_reviewer', label: 'Needs Reviewer' },
                  { key: 'scheduled',        label: 'Scheduled' },
                  { key: 'completed',        label: 'Completed' },
                ] as const).map(t => (
                  <button
                    key={t.key}
                    onClick={() => { setTableTab(t.key); setPage(1); }}
                    style={{
                      padding: '7px 14px',
                      fontSize: '12px', fontWeight: tableTab === t.key ? 600 : 400,
                      color: tableTab === t.key ? '#fff' : 'rgba(15,13,12,0.5)',
                      backgroundColor: tableTab === t.key ? '#eb4511' : 'transparent',
                      border: tableTab === t.key ? 'none' : '1px solid rgba(15,13,12,0.12)',
                      borderRadius: '4px',
                      cursor: 'pointer', fontFamily: FONT,
                      marginBottom: '0',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(15,13,12,0.07)' }}>
                    {['Student', 'Project', 'Submitted', 'Payment', 'Reviewer', 'Score', 'Status'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'rgba(15,13,12,0.38)', letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap', backgroundColor: 'rgba(250,247,242,0.6)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingApps ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(15,13,12,0.05)' }}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} style={{ padding: '14px 16px' }}>
                            <div style={{ height: '12px', width: j === 0 ? '100px' : j === 1 ? '140px' : '60px', backgroundColor: 'rgba(15,13,12,0.06)', borderRadius: '2px' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '52px', textAlign: 'center', fontSize: '14px', color: 'rgba(15,13,12,0.35)' }}>
                        No applications found.
                      </td>
                    </tr>
                  ) : applications.map(app => (
                    <AppRow key={app.id} app={app} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {appTotal > 50 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(15,13,12,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'rgba(15,13,12,0.4)' }}>
                  Page {page} of {Math.ceil(appTotal / 50)}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <PageBtn label="← Prev" disabled={page === 1}            onClick={() => setPage(p => p - 1)} />
                  <PageBtn label="Next →" disabled={page * 50 >= appTotal} onClick={() => setPage(p => p + 1)} />
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT sidebar (dashboard only) ──────────────────── */}
          {view === 'dashboard' && <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Revenue card */}
            {analytics && (
              <div style={{ backgroundColor: '#fff', border: BORDER, padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f0d0c', letterSpacing: '-0.01em' }}>Revenue</span>
                  <span style={{ fontSize: '11px', color: 'rgba(15,13,12,0.38)' }}>All time</span>
                </div>
                <div style={{ fontSize: '40px', fontWeight: 200, letterSpacing: '-0.04em', color: '#0f0d0c', lineHeight: 1, marginBottom: '6px' }}>
                  {fmtRevenue(analytics.revenue.all_time)}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(15,13,12,0.45)' }}>
                  {fmtRevenue(analytics.revenue.this_month)} this month · {analytics.scores.average}/100 avg score
                </div>
                <div style={{ marginTop: '16px', height: '3px', backgroundColor: 'rgba(15,13,12,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(analytics.scores.pass_rate_all_time, 100)}%`, backgroundColor: '#eb4511', borderRadius: '2px', transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(15,13,12,0.38)', marginTop: '5px' }}>
                  {analytics.scores.pass_rate_all_time}% pass rate
                </div>
              </div>
            )}

            {/* Reviewers panel */}
            <div style={{ backgroundColor: '#fff', border: BORDER }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,13,12,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f0d0c', letterSpacing: '-0.01em' }}>Reviewer Performance</span>
                {reviewers.length > 0 && (
                  <span style={{ fontSize: '11px', backgroundColor: 'rgba(15,13,12,0.06)', color: 'rgba(15,13,12,0.5)', padding: '2px 8px', borderRadius: '10px', fontWeight: 500 }}>
                    {reviewers.length} active
                  </span>
                )}
              </div>

              {loadingR ? (
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(15,13,12,0.06)' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '10px', width: '100px', backgroundColor: 'rgba(15,13,12,0.06)', borderRadius: '2px', marginBottom: '6px' }} />
                        <div style={{ height: '8px', width: '70px', backgroundColor: 'rgba(15,13,12,0.04)', borderRadius: '2px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : reviewers.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'rgba(15,13,12,0.35)' }}>No reviewers yet.</div>
              ) : (
                <div>
                  {reviewers.map((r, i) => (
                    <ReviewerRow key={r.id} reviewer={r} last={i === reviewers.length - 1} />
                  ))}
                </div>
              )}
            </div>

          </div>}
        </div>

        </>}
      </div>
    </div>
  );
}

// ── ReviewerCard (full view) ──────────────────────────────────────────────────

function ReviewerCard({ reviewer: r }: { reviewer: Reviewer }) {
  const [hov, setHov] = useState(false);
  const initials = r.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: '#fff',
        border: `1px solid ${hov ? 'rgba(235,69,17,0.3)' : 'rgba(15,13,12,0.1)'}`,
        padding: '24px',
        transition: 'border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov ? '0 4px 20px rgba(235,69,17,0.07)' : 'none',
        cursor: 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', paddingBottom: '16px', borderBottom: '1px solid rgba(15,13,12,0.07)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(235,69,17,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#eb4511' }}>{initials}</span>
        </div>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f0d0c', letterSpacing: '-0.01em' }}>{r.full_name}</div>
          <div style={{ fontSize: '12px', color: 'rgba(15,13,12,0.45)', marginTop: '2px' }}>{r.email}</div>
          {r.linkedin_url && (
            <a href={r.linkedin_url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '11px', color: '#eb4511', textDecoration: 'none', fontWeight: 500 }}>
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Sessions',  value: r.sessions_completed, unit: '' },
          { label: 'Avg score', value: r.average_score !== null ? r.average_score : '—', unit: r.average_score !== null ? '/100' : '' },
          { label: 'Pass rate', value: r.pass_rate     !== null ? r.pass_rate     : '—', unit: r.pass_rate     !== null ? '%'    : '' },
        ].map(s => (
          <div key={s.label}>
            <p style={{ fontSize: '11px', color: 'rgba(15,13,12,0.4)', marginBottom: '4px', fontWeight: 500 }}>{s.label}</p>
            <p style={{ fontSize: '26px', fontWeight: 300, letterSpacing: '-0.03em', color: '#0f0d0c', lineHeight: 1, margin: 0 }}>
              {s.value}<span style={{ fontSize: '11px', color: 'rgba(15,13,12,0.38)', marginLeft: '1px' }}>{s.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, accent }: {
  icon: string; label: string; value: number | string; sub: string; accent: string;
}) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: '#fff',
        border: `1px solid ${hov ? accent : 'rgba(15,13,12,0.1)'}`,
        padding: '20px',
        transition: 'border-color 0.18s, box-shadow 0.18s',
        boxShadow: hov ? `0 4px 20px ${accent}18` : 'none',
        cursor: 'default', position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.25 }}>
          <path d="M2 12L12 2M12 2H5M12 2V9" stroke="#0f0d0c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(15,13,12,0.45)', marginBottom: '6px', letterSpacing: '-0.01em' }}>
        {label}
      </p>
      <p style={{ fontSize: '40px', fontWeight: 200, letterSpacing: '-0.04em', color: '#0f0d0c', lineHeight: 1, margin: '0 0 6px' }}>
        {value}
      </p>
      <p style={{ fontSize: '11px', color: 'rgba(15,13,12,0.38)', margin: 0 }}>{sub}</p>
    </div>
  );
}

// ── AppRow ────────────────────────────────────────────────────────────────────

function AppRow({ app }: { app: Application }) {
  const [hov, setHov] = useState(false);
  const badge  = statusMeta(app.status);
  const score  = app.scores?.[0];
  const assign = app.reviewer_assignments?.[0];
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ borderBottom: '1px solid rgba(15,13,12,0.05)', backgroundColor: hov ? '#faf7f2' : '#fff', transition: 'background-color 0.12s' }}
    >
      <td style={{ padding: '13px 16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f0d0c', whiteSpace: 'nowrap' }}>
          {app.users?.full_name || '—'}
        </div>
        <div style={{ fontSize: '11px', color: 'rgba(15,13,12,0.38)', marginTop: '1px' }}>{app.users?.email}</div>
      </td>
      <td style={{ padding: '13px 16px', fontSize: '13px', color: 'rgba(15,13,12,0.7)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {app.project_name}
      </td>
      <td style={{ padding: '13px 16px', fontSize: '12px', color: 'rgba(15,13,12,0.45)', whiteSpace: 'nowrap' }}>
        {new Date(app.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
      </td>
      <td style={{ padding: '13px 16px' }}>
        {app.payment_at
          ? <span style={{ fontSize: '12px', fontWeight: 600, color: '#007a4a' }}>Paid ✓</span>
          : app.utr_number
            ? <span style={{ fontSize: '12px', fontWeight: 500, color: '#9a6500' }}>Pending</span>
            : <span style={{ fontSize: '13px', color: 'rgba(15,13,12,0.25)' }}>—</span>}
      </td>
      <td style={{ padding: '13px 16px', fontSize: '12px', color: 'rgba(15,13,12,0.55)', whiteSpace: 'nowrap' }}>
        {assign?.reviewers?.full_name ?? <span style={{ color: 'rgba(15,13,12,0.25)' }}>Unassigned</span>}
      </td>
      <td style={{ padding: '13px 16px' }}>
        {score
          ? <span style={{ fontSize: '13px', fontWeight: 700, color: score.passed ? '#007a4a' : '#ba1a1a' }}>
              {score.final_score ?? score.total_score}
              <span style={{ fontSize: '10px', fontWeight: 400, color: 'rgba(15,13,12,0.3)', marginLeft: '1px' }}>/100</span>
            </span>
          : <span style={{ color: 'rgba(15,13,12,0.25)', fontSize: '13px' }}>—</span>}
      </td>
      <td style={{ padding: '13px 16px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, padding: '3px 9px', backgroundColor: badge.bg, color: badge.color, borderRadius: '4px', whiteSpace: 'nowrap' }}>
          {badge.label}
        </span>
      </td>
    </tr>
  );
}

// ── ReviewerRow ───────────────────────────────────────────────────────────────

function ReviewerRow({ reviewer: r, last }: { reviewer: Reviewer; last: boolean }) {
  const [hov, setHov] = useState(false);
  const initials = r.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '13px 20px',
        borderBottom: last ? 'none' : '1px solid rgba(15,13,12,0.06)',
        backgroundColor: hov ? '#faf7f2' : '#fff',
        transition: 'background-color 0.12s',
        display: 'flex', alignItems: 'center', gap: '12px', cursor: 'default',
      }}
    >
      <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: 'rgba(235,69,17,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#eb4511' }}>{initials}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f0d0c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.full_name}</div>
        <div style={{ fontSize: '11px', color: 'rgba(15,13,12,0.4)', marginTop: '1px' }}>
          {r.sessions_completed} sessions · {r.pass_rate !== null ? `${r.pass_rate}% pass` : 'No sessions'}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f0d0c', letterSpacing: '-0.02em' }}>
          {r.average_score !== null ? r.average_score : '—'}
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(15,13,12,0.35)' }}>avg score</div>
      </div>
    </div>
  );
}

// ── Small utils ───────────────────────────────────────────────────────────────

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ position: 'absolute', left: '10px', opacity: 0.35 }}>
        <circle cx="6.5" cy="6.5" r="5" stroke="#0f0d0c" strokeWidth="1.5"/>
        <path d="M10 10L14 14" stroke="#0f0d0c" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <input
        placeholder="Search project…"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          paddingLeft: '30px', paddingRight: '10px', paddingTop: '7px', paddingBottom: '7px',
          border: `1px solid ${focused ? '#eb4511' : 'rgba(15,13,12,0.14)'}`,
          backgroundColor: '#faf7f2', fontSize: '12px', color: '#0f0d0c',
          fontFamily: FONT, outline: 'none', borderRadius: '4px', width: '180px',
          transition: 'border-color 0.15s',
        }}
      />
    </div>
  );
}

function PageBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '6px 14px', border: '1px solid rgba(15,13,12,0.14)',
        backgroundColor: hov && !disabled ? '#faf7f2' : '#fff',
        fontSize: '12px', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1, fontFamily: FONT,
        borderRadius: '4px', transition: 'background-color 0.15s', color: '#0f0d0c',
      }}
    >
      {label}
    </button>
  );
}
