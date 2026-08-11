import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditUserPage from "@/app/claim/edit/page";
import {
  getClaimPendingContent,
  getClaimProfile,
  updateClaimProfile,
} from "@/utils/api";

const replace = jest.fn();
const mockRouter = { replace };

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
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
    jest.clearAllMocks();
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
        insta: "alias_instagram",
        tiktok: "@alias_tiktok",
        instagram_accounts: ["utama.ig", "kedua_ig"],
        tiktok_accounts: ["@utama.tt", "@kedua_tt"],
      },
    });
    (getClaimPendingContent as jest.Mock).mockResolvedValue({ data: null });
    (updateClaimProfile as jest.Mock).mockResolvedValue({ success: true });
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

  it("memuat seluruh array kanonis dan tidak memakai alias", async () => {
    render(<EditUserPage />);

    expect(await screen.findByDisplayValue("utama.ig")).toBeInTheDocument();
    expect(screen.getByDisplayValue("kedua_ig")).toBeInTheDocument();
    expect(screen.getByDisplayValue("@utama.tt")).toBeInTheDocument();
    expect(screen.getByDisplayValue("@kedua_tt")).toBeInTheDocument();
    expect(
      screen.queryByDisplayValue("alias_instagram"),
    ).not.toBeInTheDocument();
  });

  it("memakai alias utama hanya ketika array tidak tersedia", async () => {
    (getClaimProfile as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        user_id: "12345",
        nama: "Pengguna Claim",
        email: "claim@example.com",
        whatsapp: "628123456789",
        insta: "fallback_ig",
        tiktok: "fallback_tt",
      },
    });
    render(<EditUserPage />);

    expect(await screen.findByDisplayValue("fallback_ig")).toBeInTheDocument();
    expect(screen.getByDisplayValue("@fallback_tt")).toBeInTheDocument();
  });

  it("menambah dan menghapus baris tetapi mempertahankan satu baris", async () => {
    render(<EditUserPage />);
    await screen.findByDisplayValue("utama.ig");

    fireEvent.click(
      screen.getByRole("button", { name: "Tambah akun Instagram" }),
    );
    expect(screen.getByLabelText("Username Instagram 3")).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Hapus akun Instagram 3" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Hapus akun Instagram 2" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Hapus akun Instagram 1" }),
    );
    expect(screen.getByLabelText("Username Instagram 1")).toHaveValue("");
  });

  it("menormalisasi input dan hanya mengirim payload array", async () => {
    render(<EditUserPage />);
    await screen.findByDisplayValue("utama.ig");
    fireEvent.change(screen.getByLabelText("Username Instagram 1"), {
      target: { value: "https://instagram.com/Polri/" },
    });
    fireEvent.change(screen.getByLabelText("Username TikTok 1"), {
      target: { value: "humas_polri" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    await waitFor(() => expect(updateClaimProfile).toHaveBeenCalled());
    const [payload, token] = (updateClaimProfile as jest.Mock).mock.calls[0];
    expect(token).toBe("claim-jwt");
    expect(payload.instagram_accounts).toEqual(["Polri", "kedua_ig"]);
    expect(payload.tiktok_accounts).toEqual(["@humas_polri", "@kedua_tt"]);
    expect(payload).not.toHaveProperty("insta");
    expect(payload).not.toHaveProperty("tiktok");
    expect(
      Object.keys(payload).some(
        (key) => key.includes("secondary") || key.endsWith("_2"),
      ),
    ).toBe(false);
  });

  it("menolak duplikasi setelah normalisasi case-insensitive", async () => {
    render(<EditUserPage />);
    await screen.findByDisplayValue("utama.ig");
    fireEvent.change(screen.getByLabelText("Username Instagram 2"), {
      target: { value: "@UTAMA.IG" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));

    expect(
      await screen.findByText(/Instagram terduplikasi/),
    ).toBeInTheDocument();
    expect(updateClaimProfile).not.toHaveBeenCalled();
  });
});
