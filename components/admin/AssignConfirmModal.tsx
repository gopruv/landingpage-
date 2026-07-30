'use client';

interface AssignConfirmModalProps {
  studentName: string;
  projectName: string;
  reviewerName: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AssignConfirmModal({
  studentName,
  projectName,
  reviewerName,
  loading,
  onConfirm,
  onCancel,
}: AssignConfirmModalProps) {
  return (
    <>
      <div
        onClick={onCancel}
        style={{ position: 'fixed', inset: 0, background: 'rgba(15,13,12,0.4)', zIndex: 300 }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(440px, calc(100vw - 32px))',
          background: '#fff',
          borderRadius: 8,
          padding: 28,
          zIndex: 301,
          boxShadow: '0 16px 48px rgba(15,13,12,0.18)',
        }}
      >
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#eb4511', marginBottom: 10 }}>
          Assign reviewer
        </p>
        <h2 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 16px', lineHeight: 1.35 }}>
          Assign {reviewerName} to review {studentName}&apos;s project?
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.6)', lineHeight: 1.65, marginBottom: 8 }}>
          <strong>{projectName}</strong>
        </p>
        <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.5)', lineHeight: 1.65, marginBottom: 24 }}>
          Press OK to notify both parties by email. The reviewer will review the application, accept the candidate, and propose a session from the student&apos;s preferred availability. No session time is set yet.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{ padding: '10px 18px', fontSize: 13, border: '1px solid rgba(15,13,12,0.2)', background: '#fff', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, background: '#eb4511', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            {loading ? 'Assigning…' : 'OK — assign & send emails'}
          </button>
        </div>
      </div>
    </>
  );
}
