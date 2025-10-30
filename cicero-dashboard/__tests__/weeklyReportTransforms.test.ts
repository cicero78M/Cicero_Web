import {
  buildWeeklySeries,
  normalizePostsForPlatform,
  filterActivityRecordsByRange,
  prepareActivityRecordsByWeek,
  extractClientPersonnel,
  sortPersonnelDistribution,
  filterDitbinmasRecords,
} from "@/app/weekly-report/WeeklyReportPageClient";
import { aggregateWeeklyLikesRecords } from "@/app/weekly-report/lib/dataTransforms";
import { resolveClientDisplayName } from "@/components/weekly-report/WeeklyPlatformLikesSummary";

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

  it("assigns records without dates to the fallback date range only", () => {
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

    const activeWeekFromDefaults = filterActivityRecordsByRange(
      recordSets.defaultRecords,
      activeWeekRange,
    );
    expect(activeWeekFromDefaults).toHaveLength(0);

    const activeWeekRecords = filterActivityRecordsByRange(
      recordSets,
      activeWeekRange,
    );
    expect(activeWeekRecords).toHaveLength(0);

    const previousWeekRecords = filterActivityRecordsByRange(
      recordSets,
      previousWeekRange,
    );
    expect(previousWeekRecords).toHaveLength(1);
  });

  it("uses a stable client key when satfung and divisi match", () => {
    const records = [
      {
        client_id: "",
        satfung: "Direktorat Sabhara",
        divisi: "Direktorat Sabhara",
        jumlah_like: 3,
      },
      {
        client_id: null,
        satfung: "Direktorat Sabhara",
        divisi: "Direktorat Sabhara",
        jumlah_like: 2,
      },
    ];

    const summary = aggregateWeeklyLikesRecords(records);

    expect(summary.clients).toHaveLength(1);
    expect(summary.clients[0].key).toBe("LAINNYA::DIREKTORAT SABHARA");
  });

  it("keeps personnel with zero interactions when a name is available", () => {
    const clients = [
      {
        key: "client-1",
        clientName: "Satfung A",
        personnel: [
          { key: "person-1", nama: "Person A", likes: 0, comments: 0 },
          { username: "person-b", likes: null, comments: undefined },
        ],
      },
    ];

    expect(extractClientPersonnel(clients)).toEqual([
      expect.objectContaining({
        key: "person-1",
        nama: "Person A",
        likes: 0,
        comments: 0,
        interactions: 0,
      }),
      expect.objectContaining({
        key: "client-1-person-b",
        nama: "person-b",
        likes: 0,
        comments: 0,
        interactions: 0,
      }),
    ]);
  });

  it("prefers divisi as satfung label for personnel distribution", () => {
    const clients = [
      {
        key: "client-ditbinmas",
        clientId: "DITBINMAS",
        divisi: "Subdit Binmas",
        personnel: [
          {
            key: "person-1",
            nama: "Person One",
            divisi: "Divisi Bhabinkamtibmas",
            likes: 3,
            comments: 2,
          },
        ],
      },
    ];

    const distribution = extractClientPersonnel(clients);

    expect(distribution).toEqual([
      expect.objectContaining({
        key: "person-1",
        nama: "Person One",
        satfung: "Divisi Bhabinkamtibmas",
        likes: 3,
        comments: 2,
        interactions: 5,
      }),
    ]);
  });

  it("prioritizes key personnel before sorting by interactions", () => {
    const personnel = [
      { nama: "Person A", pangkat: "AKP", interactions: 50 },
      {
        nama: "KOMISARIS BESAR POLISI LAFRI PRASETYONO, S.I.K., M.H",
        pangkat: "KOMISARIS BESAR POLISI",
        interactions: 10,
      },
      {
        nama: "AKBP ARY MURTINI, S.I.K., M.SI.",
        pangkat: "AKBP",
        interactions: 5,
      },
      { nama: "Person B", pangkat: "KOMPOL", interactions: 40 },
    ];

    const sorted = sortPersonnelDistribution(personnel);

    expect(sorted.map((person) => person.nama)).toEqual([
      "KOMISARIS BESAR POLISI LAFRI PRASETYONO, S.I.K., M.H",
      "AKBP ARY MURTINI, S.I.K., M.SI.",
      "Person A",
      "Person B",
    ]);
  });

  it("prioritizes key personnel even when the name uses abbreviations", () => {
    const personnel = [
      { nama: "Person A", pangkat: "AKP", interactions: 60 },
      { nama: "Person B", pangkat: "AKBP", interactions: 50 },
      {
        nama: "KOMBES POL. LAFRI PRASETYONO",
        pangkat: "KOMISARIS BESAR POLISI",
        interactions: 10,
      },
      {
        nama: "AKBP ARY MURTINI",
        pangkat: "AKBP",
        interactions: 5,
      },
    ];

    const sorted = sortPersonnelDistribution(personnel);

    expect(sorted.map((person) => person.nama)).toEqual([
      "KOMBES POL. LAFRI PRASETYONO",
      "AKBP ARY MURTINI",
      "Person A",
      "Person B",
    ]);
  });

  it("uses pangkat order to break interaction ties", () => {
    const personnel = [
      { nama: "Person High", pangkat: "AKBP", interactions: 20 },
      { nama: "Person Lower", pangkat: "AKP", interactions: 20 },
    ];

    const sorted = sortPersonnelDistribution(personnel);

    expect(sorted.map((person) => person.nama)).toEqual([
      "Person High",
      "Person Lower",
    ]);
  });

  it("filters aggregated weekly metrics to the specified Ditbinmas client scope", () => {
    const mergedRecords = [
      {
        client_id: "DITBINMAS",
        role: "Ditbinmas",
        jumlah_like: 5,
        jumlah_komentar: 2,
      },
      {
        client_id: "POLDA_JATIM",
        role: "Operator Ditbinmas",
        jumlah_like: 7,
        jumlah_komentar: 4,
      },
      {
        client_id: "POLDA_JABAR",
        role: "Ditbinmas",
        jumlah_like: 3,
        jumlah_komentar: 1,
      },
    ];

    const filtered = filterDitbinmasRecords(mergedRecords, {
      clientScope: "POLDA_JATIM",
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(
      expect.objectContaining({ client_id: "POLDA_JATIM" }),
    );

    const summary = aggregateWeeklyLikesRecords(filtered);

    expect(summary.totals.totalLikes).toBe(7);
    expect(summary.totals.totalComments).toBe(4);
    expect(summary.clients).toHaveLength(1);
  });

  it("derives distinct labels for generic client tokens with qualifiers", () => {
    const baseClient = {
      totalLikes: 0,
      totalComments: 0,
      activePersonnel: 0,
      totalPersonnel: 0,
      personnelWithLikes: 0,
      complianceRate: 0,
      averageLikesPerUser: 0,
    };

    const clients = [
      {
        ...baseClient,
        key: "LAINNYA::SUBBAGRENMIN",
        clientName: "LAINNYA::SUBBAGRENMIN",
      },
      {
        ...baseClient,
        key: "LAINNYA::BAGOPS",
        clientName: "LAINNYA",
      },
    ];

    const labels = clients.map((client) => resolveClientDisplayName(client));

    expect(labels).toEqual([
      "LAINNYA::SUBBAGRENMIN",
      "BAGOPS",
    ]);
    expect(new Set(labels).size).toBe(clients.length);
    expect(labels).not.toContain("Tidak Teridentifikasi");
  });
});
