import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import PendingContentCard from "@/components/claim/PendingContentCard";
import type { ClaimPendingContentResponse } from "@/utils/api";

const triageClaimComplaint = jest.fn();
const escalateClaimComplaint = jest.fn();
jest.mock("@/utils/api", () => ({
  ...jest.requireActual("@/utils/api"),
  triageClaimComplaint: (...args: unknown[]) => triageClaimComplaint(...args),
  escalateClaimComplaint: (...args: unknown[]) => escalateClaimComplaint(...args),
}));

const platform = (overrides = {}) => ({
  username_available: true,
  usernames: ["cicero"],
  total_content: 0,
  completed_content: 0,
  pending_content: 0,
  items: [],
  completed_ids: [],
  ...overrides,
});

const responseData = (overrides = {}): ClaimPendingContentResponse["data"] => ({
  user_id: "123",
  timezone: "Asia/Jakarta",
  filters: { periode: "harian", tanggal: null, start_date: null, end_date: null },
  instagram: platform(),
  tiktok: platform(),
  ...overrides,
});

describe("PendingContentCard", () => {
  beforeEach(() => jest.clearAllMocks());
  it("menampilkan state response kosong per platform", () => {
    render(<PendingContentCard data={responseData()} loading={false} error="" onRefresh={jest.fn()} />);
    expect(screen.getByText("Tidak ada konten tertunda untuk Instagram.")).toBeTruthy();
    expect(screen.getByText("Tidak ada konten tertunda untuk TikTok.")).toBeTruthy();
  });

  it("merangkum dan mengelompokkan konten multi-platform berdasarkan aksi", () => {
    render(
      <PendingContentCard
        loading={false}
        error=""
        onRefresh={jest.fn()}
        data={responseData({
          instagram: platform({ pending_content: 1, items: [{ shortcode: "IG1", url: "https://www.instagram.com/p/IG1", caption: "Konten Instagram", content_time: "2026-08-07T01:00:00.000Z" }] }),
          tiktok: platform({ pending_content: 1, items: [{ video_id: "TT1", url: "https://www.tiktok.com/@cicero/video/1", caption: "Konten TikTok", content_time: "2026-08-07T02:00:00.000Z" }] }),
        })}
      />,
    );
    expect(screen.getByLabelText("Instagram - Like")).toBeTruthy();
    expect(screen.getByLabelText("TikTok - Comment")).toBeTruthy();
    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(screen.getByText("Konten Instagram")).toBeTruthy();
    expect(screen.getByText("Konten TikTok")).toBeTruthy();
  });

  it("tidak menampilkan tombol konten ketika URL null", () => {
    render(<PendingContentCard loading={false} error="" onRefresh={jest.fn()} data={responseData({ tiktok: platform({ pending_content: 1, items: [{ video_id: "TT1", url: null, caption: "Tanpa URL", content_time: null }] }) })} />);
    expect(screen.queryByRole("link", { name: /Buka Konten/ })).toBeNull();
    expect(screen.getByText("Tanggal tidak tersedia")).toBeTruthy();
  });

  it("menampilkan state username platform belum tersedia", () => {
    render(<PendingContentCard loading={false} error="" onRefresh={jest.fn()} data={responseData({ instagram: platform({ username_available: false, usernames: [] }) })} />);
    expect(screen.getByText(/Username Instagram belum terdaftar/)).toBeTruthy();
  });

  it("menampilkan error API dan refresh manual", () => {
    const onRefresh = jest.fn();
    render(<PendingContentCard data={null} loading={false} error="Sesi berakhir" onRefresh={onRefresh} />);
    expect(screen.getByRole("alert").textContent).toContain("Gagal memuat konten tertunda: Sesi berakhir");
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("hanya membuka URL HTTPS pada host platform yang tepercaya", () => {
    const maliciousItems = [
      { shortcode: "A", url: "javascript:alert(1)", caption: "JS", content_time: null },
      { shortcode: "B", url: "https://evil.example/phishing", caption: "Host lain", content_time: null },
      { shortcode: "C", url: "https://www.instagram.com/p/C", caption: "Aman", content_time: null },
    ];
    render(<PendingContentCard loading={false} error="" onRefresh={jest.fn()} data={responseData({ instagram: platform({ pending_content: 3, items: maliciousItems }) })} />);
    const links = screen.getAllByRole("link", { name: /Buka Konten/ });
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute("href")).toBe("https://www.instagram.com/p/C");
    expect(links[0].getAttribute("target")).toBe("_blank");
    expect(links[0].getAttribute("rel")).toBe("noopener noreferrer");
  });

  it.each([
    ["instagram", "IG1", "shortcode", "Instagram"],
    ["tiktok", "TT1", "video_id", "TikTok"],
  ] as const)("mengirim triase item %s dengan token dan identifier platform", async (platformName, id, identifierField, label) => {
    triageClaimComplaint.mockResolvedValue({
      platform: platformName, content_id: id, triage_code: "ENGAGEMENT_NOT_IN_SNAPSHOT", triage_quality: "medium",
      title: "Aktivitas belum terlihat", summary: "Bukti belum ditemukan.", evidence: [{ label: "Username tersimpan", value: "cicero", status: "tersedia" }],
      solutions: [{ order: 1, label: "Periksa kembali konten." }], last_collected_at: null, can_retry: true, retry_after: null, can_escalate: true,
    });
    const item = platformName === "instagram" ? { shortcode: id } : { video_id: id };
    render(<PendingContentCard claimToken="claim-jwt" loading={false} error="" onRefresh={jest.fn()} data={responseData({ [platformName]: platform({ pending_content: 1, items: [{ ...item, url: null, caption: `Konten ${label}`, content_time: null }] }) })} />);
    fireEvent.click(screen.getByRole("button", { name: "Komplain" }));
    expect(screen.getByText(label, { selector: "dd" })).toBeTruthy();
    expect(screen.getByText("@cicero")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Perkiraan waktu pelaksanaan"), { target: { value: "2026-08-09T10:30" } });
    fireEvent.click(screen.getByRole("button", { name: "Kirim Komplain" }));
    await waitFor(() => expect(triageClaimComplaint).toHaveBeenCalled());
    expect(triageClaimComplaint).toHaveBeenCalledWith("claim-jwt", expect.objectContaining({ platform: platformName, issue_type: "activity_not_recorded", [identifierField]: id }));
    expect(screen.getByText("Aktivitas belum terlihat")).toBeTruthy();
    expect(screen.getByText("Kualitas triase: medium")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Periksa ulang" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Eskalasi" })).toBeTruthy();
  });

  it("tidak menyediakan Komplain saat akun belum terisi", () => {
    render(<PendingContentCard claimToken="claim-jwt" loading={false} error="" onRefresh={jest.fn()} data={responseData({ instagram: platform({ username_available: false, usernames: [], pending_content: 1, items: [{ shortcode: "IG1" }] }) })} />);
    expect(screen.queryByRole("button", { name: "Komplain" })).toBeNull();
  });

  it("refresh sinkronisasi setelah backend menyatakan aktivitas sudah tercatat", async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined);
    triageClaimComplaint.mockResolvedValue({
      platform: "instagram", content_id: "IG1", triage_code: "ACTIVITY_ALREADY_RECORDED", triage_quality: "high",
      title: "Aktivitas sudah tercatat", summary: "Muat ulang untuk hasil terbaru.", evidence: [], solutions: [{ order: 1, label: "Muat ulang." }],
      last_collected_at: "2026-08-09T03:05:00.000Z", can_retry: false, retry_after: null, can_escalate: false,
    });
    render(<PendingContentCard claimToken="claim-jwt" loading={false} error="" onRefresh={onRefresh} data={responseData({ instagram: platform({ pending_content: 1, items: [{ shortcode: "IG1", url: null, caption: "Konten", content_time: null }] }) })} />);
    fireEvent.click(screen.getByRole("button", { name: "Komplain" }));
    const submit = screen.getByRole("button", { name: "Kirim Komplain" });
    fireEvent.click(submit); fireEvent.click(submit);
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(1));
    expect(triageClaimComplaint).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Aktivitas sudah tercatat")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Eskalasi" })).toBeNull();
  });
});
