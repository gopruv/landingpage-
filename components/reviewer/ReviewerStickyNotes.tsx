'use client';

import { useEffect, useState } from 'react';
import { loadPrivateNotes, savePrivateNotes } from '@/lib/reviewFlow';

const BORDER = '1px solid rgba(15,13,12,0.1)';

export default function ReviewerStickyNotes({ assignmentId }: { assignmentId: string }) {
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setNotes(loadPrivateNotes(assignmentId));
  }, [assignmentId]);

  useEffect(() => {
    if (!assignmentId) return;
    const t = setTimeout(() => {
      savePrivateNotes(assignmentId, notes);
      setSaved(true);
    }, 400);
    return () => clearTimeout(t);
  }, [notes, assignmentId]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1500);
    return () => clearTimeout(t);
  }, [saved]);

  return (
    <aside
      style={{
        position: 'sticky',
        top: 24,
        width: 240,
        flexShrink: 0,
        background: 'linear-gradient(160deg, #fef3c7 0%, #fde68a 100%)',
        border: BORDER,
        borderRadius: 2,
        padding: '14px 12px',
        boxShadow: '3px 4px 0 rgba(15,13,12,0.08)',
        transform: 'rotate(-1deg)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 700, margin: 0, color: 'rgba(15,13,12,0.55)' }}>Your notes</p>
        {saved && <span style={{ fontSize: 9, color: '#007a4a' }}>Saved</span>}
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Jot down questions, red flags, or things to probe in the session…"
        style={{
          width: '100%',
          minHeight: 200,
          border: 'none',
          background: 'transparent',
          resize: 'vertical',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 13,
          lineHeight: 1.55,
          color: 'rgba(15,13,12,0.8)',
          outline: 'none',
        }}
      />
      <p style={{ fontSize: 9, color: 'rgba(15,13,12,0.4)', margin: '8px 0 0', lineHeight: 1.4 }}>
        Private to you — not shared with student or admin.
      </p>
    </aside>
  );
}
