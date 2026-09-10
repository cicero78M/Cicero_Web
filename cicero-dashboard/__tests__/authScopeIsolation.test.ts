import {
  COOKIE_SESSION_TOKEN,
  getAuthSession,
  logoutDashboardSession,
  logoutReposterSession,
} from "../utils/api";

describe("frontend auth scope isolation", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { role: "operator" } }),
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each(["dashboard", "reposter"] as const)(
    "labels %s session reads with an explicit scope",
    async (scope) => {
      await getAuthSession(scope);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/auth/session"),
        expect.objectContaining({
          credentials: "include",
          cache: "no-store",
          headers: { "X-Cicero-Auth-Scope": scope },
        }),
      );
    },
  );

  it("logs dashboard out without targeting the reposter scope", async () => {
    await logoutDashboardSession(COOKIE_SESSION_TOKEN);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/logout"),
      expect.objectContaining({
        headers: { "X-Cicero-Auth-Scope": "dashboard" },
      }),
    );
  });

  it("logs reposter out without targeting the dashboard scope", async () => {
    await logoutReposterSession(COOKIE_SESSION_TOKEN);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/auth/logout"),
      expect.objectContaining({
        headers: { "X-Cicero-Auth-Scope": "reposter" },
      }),
    );
  });
});
