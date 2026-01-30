import { renderHook, waitFor } from "@testing-library/react";
import useTiktokCommentsData from "@/hooks/useTiktokCommentsData";
import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientProfile,
  getUserDirectory,
} from "@/utils/api";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";

type Mocked<T> = jest.MockedFunction<T>;

jest.mock("@/utils/api", () => ({
  getDashboardStats: jest.fn(),
  getRekapKomentarTiktok: jest.fn(),
  getClientProfile: jest.fn(),
  getUserDirectory: jest.fn(),
}));

jest.mock("@/components/ViewDataSelector", () => ({
  getPeriodeDateForView: jest.fn(),
}));

const mockedGetDashboardStats = getDashboardStats as Mocked<typeof getDashboardStats>;
const mockedGetRekapKomentarTiktok =
  getRekapKomentarTiktok as Mocked<typeof getRekapKomentarTiktok>;
const mockedGetClientProfile = getClientProfile as Mocked<typeof getClientProfile>;
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
    mockedGetUserDirectory.mockResolvedValue({ data: [] } as any);
  });

  it("filters directorate data to the login client even when recap payload includes other clients", async () => {
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
    mockedGetRekapKomentarTiktok.mockResolvedValue({
      data: [
        { client_id: "CLIENT_A", username: "user-a", jumlah_komentar: 6 },
        { client_id: "CLIENT_B", username: "user-b", jumlah_komentar: 2 },
      ],
      summary: {
        totalUsers: 1,
        distribution: {
          sudah: 1,
          kurang: 0,
          belum: 0,
          noUsername: 0,
          noPosts: 0,
        },
        totalPosts: 10,
      },
    } as any);

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
    mockedGetRekapKomentarTiktok.mockResolvedValue({
      data: [
        { client_id: "CLIENT_ROOT", username: "root-user", jumlah_komentar: 4 },
        { client_id: "CLIENT_OTHER", username: "other-user", jumlah_komentar: 1 },
      ],
      summary: {
        totalUsers: 1,
        distribution: {
          sudah: 1,
          kurang: 0,
          belum: 0,
          noUsername: 0,
          noPosts: 0,
        },
        totalPosts: 10,
      },
    } as any);

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
    mockedGetRekapKomentarTiktok.mockResolvedValue({
      data: [
        { client_id: "DITBINMAS", username: "root-user", jumlah_komentar: 5 },
      ],
      summary: {
        totalUsers: 1,
        distribution: {
          sudah: 1,
          kurang: 0,
          belum: 0,
          noUsername: 0,
          noPosts: 0,
        },
        totalPosts: 10,
      },
    } as any);

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

  it("uses client_id to collect tasks and recap for directorate client type", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "DIRECT_A");
    localStorage.setItem("user_role", "random_role");

    mockedGetClientProfile.mockResolvedValue({ client_type: "DIREKTORAT" } as any);
    mockedGetUserDirectory.mockResolvedValue({
      data: [
        { role: "different", client_id: "DIRECT_A" },
        { role: "different", client_id: "DIRECT_B" },
      ],
    } as any);
    mockedGetRekapKomentarTiktok.mockResolvedValue({
      data: [
        { client_id: "DIRECT_A", username: "alpha", jumlah_komentar: 5 },
      ],
      summary: {
        totalUsers: 1,
        distribution: {
          sudah: 1,
          kurang: 0,
          belum: 0,
          noUsername: 0,
          noPosts: 0,
        },
        totalPosts: 10,
      },
    } as any);

    const { result } = renderHook(() =>
      useTiktokCommentsData({ viewBy: "monthly", customDate: "", fromDate: "", toDate: "" }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isDirectorate).toBe(true);
    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0].client_id).toBe("DIRECT_A");
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
      summary: {
        totalUsers: 1,
        distribution: {
          sudah: 1,
          kurang: 0,
          belum: 0,
          noUsername: 0,
          noPosts: 0,
        },
        totalPosts: 8,
      },
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
      {
        role: "ditbinmas",
        scope: undefined,
        regional_id: undefined,
      },
      expect.any(AbortSignal),
    );
    expect(mockedGetClientProfile).toHaveBeenCalledWith(
      "token",
      "DITBINMAS",
      expect.anything(),
      {
        role: "ditbinmas",
        scope: undefined,
        regional_id: undefined,
      },
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
      summary: {
        totalUsers: 1,
        distribution: {
          sudah: 1,
          kurang: 0,
          belum: 0,
          noUsername: 0,
          noPosts: 0,
        },
        totalPosts: 5,
      },
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
      expect.anything(),
      { role: "bidhumas", scope: "ORG", regional_id: undefined },
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
      summary: {
        totalUsers: 1,
        distribution: {
          sudah: 1,
          kurang: 0,
          belum: 0,
          noUsername: 0,
          noPosts: 0,
        },
        totalPosts: 4,
      },
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
