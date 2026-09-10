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

const PORTAL_ROOTS: Record<string, string> = {
  "dashboard.papiqo.com": "/dashboard",
  "claim.papiqo.com": "/claim",
  "reposter.papiqo.com": "/reposter",
};

const DASHBOARD_SESSION_COOKIE = "cicero_dashboard_session";
const REPOSTER_SESSION_COOKIE = "cicero_reposter_session";
const LEGACY_SESSION_COOKIE = "token";

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

function hasUsableAuthToken(token: string | undefined, expectedScope: "dashboard" | "reposter"): boolean {
  if (!token) return false;

  const payload = decodeJwtPayload(token);
  if (!payload) return false;

  const exp = Number((payload as { exp?: unknown }).exp);
  if (!Number.isFinite(exp)) return false;

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (exp <= nowSeconds) return false;

  if (expectedScope === "dashboard") {
    return Boolean((payload as { dashboard_user_id?: unknown }).dashboard_user_id);
  }
  return (
    (payload as { role?: unknown }).role === "user" &&
    Boolean((payload as { user_id?: unknown }).user_id)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = (request.headers.get("host") || request.nextUrl.hostname)
    .split(":", 1)[0]
    .toLowerCase();
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

  const portalRoot = PORTAL_ROOTS[hostname];
  if (portalRoot && pathname === "/") {
    const portalUrl = request.nextUrl.clone();
    portalUrl.pathname = portalRoot;
    return NextResponse.redirect(portalUrl);
  }

  if (pathname.startsWith("/reposter/login")) {
    return NextResponse.next();
  }

  const isDashboardProtected = DASHBOARD_PROTECTED_PREFIXES.some((prefix) =>
    matchesRoutePrefix(pathname, prefix),
  );

  if (isDashboardProtected) {
    const authToken =
      request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value ||
      request.cookies.get(LEGACY_SESSION_COOKIE)?.value;
    if (!hasUsableAuthToken(authToken, "dashboard")) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/reposter")) {
    const authToken =
      request.cookies.get(REPOSTER_SESSION_COOKIE)?.value ||
      request.cookies.get(LEGACY_SESSION_COOKIE)?.value;
    if (!hasUsableAuthToken(authToken, "reposter")) {
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
