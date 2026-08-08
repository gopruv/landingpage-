'use client';

import { motion, AnimatePresence } from 'framer-motion';

const BORDER = '1px solid rgba(15,13,12,0.1)';

export default function ReviewCompleteModal({
  open,
  studentCode,
  tentativeSummary,
  onViewApplication,
  onContinue,
}: {
  open: boolean;
  studentCode: string;
  tentativeSummary?: string;
  onViewApplication: () => void;
  onContinue: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,13,12,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 24,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{
              background: '#fff',
              border: BORDER,
              maxWidth: 440,
              width: '100%',
              padding: '32px 28px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(0,122,74,0.12)',
                color: '#007a4a',
                fontSize: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px' }}>Application reviewed</h2>
            <p style={{ fontSize: 14, color: 'rgba(15,13,12,0.55)', lineHeight: 1.65, margin: '0 0 6px' }}>
              Sent to admin for <strong>{studentCode}</strong> — they&apos;ll confirm the final session time.
            </p>
            {tentativeSummary && (
              <div style={{ textAlign: 'left', margin: '0 0 20px', padding: '12px 14px', background: 'rgba(184,121,0,0.08)', border: '1px solid rgba(184,121,0,0.2)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a6500', margin: '0 0 6px' }}>
                  Tentative times (not confirmed yet)
                </p>
                <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.65)', lineHeight: 1.55, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {tentativeSummary}
                </p>
              </div>
            )}
            <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.6)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Admin will pick the final slot and email both parties. You can re-read the application anytime before the session.
            </p>
            <button
              type="button"
              onClick={onViewApplication}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#fff',
                color: '#eb4511',
                border: '2px solid #eb4511',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
                marginBottom: 10,
              }}
            >
              View application for meeting prep
            </button>
            <button
              type="button"
              onClick={onContinue}
              style={{
                width: '100%',
                padding: '12px 20px',
                background: '#eb4511',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 14,
              }}
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
