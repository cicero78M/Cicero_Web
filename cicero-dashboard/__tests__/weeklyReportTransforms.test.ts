import {
  buildWeeklySeries,
  normalizePostsForPlatform,
  filterActivityRecordsByRange,
  prepareActivityRecordsByWeek,
  extractClientPersonnel,
  aggregateSatfungTotals,
  comparePersonnelByEngagement,
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

  it("returns no personnel when interactions are absent", () => {
    const clients = [
      {
        key: "client-1",
        clientName: "Satfung A",
        personnel: [
          { key: "person-1", nama: "Person A", likes: 0, comments: 0 },
          { key: "person-2", nama: "Person B", likes: null, comments: undefined },
        ],
      },
    ];

    expect(extractClientPersonnel(clients)).toEqual([]);
  });

  it("prioritizes satfung from personnel divisions when available", () => {
    const clients = [
      {
        key: "client-1",
        clientName: "DITBINMAS",
        personnel: [
          {
            key: "person-1",
            nama: "Person A",
            likes: 4,
            comments: 1,
            divisi: "Satfung Bhayangkara",
          },
        ],
      },
    ];

    const personnel = extractClientPersonnel(clients);

    expect(personnel).toHaveLength(1);
    expect(personnel[0].satfung).toBe("Satfung Bhayangkara");
  });

  it("retains satfung labels from alternative Ditbinmas fields", () => {
    const clients = [
      {
        key: "client-ditbinmas",
        clientId: "DIV-001",
        clientName: "DIV-001",
        personnel: [
          {
            key: "person-1",
            nama: "Person A",
            likes: 5,
            comments: 2,
            divisi_satker: "Satfung Polmas",
          },
          {
            key: "person-1",
            likes: 3,
            comments: 1,
            client_name: "Satfung Polmas",
          },
        ],
      },
    ];

    const personnel = extractClientPersonnel(clients);

    expect(personnel).toHaveLength(1);
    expect(personnel[0].satfung).toBe("Satfung Polmas");

    const satfungTotals = aggregateSatfungTotals(personnel);

    expect(satfungTotals).toHaveLength(1);
    expect(satfungTotals[0].clientName).toBe("Satfung Polmas");
    expect(satfungTotals[0].clientName).not.toBe("DIV-001");
  });

  it("aggregates likes and comments per satfung", () => {
    const personnel = [
      {
        key: "person-1",
        nama: "Person A",
        satfung: "Satfung Pembinaan",
        likes: 6,
        comments: 2,
      },
      {
        key: "person-2",
        nama: "Person B",
        satfung: "Satfung Pembinaan",
        likes: 4,
        comments: 1,
      },
      {
        key: "person-3",
        nama: "Person C",
        satfung: "Satfung Operasional",
        likes: 3,
        comments: 5,
      },
    ];

    const satfungTotals = aggregateSatfungTotals(personnel);

    expect(satfungTotals).toHaveLength(2);

    const pembinaan = satfungTotals.find(
      (entry) => entry.clientName === "Satfung Pembinaan",
    );
    const operasional = satfungTotals.find(
      (entry) => entry.clientName === "Satfung Operasional",
    );

    expect(pembinaan?.totalLikes).toBe(10);
    expect(pembinaan?.totalComments).toBe(3);
    expect(operasional?.totalLikes).toBe(3);
    expect(operasional?.totalComments).toBe(5);
  });

  it("sorts personnel ties by pangkat when engagements match", () => {
    const clients = [
      {
        key: "client-1",
        clientName: "DITBINMAS",
        personnel: [
          {
            key: "person-high",
            nama: "Person Pangkat Tinggi",
            likes: 2,
            comments: 1,
            pangkat: "AKBP",
          },
          {
            key: "person-low",
            nama: "Person Pangkat Rendah",
            likes: 2,
            comments: 1,
            pangkat: "AIPTU",
          },
        ],
      },
    ];

    const personnel = extractClientPersonnel(clients);
    const sorted = [...personnel].sort(comparePersonnelByEngagement);

    expect(sorted[0].key).toBe("person-high");
    expect(sorted[0].pangkat).toBe("AKBP");
  });
});
