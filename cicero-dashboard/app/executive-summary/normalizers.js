import { parseDateValue } from "./weeklyTrendUtils";
import { normalizeContentType } from "./sharedUtils";

const ensureStringValue = (value, fallback = "") => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || fallback;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  const stringified = String(value).trim();
  return stringified || fallback;
};

const ensureNumberValue = (value, fallback = null) => {
  if (value === null || value === undefined) {
    return fallback;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const ensureValidDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value;
  }

  const parsed = parseDateValue(value);
  if (parsed instanceof Date && !Number.isNaN(parsed.valueOf())) {
    return parsed;
  }

  return null;
};

const normalizeStringArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => ensureStringValue(item, ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return [];
};

const normalizeEngagementByChannelEntries = (raw) => {
  const normalizeEntry = (entry, fallbackChannel = "") => {
    const entryObject = entry && typeof entry === "object" ? entry : {};
    const channel = ensureStringValue(
      entryObject.channel ??
        entryObject.name ??
        entryObject.platform ??
        entryObject.label ??
        fallbackChannel,
      "",
    );
    if (!channel) {
      return null;
    }

    const reachCandidate =
      entryObject.reach ??
      entryObject.totalReach ??
      entryObject.reachCount ??
      entryObject.impressions ??
      entryObject.total_impressions ??
      entryObject.reach_total ??
      entry;

    const engagementRateCandidate =
      entryObject.engagementRate ??
      entryObject.engagement_rate ??
      entryObject.engagement ??
      entryObject.rate ??
      entryObject.engagementPercent ??
      entryObject.engagement_rate_percent;

    return {
      channel,
      reach: ensureNumberValue(reachCandidate, 0) ?? 0,
      engagementRate: ensureNumberValue(engagementRateCandidate, null) ?? null,
    };
  };

  if (Array.isArray(raw)) {
    return raw.map((entry) => normalizeEntry(entry)).filter(Boolean);
  }

  if (raw && typeof raw === "object") {
    return Object.entries(raw)
      .map(([channelKey, entry]) => normalizeEntry(entry, channelKey))
      .filter(Boolean);
  }

  return [];
};

const normalizeExecutiveSummaryPayload = (
  payload,
  { fallbackMonthKey, fallbackMonthLabel } = {},
) => {
  const source = payload?.data ?? payload ?? {};
  const monthKey =
    ensureStringValue(
      source.monthKey ??
        source.month_key ??
        source.month ??
        source.periode ??
        source.period ??
        source.period_key,
      "",
    ) || fallbackMonthKey;
  const resolvedMonthLabel =
    ensureStringValue(
      source.monthLabel ??
        source.month_label ??
        source.periodLabel ??
        source.period_label ??
        source.label ??
        source.period_name ??
        source.month_name,
      "",
    ) ||
    fallbackMonthLabel ||
    monthKey ||
    "";
  const narratives = source.narratives ?? {};

  const summaryMetricsSource =
    source.summaryMetrics ?? source.summary_metrics ?? source.summary;
  const summaryMetrics = Array.isArray(summaryMetricsSource)
    ? summaryMetricsSource
        .map((metric) => {
          const label = ensureStringValue(
            metric?.label ?? metric?.title ?? metric?.name,
            "",
          );
          if (!label) {
            return null;
          }
          const valueCandidate =
            metric?.value ??
            metric?.metric_value ??
            metric?.total ??
            metric?.count ??
            metric?.amount;
          return {
            label,
            value:
              ensureNumberValue(valueCandidate, null) ??
              valueCandidate ??
              null,
            change: ensureStringValue(metric?.change ?? metric?.delta ?? metric?.trend, ""),
            suffix: ensureStringValue(
              metric?.suffix ?? metric?.unit ?? metric?.symbol,
              "",
            ),
          };
        })
        .filter(Boolean)
    : [];

  const engagementByChannelRaw =
    source.engagementByChannel ??
    source.engagement_by_channel ??
    source.channels ??
    source.channelSummary ??
    [];
  const engagementByChannel = normalizeEngagementByChannelEntries(engagementByChannelRaw);

  const audienceCompositionRaw =
    source.audienceComposition ??
    source.audience_composition ??
    source.audience ??
    source.audienceMix ??
    [];
  const audienceComposition = Array.isArray(audienceCompositionRaw)
    ? audienceCompositionRaw
        .map((entry) => {
          const name = ensureStringValue(entry?.name ?? entry?.label ?? entry?.segment, "");
          if (!name) {
            return null;
          }
          return {
            name,
            value:
              ensureNumberValue(
                entry?.value ?? entry?.share ?? entry?.percentage ?? entry?.percent,
                null,
              ) ?? 0,
          };
        })
        .filter(Boolean)
    : [];

  const contentTableRaw = Array.isArray(
    source.contentTable ?? source.content_table ?? source.topContent ?? source.contents,
  )
    ? source.contentTable ?? source.content_table ?? source.topContent ?? source.contents
    : [];
  const contentTable = contentTableRaw
    .map((row, index) => {
      if (!row || typeof row !== "object") {
        return null;
      }
      const likes = ensureNumberValue(
        row.likes ?? row.likeCount ?? row.metrics?.likes ?? row.interactions?.likes,
        null,
      );
      const comments = ensureNumberValue(
        row.comments ??
          row.commentCount ??
          row.metrics?.comments ??
          row.interactions?.comments,
        null,
      );
      const engagementRate = ensureNumberValue(
        row.engagement ?? row.engagementRate ?? row.engagement_rate ?? row.rate,
        null,
      );
      const reach = ensureNumberValue(
        row.reach ?? row.view ?? row.views ?? row.impressions ?? row.totalReach,
        null,
      );
      let totalInteractions = ensureNumberValue(
        row.totalInteractions ?? row.interactions ?? row.total_interactions,
        null,
      );
      if (totalInteractions == null) {
        if (likes != null || comments != null) {
          totalInteractions = (likes ?? 0) + (comments ?? 0);
        } else if (engagementRate != null && reach != null) {
          totalInteractions = Math.round(reach * (engagementRate / 100));
        }
      }

      const publishedAt = ensureValidDate(
        row.publishedAt ??
          row.tanggal ??
          row.date ??
          row.published_at ??
          row.created_at ??
          row.time,
      );

      return {
        id: String(
          row.id ??
            row.content_id ??
            row.contentId ??
            row.slug ??
            row.permalink ??
            row.url ??
            row.link ??
            `${row.platform ?? row.channel ?? "content"}-${index + 1}`,
        ),
        platform: row.platform ?? row.channel ?? row.source ?? "",
        title: row.title ?? row.name ?? row.caption ?? "Konten",
        format: normalizeContentType(row.format ?? row.type ?? ""),
        publishedAt,
        likes: likes ?? 0,
        comments: comments ?? 0,
        totalInteractions: totalInteractions ?? 0,
      };
    })
    .filter((entry) => entry && entry.id);

  const platformAnalytics =
    Array.isArray(source?.platformAnalytics?.platforms)
      ? source.platformAnalytics
      : Array.isArray((source.platformAnalytics ?? source.platforms ?? source.platform_analytics)?.platforms)
        ? source.platformAnalytics ?? source.platform_analytics ?? source.platforms
        : Array.isArray(source.platforms ?? source.platform_analytics)
          ? { platforms: source.platforms ?? source.platform_analytics }
          : source.platformAnalytics ?? source.platform_analytics ?? {};

  return {
    monthKey: monthKey || null,
    data: {
      ...source,
      monthLabel: resolvedMonthLabel || undefined,
      summaryMetrics,
      highlights: normalizeStringArray(
        source.highlights ??
          source.key_highlights ??
          narratives.highlights ??
          narratives.key_highlights,
      ),
      engagementByChannel,
      audienceComposition,
      contentTable,
      platformAnalytics,
      overviewNarrative:
        ensureStringValue(
          source.overviewNarrative ?? source.overview ?? narratives.overview,
          "",
        ) || "",
      dashboardNarrative:
        ensureStringValue(
          source.dashboardNarrative ??
            narratives.dashboard ??
            narratives.dashboardNarrative ??
            narratives.platform,
          "",
        ) || "",
      userInsightNarrative:
        ensureStringValue(
          source.userInsightNarrative ??
            narratives.userInsight ??
            narratives.user ??
            narratives.personnel,
          "",
        ) || "",
      instagramNarrative:
        ensureStringValue(
          source.instagramNarrative ??
            narratives.instagram ??
            narratives.instagramNarrative ??
            narratives.ig,
          "",
        ) || "",
      tiktokNarrative:
        ensureStringValue(
          source.tiktokNarrative ?? narratives.tiktok ?? narratives.tiktokNarrative ?? narratives.tt,
          "",
        ) || "",
    },
  };
};

export {
  ensureStringValue,
  ensureNumberValue,
  ensureValidDate,
  normalizeStringArray,
  normalizeEngagementByChannelEntries,
  normalizeExecutiveSummaryPayload,
};
