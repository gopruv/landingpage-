'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { SCORE_CRITERIA, computeWeightedTotal, type CriterionKey, type CriterionRating } from '@/lib/scoring';
import { useRequireReviewer } from '@/lib/useRequireReviewer';
import ReviewerGuide from '@/components/reviewer/ReviewerGuide';
import AssignmentTaskList from '@/components/reviewer/AssignmentTaskList';
import SubmissionReviewFlow from '@/components/reviewer/SubmissionReviewFlow';
import ReviewerHeader from '@/components/reviewer/ReviewerHeader';
import { type WorkflowTask } from '@/lib/workflowTasks';
import { formatTentativeSessionDisplay } from '@/lib/sessionDisplay';
import { getSessionJoinState } from '@/lib/sessionAccess';

const FONT = 'Inter, system-ui, sans-serif';
const BORDER = '1px solid rgba(15,13,12,0.1)';

interface Assignment {
  id: string;
  application_id: string;
  assigned_at: string;
  session_date: string | null;
  status: string;
  daily_room_url: string | null;
  workflow_stage?: string;
  student_code?: string;
  proposed_session_notes?: string | null;
  student_name?: string | null;
  student_email?: string | null;
  applications: {
    id: string;
    project_name: string;
    tech_stack: string;
    submitted_at: string;
    status: string;
    github_url?: string;
    loom_url?: string;
  } | null;
}

interface SubmissionDetail {
  application: {
    id: string;
    project_name: string;
    tech_stack: string;
    github_url: string;
    loom_url: string;
    build_decision_1: string;
    build_decision_2: string;
    build_decision_3: string;
    what_broke: string;
    ai_tools_used: string;
    submitted_at: string;
    availability?: Array<{ date: string; time: string; timezone: string; description?: string }>;
    workflow_stage?: string;
  };
  assignment: {
    id: string;
    session_date: string | null;
    daily_room_url: string | null;
    workflow_stage?: string;
    student_code?: string;
    proposed_session_notes?: string | null;
  };
  student?: { full_name: string; email: string } | null;
  tasks?: WorkflowTask[];
  can_submit_score: boolean;
  score_submitted: boolean;
  score_pending_admin?: boolean;
}

type UiStatus = 'prep' | 'accepted' | 'scheduling' | 'scheduled' | 'session_done' | 'scored' | 'completed';

function normalizeApp(raw: Assignment['applications']): Assignment['applications'] {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

function uiStatus(a: Assignment): UiStatus {
  const stage = a.workflow_stage ?? 'assigned';
  const app = normalizeApp(a.applications);
  if (a.status === 'completed' || app?.status === 'completed') return 'completed';
  if (stage === 'score_submitted' || stage === 'score_approved') return 'scored';
  if (stage === 'session_done') return 'session_done';
  if (stage === 'session_proposed') return 'scheduling';
  if (stage === 'session_approved' || a.status === 'scheduled' || app?.status === 'scheduled') return 'scheduled';
  if (stage === 'accepted') return 'accepted';
  return 'prep';
}

const STATUS_LABELS: Record<UiStatus, { label: string; color: string; bg: string }> = {
  prep:        { label: 'Review application', color: '#005fa3', bg: 'rgba(0,95,163,0.1)' },
  accepted:    { label: 'Accepted — schedule session', color: '#9a6500', bg: 'rgba(184,121,0,0.12)' },
  scheduling:  { label: 'Session proposed', color: '#9a6500', bg: 'rgba(184,121,0,0.12)' },
  scheduled:   { label: 'Session scheduled', color: '#007a4a', bg: 'rgba(0,122,74,0.1)' },
  session_done:{ label: 'Submit scores', color: '#eb4511', bg: 'rgba(235,69,17,0.1)' },
  scored:      { label: 'Awaiting admin', color: '#005fa3', bg: 'rgba(0,95,163,0.1)' },
  completed:   { label: 'Completed', color: 'rgba(15,13,12,0.5)', bg: 'rgba(15,13,12,0.06)' },
};

const DEFAULT_RATINGS = (): Record<CriterionKey, CriterionRating> => ({
  technical_depth:  { value: 3, excluded: false },
  communication:    { value: 3, excluded: false },
  reproducibility:  { value: 3, excluded: false },
  problem_solving:      { value: 3, excluded: false },
});

export default function ReviewerDashboard() {
  const { ready, signOut } = useRequireReviewer();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SubmissionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [ratings, setRatings] = useState<Record<CriterionKey, CriterionRating>>(DEFAULT_RATINGS);
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [workflowTasks, setWorkflowTasks] = useState<WorkflowTask[]>([]);

  const fetchWorkflowTasks = useCallback(async () => {
    try {
      const res = await api.reviewer.workflowTasks() as { data?: WorkflowTask[] };
      setWorkflowTasks(res?.data ?? []);
    } catch {
      setWorkflowTasks([]);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    setAssignmentsLoading(true);
    try {
      const res = await api.reviewer.assignments() as { data?: Assignment[] };
      const rows = (res?.data ?? []).map((a) => ({
        ...a,
        applications: normalizeApp(a.applications),
      }));
      setAssignments(rows);
      setError('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load assignments');
    } finally {
      setAssignmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready) {
      fetchAssignments();
      fetchWorkflowTasks();
    }
  }, [ready, fetchAssignments, fetchWorkflowTasks]);

  const refreshSubmission = async () => {
    if (!selectedId) return;
    try {
      const res = await api.reviewer.submission(selectedId) as { data?: SubmissionDetail };
      setDetail(res?.data ?? null);
      await fetchWorkflowTasks();
      await fetchAssignments();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to refresh');
    }
  };

  const openSubmission = async (appId: string) => {
    setSelectedId(appId);
    setDetailLoading(true);
    setScoring(false);
    setError('');
    try {
      const res = await api.reviewer.submission(appId) as { data?: SubmissionDetail };
      setDetail(res?.data ?? null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load submission');
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalScore = computeWeightedTotal(ratings);
  const activeCount = SCORE_CRITERIA.filter((c) => !ratings[c.key].excluded).length;

  const handleSubmitScore = async () => {
    if (!detail || !selectedId) return;
    if (activeCount === 0) {
      setError('Rate at least one criterion');
      return;
    }
    if (feedbackNotes.trim().length < 10) {
      setError('Add brief review notes (min 10 characters)');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.reviewer.submitScore({
        application_id: selectedId,
        ratings,
        feedback_notes: feedbackNotes,
        confirm: true,
      });
      alert('Score submitted — pending admin review.');
      setSelectedId(null);
      setDetail(null);
      setScoring(false);
      await fetchAssignments();
      await fetchWorkflowTasks();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Score submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  const goToDashboard = () => {
    setSelectedId(null);
    setDetail(null);
    setScoring(false);
    fetchWorkflowTasks();
  };

  if (scoring && detail) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#faf7f2', fontFamily: FONT }}>
        <ReviewerHeader
          subtitle={`Score · ${detail.application.project_name}`}
          onSignOut={signOut}
          onDashboardClick={goToDashboard}
        />
        <div style={{ borderBottom: BORDER, padding: '16px 32px', backgroundColor: '#fff' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <button onClick={() => setScoring(false)} style={{ marginBottom: 8, fontSize: 13, color: 'rgba(15,13,12,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back to application</button>
            <p style={{ color: 'rgba(15,13,12,0.5)', margin: 0, fontSize: 14 }}>
              Total: {totalScore} {totalScore >= 60 ? '(PASS)' : '(FAIL)'}
            </p>
          </div>
        </div>
        <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
          {SCORE_CRITERIA.map((c) => (
            <div key={c.key} style={{ padding: 16, border: BORDER, backgroundColor: '#fff', marginBottom: 12, opacity: ratings[c.key].excluded ? 0.55 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontWeight: 600 }}>{c.label}</label>
                <label style={{ fontSize: 12, display: 'flex', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={ratings[c.key].excluded} onChange={(e) => setRatings((r) => ({ ...r, [c.key]: { ...r[c.key], excluded: e.target.checked } }))} />
                  N/A
                </label>
              </div>
              {!ratings[c.key].excluded && (
                <>
                  <input type="range" min={0} max={5} step={1} value={ratings[c.key].value}
                    onChange={(e) => setRatings((r) => ({ ...r, [c.key]: { ...r[c.key], value: parseInt(e.target.value, 10) } }))}
                    style={{ width: '100%', accentColor: '#eb4511' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(15,13,12,0.45)' }}>
                    <span>0 — weak</span><strong>{ratings[c.key].value}/5</strong><span>5 — strong</span>
                  </div>
                </>
              )}
            </div>
          ))}
          <textarea value={feedbackNotes} onChange={(e) => setFeedbackNotes(e.target.value)}
            placeholder="Summary feedback for the student (min 10 chars)"
            style={{ width: '100%', minHeight: 100, marginBottom: 16, padding: 12, fontFamily: FONT }} />
          {error && <p style={{ color: '#ba1a1a', fontSize: 13 }}>{error}</p>}
          <button disabled={submitting || activeCount === 0} onClick={handleSubmitScore}
            style={{ width: '100%', padding: 14, background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {submitting ? 'Submitting…' : `Submit — ${totalScore}/100`}
          </button>
        </main>
      </div>
    );
  }

  if (selectedId) {
    const reviewSubtitle = detail
      ? `${detail.assignment.student_code ?? 'Candidate'} · ${detail.application.project_name}`
      : 'Loading application…';
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#faf7f2', fontFamily: FONT }}>
        <ReviewerHeader
          subtitle={reviewSubtitle}
          onSignOut={signOut}
          onDashboardClick={goToDashboard}
        />
        {detailLoading || !detail ? (
          <p style={{ padding: 40, color: 'rgba(15,13,12,0.45)', textAlign: 'center' }}>Loading submission…</p>
        ) : (
          <SubmissionReviewFlow
            assignmentId={detail.assignment.id}
            applicationId={detail.application.id}
            studentCode={detail.assignment.student_code ?? 'STU'}
            workflowStage={detail.assignment.workflow_stage ?? 'assigned'}
            application={detail.application}
            tasks={detail.tasks ?? []}
            canSubmitScore={detail.can_submit_score}
            scoreSubmitted={detail.score_submitted}
            proposedSessionNotes={detail.assignment.proposed_session_notes}
            onBack={() => { setSelectedId(null); setDetail(null); fetchWorkflowTasks(); }}
            onComplete={() => { setSelectedId(null); setDetail(null); fetchAssignments(); fetchWorkflowTasks(); }}
            onRefresh={refreshSubmission}
            onStartScore={() => { setRatings(DEFAULT_RATINGS()); setFeedbackNotes(''); setScoring(true); }}
          />
        )}
        {error && <p style={{ color: '#ba1a1a', fontSize: 13, textAlign: 'center', padding: 16 }}>{error}</p>}
      </div>
    );
  }

  const activeAssignments = assignments.filter((a) => normalizeApp(a.applications));
  const pendingTasks = workflowTasks.filter((t) => t.status !== 'done' && t.status !== 'cancelled');

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf7f2', fontFamily: FONT }}>
      <ReviewerHeader
        subtitle={`${activeAssignments.length} active assignment${activeAssignments.length === 1 ? '' : 's'}${pendingTasks.length > 0 ? ` · ${pendingTasks.length} open task${pendingTasks.length === 1 ? '' : 's'}` : ''}`}
        onSignOut={signOut}
      />

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px' }}>
        {error && <p style={{ color: '#ba1a1a', marginBottom: 16 }}>{error}</p>}

        {assignmentsLoading ? (
          <p style={{ color: 'rgba(15,13,12,0.45)' }}>Loading your assignments…</p>
        ) : activeAssignments.length === 0 ? (
          <div style={{ backgroundColor: '#fff', border: BORDER, padding: 40, textAlign: 'center', marginBottom: 32 }}>
            <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No students assigned yet</p>
            <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.5)', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.7 }}>
              When admin assigns you a student, their project will appear here with workflow steps, application details, and scoring tools.
            </p>
            <Link href="/dashboard/reviewer/profile" style={{ fontSize: 13, fontWeight: 600, color: '#eb4511' }}>Complete your profile while you wait →</Link>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.4)', marginBottom: 14 }}>
              Your assigned students
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 36 }}>
              {activeAssignments.map((a) => {
                const app = normalizeApp(a.applications)!;
                const status = uiStatus(a);
                const meta = STATUS_LABELS[status];
                return (
                  <div key={a.id} style={{ backgroundColor: '#fff', border: BORDER, padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          {a.student_code && (
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'rgba(15,13,12,0.4)' }}>{a.student_code}</span>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', backgroundColor: meta.bg, color: meta.color, borderRadius: 4 }}>{meta.label}</span>
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 4px' }}>{app.project_name}</h3>
                        <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.5)', margin: '0 0 6px' }}>{app.tech_stack}</p>
                        <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.4)', margin: 0 }}>
                          {a.student_code ?? 'Candidate'}
                          {' · '}Submitted {new Date(app.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        {status === 'scheduled' && a.session_date && (
                          <div style={{ marginTop: 8 }}>
                            <p style={{ fontSize: 12, color: '#007a4a', fontWeight: 600, margin: '0 0 8px' }}>
                              Session confirmed: {new Date(a.session_date).toLocaleString('en-IN')}
                            </p>
                            <Link
                              href={`/dashboard/session/${a.id}?as=reviewer`}
                              style={{
                                display: 'inline-block',
                                padding: '8px 16px',
                                fontSize: 11,
                                fontWeight: 600,
                                background: getSessionJoinState(a.session_date).canJoin ? '#007a4a' : 'rgba(15,13,12,0.15)',
                                color: '#fff',
                                textDecoration: 'none',
                              }}
                            >
                              Join session →
                            </Link>
                            <p style={{ fontSize: 11, color: 'rgba(15,13,12,0.45)', marginTop: 6 }}>
                              {getSessionJoinState(a.session_date).message}
                            </p>
                          </div>
                        )}
                        {status === 'scheduling' && (
                          <p style={{ fontSize: 12, color: '#9a6500', marginTop: 8, fontWeight: 500, lineHeight: 1.5 }}>
                            Tentative (pending admin approval)
                            {formatTentativeSessionDisplay(a.proposed_session_notes)
                              ? `: ${formatTentativeSessionDisplay(a.proposed_session_notes)}`
                              : ''}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => openSubmission(app.id)}
                        style={{ padding: '12px 24px', fontSize: 13, fontWeight: 600, background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                      >
                        Open application →
                      </button>
                    </div>
                    <AssignmentTaskList
                      assignmentId={a.id}
                      studentCode={a.student_code}
                      workflowStage={a.workflow_stage ?? 'assigned'}
                      tasks={workflowTasks}
                      onOpenApplication={() => openSubmission(app.id)}
                      onRefresh={fetchWorkflowTasks}
                    />
                  </div>
                );
              })}
            </div>
          </>
        )}

        <ReviewerGuide assignmentCount={activeAssignments.length} compact={activeAssignments.length > 0} />
      </main>
    </div>
  );
}
