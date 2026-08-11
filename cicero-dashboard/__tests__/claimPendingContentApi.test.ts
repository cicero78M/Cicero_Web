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

describe("claim complaint lifecycle API", () => {
  beforeEach(() => {
    jest.resetModules();
    process.env.NEXT_PUBLIC_API_URL = "https://api.cicero.test";
    global.fetch = jest.fn();
  });

  const triageData = {
    platform: "instagram",
    content_id: "IG1",
    complaint_id: "complaint/1",
    complaint_created: true,
    complaint_status: "triaged",
  };

  it.each([201, 200])("mengembalikan metadata complaint dari triase HTTP %s", async (status) => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status, json: async () => ({ success: true, data: { ...triageData, complaint_created: status === 201 } }) });
    const { triageClaimComplaint } = await import("@/utils/api");
    await expect(triageClaimComplaint("claim-jwt", { platform: "instagram", issue_type: "activity_not_recorded", shortcode: "IG1" })).resolves.toMatchObject({
      complaint_id: "complaint/1",
      complaint_created: status === 201,
      complaint_status: "triaged",
    });
    expect(global.fetch).toHaveBeenCalledWith("https://api.cicero.test/api/claim/complaints/triage", expect.objectContaining({ method: "POST" }));
  });

  it("langsung mengeskalasi complaint dengan expected_status tanpa membuat ulang", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => ({ success: true }) });
    const { escalateClaimComplaint } = await import("@/utils/api");
    await escalateClaimComplaint("claim-jwt", "complaint/1", "triaged");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith("https://api.cicero.test/api/claim/complaints/complaint%2F1/escalate", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ expected_status: "triaged" }),
    }));
  });

  it("mempertahankan kode, status, dan pesan backend pada konflik lifecycle", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 409, json: async () => ({ error_code: "CLAIM_COMPLAINT_STATUS_CONFLICT", message: "Status complaint telah berubah" }) });
    const { escalateClaimComplaint } = await import("@/utils/api");
    await expect(escalateClaimComplaint("claim-jwt", "c-1", "triaged")).rejects.toMatchObject({
      status: 409,
      errorCode: "CLAIM_COMPLAINT_STATUS_CONFLICT",
      message: "Status complaint telah berubah",
    });
  });

  it.each([404, 422])("meneruskan pesan backend untuk response %s tanpa status buatan frontend", async (status) => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status, json: async () => ({ error_code: "BACKEND_CODE", message: `Pesan backend ${status}` }) });
    const { escalateClaimComplaint } = await import("@/utils/api");
    await expect(escalateClaimComplaint("claim-jwt", "c-1", "triaged")).rejects.toMatchObject({ status, message: `Pesan backend ${status}` });
  });

  it("memuat lifecycle complaint terbaru", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: { complaint_id: "c-1", status: "resolved" } }) });
    const { getClaimComplaint } = await import("@/utils/api");
    await expect(getClaimComplaint("claim-jwt", "c-1")).resolves.toEqual({ complaint_id: "c-1", status: "resolved" });
    expect(global.fetch).toHaveBeenCalledWith("https://api.cicero.test/api/claim/complaints/c-1", expect.objectContaining({ method: "GET" }));
  });

  it("memuat daftar milik pengguna terautentikasi tanpa identitas query atau body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ complaint_id: "c-1", status: "triaged" }] }),
    });
    const { getClaimComplaints } = await import("@/utils/api");

    await expect(getClaimComplaints("claim-jwt")).resolves.toEqual([
      { complaint_id: "c-1", status: "triaged" },
    ]);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.cicero.test/api/claim/complaints",
      {
        method: "GET",
        headers: { Authorization: "Bearer claim-jwt" },
        credentials: "include",
      },
    );
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).not.toMatch(/[?&](user_id|nrp|client_id)=/);
    expect(init).not.toHaveProperty("body");
  });
});
