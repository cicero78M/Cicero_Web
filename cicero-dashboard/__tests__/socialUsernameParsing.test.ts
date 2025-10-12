import {
  extractInstagramUsername,
  extractTiktokUsername,
} from "@/app/claim/edit/socialUtils";

describe("extractInstagramUsername", () => {
  it("returns username for plain handles", () => {
    expect(extractInstagramUsername("username"))
      .toBe("username");
    expect(extractInstagramUsername("@user.name"))
      .toBe("user.name");
  });

  it("rejects domain-like input without protocol", () => {
    expect(extractInstagramUsername("instagram.com/akun"))
      .toBe("");
    expect(extractInstagramUsername("instagram.com"))
      .toBe("");
  });

  it("extracts username from valid URLs", () => {
    expect(
      extractInstagramUsername("https://www.instagram.com/user/")
    ).toBe("user");
    expect(
      extractInstagramUsername("https://m.instagram.com/user")
    ).toBe("user");
  });

  it("returns empty string for URLs with other hosts", () => {
    expect(
      extractInstagramUsername("https://example.com/user")
    ).toBe("");
  });

  it("rejects usernames containing spaces", () => {
    expect(extractInstagramUsername("user name")).toBe("");
  });
});

describe("extractTiktokUsername", () => {
  it("returns username for plain handles", () => {
    expect(extractTiktokUsername("username"))
      .toBe("username");
    expect(extractTiktokUsername("@user_name"))
      .toBe("user_name");
  });

  it("rejects domain-like input without protocol", () => {
    expect(extractTiktokUsername("tiktok.com/@akun"))
      .toBe("");
    expect(extractTiktokUsername("tiktok.com"))
      .toBe("");
  });

  it("extracts username from valid URLs", () => {
    expect(
      extractTiktokUsername("https://www.tiktok.com/@user")
    ).toBe("user");
    expect(
      extractTiktokUsername("https://m.tiktok.com/@user/video/123")
    ).toBe("user");
  });

  it("returns empty string for URLs with other hosts", () => {
    expect(
      extractTiktokUsername("https://example.com/@user")
    ).toBe("");
  });

  it("rejects usernames containing spaces", () => {
    expect(extractTiktokUsername("user name")).toBe("");
  });
});
