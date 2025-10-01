import { computeActivityBuckets } from "@/app/executive-summary/activityBuckets";

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
        { username: "Alpha", jumlah_like: 12 },
        { username: "alpha", jumlah_like: 8 },
        { username: "BRAVO", jumlah_like: 5 },
      ],
      comments: [],
      totalIGPosts: "10",
      totalTikTokPosts: 5,
    });

    expect(result.evaluatedUsers).toBe(3);
    expect(result.totalContent).toBe(15);

    const mostActive = findCategory(result.categories, "most-active");
    const moderate = findCategory(result.categories, "moderate");
    const low = findCategory(result.categories, "low");
    const inactive = findCategory(result.categories, "inactive");

    expect(mostActive?.count).toBe(0);
    expect(moderate?.count).toBe(1);
    expect(low?.count).toBe(1);
    expect(inactive?.count).toBe(1);
  });

  it("mengelompokkan personil aktif TikTok saja", () => {
    const result = computeActivityBuckets({
      users: baseUsers,
      likes: [],
      comments: [
        { username: "Charlie", jumlah_komentar: 12 },
        { username: "CHARLIE", jumlahKomentar: 6 },
      ],
      totalIGPosts: 0,
      totalTikTokPosts: "8",
    });

    expect(result.evaluatedUsers).toBe(3);
    expect(result.totalContent).toBe(8);

    const mostActive = findCategory(result.categories, "most-active");
    const moderate = findCategory(result.categories, "moderate");
    const low = findCategory(result.categories, "low");
    const inactive = findCategory(result.categories, "inactive");

    expect(mostActive?.count).toBe(1);
    expect(moderate?.count).toBe(0);
    expect(low?.count).toBe(0);
    expect(inactive?.count).toBe(2);
  });

  it("menggabungkan aktivitas Instagram dan TikTok", () => {
    const result = computeActivityBuckets({
      users: baseUsers,
      likes: [{ username: "Alpha", jumlah_like: 2 }],
      comments: [
        { username: "Bravo", jumlah_komentar: 4 },
        { username: "Alpha", jumlah_komentar: 1 },
      ],
      totalIGPosts: 2,
      totalTikTokPosts: 3,
    });

    expect(result.evaluatedUsers).toBe(3);
    expect(result.totalContent).toBe(5);

    const mostActive = findCategory(result.categories, "most-active");
    const moderate = findCategory(result.categories, "moderate");
    const low = findCategory(result.categories, "low");
    const inactive = findCategory(result.categories, "inactive");

    expect(mostActive?.count).toBe(0);
    expect(moderate?.count).toBe(2);
    expect(low?.count).toBe(0);
    expect(inactive?.count).toBe(1);
  });

  it("menghitung personil pasif ketika tidak ada aktivitas yang cocok", () => {
    const result = computeActivityBuckets({
      users: [
        { username: "Alpha" },
        { username: "ALPHA" },
        { username: "Bravo" },
      ],
      likes: [{ username: "Delta", jumlah_like: 3 }],
      comments: [],
      totalIGPosts: 1,
      totalTikTokPosts: undefined,
    });

    expect(result.evaluatedUsers).toBe(3);
    expect(result.totalContent).toBe(1);

    const mostActive = findCategory(result.categories, "most-active");
    const moderate = findCategory(result.categories, "moderate");
    const low = findCategory(result.categories, "low");
    const inactive = findCategory(result.categories, "inactive");

    expect(mostActive?.count).toBe(1);
    expect(moderate?.count).toBe(0);
    expect(low?.count).toBe(0);
    expect(inactive?.count).toBe(2);
  });
});
