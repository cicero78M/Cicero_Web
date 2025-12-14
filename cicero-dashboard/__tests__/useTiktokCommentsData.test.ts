import { renderHook, waitFor } from "@testing-library/react";
import useTiktokCommentsData from "@/hooks/useTiktokCommentsData";
import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientProfile,
  getClientNames,
  getUserDirectory,
} from "@/utils/api";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";

type Mocked<T> = jest.MockedFunction<T>;

jest.mock("@/utils/api", () => ({
  getDashboardStats: jest.fn(),
  getRekapKomentarTiktok: jest.fn(),
  getClientProfile: jest.fn(),
  getClientNames: jest.fn(),
  getUserDirectory: jest.fn(),
}));

jest.mock("@/components/ViewDataSelector", () => ({
  getPeriodeDateForView: jest.fn(),
}));

const mockedGetDashboardStats = getDashboardStats as Mocked<typeof getDashboardStats>;
const mockedGetRekapKomentarTiktok =
  getRekapKomentarTiktok as Mocked<typeof getRekapKomentarTiktok>;
const mockedGetClientProfile = getClientProfile as Mocked<typeof getClientProfile>;
const mockedGetClientNames = getClientNames as Mocked<typeof getClientNames>;
const mockedGetUserDirectory = getUserDirectory as Mocked<typeof getUserDirectory>;
const mockedGetPeriodeDateForView =
  getPeriodeDateForView as Mocked<typeof getPeriodeDateForView>;

describe("useTiktokCommentsData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockedGetPeriodeDateForView.mockReturnValue({
      periode: "periode",
      date: "date",
      startDate: "start",
      endDate: "end",
    });
    mockedGetDashboardStats.mockResolvedValue({ ttPosts: 10 });
    mockedGetClientNames.mockResolvedValue({});
  });

  it("filters directorate data to the scoped client when the login is limited to a single client", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "CLIENT_A");
    localStorage.setItem("user_role", "ditbinmas");

    mockedGetClientProfile.mockResolvedValue({ client_type: "DIREKTORAT" } as any);
    mockedGetUserDirectory.mockResolvedValue({
      data: [
        { role: "client_a", client_id: "CLIENT_A" },
        { role: "client_a", client_id: "CLIENT_B" },
      ],
    } as any);
    mockedGetClientNames.mockResolvedValue({
      CLIENT_A: "Client A",
      CLIENT_B: "Client B",
    } as any);

    mockedGetRekapKomentarTiktok.mockImplementation(async (_, clientId) => {
      if (clientId === "CLIENT_A") {
        return {
          data: [
            { client_id: "CLIENT_A", username: "user-a", jumlah_komentar: 6 },
          ],
        } as any;
      }
      if (clientId === "CLIENT_B") {
        return {
          data: [
            { client_id: "CLIENT_B", username: "user-b", jumlah_komentar: 2 },
          ],
        } as any;
      }
      return { data: [] } as any;
    });

    const { result } = renderHook(() =>
      useTiktokCommentsData({ viewBy: "monthly", customDate: "", fromDate: "", toDate: "" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isDirectorate).toBe(true);
    expect(result.current.isDirectorateScopedClient).toBe(true);
    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0].client_id).toBe("CLIENT_A");
    expect(result.current.rekapSummary.totalUser).toBe(1);
  });

  it("keeps scope locked to the active client for directorate users when scope is not 'all'", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "CLIENT_ROOT");
    localStorage.setItem("user_role", "bidhumas");

    mockedGetClientProfile.mockResolvedValue({ client_type: "DIREKTORAT" } as any);
    mockedGetUserDirectory.mockResolvedValue({
      data: [
        { role: "bidhumas", client_id: "CLIENT_ROOT" },
        { role: "bidhumas", client_id: "CLIENT_OTHER" },
      ],
    } as any);
    mockedGetClientNames.mockResolvedValue({
      CLIENT_ROOT: "Client Root",
      CLIENT_OTHER: "Client Other",
    } as any);

    mockedGetRekapKomentarTiktok.mockImplementation(async (_, clientId) => {
      if (clientId === "CLIENT_ROOT") {
        return {
          data: [
            { client_id: "CLIENT_ROOT", username: "root-user", jumlah_komentar: 4 },
          ],
        } as any;
      }
      if (clientId === "CLIENT_OTHER") {
        return {
          data: [
            { client_id: "CLIENT_OTHER", username: "other-user", jumlah_komentar: 1 },
          ],
        } as any;
      }
      return { data: [] } as any;
    });

    const { result } = renderHook(() =>
      useTiktokCommentsData({ viewBy: "monthly", customDate: "", fromDate: "", toDate: "" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isDirectorate).toBe(true);
    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0].client_id).toBe("CLIENT_ROOT");
    expect(result.current.rekapSummary.totalUser).toBe(1);
    expect(result.current.isOrgClient).toBe(false);
  });

  it("allows directorate users to broaden the recap scope when requested", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "DITBINMAS");
    localStorage.setItem("user_role", "ditbinmas");

    mockedGetClientProfile.mockResolvedValue({ client_type: "DIREKTORAT" } as any);
    mockedGetUserDirectory.mockResolvedValue({
      data: [
        { role: "ditbinmas", client_id: "CLIENT_A" },
        { role: "ditbinmas", client_id: "CLIENT_B" },
      ],
    } as any);
    mockedGetClientNames.mockResolvedValue({
      CLIENT_A: "Client A",
      CLIENT_B: "Client B",
      DITBINMAS: "Ditbinmas",
    } as any);

    mockedGetRekapKomentarTiktok.mockImplementation(async (_, clientId) => {
      if (clientId === "CLIENT_A") {
        return {
          data: [
            { client_id: "CLIENT_A", username: "user-a", jumlah_komentar: 4 },
          ],
        } as any;
      }
      if (clientId === "CLIENT_B") {
        return {
          data: [
            { client_id: "CLIENT_B", username: "user-b", jumlah_komentar: 3 },
          ],
        } as any;
      }
      if (clientId === "DITBINMAS") {
        return {
          data: [
            { client_id: "DITBINMAS", username: "root", jumlah_komentar: 2 },
          ],
        } as any;
      }
      return { data: [] } as any;
    });

    const { result } = renderHook(() =>
      useTiktokCommentsData({
        viewBy: "monthly",
        customDate: "",
        fromDate: "",
        toDate: "",
        scope: "all",
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.chartData).toHaveLength(3);
    expect(result.current.rekapSummary.totalUser).toBe(3);
  });

  it("filters directorate data for the root Ditbinmas account to match recap", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "DITBINMAS");
    localStorage.setItem("user_role", "ditbinmas");

    mockedGetClientProfile.mockResolvedValue({ client_type: "DIREKTORAT" } as any);
    mockedGetUserDirectory.mockResolvedValue({
      data: [
        { role: "ditbinmas", client_id: "CLIENT_A" },
        { role: "ditbinmas", client_id: "CLIENT_B" },
      ],
    } as any);
    mockedGetClientNames.mockResolvedValue({
      CLIENT_A: "Client A",
      CLIENT_B: "Client B",
      DITBINMAS: "Ditbinmas",
    } as any);

    mockedGetRekapKomentarTiktok.mockImplementation(async (_, clientId) => {
      if (clientId === "CLIENT_A") {
        return {
          data: [
            { client_id: "CLIENT_A", username: "user-a", jumlah_komentar: 4 },
          ],
        } as any;
      }
      if (clientId === "CLIENT_B") {
        return {
          data: [
            { client_id: "CLIENT_B", username: "user-b", jumlah_komentar: 3 },
          ],
        } as any;
      }
      if (clientId === "DITBINMAS") {
        return {
          data: [
            { client_id: "DITBINMAS", username: "root-user", jumlah_komentar: 5 },
          ],
        } as any;
      }
      return { data: [] } as any;
    });

    const { result } = renderHook(() =>
      useTiktokCommentsData({ viewBy: "monthly", customDate: "", fromDate: "", toDate: "" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isDirectorate).toBe(true);
    expect(result.current.isDirectorateScopedClient).toBe(false);
    expect(result.current.chartData).toHaveLength(1);
    const clientIds = result.current.chartData.map((item: any) => item.client_id);
    expect(clientIds).toEqual(["DITBINMAS"]);
    expect(result.current.rekapSummary.totalUser).toBe(1);
  });

  it("uses Ditbinmas metrics for Ditbinmas-role ORG clients so engagement thresholds apply", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "ORG_CLIENT");
    localStorage.setItem("user_role", "ditbinmas");

    mockedGetDashboardStats.mockResolvedValue({
      ttPosts: 8,
      effectiveClientType: "ORG",
      effectiveRole: "DITBINMAS",
    } as any);
    mockedGetClientProfile.mockResolvedValue({ client_type: "ORG" } as any);
    mockedGetUserDirectory.mockResolvedValue({
      data: [{ role: "org_client", client_id: "ORG_CLIENT" }],
    } as any);
    mockedGetRekapKomentarTiktok.mockResolvedValue({
      data: [
        {
          client_id: "ORG_CLIENT",
          username: "org-user",
          jumlah_komentar: 5,
        },
      ],
    } as any);

    const { result } = renderHook(() =>
      useTiktokCommentsData({ viewBy: "monthly", customDate: "", fromDate: "", toDate: "" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGetDashboardStats).toHaveBeenCalledWith(
      "token",
      "periode",
      "date",
      "start",
      "end",
      "DITBINMAS",
      expect.any(AbortSignal),
    );
    expect(mockedGetClientProfile).toHaveBeenCalledWith(
      "token",
      "DITBINMAS",
      expect.any(AbortSignal),
    );
    expect(result.current.rekapSummary.totalTiktokPost).toBe(8);
    expect(result.current.rekapSummary.totalSudahKomentar).toBe(1);
    expect(result.current.rekapSummary.totalBelumKomentar).toBe(0);
  });

  it("treats DITSAMAPTA BIDHUMAS as an ORG client when effective type is normalized", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "DITSAMAPTA");
    localStorage.setItem("user_role", "bidhumas");

    mockedGetDashboardStats.mockResolvedValue({
      ttPosts: 5,
      effectiveClientType: "ORG",
      effectiveRole: "BIDHUMAS",
    } as any);
    mockedGetClientProfile.mockResolvedValue({ client_type: "DIREKTORAT" } as any);
    mockedGetUserDirectory.mockResolvedValue({ data: [] } as any);
    mockedGetRekapKomentarTiktok.mockResolvedValue({
      data: [
        {
          client_id: "DITSAMAPTA",
          username: "samapta-user",
          jumlah_komentar: 3,
        },
      ],
    } as any);

    const { result } = renderHook(() =>
      useTiktokCommentsData({ viewBy: "monthly", customDate: "", fromDate: "", toDate: "" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockedGetUserDirectory).not.toHaveBeenCalled();
    expect(mockedGetRekapKomentarTiktok).toHaveBeenCalledTimes(1);
    expect(mockedGetRekapKomentarTiktok).toHaveBeenCalledWith(
      "token",
      "DITSAMAPTA",
      "periode",
      "date",
      "start",
      "end",
      expect.any(AbortSignal),
    );
    expect(result.current.isDirectorate).toBe(false);
    expect(result.current.isOrgClient).toBe(true);
    expect(result.current.isDirectorateRole).toBe(false);
    expect(result.current.isDirectorateScopedClient).toBe(false);
    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0].client_id).toBe("DITSAMAPTA");
    expect(result.current.rekapSummary.totalUser).toBe(1);
  });

  it("deduplicates personnel records for ORG clients", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "ORG_CLIENT");
    localStorage.setItem("user_role", "operator");

    mockedGetDashboardStats.mockResolvedValue({
      ttPosts: 4,
      effectiveClientType: "ORG",
    } as any);
    mockedGetClientProfile.mockResolvedValue({ client_type: "ORG" } as any);
    mockedGetRekapKomentarTiktok.mockResolvedValue({
      data: [
        {
          client_id: "ORG_CLIENT",
          user_id: "42",
          username: "duplicated-user",
          jumlah_komentar: 2,
        },
        {
          client_id: "ORG_CLIENT",
          user_id: "42",
          username: "duplicated-user",
          jumlah_komentar: 2,
        },
      ],
    } as any);

    const { result } = renderHook(() =>
      useTiktokCommentsData({ viewBy: "monthly", customDate: "", fromDate: "", toDate: "" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.rekapSummary.totalUser).toBe(1);
    expect(result.current.rekapSummary.totalSudahKomentar).toBe(1);
    expect(result.current.rekapSummary.totalBelumKomentar).toBe(0);
  });
});
