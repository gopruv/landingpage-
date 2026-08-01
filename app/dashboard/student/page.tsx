'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import RescheduleRequestForm, { isReschedulePending } from '@/components/shared/RescheduleRequestForm';
import PaymentSection from '@/components/student/PaymentSection';
import { formatTentativeSessionDisplay } from '@/lib/sessionDisplay';
import { getSessionJoinState } from '@/lib/sessionAccess';
import { isStudentApplyEnabled, WAITLIST_PATH } from '@/lib/platformGates';

// ── Types ─────────────────────────────────────────────────────────────────────

type State = 'new' | 'has_idea' | 'applied' | 'reviewer_assigned' | 'scheduled' | 'completed';

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
    assignment_id?: string;
    status?: string;
    utr_number?: string | null;
    workflow_stage?: string;
    status?: string;
    assignment_id?: string;
    proposed_session_notes?: string | null;
    proposed_session_at?: string | null;
    assignment_status?: string;
    score?: {
      total:           number;
      technical_depth: number;
      communication:   number;
      reproducibility: number;
      problem_solving:     number;
      passed:          boolean;
    };
  };
  credential?: {
    credential_id: string;
    credential_url: string;
    issued_at: string;
    linkedin_added: boolean;
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT   = 'Inter, system-ui, sans-serif';
const BG     = '#faf7f2';
const BORDER = '1px solid rgba(15,13,12,0.1)';

const STATE_META: Record<State, { label: string; color: string; bg: string; step: number }> = {
  new:               { label: 'Not applied',          color: 'rgba(15,13,12,0.45)', bg: 'rgba(15,13,12,0.06)', step: 1 },
  has_idea:          { label: 'Has project idea',      color: '#9a6500',             bg: 'rgba(184,121,0,0.1)', step: 1 },
  applied:           { label: 'Application received',  color: '#eb4511',             bg: 'rgba(235,69,17,0.1)', step: 2 },
  reviewer_assigned: { label: 'Reviewer assigned',     color: '#005fa3',             bg: 'rgba(0,95,163,0.1)',  step: 3 },
  scheduled:         { label: 'Session scheduled',     color: '#007a4a',             bg: 'rgba(0,122,74,0.1)',  step: 4 },
  completed:         { label: 'Review complete',       color: '#005fa3',             bg: 'rgba(0,95,163,0.1)',  step: 5 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const router = useRouter();
  const { ready, signOut } = useRequireAuth();
  const [data,    setData]    = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [copied,  setCopied]  = useState(false);

  const mapScore = (s: Record<string, unknown> | null | undefined) => {
    if (!s) return undefined;
    return {
      total:           (s.final_score ?? s.total_score) as number,
      technical_depth: s.technical_depth as number,
      communication:   s.communication as number,
      reproducibility: s.reproducibility as number,
      problem_solving:     s.problem_solving as number,
      passed:          s.passed as boolean,
    };
  };

  const loadDashboard = async () => {
    const res = await api.student.dashboard() as any;
    const raw = res?.data ?? res;
    const stateMap: Record<number, State> = {
      1: 'new',
      2: 'has_idea',
      3: 'applied',
      4: 'reviewer_assigned',
      5: 'scheduled',
      6: 'completed',
    };
    const assignment = raw?.application?.reviewer_assignments?.[0];
    const wf = raw?.application?.workflow_stage ?? assignment?.workflow_stage;
    const profile = raw?.profile ?? {};
    const scoreSource = raw?.application_score;
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
        session_date: assignment?.session_date,
        assignment_id: assignment?.id,
        status: raw?.application?.status,
        utr_number: raw?.application?.utr_number,
        workflow_stage: wf,
        status: raw.application.status,
        assignment_id: assignment?.id,
        proposed_session_notes: assignment?.proposed_session_notes,
        proposed_session_at: assignment?.proposed_session_at,
        assignment_status: assignment?.status,
        score: mapScore(scoreSource),
      } : undefined,
      credential: raw?.credential ? {
        credential_id:  raw.credential.credential_id,
        credential_url: raw.credential.credential_url,
        issued_at:      raw.credential.issued_at,
        linkedin_added: raw.credential.linkedin_added ?? false,
      } : undefined,
    });
  };

  useEffect(() => {
    (async () => {
      try {
        await loadDashboard();
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) router.push('/dashboard/auth');
        else setError((e as any)?.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const copyCredentialUrl = async () => {
    if (!data?.credential?.credential_url) return;
    await navigator.clipboard.writeText(data.credential.credential_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addToLinkedIn = async () => {
    if (!data?.credential) return;
    const issued = new Date(data.credential.issued_at);
    const url = new URL('https://www.linkedin.com/profile/add');
    url.searchParams.set('startTask', 'CERTIFICATION_NAME');
    url.searchParams.set('name', 'Orcred Verified');
    url.searchParams.set('organizationName', 'Orcred');
    url.searchParams.set('issueYear', String(issued.getFullYear()));
    url.searchParams.set('issueMonth', String(issued.getMonth() + 1));
    url.searchParams.set('certUrl', data.credential.credential_url);
    window.open(url.toString(), '_blank');
    try { await api.student.markLinkedIn(); } catch { /* non-fatal */ }
  };

  if (!ready) return null;

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
            sub={`Step ${meta.step} of 5`}
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
            label={data.state === 'scheduled' ? 'Session Date' : data.state === 'reviewer_assigned' ? 'Reviewer' : data.state === 'applied' ? 'Submitted' : data.state === 'completed' ? 'Score' : 'Next Step'}
            value={
              data.state === 'completed' && data.application?.score
                ? `${data.application.score.total}/100`
                : data.state === 'scheduled' && data.application?.session_date
                ? new Date(data.application.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : data.state === 'reviewer_assigned' && data.application?.workflow_stage === 'session_proposed'
                ? 'Tentative'
                : data.state === 'reviewer_assigned'
                ? (data.application?.workflow_stage === 'under_review' ? 'Under review' : 'Assigned')
                : data.state === 'applied' && data.application?.submitted_at
                ? new Date(data.application.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                : 'Apply now'
            }
            sub={
              data.state === 'completed' && data.application?.score
                ? data.application.score.passed ? '✓ Passed' : 'Not passed'
                : data.state === 'scheduled' ? '45-min live review'
                : data.state === 'reviewer_assigned' && data.application?.workflow_stage === 'session_proposed'
                ? (formatTentativeSessionDisplay(data.application.proposed_session_notes) ?? 'Awaiting admin approval')
                : data.state === 'reviewer_assigned'
                ? (data.application?.workflow_stage === 'under_review'
                  ? 'Thanks for your patience'
                  : 'Your reviewer is preparing')
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

                {isStudentApplyEnabled() ? (
                  <Link href="/dashboard/student/apply" style={{
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
                ) : (
                  <Link href={WAITLIST_PATH} style={{
                    display: 'inline-flex', alignItems: 'center', padding: '10px 28px',
                    backgroundColor: '#eb4511', color: '#fff', borderRadius: '50px',
                    fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                    textDecoration: 'none', transition: 'opacity 0.15s',
                  }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                  >
                    Join the waitlist →
                  </Link>
                )}

                {/* Steps table */}
                <div style={{ marginTop: '36px', borderTop: '1px solid rgba(15,13,12,0.07)', paddingTop: '28px' }}>
                  {[
                    { num: '01', title: 'Submit your project',  body: 'Loom walkthrough, tech stack, your hardest decision, what broke.' },
                    { num: '02', title: 'Live technical review', body: '40 min with a senior engineer who has read every line.' },
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
                {data.application?.id && (
                  <PaymentSection
                    applicationId={data.application.id}
                    status={data.application.status}
                    paymentAt={data.application.payment_at}
                    utrNumber={data.application.utr_number}
                    onSuccess={loadDashboard}
                  />
                )}
              </div>
            )}

            {/* ── STATE 3b: reviewer assigned ── */}
            {data.state === 'reviewer_assigned' && (
              <div style={{ padding: '32px' }}>
                <p style={{ fontSize: '11px', fontWeight: 600, color: '#005fa3', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '14px' }}>
                  {data.application?.workflow_stage === 'under_review' ? 'Project under review' : 'You have a reviewer!'}
                </p>
                {data.project && (
                  <div style={{ marginBottom: '28px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 400, letterSpacing: '-0.02em', color: '#0f0d0c', marginBottom: '4px' }}>
                      {data.project.name}
                    </h2>
                    <p style={{ fontSize: '13px', color: 'rgba(15,13,12,0.45)' }}>{data.project.tech_stack}</p>
                  </div>
                )}
                <p style={{ fontSize: '14px', color: 'rgba(15,13,12,0.55)', lineHeight: 1.8, marginBottom: '28px', maxWidth: '520px' }}>
                  {data.application?.workflow_stage === 'under_review'
                    ? 'Your project is under extended review. Thanks for your patience — we will email you when there is an update.'
                    : data.application?.workflow_stage === 'session_proposed'
                    ? 'Your reviewer submitted preferred session times. Our team is confirming the final slot — you will get an email once it is scheduled.'
                    : 'A senior engineer has been assigned to review your application. Check this dashboard for updates. They will propose a session from your preferred availability.'}
                </p>
                {data.application?.workflow_stage === 'session_proposed' && formatTentativeSessionDisplay(data.application.proposed_session_notes) && (
                  <div style={{ marginBottom: 24, padding: '14px 16px', background: 'rgba(184,121,0,0.08)', border: '1px solid rgba(184,121,0,0.2)' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a6500', margin: '0 0 6px' }}>
                      Tentative times (not confirmed yet)
                    </p>
                    <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.65)', margin: 0, lineHeight: 1.55 }}>
                      {formatTentativeSessionDisplay(data.application.proposed_session_notes)}
                    </p>
                  </div>
                )}
                {[
                  { num: '01', title: 'Application submitted', body: data.application?.submitted_at ? new Date(data.application.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Done', done: true },
                  { num: '02', title: 'Reviewer assigned', body: 'In progress', done: true },
                  { num: '03', title: 'Session scheduling', body: data.application?.workflow_stage === 'session_proposed' ? 'Awaiting admin approval' : 'Reviewer selecting time', done: false },
                  { num: '04', title: 'Live review session', body: '45–60 minutes on camera', done: false },
                  { num: '05', title: 'Credential issued', body: 'Within 24 hrs of passing', done: false },
                ].map((s, i) => (
                  <StepRow key={i} num={s.num} title={s.title} body={s.body} done={s.done} last={i === 4} />
                ))}

                {data.application?.workflow_stage === 'session_proposed' && data.application?.id && (
                  <RescheduleRequestForm
                    role="student"
                    applicationId={data.application.id}
                    reschedulePending={isReschedulePending(data.application.proposed_session_notes)}
                    onSuccess={loadDashboard}
                  />
                )}
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
                    <Link href={data.application.assignment_id ? `/dashboard/session/${data.application.assignment_id}?as=student` : '#'} style={{
                      display: 'inline-flex', alignItems: 'center', padding: '10px 28px',
                      backgroundColor: data.application.assignment_id && getSessionJoinState(data.application.session_date).canJoin ? '#eb4511' : 'rgba(15,13,12,0.2)',
                      color: '#fff', borderRadius: '50px',
                      fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                      textDecoration: 'none', transition: 'opacity 0.15s',
                      pointerEvents: data.application.assignment_id ? 'auto' : 'none',
                    }}
                      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.8')}
                      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
                    >
                      Join Session →
                    </Link>
                    <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.45)', marginTop: 12, maxWidth: 420 }}>
                      {getSessionJoinState(data.application.session_date).message}
                    </p>

                    <RescheduleRequestForm
                      role="student"
                      applicationId={data.application.id}
                      reschedulePending={isReschedulePending(data.application.proposed_session_notes)}
                      onSuccess={loadDashboard}
                    />
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

                    {data.application.score.passed && data.credential && (
                      <>
                        <div style={{ marginBottom: 20, padding: '14px 16px', background: 'rgba(235,69,17,0.05)', border: '1px solid rgba(235,69,17,0.15)' }}>
                          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#eb4511', marginBottom: 6 }}>Credential ID</p>
                          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{data.credential.credential_id}</p>
                          <a href={data.credential.credential_url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#eb4511', wordBreak: 'break-all' }}>
                            {data.credential.credential_url}
                          </a>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '36px', flexWrap: 'wrap' }}>
                          <ActionBtn primary onClick={copyCredentialUrl}>{copied ? 'Copied ✓' : 'Copy verify link'}</ActionBtn>
                          <ActionBtn onClick={() => window.open(data.credential!.credential_url, '_blank')}>View public page</ActionBtn>
                          <ActionBtn onClick={addToLinkedIn}>
                            {data.credential.linkedin_added ? 'Add to LinkedIn again' : 'Add to LinkedIn'}
                          </ActionBtn>
                        </div>
                      </>
                    )}

                    {/* Score breakdown bars */}
                    <div style={{ borderTop: '1px solid rgba(15,13,12,0.07)', paddingTop: '24px' }}>
                      <p style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(15,13,12,0.38)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '20px' }}>Score breakdown</p>
                      {[
                        { label: 'Technical Depth',  score: data.application.score.technical_depth,  weight: 35 },
                        { label: 'Communication',    score: data.application.score.communication,    weight: 25 },
                        { label: 'Reproducibility',  score: data.application.score.reproducibility,  weight: 20 },
                        { label: 'Problem solving',  score: data.application.score.problem_solving,  weight: 20 },
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

function ActionBtn({ children, primary, onClick }: { children: React.ReactNode; primary?: boolean; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
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
