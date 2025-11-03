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

type Mocked<T> = jest.MockedFunction<T>;

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

const mockedGetDashboardStats = getDashboardStats as Mocked<
  typeof getDashboardStats
>;
const mockedGetRekapLikesIG = getRekapLikesIG as Mocked<typeof getRekapLikesIG>;
const mockedGetClientProfile =
  getClientProfile as Mocked<typeof getClientProfile>;
const mockedGetClientNames = getClientNames as Mocked<typeof getClientNames>;
const mockedGetUserDirectory =
  getUserDirectory as Mocked<typeof getUserDirectory>;
const mockedGetPeriodeDateForView =
  getPeriodeDateForView as Mocked<typeof getPeriodeDateForView>;

describe("useInstagramLikesData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockedGetPeriodeDateForView.mockReturnValue({
      periode: "periode",
      date: "date",
      startDate: "start",
      endDate: "end",
    });
    mockedGetDashboardStats.mockResolvedValue({ instagramPosts: 1 } as any);
    mockedGetClientProfile.mockResolvedValue({ client_type: "SATKER" } as any);
    mockedGetClientNames.mockResolvedValue({} as any);
    mockedGetUserDirectory.mockResolvedValue({ data: [] } as any);
  });

  it("keeps records without client identifiers when filtering by client", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "CLIENT_A");
    localStorage.setItem("user_role", "operator");

    mockedGetRekapLikesIG.mockResolvedValue({
      data: [
        {
          username: "user-a",
          jumlah_like: 1,
          pangkat: "BRIPDA",
        },
      ],
    } as any);

    const { result } = renderHook(() =>
      useInstagramLikesData({
        viewBy: "monthly",
        customDate: "",
        fromDate: "",
        toDate: "",
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.chartData).toHaveLength(1);
    expect(result.current.chartData[0].username).toBe("user-a");
    expect(result.current.rekapSummary.totalUser).toBe(1);
  });
});
