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
    } as any);

    render(<Page />);

    await waitFor(() => expect(mockedGetDashboardAnev).toHaveBeenCalledTimes(1));
  });
});
