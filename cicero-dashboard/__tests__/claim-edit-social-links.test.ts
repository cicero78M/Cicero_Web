import { extractInstagramUsername, extractTiktokUsername } from "../app/claim/edit/page.jsx";

describe("extractInstagramUsername", () => {
  it("normalizes instagram.com/user without protocol", () => {
    expect(extractInstagramUsername("instagram.com/user")).toBe("user");
  });

  it("handles trailing slash and protocol", () => {
    expect(extractInstagramUsername("https://www.instagram.com/user/")).toBe("user");
  });

  it("strips leading at symbol", () => {
    expect(extractInstagramUsername("@user")).toBe("user");
  });

  it("returns empty string for non-instagram links", () => {
    expect(extractInstagramUsername("https://example.com/user")).toBe("");
  });
});

describe("extractTiktokUsername", () => {
  it("normalizes tiktok.com/@user without protocol", () => {
    expect(extractTiktokUsername("tiktok.com/@user")).toBe("user");
  });

  it("ignores additional path segments after username", () => {
    expect(
      extractTiktokUsername("https://www.tiktok.com/@user/video/1234567890")
    ).toBe("user");
  });

  it("handles trailing slash", () => {
    expect(extractTiktokUsername("https://tiktok.com/@user/")).toBe("user");
  });

  it("returns empty string for non-tiktok links", () => {
    expect(extractTiktokUsername("https://example.com/@user")).toBe("");
  });
});
