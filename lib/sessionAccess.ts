export const SESSION_JOIN_HOURS_BEFORE = 24;
export const SESSION_DURATION_MINUTES = 40;
export const EARLY_END_BUFFER_MINUTES = 5;

export function getScheduledEndMs(sessionDate: string): number {
  return new Date(sessionDate).getTime() + SESSION_DURATION_MINUTES * 60 * 1000;
}

export function joinOffsetMinutes(sessionDate: string, joinedAt: string): number {
  return Math.round((new Date(joinedAt).getTime() - new Date(sessionDate).getTime()) / 60_000);
}

export function formatJoinOffset(minutes: number): string {
  if (minutes <= 0) return 'on time';
  if (minutes === 1) return '1 min late';
  return `${minutes} min late`;
}

export function getSessionEndMs(sessionDate: string): number {
  return getScheduledEndMs(sessionDate);
}

export function getSessionTimerState(
  sessionDate: string | null | undefined,
  opts?: {
    reviewerJoinedAt?: string | null;
    studentJoinedAt?: string | null;
  },
) {
  const durationMinutes = SESSION_DURATION_MINUTES;
  if (!sessionDate) {
    return {
      durationMinutes,
      endsAt: null,
      remainingMs: 0,
      timeExpired: false,
      started: false,
      reviewerJoinOffsetMin: null as number | null,
      studentJoinOffsetMin: null as number | null,
      bothJoinedAt: null as string | null,
      waitingForReviewer: false,
      waitingForStudent: false,
    };
  }

  const startMs = new Date(sessionDate).getTime();
  const endMs = getScheduledEndMs(sessionDate);
  const now = Date.now();
  const reviewerOffset = opts?.reviewerJoinedAt
    ? joinOffsetMinutes(sessionDate, opts.reviewerJoinedAt)
    : null;
  const studentOffset = opts?.studentJoinedAt
    ? joinOffsetMinutes(sessionDate, opts.studentJoinedAt)
    : null;

  const bothAt =
    opts?.reviewerJoinedAt && opts?.studentJoinedAt
      ? new Date(
          Math.max(
            new Date(opts.reviewerJoinedAt).getTime(),
            new Date(opts.studentJoinedAt).getTime(),
          ),
        ).toISOString()
      : null;

  return {
    durationMinutes,
    endsAt: new Date(endMs).toISOString(),
    remainingMs: Math.max(0, endMs - now),
    timeExpired: now >= endMs,
    started: now >= startMs,
    reviewerJoinOffsetMin: reviewerOffset,
    studentJoinOffsetMin: studentOffset,
    bothJoinedAt: bothAt,
    waitingForReviewer: !!opts?.studentJoinedAt && !opts?.reviewerJoinedAt,
    waitingForStudent: !!opts?.reviewerJoinedAt && !opts?.studentJoinedAt,
  };
}

export function getSessionJoinState(
  sessionDate: string | null | undefined,
  opts?: { sessionDone?: boolean },
): {
  canJoin: boolean;
  message: string;
  opensAt?: string;
} {
  if (opts?.sessionDone) {
    return {
      canJoin: false,
      message: 'This session has ended. The meeting is no longer available.',
    };
  }

  if (!sessionDate) {
    return { canJoin: false, message: 'Session time is not set yet.' };
  }

  const sessionTime = new Date(sessionDate);
  if (Number.isNaN(sessionTime.getTime())) {
    return { canJoin: false, message: 'Invalid session time.' };
  }

  const now = Date.now();
  const startMs = sessionTime.getTime();
  const opensMs = startMs - SESSION_JOIN_HOURS_BEFORE * 60 * 60 * 1000;
  const endMs = getScheduledEndMs(sessionDate);

  if (now < opensMs) {
    const opensAt = new Date(opensMs).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    return {
      canJoin: false,
      opensAt,
      message: `Join link opens 24 hours before your session (${opensAt} IST).`,
    };
  }

  if (now >= endMs) {
    return {
      canJoin: false,
      message: `The ${SESSION_DURATION_MINUTES}-minute session window has ended.`,
    };
  }

  return { canJoin: true, message: 'You can join the session now.' };
}
