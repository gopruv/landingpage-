import { createClient } from '@supabase/supabase-js';

/** Shared parent domain in production so orcred.com and dashboard.orcred.com share auth cookies. */
function cookieDomain(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return undefined;
  if (host === 'orcred.com' || host.endsWith('.orcred.com')) return '.orcred.com';
  return undefined;
}

function buildCookieAttrs(maxAge: number): string {
  const domain = cookieDomain();
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const parts = [
    `path=/`,
    `max-age=${maxAge}`,
    `SameSite=Lax`,
    ...(domain ? [`domain=${domain}`] : []),
    ...(secure ? ['Secure'] : []),
  ];
  return parts.join('; ');
}

function expireCookie(name: string, domain?: string): void {
  if (typeof document === 'undefined') return;
  const domainPart = domain ? `; domain=${domain}` : '';
  document.cookie = `${name}=; path=/${domainPart}; max-age=0`;
}

function clearMatchingCookies(key: string): void {
  if (typeof document === 'undefined') return;
  const names = document.cookie
    .split('; ')
    .map((row) => row.split('=')[0]?.trim())
    .filter((name): name is string => !!name && (name === key || name.startsWith(`${key}.`)));

  for (const name of names) {
    expireCookie(name);
    expireCookie(name, '.orcred.com');
  }
}

// Cookie storage shared across orcred.com subdomains in production.
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
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `${key}=${encodeURIComponent(value)}; ${buildCookieAttrs(maxAge)}`;
  },
  removeItem: (key: string): void => {
    clearMatchingCookies(key);
  },
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: cookieStorage,
      // Refresh only via getSafeSession() so stale tokens are cleared instead of surfacing 400s.
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

/** Wipe all Supabase auth cookies (local only — no server round-trip). */
export function clearLocalAuthSession(): void {
  if (typeof document === 'undefined') return;
  const names = document.cookie
    .split('; ')
    .map((row) => row.split('=')[0]?.trim())
    .filter((name): name is string => !!name && name.includes('-auth-token'));

  for (const name of names) {
    clearMatchingCookies(name);
  }
}
