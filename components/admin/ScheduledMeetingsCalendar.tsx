'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';

const BORDER = '1px solid rgba(15,13,12,0.1)';

export type CalendarSessionStatus =
  | 'done'
  | 'skipped'
  | 'today'
  | 'rescheduled_past'
  | 'upcoming';

export interface ScheduledSession {
  assignment_id: string;
  application_id: string;
  project_name: string;
  session_date: string;
  calendar_status: CalendarSessionStatus;
  is_ghost?: boolean;
  moved_to_date?: string | null;
  assignment_status?: string;
  workflow_stage?: string | null;
  daily_room_url?: string | null;
  student_code?: string | null;
  student_name?: string | null;
  student_email?: string | null;
  reviewer_name?: string | null;
  reviewer_email?: string | null;
}

const STATUS_META: Record<
  CalendarSessionStatus,
  { label: string; color: string; bg: string }
> = {
  done:             { label: 'Completed',           color: '#007a4a', bg: 'rgba(0,122,74,0.12)' },
  skipped:          { label: 'Skipped / no-show', color: '#ba1a1a', bg: 'rgba(186,26,26,0.1)' },
  today:            { label: 'Today',               color: '#005fa3', bg: 'rgba(0,95,163,0.1)' },
  rescheduled_past: { label: 'Rescheduled (was here)', color: '#9a6500', bg: 'rgba(154,101,0,0.12)' },
  upcoming:         { label: 'Upcoming',            color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function statusLabel(status: CalendarSessionStatus): string {
  return STATUS_META[status].label;
}

function StatusDot({ status, size = 8 }: { status: CalendarSessionStatus; size?: number }) {
  const { color } = STATUS_META[status];
  return (
    <span
      title={statusLabel(status)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    >
      {status === 'skipped' && (
        <span
          style={{
            position: 'absolute',
            fontSize: size >= 8 ? 7 : 6,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -52%)',
          }}
        >
          !
        </span>
      )}
    </span>
  );
}

function CalendarLegend() {
  const items: CalendarSessionStatus[] = [
    'done',
    'skipped',
    'today',
    'rescheduled_past',
    'upcoming',
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px 16px',
        padding: '12px 20px',
        borderBottom: BORDER,
        background: 'rgba(250,247,242,0.5)',
      }}
    >
      {items.map((status) => (
        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StatusDot status={status} size={status === 'skipped' ? 9 : 8} />
          <span style={{ fontSize: 11, color: 'rgba(15,13,12,0.55)' }}>
            {STATUS_META[status].label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ScheduledMeetingsCalendar({
  onOpenApplication,
}: {
  onOpenApplication?: (applicationId: string) => void;
}) {
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1).toISOString();
      const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59).toISOString();
      const res = await api.admin.scheduledSessions({ from, to }) as { data?: ScheduledSession[] };
      setSessions(res?.data ?? []);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to load calendar');
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [cursor]);

  useEffect(() => {
    load();
  }, [load]);

  const sessionsByDay = useMemo(() => {
    const map = new Map<string, ScheduledSession[]>();
    for (const s of sessions) {
      const key = new Date(s.session_date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [sessions]);

  const monthLabel = cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const firstDow = new Date(cursor.getFullYear(), cursor.getMonth(), 1).getDay();
  const totalDays = daysInMonth(cursor);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const selectedSessions = selectedDay
    ? sessionsByDay.get(selectedDay.toDateString()) ?? []
    : [];

  return (
    <div style={{ background: '#fff', border: BORDER, marginBottom: 16 }}>
      <div style={{ padding: '16px 20px', borderBottom: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.4)', margin: '0 0 4px' }}>
            Review sessions
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Past &amp; upcoming — color key below</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} style={{ padding: '6px 10px', border: BORDER, background: '#fff', cursor: 'pointer', fontSize: 12 }}>←</button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 140, textAlign: 'center', alignSelf: 'center' }}>{monthLabel}</span>
          <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} style={{ padding: '6px 10px', border: BORDER, background: '#fff', cursor: 'pointer', fontSize: 12 }}>→</button>
        </div>
      </div>

      <CalendarLegend />

      {error && (
        <p style={{ padding: '12px 20px', margin: 0, fontSize: 12, color: '#ba1a1a' }}>{error}</p>
      )}

      <div style={{ padding: '16px 20px 8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} style={{ fontSize: 10, fontWeight: 600, color: 'rgba(15,13,12,0.35)', textAlign: 'center', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;
            const date = new Date(cursor.getFullYear(), cursor.getMonth(), day);
            const daySessions = sessionsByDay.get(date.toDateString()) ?? [];
            const isSelected = selectedDay && sameDay(selectedDay, date);
            const isToday = sameDay(date, new Date());
            const hasTodaySession = daySessions.some((s) => s.calendar_status === 'today');
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(date)}
                style={{
                  minHeight: 56,
                  padding: 6,
                  border: isSelected
                    ? '2px solid #eb4511'
                    : isToday
                      ? '2px solid rgba(0,95,163,0.45)'
                      : BORDER,
                  background: hasTodaySession
                    ? 'rgba(0,95,163,0.06)'
                    : isToday
                      ? 'rgba(0,95,163,0.04)'
                      : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{
                  fontSize: 12,
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? '#005fa3' : '#0f0d0c',
                }}
                >
                  {day}
                </span>
                {daySessions.length > 0 && (
                  <span style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6, alignItems: 'center' }}>
                    {daySessions.slice(0, 6).map((s) => (
                      <StatusDot
                        key={`${s.assignment_id}-${s.session_date}-${s.is_ghost ? 'ghost' : 'live'}`}
                        status={s.calendar_status}
                        size={s.calendar_status === 'skipped' ? 9 : 8}
                      />
                    ))}
                    {daySessions.length > 6 && (
                      <span style={{ fontSize: 9, color: 'rgba(15,13,12,0.4)', fontWeight: 600 }}>
                        +{daySessions.length - 6}
                      </span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '12px 20px 20px', borderTop: BORDER }}>
        {loading ? (
          <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.4)', margin: 0 }}>Loading sessions…</p>
        ) : selectedDay ? (
          selectedSessions.length === 0 ? (
            <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.45)', margin: 0 }}>
              No sessions on {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,13,12,0.4)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedSessions.map((s) => {
                const meta = STATUS_META[s.calendar_status];
                return (
                  <div
                    key={`${s.assignment_id}-${s.session_date}-${s.is_ghost ? 'g' : 'l'}`}
                    style={{
                      padding: 12,
                      border: BORDER,
                      background: meta.bg,
                      borderLeft: `3px solid ${meta.color}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <StatusDot status={s.calendar_status} size={9} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: meta.color }}>
                        {statusLabel(s.calendar_status)}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{s.project_name}</p>
                    <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.55)', margin: '0 0 2px' }}>
                      {new Date(s.session_date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                      {s.student_code && <> · {s.student_code}</>}
                    </p>
                    {s.is_ghost && s.moved_to_date && (
                      <p style={{ fontSize: 11, color: '#9a6500', margin: '0 0 6px', fontWeight: 500 }}>
                        Moved to{' '}
                        {new Date(s.moved_to_date).toLocaleString('en-IN', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    {!s.is_ghost && (
                      <p style={{ fontSize: 11, color: 'rgba(15,13,12,0.45)', margin: '0 0 8px' }}>
                        Student: {s.student_name} · Reviewer: {s.reviewer_name}
                      </p>
                    )}
                    {onOpenApplication && !s.is_ghost && (
                      <button
                        type="button"
                        onClick={() => onOpenApplication(s.application_id)}
                        style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, background: '#fff', border: BORDER, cursor: 'pointer' }}
                      >
                        Open application →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.45)', margin: 0 }}>
            {sessions.length} session{sessions.length === 1 ? '' : 's'} this month — click a day to view details.
          </p>
        )}
      </div>
    </div>
  );
}
