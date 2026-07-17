import { NextRequest, NextResponse } from "next/server";

// Rate limiting for sensitive routes (register, forgot-password, etc.) is
// enforced inside each route handler via src/lib/rate-limit.ts, since
// ioredis requires the Node.js runtime and this middleware runs on the
// Edge runtime.

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // ── Security headers ────────────────────────────────────────────────
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://www.google-analytics.com",
      "frame-ancestors 'none'",
    ].join("; ")
  );

  // ── Origin / CSRF check for state-changing requests ─────────────────
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");

    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
      }
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|gif)$).*)",
  ],
};
