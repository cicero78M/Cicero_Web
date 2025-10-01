import {
  groupRecordsByWeek,
  resolveRecordDate,
  shouldShowWeeklyTrendCard,
} from "@/app/executive-summary/weeklyTrendUtils";
import {
  INSTAGRAM_LIKE_FIELD_PATHS,
  TIKTOK_COMMENT_FIELD_PATHS,
  sumActivityRecords,
} from "@/app/executive-summary/activityRecords";

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

  it("aggregates instagram likes from daily activity records", () => {
    const records = [
      { tanggal: "2024-05-01", jumlah_like: 5 },
      { tanggal: "2024-05-02", rekap: { total_like: "7" } },
      { tanggal: "2024-05-03", total_like: "invalid" },
    ];

    const totalLikes = sumActivityRecords(records, INSTAGRAM_LIKE_FIELD_PATHS);

    expect(totalLikes).toBe(12);
  });

  it("aggregates instagram likes from nested personnel fields", () => {
    const records = [
      { tanggal: "2024-07-01", likes_personil: "4" },
      { tanggal: "2024-07-02", rekap: { totalLikesPersonnel: "5" } },
    ];

    const totalLikes = sumActivityRecords(records, INSTAGRAM_LIKE_FIELD_PATHS);

    expect(totalLikes).toBe(9);
  });

  it("uses activityDate ISO values when grouping instagram likes by week", () => {
    const records = [
      {
        tanggal: "31/05/2024",
        activityDate: "2024-05-31T00:00:00.000Z",
        jumlah_like: 5,
      },
      {
        tanggal: "01/06/2024",
        activityDate: "2024-06-01T00:00:00.000Z",
        rekap: { total_like: "7" },
      },
    ];

    const weeklyLikes = groupRecordsByWeek(records, {
      datePaths: [
        "activityDate",
        "tanggal",
        "date",
        "created_at",
        "createdAt",
        "updated_at",
        "updatedAt",
        "time",
        "waktu",
        "rekap.tanggal",
        "rekap.date",
        "rekap.created_at",
        "rekap.createdAt",
      ],
    });

    expect(weeklyLikes).toHaveLength(1);

    const totalLikes = sumActivityRecords(
      weeklyLikes[0].records,
      INSTAGRAM_LIKE_FIELD_PATHS,
    );

    expect(totalLikes).toBe(12);
  });

  it("aggregates tiktok comments from daily activity records", () => {
    const records = [
      { created_at: "2024-06-10T07:00:00Z", komentar: 4 },
      { created_at: "2024-06-11T07:00:00Z", rekap: { total_komentar: "3" } },
      { created_at: "2024-06-12T07:00:00Z", komentar: null },
    ];

    const totalComments = sumActivityRecords(records, TIKTOK_COMMENT_FIELD_PATHS);

    expect(totalComments).toBe(7);
  });

  it("aggregates tiktok comments from nested personnel fields", () => {
    const records = [
      { created_at: "2024-07-01T07:00:00Z", komentar_personil: 2 },
      { created_at: "2024-07-03T07:00:00Z", rekap: { totalCommentsPersonnel: "6" } },
    ];

    const totalComments = sumActivityRecords(records, TIKTOK_COMMENT_FIELD_PATHS);

    expect(totalComments).toBe(8);
  });

  it("aggregates totals from records that only expose snake_case activity dates", () => {
    const instagramRecords = [
      { activity_date: "2024-07-01T00:00:00Z", rekap: { total_like: "5" } },
      { rekap: { activity_date: "2024-07-03T00:00:00Z", total_like: "7" } },
    ];
    const tiktokRecords = [
      { activity_date: "2024-07-02T07:00:00Z", rekap: { total_komentar: "2" } },
      { rekap: { activity_date: "2024-07-04T07:00:00Z", total_komentar: "5" } },
    ];

    const instagramBuckets = groupRecordsByWeek(instagramRecords);
    const tiktokBuckets = groupRecordsByWeek(tiktokRecords);

    expect(instagramBuckets).toHaveLength(1);
    expect(tiktokBuckets).toHaveLength(1);

    const instagramTotal = sumActivityRecords(
      instagramBuckets[0].records,
      INSTAGRAM_LIKE_FIELD_PATHS,
    );
    const tiktokTotal = sumActivityRecords(
      tiktokBuckets[0].records,
      TIKTOK_COMMENT_FIELD_PATHS,
    );

    expect(instagramTotal).toBe(12);
    expect(tiktokTotal).toBe(7);
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
