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

  it("shows subordinate member rows for a logged-in Ditbinmas directorate user", async () => {
    localStorage.setItem("cicero_token", "token");
    localStorage.setItem("client_id", "DITBINMAS");
    localStorage.setItem("user_role", "ditbinmas");

    mockedGetDashboardStats.mockResolvedValue({ data: { ttPosts: 4 } } as any);
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
            {
              user_id: "user-a-id",
              client_id: "CLIENT_A",
              nama: "Client A Personel",
              username: "user-a",
              jumlah_komentar: 5,
            },
          ],
        } as any;
      }
      if (clientId === "CLIENT_B") {
        return {
          data: [
            {
              user_id: "user-b-id",
              client_id: "CLIENT_B",
              nama: "Client B Personel",
              username: "user-b",
              jumlah_komentar: 3,
            },
          ],
        } as any;
      }
      if (clientId === "DITBINMAS") {
        return {
          data: [
            {
              user_id: "user-root",
              client_id: "DITBINMAS",
              nama: "Ditbinmas Admin",
              username: "root-user",
              jumlah_komentar: 2,
            },
          ],
        } as any;
      }
      return { data: [] } as any;
    });

    render(React.createElement(RekapKomentarTiktokPage));

    const rootPerson = await screen.findByText("Ditbinmas Admin");
    expect(rootPerson).toBeInTheDocument();

    const rootRow = rootPerson.closest("tr");
    expect(rootRow).not.toBeNull();
    expect(rootRow).toHaveTextContent("Ditbinmas");
    expect(rootRow).toHaveTextContent("root-user");

    expect(screen.queryByText("Client B Personel")).not.toBeInTheDocument();

    await waitFor(() => expect(mockedGetRekapKomentarTiktok).toHaveBeenCalled());
    const requestedClientIds = mockedGetRekapKomentarTiktok.mock.calls.map(
      (call) => call[1],
    );
    expect(new Set(requestedClientIds)).toEqual(
      new Set(["DITBINMAS", "CLIENT_A", "CLIENT_B"]),
    );

    await waitFor(() => expect(mockedGetClientNames).toHaveBeenCalled());
    const satkerIds = mockedGetClientNames.mock.calls[0][1] as string[];
    expect(new Set(satkerIds)).toEqual(new Set(["DITBINMAS"]));
  });
});

