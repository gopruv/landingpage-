'use client';

function fmt(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fmtOffset(minutes: number | null | undefined): string {
  if (minutes == null) return '—';
  if (minutes <= 0) return 'On time';
  return `${minutes} min late`;
}

export interface SessionAuditData {
  session_date?: string | null;
  reviewer_joined_at?: string | null;
  student_joined_at?: string | null;
  session_completed_at?: string | null;
  student_session_confirmed_at?: string | null;
  reviewer_early_end_reason?: string | null;
  student_early_end_reason?: string | null;
}

interface AdminSessionAuditProps {
  assignment: SessionAuditData | null;
  scoreSubmittedAt?: string | null;
  scheduledDurationMin?: number;
}

export default function AdminSessionAudit({
  assignment,
  scoreSubmittedAt,
  scheduledDurationMin = 40,
}: AdminSessionAuditProps) {
  if (!assignment?.session_date) return null;

  const scheduledStart = new Date(assignment.session_date);
  const scheduledEnd = new Date(scheduledStart.getTime() + scheduledDurationMin * 60 * 1000);

  let actualMinutes: number | null = null;
  if (assignment.session_completed_at) {
    const endMs = new Date(assignment.session_completed_at).getTime();
    const bothMs =
      assignment.reviewer_joined_at && assignment.student_joined_at
        ? Math.max(
            new Date(assignment.reviewer_joined_at).getTime(),
            new Date(assignment.student_joined_at).getTime(),
          )
        : scheduledStart.getTime();
    actualMinutes = Math.max(0, Math.round((endMs - bothMs) / 60_000));
  }

  const reviewerLate =
    assignment.reviewer_joined_at && assignment.session_date
      ? Math.round(
          (new Date(assignment.reviewer_joined_at).getTime() - scheduledStart.getTime()) / 60_000,
        )
      : null;
  const studentLate =
    assignment.student_joined_at && assignment.session_date
      ? Math.round(
          (new Date(assignment.student_joined_at).getTime() - scheduledStart.getTime()) / 60_000,
        )
      : null;

  const endedEarly =
    assignment.session_completed_at
    && new Date(assignment.session_completed_at).getTime() < scheduledEnd.getTime() - 5 * 60 * 1000;

  const rows = [
    { label: 'Scheduled start', value: fmt(assignment.session_date) },
    { label: 'Scheduled end (hard stop)', value: fmt(scheduledEnd.toISOString()) },
    { label: 'Student joined', value: assignment.student_joined_at ? `${fmt(assignment.student_joined_at)} (${fmtOffset(studentLate)})` : 'Did not join' },
    { label: 'Reviewer joined', value: assignment.reviewer_joined_at ? `${fmt(assignment.reviewer_joined_at)} (${fmtOffset(reviewerLate)})` : 'Did not join' },
    { label: 'Session ended (reviewer)', value: fmt(assignment.session_completed_at) },
    { label: 'Overlap duration', value: actualMinutes != null ? `${actualMinutes} min` : '—' },
    { label: 'Score submitted', value: fmt(scoreSubmittedAt) },
    { label: 'Student confirmed', value: fmt(assignment.student_session_confirmed_at) },
  ];

  return (
    <div style={{ marginBottom: 16, padding: 14, border: '1px solid rgba(15,13,12,0.1)', background: 'rgba(0,95,163,0.03)' }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#005fa3', margin: '0 0 12px' }}>
        Session audit log
      </p>
      {endedEarly && (
        <p style={{ fontSize: 12, color: '#9a6500', margin: '0 0 10px', fontWeight: 600 }}>
          Ended before the {scheduledDurationMin}-minute window
        </p>
      )}
      <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td style={{ padding: '5px 8px 5px 0', color: 'rgba(15,13,12,0.45)', verticalAlign: 'top', width: '42%' }}>{r.label}</td>
              <td style={{ padding: '5px 0', color: 'rgba(15,13,12,0.75)', verticalAlign: 'top' }}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {assignment.reviewer_early_end_reason && (
        <div style={{ marginTop: 12, padding: 10, background: '#fff', border: '1px solid rgba(15,13,12,0.08)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, margin: '0 0 4px' }}>Reviewer — why session ended early</p>
          <p style={{ fontSize: 12, margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{assignment.reviewer_early_end_reason}</p>
        </div>
      )}
      {assignment.student_early_end_reason && (
        <div style={{ marginTop: 10, padding: 10, background: '#fff', border: '1px solid rgba(15,13,12,0.08)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, margin: '0 0 4px' }}>Student — why session ended early</p>
          <p style={{ fontSize: 12, margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{assignment.student_early_end_reason}</p>
        </div>
      )}
    </div>
  );
}
