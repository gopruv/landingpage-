'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface AvailabilitySlot {
  date: string;
  time: string;
  timezone: string;
  description?: string;
}

interface WorkflowTask {
  id: string;
  task_key: string;
  title: string;
  status: string;
  unlocked: boolean;
}

export default function ReviewerWorkflowActions({
  assignmentId,
  applicationId,
  workflowStage,
  availability,
  tasks,
  onRefresh,
}: {
  assignmentId: string;
  applicationId: string;
  workflowStage: string;
  availability: AvailabilitySlot[];
  tasks: WorkflowTask[];
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const run = async (key: string, fn: () => Promise<unknown>) => {
    setLoading(key);
    try {
      await fn();
      await onRefresh();
    } finally {
      setLoading('');
    }
  };

  const [localAccepted, setLocalAccepted] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem(`reviewer-accepted-${assignmentId}`) === '1',
  );

  const [reviewed, setReviewed] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem(`reviewer-reviewed-${assignmentId}`) === '1',
  );

  const effectiveStage =
    localAccepted && workflowStage === 'assigned' ? 'accepted' : workflowStage;

  const taskDone = (key: string) => tasks.find((t) => t.task_key === key)?.status === 'done';
  const isSynthetic = (id?: string) => !!id?.startsWith('synthetic-');

  const markReviewed = async () => {
    const task = tasks.find((t) => t.task_key === 'review_submission');
    if (task && !isSynthetic(task.id)) {
      await api.reviewer.workflowAction({ action: 'complete_task', task_id: task.id });
    } else {
      localStorage.setItem(`reviewer-reviewed-${assignmentId}`, '1');
      setReviewed(true);
    }
  };

  const reviewedDone = reviewed || taskDone('review_submission');

  const slotToIso = (slot: AvailabilitySlot) => {
    const d = slot.date;
    const t = slot.time.length === 5 ? `${slot.time}:00` : slot.time;
    return new Date(`${d}T${t}`).toISOString();
  };

  return (
    <div className="p-6 border space-y-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
      <h3 style={{ fontWeight: 600 }}>Workflow steps</h3>
      <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Stage: <strong>{effectiveStage.replace(/_/g, ' ')}</strong></p>

      {!reviewedDone && effectiveStage === 'assigned' && (
        <button
          disabled={!!loading}
          onClick={() => run('review', markReviewed)}
          style={{ padding: '8px 14px', background: 'var(--orange)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
        >
          {loading === 'review' ? '…' : 'Mark application reviewed'}
        </button>
      )}

      {reviewedDone && !taskDone('accept_candidate') && effectiveStage === 'assigned' && (
        <button
          disabled={!!loading}
          onClick={() => run('accept', async () => {
            await api.reviewer.workflowAction({ action: 'accept_candidate', assignment_id: assignmentId });
            localStorage.setItem(`reviewer-accepted-${assignmentId}`, '1');
            setLocalAccepted(true);
          })}
          style={{ padding: '8px 14px', background: '#007a4a', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
        >
          {loading === 'accept' ? '…' : 'Accept candidate (emails student)'}
        </button>
      )}

      {(taskDone('accept_candidate') || effectiveStage === 'accepted') && !taskDone('propose_session') && effectiveStage !== 'session_proposed' && (        <div>
          <p style={{ fontSize: 13, marginBottom: 8 }}>Student preferred availability:</p>
          {availability.length === 0 ? (
            <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>No slots listed</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {availability.map((slot, i) => {
                const label = `${slot.description ?? slot.date} — ${slot.time} (${slot.timezone})`;
                const val = JSON.stringify(slot);
                return (
                  <label key={i} style={{ fontSize: 13, display: 'flex', gap: 8, cursor: 'pointer' }}>
                    <input type="radio" name="slot" value={val} checked={selectedSlot === val} onChange={() => setSelectedSlot(val)} />
                    {label}
                  </label>
                );
              })}
            </div>
          )}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes for admin"
            style={{ width: '100%', minHeight: 60, marginBottom: 8, fontSize: 13 }}
          />
          <button
            disabled={!!loading || !selectedSlot}
            onClick={() => {
              const slot = JSON.parse(selectedSlot) as AvailabilitySlot;
              return run('propose', () => api.reviewer.workflowAction({
                action: 'propose_session',
                assignment_id: assignmentId,
                proposed_session_at: slotToIso(slot),
                notes: notes || undefined,
              }));
            }}
            style={{ padding: '8px 14px', background: '#005fa3', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
          >
            {loading === 'propose' ? '…' : 'Propose session to admin'}
          </button>
        </div>
      )}

      {effectiveStage === 'session_proposed' && (
        <p style={{ fontSize: 13, color: 'var(--fg-muted)' }}>Session proposed — waiting for admin approval.</p>
      )}

      {(effectiveStage === 'session_approved' || effectiveStage === 'scheduled') && !taskDone('conduct_session') && (        <button
          disabled={!!loading}
          onClick={() => run('session', () => api.reviewer.workflowAction({ action: 'mark_session_done', assignment_id: assignmentId }))}
          style={{ padding: '8px 14px', background: '#9a6500', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13 }}
        >
          {loading === 'session' ? '…' : 'Mark session as done'}
        </button>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <p style={{ fontSize: 12, marginBottom: 6 }}>Add custom task</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} placeholder="Task title" style={{ flex: 1, padding: 8, fontSize: 13 }} />
          <button
            disabled={!customTitle.trim() || !!loading}
            onClick={() => run('custom', () => api.reviewer.workflowAction({ action: 'create_custom_task', assignment_id: assignmentId, title: customTitle }))}
            style={{ padding: '8px 12px', fontSize: 12, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer' }}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
