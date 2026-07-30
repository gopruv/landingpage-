'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignOut } from '@/lib/useRequireRole';

interface Submission {
  id: string;
  student_name: string;
  project_name: string;
  tech_stack: string;
  submitted_date: string;
  session_date?: string;
  status: 'pending_prep' | 'scheduled' | 'awaiting_score' | 'completed';
}

const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: '1',
    student_name: 'Student Name',
    project_name: 'Real-time Collaborative Document Editor',
    tech_stack: 'React, Node.js, WebSocket',
    submitted_date: '2026-06-01',
    session_date: '2026-06-08',
    status: 'awaiting_score',
  },
  {
    id: '2',
    student_name: 'Another Student',
    project_name: 'ML-Powered Resume Scorer',
    tech_stack: 'Python, FastAPI, Hugging Face',
    submitted_date: '2026-06-02',
    status: 'scheduled',
  },
  {
    id: '3',
    student_name: 'Third Student',
    project_name: 'Distributed Cache System',
    tech_stack: 'Go, Protocol Buffers',
    submitted_date: '2026-06-03',
    status: 'pending_prep',
  },
];

export default function ReviewerDashboard() {
  const router = useRouter();
  const signOut = useSignOut();
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [scoringView, setScoringView] = useState(false);
  const [scores, setScores] = useState({
    technical_depth: 0,
    communication: 0,
    reproducibility: 0,
    originality: 0,
    feedback_td: '',
    feedback_comm: '',
    feedback_repro: '',
    feedback_orig: '',
  });

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { bg: string; text: string; label: string }> = {
      pending_prep: { bg: 'var(--orange-tint)', text: 'var(--orange)', label: 'Pending Preparation' },
      scheduled: { bg: 'var(--orange-tint)', text: 'var(--orange)', label: 'Scheduled' },
      awaiting_score: { bg: '#ffd6d6', text: '#ba1a1a', label: 'Awaiting Score' },
      completed: { bg: '#d6f0d6', text: '#2d6e2d', label: 'Completed' },
    };
    const config = statuses[status];
    return (
      <span
        style={{
          backgroundColor: config.bg,
          color: config.text,
          padding: '4px 8px',
          borderRadius: '2px',
          fontSize: '11px',
          fontWeight: '600',
        }}
      >
        {config.label}
      </span>
    );
  };

  if (selectedSubmission && scoringView) {
    const totalScore = Math.round(
      (scores.technical_depth * 0.35 +
        scores.communication * 0.25 +
        scores.reproducibility * 0.2 +
        scores.originality * 0.2) ||
        0
    );

    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
        <header
          className="border-b p-6"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div className="max-w-container mx-auto">
            <button
              onClick={() => setScoringView(false)}
              style={{ color: 'var(--fg-muted)' }}
              className="mb-4 text-sm hover:opacity-70"
            >
              ← Back
            </button>
            <h1 className="text-h1 mb-2" style={{ color: 'var(--orange)' }}>
              Score Submission
            </h1>
            <p style={{ color: 'var(--fg-muted)' }}>
              {selectedSubmission.project_name}
            </p>
          </div>
        </header>

        <main className="max-w-container mx-auto p-6 lg:p-10">
          <div className="max-w-2xl">
            {/* Score Summary */}
            <div
              className="p-6 border-2 mb-8"
              style={{
                borderColor: 'var(--orange)',
                borderRadius: '2px',
                backgroundColor: 'var(--orange-tint)',
              }}
            >
              <p style={{ color: 'var(--fg-muted)', marginBottom: '8px' }}>
                Calculated Total Score
              </p>
              <h2
                style={{
                  fontSize: '48px',
                  fontWeight: '600',
                  color: 'var(--orange)',
                  lineHeight: '1',
                }}
              >
                {totalScore}
              </h2>
              <p style={{ color: 'var(--fg)', marginTop: '8px' }}>
                {totalScore >= 60 ? '✓ PASS' : '✗ FAIL'}
              </p>
            </div>

            {/* Scoring Form */}
            <div className="space-y-8">
              {[
                {
                  key: 'technical_depth',
                  label: 'Technical Depth',
                  weight: '35%',
                  feedback: 'feedback_td',
                },
                {
                  key: 'communication',
                  label: 'Communication',
                  weight: '25%',
                  feedback: 'feedback_comm',
                },
                {
                  key: 'reproducibility',
                  label: 'Reproducibility',
                  weight: '20%',
                  feedback: 'feedback_repro',
                },
                {
                  key: 'originality',
                  label: 'Originality',
                  weight: '20%',
                  feedback: 'feedback_orig',
                },
              ].map((dimension) => (
                <div
                  key={dimension.key}
                  className="p-6 border"
                  style={{
                    borderColor: 'var(--border)',
                    borderRadius: '2px',
                    backgroundColor: 'var(--bg-card)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h3
                      style={{
                        fontSize: 'clamp(16px, 1.8vw, 24px)',
                        fontWeight: '500',
                        color: 'var(--fg)',
                      }}
                    >
                      {dimension.label}
                    </h3>
                    <p
                      style={{
                        color: 'var(--orange)',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      {dimension.weight}
                    </p>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <label style={{ color: 'var(--fg)', fontSize: '12px' }}>Score</label>
                      <span style={{ color: 'var(--orange)', fontWeight: '600' }}>
                        {(scores as any)[dimension.key]}/100
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={(scores as any)[dimension.key]}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [dimension.key]: parseInt(e.target.value),
                        }))
                      }
                      style={{
                        width: '100%',
                        accentColor: 'var(--orange)',
                        cursor: 'pointer',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ color: 'var(--fg)', fontSize: '12px', display: 'block', marginBottom: '8px' }}>
                      Feedback (min 50 words)
                    </label>
                    <textarea
                      value={(scores as any)[dimension.feedback]}
                      onChange={(e) =>
                        setScores((prev) => ({
                          ...prev,
                          [dimension.feedback]: e.target.value,
                        }))
                      }
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '2px',
                        border: '1px solid',
                        borderColor: 'var(--border)',
                        color: 'var(--fg)',
                        minHeight: '80px',
                        fontFamily: 'Inter, sans-serif',
                      }}
                      placeholder="Provide detailed feedback..."
                    />
                    <p style={{ color: 'var(--fg-faint)', fontSize: '11px', marginTop: '4px' }}>
                      {(scores as any)[dimension.feedback].length} characters
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div style={{ marginTop: '32px' }}>
              <button
                onClick={() => {
                  setSelectedSubmission(null);
                  setScoringView(false);
                }}
                style={{
                  backgroundColor: 'var(--orange)',
                  color: '#ffffff',
                  borderRadius: '50px',
                  padding: '10px 24px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Submit Scores
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (selectedSubmission) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
        <header
          className="border-b p-6"
          style={{
            borderColor: 'var(--border)',
            backgroundColor: 'var(--bg-card)',
          }}
        >
          <div className="max-w-container mx-auto">
            <button
              onClick={() => setSelectedSubmission(null)}
              style={{ color: 'var(--fg-muted)' }}
              className="mb-4 text-sm hover:opacity-70"
            >
              ← Back
            </button>
            <h1 className="text-h1 mb-2" style={{ color: 'var(--orange)' }}>
              {selectedSubmission.project_name}
            </h1>
            <p style={{ color: 'var(--fg-muted)' }}>
              {selectedSubmission.tech_stack}
            </p>
          </div>
        </header>

        <main className="max-w-container mx-auto p-6 lg:p-10">
          <div className="max-w-2xl space-y-6">
            {/* Project Links */}
            <div
              className="p-6 border"
              style={{
                borderColor: 'var(--border)',
                borderRadius: '2px',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <h3
                style={{
                  fontSize: 'clamp(16px, 1.8vw, 24px)',
                  fontWeight: '500',
                  color: 'var(--fg)',
                  marginBottom: '16px',
                }}
              >
                Project Links
              </h3>
              <div className="space-y-4">
                <a
                  href="#"
                  style={{
                    display: 'block',
                    color: 'var(--orange)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  → GitHub Repository
                </a>
                <a
                  href="#"
                  style={{
                    display: 'block',
                    color: 'var(--orange)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  → Loom Walkthrough
                </a>
              </div>
            </div>

            {/* Session Info */}
            {selectedSubmission.session_date && (
              <div
                className="p-6 border-2"
                style={{
                  borderColor: 'var(--orange)',
                  borderRadius: '2px',
                  backgroundColor: 'var(--orange-tint)',
                }}
              >
                <h3
                  style={{
                    fontSize: 'clamp(16px, 1.8vw, 24px)',
                    fontWeight: '500',
                    color: 'var(--orange)',
                  }}
                >
                  Session Scheduled
                </h3>
                <p style={{ color: 'var(--fg)', marginTop: '8px' }}>
                  {new Date(selectedSubmission.session_date).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}

            {/* Scoring Button */}
            {selectedSubmission.status === 'awaiting_score' && (
              <button
                onClick={() => setScoringView(true)}
                style={{
                  backgroundColor: 'var(--orange)',
                  color: '#ffffff',
                  borderRadius: '50px',
                  padding: '10px 24px',
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  border: 'none',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '16px',
                }}
              >
                Score This Submission
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      <header
        className="border-b p-6"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="max-w-container mx-auto" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="text-h1 mb-2" style={{ color: 'var(--orange)' }}>
              Reviewer Dashboard
            </h1>
            <p style={{ color: 'var(--fg-muted)' }}>
              {MOCK_SUBMISSIONS.length} assigned submissions
            </p>
          </div>
          <button onClick={signOut} style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#eb4511', background: 'transparent', border: '1px solid #eb4511', borderRadius: '6px', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-container mx-auto p-6 lg:p-10">
        <div className="flex items-center gap-3 mb-8">
          <div
            style={{ backgroundColor: 'var(--orange)', borderRadius: '50px' }}
            className="w-3 h-3"
          />
          <h2 className="text-h2">Assigned Submissions</h2>
        </div>

        <div className="space-y-4">
          {MOCK_SUBMISSIONS.map((submission) => (
            <div
              key={submission.id}
              onClick={() => setSelectedSubmission(submission)}
              className="p-6 border cursor-pointer"
              style={{
                borderColor: 'var(--border)',
                borderRadius: '2px',
                backgroundColor: 'var(--bg-card)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--orange)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                <div>
                  <h3
                    style={{
                      fontSize: 'clamp(16px, 1.8vw, 24px)',
                      fontWeight: '500',
                      color: 'var(--fg)',
                    }}
                  >
                    {submission.project_name}
                  </h3>
                  <p style={{ color: 'var(--fg-muted)', marginTop: '4px' }}>
                    {submission.tech_stack}
                  </p>
                </div>
                {getStatusBadge(submission.status)}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid', borderColor: 'var(--border)' }}>
                <p style={{ color: 'var(--fg-muted)', fontSize: '12px' }}>
                  <strong>Submitted:</strong> {new Date(submission.submitted_date).toLocaleDateString('en-IN')}
                </p>
                {submission.session_date && (
                  <p style={{ color: 'var(--fg-muted)', fontSize: '12px' }}>
                    <strong>Session:</strong> {new Date(submission.session_date).toLocaleDateString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
