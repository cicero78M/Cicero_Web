import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ClaimPage from "@/app/claim/page";
import { confirmClaimPasswordReset, confirmClaimRecoveryEmail, loginClaimUser } from "@/utils/api";

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
  confirmClaimRecoveryEmail: jest.fn(),
  confirmClaimPasswordReset: jest.fn(),
}));

describe("ClaimPage session", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/claim");
    push.mockClear();
    (loginClaimUser as jest.Mock).mockResolvedValue({
      success: true,
      token: "header.payload.signature",
    });
  });

  it("mengonfirmasi email baru dari link sebelum menampilkan form password", async () => {
    window.history.replaceState(
      {},
      "",
      "/claim?email_confirmation_token=email-link-token",
    );
    (confirmClaimRecoveryEmail as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        reset_token: "reset-token",
        message: "Email baru berhasil dikonfirmasi. Silakan buat password baru.",
      },
    });

    render(<ClaimPage />);

    await waitFor(() =>
      expect(confirmClaimRecoveryEmail).toHaveBeenCalledWith({
        token: "email-link-token",
      }),
    );
    expect(
      await screen.findByText(/email baru berhasil dikonfirmasi/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /simpan password baru/i }),
    ).toBeInTheDocument();
    expect(window.location.search).not.toContain("email_confirmation_token");
  });



  it("menormalkan password reset (trim spasi tepi) sebelum submit", async () => {
    window.history.replaceState({}, "", "/claim?token=reset-token");
    (confirmClaimPasswordReset as jest.Mock).mockResolvedValueOnce({ success: true });

    render(<ClaimPage />);

    fireEvent.change(
      screen.getByPlaceholderText(/^Password baru/i),
      { target: { value: "  Password1!  " } },
    );
    fireEvent.change(
      screen.getByPlaceholderText(/ulangi password baru/i),
      { target: { value: "  Password1!  " } },
    );
    fireEvent.click(screen.getByRole("button", { name: /simpan password baru/i }));

    await waitFor(() =>
      expect(confirmClaimPasswordReset).toHaveBeenCalledWith({
        token: "reset-token",
        password: "Password1!",
        confirmPassword: "Password1!",
      }),
    );
  });
  it("tidak menyimpan kredensial claim ke sessionStorage setelah login", async () => {
    render(<ClaimPage />);

    fireEvent.change(screen.getByLabelText("NRP"), { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Password1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login & lanjutkan/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/claim/edit"));
    expect(sessionStorage.getItem("claim_password")).toBeNull();
    expect(sessionStorage.getItem("claim_nrp")).toBeNull();
    expect(sessionStorage.getItem("claim_token")).toBeNull();
  });

  it.each([
    ["missing", undefined],
    ["object", { access: "header.payload.signature" }],
    ["stringified object", "[object Object]"],
    ["invalid segments", "header.payload"],
  ])("mengandalkan cookie HttpOnly dan tidak menyimpan token %s", async (_label, token) => {
    sessionStorage.setItem("claim_token", "old.invalid");
    (loginClaimUser as jest.Mock).mockResolvedValueOnce({ success: true, token });
    render(<ClaimPage />);

    fireEvent.change(screen.getByLabelText("NRP"), { target: { value: "12345" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "Password1!" } });
    fireEvent.click(screen.getByRole("button", { name: /login & lanjutkan/i }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/claim/edit"));
    expect(sessionStorage.getItem("claim_token")).toBeNull();
  });
});
