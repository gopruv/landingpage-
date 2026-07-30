'use client';

import Link from 'next/link';
import { SCORE_CRITERIA, PASS_THRESHOLD } from '@/lib/scoring';

const WORKFLOW_STEPS = [
  {
    title: 'Wait for assignment',
    body: 'Admin assigns students to you after payment is confirmed. New submissions appear in the Prep column.',
  },
  {
    title: 'Prep before the session',
    body: 'Open the submission, watch the Loom walkthrough, read GitHub and written answers, and complete the checklist.',
  },
  {
    title: 'Run the live review',
    body: 'Probe architecture, edge cases, and decisions they claim to own. The session is recorded with consent.',
  },
  {
    title: 'Score within 24 hours',
    body: 'Rate each criterion 0–5. Use N/A if the student did not complete that part — weights redistribute automatically.',
  },
  {
    title: 'Submit notes',
    body: 'Add brief written feedback (min 10 characters). Pass scores (≥60) auto-issue the credential.',
  },
] as const;

export default function ReviewerGuide({ assignmentCount, compact }: { assignmentCount: number; compact?: boolean }) {
  const guideContent = (
    <>
      <section style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', padding: compact ? 20 : 24 }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 16 }}>
          Review workflow
        </h3>
        <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {WORKFLOW_STEPS.map((step, i) => (
            <li key={step.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: '50%', background: 'rgba(235,69,17,0.1)', color: 'var(--orange)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
              <div>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{step.title}</p>
                <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.65, margin: 0 }}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section style={{ border: '1px solid var(--border)', backgroundColor: 'var(--bg-card)', padding: compact ? 20 : 24 }}>
        <h3 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 8 }}>
          Orcred scoring rubric
        </h3>
        <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.65, marginBottom: 20 }}>
          Rate each dimension <strong>0–5</strong>. Pass threshold is <strong>{PASS_THRESHOLD}/100</strong>.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {SCORE_CRITERIA.map((c) => (
            <div key={c.key} style={{ padding: 14, border: '1px solid var(--border)', backgroundColor: 'var(--bg-page)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{c.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--orange)' }}>{Math.round(c.weight * 100)}% weight</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.6, margin: 0 }}>{c.description}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );

  if (compact) {
    return (
      <details style={{ marginTop: 8 }}>
        <summary style={{ fontSize: 13, fontWeight: 600, cursor: 'pointer', color: 'rgba(15,13,12,0.55)', padding: '12px 0' }}>
          Workflow guide & scoring rubric
        </summary>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>{guideContent}</div>
      </details>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {assignmentCount === 0 && (
        <section className="p-6 border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-card)' }}>
          <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--orange)', marginBottom: 8 }}>No assignments yet</p>
          <h2 style={{ fontSize: 22, fontWeight: 500, marginBottom: 8 }}>What to do while you wait</h2>
          <p style={{ color: 'var(--fg-muted)', lineHeight: 1.7, marginBottom: 20, maxWidth: 560 }}>
            Your dashboard will populate when admin assigns students to you.
          </p>
          <Link href="/dashboard/reviewer/profile" style={{ display: 'inline-block', padding: '8px 16px', fontSize: 12, fontWeight: 600, border: '1px solid rgba(15,13,12,0.2)', textDecoration: 'none', color: 'inherit' }}>
            Complete your profile →
          </Link>
        </section>
      )}
      {guideContent}
    </div>
  );
}
