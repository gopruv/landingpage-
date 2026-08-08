'use client';

import { useEffect, useState } from 'react';
import { SESSION_DURATION_MINUTES, formatJoinOffset } from '@/lib/sessionAccess';

function formatRemaining(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

interface SessionTimerProps {
  sessionDate: string | null;
  endsAt: string | null;
  initialRemainingMs: number;
  started: boolean;
  timeExpired: boolean;
  sessionDone: boolean;
  reviewerJoinOffsetMin?: number | null;
  studentJoinOffsetMin?: number | null;
  waitingForReviewer?: boolean;
  waitingForStudent?: boolean;
  onExpired?: () => void;
}

export default function SessionTimer({
  sessionDate,
  endsAt,
  initialRemainingMs,
  started,
  timeExpired,
  sessionDone,
  reviewerJoinOffsetMin,
  studentJoinOffsetMin,
  waitingForReviewer,
  waitingForStudent,
  onExpired,
}: SessionTimerProps) {
  const [remainingMs, setRemainingMs] = useState(initialRemainingMs);
  const [expiredFired, setExpiredFired] = useState(false);

  useEffect(() => {
    setRemainingMs(initialRemainingMs);
  }, [initialRemainingMs]);

  useEffect(() => {
    if (!sessionDate || sessionDone || timeExpired) return;

    const endMs = endsAt
      ? new Date(endsAt).getTime()
      : new Date(sessionDate).getTime() + SESSION_DURATION_MINUTES * 60 * 1000;

    const tick = () => {
      const next = Math.max(0, endMs - Date.now());
      setRemainingMs(next);
      if (next <= 0 && !expiredFired) {
        setExpiredFired(true);
        onExpired?.();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionDate, endsAt, sessionDone, timeExpired, expiredFired, onExpired]);

  if (!sessionDate) return null;

  const expired = timeExpired || remainingMs <= 0 || sessionDone;
  const urgent = !expired && remainingMs <= 5 * 60 * 1000;
  const waiting = !started && !expired;

  let statusLine = `Time remaining until the ${SESSION_DURATION_MINUTES}-minute hard stop (from scheduled start)`;
  if (expired) {
    statusLine = 'Session time ended — meeting closed';
  } else if (waiting) {
    statusLine = 'Scheduled start not reached yet — timer counts down from scheduled time';
  } else if (waitingForReviewer) {
    statusLine = 'Waiting for reviewer to join — clock still runs from scheduled start';
  } else if (waitingForStudent) {
    statusLine = 'Waiting for student to join — clock still runs from scheduled start';
  } else if (reviewerJoinOffsetMin != null && reviewerJoinOffsetMin > 0) {
    statusLine = `Reviewer joined ${formatJoinOffset(reviewerJoinOffsetMin)} — ${formatRemaining(remainingMs)} left until hard stop`;
  } else if (studentJoinOffsetMin != null && studentJoinOffsetMin > 0) {
    statusLine = `You joined ${formatJoinOffset(studentJoinOffsetMin)} — ${formatRemaining(remainingMs)} left until hard stop`;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 14px',
        marginBottom: 12,
        background: expired ? 'rgba(15,13,12,0.04)' : urgent ? 'rgba(186,26,26,0.06)' : 'rgba(0,122,74,0.06)',
        border: `1px solid ${expired ? 'rgba(15,13,12,0.12)' : urgent ? 'rgba(186,26,26,0.2)' : 'rgba(0,122,74,0.2)'}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0, color: 'rgba(15,13,12,0.45)' }}>
          Session timer · {SESSION_DURATION_MINUTES} min max from scheduled start
        </p>
        <p style={{ fontSize: 12, margin: '4px 0 0', color: 'rgba(15,13,12,0.55)', lineHeight: 1.45 }}>
          {statusLine}
        </p>
        {(reviewerJoinOffsetMin != null || studentJoinOffsetMin != null) && !expired && (
          <p style={{ fontSize: 11, margin: '6px 0 0', color: 'rgba(15,13,12,0.45)' }}>
            {studentJoinOffsetMin != null && (
              <span>Student: {formatJoinOffset(studentJoinOffsetMin)}</span>
            )}
            {studentJoinOffsetMin != null && reviewerJoinOffsetMin != null && ' · '}
            {reviewerJoinOffsetMin != null && (
              <span>Reviewer: {formatJoinOffset(reviewerJoinOffsetMin)}</span>
            )}
          </p>
        )}
      </div>
      <p
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          margin: 0,
          flexShrink: 0,
          color: expired ? 'rgba(15,13,12,0.4)' : urgent ? '#ba1a1a' : '#007a4a',
        }}
      >
        {expired ? '00:00' : waiting ? formatRemaining(SESSION_DURATION_MINUTES * 60 * 1000) : formatRemaining(remainingMs)}
      </p>
    </div>
  );
}
