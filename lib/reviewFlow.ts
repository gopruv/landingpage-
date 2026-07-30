export type ReviewStep = 'answers' | 'github' | 'loom' | 'availability';

export const REVIEW_STEPS: ReviewStep[] = ['answers', 'github', 'loom', 'availability'];

export const CHECKLIST_ITEMS = [
  { key: 'read_answers', label: 'Read application answers' },
  { key: 'github', label: 'Review GitHub repository' },
  { key: 'loom', label: 'Watch Loom walkthrough' },
  { key: 'select_time', label: 'Select session time' },
  { key: 'mark_reviewed', label: 'Mark application reviewed' },
] as const;

export type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]['key'];

export interface ReviewProgress {
  completed: Partial<Record<ChecklistKey, boolean>>;
  githubNote: string;
  loomNote: string;
  selectedSlot: string | null;
  /** 1-hour option ids within the selected parent window (e.g. "18", "19") */
  selectedHourSlots: string[];
  customSlot: string;
  useCustomSlot: boolean;
}

const defaultProgress = (): ReviewProgress => ({
  completed: {},
  githubNote: '',
  loomNote: '',
  selectedSlot: null,
  selectedHourSlots: [],
  customSlot: '',
  useCustomSlot: false,
});

export function loadReviewProgress(assignmentId: string): ReviewProgress {
  if (typeof window === 'undefined') return defaultProgress();
  try {
    const raw = localStorage.getItem(`reviewer-flow-${assignmentId}`);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<ReviewProgress>;
    return {
      ...defaultProgress(),
      ...parsed,
      selectedHourSlots: parsed.selectedHourSlots ?? [],
    };
  } catch {
    return defaultProgress();
  }
}

export function saveReviewProgress(assignmentId: string, progress: ReviewProgress) {
  localStorage.setItem(`reviewer-flow-${assignmentId}`, JSON.stringify(progress));
}

export function loadPrivateNotes(assignmentId: string): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(`reviewer-private-notes-${assignmentId}`) ?? '';
}

export function savePrivateNotes(assignmentId: string, notes: string) {
  localStorage.setItem(`reviewer-private-notes-${assignmentId}`, notes);
}

export function loomEmbedUrl(url: string): string | null {
  const share = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
  if (share) return `https://www.loom.com/embed/${share[1]}`;
  const embed = url.match(/loom\.com\/embed\/([a-zA-Z0-9]+)/);
  if (embed) return url;
  return null;
}

export function googleCalendarUrl(title: string, startIso: string, durationMin = 45): string | null {
  if (!startIso) return null;
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + durationMin * 60_000);
  const fmt = (d: Date) => `${d.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: 'Orcred technical review session — join link will be shared by admin before the meeting.',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export interface AvailabilitySlot {
  date: string;
  time: string;
  timezone: string;
  description?: string;
}

export function candidateSlotLabel(slot: AvailabilitySlot): string {
  if (slot.description?.trim()) return slot.description.trim();
  const tz = slot.timezone?.replace(/_/g, '/') ?? 'Asia/Kolkata';
  try {
    const label = new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz.includes('/') ? tz : 'Asia/Kolkata',
    }).format(new Date(`${slot.date}T${slot.time.length === 5 ? `${slot.time}:00` : slot.time}`));
    return `${label} (${slot.timezone})`;
  } catch {
    return `${slot.date} — ${slot.time} (${slot.timezone})`;
  }
}

/** One row per candidate preference (handles legacy combined text split by ; or newline). */
export function expandCandidateSlots(slots: AvailabilitySlot[]): AvailabilitySlot[] {
  const out: AvailabilitySlot[] = [];
  for (const slot of slots) {
    const desc = slot.description?.trim();
    if (desc && /[;\n]/.test(desc)) {
      const parts = desc.split(/[;\n]+/).map((p) => p.trim()).filter(Boolean);
      for (const part of parts) {
        out.push({ ...slot, description: part });
      }
    } else {
      out.push(slot);
    }
  }
  return out;
}

export function slotLabel(slot: AvailabilitySlot): string {
  return candidateSlotLabel(slot);
}

export interface HourSlotOption {
  id: string;
  label: string;
  startHour: number;
}

function parseHourToken(token: string): number | null {
  const m = token.trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const ampm = m[3]?.toLowerCase();
  if (ampm === 'pm' && h < 12) h += 12;
  if (ampm === 'am' && h === 12) h = 0;
  if (!ampm && h <= 12 && /pm/i.test(token)) h += 12;
  return h >= 0 && h <= 23 ? h : null;
}

function formatHour12(h: number): string {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:00 ${period}`;
}

function formatHourRange(start: number, end: number): string {
  return `${formatHour12(start)} – ${formatHour12(end)}`;
}

/** Parse a time window from a preference label. */
export function parseTimeRange(description: string): { start: number; end: number } | null {
  const desc = description.trim();
  const paren = desc.match(/\(([^)]+)\)/);
  const rangeText = paren?.[1] ?? desc;

  const explicit = rangeText.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*[–—-]\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  );
  if (explicit) {
    const start = parseHourToken(explicit[1]);
    const end = parseHourToken(explicit[2]);
    if (start != null && end != null && end > start) return { start, end };
  }

  const lower = desc.toLowerCase();
  if (lower.includes('morning')) return { start: 9, end: 12 };
  if (lower.includes('afternoon')) return { start: 14, end: 17 };
  if (lower.includes('evening')) return { start: 18, end: 21 };

  return null;
}

export function hourlyOptionsForSlot(slot: AvailabilitySlot): HourSlotOption[] {
  const desc = slot.description ?? candidateSlotLabel(slot);
  const range = parseTimeRange(desc);

  if (range) {
    const options: HourSlotOption[] = [];
    for (let h = range.start; h < range.end; h++) {
      options.push({
        id: String(h),
        startHour: h,
        label: formatHourRange(h, h + 1),
      });
    }
    return options;
  }

  const fallbackStart = parseInt((slot.time ?? '18:00').slice(0, 2), 10);
  const start = Number.isNaN(fallbackStart) ? 18 : fallbackStart;
  return [{
    id: String(start),
    startHour: start,
    label: formatHourRange(start, start + 1),
  }];
}

export function hourSlotLabels(slot: AvailabilitySlot, hourIds: string[]): string[] {
  const options = hourlyOptionsForSlot(slot);
  return hourIds
    .map((id) => options.find((o) => o.id === id)?.label)
    .filter(Boolean) as string[];
}

export function slotToIso(slot: AvailabilitySlot, hour24?: number): string {
  const h = hour24 ?? parseInt((slot.time ?? '18:00').slice(0, 2), 10);
  const t = `${String(h).padStart(2, '0')}:00:00`;
  const d = new Date(`${slot.date}T${t}`);
  if (Number.isNaN(d.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 7);
    fallback.setHours(h, 0, 0, 0);
    return fallback.toISOString();
  }
  return d.toISOString();
}

export function parseSessionTime(
  useCustomSlot: boolean,
  customSlot: string,
  selectedSlot: string | null,
  selectedHourSlots: string[] = [],
): string {
  const all = parseAllSessionTimes(useCustomSlot, customSlot, selectedSlot, selectedHourSlots);
  if (all.length === 0) {
    throw new Error('Select a candidate preference or suggest one alternate time');
  }
  return all[0];
}

export function parseAllSessionTimes(
  useCustomSlot: boolean,
  customSlot: string,
  selectedSlot: string | null,
  selectedHourSlots: string[] = [],
): string[] {
  if (useCustomSlot) {
    if (!customSlot) throw new Error('Enter a session date and time');
    const d = new Date(customSlot);
    if (Number.isNaN(d.getTime())) throw new Error('Invalid session time — pick another slot');
    return [d.toISOString()];
  }

  if (!selectedSlot) {
    throw new Error('Select a candidate preference or suggest one alternate time');
  }
  if (selectedHourSlots.length === 0) {
    throw new Error('Select at least one 1-hour slot within your chosen window');
  }

  const slot = JSON.parse(selectedSlot) as AvailabilitySlot;
  const times = selectedHourSlots.map((hourId) => {
    const hour = parseInt(hourId, 10);
    const d = new Date(slotToIso(slot, Number.isNaN(hour) ? undefined : hour));
    if (Number.isNaN(d.getTime())) {
      throw new Error('Invalid session time — pick another slot');
    }
    return d.toISOString();
  });

  return times.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
}

export function selectedSlotSummary(
  useCustomSlot: boolean,
  customSlot: string,
  selectedSlot: string | null,
  selectedHourSlots: string[] = [],
): string {
  if (useCustomSlot && customSlot) {
    const d = new Date(customSlot);
    if (!Number.isNaN(d.getTime())) {
      return `Reviewer suggested alternate: ${d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`;
    }
    return 'Reviewer suggested alternate time (see datetime)';
  }
  if (selectedSlot) {
    const slot = JSON.parse(selectedSlot) as AvailabilitySlot;
    const window = candidateSlotLabel(slot);
    const hours = hourSlotLabels(slot, selectedHourSlots);
    if (hours.length > 0) {
      return `Candidate preference: ${window}\n1-hour slots selected: ${hours.join(', ')}`;
    }
    return `Candidate preference: ${window}`;
  }
  return '';
}
