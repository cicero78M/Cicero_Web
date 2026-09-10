/** @jest-environment node */

import { NextRequest } from "next/server";

import { middleware } from "@/middleware";

describe("dashboard middleware authentication", () => {
  it.each([
    ["dashboard.papiqo.com", "/dashboard"],
    ["claim.papiqo.com", "/claim"],
    ["reposter.papiqo.com", "/reposter"],
  ])("redirects the %s root to its portal path", (hostname, portalPath) => {
    const response = middleware(new NextRequest(`https://${hostname}/`));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      `https://${hostname}${portalPath}`,
    );
  });

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
    const payload = Buffer.from(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600,
        dashboard_user_id: "dashboard-1",
      }),
    ).toString("base64url");
    const request = new NextRequest("https://papiqo.com/dashboard", {
      headers: { cookie: `cicero_dashboard_session=header.${payload}.signature` },
    });

    const response = middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("rejects a reposter cookie on dashboard routes", () => {
    const payload = Buffer.from(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600,
        user_id: "reposter-1",
        role: "user",
      }),
    ).toString("base64url");
    const request = new NextRequest("https://papiqo.com/dashboard", {
      headers: { cookie: `cicero_reposter_session=header.${payload}.signature` },
    });

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/login?next=%2Fdashboard");
  });

  it("rejects a dashboard cookie on reposter routes", () => {
    const payload = Buffer.from(
      JSON.stringify({
        exp: Math.floor(Date.now() / 1000) + 3600,
        dashboard_user_id: "dashboard-1",
      }),
    ).toString("base64url");
    const request = new NextRequest("https://papiqo.com/reposter/tasks/official", {
      headers: { cookie: `cicero_dashboard_session=header.${payload}.signature` },
    });

    const response = middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/reposter/login");
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
