import "@testing-library/jest-dom";
import { render, waitFor } from "@testing-library/react";
import React from "react";
import useAuthRedirect from "@/hooks/useAuthRedirect";
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

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
type AuthRedirectState = ReturnType<typeof useAuth>;

function TestComponent() {
  useAuthRedirect();
  return null;
}

describe("useAuthRedirect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it("does not redirect while auth state is hydrating", async () => {
    mockedUseAuth.mockReturnValue({
      token: "token",
      isHydrating: true,
    } as AuthRedirectState);

    render(<TestComponent />);

    await waitFor(() => expect(replaceMock).not.toHaveBeenCalled());
  });

  it("redirects authenticated users to the stored protected route", async () => {
    localStorage.setItem("last_pathname", "/users");
    mockedUseAuth.mockReturnValue({
      token: "token",
      isHydrating: false,
    } as AuthRedirectState);

    render(<TestComponent />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/users"));
  });

  it("falls back to dashboard when no stored path is available", async () => {
    mockedUseAuth.mockReturnValue({
      token: "token",
      isHydrating: false,
    } as AuthRedirectState);

    render(<TestComponent />);

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
  });

  it.each(["/", "/login", "/login-update/reset", "/claim", "/reposter/login"])(
    "ignores stored public path %s and falls back to dashboard",
    async (storedPath) => {
      localStorage.setItem("last_pathname", storedPath);
      mockedUseAuth.mockReturnValue({
        token: "token",
        isHydrating: false,
      } as AuthRedirectState);

      render(<TestComponent />);

      await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/dashboard"));
    },
  );
});
