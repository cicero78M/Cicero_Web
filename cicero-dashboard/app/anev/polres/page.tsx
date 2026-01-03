"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, CalendarClock, MapPin, RefreshCcw, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useRequirePremium from "@/hooks/useRequirePremium";
import useAuth from "@/hooks/useAuth";
import {
  type DashboardAnevFilters,
  type DashboardAnevResponse,
  getDashboardAnev,
} from "@/utils/api";

type FilterFormState = Pick<DashboardAnevFilters, "time_range" | "start_date" | "end_date"> & {
  role?: string;
  scope?: string;
  regional_id?: string;
  client_id?: string;
};

type TiktokPerformanceRow = {
  label: string;
  posts: number;
  engagement: number;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  engagementRate?: number;
};

const TIME_RANGE_PRESETS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "This Week" },
  { value: "30d", label: "This Month" },
  { value: "custom", label: "Custom" },
];

function formatNumber(value?: number) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "0";
  return new Intl.NumberFormat("id-ID").format(Number(value));
}

function resolveNumber(source: Record<string, any>, candidates: string[], fallback = 0) {
  for (const key of candidates) {
    const value = source?.[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return fallback;
}

function resolveOptionalNumber(source: Record<string, any>, candidates: string[]) {
  const resolved = resolveNumber(source, candidates, Number.NaN);
  return Number.isNaN(resolved) ? undefined : resolved;
}

type NarrativePlatformBreakdown = { platform: string; posts: number };

function buildNarrative({
  totalUsers,
  totalLikes,
  totalComments,
  completionRate,
  platformBreakdown,
}: {
  totalUsers?: number;
  totalLikes?: number;
  totalComments?: number;
  completionRate?: number | null;
  platformBreakdown: NarrativePlatformBreakdown[];
}) {
  const sentences: string[] = [];

  if (typeof totalUsers === "number") {
    sentences.push(`Tercatat ${formatNumber(totalUsers)} pengguna aktif pada periode ini`);
  }

  if (typeof totalLikes === "number" || typeof totalComments === "number") {
    const likesText =
      typeof totalLikes === "number" ? `${formatNumber(totalLikes)} likes` : null;
    const commentsText =
      typeof totalComments === "number" ? `${formatNumber(totalComments)} komentar` : null;
    const interactionText = [likesText, commentsText].filter(Boolean).join(" dan ");

    if (interactionText) {
      sentences.push(`Interaksi mencapai ${interactionText}`);
    }
  }

  if (typeof completionRate === "number") {
    sentences.push(`Tingkat penyelesaian tugas tercatat di ${completionRate.toFixed(1)}%`);
  }

  const topPlatform = (platformBreakdown || []).reduce<NarrativePlatformBreakdown | null>(
    (currentTop, entry) => {
      if (!entry?.platform) return currentTop;
      if (!currentTop) return entry;
      return entry.posts > currentTop.posts ? entry : currentTop;
    },
    null,
  );

  if (topPlatform) {
    sentences.push(
      `Platform teraktif adalah ${topPlatform.platform.toUpperCase()} dengan ${formatNumber(topPlatform.posts)} posting`,
    );
  }

  if (!sentences.length) return null;
  return `${sentences.join(". ")}.`;
}

function resolvePlatformPosts(aggregates?: DashboardAnevResponse["aggregates"]) {
  const totals = aggregates?.totals ?? {};
  const postsMap = (totals.posts as Record<string, any>) || (totals.post as Record<string, any>) || {};
  const platformsFromMap = Object.keys(postsMap).map((platform) => ({
    platform,
    posts: resolveNumber(postsMap, [platform], 0),
  }));

  if (platformsFromMap.length) return platformsFromMap;

  const fromArray = (aggregates?.platforms || []).map((entry: any) => ({
    platform: entry?.platform || entry?.name || entry?.channel || "",
    posts: resolveNumber(entry || {}, ["posts", "total_posts", "count"], 0),
  }));

  return fromArray.filter((item) => item.platform);
}

function resolveComplianceRows(aggregates?: DashboardAnevResponse["aggregates"]) {
  const raw = aggregates?.raw ?? aggregates;
  const candidates =
    raw?.compliance_per_pelaksana ||
    raw?.compliance ||
    aggregates?.totals?.compliance_per_pelaksana ||
    aggregates?.tasks;

  if (!candidates || !Array.isArray(candidates)) return [] as any[];
  return candidates.map((item: any) => ({
    name: item?.pelaksana || item?.name || item?.label || item?.executor || "-",
    assigned: resolveNumber(item || {}, ["assigned", "tugas", "expected", "total"], 0),
    completed: resolveNumber(item || {}, ["completed", "done", "finished", "selesai"], 0),
    completion_rate: typeof item?.completion_rate === "number"
      ? item?.completion_rate
      : typeof item?.completionRate === "number"
        ? item?.completionRate
        : null,
  }));
}

function resolveUserBreakdownBySatfung(
  aggregates?: DashboardAnevResponse["aggregates"],
  rawRoot?: any,
) {
  const raw = rawRoot ?? aggregates?.raw ?? aggregates;
  const nestedRaw =
    raw?.raw ??
    raw?.data ??
    raw?.payload ??
    raw?.content ??
    raw?.response ??
    raw?.result;

  const candidateSources = [
    raw?.user_per_satfung,
    raw?.users_per_satfung,
    raw?.user_satfung,
    raw?.satfung,
    raw?.divisi,
    raw?.division,
    raw?.divisions,
    raw?.user_breakdown?.satfung,
    raw?.user_breakdown?.division,
    raw?.user_breakdown,
    raw?.breakdown?.satfung,
    raw?.breakdown?.division,
    raw?.breakdowns?.satfung,
    raw?.breakdowns?.division,
    raw?.aggregates?.user_per_satfung,
    raw?.aggregates?.users_per_satfung,
    raw?.aggregates?.satfung_breakdown,
    raw?.aggregates?.division_breakdown,
    raw?.aggregates?.user_breakdown,
    raw?.aggregates?.breakdown?.satfung,
    raw?.aggregates?.breakdown?.division,
    raw?.aggregates?.breakdowns?.satfung,
    raw?.aggregates?.breakdowns?.division,
    nestedRaw?.user_per_satfung,
    nestedRaw?.users_per_satfung,
    nestedRaw?.satfung_breakdown,
    nestedRaw?.division_breakdown,
    nestedRaw?.user_breakdown,
    nestedRaw?.breakdown?.satfung,
    nestedRaw?.breakdown?.division,
    nestedRaw?.breakdowns?.satfung,
    nestedRaw?.breakdowns?.division,
    aggregates?.user_per_satfung,
    aggregates?.users_per_satfung,
    aggregates?.satfung_breakdown,
    aggregates?.division_breakdown,
    aggregates?.user_breakdown,
    aggregates?.totals?.user_per_satfung,
    aggregates?.totals?.users_per_satfung,
    aggregates?.totals?.satfung_breakdown,
    aggregates?.totals?.division_breakdown,
    aggregates?.totals?.satfung,
    aggregates?.totals?.divisi,
    aggregates?.totals?.divisions,
    aggregates?.raw?.data?.user_per_satfung,
    aggregates?.raw?.data?.users_per_satfung,
    aggregates?.raw?.data?.satfung_breakdown,
    aggregates?.raw?.data?.division_breakdown,
    aggregates?.raw?.data?.user_breakdown,
    aggregates?.raw?.breakdown?.satfung,
    aggregates?.raw?.breakdown?.division,
    aggregates?.raw?.breakdowns?.satfung,
    aggregates?.raw?.breakdowns?.division,
    aggregates?.raw?.aggregates?.user_per_satfung,
    aggregates?.raw?.aggregates?.users_per_satfung,
    aggregates?.raw?.aggregates?.satfung_breakdown,
    aggregates?.raw?.aggregates?.division_breakdown,
    aggregates?.raw?.aggregates?.user_breakdown,
  ];

  const normalizeObjectEntries = (candidate: Record<string, any>) => {
    const entries = Object.entries(candidate || {}).map(([labelKey, value]) => {
      const derivedLabel =
        (value && typeof value === "object"
          ? value?.satfung ||
            value?.division ||
            value?.divisi ||
            value?.unit ||
            value?.name ||
            value?.label ||
            value?.title
          : null) || labelKey;

      const count =
        typeof value === "object"
          ? resolveNumber(value, ["count", "total", "users", "user", "value", "jumlah", "personel"], 0)
          : resolveNumber({ value }, ["value"], 0);

      if (!derivedLabel) return null;
      return { label: String(derivedLabel), count };
    });

    return entries.filter(Boolean) as { label: string; count: number }[];
  };

  for (const candidate of candidateSources) {
    if (Array.isArray(candidate)) {
      const normalized = candidate
        .map((item: any) => {
          const derivedLabel =
            item?.satfung ||
            item?.division ||
            item?.divisi ||
            item?.unit ||
            item?.name ||
            item?.label ||
            item?.title ||
            item?.category ||
            item?.key;

          if (!derivedLabel) return null;

          const count = resolveNumber(
            item || {},
            ["count", "total", "users", "user", "value", "jumlah", "personel"],
            0,
          );

          return { label: String(derivedLabel), count };
        })
        .filter(Boolean) as { label: string; count: number }[];

      if (normalized.length) return normalized;
    }

    if (candidate && typeof candidate === "object") {
      const normalized = normalizeObjectEntries(candidate);
      if (normalized.length) return normalized;
    }
  }

  return [] as { label: string; count: number }[];
}

function resolveInstagramLikesBySatfung(
  aggregates?: DashboardAnevResponse["aggregates"],
  rawRoot?: any,
) {
  const raw = rawRoot ?? aggregates?.raw ?? aggregates;
  const instagram = raw?.instagram ?? raw?.ig ?? raw?.instagram_metrics ?? raw?.ig_metrics;

  const candidateSources = [
    instagram?.likes_per_satfung,
    instagram?.likes_per_divisi,
    instagram?.likes_per_division,
    instagram?.likes_breakdown,
    instagram?.likes,
    instagram?.breakdown?.satfung,
    instagram?.breakdown?.division,
    instagram?.breakdowns?.satfung,
    instagram?.breakdowns?.division,
    raw?.likes_per_satfung,
    raw?.likes_per_divisi,
    raw?.likes_per_division,
    raw?.likes_breakdown,
    aggregates?.totals?.likes_per_satfung,
    aggregates?.totals?.likes_per_divisi,
    aggregates?.totals?.likes_per_division,
    aggregates?.totals?.likes_breakdown,
  ];

  const normalizeArrayEntries = (candidate: any[]): { label: string; likes: number }[] => {
    return candidate
      .map((item: any) => {
        const label =
          item?.satfung ||
          item?.division ||
          item?.divisi ||
          item?.unit ||
          item?.name ||
          item?.label ||
          item?.title ||
          item?.category ||
          item?.key;

        if (!label) return null;

        const likes = resolveNumber(item || {}, ["likes", "total_likes", "like", "value", "count", "jumlah"], 0);
        return { label: String(label), likes };
      })
      .filter(Boolean) as { label: string; likes: number }[];
  };

  const normalizeObjectEntries = (candidate: Record<string, any>): { label: string; likes: number }[] => {
    const entries = Object.entries(candidate || {}).map(([labelKey, value]) => {
      const derivedLabel =
        (value && typeof value === "object"
          ? value?.satfung ||
            value?.division ||
            value?.divisi ||
            value?.unit ||
            value?.name ||
            value?.label ||
            value?.title
          : null) || labelKey;

      const likes =
        typeof value === "object"
          ? resolveNumber(value, ["likes", "total_likes", "like", "value", "count", "jumlah"], 0)
          : resolveNumber({ value }, ["value"], 0);

      if (!derivedLabel) return null;
      return { label: String(derivedLabel), likes };
    });

    return entries.filter(Boolean) as { label: string; likes: number }[];
  };

  for (const candidate of candidateSources) {
    if (Array.isArray(candidate)) {
      const normalized = normalizeArrayEntries(candidate);
      if (normalized.length) return normalized.sort((a, b) => b.likes - a.likes);
    }

    if (candidate && typeof candidate === "object") {
      const normalized = normalizeObjectEntries(candidate);
      if (normalized.length) return normalized.sort((a, b) => b.likes - a.likes);
    }
  }

  return [] as { label: string; likes: number }[];
}

function resolveTiktokPerformanceBySatfung(
  aggregates?: DashboardAnevResponse["aggregates"],
  rawRoot?: any,
) {
  const raw = rawRoot ?? aggregates?.raw ?? aggregates;
  const tiktok =
    raw?.tiktok ??
    raw?.tik_tok ??
    raw?.tiktok_metrics ??
    raw?.tiktokMetric ??
    raw?.tiktok_data ??
    raw?.tiktokData ??
    raw?.anev?.tiktok ??
    raw?.anev?.tik_tok ??
    raw?.anev?.tiktok_metrics ??
    raw?.anev?.tiktokMetric ??
    raw?.anev?.tiktok_data ??
    raw?.anev?.tiktokData;

  const collectCandidateSources = (candidate: any) => {
    if (!candidate) return [];
    return [
      candidate?.per_satfung,
      candidate?.per_divisi,
      candidate?.per_division,
      candidate?.satfung,
      candidate?.division,
      candidate?.divisions,
      candidate?.breakdown?.satfung,
      candidate?.breakdown?.division,
      candidate?.breakdowns?.satfung,
      candidate?.breakdowns?.division,
      candidate?.posts_per_satfung,
      candidate?.posts_per_divisi,
      candidate?.posts_per_division,
      candidate?.engagement_per_satfung,
      candidate?.engagement_per_divisi,
      candidate?.engagement_per_division,
      candidate?.performance?.per_satfung,
      candidate?.performance?.per_divisi,
      candidate?.performance?.per_division,
      candidate?.performance,
      candidate?.tiktok_performance,
      candidate?.tiktok_performance_per_satfung,
      candidate?.tiktok_performance_per_divisi,
      candidate?.tiktok_performance_per_division,
    ];
  };

  const candidateSources = [
    ...collectCandidateSources(tiktok),
    ...collectCandidateSources(raw?.tiktok_summary),
    ...collectCandidateSources(raw?.anev),
    raw?.anev?.tiktok_per_satfung,
    raw?.anev?.tiktok_per_divisi,
    raw?.anev?.tiktok_per_division,
    raw?.anev?.tiktok_posts_per_satfung,
    raw?.anev?.tiktok_posts_per_divisi,
    raw?.anev?.tiktok_posts_per_division,
    raw?.anev?.tiktok_engagement_per_satfung,
    raw?.anev?.tiktok_engagement_per_divisi,
    raw?.anev?.tiktok_engagement_per_division,
    raw?.tiktok_per_satfung,
    raw?.tiktok_per_divisi,
    raw?.tiktok_per_division,
    raw?.tiktok_posts_per_satfung,
    raw?.tiktok_posts_per_divisi,
    raw?.tiktok_posts_per_division,
    raw?.tiktok_engagement_per_satfung,
    raw?.tiktok_engagement_per_divisi,
    raw?.tiktok_engagement_per_division,
    aggregates?.totals?.tiktok_per_satfung,
    aggregates?.totals?.tiktok_per_divisi,
    aggregates?.totals?.tiktok_per_division,
    aggregates?.totals?.tiktok_posts_per_satfung,
    aggregates?.totals?.tiktok_posts_per_divisi,
    aggregates?.totals?.tiktok_posts_per_division,
    aggregates?.totals?.tiktok_engagement_per_satfung,
    aggregates?.totals?.tiktok_engagement_per_divisi,
    aggregates?.totals?.tiktok_engagement_per_division,
    aggregates?.raw?.anev?.tiktok_per_satfung,
    aggregates?.raw?.anev?.tiktok_per_divisi,
    aggregates?.raw?.anev?.tiktok_per_division,
    aggregates?.raw?.anev?.tiktok_posts_per_satfung,
    aggregates?.raw?.anev?.tiktok_posts_per_divisi,
    aggregates?.raw?.anev?.tiktok_posts_per_division,
    aggregates?.raw?.anev?.tiktok_engagement_per_satfung,
    aggregates?.raw?.anev?.tiktok_engagement_per_divisi,
    aggregates?.raw?.anev?.tiktok_engagement_per_division,
  ];

  const normalizeArrayEntries = (
    candidate: any[],
  ): TiktokPerformanceRow[] => {
    return candidate
      .map((item: any) => {
        const label =
          item?.satfung ||
          item?.division ||
          item?.divisi ||
          item?.unit ||
          item?.name ||
          item?.label ||
          item?.title ||
          item?.category ||
          item?.key;

        if (!label) return null;

        const posts = resolveNumber(
          item || {},
          ["posts", "total_posts", "post", "jumlah_posting", "count", "total"],
          0,
        );
        const likes = resolveNumber(item || {}, ["likes", "like_count"], 0);
        const comments = resolveNumber(
          item || {},
          ["comments", "comment_count"],
          0,
        );
        const shares = resolveNumber(item || {}, ["shares", "share_count"], 0);
        const views = resolveOptionalNumber(item || {}, [
          "views",
          "view",
          "view_count",
          "views_count",
          "plays",
          "play",
          "impressions",
        ]);
        const optionalLikes = resolveOptionalNumber(item || {}, [
          "likes",
          "like_count",
          "total_likes",
        ]);
        const optionalComments = resolveOptionalNumber(item || {}, [
          "comments",
          "comment_count",
          "total_comments",
        ]);
        const optionalShares = resolveOptionalNumber(item || {}, [
          "shares",
          "share_count",
          "total_shares",
        ]);
        const baseEngagement = likes + comments + shares;
        const engagement =
          resolveNumber(
            item || {},
            [
              "engagement",
              "engagements",
              "total_engagement",
              "interaction",
              "interactions",
              "total_interactions",
            ],
            baseEngagement,
          ) || baseEngagement;
        const engagementRate =
          resolveOptionalNumber(item || {}, [
            "engagement_rate",
            "engagementRate",
            "er",
            "erate",
            "engagement_rate_percent",
          ]) ??
          (views && views > 0 ? (engagement / views) * 100 : undefined);

        return {
          label: String(label),
          posts,
          engagement,
          views,
          likes: optionalLikes,
          comments: optionalComments,
          shares: optionalShares,
          engagementRate,
        };
      })
      .filter(Boolean) as TiktokPerformanceRow[];
  };

  const normalizeObjectEntries = (
    candidate: Record<string, any>,
  ): TiktokPerformanceRow[] => {
    const entries = Object.entries(candidate || {}).map(([labelKey, value]) => {
      const derivedLabel =
        (value && typeof value === "object"
          ? value?.satfung ||
            value?.division ||
            value?.divisi ||
            value?.unit ||
            value?.name ||
            value?.label ||
            value?.title
          : null) || labelKey;

      const likes = resolveOptionalNumber(value || {}, ["likes", "like_count", "total_likes"]);
      const comments = resolveOptionalNumber(value || {}, ["comments", "comment_count", "total_comments"]);
      const shares = resolveOptionalNumber(value || {}, ["shares", "share_count", "total_shares"]);
      const views = resolveOptionalNumber(value || {}, [
        "views",
        "view",
        "view_count",
        "views_count",
        "plays",
        "play",
        "impressions",
      ]);
      const posts =
        typeof value === "object"
          ? resolveNumber(
              value,
              ["posts", "total_posts", "post", "jumlah_posting", "count", "total"],
              0,
            )
          : resolveNumber({ value }, ["value"], 0);
      const baseEngagement = (likes ?? 0) + (comments ?? 0) + (shares ?? 0);
      const engagement =
        typeof value === "object"
          ? resolveNumber(
              value,
              [
                "engagement",
                "engagements",
                "total_engagement",
                "interaction",
                "interactions",
                "total_interactions",
              ],
              baseEngagement,
            ) || baseEngagement
          : resolveNumber({ value }, ["value"], baseEngagement);
      const engagementRate =
        resolveOptionalNumber(value || {}, [
          "engagement_rate",
          "engagementRate",
          "er",
          "erate",
          "engagement_rate_percent",
        ]) ??
        (views && views > 0 ? (engagement / views) * 100 : undefined);

      if (!derivedLabel) return null;
      return { label: String(derivedLabel), posts, engagement, views, likes, comments, shares, engagementRate };
    });

    return entries.filter(Boolean) as TiktokPerformanceRow[];
  };

  for (const candidate of candidateSources) {
    if (Array.isArray(candidate)) {
      const normalized = normalizeArrayEntries(candidate);
      if (normalized.length) {
        return normalized.sort((a, b) =>
          b.engagement === a.engagement
            ? b.posts - a.posts
            : b.engagement - a.engagement,
        );
      }
    }

    if (candidate && typeof candidate === "object") {
      const normalized = normalizeObjectEntries(candidate);
      if (normalized.length) {
        return normalized.sort((a, b) =>
          b.engagement === a.engagement
            ? b.posts - a.posts
            : b.engagement - a.engagement,
        );
      }
    }
  }

  return [] as TiktokPerformanceRow[];
}

function computeCompletionRate(row: { assigned: number; completed: number; completion_rate?: number | null }) {
  if (typeof row.completion_rate === "number") return row.completion_rate;
  if (!row.assigned) return 0;
  return (row.completed / row.assigned) * 100;
}

function formatDateInput(date: Date) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().split("T")[0];
}

function derivePresetRange(timeRange: string) {
  const normalized = timeRange.toLowerCase();
  const today = new Date();
  const endDate = formatDateInput(today);

  if (normalized === "7d") {
    const start = new Date(today);
    const diffToMonday = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - diffToMonday);
    return { startDate: formatDateInput(start), endDate };
  }

  if (normalized === "30d") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { startDate: formatDateInput(start), endDate };
  }

  if (normalized === "today") {
    return { startDate: endDate, endDate };
  }

  return { startDate: undefined, endDate: undefined };
}

const DEFAULT_PRESET_RANGE = derivePresetRange("7d");

function resolveFiltersWithPreset(filters: FilterFormState) {
  const safeTimeRange = filters.time_range || "custom";
  const presetRange = derivePresetRange(safeTimeRange);
  const isCustom = safeTimeRange.toLowerCase() === "custom";
  return {
    ...filters,
    time_range: safeTimeRange,
    start_date: isCustom ? filters.start_date : presetRange.startDate,
    end_date: isCustom ? filters.end_date : presetRange.endDate,
  };
}

export default function AnevPolresPage() {
  useRequireAuth();
  const premiumStatus = useRequirePremium({ redirectOnStandard: false });

  const {
    token,
    clientId,
    isHydrating,
    premiumTier,
    effectiveRole,
    effectiveClientType,
    regionalId,
    role,
  } = useAuth();
  const [formState, setFormState] = useState<FilterFormState>({
    time_range: "7d",
    start_date: DEFAULT_PRESET_RANGE.startDate,
    end_date: DEFAULT_PRESET_RANGE.endDate,
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterFormState>({
    time_range: "7d",
    start_date: DEFAULT_PRESET_RANGE.startDate,
    end_date: DEFAULT_PRESET_RANGE.endDate,
  });
  const [data, setData] = useState<DashboardAnevResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premiumBlocked, setPremiumBlocked] = useState<string | null>(null);
  const [badRequest, setBadRequest] = useState<string | null>(null);
  const lastFetchKeyRef = useRef<string | null>(null);

  const lockedRole = useMemo(() => effectiveRole ?? role ?? undefined, [effectiveRole, role]);
  const lockedScope = useMemo(() => {
    const normalized = (effectiveClientType || "").toLowerCase();
    if (!normalized) return undefined;
    if (normalized.includes("direktorat")) return "direktorat";
    if (normalized.includes("org")) return "org";
    return normalized;
  }, [effectiveClientType]);
  const lockedRegionalId = useMemo(
    () => (regionalId ? String(regionalId).toUpperCase() : undefined),
    [regionalId],
  );

  const lockedFilters = useMemo(
    () => ({
      role: lockedRole,
      scope: lockedScope,
      regional_id: lockedRegionalId,
      client_id: clientId || undefined,
    }),
    [clientId, lockedRegionalId, lockedRole, lockedScope],
  );
  const isWaitingSessionContext = useMemo(
    () => !lockedRole || !lockedScope,
    [lockedRole, lockedScope],
  );

  const isCustomRange = formState.time_range.toLowerCase() === "custom";
  const isCustomIncomplete =
    isCustomRange && (!formState.start_date || !formState.end_date);

  const resolvedAppliedFilters = useMemo(
    () => resolveFiltersWithPreset(appliedFilters),
    [appliedFilters],
  );
  const appliedPresetLabel = useMemo(
    () =>
      TIME_RANGE_PRESETS.find((preset) => preset.value === resolvedAppliedFilters.time_range)?.label ??
      resolvedAppliedFilters.time_range ??
      "Custom",
    [resolvedAppliedFilters],
  );
  const appliedRangeLabel = useMemo(() => {
    const start = resolvedAppliedFilters.start_date;
    const end = resolvedAppliedFilters.end_date;
    if (!start && !end) return "Belum diterapkan";
    if (start && end) return `${start} → ${end}`;
    if (start) return `${start} → (otomatis)`;
    if (end) return `(otomatis) → ${end}`;
    return "Rentang tidak tersedia";
  }, [resolvedAppliedFilters]);

  const derivedFilterEntries = useMemo(
    () => [
      { label: "Role", value: lockedRole ? lockedRole.toUpperCase() : "Menunggu sesi" },
      {
        label: "Scope",
        value: lockedScope ? lockedScope.toUpperCase() : "Menunggu sesi",
      },
      { label: "Regional", value: lockedRegionalId || "Tidak tersedia" },
      { label: "Client", value: clientId || "Tidak tersedia" },
    ],
    [clientId, lockedRegionalId, lockedRole, lockedScope],
  );

  useEffect(() => {
    const mergeLocked = (prev: FilterFormState) => {
      const next = { ...prev, ...lockedFilters } as FilterFormState;
      const hasChanged = Object.keys(next).some((key) => (next as any)[key] !== (prev as any)[key]);
      return hasChanged ? next : prev;
    };

    setFormState((prev) => mergeLocked(prev));
    setAppliedFilters((prev) => mergeLocked(prev));
  }, [lockedFilters]);

  useEffect(() => {
    if (
      !token ||
      !clientId ||
      !lockedRole ||
      !lockedScope ||
      isHydrating ||
      premiumStatus !== "premium"
    ) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const requestKey = JSON.stringify({
      clientId,
      time_range: resolvedAppliedFilters.time_range,
      start_date: resolvedAppliedFilters.start_date,
      end_date: resolvedAppliedFilters.end_date,
      role: lockedFilters.role,
      scope: lockedFilters.scope,
      regional_id: lockedFilters.regional_id,
    });

    if (lastFetchKeyRef.current === requestKey) return;
    lastFetchKeyRef.current = requestKey;

    setLoading(true);
    setError(null);
    setPremiumBlocked(null);
    setBadRequest(null);

    getDashboardAnev(
      token,
      {
        ...lockedFilters,
        ...resolvedAppliedFilters,
        client_id: clientId,
      },
      controller.signal,
    )
      .then((response) => {
        setData(response);
      })
      .catch((err: any) => {
        if (controller.signal.aborted) return;
        if (err?.status === 403) {
          const tierLabel = err?.premiumGuard?.tier || premiumTier || "";
          const expiry = err?.premiumGuard?.expires_at || err?.premiumGuard?.expiresAt;
          const message =
            err?.message ||
            "Akses premium diperlukan untuk membuka Dashboard ANEV.";
          setPremiumBlocked(
            `${message}${tierLabel ? ` (tier: ${tierLabel}${expiry ? `, expiry: ${expiry}` : ""})` : ""}`,
          );
          return;
        }
        if (err?.status === 400) {
          setBadRequest(err?.message || "Filter scope/role tidak valid.");
          return;
        }
        setError(err?.message || "Gagal memuat Dashboard ANEV Polres.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [
    clientId,
    isHydrating,
    lockedFilters,
    lockedRole,
    lockedScope,
    premiumStatus,
    premiumTier,
    resolvedAppliedFilters,
    token,
  ]);

  const aggregates = data?.aggregates;
  const totals = aggregates?.totals || {};
  const totalUsers = useMemo(() => resolveNumber(totals, ["total_users", "users", "user_count", "personel"], 0), [totals]);
  const totalLikes = useMemo(() => resolveNumber(totals, ["likes", "total_likes"], 0), [totals]);
  const totalComments = useMemo(() => resolveNumber(totals, ["comments", "total_comments"], 0), [totals]);
  const expectedActions = useMemo(
    () => resolveNumber(totals, ["expected_actions", "actions", "tugas_harusnya", "expected"], 0),
    [totals],
  );

  const platformBreakdown = useMemo(() => resolvePlatformPosts(aggregates), [aggregates]);
  const complianceRows = useMemo(() => resolveComplianceRows(aggregates), [aggregates]);
  const satfungBreakdown = useMemo(
    () => resolveUserBreakdownBySatfung(aggregates, data?.raw),
    [aggregates, data?.raw],
  );
  const maxSatfungCount = useMemo(
    () =>
      satfungBreakdown.reduce((acc, entry) => {
        if (!entry) return acc;
        return Math.max(acc, entry.count ?? 0);
      }, 0),
    [satfungBreakdown],
  );
  const tiktokPerformancePerSatfung = useMemo(
    () => resolveTiktokPerformanceBySatfung(aggregates, data?.raw),
    [aggregates, data?.raw],
  );
  const instagramLikesPerSatfung = useMemo(
    () => resolveInstagramLikesBySatfung(aggregates, data?.raw),
    [aggregates, data?.raw],
  );
  const completionRate = resolveNumber(totals, ["completion_rate", "compliance_rate", "rate"], null as any);
  const topPlatformBreakdown = useMemo<NarrativePlatformBreakdown[]>(
    () => platformBreakdown.map((entry) => ({ platform: entry.platform, posts: entry.posts })),
    [platformBreakdown],
  );
  const narrative = useMemo(
    () =>
      buildNarrative({
        totalUsers,
        totalLikes,
        totalComments,
        completionRate,
        platformBreakdown: topPlatformBreakdown,
      }),
    [completionRate, topPlatformBreakdown, totalComments, totalLikes, totalUsers],
  );

  const handleInputChange = (field: keyof FilterFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePresetChange = (value: string) => {
    const derived = derivePresetRange(value);
    setFormState((prev) => ({
      ...prev,
      time_range: value,
      start_date: value === "custom" ? undefined : derived.startDate,
      end_date: value === "custom" ? undefined : derived.endDate,
    }));
  };

  const handleApply = () => {
    if (isCustomRange && (!formState.start_date || !formState.end_date)) return;
    lastFetchKeyRef.current = null;
    const resolved = resolveFiltersWithPreset({
      ...formState,
      ...lockedFilters,
    });

    setAppliedFilters(resolved);
  };
  const handleResetFilters = () => {
    const resetState = {
      ...lockedFilters,
      time_range: "7d",
      start_date: DEFAULT_PRESET_RANGE.startDate,
      end_date: DEFAULT_PRESET_RANGE.endDate,
    };
    lastFetchKeyRef.current = null;
    setFormState(resetState);
    setAppliedFilters(resetState);
  };

  const FilterSnapshot = () => {
    if (!data?.filters && !resolvedAppliedFilters) return null;

    const apiFilters = data?.filters as FilterFormState | undefined;
    const filters = apiFilters ? resolveFiltersWithPreset(apiFilters) : resolvedAppliedFilters;
    const timeRangeValue = filters?.time_range || resolvedAppliedFilters.time_range;
    const activePresetLabel =
      TIME_RANGE_PRESETS.find((preset) => preset.value === timeRangeValue)?.label || timeRangeValue;
    const entries = [
      { label: "Time Range", value: activePresetLabel, highlighted: true },
      { label: "Start", value: filters?.start_date },
      { label: "End", value: filters?.end_date },
      { label: "Scope", value: filters?.scope, highlighted: true },
      { label: "Role", value: filters?.role, highlighted: true },
      { label: "Regional", value: filters?.regional_id, highlighted: true },
      { label: "Client", value: filters?.client_id, highlighted: true },
    ].filter((entry) => entry.value);

    if (!entries.length) return null;

    return (
      <div className="flex flex-wrap gap-2 text-sm">
        {entries.map((entry) => (
          <span
            key={`${entry.label}-${entry.value}`}
            className={`${entry.highlighted ? "border border-blue-100 bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-700"} rounded-full px-3 py-1`}
          >
            <span className="font-medium text-slate-900">{entry.label}:</span> {entry.value}
          </span>
        ))}
      </div>
    );
  };

  if (premiumStatus === "loading") {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <Loader inline label={null} className="h-5 w-5" />
          <span className="text-sm font-medium text-slate-700">Memuat status premium…</span>
        </div>
      </div>
    );
  }

  if (premiumStatus === "standard") {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-5 w-5" />
            Premium diperlukan
          </div>
          <p className="text-sm text-amber-800">
            Akses Dashboard ANEV Polres hanya tersedia untuk pengguna dengan paket premium aktif.
            Tingkatkan paket untuk melanjutkan.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/premium/anev"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              <Sparkles className="h-4 w-4" />
              Cek paket premium ANEV
            </Link>
            <Link
              href="/premium"
              className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:border-blue-200"
            >
              Pelajari manfaat premium lain
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (premiumStatus === "error") {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 shadow-sm">
          <AlertCircle className="mt-0.5 h-5 w-5" />
          <div>
            <div className="text-sm font-semibold">Gagal memvalidasi akses premium</div>
            <p className="text-sm">Coba muat ulang halaman atau hubungi admin untuk memastikan akses premium Anda.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard ANEV Polres</h1>
            <p className="text-sm text-slate-600">
              Rekap aktivitas, kepatuhan, dan tugas pelaksana dengan rentang waktu yang dapat diatur plus role/scope/regional otomatis dari sesi login.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <CalendarClock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Filter</h2>
                <p className="text-sm text-slate-600">
                  Pilih rentang waktu dan pastikan role, scope, serta regional mengikuti sesi login. Semua kontrol dirapikan agar mudah dibaca di layar kecil maupun besar.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                disabled={loading}
              >
                <RefreshCcw className="h-4 w-4" />
                Reset ke default
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={loading || isWaitingSessionContext || (isCustomRange && isCustomIncomplete)}
              >
                Terapkan filter
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4 lg:col-span-8">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Rentang waktu</p>
                    <p className="text-xs text-slate-500">Gunakan preset ringkas atau isi tanggal custom.</p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 shadow-sm ring-1 ring-slate-200">
                  Responsif
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex flex-wrap gap-2">
                  {TIME_RANGE_PRESETS.map((option) => {
                    const isActive = formState.time_range === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handlePresetChange(option.value)}
                        className={`flex-1 min-w-[130px] rounded-lg border px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                          isActive
                            ? "border-blue-500 bg-blue-600 text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                        }`}
                        aria-pressed={isActive}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {isCustomRange ? (
                    <>
                      <label className="flex flex-col gap-1 text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start date</span>
                        <input
                          type="date"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                          value={formState.start_date || ""}
                          onChange={(e) => handleInputChange("start_date", e.target.value)}
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-sm text-slate-700">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End date</span>
                        <input
                          type="date"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                          value={formState.end_date || ""}
                          onChange={(e) => handleInputChange("end_date", e.target.value)}
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start</span>
                        <span className="text-sm font-semibold text-slate-900">{formState.start_date}</span>
                        <span className="text-xs text-slate-500">Preset otomatis menyesuaikan tanggal mulai.</span>
                      </div>
                      <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">End</span>
                        <span className="text-sm font-semibold text-slate-900">{formState.end_date}</span>
                        <span className="text-xs text-slate-500">Mengikuti preset yang dipilih.</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              {isCustomRange && isCustomIncomplete ? (
                <p className="flex items-center gap-2 text-sm text-amber-700">
                  <AlertCircle size={16} />
                  Lengkapi tanggal mulai dan akhir untuk rentang custom.
                </p>
              ) : (
                <p className="text-xs text-slate-500">
                  Preset Today, This Week, dan This Month otomatis mengisi tanggal mulai/akhir dengan offset lokal.
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/80 p-4 lg:col-span-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Konteks sesi</p>
                    <p className="text-xs text-slate-500">Role, scope, dan regional terkunci.</p>
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm ring-1 ring-slate-200">
                  Locked
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {derivedFilterEntries.map((entry) => (
                  <div
                    key={`${entry.label}-${entry.value}`}
                    className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{entry.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{entry.value}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-600 shadow-sm">
                Nilai dikunci agar permintaan API selalu memakai konteks login (effectiveRole, effectiveClientType, dan regional).
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 md:flex md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-blue-700 shadow-sm ring-1 ring-slate-200">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Ringkasan terapan</p>
                <p className="text-xs text-slate-600">
                  {appliedPresetLabel} • {appliedRangeLabel}
                </p>
              </div>
            </div>
            <span className="mt-2 inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm ring-1 ring-emerald-100 md:mt-0">
              Sinkron dengan server
            </span>
          </div>
        </div>
      </div>

      {premiumStatus === "premium" && isWaitingSessionContext && (
        <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-blue-800">
          <AlertCircle size={20} className="mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Menunggu konteks sesi</p>
            <p className="text-sm leading-relaxed">
              Role/scope dari sesi login belum tersedia. Menunggu konteks sesi agar permintaan Dashboard ANEV tidak berakhir dengan error 400.
            </p>
          </div>
        </div>
      )}

      {premiumBlocked && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <ShieldAlert size={20} className="mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Akses premium diperlukan</p>
            <p className="text-sm leading-relaxed">{premiumBlocked}</p>
            <Link
              href="/premium/anev"
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              Daftar premium
              <Sparkles size={16} />
            </Link>
          </div>
        </div>
      )}

      {badRequest && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle size={20} className="mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Filter tidak valid</p>
            <p className="text-sm leading-relaxed">{badRequest}</p>
          </div>
        </div>
      )}

      {error && !premiumBlocked && !badRequest && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle size={20} className="mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Gagal memuat data</p>
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <Loader />
        </div>
      )}

      {!loading && data && !premiumBlocked && !badRequest && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Snapshot filter</h2>
                <p className="text-sm text-slate-600">
                  Filter aktif dari backend, termasuk role/scope/regional yang dikunci dari sesi login.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck size={14} />
                Premium aktif
              </span>
            </div>
            <FilterSnapshot />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total users</p>
              <p className="text-2xl font-semibold text-slate-900">{formatNumber(totalUsers)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Likes</p>
              <p className="text-2xl font-semibold text-slate-900">{formatNumber(totalLikes)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Comments</p>
              <p className="text-2xl font-semibold text-slate-900">{formatNumber(totalComments)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Expected actions</p>
              <p className="text-2xl font-semibold text-slate-900">{formatNumber(expectedActions)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Naratif</h3>
            {narrative ? (
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{narrative}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-600">
                Narasi akan muncul setelah data pengguna, interaksi, atau platform teraktif tersedia.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Posting per platform</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {platformBreakdown.length ? (
                platformBreakdown.map((item) => (
                  <div
                    key={`${item.platform}-${item.posts}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm text-slate-600">{item.platform.toUpperCase()}</p>
                    <p className="text-xl font-semibold text-slate-900">{formatNumber(item.posts)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">Belum ada data platform untuk filter ini.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">User per Satfung/Divisi</h3>
                <p className="text-sm text-slate-600">Jumlah user yang dikelompokkan per satfung atau divisi.</p>
              </div>
            </div>
            {satfungBreakdown.length ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-slate-100 px-3 py-1">Total entri: {satfungBreakdown.length}</span>
                  {maxSatfungCount > 0 && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
                      Terbanyak: {formatNumber(maxSatfungCount)} user
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                  {satfungBreakdown.map((entry, idx) => {
                    const ratio =
                      maxSatfungCount > 0
                        ? Math.min(100, Math.max(4, Math.round((entry.count / maxSatfungCount) * 100)))
                        : 0;
                    return (
                      <div key={`${entry.label}-${idx}`} className="space-y-2 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">{entry.label}</p>
                            <p className="text-xs text-slate-500">User terdaftar</p>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                            {formatNumber(entry.count)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white">
                          <div
                            className="h-full rounded-full bg-blue-500"
                            style={{ width: `${ratio}%` }}
                            aria-label={`Porsi ${entry.label}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Belum ada data satfung/divisi untuk filter ini. Pastikan payload ANEV menyertakan breakdown user per
                satfung atau divisi pada `aggregates` ataupun `raw`.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">TikTok per Satfung/Divisi</h3>
                <p className="text-sm text-slate-600">
                  Rekap kinerja TikTok per satfung atau divisi, menyorot volume posting dan engagement.
                </p>
              </div>
            </div>
            {tiktokPerformancePerSatfung.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tiktokPerformancePerSatfung.map((entry, idx) => {
                  const hasDetailMetrics =
                    entry.views !== undefined ||
                    entry.likes !== undefined ||
                    entry.comments !== undefined ||
                    entry.shares !== undefined;

                  return (
                    <div
                      key={`${entry.label}-${idx}`}
                      className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{entry.label}</p>
                          <p className="text-xs text-slate-500">Ringkasan posting & interaksi</p>
                        </div>
                        {typeof entry.engagementRate === "number" && !Number.isNaN(entry.engagementRate) && (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            ER: {formatNumber(entry.engagementRate)}%
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-500">Posting</p>
                          <p className="text-xl font-semibold text-slate-900">{formatNumber(entry.posts)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-500">Engagement</p>
                          <p className="text-xl font-semibold text-slate-900">{formatNumber(entry.engagement)}</p>
                        </div>
                      </div>
                      {hasDetailMetrics && (
                        <div className="flex flex-wrap gap-2 text-xs text-slate-600 sm:text-sm">
                          {entry.views !== undefined && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                              <span className="text-[11px] font-semibold uppercase text-slate-500">Views</span>
                              <span className="font-semibold text-slate-900">{formatNumber(entry.views)}</span>
                            </span>
                          )}
                          {entry.likes !== undefined && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                              <span className="text-[11px] font-semibold uppercase text-slate-500">Likes</span>
                              <span className="font-semibold text-slate-900">{formatNumber(entry.likes)}</span>
                            </span>
                          )}
                          {entry.comments !== undefined && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                              <span className="text-[11px] font-semibold uppercase text-slate-500">Comments</span>
                              <span className="font-semibold text-slate-900">{formatNumber(entry.comments)}</span>
                            </span>
                          )}
                          {entry.shares !== undefined && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-slate-700 shadow-sm">
                              <span className="text-[11px] font-semibold uppercase text-slate-500">Shares</span>
                              <span className="font-semibold text-slate-900">{formatNumber(entry.shares)}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Belum ada data TikTok per satfung/divisi untuk filter ini. Pastikan payload ANEV menyertakan
                `tiktok_per_satfung`, `tiktok_posts_per_satfung`, atau breakdown TikTok serupa di aggregates/raw.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Likes Instagram per Satfung/Divisi</h3>
                <p className="text-sm text-slate-600">
                  Rekap total likes Instagram yang dikelompokkan per satfung atau divisi.
                </p>
              </div>
            </div>
            {instagramLikesPerSatfung.length ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {instagramLikesPerSatfung.map((entry, idx) => (
                  <div
                    key={`${entry.label}-${idx}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm text-slate-600">{entry.label}</p>
                    <p className="text-xl font-semibold text-slate-900">{formatNumber(entry.likes)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Belum ada data likes Instagram per satfung/divisi untuk filter ini.</p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Compliance per pelaksana</h3>
                <p className="text-sm text-slate-600">
                  Tabel kepatuhan berdasarkan pelaksana/tugas dengan completion rate.
                </p>
              </div>
              {completionRate !== null && completionRate !== undefined && (
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Completion: {formatNumber(completionRate)}%
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Pelaksana</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Tugas</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Selesai</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Completion rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complianceRows.length ? (
                    complianceRows.map((row, idx) => {
                      const rate = computeCompletionRate(row);
                      return (
                        <tr key={`${row.name}-${idx}`} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                          <td className="px-4 py-3 text-slate-700">{formatNumber(row.assigned)}</td>
                          <td className="px-4 py-3 text-slate-700">{formatNumber(row.completed)}</td>
                          <td className="px-4 py-3 text-slate-700">{formatNumber(rate)}%</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-3 text-slate-600" colSpan={4}>
                        Tidak ada data kepatuhan untuk filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
