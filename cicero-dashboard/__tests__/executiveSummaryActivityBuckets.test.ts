import { computeActivityBuckets } from "@/app/executive-summary/page";

describe("computeActivityBuckets", () => {
  const baseUsers = [
    { username: "Alpha" },
    { username: "Bravo" },
    { username: "Charlie" },
  ];

  const findCategory = (categories: any[], key: string) =>
    categories.find((category) => category.key === key);

  it("mengelompokkan personil aktif Instagram saja", () => {
    const result = computeActivityBuckets({
      users: baseUsers,
      likes: [
        { username: "Alpha" },
        { username: "alpha" },
        { username: "BRAVO" },
      ],
      comments: [],
      totalIGPosts: "10",
      totalTikTokPosts: 5,
    });

    expect(result.evaluatedUsers).toBe(3);
    expect(result.totalContent).toBe(15);

    const instagram = findCategory(result.categories, "instagram-active");
    const tiktok = findCategory(result.categories, "tiktok-active");
    const passive = findCategory(result.categories, "passive");

    expect(instagram?.count).toBe(2);
    expect(tiktok?.count).toBe(0);
    expect(passive?.count).toBe(1);
  });

  it("mengelompokkan personil aktif TikTok saja", () => {
    const result = computeActivityBuckets({
      users: baseUsers,
      likes: [],
      comments: [
        { username: "Charlie" },
        { username: "CHARLIE" },
      ],
      totalIGPosts: 0,
      totalTikTokPosts: "8",
    });

    expect(result.evaluatedUsers).toBe(3);
    expect(result.totalContent).toBe(8);

    const instagram = findCategory(result.categories, "instagram-active");
    const tiktok = findCategory(result.categories, "tiktok-active");
    const passive = findCategory(result.categories, "passive");

    expect(instagram?.count).toBe(0);
    expect(tiktok?.count).toBe(1);
    expect(passive?.count).toBe(2);
  });

  it("menggabungkan aktivitas Instagram dan TikTok", () => {
    const result = computeActivityBuckets({
      users: baseUsers,
      likes: [{ username: "Alpha" }],
      comments: [
        { username: "Bravo" },
        { username: "Alpha" },
      ],
      totalIGPosts: 2,
      totalTikTokPosts: 3,
    });

    expect(result.evaluatedUsers).toBe(3);
    expect(result.totalContent).toBe(5);

    const instagram = findCategory(result.categories, "instagram-active");
    const tiktok = findCategory(result.categories, "tiktok-active");
    const passive = findCategory(result.categories, "passive");

    expect(instagram?.count).toBe(1);
    expect(tiktok?.count).toBe(2);
    expect(passive?.count).toBe(1);
  });

  it("menghitung personil pasif ketika tidak ada aktivitas yang cocok", () => {
    const result = computeActivityBuckets({
      users: [
        { username: "Alpha" },
        { username: "ALPHA" },
        { username: "Bravo" },
      ],
      likes: [{ username: "Delta" }],
      comments: [],
      totalIGPosts: 1,
      totalTikTokPosts: undefined,
    });

    expect(result.evaluatedUsers).toBe(2);
    expect(result.totalContent).toBe(1);

    const instagram = findCategory(result.categories, "instagram-active");
    const tiktok = findCategory(result.categories, "tiktok-active");
    const passive = findCategory(result.categories, "passive");

    expect(instagram?.count).toBe(0);
    expect(tiktok?.count).toBe(0);
    expect(passive?.count).toBe(2);
  });
});
