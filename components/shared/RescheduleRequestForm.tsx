'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const BORDER = '1px solid rgba(15,13,12,0.1)';

function localDatetimeToIso(local: string): string | undefined {
  if (!local.trim()) return undefined;
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

export function isReschedulePending(notes?: string | null): boolean {
  return !!notes?.includes('[Reschedule requested');
}

interface RescheduleRequestFormProps {
  role: 'reviewer' | 'student';
  assignmentId?: string;
  applicationId?: string;
  reschedulePending?: boolean;
  onSuccess?: () => void;
}

export default function RescheduleRequestForm({
  role,
  assignmentId,
  applicationId,
  reschedulePending,
  onSuccess,
}: RescheduleRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [preferredAt, setPreferredAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(reschedulePending ?? false);

  const submit = async () => {
    setError('');
    if (reason.trim().length < 10) {
      setError('Please explain why you need to reschedule (at least 10 characters).');
      return;
    }

    setLoading(true);
    try {
      const preferredIso = localDatetimeToIso(preferredAt);
      if (role === 'reviewer') {
        if (!assignmentId) throw new Error('Missing assignment');
        await api.reviewer.workflowAction({
          action: 'request_reschedule',
          assignment_id: assignmentId,
          reason: reason.trim(),
          ...(preferredIso ? { preferred_session_at: preferredIso } : {}),
        });
      } else {
        if (!applicationId) throw new Error('Missing application');
        await api.student.requestReschedule({
          application_id: applicationId,
          reason: reason.trim(),
          ...(preferredIso ? { preferred_session_at: preferredIso } : {}),
        });
      }
      setSubmitted(true);
      setOpen(false);
      onSuccess?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit reschedule request');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <p style={{ fontSize: 13, color: '#9a6500', fontWeight: 500, margin: '12px 0 0', lineHeight: 1.5 }}>
        Reschedule request sent — our team will confirm a new time by email.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: 12,
          padding: '10px 18px',
          fontSize: 13,
          fontWeight: 600,
          background: '#fff',
          color: 'rgba(15,13,12,0.65)',
          border: BORDER,
          cursor: 'pointer',
        }}
      >
        Request reschedule
      </button>
    );
  }

  return (
    <div style={{ marginTop: 16, padding: 16, border: BORDER, background: 'rgba(15,13,12,0.02)' }}>
      <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>Request a reschedule</p>
      <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.5)', margin: '0 0 14px', lineHeight: 1.5 }}>
        Admin will review your request and confirm a new session time with both parties.
      </p>

      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
        Why do you need to reschedule? <span style={{ fontWeight: 400, color: '#ba1a1a' }}>*</span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Brief reason — e.g. travel conflict, illness, timezone issue…"
        style={{ width: '100%', minHeight: 80, padding: 10, fontSize: 13, border: BORDER, marginBottom: 12, boxSizing: 'border-box' }}
      />

      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
        Preferred new time <span style={{ fontWeight: 400, color: 'rgba(15,13,12,0.45)' }}>(optional)</span>
      </label>
      <input
        type="datetime-local"
        value={preferredAt}
        onChange={(e) => setPreferredAt(e.target.value)}
        style={{ padding: 10, fontSize: 13, border: BORDER, width: '100%', maxWidth: 280, marginBottom: 12, boxSizing: 'border-box' }}
      />

      {error && <p style={{ fontSize: 12, color: '#ba1a1a', margin: '0 0 10px' }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          disabled={loading}
          onClick={submit}
          style={{
            padding: '9px 16px',
            fontSize: 12,
            fontWeight: 600,
            background: '#eb4511',
            color: '#fff',
            border: 'none',
            cursor: loading ? 'wait' : 'pointer',
          }}
        >
          {loading ? 'Sending…' : 'Submit reschedule request'}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => { setOpen(false); setError(''); }}
          style={{
            padding: '9px 16px',
            fontSize: 12,
            fontWeight: 500,
            background: '#fff',
            color: 'rgba(15,13,12,0.55)',
            border: BORDER,
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
