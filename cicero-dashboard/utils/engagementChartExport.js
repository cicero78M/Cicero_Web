const DEFAULT_EXPORT_DATE_FORMATTER = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Jakarta",
});

export const ENGAGEMENT_CHART_EXPORT_OPTIONS = {
  quality: 0.95,
  cacheBust: true,
  backgroundColor: "#ffffff",
  pixelRatio: 2,
};

export const ENGAGEMENT_CHART_PLATFORM_PROFILES = {
  instagram: {
    id: "instagram",
    title: "Instagram Engagement Insight",
    filePrefix: "instagram-engagement-direktorat",
    successLabel: "Instagram",
  },
  tiktok: {
    id: "tiktok",
    title: "TikTok Engagement Insight",
    filePrefix: "tiktok-engagement-direktorat",
    successLabel: "TikTok",
  },
};

export function getEngagementChartGroupingLabels(groupBy = "divisi") {
  if (groupBy === "client_id") {
    return {
      groupByLabel: "POLRES JAJARAN",
      fileGrouping: "polres-jajaran",
    };
  }

  return {
    groupByLabel: "divisi-satfung",
    fileGrouping: "divisi-satfung",
  };
}

export function resolveEngagementChartPlatformProfile(platform = "instagram") {
  return (
    ENGAGEMENT_CHART_PLATFORM_PROFILES[platform] ||
    ENGAGEMENT_CHART_PLATFORM_PROFILES.instagram
  );
}

export function buildEngagementChartJpgFilename({
  platform = "instagram",
  groupBy = "divisi",
  date = new Date(),
}) {
  const { filePrefix } = resolveEngagementChartPlatformProfile(platform);
  const { fileGrouping } = getEngagementChartGroupingLabels(groupBy);
  const exportDate =
    date instanceof Date
      ? DEFAULT_EXPORT_DATE_FORMATTER.format(date)
      : String(date || "").split("T")[0];
  return `${filePrefix}-${fileGrouping}-${exportDate}.jpg`;
}
