'use client';

interface ApplicationSummary {
  project_name: string;
  tech_stack: string;
  github_url: string;
  loom_url: string;
  build_decision_1: string;
  build_decision_2: string;
  build_decision_3: string;
  what_broke: string;
  ai_tools_used: string;
}

export default function SessionSubmissionSidebar({
  application,
  heading = 'Submission',
}: {
  application: ApplicationSummary;
  heading?: string;
}) {
  const fields = [
    { label: 'Decision 1', value: application.build_decision_1 },
    { label: 'Decision 2', value: application.build_decision_2 },
    { label: 'Decision 3', value: application.build_decision_3 },
    { label: 'What broke', value: application.what_broke },
    { label: 'AI tools', value: application.ai_tools_used },
  ];

  return (
    <div style={{ fontSize: 12, lineHeight: 1.55 }}>
      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#eb4511', margin: '0 0 8px' }}>
        {heading}
      </p>
      <p style={{ fontWeight: 600, margin: '0 0 4px' }}>{application.project_name}</p>
      <p style={{ color: 'rgba(15,13,12,0.55)', margin: '0 0 12px' }}>{application.tech_stack}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
        <a href={application.github_url} target="_blank" rel="noreferrer" style={{ color: '#eb4511' }}>GitHub →</a>
        <a href={application.loom_url} target="_blank" rel="noreferrer" style={{ color: '#eb4511' }}>Loom →</a>
      </div>
      {fields.map((f) => (
        <div key={f.label} style={{ marginBottom: 10 }}>
          <p style={{ fontWeight: 600, margin: '0 0 4px', fontSize: 11, color: 'rgba(15,13,12,0.45)' }}>{f.label}</p>
          <p style={{ margin: 0, color: 'rgba(15,13,12,0.65)', whiteSpace: 'pre-wrap' }}>{f.value}</p>
        </div>
      ))}
    </div>
  );
}
