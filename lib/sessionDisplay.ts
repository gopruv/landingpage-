export function isSessionConfirmed(params: {
  workflowStage?: string | null;
  assignmentStatus?: string | null;
  applicationStatus?: string | null;
}): boolean {
  if (params.workflowStage === 'session_proposed') return false;
  if (params.workflowStage === 'session_approved') return true;
  if (params.assignmentStatus === 'scheduled') return true;
  if (params.applicationStatus === 'scheduled') return true;
  return false;
}

/** Human-readable tentative times from reviewer proposal notes. */
export function formatTentativeSessionDisplay(notes?: string | null): string | null {
  if (!notes?.trim()) return null;

  const slotsLine = notes.match(/1-hour slots selected:\s*(.+)/i);
  if (slotsLine) {
    const preference = notes.match(/Candidate preference:\s*([^\n]+)/i)?.[1];
    const slots = slotsLine[1].trim();
    return preference ? `${preference} · ${slots}` : slots;
  }

  const alternate = notes.match(/Reviewer suggested alternate:\s*([^\n]+)/i);
  if (alternate) return alternate[1].trim();

  const cleaned = notes
    .replace(/^Proposal submitted: \S+\n?/i, '')
    .replace(/\[admin_reminders:\d+\]\n?/i, '')
    .replace(/Admin to confirm final session time\.?\n?/i, '')
    .replace(/\[Reschedule requested[^\n]*\n?/gi, '')
    .trim();

  if (!cleaned) return null;
  const lines = cleaned.split('\n').filter(Boolean);
  return lines.slice(0, 3).join(' · ');
}

export function hoursSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return (Date.now() - d.getTime()) / (1000 * 60 * 60);
}

export function parseProposalSubmittedAt(
  notes?: string | null,
  columnValue?: string | null,
): Date | null {
  if (columnValue) {
    const d = new Date(columnValue);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const match = notes?.match(/Proposal submitted: (\S+)/);
  if (!match) return null;
  const d = new Date(match[1]);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getAdminReminderCount(
  notes?: string | null,
  columnValue?: number | null,
): number {
  if (columnValue != null && !Number.isNaN(columnValue)) return columnValue;
  const match = notes?.match(/\[admin_reminders:(\d+)\]/);
  return match ? parseInt(match[1], 10) : 0;
}
