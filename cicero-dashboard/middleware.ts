import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_PROTECTED_PREFIXES = [
  "/dashboard",
  "/users",
  "/user-insight",
  "/executive-summary",
  "/instagram",
  "/likes/instagram",
  "/amplify",
  "/tiktok",
  "/comments/tiktok",
  "/info/instagram",
  "/posts/instagram",
  "/posts/tiktok",
  "/satbinmas-official",
  "/anev/polres",
  "/mekanisme-absensi",
  "/panduan-sop",
  "/pengaturan",
  "/profile",
  "/premium",
] as const;

function matchesRoutePrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function decodeJwtPayload(token?: string): Record<string, unknown> | null {
  if (!token) return null;
  const segments = token.split(".");
  if (segments.length < 2) return null;

  try {
    const payload = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function hasUsableAuthToken(token?: string): boolean {
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  const exp = Number((payload as { exp?: unknown }).exp);
  if (!Number.isFinite(exp)) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp > nowSeconds;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isServerActionRequest = request.method === "POST" && request.headers.has("next-action");

  if (isServerActionRequest) {
    return NextResponse.json(
      {
        message:
          "This action request is no longer valid for the active deployment. Please reload the page and try again.",
      },
      {
        status: 409,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "x-cicero-refresh-required": "1",
        },
      }
    );
  }

  if (pathname.startsWith("/reposter/login")) {
    return NextResponse.next();
  }

  const isDashboardProtected = DASHBOARD_PROTECTED_PREFIXES.some((prefix) =>
    matchesRoutePrefix(pathname, prefix),
  );

  if (isDashboardProtected) {
    const authToken = request.cookies.get("token")?.value;
    if (!hasUsableAuthToken(authToken)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/reposter")) {
    const authToken = request.cookies.get("token")?.value;
    if (!hasUsableAuthToken(authToken)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/reposter/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
