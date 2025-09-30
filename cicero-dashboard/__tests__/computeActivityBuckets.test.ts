import { computeActivityBuckets } from "@/app/executive-summary/page";

describe("computeActivityBuckets", () => {
  it("does not classify participants without content as most active", () => {
    const users = [
      {
        id: "user-1",
        username: "user.one",
      },
    ];

    const likes = [
      {
        user_id: "user-1",
        jumlah_like: 5,
      },
    ];

    const result = computeActivityBuckets({
      users,
      likes,
      comments: [],
      totalIGPosts: 0,
      totalTikTokPosts: 0,
    });

    const mostActive = result.categories.find((category) => category.key === "most-active");
    const lowActivity = result.categories.find((category) => category.key === "low");

    expect(mostActive?.count).toBe(0);
    expect(lowActivity?.count).toBe(1);
  });
});
