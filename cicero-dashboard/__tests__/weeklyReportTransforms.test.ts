import {
  buildWeeklySeries,
  normalizePostsForPlatform,
  filterActivityRecordsByRange,
  prepareActivityRecordsByWeek,
  extractClientPersonnel,
} from "@/app/weekly-report/WeeklyReportPageClient";

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

  it("assigns records without dates to the active week range", () => {
    const weekRanges = [
      {
        key: "2024-07-01",
        index: 1,
        start: new Date(Date.UTC(2024, 6, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(2024, 6, 7, 23, 59, 59, 999)),
      },
      {
        key: "2024-07-08",
        index: 2,
        start: new Date(Date.UTC(2024, 6, 8, 0, 0, 0, 0)),
        end: new Date(Date.UTC(2024, 6, 14, 23, 59, 59, 999)),
      },
    ];

    const activeWeekRange = weekRanges[1];
    const previousWeekRange = weekRanges[0];

    const records = [
      {
        client_id: "unit-1",
        jumlah_like: 5,
      },
    ];

    const fallbackDate = new Date(Date.UTC(2024, 6, 1, 0, 0, 0, 0));

    const recordSets = prepareActivityRecordsByWeek(records, {
      fallbackDate,
      activeWeekRange,
      previousWeekRange,
    });

    const defaultWeekTwoRecords = filterActivityRecordsByRange(
      recordSets.defaultRecords,
      activeWeekRange,
    );
    expect(defaultWeekTwoRecords).toHaveLength(0);

    const activeWeekRecords = filterActivityRecordsByRange(
      recordSets,
      activeWeekRange,
    );
    expect(activeWeekRecords).toHaveLength(1);
  });

  it("aggregates personnel into active and inactive buckets per satfung", () => {
    const clients = [
      {
        key: "client-1",
        clientName: "Satfung A",
        divisi: "Divisi A",
        totalPersonnel: 5,
        activePersonnel: 2,
        totalLikes: 5,
        totalComments: 3,
        personnel: [
          { key: "person-1", nama: "Person A", active: true, likes: 3, comments: 1 },
          { key: "person-2", nama: "Person B", active: true, likes: 0, comments: 2 },
          { key: "person-3", nama: "Person C", active: false, likes: 7, comments: 4 },
        ],
      },
    ];

    const distribution = extractClientPersonnel(clients);

    expect(distribution).toHaveLength(2);

    const activeRow = distribution.find((row) => row.bucketKey === "active");
    const inactiveRow = distribution.find((row) => row.bucketKey === "inactive");

    expect(activeRow).toMatchObject({
      key: "client-1-active",
      bucketLabel: "Aktif",
      groupLabel: "Divisi A",
      personnelCount: 2,
      totalPersonnel: 5,
      likes: 3,
      comments: 3,
      interactions: 6,
    });

    expect(inactiveRow).toMatchObject({
      key: "client-1-inactive",
      bucketLabel: "Belum Aktivitas",
      personnelCount: 3,
      likes: 0,
      comments: 0,
      interactions: 0,
    });
  });

  it("prefers divisi as satfung label while preserving compliance metadata", () => {
    const clients = [
      {
        key: "client-ditbinmas",
        clientId: "DITBINMAS",
        divisi: "Subdit Binmas",
        totalPersonnel: 4,
        activePersonnel: 1,
        personnel: [
          {
            key: "person-1",
            nama: "Person One",
            active: true,
            likes: 3,
            comments: 2,
          },
        ],
      },
    ];

    const distribution = extractClientPersonnel(clients);

    expect(distribution).toHaveLength(2);

    const [activeRow, inactiveRow] = distribution;

    expect(activeRow).toMatchObject({
      bucketLabel: "Aktif",
      groupLabel: "Subdit Binmas",
      personnelCount: 1,
      totalPersonnel: 4,
    });

    expect(inactiveRow).toMatchObject({
      bucketLabel: "Belum Aktivitas",
      personnelCount: 3,
      totalPersonnel: 4,
    });
  });
});
