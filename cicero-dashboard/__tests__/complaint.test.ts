import { postComplaintInstagram, postComplaintTiktok } from "../utils/api";

const ORIGINAL_API_URL = process.env.NEXT_PUBLIC_API_URL;

beforeAll(() => {
  process.env.NEXT_PUBLIC_API_URL =
    process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";
});

afterAll(() => {
  process.env.NEXT_PUBLIC_API_URL = ORIGINAL_API_URL;
});

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      clone: () => ({
        json: () => Promise.resolve({ message: "Komplain berhasil dikirim" }),
      }),
      json: () => Promise.resolve({ message: "Komplain berhasil dikirim" }),
    })
  ) as any;
});

afterEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

describe("postComplaintInstagram", () => {
  test("sends correct payload with all required fields", async () => {
    await postComplaintInstagram("token123", {
      nrp: "75020201",
      user_id: "75020201",
      client_id: "POLDA_JABAR",
      username: "user_instagram",
      issue: "Sudah melaksanakan Instagram belum terdata.",
    });

    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(call[0]).toContain("/api/dashboard/komplain/insta");
    expect(call[1].method).toBe("POST");
    expect(call[1].headers.Authorization).toBe("Bearer token123");
    expect(call[1].headers["Content-Type"]).toBe("application/json");
    expect(call[1].credentials).toBe("include");

    const body = JSON.parse(call[1].body);
    expect(body.nrp).toBe("75020201");
    expect(body.client_id).toBe("POLDA_JABAR");
    expect(body.username_ig).toBe("user_instagram");
    expect(body.instagram).toBe("user_instagram");
    expect(body.issue).toBe("Sudah melaksanakan Instagram belum terdata.");
  });

  test("sends minimal payload with only nrp", async () => {
    await postComplaintInstagram("token123", {
      nrp: "75020201",
    });

    const call = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.nrp).toBe("75020201");
    expect(body.client_id).toBeUndefined();
    expect(body.username_ig).toBeUndefined();
  });

  test("handles 403 error with helpful message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      clone: () => ({
        json: () => Promise.resolve({ }),
      }),
      json: () => Promise.resolve({ }),
      text: () => Promise.resolve(""),
    });

    await expect(
      postComplaintInstagram("token123", { nrp: "75020201" })
    ).rejects.toThrow(
      "Akses ditolak. Periksa: (1) Apakah akun dashboard Anda sudah di-approve? (2) Apakah token masih valid?"
    );
  });

  test("returns success message from backend", async () => {
    const result = await postComplaintInstagram("token123", {
      nrp: "75020201",
    });

    expect(result.message).toBe("Komplain berhasil dikirim");
    expect(result.success).toBe(true);
  });
});

describe("postComplaintTiktok", () => {
  test("sends correct payload with all required fields", async () => {
    await postComplaintTiktok("token456", {
      nrp: "75020202",
      user_id: "75020202",
      client_id: "POLDA_JATIM",
      username: "user_tiktok",
      issue: "Sudah komentar TikTok belum terdata.",
    });

    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(call[0]).toContain("/api/dashboard/komplain/tiktok");
    expect(call[1].method).toBe("POST");
    expect(call[1].headers.Authorization).toBe("Bearer token456");
    expect(call[1].headers["Content-Type"]).toBe("application/json");
    expect(call[1].credentials).toBe("include");

    const body = JSON.parse(call[1].body);
    expect(body.nrp).toBe("75020202");
    expect(body.client_id).toBe("POLDA_JATIM");
    expect(body.username_tiktok).toBe("user_tiktok");
    expect(body.tiktok).toBe("user_tiktok");
    expect(body.issue).toBe("Sudah komentar TikTok belum terdata.");
  });

  test("sends minimal payload with only nrp", async () => {
    await postComplaintTiktok("token456", {
      nrp: "75020202",
    });

    const call = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.nrp).toBe("75020202");
    expect(body.client_id).toBeUndefined();
    expect(body.username_tiktok).toBeUndefined();
  });

  test("handles 403 error with helpful message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      clone: () => ({
        json: () => Promise.resolve({ }),
      }),
      json: () => Promise.resolve({ }),
      text: () => Promise.resolve(""),
    });

    await expect(
      postComplaintTiktok("token456", { nrp: "75020202" })
    ).rejects.toThrow(
      "Akses ditolak. Periksa: (1) Apakah akun dashboard Anda sudah di-approve? (2) Apakah token masih valid?"
    );
  });

  test("returns success message from backend", async () => {
    const result = await postComplaintTiktok("token456", {
      nrp: "75020202",
    });

    expect(result.message).toBe("Komplain berhasil dikirim");
    expect(result.success).toBe(true);
  });
});

describe("Complaint payload flexibility", () => {
  test("handles various field name variations for Instagram", async () => {
    await postComplaintInstagram("token", {
      nrp_nip: "12345",
      instagram: "insta_user",
      clientID: "CLIENT1",
      kendala: "Testing issue",
      nama: "John Doe",
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.nrp).toBe("12345");
    expect(body.username_ig).toBe("insta_user");
    expect(body.instagram).toBe("insta_user");
    expect(body.client_id).toBe("CLIENT1");
    expect(body.issue).toBe("Testing issue");
    expect(body.nama).toBe("John Doe");
  });

  test("handles various field name variations for TikTok", async () => {
    await postComplaintTiktok("token", {
      nrpNip: "54321",
      tiktok: "tiktok_user",
      clientId: "CLIENT2",
      message: "Another test issue",
      name: "Jane Doe",
    });

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.nrp).toBe("54321");
    expect(body.username_tiktok).toBe("tiktok_user");
    expect(body.tiktok).toBe("tiktok_user");
    expect(body.client_id).toBe("CLIENT2");
    expect(body.issue).toBe("Another test issue");
    expect(body.nama).toBe("Jane Doe");
  });
});
