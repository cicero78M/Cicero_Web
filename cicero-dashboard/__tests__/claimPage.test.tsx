import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ClaimPage from "@/app/claim/page";
import { loginClaimUser } from "@/utils/api";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: jest.fn() }),
}));

jest.mock("@/utils/api", () => ({
  isValidClaimToken: jest.requireActual("@/utils/api").isValidClaimToken,
  loginClaimUser: jest.fn(),
  registerClaimCredential: jest.fn(),
  requestClaimPasswordResetOtp: jest.fn(),
  verifyClaimPasswordResetOtp: jest.fn(),
  confirmClaimPasswordReset: jest.fn(),
}));

describe("ClaimPage session", () => {
  beforeEach(() => {
    sessionStorage.clear();
    push.mockClear();
    (loginClaimUser as jest.Mock).mockResolvedValue({
      success: true,
      token: "header.payload.signature",
    });
  });

  it("tidak menyimpan password claim ke sessionStorage setelah login", async () => {
    render(<ClaimPage />);

    fireEvent.change(screen.getByLabelText("NRP"), { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login & lanjutkan/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/claim/edit"));
    expect(sessionStorage.getItem("claim_password")).toBeNull();
    expect(sessionStorage.getItem("claim_nrp")).toBeNull();
    expect(sessionStorage.getItem("claim_token")).toBe("header.payload.signature");
  });

  it.each([
    ["missing", undefined],
    ["object", { access: "header.payload.signature" }],
    ["stringified object", "[object Object]"],
    ["invalid segments", "header.payload"],
  ])("tetap di login dan membersihkan sesi untuk token %s", async (_label, token) => {
    sessionStorage.setItem("claim_token", "old.invalid");
    (loginClaimUser as jest.Mock).mockResolvedValueOnce({ success: true, token });
    render(<ClaimPage />);

    fireEvent.change(screen.getByLabelText("NRP"), { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.click(screen.getByRole("button", { name: /login & lanjutkan/i }));

    expect(await screen.findByText(/token sesi tidak valid/i)).toBeInTheDocument();
    expect(sessionStorage.getItem("claim_token")).toBeNull();
    expect(push).not.toHaveBeenCalled();
  });
});
