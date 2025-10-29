import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import React from "react";
import { SWRConfig } from "swr";
import WeeklyReportPageClient from "@/app/weekly-report/WeeklyReportPageClient";
import useAuth from "@/hooks/useAuth";
import {
  getInstagramPosts,
  getRekapKomentarTiktok,
  getRekapLikesIG,
  getTiktokPosts,
  getUserDirectory,
} from "@/utils/api";

jest.mock("@/hooks/useRequireAuth", () => jest.fn());

jest.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/components/weekly-report/WeeklyPlatformEngagementTrendChart", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/components/weekly-report/WeeklyPlatformLikesSummary", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("@/utils/api", () => ({
  getInstagramPosts: jest.fn(),
  getRekapKomentarTiktok: jest.fn(),
  getRekapLikesIG: jest.fn(),
  getTiktokPosts: jest.fn(),
  getUserDirectory: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedGetInstagramPosts = getInstagramPosts as jest.MockedFunction<
  typeof getInstagramPosts
>;
const mockedGetRekapKomentarTiktok = getRekapKomentarTiktok as jest.MockedFunction<
  typeof getRekapKomentarTiktok
>;
const mockedGetRekapLikesIG = getRekapLikesIG as jest.MockedFunction<
  typeof getRekapLikesIG
>;
const mockedGetTiktokPosts = getTiktokPosts as jest.MockedFunction<typeof getTiktokPosts>;
const mockedGetUserDirectory = getUserDirectory as jest.MockedFunction<typeof getUserDirectory>;

describe("WeeklyReportPageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockedUseAuth.mockReturnValue({
      token: "token-value",
      clientId: "Ditbinmas-Operator",
      userId: "user-id",
      role: "Operator Ditbinmas",
      profile: null,
      setAuth: jest.fn(),
    } as any);

    mockedGetUserDirectory.mockResolvedValue({ data: [] } as any);
    mockedGetInstagramPosts.mockResolvedValue({ data: [] } as any);
    mockedGetTiktokPosts.mockResolvedValue({ data: [] } as any);
    mockedGetRekapLikesIG.mockResolvedValue({ data: [] } as any);
    mockedGetRekapKomentarTiktok.mockResolvedValue({ data: [] } as any);
  });

  it("fetches Ditbinmas data for operator roles", async () => {
    render(
      <SWRConfig
        value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}
      >
        <WeeklyReportPageClient />
      </SWRConfig>,
    );

    await waitFor(() => expect(mockedGetUserDirectory).toHaveBeenCalled());
    const [tokenArg, scopeArg] = mockedGetUserDirectory.mock.calls[0];
    expect(tokenArg).toBe("token-value");
    expect(scopeArg).toBe("DITBINMAS-OPERATOR");

    await waitFor(() => expect(mockedGetInstagramPosts).toHaveBeenCalled());
    const instagramCall = mockedGetInstagramPosts.mock.calls[0];
    expect(instagramCall[0]).toBe("token-value");
    expect(instagramCall[1]).toBe("DITBINMAS-OPERATOR");
  });
});
