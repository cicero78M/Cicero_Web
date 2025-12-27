import { normalizeExecutiveSummaryPayload } from "@/app/executive-summary/normalizers";

describe("normalizeExecutiveSummaryPayload engagementByChannel support", () => {
  it("converts engagement_by_channel map objects into array entries", () => {
    const payload = {
      data: {
        engagement_by_channel: {
          instagram: { reach: "1200", engagement_rate: "2.5" },
          tiktok: { impressions: 900, engagement: "3.2" },
        },
        month_key: "2024-06",
        month_label: "Juni 2024",
      },
    };

    const result = normalizeExecutiveSummaryPayload(payload);

    expect(result.data.engagementByChannel).toEqual([
      {
        channel: "instagram",
        reach: 1200,
        engagementRate: 2.5,
      },
      {
        channel: "tiktok",
        reach: 900,
        engagementRate: 3.2,
      },
    ]);
  });

  it("falls back to the map key when the channel name is missing", () => {
    const payload = {
      data: {
        engagementByChannel: {
          facebook: 500,
        },
      },
    };

    const result = normalizeExecutiveSummaryPayload(payload);

    expect(result.data.engagementByChannel).toEqual([
      {
        channel: "facebook",
        reach: 500,
        engagementRate: null,
      },
    ]);
  });
});
