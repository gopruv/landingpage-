'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  REVIEW_STEPS,
  type ReviewStep,
  type AvailabilitySlot,
  type ChecklistKey,
  loadReviewProgress,
  saveReviewProgress,
  loomEmbedUrl,
  slotLabel,
  parseAllSessionTimes,
  expandCandidateSlots,
  selectedSlotSummary,
  hourlyOptionsForSlot,
} from '@/lib/reviewFlow';
import ReviewChecklistSticker from './ReviewChecklistSticker';
import ReviewerStickyNotes from './ReviewerStickyNotes';
import ReviewCompleteModal from './ReviewCompleteModal';
import RescheduleRequestForm, { isReschedulePending } from '@/components/shared/RescheduleRequestForm';
import { formatTentativeSessionDisplay } from '@/lib/sessionDisplay';

const FONT = 'Inter, system-ui, sans-serif';
const BORDER = '1px solid rgba(15,13,12,0.1)';

const STEP_LABELS: Record<ReviewStep, string> = {
  answers: 'Application',
  github: 'GitHub',
  loom: 'Loom',
  availability: 'Schedule',
};

interface SubmissionReviewFlowProps {
  assignmentId: string;
  applicationId: string;
  studentCode: string;
  workflowStage: string;
  application: {
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
    availability?: AvailabilitySlot[];
  };
  tasks: Array<{ id: string; task_key: string; status: string }>;
  canSubmitScore?: boolean;
  scoreSubmitted?: boolean;
  proposedSessionNotes?: string | null;
  onBack: () => void;
  onComplete: () => void;
  onRefresh: () => void;
  onStartScore?: () => void;
}

const READONLY_STEPS: ReviewStep[] = ['answers', 'github', 'loom'];

type FlowPhase = 'review' | 'summary' | 'readonly';

function initialPhase(assignmentId: string, workflowStage: string): FlowPhase {
  if (typeof window === 'undefined') return 'review';
  const reviewed =
    localStorage.getItem(`reviewer-reviewed-${assignmentId}`) === '1'
    || !['assigned'].includes(workflowStage);
  return reviewed ? 'summary' : 'review';
}

export default function SubmissionReviewFlow({
  assignmentId,
  applicationId,
  studentCode,
  workflowStage,
  application,
  tasks,
  canSubmitScore,
  scoreSubmitted,
  proposedSessionNotes,
  onBack,
  onComplete,
  onRefresh,
  onStartScore,
}: SubmissionReviewFlowProps) {
  const [phase, setPhase] = useState<FlowPhase>(() => initialPhase(assignmentId, workflowStage));
  const [step, setStep] = useState<ReviewStep>('answers');
  const [readonlyStep, setReadonlyStep] = useState<ReviewStep>('answers');
  const [progress, setProgress] = useState(() => loadReviewProgress(assignmentId));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showComplete, setShowComplete] = useState(false);
  const [tentativeSummary, setTentativeSummary] = useState('');

  useEffect(() => {
    if (initialPhase(assignmentId, workflowStage) === 'summary') {
      setPhase('summary');
    }
  }, [assignmentId, workflowStage]);

  useEffect(() => {
    saveReviewProgress(assignmentId, progress);
  }, [assignmentId, progress]);

  const markChecklist = useCallback((key: ChecklistKey) => {
    setProgress((p) => ({
      ...p,
      completed: { ...p.completed, [key]: true },
    }));
  }, []);

  const goNext = () => {
    const idx = stepIndex(step);
    if (step === 'answers') markChecklist('read_answers');
    if (step === 'github') markChecklist('github');
    if (step === 'loom') markChecklist('loom');
    if (idx < REVIEW_STEPS.length - 1) {
      setStep(REVIEW_STEPS[idx + 1]);
    }
  };

  const goPrev = () => {
    const idx = stepIndex(step);
    if (idx > 0) setStep(REVIEW_STEPS[idx - 1]);
  };

  const studentSlots = expandCandidateSlots(application.availability ?? []);

  const submitReview = async () => {
    setError('');
    let proposedAt: string;
    try {
      const allTimes = parseAllSessionTimes(
        progress.useCustomSlot,
        progress.customSlot,
        progress.selectedSlot,
        progress.selectedHourSlots ?? [],
      );
      proposedAt = allTimes[0];
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Select a valid session time');
      return;
    }

    const preferenceSummary = selectedSlotSummary(
      progress.useCustomSlot,
      progress.customSlot,
      progress.selectedSlot,
      progress.selectedHourSlots ?? [],
    );

    const adminNotes = [
      preferenceSummary,
      progress.githubNote.trim() && `GitHub note: ${progress.githubNote.trim()}`,
      progress.loomNote.trim() && `Loom note: ${progress.loomNote.trim()}`,
      'Admin to confirm final session time.',
    ].filter(Boolean).join('\n');

    setLoading(true);
    try {
      const reviewTask = tasks.find((t) => t.task_key === 'review_submission');
      if (reviewTask && !reviewTask.id.startsWith('synthetic-')) {
        await api.reviewer.workflowAction({ action: 'complete_task', task_id: reviewTask.id });
      } else {
        localStorage.setItem(`reviewer-reviewed-${assignmentId}`, '1');
      }

      await api.reviewer.workflowAction({ action: 'accept_candidate', assignment_id: assignmentId });
      localStorage.setItem(`reviewer-accepted-${assignmentId}`, '1');

      await api.reviewer.workflowAction({
        action: 'propose_session',
        assignment_id: assignmentId,
        proposed_session_at: proposedAt,
        notes: adminNotes || undefined,
      });

      markChecklist('select_time');
      markChecklist('mark_reviewed');
      setTentativeSummary(preferenceSummary);
      setShowComplete(true);
      await onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const embed = application.loom_url ? loomEmbedUrl(application.loom_url) : null;
  const idx = stepIndex(step);

  if (phase === 'summary') {
    return (
      <PostReviewSummary
        application={application}
        studentCode={studentCode}
        workflowStage={workflowStage}
        assignmentId={assignmentId}
        canSubmitScore={canSubmitScore}
        scoreSubmitted={scoreSubmitted}
        proposedSessionNotes={proposedSessionNotes}
        onBack={onBack}
        onRefresh={onRefresh}
        onStartScore={onStartScore}
        onViewApplication={() => setPhase('readonly')}
        onNextStep={onComplete}
      />
    );
  }

  if (phase === 'readonly') {
    return (
      <ReadOnlyReviewView
        assignmentId={assignmentId}
        studentCode={studentCode}
        application={application}
        embed={embed}
        progress={progress}
        step={readonlyStep}
        onStepChange={setReadonlyStep}
        onBack={() => setPhase('summary')}
      />
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', maxWidth: 1200, margin: '0 auto', padding: '24px 28px' }}>
        <ReviewerStickyNotes assignmentId={assignmentId} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
            {REVIEW_STEPS.map((s, i) => (
              <div
                key={s}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: i <= idx ? '#eb4511' : 'rgba(15,13,12,0.35)',
                  fontWeight: i === idx ? 600 : 400,
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: i < idx ? '#007a4a' : i === idx ? '#eb4511' : 'rgba(15,13,12,0.08)',
                    color: i <= idx ? '#fff' : 'rgba(15,13,12,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {i < idx ? '✓' : i + 1}
                </span>
                {STEP_LABELS[s]}
                {i < REVIEW_STEPS.length - 1 && (
                  <span style={{ color: 'rgba(15,13,12,0.15)', margin: '0 4px' }}>→</span>
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div style={{ background: '#fff', border: BORDER, padding: '28px 32px', marginBottom: 16 }}>
            {step === 'answers' && (
              <AnswersStep application={application} studentCode={studentCode} />
            )}
            {step === 'github' && (
              <GithubStep
                url={application.github_url}
                note={progress.githubNote}
                onNoteChange={(githubNote) => setProgress((p) => ({ ...p, githubNote }))}
              />
            )}
            {step === 'loom' && (
              <LoomStep
                url={application.loom_url}
                embed={embed}
                note={progress.loomNote}
                onNoteChange={(loomNote) => setProgress((p) => ({ ...p, loomNote }))}
              />
            )}
            {step === 'availability' && (
              <AvailabilityStep
                studentSlots={studentSlots}
                progress={progress}
                onChange={(patch) => {
                  setProgress((p) => {
                    const next = { ...p, selectedHourSlots: p.selectedHourSlots ?? [], ...patch };
                    if (patch.selectedSlot !== undefined && patch.selectedSlot !== p.selectedSlot) {
                      next.selectedHourSlots = [];
                    }
                    if (patch.useCustomSlot) {
                      next.selectedHourSlots = [];
                    }
                    const timePicked =
                      patch.useCustomSlot && patch.customSlot
                      || (!next.useCustomSlot && next.selectedSlot && (next.selectedHourSlots?.length ?? 0) > 0);
                    if (timePicked) {
                      next.completed = { ...next.completed, select_time: true };
                    }
                    return next;
                  });
                }}
              />
            )}
          </div>

          {error && <p style={{ color: '#ba1a1a', fontSize: 13, marginBottom: 12 }}>{error}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <button
              type="button"
              onClick={idx === 0 ? onBack : goPrev}
              style={{ padding: '10px 18px', fontSize: 13, border: BORDER, background: '#fff', cursor: 'pointer' }}
            >
              {idx === 0 ? '← Back to dashboard' : '← Previous'}
            </button>
            {step !== 'availability' ? (
              <button
                type="button"
                onClick={goNext}
                style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={submitReview}
                style={{
                  padding: '10px 24px',
                  fontSize: 13,
                  fontWeight: 600,
                  background: loading ? 'rgba(235,69,17,0.5)' : '#eb4511',
                  color: '#fff',
                  border: 'none',
                  cursor: loading ? 'wait' : 'pointer',
                }}
              >
                {loading ? 'Submitting…' : 'Mark as reviewed & send to admin'}
              </button>
            )}
          </div>
        </div>

        <ReviewChecklistSticker completed={progress.completed} />
      </div>

      <ReviewCompleteModal
        open={showComplete}
        studentCode={studentCode}
        tentativeSummary={tentativeSummary}
        onViewApplication={() => {
          setShowComplete(false);
          setPhase('readonly');
        }}
        onContinue={() => {
          setShowComplete(false);
          setPhase('summary');
        }}
      />
    </>
  );
}

function stepIndex(step: ReviewStep) {
  return REVIEW_STEPS.indexOf(step);
}

function ReadOnlyReviewView({
  assignmentId,
  studentCode,
  application,
  embed,
  progress,
  step,
  onStepChange,
  onBack,
}: {
  assignmentId: string;
  studentCode: string;
  application: SubmissionReviewFlowProps['application'];
  embed: string | null;
  progress: ReturnType<typeof loadReviewProgress>;
  step: ReviewStep;
  onStepChange: (s: ReviewStep) => void;
  onBack: () => void;
}) {
  const idx = READONLY_STEPS.indexOf(step);
  const checklist = {
    read_answers: true,
    github: true,
    loom: true,
    select_time: true,
    mark_reviewed: true,
  };

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', maxWidth: 1200, margin: '0 auto', padding: '24px 28px' }}>
      <ReviewerStickyNotes assignmentId={assignmentId} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.45)', margin: '0 0 16px' }}>
          Meeting prep — read-only review of the submission
        </p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {READONLY_STEPS.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => onStepChange(s)}
              style={{
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: step === s ? 600 : 400,
                border: step === s ? '2px solid #eb4511' : BORDER,
                background: step === s ? 'rgba(235,69,17,0.06)' : '#fff',
                cursor: 'pointer',
                color: step === s ? '#eb4511' : 'rgba(15,13,12,0.55)',
              }}
            >
              {STEP_LABELS[s]}
            </button>
          ))}
        </div>
        <div style={{ background: '#fff', border: BORDER, padding: '28px 32px', marginBottom: 16 }}>
          {step === 'answers' && <AnswersStep application={application} studentCode={studentCode} />}
          {step === 'github' && (
            <GithubStep url={application.github_url} note={progress.githubNote} readOnly />
          )}
          {step === 'loom' && (
            <LoomStep url={application.loom_url} embed={embed} note={progress.loomNote} readOnly />
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button
            type="button"
            onClick={idx === 0 ? onBack : () => onStepChange(READONLY_STEPS[idx - 1])}
            style={{ padding: '10px 18px', fontSize: 13, border: BORDER, background: '#fff', cursor: 'pointer' }}
          >
            {idx === 0 ? '← Back to status' : '← Previous'}
          </button>
          {idx < READONLY_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => onStepChange(READONLY_STEPS[idx + 1])}
              style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              style={{ padding: '10px 24px', fontSize: 13, fontWeight: 600, background: '#007a4a', color: '#fff', border: 'none', cursor: 'pointer' }}
            >
              Done reviewing
            </button>
          )}
        </div>
      </div>
      <ReviewChecklistSticker completed={checklist} />
    </div>
  );
}

function AnswersStep({
  application,
  studentCode,
}: {
  application: SubmissionReviewFlowProps['application'];
  studentCode: string;
}) {
  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#eb4511', margin: '0 0 8px' }}>
        {studentCode}
      </p>
      <h2 style={{ fontSize: 28, fontWeight: 600, margin: '0 0 6px', lineHeight: 1.2 }}>{application.project_name}</h2>
      <p style={{ fontSize: 15, color: 'rgba(15,13,12,0.5)', margin: '0 0 24px' }}>{application.tech_stack}</p>
      <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.4)', margin: '0 0 28px' }}>
        Submitted {new Date(application.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.4)', margin: '0 0 14px' }}>
          Build decisions
        </h3>
        <AnswerBlock label="Decision 1" text={application.build_decision_1} />
        {application.build_decision_2 && <AnswerBlock label="Decision 2" text={application.build_decision_2} />}
        {application.build_decision_3 && <AnswerBlock label="Decision 3" text={application.build_decision_3} />}
      </section>

      <section style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.4)', margin: '0 0 14px' }}>
          What broke & how they fixed it
        </h3>
        <AnswerBlock label="Challenge" text={application.what_broke} />
      </section>

      <section>
        <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.4)', margin: '0 0 14px' }}>
          AI tools used
        </h3>
        <AnswerBlock label="Tools & usage" text={application.ai_tools_used} />
      </section>
    </div>
  );
}

function AnswerBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ padding: '16px 18px', background: 'rgba(15,13,12,0.02)', border: BORDER, marginBottom: 12 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,13,12,0.45)', margin: '0 0 8px' }}>{label}</p>
      <p style={{ fontSize: 15, lineHeight: 1.75, margin: 0, color: 'rgba(15,13,12,0.85)' }}>{text}</p>
    </div>
  );
}

function GithubStep({
  url,
  note,
  onNoteChange,
  readOnly,
}: {
  url: string;
  note: string;
  onNoteChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px' }}>GitHub repository</h2>
      <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.5)', margin: '0 0 20px', lineHeight: 1.6 }}>
        Review the codebase structure, README, and commit history. Open in a new tab to explore fully.
      </p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '14px 22px',
            background: '#0f0d0c',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 24,
          }}
        >
          Open GitHub repository →
        </a>
      ) : (
        <p style={{ color: '#ba1a1a', marginBottom: 24 }}>No GitHub URL provided.</p>
      )}
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
        Notes for admin {!readOnly && <span style={{ fontWeight: 400, color: 'rgba(15,13,12,0.45)' }}>(optional — e.g. repo access issues)</span>}
      </label>
      {readOnly ? (
        note.trim() ? (
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(15,13,12,0.65)', margin: 0, padding: 12, background: 'rgba(15,13,12,0.03)', border: BORDER }}>{note}</p>
        ) : (
          <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.35)', margin: 0 }}>No notes added.</p>
        )
      ) : (
        <textarea
          value={note}
          onChange={(e) => onNoteChange?.(e.target.value)}
          placeholder="Flag anything the admin should know about the GitHub profile or repo…"
          style={{ width: '100%', minHeight: 90, padding: 12, fontFamily: FONT, fontSize: 13, border: BORDER }}
        />
      )}
    </div>
  );
}

function LoomStep({
  url,
  embed,
  note,
  onNoteChange,
  readOnly,
}: {
  url: string;
  embed: string | null;
  note: string;
  onNoteChange?: (v: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px' }}>Loom walkthrough</h2>
      <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.5)', margin: '0 0 20px', lineHeight: 1.6 }}>
        Watch the candidate explain their project. Pay attention to depth of understanding and communication.
      </p>
      {embed ? (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, marginBottom: 16, background: '#000' }}>
          <iframe
            src={embed}
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            title="Loom walkthrough"
          />
        </div>
      ) : url ? (
        <a href={url} target="_blank" rel="noreferrer" style={{ color: '#eb4511', fontWeight: 600, display: 'block', marginBottom: 16 }}>
          Open Loom in new tab →
        </a>
      ) : (
        <p style={{ color: '#ba1a1a', marginBottom: 16 }}>No Loom URL provided.</p>
      )}
      {url && (
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'rgba(15,13,12,0.45)' }}>
          Open in Loom if embed doesn&apos;t load →
        </a>
      )}
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, margin: readOnly ? '0' : '20px 0 8px' }}>
        Notes for admin {!readOnly && <span style={{ fontWeight: 400, color: 'rgba(15,13,12,0.45)' }}>(optional — e.g. video won&apos;t play)</span>}
      </label>
      {readOnly ? (
        note.trim() ? (
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(15,13,12,0.65)', margin: '8px 0 0', padding: 12, background: 'rgba(15,13,12,0.03)', border: BORDER }}>{note}</p>
        ) : (
          <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.35)', margin: '8px 0 0' }}>No notes added.</p>
        )
      ) : (
        <textarea
          value={note}
          onChange={(e) => onNoteChange?.(e.target.value)}
          placeholder="Flag playback issues or anything notable about the walkthrough…"
          style={{ width: '100%', minHeight: 90, padding: 12, fontFamily: FONT, fontSize: 13, border: BORDER }}
        />
      )}
    </div>
  );
}

function AvailabilityStep({
  studentSlots,
  progress,
  onChange,
}: {
  studentSlots: AvailabilitySlot[];
  progress: ReturnType<typeof loadReviewProgress>;
  onChange: (patch: Partial<ReturnType<typeof loadReviewProgress>>) => void;
}) {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px' }}>Session availability</h2>
      <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.5)', margin: '0 0 24px', lineHeight: 1.6 }}>
        Pick the candidate&apos;s preferred window that works best for you, or suggest one alternate time.
        Admin will review and confirm the final slot.
      </p>

      {studentSlots.length > 0 ? (
        <section style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.4)', margin: '0 0 12px' }}>
            Candidate preferred times
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {studentSlots.map((slot, i) => {
              const val = JSON.stringify(slot);
              const selected = !progress.useCustomSlot && progress.selectedSlot === val;
              const hourOptions = hourlyOptionsForSlot(slot);
              const hourIds = progress.selectedHourSlots ?? [];

              const toggleHour = (hourId: string) => {
                const next = hourIds.includes(hourId)
                  ? hourIds.filter((id) => id !== hourId)
                  : [...hourIds, hourId];
                onChange({ selectedHourSlots: next });
              };

              return (
                <div
                  key={`s-${i}-${slot.description ?? i}`}
                  style={{
                    border: selected ? '2px solid #eb4511' : BORDER,
                    background: selected ? 'rgba(235,69,17,0.04)' : '#fff',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'flex-start',
                      padding: '14px 16px',
                      cursor: 'pointer',
                      fontSize: 14,
                      margin: 0,
                    }}
                  >
                    <input
                      type="radio"
                      name="slot"
                      checked={selected}
                      onChange={() => onChange({ selectedSlot: val, useCustomSlot: false, selectedHourSlots: [] })}
                      style={{ marginTop: 3, flexShrink: 0 }}
                    />
                    <span style={{ lineHeight: 1.5, fontWeight: 500 }}>{slotLabel(slot)}</span>
                  </label>

                  {selected && hourOptions.length > 0 && (
                    <div
                      style={{
                        margin: '0 16px 14px 42px',
                        padding: '12px 14px',
                        background: 'rgba(15,13,12,0.03)',
                        border: BORDER,
                      }}
                    >
                      <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,13,12,0.45)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Select 1-hour slot(s)
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {hourOptions.map((hour) => (
                          <label
                            key={hour.id}
                            style={{
                              display: 'flex',
                              gap: 10,
                              alignItems: 'center',
                              fontSize: 13,
                              cursor: 'pointer',
                              color: 'rgba(15,13,12,0.75)',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={hourIds.includes(hour.id)}
                              onChange={() => toggleHour(hour.id)}
                            />
                            {hour.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ) : (
        <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.5)', marginBottom: 24 }}>
          No preferred times listed — suggest an alternate time below.
        </p>
      )}

      <section>
        <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.4)', margin: '0 0 12px' }}>
          Or suggest one alternate time
        </h3>
        <label
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            padding: '14px 16px',
            border: progress.useCustomSlot ? '2px solid #005fa3' : BORDER,
            background: progress.useCustomSlot ? 'rgba(0,95,163,0.04)' : '#fff',
            cursor: 'pointer',
            fontSize: 14,
            marginBottom: progress.useCustomSlot ? 12 : 0,
          }}
        >
          <input
            type="radio"
            name="slot"
            checked={progress.useCustomSlot}
            onChange={() => onChange({ useCustomSlot: true, selectedSlot: null, selectedHourSlots: [] })}
            style={{ marginTop: 3, flexShrink: 0 }}
          />
          <span style={{ lineHeight: 1.5 }}>Different date &amp; time (admin will confirm)</span>
        </label>
        {progress.useCustomSlot && (
          <input
            type="datetime-local"
            value={progress.customSlot}
            onChange={(e) => onChange({ customSlot: e.target.value, useCustomSlot: true })}
            style={{ padding: 12, fontSize: 14, border: BORDER, width: '100%', maxWidth: 320 }}
          />
        )}
      </section>
    </div>
  );
}

function PostReviewSummary({
  application,
  studentCode,
  workflowStage,
  assignmentId,
  canSubmitScore,
  scoreSubmitted,
  proposedSessionNotes,
  onBack,
  onRefresh,
  onStartScore,
  onViewApplication,
  onNextStep,
}: {
  application: SubmissionReviewFlowProps['application'];
  studentCode: string;
  workflowStage: string;
  assignmentId: string;
  canSubmitScore?: boolean;
  scoreSubmitted?: boolean;
  proposedSessionNotes?: string | null;
  onBack: () => void;
  onRefresh: () => void;
  onStartScore?: () => void;
  onViewApplication: () => void;
  onNextStep: () => void;
}) {
  const [loading, setLoading] = useState('');

  const canReschedule = ['session_proposed', 'session_approved', 'scheduled'].includes(workflowStage);
  const reschedulePending = isReschedulePending(proposedSessionNotes);

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setLoading(key);
    try {
      await fn();
      await onRefresh();
    } finally {
      setLoading('');
    }
  };

  const nextStep = async () => {
    if (canSubmitScore && !scoreSubmitted && onStartScore) {
      onStartScore();
      return;
    }
    if (workflowStage === 'session_approved' || workflowStage === 'scheduled') {
      await run('session', () => api.reviewer.workflowAction({ action: 'mark_session_done', assignment_id: assignmentId }));
      return;
    }
    onNextStep();
  };

  const nextStepLabel = (() => {
    if (canSubmitScore && !scoreSubmitted) return 'Submit scores →';
    if (workflowStage === 'session_approved' || workflowStage === 'scheduled') return 'Mark session complete →';
    return 'Back to dashboard →';
  })();

  const statusMessage = (() => {
    if (reschedulePending) {
      return 'Your reschedule request was sent to admin. They will confirm a new session time and notify both parties.';
    }
    if (workflowStage === 'session_proposed') {
      return 'Your preferred times were sent to admin. They will confirm the final session and set up the video room.';
    }
    if (workflowStage === 'session_approved' || workflowStage === 'scheduled') {
      return 'Session is scheduled. Review the application before the meeting, then mark the session complete when done.';
    }
    if (canSubmitScore && !scoreSubmitted) {
      return 'Session complete — submit your scores when ready.';
    }
    if (scoreSubmitted) {
      return 'Score submitted — awaiting admin review.';
    }
    return 'Review sent to admin. Re-read the application anytime before your session.';
  })();

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '28px 24px' }}>
      <div style={{ background: '#fff', border: BORDER, padding: 28 }}>
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#eb4511', margin: '0 0 6px' }}>{studentCode}</p>
        <h2 style={{ margin: '0 0 8px' }}>{application.project_name}</h2>
        <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.5)', margin: '0 0 16px' }}>
          Stage: <strong>{workflowStage.replace(/_/g, ' ')}</strong>
        </p>
        <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.6)', lineHeight: 1.65, margin: '0 0 24px' }}>
          {statusMessage}
        </p>

        {workflowStage === 'session_proposed' && formatTentativeSessionDisplay(proposedSessionNotes) && (
          <div style={{ marginBottom: 20, padding: '12px 14px', background: 'rgba(184,121,0,0.08)', border: '1px solid rgba(184,121,0,0.2)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a6500', margin: '0 0 6px' }}>
              Tentative times (pending admin)
            </p>
            <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.65)', margin: 0, lineHeight: 1.55 }}>
              {formatTentativeSessionDisplay(proposedSessionNotes)}
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            type="button"
            onClick={onViewApplication}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 14,
              fontWeight: 600,
              background: '#fff',
              color: '#0f0d0c',
              border: '2px solid #eb4511',
              cursor: 'pointer',
            }}
          >
            View application (meeting prep)
          </button>
          <button
            type="button"
            disabled={!!loading}
            onClick={nextStep}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: 14,
              fontWeight: 600,
              background: '#eb4511',
              color: '#fff',
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
            }}
          >
            {loading === 'session' ? '…' : nextStepLabel}
          </button>

          {canReschedule && (
            <RescheduleRequestForm
              role="reviewer"
              assignmentId={assignmentId}
              reschedulePending={reschedulePending}
              onSuccess={onRefresh}
            />
          )}
        </div>

        {scoreSubmitted && (
          <p style={{ color: '#007a4a', fontWeight: 600, marginTop: 20, textAlign: 'center' }}>✓ Score submitted — pending admin review</p>
        )}
      </div>
      <button
        type="button"
        onClick={onBack}
        style={{ marginTop: 16, fontSize: 13, color: 'rgba(15,13,12,0.45)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        ← Back to dashboard
      </button>
    </div>
  );
}
