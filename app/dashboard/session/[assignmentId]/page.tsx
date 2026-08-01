'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { isDevFullAccess } from '@/lib/devAccess';
import { supabase } from '@/lib/supabase';
import SessionScoreForm, { DEFAULT_RATINGS } from '@/components/session/SessionScoreForm';
import SessionSubmissionSidebar from '@/components/session/SessionSubmissionSidebar';
import SessionTimer from '@/components/session/SessionTimer';
import SessionNotesPanel from '@/components/session/SessionNotesPanel';
import type { CriterionKey, CriterionRating } from '@/lib/scoring';
import { EARLY_END_BUFFER_MINUTES, SESSION_DURATION_MINUTES } from '@/lib/sessionAccess';

const DailyRoomEmbed = dynamic(() => import('@/components/session/DailyRoomEmbed'), {
  ssr: false,
  loading: () => (
    <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.45)', padding: 16 }}>Loading video…</p>
  ),
});

interface ApplicationSummary {
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
  submitted_at?: string;
}

interface SessionData {
  assignment_id: string;
  application_id: string;
  project_name: string | null;
  session_date: string | null;
  daily_room_url: string | null;
  role: 'student' | 'reviewer';
  is_host: boolean;
  can_join: boolean;
  join_window_open: boolean;
  session_scheduled: boolean;
  session_done: boolean;
  meeting_closed: boolean;
  session_completed_at: string | null;
  student_confirmed_at: string | null;
  student_feedback: { audio: number | null; video: number | null; notes: string | null } | null;
  score_submitted: boolean;
  join_message: string;
  opens_at: string | null;
  room_error: string | null;
  token: string | null;
  recording_url: string | null;
  reviewer_session_draft: string | null;
  session_notes: string | null;
  notes_locked: boolean;
  requires_early_end_reason: boolean;
  reviewer_early_end_reason: string | null;
  timer: {
    duration_minutes: number;
    ends_at: string | null;
    remaining_ms: number;
    time_expired: boolean;
    started: boolean;
    reviewer_join_offset_min?: number | null;
    student_join_offset_min?: number | null;
    both_joined_at?: string | null;
    waiting_for_reviewer?: boolean;
    waiting_for_student?: boolean;
  };
  application: ApplicationSummary | null;
}

function sessionBlockMessage(data: SessionData): { title: string; body: string; tone: 'neutral' | 'warn' | 'error' } {
  if (data.meeting_closed && !data.can_join) {
    return {
      title: 'Meeting closed',
      body: 'This session has ended. The video room is no longer available — your notes are saved below.',
      tone: 'neutral',
    };
  }

  if (!data.session_scheduled || !data.session_date) {
    return {
      title: 'Session not scheduled yet',
      body: 'Video will be available here once admin approves the session schedule.',
      tone: 'warn',
    };
  }

  if (data.join_window_open && data.daily_room_url && !data.token) {
    return {
      title: 'Could not start video',
      body: data.room_error ?? 'We could not generate a join token. Try refreshing the page.',
      tone: 'error',
    };
  }

  if (data.join_window_open && !data.daily_room_url) {
    return {
      title: 'Setting up video room',
      body: data.room_error ?? 'Creating your Daily.co room… refresh the page in a few seconds if this persists.',
      tone: 'warn',
    };
  }

  if (!data.join_window_open) {
    return {
      title: 'Session not open yet',
      body: data.join_message,
      tone: 'neutral',
    };
  }

  return {
    title: 'Preparing session',
    body: data.join_message,
    tone: 'neutral',
  };
}

interface DraftPayload {
  ratings: Record<CriterionKey, CriterionRating>;
  feedbackNotes: string;
  sessionNotes?: string;
}

function parseDraft(raw: string | null): DraftPayload {
  if (!raw) {
    return { ratings: DEFAULT_RATINGS(), feedbackNotes: '' };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<DraftPayload>;
    return {
      ratings: parsed.ratings ?? DEFAULT_RATINGS(),
      feedbackNotes: parsed.feedbackNotes ?? '',
      sessionNotes: parsed.sessionNotes,
    };
  } catch {
    return { ratings: DEFAULT_RATINGS(), feedbackNotes: '' };
  }
}

function StarRating({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | undefined) => void;
  disabled?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>
        {label} <span style={{ fontWeight: 400, color: 'rgba(15,13,12,0.45)' }}>(optional)</span>
      </p>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value === n ? undefined : n)}
            style={{
              width: 36,
              height: 36,
              border: `1px solid ${value != null && n <= value ? '#eb4511' : 'rgba(15,13,12,0.15)'}`,
              background: value != null && n <= value ? 'rgba(235,69,17,0.12)' : '#fff',
              cursor: disabled ? 'default' : 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignmentId = params.assignmentId as string;
  const asParam = searchParams.get('as')?.toLowerCase() ?? null;
  const asRole = asParam === 'student' || asParam === 'reviewer' ? asParam : undefined;

  const { ready } = useRequireAuth();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const fetchGen = useRef(0);
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'submission' | 'notes' | 'score'>('submission');

  const [ratings, setRatings] = useState(DEFAULT_RATINGS());
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const draftLoaded = useRef(false);
  const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sessionNotes, setSessionNotes] = useState('');
  const notesLoaded = useRef(false);
  const notesDirty = useRef(false);
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notesSaving, setNotesSaving] = useState(false);
  const autoEndTriggered = useRef(false);
  const videoPinned = useRef<{ roomUrl: string; token: string } | null>(null);
  const joinReported = useRef(false);

  const [feedbackAudio, setFeedbackAudio] = useState<number | undefined>();
  const [feedbackVideo, setFeedbackVideo] = useState<number | undefined>();
  const [feedbackNotesStudent, setFeedbackNotesStudent] = useState('');
  const [reviewerEarlyEndReason, setReviewerEarlyEndReason] = useState('');
  const [studentEarlyEndReason, setStudentEarlyEndReason] = useState('');
  const [showEarlyEndModal, setShowEarlyEndModal] = useState(false);
  const [pendingEarlyEndReason, setPendingEarlyEndReason] = useState('');

  const applyPayload = useCallback((payload: SessionData, forRole: 'reviewer' | 'student') => {
    let merged = payload;

    if (payload.meeting_closed || payload.session_done || !payload.can_join) {
      videoPinned.current = null;
    } else if (payload.daily_room_url && payload.token) {
      if (!videoPinned.current) {
        videoPinned.current = { roomUrl: payload.daily_room_url, token: payload.token };
      }
      merged = {
        ...payload,
        daily_room_url: videoPinned.current.roomUrl,
        token: videoPinned.current.token,
      };
    }

    setData(merged);

    if (forRole === 'reviewer' && payload.role === 'reviewer' && !draftLoaded.current) {
      const draft = parseDraft(payload.reviewer_session_draft);
      setRatings(draft.ratings);
      setFeedbackNotes(draft.feedbackNotes);
      draftLoaded.current = true;
    }

    if (!notesLoaded.current) {
      let notes = payload.session_notes ?? '';
      if (!notes && payload.role === 'reviewer') {
        const legacy = parseDraft(payload.reviewer_session_draft).sessionNotes;
        if (legacy) notes = legacy;
      }
      setSessionNotes(notes);
      notesLoaded.current = true;
    }

    if (payload.student_feedback) {
      setFeedbackAudio(payload.student_feedback.audio ?? undefined);
      setFeedbackVideo(payload.student_feedback.video ?? undefined);
      setFeedbackNotesStudent(payload.student_feedback.notes ?? '');
    }
  }, []);

  const loadSession = useCallback(() => {
    if (!assignmentId || !asRole) return Promise.resolve();
    const gen = ++fetchGen.current;
    const roleForRequest = asRole;
    return api.video
      .session(assignmentId, roleForRequest)
      .then((res) => {
        if (gen !== fetchGen.current) return;
        const payload = (res as { data?: SessionData }).data;
        if (payload) applyPayload(payload, roleForRequest);
      })
      .catch((e) => {
        if (gen !== fetchGen.current) return;
        setError(e instanceof ApiError ? e.message : 'Could not load session');
      });
  }, [assignmentId, asRole, applyPayload]);

  useEffect(() => {
    if (!ready) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, [ready]);

  useEffect(() => {
    draftLoaded.current = false;
    notesLoaded.current = false;
    notesDirty.current = false;
    autoEndTriggered.current = false;
    joinReported.current = false;
    videoPinned.current = null;
    setData(null);
    setError('');
  }, [asRole, assignmentId]);

  useEffect(() => {
    if (!ready || !assignmentId || !asRole) return;
    setLoading(true);
    setError('');
    loadSession().finally(() => setLoading(false));
  }, [ready, assignmentId, asRole, loadSession]);

  useEffect(() => {
    if (!data?.can_join || data.session_done) return;
    const id = setInterval(() => {
      loadSession();
    }, 30_000);
    return () => clearInterval(id);
  }, [data?.can_join, data?.session_done, loadSession]);

  const recordJoin = useCallback(() => {
    if (!assignmentId || !asRole || joinReported.current) return;
    joinReported.current = true;
    api.session.recordJoin(assignmentId, asRole).then(() => loadSession()).catch(() => {
      joinReported.current = false;
    });
  }, [assignmentId, asRole, loadSession]);

  const handleDailyJoined = useCallback(() => {
    recordJoin();
  }, [recordJoin]);

  useEffect(() => {
    if (!data || !asRole || data.role === asRole) return;
    loadSession();
  }, [data?.role, asRole, loadSession]);

  useEffect(() => {
    if (!data || asRole !== 'reviewer' || data.score_submitted) return;

    if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    draftSaveTimer.current = setTimeout(() => {
      const draft = JSON.stringify({ ratings, feedbackNotes });
      api.reviewer.saveSessionDraft({ assignment_id: assignmentId, draft }).catch(() => {});
    }, 1200);

    return () => {
      if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
    };
  }, [ratings, feedbackNotes, data, assignmentId]);

  useEffect(() => {
    if (!data || data.notes_locked || !asRole || !notesDirty.current) return;

    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(() => {
      setNotesSaving(true);
      api.session
        .saveNotes({ assignment_id: assignmentId, notes: sessionNotes }, asRole)
        .catch(() => {})
        .finally(() => setNotesSaving(false));
    }, 1200);

    return () => {
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    };
  }, [sessionNotes, data, assignmentId, asRole]);

  const markSessionDone = useCallback(async (earlyEndReason?: string) => {
    setActionLoading(true);
    setActionMsg('');
    setShowEarlyEndModal(false);
    try {
      await api.reviewer.workflowAction({
        action: 'mark_session_done',
        assignment_id: assignmentId,
        ...(earlyEndReason?.trim() ? { early_end_reason: earlyEndReason.trim() } : {}),
      });
      setActionMsg('Session marked complete. Submit your final scores and review your notes.');
      draftLoaded.current = false;
      notesLoaded.current = false;
      await loadSession();
      setSidebarTab('score');
    } catch (e) {
      setActionMsg(e instanceof ApiError ? e.message : 'Could not mark session done');
    } finally {
      setActionLoading(false);
    }
  }, [assignmentId, loadSession]);

  const requestEndSession = useCallback(() => {
    if (!data) return;
    const bufferMs = EARLY_END_BUFFER_MINUTES * 60 * 1000;
    if (data.timer.remaining_ms > bufferMs) {
      setPendingEarlyEndReason('');
      setShowEarlyEndModal(true);
      return;
    }
    markSessionDone();
  }, [data, markSessionDone]);

  const handleTimerExpired = useCallback(() => {
    if (autoEndTriggered.current || !data || data.role !== 'reviewer' || data.session_done) return;
    autoEndTriggered.current = true;
    setActionMsg(`${SESSION_DURATION_MINUTES}-minute session cap reached — ending session.`);
    markSessionDone();
  }, [data, markSessionDone]);

  const submitScores = async () => {
    if (!data?.application_id) return;
    if (feedbackNotes.trim().length < 10) {
      setActionMsg('Feedback must be at least 10 characters.');
      return;
    }
    const needsReason =
      data.requires_early_end_reason && !data.reviewer_early_end_reason;
    if (needsReason && reviewerEarlyEndReason.trim().length < 10) {
      setActionMsg('This session ended early — explain why before submitting scores (min 10 characters).');
      return;
    }
    setActionLoading(true);
    setActionMsg('');
    try {
      await api.reviewer.submitScore({
        application_id: data.application_id,
        ratings,
        feedback_notes: feedbackNotes.trim(),
        confirm: true,
        ...(needsReason && reviewerEarlyEndReason.trim()
          ? { early_end_reason: reviewerEarlyEndReason.trim() }
          : {}),
      });
      setActionMsg('Scores submitted — admin will review and approve.');
      await loadSession();
    } catch (e) {
      setActionMsg(e instanceof ApiError ? e.message : 'Could not submit scores');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmSession = async () => {
    const needsStudentEarlyReason =
      !!data?.requires_early_end_reason && !data?.reviewer_early_end_reason;
    if (needsStudentEarlyReason && studentEarlyEndReason.trim().length < 10) {
      setActionMsg('This session ended early — please explain why (min 10 characters).');
      return;
    }
    setActionLoading(true);
    setActionMsg('');
    try {
      await api.student.confirmSession({
        assignment_id: assignmentId,
        ...(feedbackAudio != null ? { feedback_audio: feedbackAudio } : {}),
        ...(feedbackVideo != null ? { feedback_video: feedbackVideo } : {}),
        ...(feedbackNotesStudent.trim() ? { feedback_notes: feedbackNotesStudent.trim() } : {}),
        ...(needsStudentEarlyReason && studentEarlyEndReason.trim()
          ? { early_end_reason: studentEarlyEndReason.trim() }
          : {}),
      });
      setActionMsg('Thanks — session marked complete.');
      await loadSession();
    } catch (e) {
      setActionMsg(e instanceof ApiError ? e.message : 'Could not confirm session');
    } finally {
      setActionLoading(false);
    }
  };

  if (!ready || (asRole && loading && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#faf7f2' }}>
        <p style={{ color: 'rgba(15,13,12,0.45)' }}>Loading session…</p>
      </div>
    );
  }

  if (!asRole) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6" style={{ background: '#faf7f2' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#eb4511', margin: '0 0 8px' }}>
            Choose session role
          </p>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 12px' }}>How are you joining?</h1>
          <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.55)', lineHeight: 1.6, margin: '0 0 24px' }}>
            {isDevFullAccess(userEmail)
              ? 'Your dev account can test both sides. Pick a role — the URL will include ?as= so you join with the correct permissions.'
              : 'Open this page from your student or reviewer dashboard so we know which role to use.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/session/${assignmentId}?as=reviewer`)}
              style={{ padding: '12px 20px', background: '#eb4511', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Join as reviewer (host)
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/session/${assignmentId}?as=student`)}
              style={{ padding: '12px 20px', background: '#007a4a', color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              Join as student
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6" style={{ background: '#faf7f2' }}>
        <p style={{ color: '#ba1a1a' }}>{error || 'Session not found'}</p>
        <button type="button" onClick={() => router.back()} style={{ fontSize: 13, cursor: 'pointer' }}>
          ← Go back
        </button>
      </div>
    );
  }

  const dashboardUrl = asRole === 'reviewer' ? '/dashboard/reviewer' : '/dashboard/student';
  const sessionLabel = data.session_date
    ? new Date(data.session_date).toLocaleString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const waiting = sessionBlockMessage(data);
  const waitingColor =
    waiting.tone === 'error' ? '#ba1a1a' : waiting.tone === 'warn' ? '#9a6500' : 'rgba(15,13,12,0.55)';

  const showVideo = data.can_join && !!data.daily_room_url && !!data.token && data.role === asRole;
  const isReviewer = asRole === 'reviewer';
  const showTimer = !!data.session_date && (data.join_window_open || data.meeting_closed);
  const showNotesSection =
    !!data.session_notes?.trim()
    || data.meeting_closed
    || data.notes_locked
    || showVideo
    || data.join_window_open;

  const notesPanel = (
    <SessionNotesPanel
      value={sessionNotes}
      onChange={(v) => {
        notesDirty.current = true;
        setSessionNotes(v);
      }}
      locked={data.notes_locked}
      saving={notesSaving}
    />
  );

  return (
    <div className="min-h-screen" style={{ background: '#faf7f2' }}>
      {isDevFullAccess(userEmail) && (
        <div style={{ background: '#1a1a2e', color: '#fff', padding: '8px 24px', fontSize: 12, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span>Dev testing as: <strong>{asRole === 'reviewer' ? 'Reviewer (host)' : 'Student'}</strong></span>
          <span style={{ opacity: 0.5 }}>|</span>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/session/${assignmentId}?as=reviewer`)}
            style={{ background: asRole === 'reviewer' ? '#eb4511' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Reviewer
          </button>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/session/${assignmentId}?as=student`)}
            style={{ background: asRole === 'student' ? '#007a4a' : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
          >
            Student
          </button>
        </div>
      )}
      <header style={{ borderBottom: '1px solid rgba(15,13,12,0.1)', padding: '16px 24px', background: '#fff' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#eb4511', margin: 0 }}>
              Orcred live review
            </p>
            <h1 style={{ fontSize: 18, fontWeight: 600, margin: '4px 0 0' }}>
              {data.project_name ?? 'Review session'}
            </h1>
            {sessionLabel && (
              <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.55)', margin: '4px 0 0' }}>{sessionLabel}</p>
            )}
          </div>
          <Link href={dashboardUrl} style={{ fontSize: 12, color: '#eb4511', textDecoration: 'none' }}>
            ← Dashboard
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
        {actionMsg && (
          <p
            style={{
              fontSize: 13,
              margin: '0 0 16px',
              padding: '10px 14px',
              background:
                actionMsg.includes('Could not') || actionMsg.includes('must be')
                  ? 'rgba(186,26,26,0.08)'
                  : 'rgba(0,122,74,0.08)',
              color:
                actionMsg.includes('Could not') || actionMsg.includes('must be') ? '#ba1a1a' : '#007a4a',
            }}
          >
            {actionMsg}
          </p>
        )}

        {showTimer && (
          <SessionTimer
            sessionDate={data.session_date}
            endsAt={data.timer.ends_at}
            initialRemainingMs={data.timer.remaining_ms}
            started={data.timer.started}
            timeExpired={data.timer.time_expired}
            sessionDone={data.meeting_closed}
            reviewerJoinOffsetMin={data.timer.reviewer_join_offset_min}
            studentJoinOffsetMin={data.timer.student_join_offset_min}
            waitingForReviewer={data.timer.waiting_for_reviewer}
            waitingForStudent={data.timer.waiting_for_student}
            onExpired={isReviewer ? handleTimerExpired : undefined}
          />
        )}

        {showEarlyEndModal && (
          <div style={{ marginBottom: 16, padding: 16, background: '#fff', border: '1px solid rgba(184,121,0,0.35)' }}>
            <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: '#9a6500' }}>End session before time is up?</p>
            <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.6)', margin: '0 0 12px', lineHeight: 1.5 }}>
              The {SESSION_DURATION_MINUTES}-minute window has not finished. Briefly explain why you are ending early (required for admin records).
            </p>
            <textarea
              value={pendingEarlyEndReason}
              onChange={(e) => setPendingEarlyEndReason(e.target.value)}
              rows={3}
              placeholder="e.g. Review completed early, student no-show after 15 min, technical issues…"
              style={{ width: '100%', padding: 10, fontSize: 13, fontFamily: 'inherit', border: '1px solid rgba(15,13,12,0.15)', marginBottom: 12 }}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                disabled={actionLoading || pendingEarlyEndReason.trim().length < 10}
                onClick={() => markSessionDone(pendingEarlyEndReason)}
                style={{ padding: '8px 16px', background: '#eb4511', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
              >
                End session
              </button>
              <button
                type="button"
                onClick={() => setShowEarlyEndModal(false)}
                style={{ padding: '8px 16px', background: '#fff', border: '1px solid rgba(15,13,12,0.2)', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {isReviewer ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 400px)', gap: 20, alignItems: 'start' }}>
            <div>
              {asRole === 'reviewer' && data.is_host && showVideo && (
                <p style={{ fontSize: 13, color: '#007a4a', marginBottom: 12, fontWeight: 600 }}>
                  You are the session host. Cameras start off — audio only unless you enable video.
                </p>
              )}
              {showVideo ? (
                <DailyRoomEmbed
                  key={`${data.assignment_id}-${asRole}-live`}
                  roomUrl={data.daily_room_url!}
                  token={data.token!}
                  userName="Reviewer"
                  onJoined={handleDailyJoined}
                />
              ) : data.meeting_closed ? (
                <div style={{ padding: 24, background: '#fff', border: '1px solid rgba(15,13,12,0.1)' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Meeting closed</p>
                  <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.6)', margin: 0, lineHeight: 1.6 }}>
                    The video room is no longer available. Review your notes and submit final scores →
                  </p>
                  {data.recording_url && (
                    <a
                      href={data.recording_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 13, color: '#eb4511', marginTop: 12, display: 'inline-block' }}
                    >
                      View recording →
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ padding: 32, background: '#fff', border: '1px solid rgba(15,13,12,0.1)' }}>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>{waiting.title}</p>
                  <p style={{ fontSize: 14, color: waitingColor, lineHeight: 1.6, margin: 0 }}>{waiting.body}</p>
                </div>
              )}

              {!data.session_done && showVideo && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={requestEndSession}
                  style={{
                    marginTop: 16,
                    padding: '10px 20px',
                    background: '#eb4511',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  End session early & continue to scoring
                </button>
              )}

              {showNotesSection && !showVideo && (
                <div style={{ marginTop: 20, padding: 16, background: '#fff', border: '1px solid rgba(15,13,12,0.1)' }}>
                  {notesPanel}
                </div>
              )}
            </div>

            <aside style={{ background: '#fff', border: '1px solid rgba(15,13,12,0.1)', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid rgba(15,13,12,0.1)' }}>
                {(['submission', 'notes', 'score'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSidebarTab(tab)}
                    style={{
                      flex: 1,
                      padding: '12px 6px',
                      border: 'none',
                      background: sidebarTab === tab ? '#faf7f2' : '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderBottom: sidebarTab === tab ? '2px solid #eb4511' : '2px solid transparent',
                    }}
                  >
                    {tab === 'submission' ? 'Submission' : tab === 'notes' ? 'Notes' : 'Scores'}
                  </button>
                ))}
              </div>
              <div style={{ padding: 16 }}>
                {sidebarTab === 'submission' && data.application ? (
                  <SessionSubmissionSidebar application={data.application} />
                ) : sidebarTab === 'notes' ? (
                  notesPanel
                ) : (
                  <>
                    {data.score_submitted ? (
                      <>
                        <p style={{ fontSize: 13, color: '#007a4a', fontWeight: 600, margin: '0 0 12px' }}>
                          Scores submitted and locked.
                        </p>
                        <SessionScoreForm
                          ratings={ratings}
                          onRatingsChange={setRatings}
                          feedbackNotes={feedbackNotes}
                          onFeedbackChange={setFeedbackNotes}
                          compact
                          disabled
                          showSessionNotes={false}
                        />
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.55)', margin: '0 0 12px', lineHeight: 1.5 }}>
                          {data.session_done
                            ? 'Fill in final scores and submit for admin review.'
                            : 'Draft scores during the call — they auto-save.'}
                        </p>
                        <SessionScoreForm
                          ratings={ratings}
                          onRatingsChange={setRatings}
                          feedbackNotes={feedbackNotes}
                          onFeedbackChange={setFeedbackNotes}
                          compact
                          disabled={data.score_submitted}
                          showSessionNotes={false}
                        />
                        {data.session_done && !data.score_submitted && (
                          <>
                            {data.requires_early_end_reason && !data.reviewer_early_end_reason && (
                              <>
                                <p style={{ fontSize: 11, fontWeight: 600, margin: '14px 0 6px', color: '#9a6500' }}>
                                  Why did this session end early? (required)
                                </p>
                                <textarea
                                  value={reviewerEarlyEndReason}
                                  onChange={(e) => setReviewerEarlyEndReason(e.target.value)}
                                  rows={3}
                                  placeholder="Min 10 characters — for admin audit"
                                  style={{ width: '100%', padding: 10, fontSize: 12, fontFamily: 'inherit', border: '1px solid rgba(15,13,12,0.15)', marginBottom: 10 }}
                                />
                              </>
                            )}
                            <button
                            type="button"
                            disabled={actionLoading}
                            onClick={submitScores}
                            style={{
                              marginTop: 14,
                              width: '100%',
                              padding: '10px 16px',
                              background: '#007a4a',
                              color: '#fff',
                              border: 'none',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Submit final scores
                          </button>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </aside>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(300px, 400px)', gap: 20, alignItems: 'start' }}>
            <div>
              {!data.meeting_closed && (
                <>
                  {showVideo ? (
                    <>
                      <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.55)', marginBottom: 16 }}>
                        Your reviewer is the host. Cameras start off — use audio unless you turn video on.
                      </p>
                      <DailyRoomEmbed
                        key={`${data.assignment_id}-${asRole}-live`}
                        roomUrl={data.daily_room_url!}
                        token={data.token!}
                        userName="Student"
                        onJoined={handleDailyJoined}
                      />
                    </>
                  ) : (
                    <div style={{ padding: 32, background: '#fff', border: '1px solid rgba(15,13,12,0.1)', marginBottom: 24 }}>
                      <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>{waiting.title}</p>
                      <p style={{ fontSize: 14, color: waitingColor, lineHeight: 1.6, margin: 0 }}>{waiting.body}</p>
                    </div>
                  )}
                </>
              )}

              {data.meeting_closed && !showVideo && (
                <div style={{ padding: 24, background: '#fff', border: '1px solid rgba(15,13,12,0.1)', marginBottom: 24 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Meeting closed</p>
                  <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.6)', margin: 0, lineHeight: 1.6 }}>
                    The video room is no longer available. Review your notes and responses in the panel →
                  </p>
                </div>
              )}

              {data.session_done ? (
                <div style={{ padding: 24, background: '#fff', border: '1px solid rgba(15,13,12,0.1)' }}>
                  {!data.student_confirmed_at && (
                    <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.55)', margin: '0 0 16px', lineHeight: 1.6 }}>
                      The meeting is closed. Review your notes in the panel, then confirm below when ready.
                    </p>
                  )}
                  {data.student_confirmed_at ? (
                    <>
                      <p style={{ fontSize: 15, fontWeight: 600, color: '#007a4a', margin: '0 0 8px' }}>Session complete</p>
                      <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.6)', margin: 0 }}>
                        You confirmed this session on{' '}
                        {new Date(data.student_confirmed_at).toLocaleString('en-IN')}. Admin will finalize your result.
                      </p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 8px' }}>Session finished</p>
                      <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.6)', margin: '0 0 20px', lineHeight: 1.6 }}>
                        Optional: rate call quality and leave feedback, then mark the session complete.
                      </p>
                      <StarRating label="Audio quality" value={feedbackAudio ?? null} onChange={setFeedbackAudio} disabled={actionLoading} />
                      <StarRating label="Video quality" value={feedbackVideo ?? null} onChange={setFeedbackVideo} disabled={actionLoading} />
                      <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 6px' }}>
                        Other feedback <span style={{ fontWeight: 400, color: 'rgba(15,13,12,0.45)' }}>(optional)</span>
                      </p>
                      <textarea
                        value={feedbackNotesStudent}
                        onChange={(e) => setFeedbackNotesStudent(e.target.value)}
                        rows={3}
                        placeholder="Anything we should know about the session?"
                        style={{
                          width: '100%',
                          padding: 10,
                          fontSize: 13,
                          fontFamily: 'inherit',
                          border: '1px solid rgba(15,13,12,0.15)',
                          marginBottom: 16,
                        }}
                      />
                      {data.requires_early_end_reason && !data.reviewer_early_end_reason && (
                        <>
                          <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 6px', color: '#9a6500' }}>
                            Why did this session end early? (required)
                          </p>
                          <textarea
                            value={studentEarlyEndReason}
                            onChange={(e) => setStudentEarlyEndReason(e.target.value)}
                            rows={3}
                            placeholder="Your perspective — min 10 characters"
                            style={{
                              width: '100%',
                              padding: 10,
                              fontSize: 13,
                              fontFamily: 'inherit',
                              border: '1px solid rgba(15,13,12,0.15)',
                              marginBottom: 16,
                            }}
                          />
                        </>
                      )}
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={confirmSession}
                        style={{
                          padding: '10px 24px',
                          background: '#007a4a',
                          color: '#fff',
                          border: 'none',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Mark session complete
                      </button>
                    </>
                  )}
                </div>
              ) : data.meeting_closed && !data.session_done ? (
                <div style={{ padding: 20, background: '#fff', border: '1px solid rgba(15,13,12,0.1)' }}>
                  <p style={{ fontSize: 14, color: '#9a6500', margin: 0, lineHeight: 1.6 }}>
                    The {SESSION_DURATION_MINUTES}-minute window has ended and the meeting is closed. Waiting for your reviewer to wrap up — you can confirm once they finish.
                  </p>
                </div>
              ) : null}
            </div>

            <aside style={{ background: '#fff', border: '1px solid rgba(15,13,12,0.1)', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto', position: 'sticky', top: 88 }}>
              <div style={{ padding: 16, borderBottom: showNotesSection ? '1px solid rgba(15,13,12,0.1)' : undefined }}>
                {showNotesSection ? (
                  notesPanel
                ) : (
                  <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.45)', margin: 0 }}>
                    Session notes will appear here once the call opens.
                  </p>
                )}
              </div>
              <div style={{ padding: 16 }}>
                {data.application ? (
                  <SessionSubmissionSidebar application={data.application} heading="Your responses" />
                ) : (
                  <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.45)', margin: 0 }}>Could not load your submission.</p>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
