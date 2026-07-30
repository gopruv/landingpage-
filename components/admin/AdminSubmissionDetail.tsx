'use client';

interface AdminSubmissionDetailProps {
  project_name: string;
  tech_stack: string;
  github_url: string;
  loom_url: string;
  build_decision_1: string;
  build_decision_2: string;
  build_decision_3: string;
  what_broke: string;
  ai_tools_used: string;
  submitted_at?: string;
}

export default function AdminSubmissionDetail(props: AdminSubmissionDetailProps) {
  const sections = [
    { title: 'Build decision 1', body: props.build_decision_1 },
    { title: 'Build decision 2', body: props.build_decision_2 },
    { title: 'Build decision 3', body: props.build_decision_3 },
    { title: 'What broke', body: props.what_broke },
    { title: 'AI tools used', body: props.ai_tools_used },
  ];

  return (
    <div style={{ marginBottom: 24, padding: 16, border: '1px solid rgba(15,13,12,0.1)', background: 'rgba(15,13,12,0.02)' }}>
      <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#005fa3', margin: '0 0 10px' }}>
        Full submission (reviewer view)
      </p>
      <p style={{ fontSize: 13, fontWeight: 600, margin: '0 0 4px' }}>{props.project_name}</p>
      <p style={{ fontSize: 12, color: 'rgba(15,13,12,0.55)', margin: '0 0 12px' }}>{props.tech_stack}</p>
      {props.submitted_at && (
        <p style={{ fontSize: 11, color: 'rgba(15,13,12,0.4)', margin: '0 0 12px' }}>
          Submitted {new Date(props.submitted_at).toLocaleDateString('en-IN')}
        </p>
      )}
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, fontSize: 12 }}>
        <a href={props.github_url} target="_blank" rel="noreferrer" style={{ color: '#eb4511' }}>GitHub</a>
        <a href={props.loom_url} target="_blank" rel="noreferrer" style={{ color: '#eb4511' }}>Loom</a>
      </div>
      {sections.map((s) => (
        <div key={s.title} style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 600, margin: '0 0 4px', color: 'rgba(15,13,12,0.45)' }}>{s.title}</p>
          <p style={{ fontSize: 12, margin: 0, lineHeight: 1.6, color: 'rgba(15,13,12,0.7)', whiteSpace: 'pre-wrap' }}>{s.body}</p>
        </div>
      ))}
    </div>
  );
}
