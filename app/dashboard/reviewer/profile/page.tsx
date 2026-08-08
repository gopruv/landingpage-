'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useRequireReviewer } from '@/lib/useRequireReviewer';
import { validateLinkedinUrl } from '@/lib/validators';
import { TIMEZONES } from '@/lib/form-constants';

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: '10px 12px',
  border: '1px solid rgba(15,13,12,0.14)',
  fontSize: 14,
  fontFamily: 'Inter, system-ui, sans-serif',
};

export default function ReviewerProfilePage() {
  const router = useRouter();
  const { ready } = useRequireReviewer();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState('5');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [expertise, setExpertise] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const res = await api.reviewer.profile() as { data?: Record<string, unknown> };
        const d = res?.data ?? {};
        setFullName(String(d.full_name ?? ''));
        setEmail(String(d.email ?? ''));
        setCurrentCompany(String(d.current_company ?? ''));
        setCurrentRole(String(d.current_role ?? ''));
        setYearsExperience(d.years_experience != null ? String(d.years_experience) : '5');
        setLinkedinUrl(String(d.linkedin_url ?? ''));
        setExpertise(String(d.expertise ?? ''));
        setTimezone(String(d.timezone ?? 'Asia/Kolkata'));
        setOnboardingComplete(!!d.reviewer_onboarding_complete);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) router.push('/dashboard/auth');
        else setError(e instanceof ApiError ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [ready, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const linkedinErr = validateLinkedinUrl(linkedinUrl);
    if (linkedinErr) { setError(linkedinErr); return; }
    setSaving(true);
    setError('');
    try {
      await api.reviewer.updateProfile({
        full_name: fullName,
        current_company: currentCompany,
        current_role: currentRole,
        years_experience: parseInt(yearsExperience, 10),
        linkedin_url: linkedinUrl,
        expertise: expertise.trim() || undefined,
        timezone: timezone.trim() || undefined,
      });
      setSaved(true);
      setOnboardingComplete(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!ready || loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading…</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf7f2', padding: '40px 24px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Link href="/dashboard/reviewer" style={{ fontSize: 13, color: 'rgba(15,13,12,0.5)' }}>← Dashboard</Link>
        <h1 style={{ fontSize: 28, margin: '16px 0 8px', fontWeight: 500 }}>Reviewer profile</h1>
        <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.55)', marginBottom: 24, lineHeight: 1.6 }}>
          Two minutes. We only need what matters for matching you with the right submissions.
        </p>
        {error && <p style={{ color: '#ba1a1a', marginBottom: 16 }}>{error}</p>}
        {saved && <p style={{ color: '#007a4a', marginBottom: 16 }}>Saved — you&apos;re ready to review.</p>}
        {!onboardingComplete && (
          <p style={{ fontSize: 12, padding: 12, background: 'rgba(235,69,17,0.08)', marginBottom: 16, color: '#eb4511' }}>
            Complete this once before your first assignment.
          </p>
        )}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14, background: '#fff', padding: 24, border: '1px solid rgba(15,13,12,0.1)' }}>
          <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} /></label>
          <label>Email<input value={email} disabled style={{ ...inputStyle, opacity: 0.6 }} /></label>
          <label>Current company<input value={currentCompany} onChange={(e) => setCurrentCompany(e.target.value)} required placeholder="e.g. Acme AI" style={inputStyle} /></label>
          <label>Current role<input value={currentRole} onChange={(e) => setCurrentRole(e.target.value)} required placeholder="e.g. Staff ML Engineer" style={inputStyle} /></label>
          <label>
            Years of experience
            <select value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} style={inputStyle}>
              {[5, 6, 7, 8, 9, 10, 12, 15, 20].map((y) => (
                <option key={y} value={y}>{y}+ years</option>
              ))}
            </select>
          </label>
          <label>LinkedIn URL<input value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} required placeholder="https://linkedin.com/in/…" style={inputStyle} /></label>
          <label>
            Core expertise <span style={{ fontWeight: 400, color: 'rgba(15,13,12,0.4)' }}>(optional, one line)</span>
            <input value={expertise} onChange={(e) => setExpertise(e.target.value)} placeholder="e.g. LLM systems, backend infra" style={inputStyle} />
          </label>
          <label>
            Timezone
            <input list="tz-list" value={timezone} onChange={(e) => setTimezone(e.target.value)} style={inputStyle} />
            <datalist id="tz-list">{TIMEZONES.map((tz) => <option key={tz} value={tz} />)}</datalist>
          </label>
          <button type="submit" disabled={saving} style={{ marginTop: 8, padding: '12px 20px', background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
