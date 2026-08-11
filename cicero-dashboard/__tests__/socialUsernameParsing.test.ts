import {
  extractInstagramUsername,
  extractTiktokUsername,
  normalizeSocialAccountList,
} from "@/app/claim/edit/socialUtils";

describe("extractInstagramUsername", () => {
  it("returns username for plain handles", () => {
    expect(extractInstagramUsername("username")).toBe("username");
    expect(extractInstagramUsername("@user.name")).toBe("user.name");
  });

  it("rejects domain-like input without protocol", () => {
    expect(extractInstagramUsername("instagram.com/akun")).toBe("");
    expect(extractInstagramUsername("instagram.com")).toBe("");
  });

  it("extracts username from valid URLs", () => {
    expect(extractInstagramUsername("https://www.instagram.com/user/")).toBe(
      "user",
    );
    expect(extractInstagramUsername("https://m.instagram.com/user")).toBe(
      "user",
    );
  });

  it("returns empty string for URLs with other hosts", () => {
    expect(extractInstagramUsername("https://example.com/user")).toBe("");
  });

  it("rejects usernames containing spaces", () => {
    expect(extractInstagramUsername("user name")).toBe("");
  });
});

describe("extractTiktokUsername", () => {
  it("returns username for plain handles", () => {
    expect(extractTiktokUsername("username")).toBe("@username");
    expect(extractTiktokUsername("@user_name")).toBe("@user_name");
  });

  it("rejects domain-like input without protocol", () => {
    expect(extractTiktokUsername("tiktok.com/@akun")).toBe("");
    expect(extractTiktokUsername("tiktok.com")).toBe("");
  });

  it("extracts username from valid URLs", () => {
    expect(extractTiktokUsername("https://www.tiktok.com/@user")).toBe("@user");
    expect(extractTiktokUsername("https://m.tiktok.com/@user/video/123")).toBe(
      "@user",
    );
  });

  it("returns empty string for URLs with other hosts", () => {
    expect(extractTiktokUsername("https://example.com/@user")).toBe("");
  });

  it("rejects usernames containing spaces", () => {
    expect(extractTiktokUsername("user name")).toBe("");
  });
});

describe("normalizeSocialAccountList", () => {
  it("normalizes supported input forms to backend canonical values", () => {
    expect(
      normalizeSocialAccountList(
        ["@Polri", "https://instagram.com/humas.polri/"],
        "instagram",
      ),
    ).toEqual({ ok: true, accounts: ["Polri", "humas.polri"] });
    expect(
      normalizeSocialAccountList(
        ["polri", "https://www.tiktok.com/@humas.polri"],
        "tiktok",
      ),
    ).toEqual({ ok: true, accounts: ["@polri", "@humas.polri"] });
  });

  it.each([
    [["satu", "", "tiga"], "tidak boleh kosong"],
    [["Polri", "@polri"], "terduplikasi"],
    [["CICERO_DEVS"], "tidak diperbolehkan"],
    [["https://example.com/user"], "tidak valid"],
  ])("rejects invalid Instagram lists", (values, message) => {
    const result = normalizeSocialAccountList(values, "instagram");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain(message);
  });

  it("allows trailing empty rows and an entirely empty single row", () => {
    expect(normalizeSocialAccountList(["akun", ""], "instagram")).toEqual({
      ok: true,
      accounts: ["akun"],
    });
    expect(normalizeSocialAccountList([""], "tiktok")).toEqual({
      ok: true,
      accounts: [],
    });
  });
});
