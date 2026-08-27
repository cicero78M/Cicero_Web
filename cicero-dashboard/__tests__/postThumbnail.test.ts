import { resolvePostThumbnail } from "@/utils/postThumbnail";

describe("resolvePostThumbnail", () => {
  it.each([
    [{ thumbnail_url: "https://cdn.test/thumb.jpg" }, "https://cdn.test/thumb.jpg"],
    [{ video: { cover: "https://cdn.test/cover.jpg" } }, "https://cdn.test/cover.jpg"],
    [{ video: { originCover: "https://cdn.test/origin.jpg" } }, "https://cdn.test/origin.jpg"],
    [{ video: { dynamicCover: "https://cdn.test/dynamic.webp" } }, "https://cdn.test/dynamic.webp"],
    [
      { video: { cover: { url_list: ["https://cdn.test/from-list.jpg"] } } },
      "https://cdn.test/from-list.jpg",
    ],
    [
      { thumbnail: { url: "https://cdn.test/from-object.jpg" } },
      "https://cdn.test/from-object.jpg",
    ],
    [
      { image_versions2: { candidates: [{ url: "https://cdn.test/instagram.jpg" }] } },
      "https://cdn.test/instagram.jpg",
    ],
  ])("resolves supported post payload %#", (post, expected) => {
    expect(resolvePostThumbnail(post)).toBe(expected);
  });

  it("ignores objects and malformed values that cannot be used as img src", () => {
    expect(resolvePostThumbnail({ thumbnail: { handler: "img handler" } })).toBe("");
    expect(resolvePostThumbnail({ thumbnail: "img handler" })).toBe("");
  });

  it("normalizes HEIC image extensions", () => {
    expect(resolvePostThumbnail({ cover: "https://cdn.test/cover.heic?x=1" })).toBe(
      "https://cdn.test/cover.jpg?x=1",
    );
  });
});
