import { createClient } from '@supabase/supabase-js';

/** Stay under the ~4KB browser cookie limit (chunked for proxy.ts). */
const COOKIE_CHUNK_SIZE = 3180;

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

function readCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

function readChunkedCookie(key: string): string | null {
  if (typeof document === 'undefined') return null;

  const single = readCookieValue(key);
  if (single) return single;

  const chunks: { idx: number; value: string }[] = [];
  for (const row of document.cookie.split('; ')) {
    const eq = row.indexOf('=');
    if (eq < 0) continue;
    const name = row.slice(0, eq).trim();
    const chunkMatch = name.match(new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.(\\d+)$`));
    if (!chunkMatch) continue;
    chunks.push({
      idx: Number(chunkMatch[1]),
      value: decodeURIComponent(row.slice(eq + 1)),
    });
  }

  if (!chunks.length) return null;
  return chunks.sort((a, b) => a.idx - b.idx).map((c) => c.value).join('');
}

// Cookie storage shared across orcred.com subdomains in production.
const cookieStorage = {
  getItem: (key: string): string | null => readChunkedCookie(key),
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;
    clearMatchingCookies(key);
    const maxAge = 60 * 60 * 24 * 365;
    const encoded = encodeURIComponent(value);
    const attrs = buildCookieAttrs(maxAge);

    if (encoded.length <= COOKIE_CHUNK_SIZE) {
      document.cookie = `${key}=${encoded}; ${attrs}`;
      return;
    }

    let idx = 0;
    for (let i = 0; i < encoded.length; i += COOKIE_CHUNK_SIZE) {
      const chunk = encoded.slice(i, i + COOKIE_CHUNK_SIZE);
      document.cookie = `${key}.${idx}=${chunk}; ${attrs}`;
      idx += 1;
    }
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
