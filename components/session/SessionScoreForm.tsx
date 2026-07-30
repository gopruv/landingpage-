'use client';

import { SCORE_CRITERIA, computeWeightedTotal, type CriterionKey, type CriterionRating } from '@/lib/scoring';

export const DEFAULT_RATINGS = (): Record<CriterionKey, CriterionRating> => ({
  technical_depth:  { value: 3, excluded: false },
  communication:    { value: 3, excluded: false },
  reproducibility:  { value: 3, excluded: false },
  problem_solving:  { value: 3, excluded: false },
});

interface SessionScoreFormProps {
  ratings: Record<CriterionKey, CriterionRating>;
  onRatingsChange: (r: Record<CriterionKey, CriterionRating>) => void;
  feedbackNotes: string;
  onFeedbackChange: (s: string) => void;
  sessionNotes?: string;
  onSessionNotesChange?: (s: string) => void;
  compact?: boolean;
  disabled?: boolean;
  showSessionNotes?: boolean;
}

export default function SessionScoreForm({
  ratings,
  onRatingsChange,
  feedbackNotes,
  onFeedbackChange,
  sessionNotes = '',
  onSessionNotesChange,
  compact = false,
  disabled = false,
  showSessionNotes = true,
}: SessionScoreFormProps) {
  const totalScore = computeWeightedTotal(ratings);
  const pad = compact ? 10 : 14;

  return (
    <div>
      {SCORE_CRITERIA.map((c) => (
        <div
          key={c.key}
          style={{
            padding: pad,
            border: '1px solid rgba(15,13,12,0.1)',
            background: '#fff',
            marginBottom: compact ? 8 : 12,
            opacity: ratings[c.key].excluded ? 0.55 : 1,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, gap: 8 }}>
            <span style={{ fontWeight: 600, fontSize: compact ? 12 : 13 }}>{c.label}</span>
            <label style={{ fontSize: 11, display: 'flex', gap: 4, cursor: disabled ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
              <input
                type="checkbox"
                disabled={disabled}
                checked={ratings[c.key].excluded}
                onChange={(e) => onRatingsChange({ ...ratings, [c.key]: { ...ratings[c.key], excluded: e.target.checked } })}
              />
              N/A
            </label>
          </div>
          {!compact && (
            <p style={{ fontSize: 11, color: 'rgba(15,13,12,0.45)', margin: '0 0 8px', lineHeight: 1.5 }}>{c.description}</p>
          )}
          {!ratings[c.key].excluded && (
            <>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                disabled={disabled}
                value={ratings[c.key].value}
                onChange={(e) => onRatingsChange({ ...ratings, [c.key]: { ...ratings[c.key], value: parseInt(e.target.value, 10) } })}
                style={{ width: '100%', accentColor: '#eb4511' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(15,13,12,0.45)' }}>
                <span>0</span>
                <strong>{ratings[c.key].value}/5</strong>
                <span>5</span>
              </div>
            </>
          )}
        </div>
      ))}

      {showSessionNotes && onSessionNotesChange && (
        <>
          <p style={{ fontSize: 11, fontWeight: 600, margin: '12px 0 6px', color: 'rgba(15,13,12,0.5)' }}>Live session notes (private)</p>
          <textarea
            value={sessionNotes}
            disabled={disabled}
            onChange={(e) => onSessionNotesChange(e.target.value)}
            placeholder="Observations during the call…"
            rows={compact ? 3 : 4}
            style={{ width: '100%', padding: 10, fontSize: 12, fontFamily: 'inherit', marginBottom: 10, border: '1px solid rgba(15,13,12,0.15)' }}
          />
        </>
      )}

      <p style={{ fontSize: 11, fontWeight: 600, margin: '8px 0 6px', color: 'rgba(15,13,12,0.5)' }}>Feedback for student</p>
      <textarea
        value={feedbackNotes}
        disabled={disabled}
        onChange={(e) => onFeedbackChange(e.target.value)}
        placeholder="Summary feedback (min 10 chars to submit)"
        rows={compact ? 3 : 4}
        style={{ width: '100%', padding: 10, fontSize: 12, fontFamily: 'inherit', border: '1px solid rgba(15,13,12,0.15)' }}
      />

      <p style={{ fontSize: 12, fontWeight: 600, margin: '10px 0 0', color: totalScore >= 60 ? '#007a4a' : '#9a6500' }}>
        Draft total: {totalScore}/100 {totalScore >= 60 ? '(pass)' : '(fail)'}
      </p>
    </div>
  );
}
