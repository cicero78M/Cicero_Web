import { buildWeeklySeries, normalizePostsForPlatform } from "@/app/weekly-report/WeeklyReportPageClient";

describe("weekly report data transforms", () => {
  it("preserves metrics totals when building weekly series", () => {
    const records = [
      {
        id: "post-1",
        timestamp: "2024-07-02T09:30:00.000Z",
        metrics: {
          likes: 7,
          comments: 3,
          shares: 2,
        },
      },
    ];

    const normalized = normalizePostsForPlatform(records, {
      platformKey: "instagram",
      platformLabel: "Instagram",
    });

    expect(normalized).toHaveLength(1);

    const weekRanges = [
      {
        key: "2024-07-01",
        index: 1,
        start: new Date(Date.UTC(2024, 6, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(2024, 6, 7, 23, 59, 59, 999)),
      },
    ];

    const [series] = buildWeeklySeries(normalized, weekRanges, "Juli 2024");

    expect(series.likes).toBe(7);
    expect(series.comments).toBe(3);
    expect(series.interactions).toBe(12);
    expect(series.posts).toBe(1);
  });
});
