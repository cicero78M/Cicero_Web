import {
  groupRecordsByWeek,
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
});
