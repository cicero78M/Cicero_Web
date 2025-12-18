import {
  getDashboardStats,
  getRekapAmplify,
  getRekapLikesIG,
  getRekapKomentarTiktok,
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
  );
  const call = (global.fetch as jest.Mock).mock.calls[0];
  expect(call[0]).toContain("/api/amplify/rekap");
  expect(call[0]).toContain("start_date=2024-02-01");
  expect(call[0]).toContain("end_date=2024-02-28");
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
  );
  const url = (global.fetch as jest.Mock).mock.calls[0][0];
  expect(url).toContain("/api/insta/rekap-likes");
  expect(url).toContain("tanggal_mulai=2023-12-01");
  expect(url).toContain("tanggal_selesai=2023-12-31");
});

test("getRekapKomentarTiktok supports date range params", async () => {
  await getRekapKomentarTiktok(
    "tok",
    "c1",
    "harian",
    undefined,
    "2024-03-01",
    "2024-03-31",
  );
  const url = (global.fetch as jest.Mock).mock.calls[0][0];
  expect(url).toContain("/api/tiktok/rekap-komentar");
  expect(url).toContain("start_date=2024-03-01");
  expect(url).toContain("end_date=2024-03-31");
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
