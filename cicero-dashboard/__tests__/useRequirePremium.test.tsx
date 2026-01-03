import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import React from "react";
import useRequirePremium from "@/hooks/useRequirePremium";
import useAuth from "@/hooks/useAuth";

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

function TestComponent() {
  useRequirePremium();
  return null;
}

describe("useRequirePremium", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    replaceMock.mockClear();
  });

  it("does not redirect until premium tier is extracted", async () => {
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
