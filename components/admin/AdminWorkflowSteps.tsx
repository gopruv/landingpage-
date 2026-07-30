'use client';

import { useEffect, useMemo, useState } from 'react';
import AdminSessionAudit from '@/components/admin/AdminSessionAudit';
import {
  formatTentativeSessionDisplay,
  getAdminReminderCount,
  parseProposalSubmittedAt,
  hoursSince,
} from '@/lib/sessionDisplay';

const BORDER = '1px solid rgba(15,13,12,0.1)';

const SESSION_DONE_STAGES = ['session_done', 'score_submitted', 'score_approved', 'completed'];

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isSessionDone(assignment: WorkflowAssignment | null): boolean {
  if (!assignment) return false;
  return !!assignment.session_completed_at || SESSION_DONE_STAGES.includes(assignment.workflow_stage ?? '');
}

function AdminReschedulePanel({
  assignment,
  actionLoading,
  onRescheduleSession,
  buttonLabel = 'Reschedule session',
}: {
  assignment: WorkflowAssignment;
  actionLoading: boolean;
  onRescheduleSession: (assignmentId: string, newSessionAt: string, note?: string) => void;
  buttonLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const defaultIso = assignment.session_date ?? assignment.proposed_session_at ?? null;
  const [rescheduleAt, setRescheduleAt] = useState('');
  const [rescheduleNote, setRescheduleNote] = useState('');

  useEffect(() => {
    if (open) {
      setRescheduleAt(toDatetimeLocalValue(defaultIso) || toDatetimeLocalValue(new Date().toISOString()));
      setRescheduleNote('');
    }
  }, [open, defaultIso]);

  const canSubmit = !!rescheduleAt && !Number.isNaN(new Date(rescheduleAt).getTime());

  return (
    <>
      <button
        type="button"
        disabled={actionLoading}
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '6px 12px',
          background: '#fff',
          color: '#9a6500',
          border: '1px solid rgba(184,121,0,0.35)',
          cursor: 'pointer',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {buttonLabel}
      </button>
      {open && (
        <div style={{ marginTop: 14, padding: 14, background: 'rgba(184,121,0,0.06)', border: '1px solid rgba(184,121,0,0.2)' }}>
          <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px', color: '#9a6500' }}>
            Pick a new time — applies immediately and emails student + reviewer
          </p>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, marginBottom: 6, color: 'rgba(15,13,12,0.55)' }}>
            New session time
          </label>
          <input
            type="datetime-local"
            value={rescheduleAt}
            onChange={(e) => setRescheduleAt(e.target.value)}
            style={{ width: '100%', fontSize: 12, padding: 10, border: '1px solid rgba(15,13,12,0.15)', marginBottom: 10, fontFamily: 'inherit' }}
          />
          <textarea
            value={rescheduleNote}
            onChange={(e) => setRescheduleNote(e.target.value)}
            rows={2}
            placeholder="Optional note (included in session notes)"
            style={{ width: '100%', fontSize: 12, padding: 10, border: '1px solid rgba(15,13,12,0.15)', marginBottom: 10, fontFamily: 'inherit' }}
          />
          <button
            type="button"
            disabled={actionLoading || !canSubmit}
            onClick={() => {
              onRescheduleSession(assignment.id, new Date(rescheduleAt).toISOString(), rescheduleNote.trim() || undefined);
              setOpen(false);
            }}
            style={{
              padding: '8px 16px',
              background: canSubmit ? '#9a6500' : 'rgba(15,13,12,0.15)',
              color: '#fff',
              border: 'none',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Apply reschedule
          </button>
        </div>
      )}
    </>
  );
}

export interface ReviewerTask {
  id: string;
  task_key: string;
  title: string;
  status: string;
  notes?: string | null;
  completed_at?: string | null;
  sort_order?: number;
  unlocked?: boolean;
  is_custom?: boolean;
}

export interface WorkflowAssignment {
  id: string;
  workflow_stage?: string;
  proposed_session_at?: string | null;
  proposed_session_notes?: string | null;
  student_code?: string | null;
  session_date?: string | null;
  session_proposal_submitted_at?: string | null;
  admin_session_reminder_count?: number | null;
  status?: string;
  accepted_at?: string | null;
  session_completed_at?: string | null;
  student_session_confirmed_at?: string | null;
  student_feedback_audio?: number | null;
  student_feedback_video?: number | null;
  student_feedback_notes?: string | null;
  reviewer_joined_at?: string | null;
  student_joined_at?: string | null;
  reviewer_early_end_reason?: string | null;
  student_early_end_reason?: string | null;
  reviewers?: { id?: string; full_name: string; email: string } | null;
  reviewer_tasks?: ReviewerTask[] | null;
}

export interface WorkflowScore {
  total_score: number;
  final_score: number | null;
  passed: boolean;
  admin_review_status?: string;
  technical_depth?: number;
  communication?: number;
  reproducibility?: number;
  problem_solving?: number;
  feedback_td?: string;
  submitted_at?: string;
}

function StepShell({
  num,
  title,
  done,
  active,
  children,
}: {
  num: number;
  title: string;
  done: boolean;
  active?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div style={{
      marginBottom: 14,
      padding: 16,
      border: BORDER,
      background: done ? 'rgba(0,122,74,0.04)' : active ? '#faf7f2' : '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: children ? 12 : 0 }}>
        <span style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          background: done ? '#007a4a' : active ? '#eb4511' : 'rgba(15,13,12,0.08)',
          color: done || active ? '#fff' : 'rgba(15,13,12,0.45)',
        }}>
          {done ? '✓' : num}
        </span>
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function taskStatusLabel(status: string) {
  const map: Record<string, string> = {
    done: 'Done',
    todo: 'To do',
    in_progress: 'In progress',
    new: 'Locked',
    cancelled: 'Cancelled',
    under_review: 'Under review',
  };
  return map[status] ?? status;
}

export default function AdminWorkflowSteps({
  detailStatus,
  paymentDone,
  assignment,
  recordingUrl,
  scoreSubmittedAt,
  score,
  credentialIssued,
  actionLoading,
  scoreInput,
  scoreFeedback,
  onScoreInputChange,
  onScoreFeedbackChange,
  onConfirmPayment,
  onApproveSession,
  onRescheduleSession,
  onSessionReminder,
  onReviewScore,
  onSubmitManualScore,
  onIssueCredential,
  confirmReviewed,
  overrideFailed,
  onConfirmReviewedChange,
  onOverrideFailedChange,
}: {
  detailStatus: string;
  paymentDone: boolean;
  assignment: WorkflowAssignment | null;
  recordingUrl?: string | null;
  scoreSubmittedAt?: string | null;
  score: WorkflowScore | null;
  credentialIssued: boolean;
  actionLoading: boolean;
  scoreInput: number;
  scoreFeedback: string;
  onScoreInputChange: (n: number) => void;
  onScoreFeedbackChange: (s: string) => void;
  onConfirmPayment: () => void;
  onApproveSession: (assignmentId: string) => void;
  onRescheduleSession: (assignmentId: string, newSessionAt: string, note?: string) => void;
  onSessionReminder: (assignmentId: string) => void;
  onReviewScore: (action: 'approve' | 'request_revision' | 'under_review') => void;
  onSubmitManualScore: () => void;
  onIssueCredential: (overrideFailed: boolean) => void;
  confirmReviewed: boolean;
  overrideFailed: boolean;
  onConfirmReviewedChange: (v: boolean) => void;
  onOverrideFailedChange: (v: boolean) => void;
}) {
  const [showManualScore, setShowManualScore] = useState(false);

  const tasks = useMemo(() => {
    const raw = assignment?.reviewer_tasks;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [assignment?.reviewer_tasks]);

  const hasReviewer = !!assignment?.reviewers;
  const sessionProposed =
    assignment?.workflow_stage === 'session_proposed'
    || (!!assignment?.proposed_session_notes && assignment?.status !== 'scheduled');
  const sessionApproved =
    !!assignment?.session_date
    && (assignment?.status === 'scheduled' || assignment?.workflow_stage === 'session_approved');
  const canAdminReschedule = !!assignment && !isSessionDone(assignment) && (
    !!assignment.session_date
    || !!assignment.proposed_session_at
    || assignment.status === 'scheduled'
    || assignment.workflow_stage === 'session_proposed'
    || assignment.workflow_stage === 'session_approved'
  );
  const tentativeLabel = formatTentativeSessionDisplay(assignment?.proposed_session_notes);
  const reminderCount = getAdminReminderCount(
    assignment?.proposed_session_notes,
    assignment?.admin_session_reminder_count,
  );
  const proposalSubmittedAt = parseProposalSubmittedAt(
    assignment?.proposed_session_notes,
    assignment?.session_proposal_submitted_at,
  );
  const waitingHours = hoursSince(proposalSubmittedAt?.toISOString() ?? null);
  const canSendReminder = !!assignment && waitingHours != null && waitingHours >= 24 && reminderCount < 2;
  const scorePending = !!score && (score.admin_review_status === 'pending' || !score.admin_review_status);
  const scoreApproved = !!score && score.admin_review_status === 'approved';
  const reviewComplete =
    sessionProposed
    || sessionApproved
    || ['session_proposed', 'session_approved', 'session_done', 'score_submitted', 'score_approved', 'completed'].includes(assignment?.workflow_stage ?? '');

  return (
    <div>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.4)', marginBottom: 14 }}>
        Application workflow
      </p>

      {assignment?.workflow_stage && (
        <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.55)', margin: '0 0 16px' }}>
          Reviewer stage: <strong>{assignment.workflow_stage.replace(/_/g, ' ')}</strong>
          {assignment.student_code && <> · {assignment.student_code}</>}
        </p>
      )}

      <StepShell num={1} title="Payment received" done={paymentDone} active={!paymentDone}>
        {!paymentDone ? (
          <>
            <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.5)', margin: '0 0 10px' }}>
              Confirm payment before assigning a reviewer (manual bypass for testing).
            </p>
            <button
              type="button"
              disabled={actionLoading}
              onClick={onConfirmPayment}
              style={{ padding: '8px 16px', background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
            >
              Mark payment received
            </button>
          </>
        ) : (
          <p style={{ fontSize: 12, color: '#007a4a', margin: 0, fontWeight: 600 }}>Payment confirmed</p>
        )}
      </StepShell>

      <StepShell num={2} title="Reviewer assigned" done={hasReviewer} active={paymentDone && !hasReviewer}>
        {hasReviewer ? (
          <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.6)', margin: 0 }}>
            {assignment?.reviewers?.full_name} · {assignment?.reviewers?.email}
          </p>
        ) : (
          <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.5)', margin: 0 }}>
            Assign a reviewer from the applications table.
          </p>
        )}
      </StepShell>

      {hasReviewer && (
        <StepShell
          num={3}
          title="Reviewer progress"
          done={reviewComplete || scoreApproved}
          active={hasReviewer && !reviewComplete && !sessionApproved}
        >
          {tasks.length > 0 ? (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tasks.filter((t) => !t.is_custom).map((task) => (
                <li key={task.id} style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{ color: 'rgba(15,13,12,0.7)', lineHeight: 1.45 }}>
                    {task.title.replace(/^\[[^\]]+\]\s*/, '')}
                    {task.notes && (
                      <span style={{ display: 'block', fontSize: 11, color: 'rgba(15,13,12,0.45)', marginTop: 2 }}>{task.notes}</span>
                    )}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 3,
                    whiteSpace: 'nowrap',
                    background: task.status === 'done' ? 'rgba(0,122,74,0.12)' : 'rgba(15,13,12,0.06)',
                    color: task.status === 'done' ? '#007a4a' : 'rgba(15,13,12,0.5)',
                  }}>
                    {taskStatusLabel(task.status)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.5)', margin: 0 }}>
              {reviewComplete
                ? 'Application reviewed — session proposal sent for your approval.'
                : 'Waiting for reviewer to complete application review.'}
            </p>
          )}
        </StepShell>
      )}

      <StepShell
        num={4}
        title="Approve session schedule"
        done={sessionApproved}
        active={sessionProposed && !sessionApproved}
      >
        {sessionApproved && assignment?.session_date ? (
          <div>
            <p style={{ fontSize: 12, color: '#007a4a', fontWeight: 600, margin: '0 0 4px' }}>Session confirmed & emails sent</p>
            <p style={{ fontSize: 13, margin: '0 0 12px' }}>
              {new Date(assignment.session_date).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </p>
            {canAdminReschedule && (
              <AdminReschedulePanel
                assignment={assignment}
                actionLoading={actionLoading}
                onRescheduleSession={onRescheduleSession}
              />
            )}
          </div>
        ) : sessionProposed && assignment ? (
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9a6500', margin: '0 0 8px' }}>
              Tentative — not scheduled until you approve
            </p>
            {tentativeLabel && (
              <p style={{ fontSize: 13, margin: '0 0 8px', lineHeight: 1.55 }}><strong>{tentativeLabel}</strong></p>
            )}
            {assignment.proposed_session_notes && (
              <pre style={{ fontSize: 11, color: 'rgba(15,13,12,0.55)', margin: '0 0 12px', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.5 }}>
                {assignment.proposed_session_notes}
              </pre>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onApproveSession(assignment.id)}
                style={{ padding: '8px 16px', background: '#007a4a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
              >
                Approve & email student + reviewer
              </button>
              {canAdminReschedule && (
                <AdminReschedulePanel
                  assignment={assignment}
                  actionLoading={actionLoading}
                  onRescheduleSession={onRescheduleSession}
                  buttonLabel="Set different time"
                />
              )}
              {reminderCount < 2 && (
                <button
                  type="button"
                  disabled={actionLoading || !canSendReminder}
                  onClick={() => onSessionReminder(assignment.id)}
                  style={{
                    padding: '6px 12px',
                    background: '#fff',
                    color: canSendReminder ? '#9a6500' : 'rgba(15,13,12,0.35)',
                    border: `1px solid ${canSendReminder ? 'rgba(184,121,0,0.35)' : 'rgba(15,13,12,0.15)'}`,
                    cursor: canSendReminder ? 'pointer' : 'not-allowed',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Send reminder ({reminderCount}/2)
                </button>
              )}
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.5)', margin: 0 }}>
            Reviewer will propose times from the student&apos;s availability. Nothing is scheduled until you approve here.
          </p>
        )}
      </StepShell>

      {isSessionDone(assignment) && (
        <StepShell
          num={5}
          title="Live session wrap-up"
          done={!!assignment?.student_session_confirmed_at && !!score}
          active={isSessionDone(assignment) && !score}
        >
          <AdminSessionAudit assignment={assignment} scoreSubmittedAt={scoreSubmittedAt ?? score?.submitted_at} />
          <div style={{ fontSize: 12, lineHeight: 1.7, color: 'rgba(15,13,12,0.65)' }}>
            {assignment?.session_completed_at && (
              <p style={{ margin: '0 0 8px' }}>
                <strong>Reviewer ended session:</strong>{' '}
                {new Date(assignment.session_completed_at).toLocaleString('en-IN')}
              </p>
            )}
            {assignment?.student_session_confirmed_at ? (
              <p style={{ margin: '0 0 8px', color: '#007a4a', fontWeight: 600 }}>
                Student marked complete — {new Date(assignment.student_session_confirmed_at).toLocaleString('en-IN')}
              </p>
            ) : (
              <p style={{ margin: '0 0 8px', color: '#9a6500' }}>Waiting for student to confirm session complete.</p>
            )}
            {(assignment?.student_feedback_audio != null || assignment?.student_feedback_video != null || assignment?.student_feedback_notes) && (
              <div style={{ margin: '0 0 10px', padding: 10, background: 'rgba(15,13,12,0.03)', border: '1px solid rgba(15,13,12,0.08)' }}>
                <p style={{ fontWeight: 600, margin: '0 0 6px' }}>Student session feedback</p>
                {assignment.student_feedback_audio != null && <p style={{ margin: '0 0 4px' }}>Audio: {assignment.student_feedback_audio}/5</p>}
                {assignment.student_feedback_video != null && <p style={{ margin: '0 0 4px' }}>Video: {assignment.student_feedback_video}/5</p>}
                {assignment.student_feedback_notes && <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{assignment.student_feedback_notes}</p>}
              </div>
            )}
            {recordingUrl ? (
              <a href={recordingUrl} target="_blank" rel="noreferrer" style={{ color: '#eb4511', fontWeight: 600 }}>
                View meeting recording →
              </a>
            ) : (
              <p style={{ margin: 0, color: 'rgba(15,13,12,0.45)' }}>Recording will appear here when available.</p>
            )}
          </div>
        </StepShell>
      )}

      <StepShell
        num={isSessionDone(assignment) ? 6 : 5}
        title="Reviewer score"
        done={scoreApproved}
        active={!!score && scorePending}
      >
        {!score ? (
          <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.5)', margin: 0 }}>
            {hasReviewer ? 'Waiting for reviewer to submit scores after the live session.' : 'Assign a reviewer first.'}
          </p>
        ) : scorePending ? (
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 8px', color: score.passed ? '#007a4a' : '#ba1a1a' }}>
              {score.final_score ?? score.total_score}/100 {score.passed ? '(PASS)' : '(FAIL)'}
            </p>
            {score.feedback_td && (
              <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.55)', margin: '0 0 12px', lineHeight: 1.5 }}>{score.feedback_td}</p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button type="button" disabled={actionLoading} onClick={() => onReviewScore('approve')} style={{ padding: '6px 12px', background: '#007a4a', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                Approve & notify student
              </button>
              <button type="button" disabled={actionLoading} onClick={() => onReviewScore('request_revision')} style={{ padding: '6px 12px', background: '#fff', border: BORDER, fontSize: 11, cursor: 'pointer' }}>
                Ask reviewer to revise
              </button>
              <button type="button" disabled={actionLoading} onClick={() => onReviewScore('under_review')} style={{ padding: '6px 12px', background: '#9a6500', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer' }}>
                Mark under review
              </button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: '#007a4a', margin: 0, fontWeight: 600 }}>
            Score approved — {score.final_score ?? score.total_score}/100
          </p>
        )}
      </StepShell>

      <div style={{ marginBottom: 14, padding: '12px 16px', border: '1px dashed rgba(15,13,12,0.15)', background: 'rgba(15,13,12,0.02)' }}>
        <button
          type="button"
          onClick={() => setShowManualScore((v) => !v)}
          style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, fontWeight: 600, color: 'rgba(15,13,12,0.55)', cursor: 'pointer' }}
        >
          {showManualScore ? '▾' : '▸'} Manual score entry (error correction only)
        </button>
        {showManualScore && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 11, color: 'rgba(15,13,12,0.45)', margin: '0 0 10px', lineHeight: 1.5 }}>
              Use only if the reviewer flow failed. Does not replace reviewer scores when one already exists.
            </p>
            {!score ? (
              <>
                <label style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>Total: <strong>{scoreInput}</strong></label>
                <input type="range" min={0} max={100} value={scoreInput} onChange={(e) => onScoreInputChange(parseInt(e.target.value, 10))} style={{ width: '100%', marginBottom: 10, accentColor: '#eb4511' }} />
                <textarea value={scoreFeedback} onChange={(e) => onScoreFeedbackChange(e.target.value)} rows={2} style={{ width: '100%', fontSize: 12, padding: 8, marginBottom: 10, border: BORDER }} />
                <button type="button" disabled={actionLoading} onClick={onSubmitManualScore} style={{ padding: '8px 16px', background: '#fff', border: BORDER, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Save manual score
                </button>
              </>
            ) : (
              <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.5)', margin: 0 }}>Score already on file — delete via reset if you need to re-enter.</p>
            )}
          </div>
        )}
      </div>

      <StepShell num={isSessionDone(assignment) ? 7 : 6} title="Issue credential" done={credentialIssued} active={scoreApproved && !credentialIssued}>
        {credentialIssued ? (
          <p style={{ fontSize: 12, color: '#007a4a', margin: 0, fontWeight: 600 }}>Credential issued</p>
        ) : scoreApproved && score ? (
          <>
            <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.5)', margin: '0 0 10px' }}>
              Review the approved score, then issue the credential manually.
            </p>
            <label style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={confirmReviewed} onChange={(e) => onConfirmReviewedChange(e.target.checked)} />
              I have reviewed the score and marks are correct
            </label>
            {!score.passed && (
              <label style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 12, cursor: 'pointer', color: '#ba1a1a' }}>
                <input type="checkbox" checked={overrideFailed} onChange={(e) => onOverrideFailedChange(e.target.checked)} />
                Override failed review (manual exception)
              </label>
            )}
            <button
              type="button"
              disabled={actionLoading || !confirmReviewed || (!score.passed && !overrideFailed)}
              onClick={() => onIssueCredential(overrideFailed)}
              style={{
                padding: '8px 16px',
                background: confirmReviewed && (score.passed || overrideFailed) ? '#005fa3' : 'rgba(15,13,12,0.15)',
                color: '#fff',
                border: 'none',
                cursor: confirmReviewed ? 'pointer' : 'not-allowed',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Issue credential
            </button>
          </>
        ) : (
          <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.5)', margin: 0 }}>
            Available after reviewer score is submitted and approved.
          </p>
        )}
      </StepShell>
    </div>
  );
}
