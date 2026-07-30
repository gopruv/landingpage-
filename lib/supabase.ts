import { createClient } from '@supabase/supabase-js';

function cookieDomain(): string {
  if (typeof window === 'undefined') return '';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return '';
  return '.orcred.com';
}

// Cookie-based storage so the session is shared across orcred.com and dashboard.orcred.com
const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${key}=`));
    return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    const domain = cookieDomain();
    const domainPart = domain ? `; domain=${domain}` : '';
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${domainPart}`;
  },
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    const domain = cookieDomain();
    const domainPart = domain ? `; domain=${domain}` : '';
    document.cookie = `${key}=; path=/; max-age=0${domainPart}`;
  },
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: cookieStorage,
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);
