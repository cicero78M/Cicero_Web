import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import RekapKomentarTiktokPage from "@/app/comments/tiktok/rekap/page";
import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientNames,
  getClientProfile,
  getUserDirectory,
} from "@/utils/api";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) =>
    React.createElement("a", props, children),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@/hooks/useRequireAuth", () => jest.fn());

jest.mock("@/utils/api", () => ({
  getDashboardStats: jest.fn(),
  getRekapKomentarTiktok: jest.fn(),
  getClientNames: jest.fn(),
  getClientProfile: jest.fn(),
  getUserDirectory: jest.fn(),
}));

const mockedGetDashboardStats = getDashboardStats as jest.MockedFunction<
  typeof getDashboardStats
>;
const mockedGetRekapKomentarTiktok =
  getRekapKomentarTiktok as jest.MockedFunction<typeof getRekapKomentarTiktok>;
const mockedGetClientNames = getClientNames as jest.MockedFunction<
  typeof getClientNames
>;
const mockedGetClientProfile = getClientProfile as jest.MockedFunction<
  typeof getClientProfile
>;
const mockedGetUserDirectory = getUserDirectory as jest.MockedFunction<
  typeof getUserDirectory
>;

describe("RekapKomentarTiktokPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("renders only Ditbinmas personnel and requests Ditbinmas data for central Ditbinmas users", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "DITBINMAS");
    localStorage.setItem("user_role", "ditbinmas");

    mockedGetDashboardStats.mockResolvedValue({ data: { ttPosts: 4 } } as any);
    mockedGetClientProfile.mockResolvedValue({ client_type: "DIREKTORAT" } as any);
    mockedGetUserDirectory.mockResolvedValue({
      data: [
        { role: "ditbinmas", client_id: "CLIENT_A" },
        { role: "lain", client_id: "CLIENT_B" },
        { role: "ditbinmas", client_id: "DITBINMAS" },
      ],
    } as any);
    mockedGetClientNames.mockResolvedValue({
      DITBINMAS: "Ditbinmas",
    } as any);

    mockedGetRekapKomentarTiktok.mockImplementation(async (_, clientId) => {
      if (clientId === "DITBINMAS") {
        return {
          data: [
            {
              user_id: "user-root",
              client_id: "DITBINMAS",
              role: "ditbinmas",
              nama: "Ditbinmas Admin",
              username: "root-user",
              jumlah_komentar: 2,
            },
            {
              user_id: "user-other",
              client_id: "DITBINMAS",
              role: "lain",
              nama: "Another Role", // should be filtered out
              username: "other-user",
              jumlah_komentar: 1,
            },
          ],
        } as any;
      }
      return { data: [] } as any;
    });

    render(React.createElement(RekapKomentarTiktokPage));

    const ditbinmasPerson = await screen.findByText("Ditbinmas Admin");
    expect(ditbinmasPerson).toBeInTheDocument();

    expect(screen.queryByText("Client A Personel")).not.toBeInTheDocument();
    expect(screen.queryByText("Another Role")).not.toBeInTheDocument();

    await waitFor(() => expect(mockedGetRekapKomentarTiktok).toHaveBeenCalled());
    const requestedClientIds = mockedGetRekapKomentarTiktok.mock.calls.map(
      (call) => call[1],
    );
    expect(new Set(requestedClientIds)).toEqual(new Set(["DITBINMAS"]));

    await waitFor(() => expect(mockedGetClientNames).toHaveBeenCalled());
    const satkerIds = mockedGetClientNames.mock.calls[0][1] as string[];
    expect(new Set(satkerIds)).toEqual(new Set(["DITBINMAS"]));
  });
});

