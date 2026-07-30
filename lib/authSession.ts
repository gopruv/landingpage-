import type { Session } from '@supabase/supabase-js';

import { clearLocalAuthSession, supabase } from './supabase';

const REFRESH_ERROR_RE = /refresh token/i;
/** If the access token expired longer ago than this, clear locally without calling refresh. */
const MAX_EXPIRED_BEFORE_CLEAR_MS = 7 * 24 * 60 * 60 * 1000;

function isAccessTokenExpired(session: Session, bufferSeconds = 30): boolean {
  if (!session.expires_at) return true;
  return session.expires_at * 1000 <= Date.now() + bufferSeconds * 1000;
}

function isRefreshError(message: string | undefined): boolean {
  return !!message && REFRESH_ERROR_RE.test(message);
}

function isSessionTooStale(session: Session): boolean {
  if (!session.expires_at) return true;
  const expiredForMs = Date.now() - session.expires_at * 1000;
  return expiredForMs > MAX_EXPIRED_BEFORE_CLEAR_MS;
}

/** Drop ancient local sessions without a network call (avoids refresh 400s on return visits). */
export async function purgeAncientAuthSession(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  if (isSessionTooStale(session)) {
    await clearInvalidAuthSession();
  }
}

/** Clear broken local session without calling Supabase (avoids another 400). */
export async function clearInvalidAuthSession(): Promise<void> {
  clearLocalAuthSession();
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    /* ignore */
  }
}

export interface SafeSessionOptions {
  /** When true, refresh an expired access token. Default false on public pages. */
  refresh?: boolean;
}

/**
 * Read the current session. Optionally refresh if expired.
 * Invalid / missing refresh tokens are cleared locally — no console spam in prod.
 */
export async function getSafeSession(
  options: SafeSessionOptions = {},
): Promise<Session | null> {
  const shouldRefresh = options.refresh ?? false;

  const { data: { session }, error } = await supabase.auth.getSession();

  if (error && isRefreshError(error.message)) {
    await clearInvalidAuthSession();
    return null;
  }

  if (!session) return null;

  if (!shouldRefresh || !isAccessTokenExpired(session)) {
    return session;
  }

  if (isSessionTooStale(session)) {
    await clearInvalidAuthSession();
    return null;
  }

  const { data, error: refreshError } = await supabase.auth.refreshSession();

  if (refreshError) {
    if (isRefreshError(refreshError.message)) {
      await clearInvalidAuthSession();
    }
    return null;
  }

  return data.session ?? null;
}
