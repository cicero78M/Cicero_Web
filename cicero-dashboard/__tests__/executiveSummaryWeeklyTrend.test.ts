import {
  groupRecordsByWeek,
  resolveRecordDate,
  shouldShowWeeklyTrendCard,
} from "@/app/executive-summary/weeklyTrendUtils";

describe("groupRecordsByWeek weekly trend integration", () => {
  it("groups instagram activity into weekly buckets and shows the trend card", () => {
    const records = [
      { tanggal: "2024-05-01", jumlah_like: 5 },
      { tanggal: "2024-05-03", jumlah_like: 3 },
      { tanggal: "2024-05-08", jumlah_like: 2 },
    ];

    const buckets = groupRecordsByWeek(records);

    expect(buckets).toHaveLength(2);
    expect(buckets[0].records).toHaveLength(2);
    expect(buckets[1].records).toHaveLength(1);

    const shouldShow = shouldShowWeeklyTrendCard({
      showPlatformLoading: false,
      platformError: "",
      hasMonthlyPlatforms: false,
      cardHasRecords: buckets.length > 0,
    });

    expect(shouldShow).toBe(true);
  });

  it("groups tiktok activity into weekly buckets and shows the trend card", () => {
    const records = [
      { created_at: "2024-06-10T07:00:00Z", komentar: 4 },
      { created_at: "2024-06-12T07:00:00Z", komentar: 6 },
      { created_at: "2024-06-19T07:00:00Z", komentar: 1 },
    ];

    const buckets = groupRecordsByWeek(records);

    expect(buckets).toHaveLength(2);
    expect(buckets[0].records).toHaveLength(2);
    expect(buckets[1].records).toHaveLength(1);

    const shouldShow = shouldShowWeeklyTrendCard({
      showPlatformLoading: false,
      platformError: "",
      hasMonthlyPlatforms: false,
      cardHasRecords: buckets.length > 0,
    });

    expect(shouldShow).toBe(true);
  });

  it("groups posts with only date/tanggal fields and shows the trend card", () => {
    const posts = [
      { tanggal: "2024-07-01", likes: 2 },
      { date: "2024-07-02", likes: 1 },
      { tanggal: "2024-07-09", likes: 5 },
    ];

    const buckets = groupRecordsByWeek(posts, {
      getDate: (post) => {
        const resolved = resolveRecordDate(post, [
          "publishedAt",
          "published_at",
          "timestamp",
          "createdAt",
          "created_at",
        ]);

        return resolved?.parsed ?? null;
      },
    });

    expect(buckets).toHaveLength(2);
    expect(buckets[0].records).toHaveLength(2);
    expect(buckets[1].records).toHaveLength(1);

    const shouldShow = shouldShowWeeklyTrendCard({
      showPlatformLoading: false,
      platformError: "",
      hasMonthlyPlatforms: false,
      cardHasRecords: buckets.length > 0,
    });

    expect(shouldShow).toBe(true);
  });
});
