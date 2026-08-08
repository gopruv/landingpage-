'use client';

import { SCORE_CRITERIA } from '@/lib/scoring';

const BORDER = '1px solid rgba(15,13,12,0.1)';

interface UserRecord {
  id: string;
  email: string;
  account_type: string;
  full_name: string | null;
  college?: string | null;
  graduation_year?: number | null;
  linkedin_url?: string | null;
  current_company?: string | null;
  current_role?: string | null;
  years_experience?: number | null;
  expertise?: string | null;
  timezone?: string | null;
  reviewer_onboarding_complete?: boolean;
  created_at: string;
}

interface ProfileData {
  user: UserRecord;
  applications?: Array<Record<string, unknown>>;
  project_ideas?: Array<Record<string, unknown>>;
  credentials?: Array<Record<string, unknown>>;
  assignments?: Array<Record<string, unknown>>;
  scores?: Array<Record<string, unknown>>;
  stats?: {
    sessions_completed: number;
    total_assignments: number;
    average_score: number | null;
    pass_rate: number | null;
  };
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === '') return null;
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.4)', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: '#0f0d0c' }}>{value}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: BORDER }}>
      <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#eb4511', marginBottom: 16 }}>{title}</h3>
      {children}
    </div>
  );
}

export default function UserProfilePanel({
  data,
  loading,
  onClose,
}: {
  data: ProfileData | null;
  loading: boolean;
  onClose: () => void;
}) {
  const user = data?.user;
  const isStudent = user?.account_type === 'student';
  const isReviewer = user?.account_type === 'reviewer';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,13,12,0.35)', zIndex: 110 }} />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(560px, 100vw)',
        background: '#fff', zIndex: 111, overflowY: 'auto',
        borderLeft: BORDER, boxShadow: '-8px 0 32px rgba(15,13,12,0.08)',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#eb4511', marginBottom: 4 }}>
              {user?.account_type ?? 'User'} profile
            </p>
            <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{user?.full_name ?? 'Loading…'}</h2>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 22, cursor: 'pointer', color: 'rgba(15,13,12,0.4)' }}>×</button>
        </div>

        {loading || !data || !user ? (
          <div style={{ padding: 40, color: 'rgba(15,13,12,0.4)' }}>Loading profile…</div>
        ) : (
          <div style={{ padding: '24px' }}>
            <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.45)', marginBottom: 20 }}>
              Read-only · joined {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>

            <Section title="Contact">
              <Field label="Email" value={user.email} />
              {user.linkedin_url && (
                <a href={user.linkedin_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#eb4511' }}>LinkedIn →</a>
              )}
            </Section>

            {isStudent && (
              <>
                <Section title="Education">
                  <Field label="College" value={user.college} />
                  <Field label="Graduation year" value={user.graduation_year} />
                </Section>

                {(data.applications ?? []).map((app, i) => {
                  const a = app as Record<string, unknown>;
                  const scores = a.scores as Record<string, unknown> | Array<Record<string, unknown>> | null;
                  const score = Array.isArray(scores) ? scores[0] : scores;
                  const creds = a.credentials as Record<string, unknown> | Array<Record<string, unknown>> | null;
                  const cred = Array.isArray(creds) ? creds[0] : creds;
                  return (
                    <Section key={String(a.id)} title={`Application ${i + 1}: ${String(a.project_name)}`}>
                      <Field label="Status" value={String(a.status).replace(/_/g, ' ')} />
                      <Field label="Tech stack" value={String(a.tech_stack)} />
                      <Field label="Submitted" value={a.submitted_at ? new Date(String(a.submitted_at)).toLocaleString('en-IN') : null} />
                      <Field label="Payment" value={a.payment_at ? `Confirmed ${new Date(String(a.payment_at)).toLocaleDateString('en-IN')}` : (a.utr_number ? `Pending UTR: ${a.utr_number}` : 'Not paid')} />
                      {a.github_url ? <a href={String(a.github_url)} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 13, color: '#eb4511', marginBottom: 8 }}>GitHub →</a> : null}
                      {a.loom_url ? <a href={String(a.loom_url)} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 13, color: '#eb4511', marginBottom: 12 }}>Loom →</a> : null}
                      <Field label="Architectural decision" value={String(a.build_decision_1 ?? '')} />
                      <Field label="What didn't work" value={String(a.build_decision_2 ?? '')} />
                      <Field label="Would change" value={String(a.build_decision_3 ?? '')} />
                      <Field label="What broke" value={String(a.what_broke ?? '')} />
                      <Field label="AI tools" value={String(a.ai_tools_used ?? '')} />
                      {score && (
                        <div style={{ marginTop: 12, padding: 12, background: '#faf7f2' }}>
                          <p style={{ fontWeight: 600, marginBottom: 8 }}>Score: {String(score.final_score ?? score.total_score)}/100 {score.passed ? '(Pass)' : '(Fail)'}</p>
                          {SCORE_CRITERIA.map((c) => (
                            <p key={c.key} style={{ fontSize: 12, margin: '4px 0', color: 'rgba(15,13,12,0.6)' }}>
                              {c.label}: {String((score as Record<string, unknown>)[c.key] ?? '—')}
                            </p>
                          ))}
                        </div>
                      )}
                      {cred && (
                        <div style={{ marginTop: 12 }}>
                          <Field label="Credential" value={String(cred.credential_id)} />
                          <a href={String(cred.credential_url)} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#005fa3' }}>View credential →</a>
                        </div>
                      )}
                    </Section>
                  );
                })}

                {(data.project_ideas ?? []).length > 0 && (
                  <Section title="Project ideas (generator)">
                    {(data.project_ideas ?? []).map((idea) => {
                      const p = idea as Record<string, unknown>;
                      return (
                        <div key={String(p.id)} style={{ marginBottom: 12, padding: 12, background: '#faf7f2' }}>
                          <p style={{ fontWeight: 600 }}>{String(p.project_name)} {p.is_active ? '(active)' : ''}</p>
                          <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.55)' }}>{String(p.tech_stack ?? '')}</p>
                        </div>
                      );
                    })}
                  </Section>
                )}
              </>
            )}

            {isReviewer && (
              <>
                <Section title="Professional">
                  <Field label="Company" value={user.current_company} />
                  <Field label="Role" value={user.current_role} />
                  <Field label="Experience" value={user.years_experience ? `${user.years_experience}+ years` : null} />
                  <Field label="Expertise" value={user.expertise} />
                  <Field label="Timezone" value={user.timezone} />
                  <Field label="Onboarding" value={user.reviewer_onboarding_complete ? 'Complete' : 'Incomplete'} />
                </Section>

                {data.stats && (
                  <Section title="Performance">
                    <Field label="Sessions completed" value={data.stats.sessions_completed} />
                    <Field label="Total assignments" value={data.stats.total_assignments} />
                    <Field label="Average score given" value={data.stats.average_score ?? '—'} />
                    <Field label="Pass rate" value={data.stats.pass_rate != null ? `${data.stats.pass_rate}%` : '—'} />
                  </Section>
                )}

                {(data.assignments ?? []).length > 0 && (
                  <Section title="Assignment history">
                    {(data.assignments ?? []).map((a) => {
                      const row = a as Record<string, unknown>;
                      const app = row.applications as Record<string, unknown> | null;
                      const student = app?.users as Record<string, unknown> | null;
                      return (
                        <div key={String(row.id)} style={{ marginBottom: 10, padding: 10, background: '#faf7f2', fontSize: 13 }}>
                          <strong>{String(app?.project_name ?? '—')}</strong>
                          <p style={{ margin: '4px 0', color: 'rgba(15,13,12,0.55)' }}>
                            {String(student?.full_name ?? '')} · {String(row.status)}
                          </p>
                          {row.session_date ? (
                            <p style={{ margin: 0, fontSize: 12, color: 'rgba(15,13,12,0.45)' }}>
                              {new Date(String(row.session_date)).toLocaleString('en-IN')}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </Section>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
