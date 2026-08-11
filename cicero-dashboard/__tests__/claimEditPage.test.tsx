import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import EditUserPage from "@/app/claim/edit/page";
import { getClaimPendingContent, getClaimProfile } from "@/utils/api";

const replace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

jest.mock("@/components/claim/ClaimLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/claim/PendingContentCard", () => ({
  __esModule: true,
  default: () => <div data-testid="pending-content" />,
}));

jest.mock("@/utils/api", () => ({
  getClaimPendingContent: jest.fn(),
  getClaimProfile: jest.fn(),
  normalizeWhatsapp: jest.fn((value: string) => value),
  updateClaimProfile: jest.fn(),
}));

describe("EditUserPage", () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem("claim_token", "claim-jwt");
    replace.mockClear();
    (getClaimProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        user_id: "12345",
        nama: "Pengguna Claim",
        email: "claim@example.com",
        whatsapp: "628123456789",
      },
    });
    (getClaimPendingContent as jest.Mock).mockResolvedValue({ data: null });
  });

  it("merender saat loading lalu menampilkan NRP terverifikasi dari profil", async () => {
    render(<EditUserPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Memuat profil...");
    expect(await screen.findByDisplayValue("12345")).toBe(
      screen.getByLabelText("NRP"),
    );
    expect(screen.getByLabelText("NRP")).toHaveAttribute("readonly");
    expect(getClaimProfile).toHaveBeenCalledWith("claim-jwt");
    expect(getClaimPendingContent).toHaveBeenCalledWith("claim-jwt");
  });
});
