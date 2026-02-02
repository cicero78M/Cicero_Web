import {
  getDashboardStats,
  getRekapAmplify,
  getRekapAmplifyKhusus,
  getRekapLikesIG,
  getRekapKomentarTiktok,
  getTiktokPosts,
  getUserDirectory,
  updateUserViaClaim,
} from "../utils/api";

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
    Promise.resolve({ ok: true, json: () => Promise.resolve({ data: {} }) })
  ) as any;
});

afterEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

test("getDashboardStats supports date range params", async () => {
  await getDashboardStats("token123", undefined, undefined, "2024-01-01", "2024-01-31");
  const call = (global.fetch as jest.Mock).mock.calls[0];
  expect(call[0]).toContain("/api/dashboard/stats");
  expect(call[0]).toContain("tanggal_mulai=2024-01-01");
  expect(call[0]).toContain("tanggal_selesai=2024-01-31");
  expect(call[1].headers.Authorization).toBe("Bearer token123");
});

test("getRekapAmplify supports date range params", async () => {
  await getRekapAmplify(
    "tok",
    "c1",
    "harian",
    undefined,
    "2024-02-01",
    "2024-02-28",
    { role: "operator", scope: "ORG", regional_id: "R-01" },
  );
  const call = (global.fetch as jest.Mock).mock.calls[0];
  expect(call[0]).toContain("/api/amplify/rekap");
  expect(call[0]).toContain("tanggal_mulai=2024-02-01");
  expect(call[0]).toContain("tanggal_selesai=2024-02-28");
  expect(call[0]).toContain("role=operator");
  expect(call[0]).toContain("scope=ORG");
  expect(call[0]).toContain("regional_id=R-01");
  expect(call[1].headers.Authorization).toBe("Bearer tok");
});

test("getRekapLikesIG supports date range params", async () => {
  await getRekapLikesIG(
    "tok",
    "c1",
    "harian",
    undefined,
    "2023-12-01",
    "2023-12-31",
    undefined,
    { role: "operator", scope: "ORG", regional_id: "R-02" },
  );
  const url = (global.fetch as jest.Mock).mock.calls[0][0];
  expect(url).toContain("/api/insta/rekap-likes");
  expect(url).toContain("tanggal_mulai=2023-12-01");
  expect(url).toContain("tanggal_selesai=2023-12-31");
  expect(url).toContain("role=operator");
  expect(url).toContain("scope=ORG");
  expect(url).toContain("regional_id=R-02");
});

test("getRekapKomentarTiktok supports date range params", async () => {
  await getRekapKomentarTiktok(
    "tok",
    "c1",
    "harian",
    undefined,
    "2024-03-01",
    "2024-03-31",
    undefined,
    { role: "operator", scope: "ORG", regional_id: "R-99" },
  );
  const url = (global.fetch as jest.Mock).mock.calls[0][0];
  expect(url).toContain("/api/tiktok/rekap-komentar");
  expect(url).toContain("tanggal_mulai=2024-03-01");
  expect(url).toContain("tanggal_selesai=2024-03-31");
  expect(url).toContain("start_date=2024-03-01");
  expect(url).toContain("end_date=2024-03-31");
  expect(url).toContain("role=operator");
  expect(url).toContain("scope=ORG");
  expect(url).toContain("regional_id=R-99");
});

test("getUserDirectory passes regional_id when provided", async () => {
  await getUserDirectory("tok", "DITBINMAS", {
    role: "operator",
    scope: "ORG",
    regional_id: "R-11",
  });
  const url = (global.fetch as jest.Mock).mock.calls[0][0];
  expect(url).toContain("/api/users/list");
  expect(url).toContain("client_id=DITBINMAS");
  expect(url).toContain("role=operator");
  expect(url).toContain("scope=ORG");
  expect(url).toContain("regional_id=R-11");
});

test("getTiktokPosts forwards scope and regional_id", async () => {
  await getTiktokPosts("tok", "DITBINMAS", {
    startDate: "2025-10-01",
    endDate: "2025-10-31",
    scope: "ORG",
    role: "operator",
    regional_id: "R-88",
  });
  const url = (global.fetch as jest.Mock).mock.calls[0][0];
  expect(url).toContain("/api/tiktok/posts");
  expect(url).toContain("start_date=2025-10-01");
  expect(url).toContain("end_date=2025-10-31");
  expect(url).toContain("scope=ORG");
  expect(url).toContain("role=operator");
  expect(url).toContain("regional_id=R-88");
});

test("getDashboardStats normalizes fields", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: () =>
      Promise.resolve({
        data: { clientId: "c1", instagram_posts: [1, 2, 3] },
      }),
  });
  const result = await getDashboardStats("tok");
  expect(result.client_id).toBe("c1");
  expect(result.instagramPosts).toBe(3);
});

test("getDashboardStats handles partial date range params", async () => {
  await getDashboardStats("tok", undefined, undefined, "2024-06-01");
  let url = (global.fetch as jest.Mock).mock.calls[0][0];
  expect(url).toContain("tanggal_mulai=2024-06-01");
  expect(url).not.toContain("tanggal_selesai");

  (global.fetch as jest.Mock).mockClear();

  await getDashboardStats("tok", undefined, undefined, undefined, "2024-06-30");
  url = (global.fetch as jest.Mock).mock.calls[0][0];
  expect(url).toContain("tanggal_selesai=2024-06-30");
  expect(url).not.toContain("tanggal_mulai");
});

test("getDashboardStats includes client_id when provided", async () => {
  await getDashboardStats("tok", undefined, undefined, undefined, undefined, "DITBINMAS");
  const url = (global.fetch as jest.Mock).mock.calls[0][0];
  expect(url).toContain("/api/dashboard/stats");
  expect(url).toContain("client_id=DITBINMAS");
});

test("getDashboardStats includes role, scope, and regional_id when provided", async () => {
  await getDashboardStats(
    "tok",
    "harian",
    "2025-12-23",
    undefined,
    undefined,
    "DITBINMAS",
    { role: "ditbinmas", scope: "ORG", regional_id: "R-12" },
  );
  const url = (global.fetch as jest.Mock).mock.calls[0][0];
  expect(url).toContain("/api/dashboard/stats");
  expect(url).toContain("periode=harian");
  expect(url).toContain("tanggal=2025-12-23");
  expect(url).toContain("client_id=DITBINMAS");
  expect(url).toContain("role=ditbinmas");
  expect(url).toContain("scope=ORG");
  expect(url).toContain("regional_id=R-12");
});

test("updateUserViaClaim throws backend validation messages", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve({ message: "Link Instagram tidak valid" }),
  });

  await expect(
    updateUserViaClaim({ nrp: "1", email: "user@example.com", insta: "bad" }),
  ).rejects.toThrow("Link Instagram tidak valid");
});

test("getRekapAmplify handles 403 errors with backend message", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 403,
    clone: function() {
      return {
        json: () => Promise.resolve({ message: "Anda tidak memiliki akses ke data ini" }),
        text: () => Promise.resolve("Anda tidak memiliki akses ke data ini")
      };
    },
    json: () => Promise.resolve({ message: "Anda tidak memiliki akses ke data ini" }),
    text: () => Promise.resolve("Anda tidak memiliki akses ke data ini"),
  });

  await expect(
    getRekapAmplify("tok", "c1", "harian"),
  ).rejects.toThrow("Anda tidak memiliki akses ke data ini");
});

test("getRekapAmplify handles 403 errors with fallback message", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 403,
    clone: function() {
      return {
        json: () => Promise.resolve({}),
        text: () => Promise.resolve("")
      };
    },
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  });

  await expect(
    getRekapAmplify("tok", "c1", "harian"),
  ).rejects.toThrow("Akses ditolak. Periksa: (1) Apakah akun dashboard Anda sudah di-approve? (2) Apakah token masih valid?");
});

test("getRekapAmplifyKhusus handles 403 errors with backend message", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 403,
    clone: function() {
      return {
        json: () => Promise.resolve({ message: "Anda tidak memiliki akses ke data ini" }),
        text: () => Promise.resolve("Anda tidak memiliki akses ke data ini")
      };
    },
    json: () => Promise.resolve({ message: "Anda tidak memiliki akses ke data ini" }),
    text: () => Promise.resolve("Anda tidak memiliki akses ke data ini"),
  });

  await expect(
    getRekapAmplifyKhusus("tok", "c1", "harian"),
  ).rejects.toThrow("Anda tidak memiliki akses ke data ini");
});

test("getRekapAmplifyKhusus handles 403 errors with fallback message", async () => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    status: 403,
    clone: function() {
      return {
        json: () => Promise.resolve({}),
        text: () => Promise.resolve("")
      };
    },
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
  });

  await expect(
    getRekapAmplifyKhusus("tok", "c1", "harian"),
  ).rejects.toThrow("Akses ditolak. Periksa: (1) Apakah akun dashboard Anda sudah di-approve? (2) Apakah token masih valid?");
});
