'use client';

import { useEffect, useRef, useState } from 'react';
import { api, ApiError } from '@/lib/api';

export type AgentFocus =
  | 'opening'
  | 'technical_depth'
  | 'communication'
  | 'reproducibility'
  | 'problem_solving'
  | 'follow_up'
  | 'red_flags';

const FOCUS_CHIPS: { value: AgentFocus | ''; label: string; icon: string }[] = [
  { value: '', label: 'Balanced', icon: '◎' },
  { value: 'opening', label: 'Opening', icon: '→' },
  { value: 'technical_depth', label: 'Technical', icon: '⌁' },
  { value: 'communication', label: 'Comms', icon: '◈' },
  { value: 'reproducibility', label: 'Repro', icon: '↻' },
  { value: 'problem_solving', label: 'Problem', icon: '✦' },
  { value: 'follow_up', label: 'Follow-up', icon: '…' },
  { value: 'red_flags', label: 'Flags', icon: '!' },
];

const QUICK_PROMPTS: { label: string; icon: string; focus?: AgentFocus | ''; action?: 'feedback' }[] = [
  { label: 'Balanced questions', icon: '◎', focus: '' },
  { label: 'Opening probe', icon: '→', focus: 'opening' },
  { label: 'Technical depth', icon: '⌁', focus: 'technical_depth' },
  { label: 'Red flags', icon: '!', focus: 'red_flags' },
  { label: 'Draft feedback', icon: '✎', action: 'feedback' },
];

type ChatMessage =
  | { id: string; role: 'assistant'; kind: 'text'; text: string }
  | {
      id: string;
      role: 'assistant';
      kind: 'questions';
      questions: string[];
      coachingTip?: string;
      probeAreas?: string[];
    }
  | {
      id: string;
      role: 'assistant';
      kind: 'feedback';
      draft: string;
      highlights?: string[];
    }
  | { id: string; role: 'user'; text: string };

interface SessionAgentPanelProps {
  assignmentId: string;
  sessionNotes: string;
  disabled?: boolean;
  onApplyFeedbackDraft?: (draft: string) => void;
}

function msgId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginBottom: 12 }}>
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: '#1a1a2e',
          color: '#fff',
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        ✦
      </div>
      <div
        style={{
          padding: '10px 14px',
          background: '#f3f0ea',
          borderRadius: '14px 14px 14px 4px',
          display: 'flex',
          gap: 4,
          alignItems: 'center',
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'rgba(15,13,12,0.28)',
              animation: `agentDot 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes agentDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function SessionAgentPanel({
  assignmentId,
  sessionNotes,
  disabled,
  onApplyFeedbackDraft,
}: SessionAgentPanelProps) {
  const [focus, setFocus] = useState<AgentFocus | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      kind: 'text',
      text: 'I can suggest Socratic questions during the call or draft written feedback from your notes. Pick a quick prompt below or choose a focus area.',
    },
  ]);
  const threadRef = useRef<HTMLDivElement>(null);

  const notesHint = sessionNotes.trim()
    ? `Using ${Math.min(sessionNotes.trim().length, 4000)} chars of your notes`
    : 'Tip: add notes in the Notes tab for sharper suggestions';

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, error]);

  const appendUser = (text: string) => {
    setMessages((prev) => [...prev, { id: msgId(), role: 'user', text }]);
  };

  const suggest = async (nextFocus: AgentFocus | '' = focus, userLabel?: string) => {
    setFocus(nextFocus);
    setLoading(true);
    setError('');
    const chip = FOCUS_CHIPS.find((c) => c.value === nextFocus);
    appendUser(userLabel ?? (chip?.label ? `Suggest ${chip.label.toLowerCase()} questions` : 'Suggest questions'));

    try {
      const res = (await api.session.agentSuggest({
        assignment_id: assignmentId,
        mode: 'questions',
        ...(nextFocus ? { focus: nextFocus } : {}),
        ...(sessionNotes.trim() ? { session_notes: sessionNotes.trim() } : {}),
      })) as {
        data?: { questions: string[]; probe_areas: string[]; coaching_tip: string };
      };

      if (!res.data?.questions?.length) throw new Error('No questions returned');

      setMessages((prev) => [
        ...prev,
        {
          id: msgId(),
          role: 'assistant',
          kind: 'questions',
          questions: res.data!.questions,
          probeAreas: res.data!.probe_areas ?? [],
          coachingTip: res.data!.coaching_tip ?? '',
        },
      ]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not get suggestions — try again.');
    } finally {
      setLoading(false);
    }
  };

  const draftFeedback = async () => {
    setLoading(true);
    setError('');
    appendUser('Draft feedback from my notes');

    try {
      const res = (await api.session.agentSuggest({
        assignment_id: assignmentId,
        mode: 'feedback_draft',
        ...(sessionNotes.trim() ? { session_notes: sessionNotes.trim() } : {}),
      })) as {
        data?: { draft: string; highlights: string[] };
      };

      if (!res.data?.draft?.trim()) throw new Error('No draft returned');

      setMessages((prev) => [
        ...prev,
        {
          id: msgId(),
          role: 'assistant',
          kind: 'feedback',
          draft: res.data!.draft,
          highlights: res.data!.highlights ?? [],
        },
      ]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not draft feedback — try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(key);
      setTimeout(() => setCopiedIdx(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const runQuickPrompt = (prompt: (typeof QUICK_PROMPTS)[number]) => {
    if (disabled || loading) return;
    if (prompt.action === 'feedback') {
      void draftFeedback();
      return;
    }
    void suggest(prompt.focus ?? '', prompt.label);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 420,
        background: '#faf8f5',
      }}
    >
      {/* Chat header */}
      <div
        style={{
          flexShrink: 0,
          padding: '12px 14px',
          background: '#fff',
          borderBottom: '1px solid rgba(15,13,12,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(235,69,17,0.1)',
              color: '#eb4511',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            ✦
          </span>
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0f0d0c' }}>Review copilot</p>
            <p style={{ margin: 0, fontSize: 10, color: 'rgba(15,13,12,0.45)' }}>{notesHint}</p>
          </div>
        </div>
      </div>

      {/* Message thread */}
      <div
        ref={threadRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {messages.map((msg) => {
          if (msg.role === 'user') {
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '9px 12px',
                    background: '#eb4511',
                    color: '#fff',
                    borderRadius: '14px 14px 4px 14px',
                    fontSize: 12,
                    lineHeight: 1.5,
                    fontWeight: 500,
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          }

          if (msg.kind === 'text') {
            return (
              <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#1a1a2e',
                    color: '#fff',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  ✦
                </div>
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '10px 12px',
                    background: '#fff',
                    border: '1px solid rgba(15,13,12,0.08)',
                    borderRadius: '4px 14px 14px 14px',
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: 'rgba(15,13,12,0.78)',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            );
          }

          if (msg.kind === 'questions') {
            return (
              <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#1a1a2e',
                    color: '#fff',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  ✦
                </div>
                <div style={{ maxWidth: '92%', flex: 1 }}>
                  <div
                    style={{
                      padding: '10px 12px',
                      background: '#fff',
                      border: '1px solid rgba(15,13,12,0.08)',
                      borderRadius: '4px 14px 14px 14px',
                    }}
                  >
                    <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: 'rgba(15,13,12,0.45)' }}>
                      {msg.questions.length} questions
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {msg.questions.map((q, idx) => (
                        <div
                          key={`${msg.id}-q-${idx}`}
                          style={{
                            padding: '8px 10px',
                            background: '#faf7f2',
                            borderRadius: 8,
                            fontSize: 12,
                            lineHeight: 1.5,
                            color: '#0f0d0c',
                          }}
                        >
                          <span style={{ fontWeight: 700, marginRight: 6, color: '#1a1a2e' }}>{idx + 1}.</span>
                          {q}
                          <button
                            type="button"
                            onClick={() => copyText(q, `${msg.id}-${idx}`)}
                            style={{
                              display: 'block',
                              marginTop: 6,
                              padding: 0,
                              border: 'none',
                              background: 'none',
                              fontSize: 10,
                              fontWeight: 600,
                              color: '#eb4511',
                              cursor: 'pointer',
                            }}
                          >
                            {copiedIdx === `${msg.id}-${idx}` ? '✓ Copied' : 'Copy'}
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        copyText(msg.questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n'), `${msg.id}-all`)
                      }
                      style={{
                        marginTop: 8,
                        padding: 0,
                        border: 'none',
                        background: 'none',
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#eb4511',
                        cursor: 'pointer',
                      }}
                    >
                      {copiedIdx === `${msg.id}-all` ? '✓ Copied all' : 'Copy all'}
                    </button>
                  </div>
                  {msg.coachingTip && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: '8px 10px',
                        background: 'rgba(184,121,0,0.08)',
                        borderRadius: 8,
                        borderLeft: '2px solid #9a6500',
                        fontSize: 11,
                        lineHeight: 1.5,
                        color: 'rgba(15,13,12,0.72)',
                      }}
                    >
                      <strong style={{ color: '#9a6500' }}>Coach tip · </strong>
                      {msg.coachingTip}
                    </div>
                  )}
                  {!!msg.probeAreas?.length && (
                    <p style={{ fontSize: 10, color: 'rgba(15,13,12,0.38)', margin: '6px 0 0', paddingLeft: 2 }}>
                      Probing: {msg.probeAreas.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: '#1a1a2e',
                  color: '#fff',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                ✦
              </div>
              <div style={{ maxWidth: '92%', flex: 1 }}>
                {!!msg.highlights?.length && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                    {msg.highlights.map((h) => (
                      <span
                        key={h}
                        style={{
                          fontSize: 10,
                          padding: '3px 8px',
                          background: 'rgba(0,122,74,0.1)',
                          borderRadius: 12,
                          color: '#007a4a',
                        }}
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#fff',
                    border: '1px solid rgba(15,13,12,0.08)',
                    borderRadius: '4px 14px 14px 14px',
                    fontSize: 12,
                    lineHeight: 1.6,
                    color: '#0f0d0c',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.draft}
                </div>
                {onApplyFeedbackDraft && (
                  <button
                    type="button"
                    onClick={() => onApplyFeedbackDraft(msg.draft)}
                    style={{
                      marginTop: 8,
                      padding: '7px 12px',
                      background: '#007a4a',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Use in Scores →
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {loading && <TypingIndicator />}

        {error && (
          <div
            style={{
              margin: '4px 0 8px 36px',
              padding: '8px 10px',
              background: 'rgba(186,26,26,0.08)',
              borderRadius: 8,
              fontSize: 11,
              color: '#ba1a1a',
              lineHeight: 1.45,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Composer */}
      <div
        style={{
          flexShrink: 0,
          padding: '10px 12px 12px',
          background: '#fff',
          borderTop: '1px solid rgba(15,13,12,0.08)',
        }}
      >
        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, color: 'rgba(15,13,12,0.38)', letterSpacing: '0.04em' }}>
          QUICK PROMPTS
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.label}
              type="button"
              disabled={disabled || loading}
              onClick={() => runQuickPrompt(prompt)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 10px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 16,
                border: '1px solid rgba(15,13,12,0.12)',
                background: '#faf8f5',
                color: 'rgba(15,13,12,0.65)',
                cursor: disabled || loading ? 'default' : 'pointer',
                opacity: disabled || loading ? 0.5 : 1,
              }}
            >
              <span style={{ fontSize: 12, lineHeight: 1 }}>{prompt.icon}</span>
              {prompt.label}
            </button>
          ))}
        </div>

        <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, color: 'rgba(15,13,12,0.38)', letterSpacing: '0.04em' }}>
          FOCUS
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
          {FOCUS_CHIPS.map((chip) => {
            const active = focus === chip.value;
            return (
              <button
                key={chip.label}
                type="button"
                disabled={disabled || loading}
                onClick={() => setFocus(chip.value)}
                title={chip.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 14,
                  border: active ? '1px solid #eb4511' : '1px solid rgba(15,13,12,0.1)',
                  background: active ? 'rgba(235,69,17,0.1)' : '#fff',
                  color: active ? '#eb4511' : 'rgba(15,13,12,0.5)',
                  cursor: disabled || loading ? 'default' : 'pointer',
                }}
              >
                <span>{chip.icon}</span>
                {chip.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => suggest()}
          disabled={disabled || loading}
          style={{
            width: '100%',
            padding: '10px 14px',
            background: disabled ? 'rgba(15,13,12,0.08)' : 'linear-gradient(135deg, #eb4511, #c93a0e)',
            color: disabled ? 'rgba(15,13,12,0.35)' : '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            cursor: disabled || loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Thinking…' : '✦ Send question request'}
        </button>
      </div>
    </div>
  );
}
