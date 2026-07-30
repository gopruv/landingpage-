'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';

const BORDER = '1px solid rgba(15,13,12,0.1)';

export interface ScheduledSession {
  assignment_id: string;
  application_id: string;
  project_name: string;
  session_date: string;
  daily_room_url?: string | null;
  student_code?: string | null;
  student_name?: string | null;
  student_email?: string | null;
  reviewer_name?: string | null;
  reviewer_email?: string | null;
}

function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
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
      <div style={{ padding: '16px 20px', borderBottom: BORDER, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.4)', margin: '0 0 4px' }}>
            Scheduled meetings
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Admin-approved sessions only</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))} style={{ padding: '6px 10px', border: BORDER, background: '#fff', cursor: 'pointer', fontSize: 12 }}>←</button>
          <span style={{ fontSize: 13, fontWeight: 600, minWidth: 140, textAlign: 'center', alignSelf: 'center' }}>{monthLabel}</span>
          <button type="button" onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))} style={{ padding: '6px 10px', border: BORDER, background: '#fff', cursor: 'pointer', fontSize: 12 }}>→</button>
        </div>
      </div>

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
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(date)}
                style={{
                  minHeight: 56,
                  padding: 6,
                  border: isSelected ? '2px solid #eb4511' : BORDER,
                  background: isToday ? 'rgba(235,69,17,0.04)' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: '#0f0d0c' }}>{day}</span>
                {daySessions.length > 0 && (
                  <span style={{ display: 'block', marginTop: 4, fontSize: 10, fontWeight: 600, color: '#007a4a' }}>
                    {daySessions.length} session{daySessions.length === 1 ? '' : 's'}
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
              No approved sessions on {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(15,13,12,0.4)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {selectedDay.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedSessions.map((s) => (
                <div key={s.assignment_id} style={{ padding: 12, border: BORDER, background: '#faf7f2' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{s.project_name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.55)', margin: '0 0 2px' }}>
                    {new Date(s.session_date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}
                    {s.student_code && <> · {s.student_code}</>}
                  </p>
                  <p style={{ fontSize: 11, color: 'rgba(15,13,12,0.45)', margin: '0 0 8px' }}>
                    Student: {s.student_name} · Reviewer: {s.reviewer_name}
                  </p>
                  {onOpenApplication && (
                    <button
                      type="button"
                      onClick={() => onOpenApplication(s.application_id)}
                      style={{ padding: '5px 10px', fontSize: 11, fontWeight: 600, background: '#fff', border: BORDER, cursor: 'pointer' }}
                    >
                      Open application →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.45)', margin: 0 }}>
            {sessions.length} approved session{sessions.length === 1 ? '' : 's'} this month — click a day to view details.
          </p>
        )}
      </div>
    </div>
  );
}
