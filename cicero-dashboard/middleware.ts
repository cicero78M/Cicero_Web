import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  if (pathname.startsWith("/reposter")) {
    const sessionCookie = request.cookies.get("reposter_session");
    if (!sessionCookie?.value) {
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
