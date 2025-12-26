import { renderHook, waitFor } from "@testing-library/react";
import useInstagramLikesData from "@/hooks/useInstagramLikesData";
import {
  getDashboardStats,
  getRekapLikesIG,
  getClientProfile,
  getClientNames,
  getUserDirectory,
} from "@/utils/api";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";
import { AuthContext } from "@/context/AuthContext";

jest.mock("@/utils/api", () => ({
  getDashboardStats: jest.fn(),
  getRekapLikesIG: jest.fn(),
  getClientProfile: jest.fn(),
  getClientNames: jest.fn(),
  getUserDirectory: jest.fn(),
}));

jest.mock("@/components/ViewDataSelector", () => ({
  getPeriodeDateForView: jest.fn(),
}));

type Mocked<T> = jest.MockedFunction<T>;

const mockedGetDashboardStats = getDashboardStats as Mocked<
  typeof getDashboardStats
>;
const mockedGetRekapLikesIG = getRekapLikesIG as Mocked<
  typeof getRekapLikesIG
>;
const mockedGetClientProfile = getClientProfile as Mocked<
  typeof getClientProfile
>;
const mockedGetClientNames = getClientNames as Mocked<typeof getClientNames>;
const mockedGetUserDirectory = getUserDirectory as Mocked<
  typeof getUserDirectory
>;
const mockedGetPeriodeDateForView = getPeriodeDateForView as Mocked<
  typeof getPeriodeDateForView
>;

describe("useInstagramLikesData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPeriodeDateForView.mockReturnValue({
      periode: "periode",
      date: "date",
      startDate: "start",
      endDate: "end",
    });
    mockedGetClientNames.mockResolvedValue({});
  });

  it("passes mapped client ID for DITSAMAPTA BIDHUMAS when using Ditbinmas fetcher", async () => {
    const authValue = {
      token: "token",
      clientId: "DITSAMAPTA",
      userId: "user-id",
      role: "bidhumas",
      effectiveRole: "bidhumas",
      effectiveClientType: "ORG",
      profile: null,
      isHydrating: false,
      setAuth: jest.fn(),
    } as any;

    mockedGetDashboardStats.mockResolvedValue({ instagramPosts: 1 });
    mockedGetClientProfile.mockResolvedValue({ client: { nama: "Bidhumas" } });
    mockedGetUserDirectory.mockResolvedValue({
      data: [
        { role: "bidhumas", client_id: "CLIENT_X", username: "user-x" },
      ],
    });
    mockedGetClientNames.mockResolvedValue({
      BIDHUMAS: "Bidhumas",
      CLIENT_X: "Client X",
    });
    mockedGetRekapLikesIG.mockImplementation(async (_, clientId) => {
      if (clientId === "CLIENT_X") {
        return {
          data: [
            { client_id: "CLIENT_X", username: "user-x", jumlah_like: 1 },
          ],
        } as any;
      }
      return {
        data: [
          { client_id: "BIDHUMAS", username: "root", jumlah_like: 0 },
        ],
      } as any;
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(
      () =>
        useInstagramLikesData({
          viewBy: "monthly",
          customDate: "",
          fromDate: "",
          toDate: "",
          scope: "all",
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGetDashboardStats).toHaveBeenCalledWith(
      "token",
      "periode",
      "date",
      "start",
      "end",
      "BIDHUMAS",
      {
        role: "bidhumas",
        scope: "ORG",
        regional_id: undefined,
      },
      expect.any(AbortSignal),
    );
    expect(mockedGetClientProfile).toHaveBeenCalledWith(
      "token",
      "BIDHUMAS",
      expect.anything(),
      {
        role: "bidhumas",
        scope: "ORG",
        regional_id: undefined,
      },
    );
    expect(mockedGetUserDirectory).toHaveBeenCalledWith(
      "token",
      "BIDHUMAS",
      {
        role: "bidhumas",
        scope: "ORG",
        regional_id: undefined,
      },
      expect.any(AbortSignal),
    );
    expect(mockedGetRekapLikesIG).toHaveBeenCalledWith(
      "token",
      "CLIENT_X",
      "periode",
      "date",
      "start",
      "end",
      expect.anything(),
      { role: "bidhumas", scope: "ORG", regional_id: undefined },
    );
    expect(mockedGetRekapLikesIG).toHaveBeenCalledWith(
      "token",
      "BIDHUMAS",
      "periode",
      "date",
      "start",
      "end",
      expect.anything(),
      { role: "bidhumas", scope: "ORG", regional_id: undefined },
    );
    expect(result.current.chartData).toHaveLength(2);
    expect(result.current.rekapSummary.totalUser).toBe(2);
  });

  it("filters directorate data to the active client when scope is client", async () => {
    const authValue = {
      token: "token",
      clientId: "DIR_A",
      userId: "user-id",
      role: "operator",
      effectiveRole: "operator",
      effectiveClientType: undefined,
      profile: null,
      isHydrating: false,
      setAuth: jest.fn(),
    } as any;

    mockedGetDashboardStats.mockResolvedValue({ instagramPosts: 2 });
    mockedGetClientProfile.mockResolvedValue({
      client: { nama: "Ditres", client_type: "DIREKTORAT" },
    });
    mockedGetUserDirectory.mockResolvedValue({
      data: [
        { role: "dir_a", client_id: "DIR_A", username: "root-a" },
        { role: "dir_a", client_id: "DIR_B", username: "root-b" },
      ],
    });
    mockedGetClientNames.mockResolvedValue({ DIR_A: "Ditres", DIR_B: "Dir B" });
    mockedGetRekapLikesIG.mockImplementation(async (_, clientId) => {
      if (clientId === "DIR_A") {
        return {
          data: [
            { client_id: "DIR_A", username: "user-a", jumlah_like: 2 },
          ],
        } as any;
      }
      if (clientId === "DIR_B") {
        return {
          data: [
            { client_id: "DIR_B", username: "user-b", jumlah_like: 0 },
          ],
        } as any;
      }
      return { data: [] } as any;
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(
      () =>
        useInstagramLikesData({
          viewBy: "monthly",
          customDate: "",
          fromDate: "",
          toDate: "",
          scope: "client",
        }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGetRekapLikesIG).toHaveBeenCalledWith(
      "token",
      "DIR_A",
      "periode",
      "date",
      "start",
      "end",
      expect.anything(),
      { role: "operator", scope: "DIREKTORAT", regional_id: undefined },
    );
    expect(mockedGetRekapLikesIG).toHaveBeenCalledWith(
      "token",
      "DIR_B",
      "periode",
      "date",
      "start",
      "end",
      expect.anything(),
      { role: "operator", scope: "DIREKTORAT", regional_id: undefined },
    );
    expect(result.current.isDirectorate).toBe(true);
    expect(result.current.isOrgClient).toBe(false);
    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.rekapSummary.totalUser).toBe(1);
  });
});
