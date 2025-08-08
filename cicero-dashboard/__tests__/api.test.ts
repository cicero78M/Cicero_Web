import {
  getDashboardStats,
  getRekapAmplify,
  getRekapLikesIG,
  getRekapKomentarTiktok,
} from "../utils/api";

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ data: 1 }) })
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
  expect(call[0]).toContain("tanggal_mulai=2024-02-01");
  expect(call[0]).toContain("tanggal_selesai=2024-02-28");
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
  expect(url).toContain("tanggal_mulai=2024-03-01");
  expect(url).toContain("tanggal_selesai=2024-03-31");
});

