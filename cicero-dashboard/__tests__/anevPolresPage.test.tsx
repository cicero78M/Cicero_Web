import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import Page from "@/app/anev/polres/page";
import useRequirePremium from "@/hooks/useRequirePremium";
import useAuth from "@/hooks/useAuth";
import { getDashboardAnev } from "@/utils/api";

jest.mock("@/hooks/useRequireAuth", () => ({
  __esModule: true,
  default: jest.fn(() => null),
}));

jest.mock("@/hooks/useRequirePremium", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/utils/api", () => ({
  __esModule: true,
  getDashboardAnev: jest.fn(),
}));

jest.mock("@/components/Loader", () => ({
  __esModule: true,
  default: (props: { className?: string }) => <div data-testid="loader" className={props.className} />,
}));

const mockedUseRequirePremium = useRequirePremium as jest.MockedFunction<typeof useRequirePremium>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedGetDashboardAnev = getDashboardAnev as jest.MockedFunction<typeof getDashboardAnev>;

describe("AnevPolresPage premium guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading placeholder while premium status is loading", async () => {
    mockedUseRequirePremium.mockReturnValue("loading");
    mockedUseAuth.mockReturnValue({
      token: null,
      clientId: null,
      isHydrating: true,
    } as any);

    render(<Page />);

    expect(mockedUseRequirePremium).toHaveBeenCalledWith({ redirectOnStandard: false });
    expect(screen.getByText(/Memuat status premium/i)).toBeInTheDocument();
    expect(mockedGetDashboardAnev).not.toHaveBeenCalled();
  });

  it("renders premium CTA when status is standard without fetching data", () => {
    mockedUseRequirePremium.mockReturnValue("standard");
    mockedUseAuth.mockReturnValue({
      token: "token",
      clientId: "client",
      isHydrating: false,
    } as any);

    render(<Page />);

    expect(screen.getByText(/Premium diperlukan/i)).toBeInTheDocument();
    expect(mockedGetDashboardAnev).not.toHaveBeenCalled();
  });

  it("renders inline error when premium validation fails", () => {
    mockedUseRequirePremium.mockReturnValue("error");
    mockedUseAuth.mockReturnValue({
      token: "token",
      clientId: "client",
      isHydrating: false,
    } as any);

    render(<Page />);

    expect(screen.getByText(/Gagal memvalidasi akses premium/i)).toBeInTheDocument();
    expect(mockedGetDashboardAnev).not.toHaveBeenCalled();
  });

  it("waits for premium status before fetching data", async () => {
    mockedUseRequirePremium.mockReturnValue("premium");
    mockedGetDashboardAnev.mockResolvedValue({ aggregates: {}, raw: [] } as any);
    mockedUseAuth.mockReturnValue({
      token: "token",
      clientId: "client",
      isHydrating: false,
      premiumTier: "premium_1",
      role: "operator",
      effectiveClientType: "org",
    } as any);

    render(<Page />);

    await waitFor(() => expect(mockedGetDashboardAnev).toHaveBeenCalledTimes(1));
  });

  it("builds a holistic executive summary from the selected range aggregates", async () => {
    mockedUseRequirePremium.mockReturnValue("premium");
    mockedUseAuth.mockReturnValue({
      token: "token",
      clientId: "polres-a",
      isHydrating: false,
      isProfileLoading: false,
      premiumTier: "premium_1",
      role: "operator",
      effectiveRole: "operator",
      effectiveClientType: "org",
    } as any);
    mockedGetDashboardAnev.mockResolvedValue({
      filters: { time_range: "7d", client_id: "polres-a" },
      aggregates: {
        totals: {
          total_users: 2,
          likes: 8,
          comments: 4,
          expected_actions: 8,
          total_expected_actions: 16,
          total_completed_actions: 12,
          overall_completion_rate: 0.75,
          posts: { instagram: 5, tiktok: 3 },
          compliance_per_pelaksana: [
            { nama: "Personel A", assigned: 8, completed: 8, completion_rate: 1 },
            { nama: "Personel B", assigned: 8, completed: 4, completion_rate: 0.5 },
          ],
          user_per_satfung: [{ satfung: "BINMAS", count: 2 }],
          likes_per_satfung: [{ satfung: "BINMAS", total_personnel: 2, active_personnel: 2, likes: 8 }],
          tiktok_per_satfung: [{ satfung: "BINMAS", total_personnel: 2, active_personnel: 1, comments: 4 }],
        },
        timeline: [],
        platforms: [
          { platform: "instagram", posts: 5 },
          { platform: "tiktok", posts: 3 },
        ],
        tasks: [],
        raw: {},
      },
      raw: [],
    } as any);

    render(<Page />);

    expect(await screen.findByText(/Kondisi keseluruhan/i)).toBeInTheDocument();
    expect(screen.getByText("Target aksi")).toBeInTheDocument();
    expect(screen.getByText("Celah aksi")).toBeInTheDocument();
    expect(screen.getByText(/Distribusi kepatuhan personel/i)).toBeInTheDocument();
    expect(screen.getByText(/Keseimbangan kanal/i)).toBeInTheDocument();
    expect(screen.getByText("Prioritas tindak lanjut")).toBeInTheDocument();
  });

  it("shows waiting context state and skips fetch when role or scope is missing", () => {
    mockedUseRequirePremium.mockReturnValue("premium");
    mockedUseAuth.mockReturnValue({
      token: "token",
      clientId: "client",
      isHydrating: false,
      premiumTier: "premium_1",
      role: null,
      effectiveClientType: null,
    } as any);

    render(<Page />);

    expect(screen.getAllByText(/Menunggu konteks sesi/i)).not.toHaveLength(0);
    expect(screen.getByText(/Role\/scope dari sesi login belum tersedia/i)).toBeInTheDocument();
    expect(mockedGetDashboardAnev).not.toHaveBeenCalled();
  });
});
