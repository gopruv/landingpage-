import { NextRequest, NextResponse } from 'next/server';

import {
  allowsDashboardRole,
  dashboardPathForRole,
  type AccountType,
} from '@/lib/roles';

function parseSessionCookie(raw: string): string | null {
  for (const value of [raw, decodeURIComponent(raw)]) {
    try {
      const parsed = JSON.parse(value);
      if (parsed?.access_token) return parsed.access_token;
    } catch {
      /* try next */
    }
  }
  return null;
}

function getAccessToken(request: NextRequest): string | null {
  const chunks: { idx: number; value: string }[] = [];
  let single: string | null = null;

  for (const cookie of request.cookies.getAll()) {
    if (!cookie.name.includes('auth-token')) continue;
    const chunkMatch = cookie.name.match(/\.(\d+)$/);
    if (chunkMatch) {
      chunks.push({ idx: Number(chunkMatch[1]), value: cookie.value });
    } else {
      single = cookie.value;
    }
  }

  const raw =
    single
    ?? (chunks.length
      ? chunks.sort((a, b) => a.idx - b.idx).map((c) => c.value).join('')
      : null);
  if (!raw) return null;
  return parseSessionCookie(raw);
}

async function getAuthMe(
  request: NextRequest,
): Promise<{ account_type: string; email: string } | null> {
  const token = getAccessToken(request);
  if (!token) return null;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL
    ?? process.env.NEXT_PUBLIC_BACKEND_URL
    ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function redirectToRoleHome(request: NextRequest, accountType: string): NextResponse {
  return NextResponse.redirect(new URL(dashboardPathForRole(accountType), request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const roleRoutes: { prefix: string; role: AccountType }[] = [
    { prefix: '/dashboard/admin', role: 'admin' },
    { prefix: '/dashboard/reviewer', role: 'reviewer' },
    { prefix: '/dashboard/student', role: 'student' },
  ];

  for (const { prefix, role } of roleRoutes) {
    if (!pathname.startsWith(prefix)) continue;

    const token = getAccessToken(request);
    if (!token) {
      const login = new URL('/dashboard/auth', request.url);
      login.searchParams.set('from', role);
      return NextResponse.redirect(login);
    }

    const me = await getAuthMe(request);
    if (me && allowsDashboardRole(me, role)) {
      return NextResponse.next();
    }

    if (me?.account_type) {
      return redirectToRoleHome(request, me.account_type);
    }

    const login = new URL('/dashboard/auth', request.url);
    login.searchParams.set('error', `${role}_required`);
    return NextResponse.redirect(login);
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const me = await getAuthMe(request);
    if (me && allowsDashboardRole(me, 'admin')) {
      return NextResponse.redirect(new URL('/dashboard/admin', request.url));
    }
    const login = new URL('/dashboard/auth', request.url);
    login.searchParams.set('error', 'admin_required');
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/admin',
    '/dashboard/admin/:path*',
    '/dashboard/reviewer',
    '/dashboard/reviewer/:path*',
    '/dashboard/student',
    '/dashboard/student/:path*',
    '/admin',
    '/admin/:path*',
  ],
};
