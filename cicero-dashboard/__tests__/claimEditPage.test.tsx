import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import EditUserPage from "@/app/claim/edit/page";
import {
  getClaimPendingContent,
  getClaimProfile,
  updateClaimProfile,
  validateClaimSocialProfile,
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

jest.mock("@/utils/api", () => ({
  isValidClaimToken: jest.requireActual("@/utils/api").isValidClaimToken,
  getClaimPendingContent: jest.fn(),
  getClaimProfile: jest.fn(),
  normalizeWhatsapp: jest.fn((value: string) => value),
  updateClaimProfile: jest.fn(),
  validateClaimSocialProfile: jest.fn(),
}));

describe("EditUserPage", () => {
  const pendingContent = {
    filters: { periode: "harian", tanggal: "2026-08-12" },
    instagram: {
      username_available: true,
      usernames: ["utama.ig"],
      pending_content: 1,
      items: [{
        shortcode: "IG123",
        video_id: null,
        caption: "Tugas Instagram",
        content_time: "2026-08-12T01:00:00.000Z",
        url: "https://www.instagram.com/p/IG123/",
      }],
    },
    tiktok: {
      username_available: true,
      usernames: ["utama.tt"],
      pending_content: 1,
      items: [{
        shortcode: null,
        video_id: "TT123",
        caption: "Tugas TikTok",
        content_time: "2026-08-12T02:00:00.000Z",
        url: "https://www.tiktok.com/@cicero/video/TT123",
      }],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    sessionStorage.setItem("claim_token", "header.payload.signature");
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
    (updateClaimProfile as jest.Mock).mockResolvedValue({ success: true });
    (getClaimPendingContent as jest.Mock).mockResolvedValue({
      success: true,
      data: pendingContent,
    });
    (validateClaimSocialProfile as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        found: true,
        profile_name: "Cicero Resmi",
        is_private: false,
        data_quality: {
          score: 80,
          label: "partial",
          explanation: "Kelengkapan data, bukan keaslian akun.",
        },
      },
    });
  });

  it("memuat dan menampilkan tugas pending content setelah autentikasi", async () => {
    render(<EditUserPage />);

    expect(await screen.findByText("Tugas Instagram")).toBeInTheDocument();
    expect(screen.getByText("Tugas TikTok")).toBeInTheDocument();
    expect(getClaimPendingContent).toHaveBeenCalledWith("header.payload.signature");
    const links = screen.getAllByRole("link", { name: /Buka Konten/ });
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://www.instagram.com/p/IG123/");
    expect(links[1]).toHaveAttribute("href", "https://www.tiktok.com/@cicero/video/TT123");
  });

  it("memuat ulang pending content ketika Refresh dipilih", async () => {
    render(<EditUserPage />);
    await screen.findByText("Tugas Instagram");

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() => expect(getClaimPendingContent).toHaveBeenCalledTimes(2));
  });

  it("menampilkan empty state untuk platform tanpa tugas", async () => {
    (getClaimPendingContent as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        ...pendingContent,
        instagram: { ...pendingContent.instagram, pending_content: 0, items: [] },
        tiktok: { ...pendingContent.tiktok, pending_content: 0, items: [] },
      },
    });
    render(<EditUserPage />);

    expect(await screen.findByText("Tidak ada konten tertunda untuk Instagram.")).toBeInTheDocument();
    expect(screen.getByText("Tidak ada konten tertunda untuk TikTok.")).toBeInTheDocument();
  });

  it("tetap menampilkan formulir profil saat pending content gagal dimuat", async () => {
    (getClaimPendingContent as jest.Mock).mockRejectedValueOnce(
      new Error("Layanan pending content terganggu"),
    );
    render(<EditUserPage />);

    expect(await screen.findByText(/Layanan pending content terganggu/)).toBeInTheDocument();
    expect(await screen.findByDisplayValue("12345")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Simpan" })).toBeEnabled();
  });

  it("merender saat loading lalu menampilkan NRP terverifikasi dari profil", async () => {
    render(<EditUserPage />);

    expect(screen.getByText("Memuat profil...")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("12345")).toBe(
      screen.getByLabelText("NRP"),
    );
    expect(screen.getByLabelText("NRP")).toHaveAttribute("readonly");
    expect(getClaimProfile).toHaveBeenCalledWith("header.payload.signature");
    expect(screen.getByRole("heading", { name: "Kualitas akun media sosial" })).toBeInTheDocument();
  });

  it.each(["[object Object]", "header.payload", "header..signature"])(
    "membersihkan sesi invalid dan redirect tanpa API terlindungi: %s",
    async (token) => {
      sessionStorage.setItem("claim_token", token);
      render(<EditUserPage />);

      await waitFor(() => expect(replace).toHaveBeenCalledWith("/claim"));
      expect(sessionStorage.getItem("claim_token")).toBeNull();
      expect(getClaimProfile).not.toHaveBeenCalled();
      expect(getClaimPendingContent).not.toHaveBeenCalled();
    },
  );

  it.each([401, 403])(
    "redirect ke halaman claim ketika pending content merespons %s",
    async (status) => {
      (getClaimPendingContent as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error("Sesi tidak valid"), { status }),
      );
      render(<EditUserPage />);

      await waitFor(() => expect(replace).toHaveBeenCalledWith("/claim"));
    },
  );

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
    expect(token).toBe("header.payload.signature");
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

  it("menampilkan status sukses dan DTO kualitas tanpa menyimpulkan keaslian", async () => {
    render(<EditUserPage />);
    await screen.findByDisplayValue("utama.ig");
    fireEvent.click(screen.getAllByRole("button", { name: "Periksa username" })[0]);

    expect(await screen.findByText("Profil ditemukan")).toBeInTheDocument();
    expect(screen.getByText(/Cicero Resmi/)).toBeInTheDocument();
    expect(screen.getByText(/Publik/)).toBeInTheDocument();
    expect(screen.getByText(/partial \(80\/100\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/bukan keaslian akun/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Perlu dilengkapi · 80/100")).toBeInTheDocument();
    expect(validateClaimSocialProfile).toHaveBeenCalledWith(
      { platform: "instagram", username: "utama.ig" },
      "header.payload.signature",
    );
  });

  it("menampilkan profil tidak ditemukan sebagai hasil non-blocking", async () => {
    (validateClaimSocialProfile as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error("Akun tidak ditemukan."), {
        errorCode: "CLAIM_SOCIAL_PROFILE_NOT_FOUND",
        status: 404,
      }),
    );
    render(<EditUserPage />);
    await screen.findByDisplayValue("utama.ig");
    fireEvent.click(screen.getAllByRole("button", { name: "Periksa username" })[0]);

    expect(await screen.findByText("Profil tidak ditemukan.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(updateClaimProfile).toHaveBeenCalled());
  });

  it("menampilkan indikator profil privat", async () => {
    (validateClaimSocialProfile as jest.Mock).mockResolvedValueOnce({
      success: true,
      data: {
        found: true,
        profile_name: "Profil Privat",
        is_private: true,
        data_quality: { score: 40, label: "limited" },
      },
    });
    render(<EditUserPage />);
    await screen.findByDisplayValue("utama.ig");
    fireEvent.click(screen.getAllByRole("button", { name: "Periksa username" })[0]);
    expect(await screen.findByText("Privat")).toBeInTheDocument();
  });

  it("mempertahankan nilai dan penyimpanan saat upstream unavailable", async () => {
    (validateClaimSocialProfile as jest.Mock).mockRejectedValueOnce(
      Object.assign(new Error("Layanan validasi profil sedang terganggu."), {
        errorCode: "CLAIM_SOCIAL_UPSTREAM_UNAVAILABLE",
        status: 502,
      }),
    );
    render(<EditUserPage />);
    await screen.findByDisplayValue("utama.ig");
    fireEvent.click(screen.getAllByRole("button", { name: "Periksa username" })[0]);

    expect(await screen.findByRole("alert")).toHaveTextContent(/coba lagi/i);
    expect(screen.getByLabelText("Username Instagram 1")).toHaveValue("utama.ig");
    fireEvent.click(screen.getByRole("button", { name: "Simpan" }));
    await waitFor(() => expect(updateClaimProfile).toHaveBeenCalled());
  });

  it("mereset hasil validasi ketika input berubah", async () => {
    render(<EditUserPage />);
    await screen.findByDisplayValue("utama.ig");
    fireEvent.click(screen.getAllByRole("button", { name: "Periksa username" })[0]);
    expect(await screen.findByText("Profil ditemukan")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Username Instagram 1"), {
      target: { value: "username.baru" },
    });
    expect(screen.queryByText("Profil ditemukan")).not.toBeInTheDocument();
  });
});
