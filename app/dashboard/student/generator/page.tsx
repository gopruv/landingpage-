'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isStudentApplyEnabled, WAITLIST_PATH } from '@/lib/platformGates';

interface GeneratedIdea {
  id: string;
  project_name: string;
  description: string;
  recommended_stack: string;
  difficulty: number;
  why_reviewable: string;
  key_architectural_decision: string;
  what_could_go_wrong: string;
}

// Mock generated ideas
const MOCK_IDEAS: GeneratedIdea[] = [
  {
    id: '1',
    project_name: 'Real-time Collaborative Document Editor',
    description: 'A web-based document editor with real-time collaboration using WebSockets and operational transformation',
    recommended_stack: 'React, Node.js, WebSocket, MongoDB',
    difficulty: 4,
    why_reviewable: 'Requires understanding of real-time sync, conflict resolution, and distributed systems',
    key_architectural_decision: 'Using operational transformation vs CRDT for conflict resolution',
    what_could_go_wrong: 'Race conditions in concurrent edits, network latency issues, state inconsistency',
  },
  {
    id: '2',
    project_name: 'ML-Powered Resume Scorer',
    description: 'An application that uses NLP to analyze resumes and predict job fit with scoring and recommendations',
    recommended_stack: 'Python, FastAPI, Hugging Face transformers, PostgreSQL',
    difficulty: 4,
    why_reviewable: 'Demonstrates ML pipeline, API design, and business logic integration',
    key_architectural_decision: 'Fine-tuning vs using pre-trained models for domain-specific scoring',
    what_could_go_wrong: 'Bias in training data, inference latency, handling edge cases in text parsing',
  },
  {
    id: '3',
    project_name: 'Distributed Cache with TTL and Eviction',
    description: 'A Redis-like in-memory cache system with TTL support, LRU eviction, and persistence',
    recommended_stack: 'Go, Protocol Buffers, RocksDB',
    difficulty: 5,
    why_reviewable: 'Tests understanding of data structures, concurrency, and system design',
    key_architectural_decision: 'In-memory data structure choice and eviction policy implementation',
    what_could_go_wrong: 'Memory management, handling concurrent access, ensuring data consistency under load',
  },
];

export default function ProjectGeneratorPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'loading' | 'results'>('form');
  const [ideas, setIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);

  // Form state
  const [role, setRole] = useState('ML Engineer');
  const [stack, setStack] = useState('');
  const [experience, setExperience] = useState('Intermediate');
  const [problem, setProblem] = useState('');
  const [time, setTime] = useState('1 month');

  // Generate ideas (mock)
  const handleGenerate = async () => {
    setStep('loading');
    setSelectedIdea(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Use mock data
    setIdeas(MOCK_IDEAS);
    setStep('results');
  };

  // Save idea
  const handleSaveIdea = (idea: GeneratedIdea) => {
    setSelectedIdea(idea);
    // In real app, would call: api.generator.save(idea)
    // For now, just show selected state
  };

  // Generate new ideas
  const handleGenerateNew = () => {
    setStep('form');
    setSelectedIdea(null);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-page)' }}>
      {/* Header */}
      <header
        className="border-b p-6"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="max-w-container mx-auto flex justify-between items-start">
          <div>
            <button
              onClick={() => router.back()}
              style={{ color: 'var(--fg-muted)' }}
              className="mb-4 text-sm hover:opacity-70"
            >
              ← Back
            </button>
            <h1 className="text-h1 mb-2" style={{ color: 'var(--orange)' }}>
              Project Idea Generator
            </h1>
            <p style={{ color: 'var(--fg-muted)' }}>
              Let AI help you find the perfect project to build
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-container mx-auto p-6 lg:p-10">
        {/* FORM STEP */}
        {step === 'form' && (
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div
                style={{ backgroundColor: 'var(--orange)', borderRadius: '50px' }}
                className="w-3 h-3"
              />
              <h2 className="text-h2">Tell us about yourself</h2>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerate();
              }}
              className="space-y-6"
            >
              {/* Target Role */}
              <div>
                <label
                  htmlFor="role"
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Target Role
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: 'var(--border)',
                    color: 'var(--fg)',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  <option>ML Engineer</option>
                  <option>AI Engineer</option>
                  <option>MLOps Engineer</option>
                  <option>NLP Engineer</option>
                  <option>CV Engineer</option>
                </select>
              </div>

              {/* Current Stack */}
              <div>
                <label
                  htmlFor="stack"
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Current Tech Stack
                </label>
                <input
                  id="stack"
                  type="text"
                  value={stack}
                  onChange={(e) => setStack(e.target.value)}
                  placeholder="e.g., Python, PyTorch, FastAPI"
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: 'var(--border)',
                    color: 'var(--fg)',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>

              {/* Experience Level */}
              <div>
                <label
                  htmlFor="experience"
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Experience Level
                </label>
                <select
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: 'var(--border)',
                    color: 'var(--fg)',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>

              {/* Problem Area */}
              <div>
                <label
                  htmlFor="problem"
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Problem Area (Optional)
                </label>
                <select
                  id="problem"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: 'var(--border)',
                    color: 'var(--fg)',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Any area</option>
                  <option>Healthcare</option>
                  <option>Finance</option>
                  <option>E-commerce</option>
                  <option>Education</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Time Available */}
              <div>
                <label
                  htmlFor="time"
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Time Available
                </label>
                <select
                  id="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: 'var(--border)',
                    color: 'var(--fg)',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  <option>2 weeks</option>
                  <option>1 month</option>
                  <option>2 months</option>
                </select>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
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
                    transition: 'opacity 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  Generate Ideas
                </button>
              </div>
            </form>
          </div>
        )}

        {/* LOADING STEP */}
        {step === 'loading' && (
          <div className="max-w-2xl mx-auto text-center py-20">
            <div
              style={{
                width: '60px',
                height: '60px',
                margin: '0 auto 24px',
                border: '3px solid var(--border)',
                borderTop: '3px solid var(--orange)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            <h2 className="text-h2 mb-2" style={{ color: 'var(--fg)' }}>
              Generating ideas...
            </h2>
            <p style={{ color: 'var(--fg-muted)' }}>
              Our AI is finding the perfect project for you
            </p>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* RESULTS STEP */}
        {step === 'results' && (
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div
                style={{ backgroundColor: 'var(--orange)', borderRadius: '50px' }}
                className="w-3 h-3"
              />
              <h2 className="text-h2">Generated Ideas</h2>
            </div>

            {/* Ideas Grid */}
            <div style={{ display: 'grid', gap: '24px', marginBottom: '32px' }}>
              {ideas.map((idea) => (
                <div
                  key={idea.id}
                  className="p-6 border"
                  style={{
                    borderColor: selectedIdea?.id === idea.id ? 'var(--orange)' : 'var(--border)',
                    borderRadius: '2px',
                    backgroundColor: selectedIdea?.id === idea.id ? 'var(--orange-tint)' : 'var(--bg-card)',
                    borderWidth: selectedIdea?.id === idea.id ? '2px' : '1px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => handleSaveIdea(idea)}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 'clamp(16px, 1.8vw, 24px)',
                          fontWeight: '500',
                          color: 'var(--fg)',
                          marginBottom: '4px',
                        }}
                      >
                        {idea.project_name}
                      </h3>
                      <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>
                        {idea.recommended_stack}
                      </p>
                    </div>
                    <div
                      style={{
                        backgroundColor: 'var(--orange)',
                        color: '#ffffff',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      {idea.difficulty}
                    </div>
                  </div>

                  {/* Description */}
                  <p style={{ color: 'var(--fg)', marginBottom: '16px', lineHeight: '1.75' }}>
                    {idea.description}
                  </p>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gap: '16px', marginBottom: '20px' }}>
                    <div>
                      <p
                        style={{
                          color: 'var(--orange)',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Why Reviewable
                      </p>
                      <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>
                        {idea.why_reviewable}
                      </p>
                    </div>

                    <div>
                      <p
                        style={{
                          color: 'var(--orange)',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Key Decision
                      </p>
                      <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>
                        {idea.key_architectural_decision}
                      </p>
                    </div>

                    <div>
                      <p
                        style={{
                          color: 'var(--orange)',
                          fontSize: '12px',
                          fontWeight: '600',
                          marginBottom: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                        }}
                      >
                        Challenges
                      </p>
                      <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>
                        {idea.what_could_go_wrong}
                      </p>
                    </div>
                  </div>

                  {/* Select Button */}
                  {selectedIdea?.id === idea.id && (
                    <button
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
                      ✓ Selected
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Actions */}
            {selectedIdea && (
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
                    marginBottom: '16px',
                  }}
                >
                  Ready to build "{selectedIdea.project_name}"?
                </h3>
                <div className="flex gap-4">
                  <button
                    onClick={() => router.push(isStudentApplyEnabled() ? '/dashboard/student' : WAITLIST_PATH)}
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
                      transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    {isStudentApplyEnabled() ? 'Apply Now' : 'Join waitlist'}
                  </button>
                  <button
                    onClick={handleGenerateNew}
                    style={{
                      backgroundColor: 'transparent',
                      color: 'var(--fg)',
                      borderRadius: '50px',
                      padding: '10px 24px',
                      fontSize: '11px',
                      fontWeight: '600',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      border: '1px solid var(--fg)',
                      cursor: 'pointer',
                      transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.6')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    Generate New Ideas
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
