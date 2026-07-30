'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useSignOut } from '@/lib/useRequireRole';

// ── Types ─────────────────────────────────────────────────────────────────────

type State = 'new' | 'has_idea' | 'applied' | 'scheduled' | 'completed';

interface DashData {
  full_name:   string;
  email:       string;
  profile_completion: number;
  state:       State;
  project?:    { name: string; tech_stack: string };
  application?: {
    id:           string;
    submitted_at: string;
    payment_at?:  string;
    session_date?: string;
    score?: {
      total:           number;
      technical_depth: number;
      communication:   number;
      reproducibility: number;
      originality:     number;
      passed:          boolean;
    };
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT   = 'Inter, system-ui, sans-serif';
const BG     = '#faf7f2';
const BORDER = '1px solid rgba(15,13,12,0.1)';

const STATE_META: Record<State, { label: string; color: string; bg: string; step: number }> = {
  new:       { label: 'Not applied',          color: 'rgba(15,13,12,0.45)', bg: 'rgba(15,13,12,0.06)', step: 1 },
  has_idea:  { label: 'Has project idea',      color: '#9a6500',             bg: 'rgba(184,121,0,0.1)', step: 1 },
  applied:   { label: 'Application received',  color: '#eb4511',             bg: 'rgba(235,69,17,0.1)', step: 2 },
  scheduled: { label: 'Session scheduled',     color: '#007a4a',             bg: 'rgba(0,122,74,0.1)',  step: 3 },
  completed: { label: 'Review complete',       color: '#005fa3',             bg: 'rgba(0,95,163,0.1)',  step: 4 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const router = useRouter();
  const signOut = useSignOut();
  const [data,    setData]    = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await api.student.dashboard() as any;
        const raw = res?.data ?? res;
        const stateMap: Record<number, State> = { 1:'new', 2:'has_idea', 3:'applied', 4:'scheduled', 5:'completed' };
        const profile = raw?.profile ?? {};
        setData({
          full_name:   profile.full_name ?? '',
          email:       profile.email ?? '',
          profile_completion: profile.profile_completion ?? 0,
          state:       stateMap[raw?.state as number] ?? 'new',
          project: raw?.active_idea
            ? { name: raw.active_idea.project_name, tech_stack: raw.active_idea.tech_stack }
            : raw?.application
            ? { name: raw.application.project_name, tech_stack: raw.application.tech_stack }
            : undefined,
          application: raw?.application ? {
            id:           raw.application.id,
            submitted_at: raw.application.submitted_at,
            payment_at:   raw.application.payment_at,
            session_date: raw.application.reviewer_assignments?.[0]?.session_date,
            score: raw.credential?.scores ? {
              total:           raw.credential.scores.final_score ?? raw.credential.scores.total_score,
              technical_depth: raw.credential.scores.technical_depth,
              communication:   raw.credential.scores.communication,
              reproducibility: raw.credential.scores.reproducibility,
              originality:     raw.credential.scores.originality,
              passed:          raw.credential.scores.passed,
            } : undefined,
          } : undefined,
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) router.push('/dashboard/auth');
        else setError((e as any)?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ width: '200px', height: '100px', backgroundColor: 'rgba(15,13,12,0.04)', border: BORDER }} />
          ))}
        </div>
      </div>
    </div>
  );

  if (error || !data) return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '16px', color: 'rgba(15,13,12,0.5)', marginBottom: '20px' }}>{error || 'Something went wrong.'}</p>
        <button onClick={() => window.location.reload()} style={{ padding: '9px 24px', backgroundColor: '#eb4511', color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', fontFamily: FONT }}>
          Try again
        </button>
      </div>
    </div>
  );

  const firstName = data.full_name?.split(' ')[0] || 'there';
  const meta = STATE_META[data.state];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: BG, fontFamily: FONT }}>

      {/* ── Navbar ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(250,247,242,0.94)', backdropFilter: 'blur(14px)', borderBottom: BORDER }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 40px', height: '58px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="26" height="26" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="21" r="20" fill="#eb4511"/></svg>
            <span style={{ fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em', color: '#0f0d0c' }}>Orcred</span>
          </div>
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <NavLink href="/dashboard/student" active>Dashboard</NavLink>
            <NavLink href="/dashboard/student/profile">Profile</NavLink>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#eb4511', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{(firstName[0] || 'S').toUpperCase()}</span>
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f0d0c', lineHeight: 1.2 }}>{data.full_name || 'Student'}</div>
              <div style={{ fontSize: '11px', color: 'rgba(15,13,12,0.4)', lineHeight: 1.2 }}>{data.email}</div>
            </div>
            <button onClick={signOut} style={{ marginLeft: '8px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#eb4511', background: 'transparent', border: '1px solid #eb4511', borderRadius: '6px', cursor: 'pointer', fontFamily: FONT }}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '36px 40px 80px' }}>

        {/* Page title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.03em', color: '#0f0d0c', margin: 0 }}>
            Welcome back, {firstName}.
          </h1>
          <span style={{ fontSize: '12px', fontWeight: 600, padding: '5px 12px', backgroundColor: meta.bg, color: meta.color, borderRadius: '4px' }}>
            {meta.label}
          </span>
        </div>

        {/* ── 4 Stat cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <StatCard
            icon="📋"
            label="Application Status"
            value={meta.label}
            sub={`Step ${meta.step} of 4`}
            accent="#eb4511"
            small
          />
          <StatCard
            icon="💡"
            label="Project"
            value={data.project?.name ?? 'None yet'}
            sub={data.project?.tech_stack ?? 'Submit to get started'}
            accent="#9a6500"
            small
          />
          <StatCard
            icon="📅"
            label={data.state === 'scheduled' ? 'Session Date' : data.state === 'applied' ? 'Submitted' : data.state === 'completed' ? 'Score' : 'Next Step'}
            value={
              data.state === 'completed' && data.application?.score
                ? `${data.application.score.total}/100`
                : data.state === 'scheduled' && data.application?.session_date
                ? new Date(data.application.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : data.state === 'applied' && data.application?.submitted_at
                ? new Date(data.application.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : 'Apply now'
            }
            sub={
              data.state === 'completed' && data.application?.score
                ? data.application.score.passed ? '✓ Passed' : 'Not passed'
                : data.state === 'scheduled' ? '45-min live review'
                : data.state === 'applied' ? 'Under review'
                : 'Get verified'
            }
            accent="#007a4a"
            small
          />
          <StatCard
            icon="👤"
            label="Profile"
            value={`${data.profile_completion}%`}
            sub={data.profile_completion === 100 ? 'Complete' : `${4 - Math.round(data.profile_completion / 25)} fields missing`}
            accent="#005fa3"
            small
          />
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '16px', alignItems: 'start' }}>

          {/* ── LEFT: main content ── */}
          <div style={{ backgroundColor: '#fff', border: BORDER }}>

            {/* ── STATE 1/2: not applied ── */}
            {(data.state === 'new' || data.state === 'has_idea') && (
              <div style={{ padding: '32px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(15,13,12,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Get started
                </p>
                <h2 style={{ fontSize: '22px', fontWeight: 400, letterSpacing: '-0.02em', color: '#0f0d0c', marginBottom: '10px' }}>
                  Ready to earn your credential?
                </h2>
                <p style={{ fontSize: '14px', color: 'rgba(15,13,12,0.55)', lineHeight: 1.8, marginBottom: '28px', maxWidth: '500px' }}>
                  Submit your project, walk through your decisions in a live 45-minute review with a senior engineer, and earn a verifiable credential that proves you can build.
                </p>

                {data.project && (
                  <div style={{ padding: '18px 20px', border: BORDER, marginBottom: '24px', backgroundColor: BG }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(15,13,12,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Your project</p>
                    <p style={{ fontSize: '16px', fontWeight: 500, color: '#0f0d0c', marginBottom: '3px', letterSpacing: '-0.01em' }}>{data.project.name}</p>
                    <p style={{ fontSize: '12px', color: 'rgba(15,13,12,0.45)' }}>{data.project.tech_stack}</p>
                  </div>
                )}

                <Link href="/get-verified" style={{
                  display: 'inline-flex', alignItems: 'center', padding: '10px 28px',
                  backgroundColor: '#eb4511', color: '#fff', borderRadius: '50px',
                  fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                  textDecoration: 'none', transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                >
                  Apply for Verification →
                </Link>

                {/* Steps table */}
                <div style={{ marginTop: '36px', borderTop: '1px solid rgba(15,13,12,0.07)', paddingTop: '28px' }}>
                  {[
                    { num: '01', title: 'Submit your project',  body: 'Loom walkthrough, tech stack, your hardest decision, what broke.' },
                    { num: '02', title: 'Live technical review', body: '45 min with a senior engineer who has read every line.' },
                    { num: '03', title: 'Credential issued',    body: 'Pass and get your verified Orcred badge within 24 hours.' },
                  ].map((s, i) => (
                    <StepRow key={i} num={s.num} title={s.title} body={s.body} done={false} last={i === 2} />
                  ))}
                </div>
              </div>
            )}

            {/* ── STATE 3: applied ── */}
            {data.state === 'applied' && (
              <div style={{ padding: '32px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(15,13,12,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Application progress
                </p>
                {data.project && (
                  <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 400, letterSpacing: '-0.02em', color: '#0f0d0c', marginBottom: '4px' }}>
                      {data.project.name}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'rgba(15,13,12,0.45)' }}>{data.project.tech_stack}</p>
                  </div>
                )}
                {[
                  { num: '01', title: 'Application submitted', body: data.application?.submitted_at ? new Date(data.application.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Submitted', done: true },
                  { num: '02', title: 'Reviewed by our team',  body: '2–3 business days', done: false },
                  { num: '03', title: 'Slot confirmed via email', body: 'Payment collected after acceptance', done: false },
                  { num: '04', title: 'Live review session',   body: '45–60 minutes on camera', done: false },
                  { num: '05', title: 'Credential issued',     body: 'Within 24 hrs of passing', done: false },
                ].map((s, i) => (
                  <StepRow key={i} num={s.num} title={s.title} body={s.body} done={s.done} last={i === 4} />
                ))}
              </div>
            )}

            {/* ── STATE 4: scheduled ── */}
            {data.state === 'scheduled' && (
              <div style={{ padding: '32px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#007a4a', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  Session confirmed
                </p>
                {data.application?.session_date && (
                  <div style={{ marginBottom: '32px' }}>
                    <p style={{ fontSize: '12px', color: 'rgba(15,13,12,0.4)', marginBottom: '6px' }}>Your session</p>
                    <h2 style={{ fontSize: '28px', fontWeight: 400, letterSpacing: '-0.03em', color: '#0f0d0c', margin: '0 0 24px' }}>
                      {new Date(data.application.session_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </h2>
                    <Link href="#" style={{
                      display: 'inline-flex', alignItems: 'center', padding: '10px 28px',
                      backgroundColor: '#eb4511', color: '#fff', borderRadius: '50px',
                      fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                      textDecoration: 'none', transition: 'opacity 0.15s',
                    }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                    >
                      Join Session →
                    </Link>
                  </div>
                )}

                <div style={{ borderTop: '1px solid rgba(15,13,12,0.07)', paddingTop: '24px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(15,13,12,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '16px' }}>Progress</p>
                  {[
                    { num: '01', title: 'Application submitted',       body: 'Done', done: true },
                    { num: '02', title: 'Reviewed & accepted',          body: 'Done', done: true },
                    { num: '03', title: 'Session scheduled',            body: data.application?.session_date ? new Date(data.application.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '', done: true },
                    { num: '04', title: 'Live review',                  body: 'Upcoming', done: false },
                    { num: '05', title: 'Credential issued',            body: 'After passing', done: false },
                  ].map((s, i) => (
                    <StepRow key={i} num={s.num} title={s.title} body={s.body} done={s.done} last={i === 4} />
                  ))}
                </div>
              </div>
            )}

            {/* ── STATE 5: completed ── */}
            {data.state === 'completed' && (
              <div style={{ padding: '32px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: data.application?.score?.passed ? '#007a4a' : 'rgba(15,13,12,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  {data.application?.score?.passed ? 'Credential earned' : 'Review complete'}
                </p>

                {data.application?.score && (
                  <>
                    {/* Big score */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '80px', fontWeight: 200, letterSpacing: '-0.05em', lineHeight: 1, color: '#0f0d0c' }}>
                        {data.application.score.total}
                      </span>
                      <span style={{ fontSize: '24px', color: '#eb4511', marginBottom: '12px', fontWeight: 300 }}>/100</span>
                    </div>

                    <p style={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.01em', color: '#0f0d0c', marginBottom: '8px' }}>
                      {data.application.score.passed ? "You've earned your Orcred credential." : 'Review complete. Keep building.'}
                    </p>
                    <p style={{ fontSize: '13px', color: 'rgba(15,13,12,0.5)', lineHeight: 1.8, marginBottom: '28px', maxWidth: '440px' }}>
                      {data.application.score.passed
                        ? 'Your credential is live and independently verifiable. Share it on LinkedIn or download the certificate.'
                        : 'The bar is deliberately high. Review the feedback, keep building, and apply again when ready.'}
                    </p>

                    {data.application.score.passed && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '36px' }}>
                        <ActionBtn primary>Download Certificate</ActionBtn>
                        <ActionBtn>Add to LinkedIn</ActionBtn>
                      </div>
                    )}

                    {/* Score breakdown bars */}
                    <div style={{ borderTop: '1px solid rgba(15,13,12,0.07)', paddingTop: '24px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(15,13,12,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '20px' }}>Score breakdown</p>
                      {[
                        { label: 'Technical Depth',  score: data.application.score.technical_depth,  weight: 35 },
                        { label: 'Communication',    score: data.application.score.communication,    weight: 25 },
                        { label: 'Reproducibility',  score: data.application.score.reproducibility,  weight: 20 },
                        { label: 'Originality',      score: data.application.score.originality,      weight: 20 },
                      ].map(d => (
                        <div key={d.label} style={{ marginBottom: '18px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                            <span style={{ fontSize: '13px', color: 'rgba(15,13,12,0.6)', fontWeight: 500 }}>
                              {d.label} <span style={{ fontWeight: 400, color: 'rgba(15,13,12,0.3)' }}>·{d.weight}%</span>
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f0d0c' }}>{d.score}</span>
                          </div>
                          <div style={{ height: '4px', backgroundColor: 'rgba(15,13,12,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${d.score}%`, backgroundColor: '#eb4511', borderRadius: '2px', transition: 'width 1s ease' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

            {/* Profile completion card */}
            <div style={{ backgroundColor: '#fff', border: BORDER, padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f0d0c', letterSpacing: '-0.01em' }}>Profile</span>
                <Link href="/dashboard/student/profile"
                  style={{ fontSize: '12px', color: '#eb4511', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                >
                  Edit →
                </Link>
              </div>
              <div style={{ fontSize: '40px', fontWeight: 200, letterSpacing: '-0.04em', color: '#0f0d0c', lineHeight: 1, marginBottom: '8px' }}>
                {data.profile_completion}<span style={{ fontSize: '18px', color: '#eb4511', marginLeft: '2px', fontWeight: 300 }}>%</span>
              </div>
              <div style={{ height: '4px', backgroundColor: 'rgba(15,13,12,0.07)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ height: '100%', width: `${data.profile_completion}%`, backgroundColor: '#eb4511', borderRadius: '2px', transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(15,13,12,0.4)' }}>
                {data.profile_completion === 100 ? 'Complete ✓' : `${4 - Math.round(data.profile_completion / 25)} fields remaining`}
              </div>
            </div>

            {/* State-specific info panel */}
            {(data.state === 'new' || data.state === 'has_idea') && (
              <InfoPanel title="What you'll need">
                {['A Loom walkthrough of your project (5–10 min).', 'Your GitHub repo link.', 'The hardest decision you made while building.', 'What broke and how you fixed it.'].map((t, i) => (
                  <InfoItem key={i} text={t} />
                ))}
              </InfoPanel>
            )}

            {data.state === 'applied' && (
              <InfoPanel title="What happens next">
                {['Our team reviews your Loom and written answers.', 'We confirm your slot and assign a reviewer.', 'Payment of ₹2,000 is collected after acceptance.', 'You\'ll receive a calendar invite and prep guide.'].map((t, i) => (
                  <InfoItem key={i} text={t} />
                ))}
              </InfoPanel>
            )}

            {data.state === 'scheduled' && (
              <InfoPanel title="Prep checklist">
                {['Government photo ID ready to show.', 'GitHub repo open and browseable.', 'Loom walkthrough queued.', 'Ready to explain every decision — not just what, but why.', 'Stable internet. Quiet space.'].map((t, i) => (
                  <InfoItem key={i} text={t} check />
                ))}
              </InfoPanel>
            )}

            {data.state === 'completed' && data.application?.score?.passed && (
              <InfoPanel title="Share your credential">
                {['Add it to your LinkedIn profile.', 'Include the verification URL in your resume.', 'Share it directly from orcred.com/verify.'].map((t, i) => (
                  <InfoItem key={i} text={t} check />
                ))}
              </InfoPanel>
            )}

            {/* Orcred branding */}
            <div style={{ padding: '16px 18px', border: BORDER, backgroundColor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'rgba(15,13,12,0.35)' }}>orcred.com</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="16" height="16" viewBox="0 0 42 42" fill="none"><circle cx="21" cy="21" r="20" fill="#eb4511"/></svg>
                <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '-0.01em', color: '#0f0d0c' }}>Orcred</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── Small components ──────────────────────────────────────────────────────────

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link href={href} style={{
      padding: '6px 14px',
      fontSize: '13px', fontWeight: active ? 600 : 400,
      color: active ? '#0f0d0c' : 'rgba(15,13,12,0.45)',
      backgroundColor: active ? 'rgba(15,13,12,0.07)' : 'transparent',
      borderRadius: '6px', textDecoration: 'none', letterSpacing: '-0.01em',
      transition: 'background-color 0.15s, color 0.15s',
    }}
      onMouseEnter={e => !active && ((e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(15,13,12,0.04)')}
      onMouseLeave={e => !active && ((e.currentTarget as HTMLElement).style.backgroundColor = 'transparent')}
    >
      {children}
    </Link>
  );
}

function StatCard({ icon, label, value, sub, accent, small }: {
  icon: string; label: string; value: string | number; sub: string; accent: string; small?: boolean;
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
        cursor: 'default', overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px', lineHeight: 1 }}>{icon}</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.2 }}>
          <path d="M2 12L12 2M12 2H5M12 2V9" stroke="#0f0d0c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(15,13,12,0.45)', marginBottom: '6px', letterSpacing: '-0.01em' }}>{label}</p>
      <p style={{ fontSize: small ? '20px' : '40px', fontWeight: small ? 500 : 200, letterSpacing: small ? '-0.01em' : '-0.04em', color: '#0f0d0c', lineHeight: 1.15, margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</p>
      <p style={{ fontSize: '11px', color: 'rgba(15,13,12,0.38)', margin: 0 }}>{sub}</p>
    </div>
  );
}

function StepRow({ num, title, body, done, last }: { num: string; title: string; body: string; done: boolean; last: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '16px', paddingTop: '18px', paddingBottom: '18px', borderBottom: last ? 'none' : '1px solid rgba(15,13,12,0.06)' }}>
      <div style={{
        width: '34px', height: '34px', flexShrink: 0,
        backgroundColor: done ? '#eb4511' : 'transparent',
        border: done ? 'none' : '1.5px solid rgba(15,13,12,0.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: 700,
        color: done ? '#fff' : 'rgba(15,13,12,0.28)',
        borderRadius: '2px',
      }}>
        {done ? '✓' : num}
      </div>
      <div style={{ paddingTop: '3px' }}>
        <div style={{ fontSize: '14px', fontWeight: done ? 600 : 400, color: done ? '#0f0d0c' : 'rgba(15,13,12,0.45)', marginBottom: '3px', letterSpacing: '-0.01em' }}>
          {title}
        </div>
        <div style={{ fontSize: '12px', color: done ? '#eb4511' : 'rgba(15,13,12,0.32)', fontWeight: done ? 500 : 400 }}>
          {body}
        </div>
      </div>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#fff', border: BORDER, padding: '20px' }}>
      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0f0d0c', marginBottom: '16px', letterSpacing: '-0.01em' }}>{title}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>{children}</div>
    </div>
  );
}

function InfoItem({ text, check }: { text: string; check?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <div style={{ width: '14px', height: '14px', backgroundColor: check ? 'rgba(235,69,17,0.1)' : '#eb4511', flexShrink: 0, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '2px' }}>
        {check
          ? <div style={{ width: '4px', height: '4px', backgroundColor: '#eb4511', borderRadius: '50%' }} />
          : <svg width="7" height="7" viewBox="0 0 7 7" fill="none"><polyline points="1,3.5 2.8,5.2 6,1.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        }
      </div>
      <span style={{ fontSize: '13px', color: 'rgba(15,13,12,0.58)', lineHeight: 1.75 }}>{text}</span>
    </div>
  );
}

function ActionBtn({ children, primary }: { children: React.ReactNode; primary?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '9px 22px',
        backgroundColor: primary ? (hov ? 'rgba(235,69,17,0.85)' : '#eb4511') : (hov ? 'rgba(15,13,12,0.05)' : '#fff'),
        color: primary ? '#fff' : '#0f0d0c',
        border: primary ? 'none' : BORDER,
        borderRadius: '50px',
        fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
        cursor: 'pointer', fontFamily: FONT, transition: 'background-color 0.15s',
      }}
    >
      {children}
    </button>
  );
}
