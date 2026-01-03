import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import React from "react";
import useRequirePremium from "@/hooks/useRequirePremium";
import useAuth from "@/hooks/useAuth";
import { showToast } from "@/utils/showToast";

const replaceMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

jest.mock("@/hooks/useAuth", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/utils/showToast", () => ({
  __esModule: true,
  showToast: jest.fn(),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedShowToast = showToast as jest.Mock;

function TestComponent() {
  useRequirePremium();
  return null;
}

describe("useRequirePremium", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    replaceMock.mockClear();
    mockedShowToast.mockClear();
  });

  it("does not redirect until premium tier is extracted even if hasResolvedPremium is true", async () => {
    mockedUseAuth.mockReturnValue({
      isHydrating: false,
      isProfileLoading: false,
      premiumTier: null,
      premiumTierReady: false,
      hasResolvedPremium: true,
      premiumResolutionError: false,
    } as any);

    render(<TestComponent />);

    await waitFor(() => expect(replaceMock).not.toHaveBeenCalled());
  });

  it("redirects after tier evaluation finishes with null tier", async () => {
    mockedUseAuth.mockReturnValue({
      isHydrating: false,
      isProfileLoading: false,
      premiumTier: null,
      premiumTierReady: true,
      hasResolvedPremium: true,
      premiumResolutionError: false,
    } as any);

    render(<TestComponent />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/premium"));
  });

  it("keeps premium navigation untouched when tier exists but readiness flag is false", async () => {
    mockedUseAuth.mockReturnValue({
      isHydrating: false,
      isProfileLoading: false,
      premiumTier: "premium_1",
      premiumTierReady: false,
      hasResolvedPremium: true,
      premiumResolutionError: false,
    } as any);

    render(<TestComponent />);

    await waitFor(() => expect(replaceMock).not.toHaveBeenCalled());
  });

  it.each(["premium_1", "premium_3"])(
    "allows %s tier without redirect after resolution",
    async (tier) => {
      mockedUseAuth.mockReturnValue({
        isHydrating: false,
        isProfileLoading: false,
        premiumTier: tier,
        premiumTierReady: true,
        hasResolvedPremium: true,
        premiumResolutionError: false,
      } as any);

      render(<TestComponent />);

      await waitFor(() => expect(replaceMock).not.toHaveBeenCalled());
    },
  );

  it("shows toast instead of redirecting when premium resolution fails", async () => {
    mockedUseAuth.mockReturnValue({
      isHydrating: false,
      isProfileLoading: false,
      premiumTier: null,
      premiumTierReady: false,
      hasResolvedPremium: true,
      premiumResolutionError: true,
    } as any);

    render(<TestComponent />);

    await waitFor(() => expect(mockedShowToast).toHaveBeenCalledTimes(1));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redirects when tier is not allowed after resolution completes", async () => {
    mockedUseAuth.mockReturnValue({
      isHydrating: false,
      isProfileLoading: false,
      premiumTier: "basic",
      premiumTierReady: true,
      hasResolvedPremium: true,
      premiumResolutionError: false,
    } as any);

    render(<TestComponent />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/premium"));
  });
});
