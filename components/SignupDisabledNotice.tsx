import Link from 'next/link';

import { WAITLIST_PATH } from '@/lib/platformGates';

export default function SignupDisabledNotice({
  title = 'Applications are not open yet',
  body = 'Join the waitlist and we’ll notify you when student verification opens.',
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div
      className="p-6 border"
      style={{
        backgroundColor: 'var(--bg-card)',
        borderColor: 'var(--border)',
        borderRadius: '2px',
      }}
    >
      <p className="font-semibold mb-2" style={{ color: 'var(--fg)' }}>
        {title}
      </p>
      <p className="mb-4" style={{ color: 'var(--fg-muted)', fontSize: 14, lineHeight: 1.6 }}>
        {body}
      </p>
      <Link href={WAITLIST_PATH} className="btn-primary inline-block">
        Join the waitlist
      </Link>
    </div>
  );
}
