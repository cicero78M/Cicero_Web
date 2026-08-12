import { buildExecutiveRecap } from "@/utils/executiveRecap";
import {
  isExecutiveRecapStatsConsistent,
  mapExecutiveRecapToCardProps,
} from "@/utils/premiumInsightAdapters";

const localStats = {
  totalUsers: 1104,
  totalPosts: 0,
  completedCount: 0,
  partialCount: 0,
  notStartedCount: 1099,
  missingUsernameCount: 5,
};

const localRecap = buildExecutiveRecap({
  platform: "Instagram",
  periodLabel: "Hari ini",
  ...localStats,
  complianceRate: 0,
});

const fallback = {
  title: localRecap.title,
  description: localRecap.description,
  summary: localRecap.summary,
  briefText: localRecap.text,
  fullText: localRecap.text,
};

describe("premium executive recap validation", () => {
  it("classifies every account with a username as not started when there are no posts", () => {
    expect(isExecutiveRecapStatsConsistent(localStats)).toBe(true);
    expect(localStats.notStartedCount).toBe(1099);
    expect(localRecap.summary).toContain("1099 akun masih perlu aksi");
    expect(localRecap.summary).not.toContain("aman");
    expect(localRecap.text).toContain("Belum mulai: 1099");
    expect(localRecap.text).not.toContain("Seluruh akun aktif sudah aman");
  });

  it.each([
    ["missing stats", { summary: "remote", text: "remote" }],
    [
      "unbalanced stats",
      {
        summary: "Semua akun aktif aman",
        text: "Seluruh akun aktif sudah aman",
        stats: { ...localStats, notStartedCount: 0 },
      },
    ],
  ])("uses the local recap for a backend response with %s", (_label, response) => {
    expect(mapExecutiveRecapToCardProps(response, { sourceStats: localStats, fallback })).toEqual(fallback);
  });

  it("accepts remote text only when its stats match the local recap", () => {
    const response = {
      platform: "instagram",
      summary: "1099 akun masih perlu aksi pada Hari ini.",
      text: "Briefing backend: Belum mulai: 1099",
      stats: localStats,
    };

    expect(mapExecutiveRecapToCardProps(response, { sourceStats: localStats, fallback })).toMatchObject({
      summary: response.summary,
      briefText: response.text,
    });
  });
});
