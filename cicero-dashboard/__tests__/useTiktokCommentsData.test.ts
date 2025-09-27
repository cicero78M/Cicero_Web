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
    expect(result.current.isDitbinmasScopedClient).toBe(true);
    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0].client_id).toBe("CLIENT_A");
    expect(result.current.rekapSummary.totalUser).toBe(1);
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
    expect(result.current.isDitbinmasScopedClient).toBe(false);
    expect(result.current.chartData).toHaveLength(1);
    const clientIds = result.current.chartData.map((item: any) => item.client_id);
    expect(clientIds).toEqual(["DITBINMAS"]);
    expect(result.current.rekapSummary.totalUser).toBe(1);
  });
});
