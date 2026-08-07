describe("getClaimPendingContent", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_API_URL = "https://api.cicero.test";
    global.fetch = jest.fn();
  });

  it("memakai endpoint GET dengan cookie", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ success: true, data: {} }) });
    const { getClaimPendingContent } = await import("@/utils/api");
    await getClaimPendingContent();
    expect(global.fetch).toHaveBeenCalledWith("https://api.cicero.test/api/claim/pending-content", { method: "GET", credentials: "include" });
  });

  it("meneruskan pesan API 401", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: "Token user tidak valid" }) });
    const { getClaimPendingContent } = await import("@/utils/api");
    await expect(getClaimPendingContent()).rejects.toThrow("Token user tidak valid");
  });

  it("memberi pesan fallback pada error API tanpa body JSON", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error("invalid json"); } });
    const { getClaimPendingContent } = await import("@/utils/api");
    await expect(getClaimPendingContent()).rejects.toThrow("Gagal memuat konten yang belum tercatat");
  });
});
