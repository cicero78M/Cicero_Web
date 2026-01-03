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

function StatusConsumer({ onStatus }: { onStatus: (status: ReturnType<typeof useRequirePremium>) => void }) {
  const status = useRequirePremium();
  onStatus(status);
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

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/premium/anev"));
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

  it.each(["premium_1", "premium_2", "premium_3"])(
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

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/premium/anev"));
  });

  it("returns premium status when allowed and ready", async () => {
    const spy = jest.fn();
    mockedUseAuth.mockReturnValue({
      isHydrating: false,
      isProfileLoading: false,
      premiumTier: "premium_1",
      premiumTierReady: true,
      hasResolvedPremium: true,
      premiumResolutionError: false,
    } as any);

    render(<StatusConsumer onStatus={spy} />);

    await waitFor(() => expect(spy).toHaveBeenCalledWith("premium"));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("returns loading while waiting for tier readiness", async () => {
    const spy = jest.fn();
    mockedUseAuth.mockReturnValue({
      isHydrating: false,
      isProfileLoading: true,
      premiumTier: null,
      premiumTierReady: false,
      hasResolvedPremium: false,
      premiumResolutionError: false,
    } as any);

    render(<StatusConsumer onStatus={spy} />);

    await waitFor(() => expect(spy).toHaveBeenCalledWith("loading"));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("returns error and avoids redirect when premium resolution fails", async () => {
    const spy = jest.fn();
    mockedUseAuth.mockReturnValue({
      isHydrating: false,
      isProfileLoading: false,
      premiumTier: null,
      premiumTierReady: false,
      hasResolvedPremium: true,
      premiumResolutionError: true,
    } as any);

    render(<StatusConsumer onStatus={spy} />);

    await waitFor(() => expect(spy).toHaveBeenCalledWith("error"));
    await waitFor(() => expect(mockedShowToast).toHaveBeenCalledTimes(1));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("returns standard and triggers redirect when tier is not allowed", async () => {
    const spy = jest.fn();
    mockedUseAuth.mockReturnValue({
      isHydrating: false,
      isProfileLoading: false,
      premiumTier: "basic",
      premiumTierReady: true,
      hasResolvedPremium: true,
      premiumResolutionError: false,
    } as any);

    render(<StatusConsumer onStatus={spy} />);

    await waitFor(() => expect(spy).toHaveBeenCalledWith("standard"));
    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/premium/anev"));
  });

  it("allows disabling redirect for standard tier via option", async () => {
    const spy = jest.fn();
    mockedUseAuth.mockReturnValue({
      isHydrating: false,
      isProfileLoading: false,
      premiumTier: "basic",
      premiumTierReady: true,
      hasResolvedPremium: true,
      premiumResolutionError: false,
    } as any);

    function Consumer() {
      const status = useRequirePremium({ redirectOnStandard: false });
      spy(status);
      return null;
    }

    render(<Consumer />);

    await waitFor(() => expect(spy).toHaveBeenCalledWith("standard"));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("keeps standard users in place until guard finishes evaluating", async () => {
    const spy = jest.fn();
    mockedUseAuth.mockReturnValue({
      isHydrating: true,
      isProfileLoading: true,
      premiumTier: "basic",
      premiumTierReady: false,
      hasResolvedPremium: false,
      premiumResolutionError: false,
    } as any);

    render(<StatusConsumer onStatus={spy} />);

    await waitFor(() => expect(spy).toHaveBeenCalledWith("loading"));
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
