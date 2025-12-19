import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/reposter/login")) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("reposter_session");
  if (!sessionCookie?.value) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/reposter/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/reposter/:path*"],
};
