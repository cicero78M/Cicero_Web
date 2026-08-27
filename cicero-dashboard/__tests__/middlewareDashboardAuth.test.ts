/** @jest-environment node */

import { NextRequest } from "next/server";

import { middleware } from "@/middleware";

describe("dashboard middleware authentication", () => {
  it.each([
    "/dashboard",
    "/users",
    "/user-insight",
    "/executive-summary",
    "/instagram/post",
    "/likes/instagram/rekap",
    "/amplify/khusus/rekap",
    "/comments/tiktok/rekap",
    "/satbinmas-official/client-1",
    "/anev/polres/detail",
    "/premium/register",
    "/profile",
  ])("redirects unauthenticated internal route %s to login", (pathname) => {
    const response = middleware(
      new NextRequest(`https://papiqo.com${pathname}`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `https://papiqo.com/login?next=${encodeURIComponent(pathname)}`,
    );
  });

  it("allows a dashboard request carrying the HttpOnly auth cookie", () => {
    const request = new NextRequest("https://papiqo.com/dashboard", {
      headers: { cookie: "token=signed-jwt" },
    });

    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it.each([
    "/",
    "/login",
    "/reset-password/example-token",
    "/privacy-policy",
    "/terms-of-service",
    "/claim",
    "/admin-system/login",
    "/reposter/login",
  ])("keeps public or separately authenticated route %s reachable", (pathname) => {
    const response = middleware(
      new NextRequest(`https://papiqo.com${pathname}`),
    );

    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
