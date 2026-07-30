'use client';

interface SessionNotesPanelProps {
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  saving?: boolean;
}

export default function SessionNotesPanel({ value, onChange, locked, saving }: SessionNotesPanelProps) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#eb4511', margin: 0 }}>
          Your session notes
        </p>
        {!locked && (
          <span style={{ fontSize: 10, color: saving ? '#9a6500' : 'rgba(15,13,12,0.35)' }}>
            {saving ? 'Saving…' : 'Auto-saves'}
          </span>
        )}
      </div>
      <p style={{ fontSize: 11, color: 'rgba(15,13,12,0.45)', margin: '0 0 8px', lineHeight: 1.5 }}>
        {locked
          ? 'Notes from your session — kept for your review after the call.'
          : 'Private notes during the call. Only you can see these.'}
      </p>
      <textarea
        value={value}
        disabled={locked}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Questions to ask, observations, follow-ups…"
        rows={locked ? 6 : 8}
        style={{
          width: '100%',
          padding: 10,
          fontSize: 12,
          fontFamily: 'inherit',
          lineHeight: 1.55,
          border: '1px solid rgba(15,13,12,0.15)',
          background: locked ? 'rgba(15,13,12,0.02)' : '#fff',
          resize: 'vertical',
        }}
      />
    </div>
  );
}
