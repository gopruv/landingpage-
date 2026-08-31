import type { Session } from '@supabase/supabase-js';

import {
  clearLocalAuthSession,
  isStoredSessionExpired,
  readLocalAuthSession,
  supabase,
} from './supabase';

const REFRESH_ERROR_RE = /refresh token/i;
/** If the access token expired longer ago than this, clear locally without calling refresh. */
const MAX_EXPIRED_BEFORE_CLEAR_MS = 7 * 24 * 60 * 60 * 1000;

function isRefreshError(message: string | undefined): boolean {
  return !!message && REFRESH_ERROR_RE.test(message);
}

function isNetworkAuthError(message: string | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return lower.includes('failed to fetch') || lower.includes('network');
}

function isSessionTooStale(session: Session): boolean {
  if (!session.expires_at) return true;
  const expiredForMs = Date.now() - session.expires_at * 1000;
  return expiredForMs > MAX_EXPIRED_BEFORE_CLEAR_MS;
}

/** Drop ancient local sessions without a network call (avoids refresh 400s on return visits). */
export async function purgeAncientAuthSession(): Promise<void> {
  const session = readLocalAuthSession();
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
 * Avoids supabase.auth.getSession() on expired tokens — that always triggers a network refresh.
 */
export async function getSafeSession(
  options: SafeSessionOptions = {},
): Promise<Session | null> {
  const shouldRefresh = options.refresh ?? false;
  const local = readLocalAuthSession();

  if (!local) return null;

  if (!isStoredSessionExpired(local)) {
    return local;
  }

  if (!shouldRefresh) {
    return null;
  }

  if (isSessionTooStale(local)) {
    await clearInvalidAuthSession();
    return null;
  }

  if (!local.refresh_token) {
    await clearInvalidAuthSession();
    return null;
  }

  try {
    const { data, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: local.refresh_token,
    });

    if (refreshError) {
      if (isRefreshError(refreshError.message) || isNetworkAuthError(refreshError.message)) {
        await clearInvalidAuthSession();
      }
      return null;
    }

    return data.session ?? null;
  } catch {
    await clearInvalidAuthSession();
    return null;
  }
}
