'use client';

import { useEffect, useRef, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import type { DailyCall, DailyEventObjectFatalError } from '@daily-co/daily-js';

/** Serialize Daily create/destroy — React Strict Mode remounts otherwise throw. */
let lifecycle: Promise<void> = Promise.resolve();

async function destroyDailyInstances(): Promise<void> {
  const existing = DailyIframe.getCallInstance();
  if (!existing) return;
  try {
    if (existing.meetingState() !== 'left-meeting') {
      await existing.leave();
    }
  } catch {
    /* ignore */
  }
  try {
    await existing.destroy();
  } catch {
    /* already destroyed */
  }
}

const DAILY_ERROR_MESSAGES: Record<string, string> = {
  'account-missing-payment-method':
    'Daily.co requires a payment method on your account before calls can start. Add a card at dashboard.daily.co → Billing (you stay on pay-as-you-go; free tier minutes may still apply).',
};

function dailyErrorMessage(err: unknown): string {
  let code: string | undefined;
  if (err instanceof Error && err.message) code = err.message;
  if (err && typeof err === 'object' && 'errorMsg' in err) {
    code = (err as DailyEventObjectFatalError).errorMsg ?? code;
  }
  if (code && DAILY_ERROR_MESSAGES[code]) return DAILY_ERROR_MESSAGES[code];
  if (code) return code;
  return 'Could not join session';
}

function waitForDailyJoin(
  call: DailyCall,
  props: { url: string; token: string; userName: string; startVideoOff?: boolean; startAudioOff?: boolean },
  onJoinedCallback?: () => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (fn: () => void) => {
      if (settled) return;
      settled = true;
      call.off('joined-meeting', onJoined);
      call.off('error', onError);
      fn();
    };

    const onJoined = () => {
      onJoinedCallback?.();
      finish(resolve);
    };
    const onError = (ev: DailyEventObjectFatalError) => finish(() => reject(new Error(dailyErrorMessage(ev))));

    call.on('joined-meeting', onJoined);
    call.on('error', onError);

    call.join(props).catch((err: unknown) => finish(() => reject(new Error(dailyErrorMessage(err)))));
  });
}

interface DailyRoomEmbedProps {
  roomUrl: string;
  token: string;
  userName: string;
  onJoined?: () => void;
}

export default function DailyRoomEmbed({ roomUrl, token, userName, onJoined }: DailyRoomEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const onJoinedRef = useRef(onJoined);
  onJoinedRef.current = onJoined;
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current;
    if (!container) return;

    setLoading(true);
    setError('');

    const setup = lifecycle.then(async () => {
      await destroyDailyInstances();
      if (cancelled || !containerRef.current) return;

      const frame = DailyIframe.createFrame(containerRef.current, {
        showLeaveButton: true,
        showFullscreenButton: true,
        iframeStyle: {
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '8px',
        },
      });

      callRef.current = frame;

      await waitForDailyJoin(
        frame,
        { url: roomUrl, token, userName, startVideoOff: true, startAudioOff: false },
        () => onJoinedRef.current?.(),
      );
      if (!cancelled) setLoading(false);
    });

    setup.catch((err: unknown) => {
      if (!cancelled) {
        setError(dailyErrorMessage(err));
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      lifecycle = setup.finally(async () => {
        const call = callRef.current;
        callRef.current = null;
        if (call) {
          try {
            if (call.meetingState() !== 'left-meeting') {
              await call.leave();
            }
          } catch {
            /* ignore */
          }
          try {
            await call.destroy();
          } catch {
            /* ignore */
          }
        }
        await destroyDailyInstances();
      });
    };
  }, [roomUrl, token, userName]);

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <p style={{ color: '#ba1a1a', fontSize: 14, margin: '0 0 12px' }}>{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ fontSize: 12, fontWeight: 600, padding: '8px 14px', cursor: 'pointer' }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 'min(70vh, 640px)' }}>
      {loading && (
        <p
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: 0,
            fontSize: 14,
            color: 'rgba(15,13,12,0.45)',
            background: '#faf7f2',
            borderRadius: 8,
            zIndex: 1,
          }}
        >
          Connecting to session…
        </p>
      )}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', background: '#0f0d0c', borderRadius: 8 }}
      />
    </div>
  );
}
