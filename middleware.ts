import { NextRequest, NextResponse } from "next/server";

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
    if (!cookie.name.includes("auth-token")) continue;
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
      ? chunks.sort((a, b) => a.idx - b.idx).map((c) => c.value).join("")
      : null);
  if (!raw) return null;
  return parseSessionCookie(raw);
}

async function getAuthMe(request: NextRequest): Promise<{ account_type: string; email: string } | null> {
  const token = getAccessToken(request);
  if (!token) return null;

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL
    ?? process.env.NEXT_PUBLIC_BACKEND_URL
    ?? "http://localhost:3001";

  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const DEV_FULL_ACCESS_EMAILS = new Set(
  (process.env.NEXT_PUBLIC_DEV_FULL_ACCESS_EMAILS ?? "anshika.sswal@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

function isDevFullAccess(email: string | undefined): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return !!email && DEV_FULL_ACCESS_EMAILS.has(email.toLowerCase());
}

function allowsRoute(
  me: { account_type: string; email: string } | null,
  required: "admin" | "reviewer",
): boolean {
  if (!me) return false;
  if (isDevFullAccess(me.email)) return true;
  return me.account_type === required;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isDev = process.env.NODE_ENV !== "production";

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const me = await getAuthMe(request);
    if (allowsRoute(me, "admin")) {
      return NextResponse.redirect(new URL("/dashboard/admin", request.url));
    }
    const login = new URL("/dashboard/auth", request.url);
    login.searchParams.set("error", "admin_required");
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/dashboard/admin")) {
    const token = getAccessToken(request);
    if (!token) {
      const login = new URL("/dashboard/auth", request.url);
      login.searchParams.set("from", "admin");
      return NextResponse.redirect(login);
    }

    const me = await getAuthMe(request);
    if (allowsRoute(me, "admin")) {
      return NextResponse.next();
    }

    // Local dev: session cookie present but /auth/me failed — still allow dashboard load
    if (isDev && token) {
      return NextResponse.next();
    }

    const login = new URL("/dashboard/auth", request.url);
    login.searchParams.set("error", "admin_required");
    return NextResponse.redirect(login);
  }

  if (pathname.startsWith("/dashboard/reviewer")) {
    const token = getAccessToken(request);
    if (!token) {
      const login = new URL("/dashboard/auth", request.url);
      login.searchParams.set("from", "reviewer");
      return NextResponse.redirect(login);
    }

    const me = await getAuthMe(request);
    if (allowsRoute(me, "reviewer")) {
      return NextResponse.next();
    }

    if (isDev && token) {
      return NextResponse.next();
    }

    const login = new URL("/dashboard/auth", request.url);
    login.searchParams.set("error", "reviewer_required");
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/admin/:path*",
    "/dashboard/reviewer/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
