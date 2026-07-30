'use client';

import { useState } from 'react';
import { api, ApiError } from '@/lib/api';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

interface PaymentSectionProps {
  applicationId: string;
  amountPaise?: number;
  status?: string;
  paymentAt?: string | null;
  utrNumber?: string | null;
  onSuccess: () => void;
}

export default function PaymentSection({
  applicationId,
  amountPaise = 199900,
  status,
  paymentAt,
  utrNumber,
  onSuccess,
}: PaymentSectionProps) {
  const [loading, setLoading] = useState(false);
  const [utr, setUtr] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (paymentAt || status === 'payment_confirmed') {
    return (
      <p style={{ fontSize: 13, color: '#007a4a', fontWeight: 600, margin: '16px 0 0' }}>
        Payment confirmed — our team is reviewing your application.
      </p>
    );
  }

  const amountInr = (amountPaise / 100).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });

  const payWithRazorpay = async () => {
    setLoading(true);
    setError('');
    try {
      await loadRazorpayScript();
      const res = await api.payments.createOrder(applicationId) as {
        data?: {
          order_id: string;
          amount: number;
          currency: string;
          key_id: string;
          application_id: string;
        };
      };
      const order = res.data;
      if (!order?.key_id || !window.Razorpay) {
        throw new Error('Razorpay unavailable — use manual UTR below or ask admin to confirm payment.');
      }

      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: 'Orcred',
          description: 'Application verification fee',
          order_id: order.order_id,
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              await api.payments.verify({
                application_id: applicationId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setMessage('Payment successful!');
              onSuccess();
              resolve();
            } catch (e) {
              reject(e);
            }
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled')),
          },
        });
        rzp.open();
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const submitUtr = async () => {
    if (utr.trim().length < 6) {
      setError('Enter a valid UTR / transaction reference (min 6 characters).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.payments.submitUtr({ application_id: applicationId, utr_number: utr.trim() });
      setMessage('UTR submitted — admin will confirm payment shortly.');
      onSuccess();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not submit UTR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: 24, padding: 20, background: 'rgba(235,69,17,0.04)', border: '1px solid rgba(235,69,17,0.15)' }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#eb4511', margin: '0 0 8px' }}>
        Complete payment — {amountInr}
      </p>
      <p style={{ fontSize: 13, color: 'rgba(15,13,12,0.55)', lineHeight: 1.6, margin: '0 0 16px' }}>
        Pay via Razorpay (UPI, cards, net banking) or submit your UTR for manual confirmation during testing.
      </p>

      {message && <p style={{ fontSize: 13, color: '#007a4a', marginBottom: 12 }}>{message}</p>}
      {error && <p style={{ fontSize: 13, color: '#ba1a1a', marginBottom: 12 }}>{error}</p>}
      {status === 'payment_pending' && utrNumber && !paymentAt && (
        <p style={{ fontSize: 12, color: '#9a6500', marginBottom: 12 }}>
          UTR on file ({utrNumber}) — awaiting admin confirmation.
        </p>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <button
          type="button"
          disabled={loading}
          onClick={payWithRazorpay}
          style={{
            padding: '10px 20px',
            background: '#eb4511',
            color: '#fff',
            border: 'none',
            borderRadius: 50,
            fontSize: 12,
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          Pay with Razorpay
        </button>
      </div>

      <div style={{ borderTop: '1px solid rgba(15,13,12,0.08)', paddingTop: 16 }}>
        <p style={{ fontSize: 12, fontWeight: 600, margin: '0 0 8px' }}>Manual UTR (testing fallback)</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={utr}
            onChange={(e) => setUtr(e.target.value)}
            placeholder="UTR / transaction ID"
            style={{ flex: 1, minWidth: 200, padding: '8px 12px', fontSize: 13, border: '1px solid rgba(15,13,12,0.15)' }}
          />
          <button
            type="button"
            disabled={loading}
            onClick={submitUtr}
            style={{ padding: '8px 16px', background: '#fff', border: '1px solid rgba(15,13,12,0.2)', fontSize: 12, cursor: 'pointer' }}
          >
            Submit UTR
          </button>
        </div>
      </div>
    </div>
  );
}
