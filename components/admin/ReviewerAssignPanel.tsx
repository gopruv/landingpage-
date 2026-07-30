'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface ReviewerOption {
  id: string;
  full_name: string;
  email: string;
  sessions_completed: number;
  average_score: number | null;
  pass_rate: number | null;
}

const BORDER = '1px solid rgba(15,13,12,0.1)';

interface ReviewerAssignPanelProps {
  studentName: string;
  projectName: string;
  techStack?: string;
  reviewers: ReviewerOption[];
  onAssign: (reviewerId: string) => void;
  onViewProfile: (reviewerId: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export default function ReviewerAssignPanel({
  studentName,
  projectName,
  techStack,
  reviewers,
  onAssign,
  onViewProfile,
  onClose,
  loading,
}: ReviewerAssignPanelProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return reviewers;
    return reviewers.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q),
    );
  }, [query, reviewers]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15,13,12,0.35)', zIndex: 112 }} />
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 'min(420px, 100vw)',
        background: '#fff',
        zIndex: 113,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: BORDER,
        boxShadow: '-8px 0 32px rgba(15,13,12,0.08)',
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: BORDER,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#eb4511', margin: '0 0 8px' }}>
                Assign reviewer
              </p>
              <h2 style={{ fontSize: 20, fontWeight: 600, margin: 0, lineHeight: 1.35, color: '#0f0d0c' }}>
                {studentName}
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.55)', margin: '6px 0 0' }}>
                {projectName}
              </p>
              {techStack && (
                <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.4)', margin: '4px 0 0' }}>{techStack}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ border: 'none', background: 'rgba(15,13,12,0.06)', width: 32, height: 32, borderRadius: 6, cursor: 'pointer', fontSize: 18, lineHeight: 1, color: 'rgba(15,13,12,0.5)' }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            background: '#faf7f2',
            borderRadius: 8,
            border: '1px solid rgba(15,13,12,0.08)',
          }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
              <circle cx="6.5" cy="6.5" r="5" stroke="#0f0d0c" strokeWidth="1.5" />
              <path d="M10 10L14 14" stroke="#0f0d0c" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search reviewers by name or email"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: 13,
                fontFamily: 'Inter, system-ui, sans-serif',
                color: '#0f0d0c',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px 24px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(15,13,12,0.38)', margin: '0 8px 12px' }}>
            {filtered.length} reviewer{filtered.length === 1 ? '' : 's'}
          </p>

          {filtered.length === 0 ? (
            <p style={{ padding: '32px 12px', fontSize: 14, color: 'rgba(15,13,12,0.4)', textAlign: 'center', margin: 0 }}>
              {reviewers.length === 0
                ? 'No reviewers available yet.'
                : <>No reviewers match &ldquo;{query}&rdquo;</>}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map((r) => {
                const initials = r.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '14px 14px',
                      borderRadius: 8,
                      border: '1px solid rgba(15,13,12,0.08)',
                      background: '#fff',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onViewProfile(r.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flex: 1,
                        minWidth: 0,
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'rgba(235,69,17,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#eb4511' }}>{initials}</span>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f0d0c' }}>
                          {r.full_name}
                        </p>
                        <p style={{ margin: '3px 0 0', fontSize: 12, color: 'rgba(15,13,12,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.email}
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'rgba(15,13,12,0.4)' }}>
                          {r.sessions_completed} sessions
                          {r.average_score != null ? ` · ${r.average_score} avg` : ''}
                          {r.pass_rate != null ? ` · ${r.pass_rate}% pass` : ''}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => onAssign(r.id)}
                      style={{
                        flexShrink: 0,
                        padding: '8px 16px',
                        fontSize: 12,
                        fontWeight: 600,
                        background: '#007a4a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 20,
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                      }}
                    >
                      Assign
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: BORDER, flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(15,13,12,0.45)', lineHeight: 1.6 }}>
            Click a reviewer&apos;s name to view their profile. Assign sends emails to both parties — no session time is set yet.
          </p>
        </div>
      </div>
    </>
  );
}
