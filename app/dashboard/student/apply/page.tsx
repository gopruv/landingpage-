'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useRequireAuth } from '@/lib/useRequireAuth';
import { supabase } from '@/lib/supabase';
import { validateGithubUrl, validateLinkedinUrl, validateLoomUrl, normalizeUrl } from '@/lib/validators';
import { AVAILABILITY_OPTIONS, TECH_STACK_TAGS, TIMEZONES } from '@/lib/form-constants';
import SignupDisabledNotice from '@/components/SignupDisabledNotice';
import { isStudentApplyEnabled } from '@/lib/platformGates';

interface ApplicationFormData {
  // Step 1
  full_name: string;
  email: string;
  linkedin_url: string;
  college: string;
  graduation_year: string;

  // Step 2
  project_name: string;
  tech_stack: string;
  github_url: string;
  loom_url: string;

  // Step 3
  build_decision_1: string;
  build_decision_2: string;
  build_decision_3: string;
  what_broke: string;
  ai_tools_used: string;

  // Step 4
  availability_week_1: string[];
  availability_other: string;
  timezone: string;
  terms_confirmed: boolean;
  recording_consent: boolean;
}

const STEPS = [
  { number: 1, label: 'Personal Details' },
  { number: 2, label: 'Project Details' },
  { number: 3, label: 'Deep Dive' },
  { number: 4, label: 'Schedule & Payment' },
];

const EMPTY_FORM: ApplicationFormData = {
  full_name: '',
  email: '',
  linkedin_url: '',
  college: '',
  graduation_year: '',
  project_name: '',
  tech_stack: '',
  github_url: '',
  loom_url: '',
  build_decision_1: '',
  build_decision_2: '',
  build_decision_3: '',
  what_broke: '',
  ai_tools_used: '',
  availability_week_1: [],
  availability_other: '',
  timezone: typeof Intl !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'Asia/Kolkata',
  terms_confirmed: false,
  recording_consent: false,
};

const toggleTag = (tags: string[], tag: string) =>
  tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];

/** Map selected availability labels to API slot format */
function optionsToAvailability(options: string[], timezone: string, other?: string) {
  const today = new Date();
  const slots = options.map((opt, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    const hour = opt.toLowerCase().includes('evening') ? '18:00'
      : opt.toLowerCase().includes('afternoon') ? '14:00' : '10:00';
    return { date: d.toISOString().split('T')[0], time: hour, timezone, description: opt };
  });
  if (other?.trim()) {
    const d = new Date(today);
    d.setDate(d.getDate() + options.length + 1);
    slots.push({ date: d.toISOString().split('T')[0], time: '12:00', timezone, description: other.trim() });
  }
  return slots;
}

const DEEP_DIVE_MIN = 50;
const AI_TOOLS_MIN = 10;

function MinLengthHint({ value, min }: { value: string; min: number }) {
  const len = value.trim().length;
  const ok = len >= min;
  return (
    <p
      style={{
        fontSize: 12,
        marginTop: 4,
        color: ok ? 'var(--fg-faint)' : '#ba1a1a',
      }}
    >
      {ok
        ? `${len} characters — minimum met`
        : `${len} / ${min} characters minimum${len > 0 ? ` (${min - len} more needed)` : ''}`}
    </p>
  );
}

function collectStepErrors(step: number, data: ApplicationFormData): Record<string, string> {
  const newErrors: Record<string, string> = {};

  if (step === 1) {
    if (!data.full_name.trim()) newErrors.full_name = 'Name is required';
    if (!data.college.trim()) newErrors.college = 'College is required';
    if (!data.graduation_year.trim()) {
      newErrors.graduation_year = 'Graduation year is required';
    } else {
      const year = parseInt(data.graduation_year, 10);
      if (Number.isNaN(year) || year < 2000 || year > 2035) {
        newErrors.graduation_year = 'Enter a valid graduation year';
      }
    }
    const linkedinErr = validateLinkedinUrl(data.linkedin_url);
    if (linkedinErr) newErrors.linkedin_url = linkedinErr;
  }

  if (step === 2) {
    if (!data.project_name.trim()) newErrors.project_name = 'Project name is required';
    if (!data.tech_stack.trim()) newErrors.tech_stack = 'Select at least one tech tag';
    const gh = validateGithubUrl(data.github_url);
    if (gh) newErrors.github_url = gh;
    const loom = validateLoomUrl(data.loom_url);
    if (loom) newErrors.loom_url = loom;
  }

  if (step === 3) {
    const minLen = (field: string, label: string, min: number) => {
      const v = field.trim();
      if (!v) newErrors[label] = `Required — at least ${min} characters`;
      else if (v.length < min) newErrors[label] = `${min - v.length} more characters needed (${v.length}/${min})`;
    };
    minLen(data.build_decision_1, 'build_decision_1', DEEP_DIVE_MIN);
    minLen(data.build_decision_2, 'build_decision_2', DEEP_DIVE_MIN);
    minLen(data.build_decision_3, 'build_decision_3', DEEP_DIVE_MIN);
    minLen(data.what_broke, 'what_broke', DEEP_DIVE_MIN);
    if (!data.ai_tools_used.trim()) {
      newErrors.ai_tools_used = `Required — at least ${AI_TOOLS_MIN} characters`;
    } else if (data.ai_tools_used.trim().length < AI_TOOLS_MIN) {
      const len = data.ai_tools_used.trim().length;
      newErrors.ai_tools_used = `${AI_TOOLS_MIN - len} more characters needed (${len}/${AI_TOOLS_MIN})`;
    }
  }

  if (step === 4) {
    if (!data.terms_confirmed) newErrors.terms = 'Please confirm the terms';
    if (!data.recording_consent) newErrors.recording = 'Please consent to recording';
    if (data.availability_week_1.length < 3) {
      newErrors.availability = 'Select at least 3 availability options';
    }
  }

  return newErrors;
}

export default function ApplicationPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<ApplicationFormData>(EMPTY_FORM);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await api.student.profile() as { data?: Record<string, unknown> };
        const profile = res?.data ?? res as Record<string, unknown>;
        setFormData((prev) => ({
          ...prev,
          full_name: String(profile.full_name ?? prev.full_name),
          email: String(profile.email ?? session?.user.email ?? prev.email),
          linkedin_url: String(profile.linkedin_url ?? prev.linkedin_url),
          college: String(profile.college ?? prev.college),
          graduation_year: profile.graduation_year != null
            ? String(profile.graduation_year)
            : prev.graduation_year,
        }));
      } catch {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user.email) {
          setFormData((prev) => ({ ...prev, email: session.user.email! }));
        }
      } finally {
        setLoadingProfile(false);
      }
    })();
  }, [ready]);

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step = currentStep): boolean => {
    const newErrors = collectStepErrors(step, formData);
    setErrors((prev) => {
      const next = { ...prev };
      // Clear errors for fields validated on this step
      const stepFields: Record<number, string[]> = {
        1: ['full_name', 'college', 'graduation_year', 'linkedin_url'],
        2: ['project_name', 'tech_stack', 'github_url', 'loom_url'],
        3: ['build_decision_1', 'build_decision_2', 'build_decision_3', 'what_broke', 'ai_tools_used'],
        4: ['terms', 'recording', 'availability'],
      };
      for (const key of stepFields[step] ?? []) delete next[key];
      return { ...next, ...newErrors };
    });
    return Object.keys(newErrors).length === 0;
  };

  const validateAllSteps = (): number | null => {
    let allErrors: Record<string, string> = {};
    let firstBadStep: number | null = null;
    for (let s = 1; s <= 4; s++) {
      const stepErrors = collectStepErrors(s, formData);
      if (Object.keys(stepErrors).length > 0 && firstBadStep === null) firstBadStep = s;
      allErrors = { ...allErrors, ...stepErrors };
    }
    setErrors(allErrors);
    return firstBadStep;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    const badStep = validateAllSteps();
    if (badStep !== null) {
      setCurrentStep(badStep);
      return;
    }
    setSubmitting(true);
    try {
      const linkedinUrl = normalizeUrl(formData.linkedin_url);
      const githubUrl = normalizeUrl(formData.github_url);
      const loomUrl = normalizeUrl(formData.loom_url);

      // Step 1: update profile
      await api.student.updateProfile({
        full_name: formData.full_name,
        linkedin_url: linkedinUrl,
        college: formData.college,
        graduation_year: formData.graduation_year
          ? parseInt(formData.graduation_year, 10)
          : undefined,
      });

      const availability = optionsToAvailability(
        formData.availability_week_1,
        formData.timezone,
        formData.availability_other,
      );

      await api.student.createApplication({
        project_name: formData.project_name,
        tech_stack: formData.tech_stack,
        github_url: githubUrl,
        loom_url: loomUrl,
        build_decision_1: formData.build_decision_1.trim(),
        build_decision_2: formData.build_decision_2.trim(),
        build_decision_3: formData.build_decision_3.trim(),
        what_broke: formData.what_broke.trim(),
        ai_tools_used: formData.ai_tools_used.trim(),
        availability,
        recording_consent: true,
      });

      setSubmitted(true);
    } catch (err: any) {
      setErrors({ submit: err?.message || 'Submission failed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-page)' }}>
        <p style={{ color: 'var(--fg-muted)', fontSize: '14px' }}>Loading…</p>
      </div>
    );
  }

  if (!isStudentApplyEnabled()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--bg-page)' }}>
        <div className="w-full max-w-md">
          <SignupDisabledNotice />
        </div>
      </div>
    );
  }

  if (submitted) {
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
            <h1 className="text-h1 mb-2" style={{ color: 'var(--orange)' }}>
              Orcred
            </h1>
          </div>
        </header>

        <main className="max-w-container mx-auto p-6 lg:p-10 flex items-center justify-center min-h-[500px]">
          <div
            className="max-w-md p-8 text-center"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: '2px',
              border: '2px solid',
              borderColor: 'var(--orange)',
            }}
          >
            <h2
              style={{
                fontSize: '48px',
                color: 'var(--orange)',
                marginBottom: '16px',
                fontWeight: '600',
              }}
            >
              ✓
            </h2>
            <h3 className="text-h2 mb-2" style={{ color: 'var(--fg)' }}>
              Application Submitted!
            </h3>
            <p style={{ color: 'var(--fg-muted)', marginBottom: '24px' }}>
              Thank you for applying. You'll hear from us within 3-5 business days.
            </p>
            <button
              onClick={() => router.push('/dashboard/student')}
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
              Go to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

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
        <div className="max-w-container mx-auto">
          <button
            onClick={() => router.back()}
            style={{ color: 'var(--fg-muted)' }}
            className="mb-4 text-sm hover:opacity-70"
          >
            ← Back
          </button>
          <h1 className="text-h1 mb-2" style={{ color: 'var(--orange)' }}>
            Apply for Verification
          </h1>
          <p style={{ color: 'var(--fg-muted)' }}>Step {currentStep} of 4</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-container mx-auto p-6 lg:p-10">
        {/* Progress Steps */}
        <div className="mb-8">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
            {STEPS.map((step) => (
              <div
                key={step.number}
                style={{
                  flex: 1,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: step.number <= currentStep ? 'var(--orange)' : 'var(--bg-alt)',
                    borderRadius: '2px',
                    marginBottom: '8px',
                  }}
                />
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: '500',
                    color: step.number <= currentStep ? 'var(--orange)' : 'var(--fg-muted)',
                  }}
                >
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-2xl">
          {/* STEP 1: Personal Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div
                  style={{ backgroundColor: 'var(--orange)', borderRadius: '50px' }}
                  className="w-3 h-3"
                />
                <h2 className="text-h2">Personal Details</h2>
              </div>

              {/* Full Name */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: errors.full_name ? '#ba1a1a' : 'var(--border)',
                    color: 'var(--fg)',
                  }}
                />
                {errors.full_name && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                    {errors.full_name}
                  </p>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-alt)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: 'var(--border)',
                    color: 'var(--fg-muted)',
                  }}
                />
              </div>

              {/* LinkedIn URL */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  LinkedIn URL *
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: errors.linkedin_url ? '#ba1a1a' : 'var(--border)',
                    color: 'var(--fg)',
                  }}
                />
                {errors.linkedin_url && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                    {errors.linkedin_url}
                  </p>
                )}
              </div>

              {/* College & Year */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label
                    className="block mb-2"
                    style={{
                      color: 'var(--orange)',
                      fontSize: '10px',
                      fontWeight: '500',
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                    }}
                  >
                    College
                  </label>
                  <input
                    type="text"
                    value={formData.college}
                    onChange={(e) => handleInputChange('college', e.target.value)}
                    placeholder="Your college or university"
                    className="w-full px-4 py-3"
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderRadius: '2px',
                      border: '1px solid',
                      borderColor: errors.college ? '#ba1a1a' : 'var(--border)',
                      color: 'var(--fg)',
                    }}
                  />
                  {errors.college && (
                    <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                      {errors.college}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    className="block mb-2"
                    style={{
                      color: 'var(--orange)',
                      fontSize: '10px',
                      fontWeight: '500',
                      letterSpacing: '0.3em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    min={2020}
                    max={2035}
                    value={formData.graduation_year}
                    onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                    placeholder="e.g. 2026"
                    className="w-full px-4 py-3"
                    style={{
                      backgroundColor: 'var(--bg-page)',
                      borderRadius: '2px',
                      border: '1px solid',
                      borderColor: errors.graduation_year ? '#ba1a1a' : 'var(--border)',
                      color: 'var(--fg)',
                    }}
                  />
                  {errors.graduation_year && (
                    <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                      {errors.graduation_year}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Project Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div
                  style={{ backgroundColor: 'var(--orange)', borderRadius: '50px' }}
                  className="w-3 h-3"
                />
                <h2 className="text-h2">Project Details</h2>
              </div>

              {/* Project Name */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Project Name *
                </label>
                <input
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => handleInputChange('project_name', e.target.value)}
                  placeholder="What did you build?"
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: errors.project_name ? '#ba1a1a' : 'var(--border)',
                    color: 'var(--fg)',
                  }}
                />
                {errors.project_name && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                    {errors.project_name}
                  </p>
                )}
              </div>

              {/* Tech Stack */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Tech Stack * (select tags)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {TECH_STACK_TAGS.map((tag) => {
                    const selected = formData.tech_stack.split(',').map((t) => t.trim()).filter(Boolean).includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const current = formData.tech_stack.split(',').map((t) => t.trim()).filter(Boolean);
                          handleInputChange('tech_stack', toggleTag(current, tag).join(', '));
                        }}
                        style={{
                          padding: '6px 12px', fontSize: 12, borderRadius: 20, cursor: 'pointer',
                          border: `1px solid ${selected ? '#eb4511' : 'var(--border)'}`,
                          background: selected ? 'rgba(235,69,17,0.1)' : 'transparent',
                          color: selected ? '#eb4511' : 'var(--fg)',
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
                {errors.tech_stack && <p style={{ color: '#ba1a1a', fontSize: 12 }}>{errors.tech_stack}</p>}
              </div>

              {/* GitHub URL */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  GitHub Repository URL *
                </label>
                <input
                  type="url"
                  value={formData.github_url}
                  onChange={(e) => handleInputChange('github_url', e.target.value)}
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: errors.github_url ? '#ba1a1a' : 'var(--border)',
                    color: 'var(--fg)',
                  }}
                />
                {errors.github_url && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                    {errors.github_url}
                  </p>
                )}
              </div>

              {/* Loom URL */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Loom Walkthrough URL *
                </label>
                <input
                  type="url"
                  value={formData.loom_url}
                  onChange={(e) => handleInputChange('loom_url', e.target.value)}
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: errors.loom_url ? '#ba1a1a' : 'var(--border)',
                    color: 'var(--fg)',
                  }}
                />
                {errors.loom_url && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                    {errors.loom_url}
                  </p>
                )}
                <p style={{ color: 'var(--fg-faint)', fontSize: '12px', marginTop: '8px' }}>
                  Your Loom should be 8-12 minutes. Walk through what the system does, why you chose your stack, one decision you would change and why.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: Deep Dive */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div
                  style={{ backgroundColor: 'var(--orange)', borderRadius: '50px' }}
                  className="w-3 h-3"
                />
                <h2 className="text-h2">Deep Dive</h2>
              </div>
              <p style={{ color: 'var(--fg-muted)', fontSize: 13, marginBottom: 20, lineHeight: 1.55 }}>
                Each answer below needs at least <strong>{DEEP_DIVE_MIN} characters</strong> so reviewers have enough context.
                AI tools: at least <strong>{AI_TOOLS_MIN} characters</strong>.
              </p>

              {/* Decision 1 */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Most Important Architectural Decision *
                </label>
                <textarea
                  value={formData.build_decision_1}
                  onChange={(e) => handleInputChange('build_decision_1', e.target.value)}
                  placeholder="What was the most important architectural decision you made and why"
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: errors.build_decision_1 ? '#ba1a1a' : 'var(--border)',
                    color: 'var(--fg)',
                    fontFamily: 'Inter, sans-serif',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
                {errors.build_decision_1 && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                    {errors.build_decision_1}
                  </p>
                )}
                <MinLengthHint value={formData.build_decision_1} min={DEEP_DIVE_MIN} />
              </div>

              {/* Decision 2 */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  What Didn't Work *
                </label>
                <textarea
                  value={formData.build_decision_2}
                  onChange={(e) => handleInputChange('build_decision_2', e.target.value)}
                  placeholder="What did you try that did not work and what did you do instead"
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: errors.build_decision_2 ? '#ba1a1a' : 'var(--border)',
                    color: 'var(--fg)',
                    fontFamily: 'Inter, sans-serif',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
                {errors.build_decision_2 && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                    {errors.build_decision_2}
                  </p>
                )}
                <MinLengthHint value={formData.build_decision_2} min={DEEP_DIVE_MIN} />
              </div>

              {/* Decision 3 */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  What You'd Change *
                </label>
                <textarea
                  value={formData.build_decision_3}
                  onChange={(e) => handleInputChange('build_decision_3', e.target.value)}
                  placeholder="If you were to rebuild this from scratch what would you do differently"
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: errors.build_decision_3 ? '#ba1a1a' : 'var(--border)',
                    color: 'var(--fg)',
                    fontFamily: 'Inter, sans-serif',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
                {errors.build_decision_3 && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                    {errors.build_decision_3}
                  </p>
                )}
                <MinLengthHint value={formData.build_decision_3} min={DEEP_DIVE_MIN} />
              </div>

              {/* What Broke */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Something That Broke *
                </label>
                <textarea
                  value={formData.what_broke}
                  onChange={(e) => handleInputChange('what_broke', e.target.value)}
                  placeholder="Describe one thing that broke during development and how you fixed it"
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: errors.what_broke ? '#ba1a1a' : 'var(--border)',
                    color: 'var(--fg)',
                    fontFamily: 'Inter, sans-serif',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
                {errors.what_broke && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                    {errors.what_broke}
                  </p>
                )}
                <MinLengthHint value={formData.what_broke} min={DEEP_DIVE_MIN} />
              </div>

              {/* AI Tools */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  AI Tools Used *
                </label>
                <textarea
                  value={formData.ai_tools_used}
                  onChange={(e) => handleInputChange('ai_tools_used', e.target.value)}
                  placeholder="Which AI tools did you use and for what specifically. Be honest and specific."
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: errors.ai_tools_used ? '#ba1a1a' : 'var(--border)',
                    color: 'var(--fg)',
                    fontFamily: 'Inter, sans-serif',
                    minHeight: '100px',
                    resize: 'vertical',
                  }}
                />
                {errors.ai_tools_used && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>
                    {errors.ai_tools_used}
                  </p>
                )}
                <MinLengthHint value={formData.ai_tools_used} min={AI_TOOLS_MIN} />
                <p style={{ color: 'var(--fg-faint)', fontSize: '12px', marginTop: '8px' }}>
                  Be specific and honest. Using AI tools is fine. Claiming you didn't when you did is grounds for disqualification.
                </p>
              </div>
            </div>
          )}

          {/* STEP 4: Schedule & Payment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-8">
                <div
                  style={{ backgroundColor: 'var(--orange)', borderRadius: '50px' }}
                  className="w-3 h-3"
                />
                <h2 className="text-h2">Schedule & Payment</h2>
              </div>

              {/* Timezone */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Timezone
                </label>
                <input
                  list="timezone-options"
                  type="text"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  className="w-full px-4 py-3"
                  style={{
                    backgroundColor: 'var(--bg-page)',
                    borderRadius: '2px',
                    border: '1px solid',
                    borderColor: 'var(--border)',
                    color: 'var(--fg)',
                  }}
                />
                <datalist id="timezone-options">
                  {TIMEZONES.map((tz) => <option key={tz} value={tz} />)}
                </datalist>
              </div>

              {/* Availability Week 1 */}
              <div>
                <label
                  className="block mb-2"
                  style={{
                    color: 'var(--orange)',
                    fontSize: '10px',
                    fontWeight: '500',
                    letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                  }}
                >
                  Availability *
                </label>
                <p style={{ color: 'var(--fg-muted)', fontSize: '12px', marginBottom: '8px' }}>
                  Select at least 3 windows that work for you
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  {AVAILABILITY_OPTIONS.map((slot) => (
                    <label
                      key={slot}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        backgroundColor: formData.availability_week_1.includes(slot)
                          ? 'var(--orange-tint)'
                          : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.availability_week_1.includes(slot)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleInputChange('availability_week_1', [
                              ...formData.availability_week_1,
                              slot,
                            ]);
                          } else {
                            handleInputChange(
                              'availability_week_1',
                              formData.availability_week_1.filter((s) => s !== slot)
                            );
                          }
                        }}
                      />
                      <span style={{ color: 'var(--fg)', fontSize: '14px' }}>{slot}</span>
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Other availability (optional)"
                  value={formData.availability_other}
                  onChange={(e) => handleInputChange('availability_other', e.target.value)}
                  className="w-full px-4 py-3 mt-3"
                  style={{ border: '1px solid var(--border)', borderRadius: 2 }}
                />
                {errors.availability && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '8px' }}>{errors.availability}</p>
                )}
              </div>

              {/* PRD upload — deferred v1 */}
              <div style={{ padding: 12, background: 'rgba(15,13,12,0.04)', fontSize: 12, color: 'rgba(15,13,12,0.5)' }}>
                PRD upload coming soon — optional project doc attachment will be added in a future release.
              </div>

              {/* Checkboxes */}
              <div className="space-y-4 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                <label
                  style={{
                    display: 'flex',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.terms_confirmed}
                    onChange={(e) => handleInputChange('terms_confirmed', e.target.checked)}
                  />
                  <span style={{ color: 'var(--fg)' }}>
                    I confirm I built this project and can defend every decision I made
                  </span>
                </label>
                {errors.terms && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px' }}>{errors.terms}</p>
                )}

                <label
                  style={{
                    display: 'flex',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.recording_consent}
                    onChange={(e) => handleInputChange('recording_consent', e.target.checked)}
                  />
                  <span style={{ color: 'var(--fg)' }}>
                    I consent to this session being recorded for quality control purposes
                  </span>
                </label>
                {errors.recording && (
                  <p style={{ color: '#ba1a1a', fontSize: '12px' }}>{errors.recording}</p>
                )}
              </div>

              {/* Payment Widget */}
              <div
                className="p-6 border-2"
                style={{
                  borderColor: 'var(--orange)',
                  borderRadius: '2px',
                  backgroundColor: 'var(--orange-tint)',
                  marginTop: '24px',
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
                  Payment
                </h3>
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    padding: '16px',
                    borderRadius: '2px',
                    marginBottom: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--fg)' }}>Verification Fee</span>
                    <span style={{ color: 'var(--orange)', fontWeight: '600' }}>₹1,999</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--fg)', fontWeight: '500' }}>Total</span>
                    <span style={{ fontSize: '18px', color: 'var(--orange)', fontWeight: '600' }}>
                      ₹1,999
                    </span>
                  </div>
                </div>
                <p style={{ color: 'var(--fg-muted)', fontSize: '12px', marginBottom: '16px' }}>
                  Payment will be processed via Razorpay (UPI, Cards, Net Banking supported)
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid',
              borderColor: 'var(--border)',
            }}
          >
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
              style={{
                backgroundColor: 'transparent',
                color: currentStep === 1 ? 'var(--fg-faint)' : 'var(--fg)',
                borderRadius: '50px',
                padding: '10px 24px',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                border: '1px solid',
                borderColor: currentStep === 1 ? 'var(--border)' : 'var(--fg)',
                cursor: currentStep === 1 ? 'not-allowed' : 'pointer',
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={(e) =>
                currentStep > 1 && (e.currentTarget.style.opacity = '0.6')
              }
              onMouseLeave={(e) =>
                currentStep > 1 && (e.currentTarget.style.opacity = '1')
              }
            >
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
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
                  flex: 1,
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Next
              </button>
            ) : (
              <>
                {errors.submit && (
                  <p style={{ color: '#ba1a1a', fontSize: '13px', width: '100%', textAlign: 'center', marginBottom: '8px' }}>
                    {errors.submit}
                  </p>
                )}
              <button
                onClick={handleSubmit}
                disabled={submitting}
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
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  flex: 1,
                  opacity: submitting ? 0.6 : 1,
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => !submitting && (e.currentTarget.style.opacity = '0.8')}
                onMouseLeave={(e) => !submitting && (e.currentTarget.style.opacity = '1')}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
