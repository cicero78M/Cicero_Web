"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import {
  getUserDirectory,
  getDashboardStats,
  getRekapLikesIG,
  getRekapKomentarTiktok,
  getInstagramPosts,
  getTiktokPosts,
} from "@/utils/api";
import {
  normalizeFormattedNumber,
  normalizeNumericInput,
  calculateRatePerDay,
} from "@/lib/normalizeNumericInput";
import { computeActivityBuckets, extractNumericValue } from "./activityBuckets";
import PlatformLikesSummary from "@/components/executive-summary/PlatformLikesSummary";
import MonthlyTrendCard from "@/components/executive-summary/MonthlyTrendCard";
import PlatformEngagementTrendChart from "@/components/executive-summary/PlatformEngagementTrendChart";
import DailyTrendChart from "@/components/executive-summary/DailyTrendChart";
import {
  buildMonthKey,
  extractYearFromMonthKey,
  mergeAvailableMonthOptions,
} from "./monthOptions";
import {
  createEmptyLikesSummary,
  mergeActivityRecords,
  aggregateLikesRecords,
  ensureRecordsHaveActivityDate,
  prepareTrendActivityRecords,
  resolveDirectoryIsActive,
} from "./dataTransforms";
import {
  pickNestedValue,
  pickNestedString,
  parseDateValue,
  resolveRecordDate,
  groupRecordsByWeek,
  shouldShowWeeklyTrendCard,
  formatWeekRangeLabel,
  formatMonthRangeLabel,
} from "./weeklyTrendUtils";
import {
  POST_DATE_PATHS,
  pickNestedNumeric,
  normalizeContentType,
  normalizePlatformPost,
  buildMonthlyEngagementTrend,
} from "./sharedUtils";
import {
  compareDivisionByCompletion,
  computeUserInsight,
  formatNumber,
  formatPercent,
} from "./userInsight";
const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const metricValueToString = (metric, { fallback = "-" } = {}) => {
  if (!metric) {
    return fallback;
  }

  const { value, suffix } = metric;

  if (typeof value === "number") {
    const options = {};

    if (Math.abs(value) >= 1000) {
      options.maximumFractionDigits = 0;
    } else if (Math.abs(value) >= 100) {
      options.maximumFractionDigits = 1;
    } else if (Math.abs(value) >= 10) {
      options.maximumFractionDigits = 1;
    } else {
      options.maximumFractionDigits = 2;
      options.minimumFractionDigits = 1;
    }

    return `${formatNumber(value, options)}${suffix ?? ""}`;
  }

  if (value === null || value === undefined) {
    return fallback;
  }

  return `${value}${suffix ?? ""}`;
};

const monthLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  year: "numeric",
});

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

const aggregateMonthlyActivity = (likesRecords = [], commentRecords = []) => {
  const monthMap = new Map();

  const addValue = (monthKey, updater) => {
    const existing = monthMap.get(monthKey) ?? {
      label: monthKey,
      likes: 0,
      comments: 0,
    };
    const updated = updater(existing);
    monthMap.set(monthKey, updated);
  };

  const extractMonthKey = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.valueOf())) {
      return null;
    }

    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: monthLabelFormatter.format(date) };
  };

  likesRecords.forEach((record) => {
    if (!record) {
      return;
    }

    const resolvedDate = ensureValidDate(
      record?.activityDate ?? record?.tanggal ?? record?.date ?? record?.created_at,
    );

    const monthInfo = extractMonthKey(resolvedDate);
    if (!monthInfo) {
      return;
    }

    const likeTotal = extractNumericValue(
      record?.likes,
      record?.jumlah_like,
      record?.jumlahLike,
      record?.total_like,
      record?.totalLikes,
      record?.like_count,
      record?.metrics?.likes,
      record?.metrics?.totalLikes,
      record?.rekap?.likes,
      record?.rekap?.likes_personil,
      record?.rekap?.total_like,
    );

    addValue(monthInfo.key, (existing) => ({
      ...existing,
      label: monthInfo.label,
      likes: (existing.likes ?? 0) + (Number.isFinite(likeTotal) ? likeTotal : 0),
    }));
  });

  commentRecords.forEach((record) => {
    if (!record) {
      return;
    }

    const resolvedDate = ensureValidDate(
      record?.activityDate ?? record?.tanggal ?? record?.date ?? record?.created_at,
    );

    const monthInfo = extractMonthKey(resolvedDate);
    if (!monthInfo) {
      return;
    }

    const commentTotal = extractNumericValue(
      record?.comments,
      record?.jumlah_komentar,
      record?.jumlahKomentar,
      record?.total_komentar,
      record?.totalComments,
      record?.comment_count,
      record?.metrics?.comments,
      record?.metrics?.totalComments,
      record?.rekap?.comments,
      record?.rekap?.komentar_personil,
      record?.rekap?.total_komentar,
    );

    addValue(monthInfo.key, (existing) => ({
      ...existing,
      label: monthInfo.label,
      comments: (existing.comments ?? 0) + (Number.isFinite(commentTotal) ? commentTotal : 0),
    }));
  });

  const sortedKeys = Array.from(monthMap.keys()).sort((a, b) => a.localeCompare(b));
  const limitedKeys = sortedKeys.slice(-6);
  return limitedKeys.map((key) => {
    const entry = monthMap.get(key);
    return {
      ...entry,
      label: entry?.label ?? key,
      likes: Math.max(0, Number(entry?.likes) || 0),
      comments: Math.max(0, Number(entry?.comments) || 0),
    };
  });
};

const buildWeeklyTrendDataset = (instagramSeries = [], tiktokSeries = []) => {
  const instagramMap = new Map();
  const tiktokMap = new Map();

  instagramSeries.forEach((item) => {
    if (!item?.key) {
      return;
    }
    instagramMap.set(item.key, item);
  });

  tiktokSeries.forEach((item) => {
    if (!item?.key) {
      return;
    }
    tiktokMap.set(item.key, item);
  });

  const mergedKeys = new Set([
    ...Array.from(instagramMap.keys()),
    ...Array.from(tiktokMap.keys()),
  ]);

  const sortedKeys = Array.from(mergedKeys).sort((a, b) => a.localeCompare(b));
  const labels = sortedKeys.map((key) => {
    const candidate = instagramMap.get(key) ?? tiktokMap.get(key);
    return candidate?.label ?? key;
  });

  const instagramValues = sortedKeys.map((key) => {
    const candidate = instagramMap.get(key);
    return candidate?.interactions ? Math.max(0, Number(candidate.interactions) || 0) : 0;
  });

  const tiktokValues = sortedKeys.map((key) => {
    const candidate = tiktokMap.get(key);
    return candidate?.interactions ? Math.max(0, Number(candidate.interactions) || 0) : 0;
  });

  return { labels, instagramValues, tiktokValues };
};

const dailyLabelFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
});

const buildDailyInteractionTrend = ({
  instagramPosts = [],
  tiktokPosts = [],
} = {}) => {
  const aggregated = new Map();

  const ensureEntry = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.valueOf())) {
      return null;
    }

    const baseDate = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const key = baseDate.toISOString().slice(0, 10);

    let entry = aggregated.get(key);
    if (!entry) {
      entry = {
        key,
        date: baseDate,
        label: dailyLabelFormatter.format(baseDate),
        posts: 0,
        likes: 0,
        comments: 0,
        interactions: 0,
      };
      aggregated.set(key, entry);
    }

    return entry;
  };

  const resolvePostActivityDate = (record, normalized) => {
    if (record?.activityDate instanceof Date && !Number.isNaN(record.activityDate.valueOf())) {
      return record.activityDate;
    }

    const parsedActivityDate = parseDateValue(record?.activityDate);
    if (parsedActivityDate instanceof Date && !Number.isNaN(parsedActivityDate.valueOf())) {
      return parsedActivityDate;
    }

    const parsedTanggal = parseDateValue(record?.tanggal ?? record?.date);
    if (parsedTanggal instanceof Date && !Number.isNaN(parsedTanggal.valueOf())) {
      return parsedTanggal;
    }

    const parsedTimestamp = parseDateValue(
      record?.createdAt ??
        record?.created_at ??
        record?.timestamp ??
        record?.published_at ??
        null,
    );
    if (parsedTimestamp instanceof Date && !Number.isNaN(parsedTimestamp.valueOf())) {
      return parsedTimestamp;
    }

    if (
      normalized?.publishedAt instanceof Date &&
      !Number.isNaN(normalized.publishedAt.valueOf())
    ) {
      return normalized.publishedAt;
    }

    return null;
  };

  const accumulatePosts = (records = [], { platformKey = "", platformLabel = "" } = {}) => {
    if (!Array.isArray(records)) {
      return;
    }

    records.forEach((post, index) => {
      if (!post || typeof post !== "object") {
        return;
      }

      const normalized = normalizePlatformPost(post, {
        platformKey,
        platformLabel,
        fallbackIndex: index,
      });

      if (!normalized) {
        return;
      }

      const resolvedDate = resolvePostActivityDate(post, normalized);
      if (!(resolvedDate instanceof Date) || Number.isNaN(resolvedDate.valueOf())) {
        return;
      }

      const entry = ensureEntry(resolvedDate);
      if (!entry) {
        return;
      }

      entry.posts += 1;

      const metrics = normalized.metrics ?? {};
      const likesMetric = Number(metrics.likes);
      const commentsMetric = Number(metrics.comments);
      const sharesMetric = Number(metrics.shares);
      const savesMetric = Number(metrics.saves);
      const interactionsMetric = Number(metrics.interactions);

      const safeLikes = Number.isFinite(likesMetric) ? Math.max(0, likesMetric) : 0;
      const safeComments = Number.isFinite(commentsMetric)
        ? Math.max(0, commentsMetric)
        : 0;
      const safeShares = Number.isFinite(sharesMetric) ? Math.max(0, sharesMetric) : 0;
      const safeSaves = Number.isFinite(savesMetric) ? Math.max(0, savesMetric) : 0;

      const derivedInteractions = Number.isFinite(interactionsMetric)
        ? Math.max(0, interactionsMetric)
        : safeLikes + safeComments + safeShares + safeSaves;

      entry.likes += safeLikes;
      entry.comments += safeComments;
      entry.interactions += derivedInteractions;
    });
  };

  accumulatePosts(instagramPosts, { platformKey: "instagram", platformLabel: "Instagram" });
  accumulatePosts(tiktokPosts, { platformKey: "tiktok", platformLabel: "TikTok" });

  const series = Array.from(aggregated.values())
    .map((entry) => {
      const interactions = entry.interactions > 0 ? entry.interactions : entry.likes + entry.comments;

      if (entry.posts <= 0 && entry.likes <= 0 && entry.comments <= 0 && interactions <= 0) {
        return null;
      }

      return {
        key: entry.key,
        label: entry.label,
        posts: entry.posts,
        likes: entry.likes,
        comments: entry.comments,
        interactions,
        date: entry.date,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ date: _date, ...rest }) => rest);

  const totals = series.reduce(
    (acc, point) => {
      acc.posts += Math.max(0, Number(point.posts) || 0);
      acc.likes += Math.max(0, Number(point.likes) || 0);
      acc.comments += Math.max(0, Number(point.comments) || 0);
      acc.interactions += Math.max(0, Number(point.interactions) || 0);
      return acc;
    },
    { posts: 0, likes: 0, comments: 0, interactions: 0 },
  );

  return {
    series,
    totals,
    dayCount: series.length,
  };
};

const publishedDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const formatPublishedDate = (value) => {
  const date = ensureValidDate(value);
  return date ? publishedDateFormatter.format(date) : "—";
};

const EMPTY_ACTIVITY = Object.freeze({ likes: [], comments: [] });

const CompletionTooltip = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const data = payload?.[0]?.payload;
  if (!data) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 text-xs text-slate-700 shadow-md">
      <p className="font-semibold text-slate-800">{data.fullDivision}</p>
      <p className="mt-2 text-slate-500">
        Rasio Kelengkapan: {formatPercent(data.completion)}
      </p>
      <p className="text-slate-500">Instagram Lengkap: {formatPercent(data.instagram)}</p>
      <p className="text-slate-500">TikTok Lengkap: {formatPercent(data.tiktok)}</p>
      <p className="mt-1 text-slate-500">
        Total Personil: {formatNumber(data.total, { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
};

const getMonthDateRange = (monthKey) => {
  if (typeof monthKey !== "string") {
    return null;
  }
  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return null;
  }
  const pad = (value) => String(value).padStart(2, "0");
  const startDate = `${year}-${pad(monthIndex + 1)}-01`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const endDate = `${year}-${pad(monthIndex + 1)}-${pad(lastDay)}`;
  return { startDate, endDate };
};

const getPreviousMonthKey = (monthKey) => {
  if (typeof monthKey !== "string") {
    return null;
  }

  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  const nextMonth = month - 1;
  const previousYear = nextMonth >= 1 ? year : year - 1;
  const previousMonth = nextMonth >= 1 ? nextMonth : 12;

  if (!Number.isFinite(previousYear) || previousYear <= 0) {
    return null;
  }

  return `${previousYear}-${String(previousMonth).padStart(2, "0")}`;
};

const normalizePlatformKey = (value, fallback = "") => {
  if (typeof value === "string") {
    const cleaned = value.trim().toLowerCase();
    if (cleaned) {
      return cleaned.replace(/[^a-z0-9]+/g, "-");
    }
  }
  if (fallback) {
    return normalizePlatformKey(fallback);
  }
  return "";
};

const filterRecordsWithResolvableDate = (records, options = {}) => {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.filter((record) => resolveRecordDate(record, options.extraPaths));
};

const filterRecordsByDateRange = (records, range, options = {}) => {
  if (!Array.isArray(records)) {
    return [];
  }

  const startDate = range?.startDate ? parseDateValue(range.startDate) : null;
  const endDate = range?.endDate ? parseDateValue(range.endDate) : null;

  const startTime = startDate
    ? Date.UTC(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
        0,
        0,
        0,
        0,
      )
    : null;
  const endTime = endDate
    ? Date.UTC(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
        23,
        59,
        59,
        999,
      )
    : null;

  const extraPaths = options.extraPaths;

  return records.filter((record) => {
    const resolved = resolveRecordDate(record, extraPaths);
    if (!resolved) {
      return false;
    }

    const timestamp = resolved.parsed.getTime();

    if (startTime !== null && timestamp < startTime) {
      return false;
    }

    if (endTime !== null && timestamp > endTime) {
      return false;
    }

    return true;
  });
};

const ensureArray = (...candidates) => {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (Array.isArray(candidate?.data)) {
      return candidate.data;
    }

    if (Array.isArray(candidate?.items)) {
      return candidate.items;
    }

    if (Array.isArray(candidate?.results)) {
      return candidate.results;
    }

    if (Array.isArray(candidate?.records)) {
      return candidate.records;
    }
  }

  return [];
};

const buildContentDistribution = (posts = []) => {
  if (!Array.isArray(posts) || posts.length === 0) {
    return [];
  }

  const counts = posts.reduce((acc, post) => {
    const key = (post?.type || "Lainnya").trim() || "Lainnya";
    const normalizedKey = key.toLowerCase();
    const nextCount = (acc.get(normalizedKey) ?? 0) + 1;
    acc.set(normalizedKey, nextCount);
    return acc;
  }, new Map());

  const total = posts.length;

  return Array.from(counts.entries()).map(([key, count]) => {
    const label = normalizeContentType(key);
    return {
      key,
      label,
      count,
      share: total > 0 ? (count / total) * 100 : 0,
    };
  });
};

const computeDerivedPostStats = ({
  posts = [],
  aggregatePosts,
  fallbackLikes = 0,
  fallbackComments = 0,
  fallbackPostCount = 0,
} = {}) => {
  const safePosts = Array.isArray(posts) ? posts.filter(Boolean) : [];
  const aggregateCandidates =
    aggregatePosts !== undefined
      ? Array.isArray(aggregatePosts)
        ? aggregatePosts.filter(Boolean)
        : []
      : [];
  const metricsSource =
    aggregateCandidates.length > 0 ? aggregateCandidates : safePosts;

  const totals = metricsSource.reduce(
    (acc, post) => {
      const metrics = post?.metrics || {};
      const likes = Math.max(0, Number(metrics.likes) || 0);
      const comments = Math.max(0, Number(metrics.comments) || 0);
      const shares = Math.max(0, Number(metrics.shares) || 0);
      const saves = Math.max(0, Number(metrics.saves) || 0);
      const interactionsCandidate =
        metrics.interactions !== undefined
          ? Number(metrics.interactions)
          : likes + comments + shares + saves;
      const interactions = Number.isFinite(interactionsCandidate)
        ? Math.max(0, interactionsCandidate)
        : likes + comments + shares + saves;
      const reachCandidate = Number(metrics.reach);
      const engagementCandidate = Number(metrics.engagementRate);

      acc.likes += likes;
      acc.comments += comments;
      acc.interactions += interactions;
      if (Number.isFinite(reachCandidate)) {
        acc.reach += Math.max(0, reachCandidate);
      }
      if (Number.isFinite(engagementCandidate)) {
        acc.engagementRate += Math.max(0, engagementCandidate);
      }
      return acc;
    },
    { likes: 0, comments: 0, interactions: 0, reach: 0, engagementRate: 0 },
  );

  const fallbackLikesTotal = Math.max(0, Number(fallbackLikes) || 0);
  const fallbackCommentsTotal = Math.max(0, Number(fallbackComments) || 0);

  const derivedLikes =
    totals.likes > 0 ? totals.likes : fallbackLikesTotal;
  const derivedComments =
    totals.comments > 0 ? totals.comments : fallbackCommentsTotal;

  const fallbackInteractionsFromPosts =
    totals.likes + totals.comments > 0 ? totals.likes + totals.comments : 0;
  const derivedInteractions =
    totals.interactions > 0
      ? totals.interactions
      : fallbackInteractionsFromPosts > 0
      ? fallbackInteractionsFromPosts
      : derivedLikes + derivedComments;

  const primaryCount = metricsSource.length;
  const secondaryCount = safePosts.length;
  let effectivePostCount =
    primaryCount > 0
      ? primaryCount
      : secondaryCount > 0
      ? secondaryCount
      : 0;
  if (effectivePostCount === 0 && fallbackPostCount > 0) {
    effectivePostCount = fallbackPostCount;
  }

  const averageInteractions =
    effectivePostCount > 0 ? derivedInteractions / effectivePostCount : 0;
  const averageReach =
    primaryCount > 0 ? totals.reach / primaryCount : 0;
  const averageEngagementRate =
    primaryCount > 0 ? totals.engagementRate / primaryCount : 0;

  const distribution = buildContentDistribution(
    metricsSource.length > 0 ? metricsSource : safePosts,
  ).sort((a, b) => b.share - a.share);

  return {
    postCount: effectivePostCount,
    totalInteractions: derivedInteractions,
    averageInteractions,
    averageReach,
    averageEngagementRate,
    totalLikes: derivedLikes,
    totalComments: derivedComments,
    contentTypeDistribution: distribution,
  };
};

const buildWeeklyEngagementTrend = (
  records = [],
  { platformKey = "", platformLabel = "" } = {},
) => {
  const safeRecords = Array.isArray(records)
    ? records.filter((record) => record && typeof record === "object")
    : [];

  const normalizedPosts = safeRecords
    .map((record, index) => {
      const normalized = normalizePlatformPost(record, {
        platformKey,
        platformLabel,
        fallbackIndex: index,
      });

      if (!normalized) {
        return null;
      }

      const resolvedDate = (() => {
        if (record?.activityDate instanceof Date) {
          return record.activityDate;
        }

        const parsedActivityDate = parseDateValue(record?.activityDate);
        if (parsedActivityDate) {
          return parsedActivityDate;
        }

        const parsedTanggal = parseDateValue(record?.tanggal ?? record?.date);
        if (parsedTanggal) {
          return parsedTanggal;
        }

        const parsedTimestamp = parseDateValue(
          record?.createdAt ??
            record?.created_at ??
            record?.timestamp ??
            record?.published_at ??
            null,
        );
        if (parsedTimestamp) {
          return parsedTimestamp;
        }

        if (
          normalized.publishedAt instanceof Date &&
          !Number.isNaN(normalized.publishedAt.valueOf())
        ) {
          return normalized.publishedAt;
        }

        return null;
      })();

      if (!(resolvedDate instanceof Date) || Number.isNaN(resolvedDate.valueOf())) {
        return null;
      }

      return {
        ...normalized,
        activityDate: resolvedDate,
      };
    })
    .filter(Boolean);

  if (normalizedPosts.length === 0) {
    return {
      series: [],
      latestWeek: null,
      previousWeek: null,
      hasRecords: false,
      weeksCount: 0,
      hasAnyPosts: safeRecords.length > 0,
      hasTrendSamples: false,
    };
  }

  const weeklyBuckets = groupRecordsByWeek(normalizedPosts, {
    getDate: (post) => post.activityDate ?? post.publishedAt ?? null,
  });

  if (!Array.isArray(weeklyBuckets) || weeklyBuckets.length === 0) {
    return {
      series: [],
      latestWeek: null,
      previousWeek: null,
      hasRecords: false,
      weeksCount: 0,
      hasAnyPosts: safeRecords.length > 0,
      hasTrendSamples: normalizedPosts.length > 0,
    };
  }

  const weeklySeries = weeklyBuckets.map((bucket) => {
    const totals = bucket.records.reduce(
      (acc, post) => {
        const metrics = post?.metrics ?? {};

        const likes = Number(metrics.likes);
        const comments = Number(metrics.comments);
        const shares = Number(metrics.shares);
        const saves = Number(metrics.saves);

        const interactionsCandidate =
          metrics.interactions !== undefined
            ? Number(metrics.interactions)
            : (Number.isFinite(likes) ? Math.max(0, likes) : 0) +
              (Number.isFinite(comments) ? Math.max(0, comments) : 0) +
              (Number.isFinite(shares) ? Math.max(0, shares) : 0) +
              (Number.isFinite(saves) ? Math.max(0, saves) : 0);

        acc.interactions += Number.isFinite(interactionsCandidate)
          ? Math.max(0, interactionsCandidate)
          : 0;
        acc.likes += Number.isFinite(likes) ? Math.max(0, likes) : 0;
        acc.comments += Number.isFinite(comments) ? Math.max(0, comments) : 0;
        acc.posts += 1;

        return acc;
      },
      {
        interactions: 0,
        posts: 0,
        likes: 0,
        comments: 0,
      },
    );

    return {
      key: bucket.key,
      label: formatWeekRangeLabel(bucket.start, bucket.end),
      interactions: totals.interactions,
      posts: totals.posts,
      likes: totals.likes,
      comments: totals.comments,
    };
  });

  const trimmedSeries = weeklySeries.slice(-8);
  const weeksCount = trimmedSeries.length;

  return {
    series: trimmedSeries,
    latestWeek: weeksCount > 0 ? trimmedSeries[weeksCount - 1] : null,
    previousWeek: weeksCount > 1 ? trimmedSeries[weeksCount - 2] : null,
    hasRecords: weeksCount > 0,
    weeksCount,
    hasAnyPosts: safeRecords.length > 0,
    hasTrendSamples: normalizedPosts.length > 0,
  };
};

const calculateAveragePerContent = (totalLikes = 0, totalPosts = 0) => {
  const safeLikes = Number.isFinite(totalLikes) ? Number(totalLikes) : 0;
  const safePosts = Number.isFinite(totalPosts) ? Number(totalPosts) : 0;

  if (safePosts <= 0) {
    return 0;
  }

  return safeLikes / safePosts;
};

const sanitizeMonthlyValue = (value) => {
  const numeric = normalizeNumericInput(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }

  return Math.max(0, numeric);
};

const resolveAverageFormatOptions = (averageValue = 0) => {
  const safeAverage = Number.isFinite(averageValue) ? Number(averageValue) : 0;

  if (safeAverage <= 0) {
    return { maximumFractionDigits: 0 };
  }

  if (safeAverage < 10) {
    return { maximumFractionDigits: 1, minimumFractionDigits: 1 };
  }

  return { maximumFractionDigits: 0 };
};

const normalizePlatformProfile = (profile, { label = "", followers = 0, posts = 0 } = {}) => {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  const username =
    pickNestedString(profile, ["username", "user_name", "handle", "name", "profile_name"]) ?? undefined;
  const displayName =
    pickNestedString(profile, ["full_name", "name", "display_name", "title"]) ?? undefined;
  const avatarUrl = pickNestedString(profile, [
    "profile_pic_url",
    "profile_picture_url",
    "avatar",
    "avatar_url",
    "picture",
    "image",
  ]);
  const profileFollowers = pickNestedNumeric(profile, [
    "followers",
    "follower_count",
    "followers_count",
    "edge_followed_by.count",
    "fan_count",
  ]);
  const following = pickNestedNumeric(profile, [
    "follows",
    "following",
    "following_count",
    "edge_follow.count",
  ]);
  const bio = pickNestedString(profile, [
    "bio",
    "biography",
    "description",
    "about",
  ]);
  const externalUrl = pickNestedString(profile, [
    "website",
    "external_url",
    "url",
    "link",
  ]);

  return {
    id:
      pickNestedString(profile, [
        "id",
        "pk",
        "profile_id",
        "user_id",
        "account_id",
      ]) ?? null,
    label: displayName || label || username || "Profil",
    username: username ?? null,
    avatarUrl: avatarUrl ?? null,
    followers: profileFollowers || followers || 0,
    following,
    posts: pickNestedNumeric(profile, [
      "media_count",
      "posts",
      "post_count",
      "counts.media",
    ]) || posts || 0,
    bio: bio ?? null,
    externalUrl: externalUrl ?? null,
    raw: profile,
  };
};

const normalizePlatformRecord = (record, fallbackKey = "", fallbackLabel = "") => {
  if (!record || typeof record !== "object") {
    return null;
  }

  const labelSource =
    record.label ?? record.platform ?? record.name ?? fallbackLabel ?? fallbackKey;
  const label =
    typeof labelSource === "string" && labelSource.trim()
      ? labelSource.trim()
      : "Platform";
  const keySource = record.key ?? record.platform ?? record.slug ?? fallbackKey ?? label;
  const key = normalizePlatformKey(keySource, label);

  const followers = pickNestedNumeric(record, [
    "followers",
    "follower_count",
    "followers_count",
    "stats.followers",
    "stats.followerCount",
    "metrics.followers",
    "metrics.follower_count",
    "counts.followers",
    "audience.followers",
    "audience.followers_count",
    "profile.followers",
  ]);

  const posts = pickNestedNumeric(record, [
    "posts",
    "post_count",
    "posts_count",
    "stats.posts",
    "stats.postCount",
    "stats.media_count",
    "metrics.posts",
    "metrics.post_count",
    "counts.posts",
    "content.posts",
  ]);

  const likes = pickNestedNumeric(record, [
    "likes",
    "like_count",
    "likes_count",
    "metrics.likes",
    "metrics.like_count",
    "stats.likes",
    "stats.likeCount",
    "interactions.likes",
  ]);

  const comments = pickNestedNumeric(record, [
    "comments",
    "comment_count",
    "comments_count",
    "metrics.comments",
    "metrics.comment_count",
    "stats.comments",
    "stats.commentCount",
    "interactions.comments",
  ]);

  const engagementRate = pickNestedNumeric(record, [
    "engagementRate",
    "engagement_rate",
    "metrics.engagementRate",
    "metrics.engagement_rate",
    "stats.engagementRate",
    "stats.engagement_rate",
    "engagement.rate",
  ]);

  const shares = {
    followers: pickNestedNumeric(record, [
      "shares.followers",
      "shares.followers_share",
      "sharesFollowers",
      "shareFollowers",
      "share.followers",
    ]),
    likes: pickNestedNumeric(record, [
      "shares.likes",
      "shares.likes_share",
      "sharesLikes",
      "shareLikes",
      "share.likes",
    ]),
    comments: pickNestedNumeric(record, [
      "shares.comments",
      "shares.comments_share",
      "sharesComments",
      "shareComments",
      "share.comments",
    ]),
  };

  const rawPosts = ensureArray(
    record.posts,
    record.content?.posts,
    record.data?.posts,
    record.metrics?.posts,
    record.items,
  );
  const normalizedPosts = rawPosts.map((post, index) =>
    normalizePlatformPost(post, {
      platformKey: key,
      fallbackIndex: index,
      platformLabel: label,
    }),
  ).filter(Boolean);
  const derived = computeDerivedPostStats({
    posts: normalizedPosts,
    fallbackLikes: likes,
    fallbackComments: comments,
    fallbackPostCount: posts,
  });
  const profile = normalizePlatformProfile(record.profile, {
    label,
    followers,
    posts,
  });

  return {
    key,
    sourceKey: keySource ?? key,
    label,
    followers,
    posts,
    likes,
    comments,
    engagementRate,
    shares,
    rawPosts,
    postsData: normalizedPosts,
    derived,
    profile,
  };
};

const buildAggregatorPlatform = ({
  key,
  label,
  profiles = [],
  stats = [],
  posts = [],
}) => {
  const profileSource =
    profiles.find((candidate) => candidate && typeof candidate === "object") ?? null;
  const statsSource =
    stats.find((candidate) => candidate && typeof candidate === "object") ?? null;
  const postsArray = ensureArray(...posts);

  if (!profileSource && !statsSource && postsArray.length === 0) {
    return null;
  }

  const combined = { ...(profileSource ?? {}), ...(statsSource ?? {}) };

  const followers = pickNestedNumeric(combined, [
    "followers",
    "follower_count",
    "followers_count",
    "stats.followers",
    "stats.followerCount",
    "metrics.followers",
    "metrics.follower_count",
    "edge_followed_by.count",
    "fan_count",
  ]);

  const postsFromStats = pickNestedNumeric(combined, [
    "posts",
    "post_count",
    "posts_count",
    "media_count",
    "stats.media_count",
    "stats.postCount",
    "counts.media",
  ]);

  const likes = postsArray.reduce((acc, post) => {
    return (
      acc +
      Math.max(
        0,
        pickNestedNumeric(post, [
          "like_count",
          "likes",
          "statistics.like_count",
          "metrics.like_count",
          "metrics.likes",
        ]),
      )
    );
  }, 0);

  const comments = postsArray.reduce((acc, post) => {
    return (
      acc +
      Math.max(
        0,
        pickNestedNumeric(post, [
          "comment_count",
          "comments",
          "statistics.comment_count",
          "metrics.comment_count",
          "metrics.comments",
        ]),
      )
    );
  }, 0);

  const postCount = postsArray.length > 0 ? postsArray.length : postsFromStats;

  const engagementCandidate = pickNestedNumeric(combined, [
    "engagementRate",
    "engagement_rate",
    "stats.engagementRate",
    "stats.engagement_rate",
    "metrics.engagementRate",
    "metrics.engagement_rate",
  ]);

  const totalInteractions = likes + comments;

  const computedEngagement =
    followers > 0
      ? (totalInteractions / followers) * 100
      : postCount > 0
      ? totalInteractions / postCount
      : 0;
  const normalizedPosts = postsArray
    .map((post, index) =>
      normalizePlatformPost(post, {
        platformKey: key,
        fallbackIndex: index,
        platformLabel: label,
      }),
    )
    .filter(Boolean);
  const derived = computeDerivedPostStats({
    posts: normalizedPosts,
    fallbackLikes: likes,
    fallbackComments: comments,
    fallbackPostCount: postCount,
  });
  const normalizedProfile = normalizePlatformProfile(profileSource, {
    label,
    followers,
    posts: postCount,
  });

  return {
    key,
    sourceKey: key,
    label,
    followers,
    posts: postCount,
    likes,
    comments,
    engagementRate: engagementCandidate || computedEngagement,
    shares: { followers: 0, likes: 0, comments: 0 },
    rawPosts: postsArray,
    postsData: normalizedPosts,
    derived,
    profile: normalizedProfile,
  };
};

const INSTAGRAM_COMMENT_FIELD_PATHS = [
  "jumlah_komentar",
  "jumlahKomentar",
  "total_komentar",
  "totalKomentar",
  "komentar",
  "comments",
  "comment_count",
  "metrics.comments",
  "rekap.jumlah_komentar",
  "rekap.total_komentar",
];

const TIKTOK_LIKE_FIELD_PATHS = [
  "jumlah_like",
  "jumlahLike",
  "total_like",
  "likes",
  "like_count",
  "metrics.likes",
  "rekap.jumlah_like",
  "rekap.total_like",
];

const INSTAGRAM_FOLLOWER_PATHS = [
  "instagramFollowers",
  "instagram_followers",
  "followersInstagram",
  "followers_instagram",
  "total_followers_instagram",
  "totalFollowersInstagram",
  "igFollowers",
  "ig_followers",
  "instagram.followers",
  "instagram.profile.followers",
  "instagram.profile.follower_count",
  "profiles.instagram.followers",
  "profiles.instagram.follower_count",
  "instagramProfile.followers",
  "igProfile.followers",
];

const TIKTOK_FOLLOWER_PATHS = [
  "tiktokFollowers",
  "tiktok_followers",
  "followersTiktok",
  "followers_tiktok",
  "total_followers_tiktok",
  "totalFollowersTiktok",
  "ttFollowers",
  "tt_followers",
  "tiktok.followers",
  "tiktok.profile.followers",
  "tiktok.profile.follower_count",
  "profiles.tiktok.followers",
  "profiles.tiktok.follower_count",
  "tiktokProfile.followers",
  "ttProfile.followers",
];

const INSTAGRAM_USERNAME_PATHS = [
  "instagramUsername",
  "instagram_username",
  "igUsername",
  "ig_username",
  "instagram.profile.username",
  "instagram.profile.user_name",
  "profiles.instagram.username",
  "instagramProfile.username",
  "igProfile.username",
  "instagram.username",
  "ig.username",
];

const TIKTOK_USERNAME_PATHS = [
  "tiktokUsername",
  "tiktok_username",
  "ttUsername",
  "tt_username",
  "tiktok.profile.username",
  "tiktok.profile.user_name",
  "profiles.tiktok.username",
  "tiktokProfile.username",
  "ttProfile.username",
  "tiktok.username",
  "tt.username",
];

const INSTAGRAM_URL_PATHS = [
  "instagramProfileUrl",
  "instagram_profile_url",
  "instagram.profile.url",
  "instagram.profile.profile_url",
  "profiles.instagram.url",
  "profiles.instagram.profile_url",
  "instagramProfile.url",
  "instagramProfile.profileUrl",
  "igProfile.url",
  "igProfile.profileUrl",
  "instagram_url",
  "instagramUrl",
];

const TIKTOK_URL_PATHS = [
  "tiktokProfileUrl",
  "tiktok_profile_url",
  "tiktok.profile.url",
  "tiktok.profile.profile_url",
  "profiles.tiktok.url",
  "profiles.tiktok.profile_url",
  "tiktokProfile.url",
  "tiktokProfile.profileUrl",
  "ttProfile.url",
  "ttProfile.profileUrl",
  "tiktok_url",
  "tiktokUrl",
];

const INSTAGRAM_BIO_PATHS = [
  "instagramBio",
  "instagram_bio",
  "instagram.profile.biography",
  "instagram.profile.bio",
  "profiles.instagram.bio",
  "instagramProfile.bio",
  "igProfile.bio",
  "instagram.bio",
];

const TIKTOK_BIO_PATHS = [
  "tiktokBio",
  "tiktok_bio",
  "tiktok.profile.biography",
  "tiktok.profile.bio",
  "profiles.tiktok.bio",
  "tiktokProfile.bio",
  "ttProfile.bio",
  "tiktok.bio",
];


const monthlyData = {
  "2024-11": {
    monthLabel: "November 2024",
    summaryMetrics: [
      { label: "Total Reach", value: 184320, change: "+8,4%" },
      { label: "Engagement Rate", value: 6.2, suffix: "%", change: "+0,9 pts" },
      { label: "Konten Dipublikasikan", value: 76, change: "-4 konten" },
      { label: "Sentimen Positif", value: 62, suffix: "%", change: "+5 pts" },
    ],
    overviewNarrative:
      "Momentum kampanye pengamanan Nataru menghasilkan peningkatan reach dan engagement lintas kanal, sementara sentimen publik tetap dikelola secara positif.",
    dashboardNarrative:
      "Traffic dashboard menunjukkan lonjakan impresi sebesar 8% dibanding bulan sebelumnya, dipicu oleh konten sinergi pengamanan libur panjang dan quick response terhadap isu lalu lintas.",
    userInsightNarrative:
      "83% personil  aktif melakukan monitoring harian dan 61% di antaranya memanfaatkan fitur alert. Divisi Humas tetap menjadi kontributor utama percakapan dengan pertumbuhan partisipasi 6%.",
    instagramNarrative:
      "Instagram fokus pada storytelling humanis. Konten carousel edukasi keselamatan meraih reach tertinggi dengan 7,4% engagement rate dan menyumbang 31% dari total interaksi.",
    tiktokNarrative:
      "Tiktok menonjolkan konten video cepat seputar himbauan lalu lintas. Format duet dengan influencer lokal menaikkan completion rate hingga 68% dan memperluas jangkauan Gen-Z.",
    engagementByChannel: [
      { channel: "Instagram", reach: 112300, engagementRate: 7.4 },
      { channel: "TikTok", reach: 54020, engagementRate: 6.1 },
    ],
    audienceComposition: [
      { name: "Masyarakat Umum", value: 52 },
      { name: "Komunitas Lokal", value: 23 },
      { name: "Media", value: 15 },
      { name: "Internal", value: 10 },
    ],
    highlights: [
      "Kampanye #OperasiLilin2024 mendominasi percakapan positif selama 10 hari berturut-turut.",
      "Respons cepat terhadap isu kemacetan arus balik menjaga sentimen negatif di bawah 12%.",
      "Pemanfaatan fitur Q&A Instagram Live meningkatkan partisipasi komunitas hingga 18%.",
    ],
    userInsightMetrics: [
      { label: "Personil Aktif Harian", value: 1230, change: "+6%" },
      { label: "Alert Ditindaklanjuti", value: 214, change: "+12%" },
      { label: "Respons Rata-rata", value: 37, suffix: "mnt", change: "-9 mnt" },
    ],
    contentTable: [
      {
        platform: "Instagram",
        title: "Carousel Edukasi Keselamatan Nataru",
        format: "Carousel",
        reach: 48760,
        engagement: 7.4,
        takeaway: "Sorotan humanis keluarga petugas meningkatkan share",
      },
      {
        platform: "Instagram",
        title: "Reel Patroli Gabungan",
        format: "Reel",
        reach: 39210,
        engagement: 6.8,
        takeaway: "Cut-to-action cepat menjaga retention di atas 65%",
      },
      {
        platform: "TikTok",
        title: "Duet Influencer Himbauan Mudik",
        format: "Video",
        reach: 28940,
        engagement: 6.1,
        takeaway: "Kolaborasi lokal memperluas jangkauan Gen-Z",
      },
      {
        platform: "TikTok",
        title: "Tips Cek Kendaraan Sebelum Perjalanan",
        format: "Video",
        reach: 25110,
        engagement: 5.6,
        takeaway: "Format checklist visual memudahkan pemahaman",
      },
    ],
    platformAnalytics: {
      platforms: [
        {
          key: "instagram",
          label: "Instagram",
          followers: 86500,
          posts: 42,
          likes: 45230,
          comments: 5280,
          engagementRate: 7.4,
          shares: { followers: 52, likes: 58, comments: 61 },
          derived: {
            totalInteractions: 50510,
            averageInteractions: 1203,
            averageReach: 43780,
            averageEngagementRate: 7.4,
            contentTypeDistribution: [
              { key: "carousel", label: "Carousel", share: 40, count: 17 },
              { key: "reels", label: "Reels", share: 36, count: 15 },
              { key: "single", label: "Single Image", share: 24, count: 10 },
            ],
          },
          profile: {
            username: "ditbinmasjatim",
            followers: 86500,
            posts: 42,
            externalUrl: "https://www.instagram.com/ditbinmasjatim",
            bio: "Membangun partisipasi publik melalui edukasi keamanan dan ketertiban masyarakat.",
          },
          postsData: [
            {
              id: "ig-nov-1",
              title: "Carousel Edukasi Keselamatan Nataru",
              type: "Carousel",
              permalink: "https://instagram.com/p/ig-nov-1",
              publishedAt: new Date("2024-11-04T08:00:00+07:00"),
              metrics: {
                likes: 18230,
                comments: 1460,
                shares: 860,
                saves: 540,
                reach: 48760,
                views: 0,
                engagementRate: 7.4,
                interactions: 21090,
              },
            },
            {
              id: "ig-nov-2",
              title: "Reel Patroli Gabungan",
              type: "Reel",
              permalink: "https://instagram.com/p/ig-nov-2",
              publishedAt: new Date("2024-11-16T09:30:00+07:00"),
              metrics: {
                likes: 15010,
                comments: 960,
                shares: 540,
                saves: 620,
                reach: 39210,
                views: 86500,
                engagementRate: 6.8,
                interactions: 17130,
              },
            },
            {
              id: "ig-nov-3",
              title: "Live Update Operasi Nataru",
              type: "Live",
              permalink: "https://instagram.com/p/ig-nov-3",
              publishedAt: new Date("2024-11-21T19:00:00+07:00"),
              metrics: {
                likes: 11990,
                comments: 780,
                shares: 460,
                saves: 380,
                reach: 35400,
                views: 68400,
                engagementRate: 6.5,
                interactions: 13610,
              },
            },
          ],
        },
        {
          key: "tiktok",
          label: "TikTok",
          followers: 53800,
          posts: 34,
          likes: 38800,
          comments: 4100,
          engagementRate: 6.1,
          shares: { followers: 32, likes: 37, comments: 35 },
          derived: {
            totalInteractions: 42900,
            averageInteractions: 1262,
            averageReach: 31540,
            averageEngagementRate: 6.1,
            contentTypeDistribution: [
              { key: "video", label: "Video Edukatif", share: 44, count: 15 },
              { key: "challenge", label: "Challenge", share: 32, count: 11 },
              { key: "live", label: "Live Update", share: 24, count: 8 },
            ],
          },
          profile: {
            username: "ditbinmasjatim",
            followers: 53800,
            posts: 34,
            externalUrl: "https://www.tiktok.com/@ditbinmasjatim",
            bio: "Konten cepat tentang himbauan lalu lintas dan keamanan lingkungan.",
          },
          postsData: [
            {
              id: "tt-nov-1",
              title: "Duet Influencer Himbauan Mudik",
              type: "Video",
              permalink: "https://www.tiktok.com/@ditbinmasjatim/video/tt-nov-1",
              publishedAt: new Date("2024-11-07T10:00:00+07:00"),
              metrics: {
                likes: 14300,
                comments: 1280,
                shares: 690,
                saves: 410,
                reach: 28940,
                views: 96500,
                engagementRate: 6.1,
                interactions: 16680,
              },
            },
            {
              id: "tt-nov-2",
              title: "Tips Cek Kendaraan Sebelum Perjalanan",
              type: "Video",
              permalink: "https://www.tiktok.com/@ditbinmasjatim/video/tt-nov-2",
              publishedAt: new Date("2024-11-18T14:15:00+07:00"),
              metrics: {
                likes: 11840,
                comments: 940,
                shares: 520,
                saves: 360,
                reach: 25110,
                views: 81200,
                engagementRate: 5.6,
                interactions: 13660,
              },
            },
            {
              id: "tt-nov-3",
              title: "Quick Response Info Kemacetan",
              type: "Live",
              permalink: "https://www.tiktok.com/@ditbinmasjatim/video/tt-nov-3",
              publishedAt: new Date("2024-11-23T20:45:00+07:00"),
              metrics: {
                likes: 12660,
                comments: 880,
                shares: 470,
                saves: 320,
                reach: 22540,
                views: 75400,
                engagementRate: 5.9,
                interactions: 14330,
              },
            },
          ],
        },
      ],
    },
  },
  "2024-10": {
    monthLabel: "Oktober 2024",
    summaryMetrics: [
      { label: "Total Reach", value: 169520, change: "+3,1%" },
      { label: "Engagement Rate", value: 5.3, suffix: "%", change: "-0,4 pts" },
      { label: "Konten Dipublikasikan", value: 82, change: "+7 konten" },
      { label: "Sentimen Positif", value: 57, suffix: "%", change: "+2 pts" },
    ],
    overviewNarrative:
      "Penetrasi program Bulan Tertib Berlalu Lintas memperluas awareness, namun engagement sedikit menurun karena penurunan interaksi video panjang.",
    dashboardNarrative:
      "Panel dashboard memperlihatkan pertumbuhan reach 3% dan dominasi trafik mobile sebesar 92%, menandakan konsumsi konten mayoritas terjadi di perjalanan.",
    userInsightNarrative:
      "Adopsi fitur scheduling meningkat 14% seiring koordinasi antar divisi. Sebanyak 76% personil konsisten menutup laporan harian tepat waktu.",
    instagramNarrative:
      "Instagram fokus pada edukasi visual. Postingan infografik rawan kecelakaan menjadi konten dengan save tertinggi dan menjaga engagement stabil.",
    tiktokNarrative:
      "TikTok mengeksplorasi format behind-the-scene operasi lapangan. Walau watch time stabil, call-to-action belum maksimal sehingga engagement turun tipis.",
    engagementByChannel: [
      { channel: "Instagram", reach: 102400, engagementRate: 6.1 },
      { channel: "TikTok", reach: 46300, engagementRate: 5.2 },
    ],
    audienceComposition: [
      { name: "Masyarakat Umum", value: 49 },
      { name: "Komunitas Lokal", value: 25 },
      { name: "Media", value: 14 },
      { name: "Internal", value: 12 },
    ],
    highlights: [
      "Program live report pengaturan lalu lintas mendapat 3,4 ribu komentar positif.",
      "Penguatan cross-posting IG Stories ke TikTok meningkatkan traffic silang 11%.",
      "Kolaborasi dengan Dishub memperbanyak mention organik.",
    ],
    userInsightMetrics: [
      { label: "Personil Aktif Harian", value: 1160, change: "+4%" },
      { label: "Alert Ditindaklanjuti", value: 191, change: "+5%" },
      { label: "Respons Rata-rata", value: 42, suffix: "mnt", change: "-4 mnt" },
    ],
    contentTable: [
      {
        platform: "Instagram",
        title: "Infografik Rawan Kecelakaan",
        format: "Infografik",
        reach: 42110,
        engagement: 6.3,
        takeaway: "CTA simpan peta meningkatkan saves 23%",
      },
      {
        platform: "Instagram",
        title: "Reel Testimoni Pemudik",
        format: "Reel",
        reach: 34780,
        engagement: 5.9,
        takeaway: "Kutipan nyata menjaga komentar positif",
      },
      {
        platform: "TikTok",
        title: "Behind the Scene Operasi Zebra",
        format: "Video",
        reach: 26140,
        engagement: 5.1,
        takeaway: "Butuh CTA jelas untuk arahkan traffic lanjutan",
      },
      {
        platform: "TikTok",
        title: "Tips Aman Berkendara Malam",
        format: "Video",
        reach: 23810,
        engagement: 4.8,
        takeaway: "Durasi 45 detik sedikit menurunkan completion",
      },
    ],
    platformAnalytics: {
      platforms: [
        {
          key: "instagram",
          label: "Instagram",
          followers: 84200,
          posts: 45,
          likes: 39820,
          comments: 4620,
          engagementRate: 6.1,
          shares: { followers: 51, likes: 55, comments: 58 },
          derived: {
            totalInteractions: 44440,
            averageInteractions: 988,
            averageReach: 36240,
            averageEngagementRate: 6.1,
            contentTypeDistribution: [
              { key: "reels", label: "Reels", share: 40, count: 18 },
              { key: "infografik", label: "Infografik", share: 36, count: 16 },
              { key: "live", label: "Live", share: 24, count: 11 },
            ],
          },
          profile: {
            username: "ditbinmasjatim",
            followers: 84200,
            posts: 45,
            externalUrl: "https://www.instagram.com/ditbinmasjatim",
            bio: "Konten edukasi visual dan update lapangan Ditbinmas Polda Jatim.",
          },
          postsData: [
            {
              id: "ig-oct-1",
              title: "Infografik Rawan Kecelakaan",
              type: "Infografik",
              permalink: "https://instagram.com/p/ig-oct-1",
              publishedAt: new Date("2024-10-08T09:00:00+07:00"),
              metrics: {
                likes: 16320,
                comments: 1120,
                shares: 680,
                saves: 540,
                reach: 42110,
                views: 0,
                engagementRate: 6.3,
                interactions: 18660,
              },
            },
            {
              id: "ig-oct-2",
              title: "Reel Testimoni Pemudik",
              type: "Reel",
              permalink: "https://instagram.com/p/ig-oct-2",
              publishedAt: new Date("2024-10-18T10:30:00+07:00"),
              metrics: {
                likes: 13240,
                comments: 870,
                shares: 420,
                saves: 460,
                reach: 34780,
                views: 78400,
                engagementRate: 5.9,
                interactions: 14990,
              },
            },
            {
              id: "ig-oct-3",
              title: "Live Report Pengaturan Lalin",
              type: "Live",
              permalink: "https://instagram.com/p/ig-oct-3",
              publishedAt: new Date("2024-10-25T19:15:00+07:00"),
              metrics: {
                likes: 10260,
                comments: 620,
                shares: 360,
                saves: 210,
                reach: 31220,
                views: 54600,
                engagementRate: 5.1,
                interactions: 11450,
              },
            },
          ],
        },
        {
          key: "tiktok",
          label: "TikTok",
          followers: 49800,
          posts: 31,
          likes: 30100,
          comments: 3680,
          engagementRate: 5.2,
          shares: { followers: 30, likes: 33, comments: 30 },
          derived: {
            totalInteractions: 33780,
            averageInteractions: 1090,
            averageReach: 29840,
            averageEngagementRate: 5.2,
            contentTypeDistribution: [
              { key: "video", label: "Video Edukatif", share: 42, count: 13 },
              { key: "behind the scene", label: "Behind the Scene", share: 35, count: 11 },
              { key: "challenge", label: "Challenge", share: 23, count: 7 },
            ],
          },
          profile: {
            username: "ditbinmasjatim",
            followers: 49800,
            posts: 31,
            externalUrl: "https://www.tiktok.com/@ditbinmasjatim",
            bio: "Sorotan cepat aktivitas lapangan Binmas Polda Jatim.",
          },
          postsData: [
            {
              id: "tt-oct-1",
              title: "Behind the Scene Operasi Zebra",
              type: "Video",
              permalink: "https://www.tiktok.com/@ditbinmasjatim/video/tt-oct-1",
              publishedAt: new Date("2024-10-06T11:20:00+07:00"),
              metrics: {
                likes: 11200,
                comments: 890,
                shares: 520,
                saves: 340,
                reach: 26140,
                views: 73200,
                engagementRate: 5.1,
                interactions: 12950,
              },
            },
            {
              id: "tt-oct-2",
              title: "Tips Aman Berkendara Malam",
              type: "Video",
              permalink: "https://www.tiktok.com/@ditbinmasjatim/video/tt-oct-2",
              publishedAt: new Date("2024-10-17T21:00:00+07:00"),
              metrics: {
                likes: 9860,
                comments: 740,
                shares: 410,
                saves: 290,
                reach: 23810,
                views: 64800,
                engagementRate: 4.8,
                interactions: 11300,
              },
            },
            {
              id: "tt-oct-3",
              title: "Live Report Penjagaan Simpang",
              type: "Live",
              permalink: "https://www.tiktok.com/@ditbinmasjatim/video/tt-oct-3",
              publishedAt: new Date("2024-10-27T18:40:00+07:00"),
              metrics: {
                likes: 9050,
                comments: 1120,
                shares: 380,
                saves: 260,
                reach: 24360,
                views: 59800,
                engagementRate: 5.0,
                interactions: 10810,
              },
            },
          ],
        },
      ],
    },
  },
  "2024-09": {
    monthLabel: "September 2024",
    summaryMetrics: [
      { label: "Total Reach", value: 164420, change: "-5,2%" },
      { label: "Engagement Rate", value: 5.7, suffix: "%", change: "+0,3 pts" },
      { label: "Konten Dipublikasikan", value: 68, change: "-6 konten" },
      { label: "Sentimen Positif", value: 54, suffix: "%", change: "-1 pt" },
    ],
    overviewNarrative:
      "Transisi menuju fokus akhir tahun membuat volume konten lebih selektif, namun kualitas engagement tetap terjaga oleh kampanye keselamatan komunitas.",
    dashboardNarrative:
      "Dashboard menunjukkan trafik menurun 5%, didominasi jam sibuk pagi. Pengguna mengkonsumsi konten ringkas sehingga bounce rate turun ke 28%.",
    userInsightNarrative:
      "Pemanfaatan fitur knowledge base meningkat 21% dengan 312 pencarian internal. Hal ini membantu standar jawaban konsisten antar admin.",
    instagramNarrative:
      "Instagram mengedepankan konten komunitas. Live IG bersama relawan lalu lintas memicu lonjakan komentar dan pertanyaan relevan.",
    tiktokNarrative:
      "TikTok menerapkan format challenge #AmanBerkendara yang diikuti 480 user-generated content, menambah 4,6 ribu pengikut baru.",
    engagementByChannel: [
      { channel: "Instagram", reach: 96410, engagementRate: 5.9 },
      { channel: "TikTok", reach: 41120, engagementRate: 5.4 },
    ],
    audienceComposition: [
      { name: "Masyarakat Umum", value: 47 },
      { name: "Komunitas Lokal", value: 27 },
      { name: "Media", value: 13 },
      { name: "Internal", value: 13 },
    ],
    highlights: [
      "UGC challenge #AmanBerkendara menghasilkan 8,7 ribu mention organik.",
      "Program literasi lalu lintas sekolah menumbuhkan follower baru 6%.",
      "Sentimen negatif muncul dari isu kemacetan lokal dan telah tertangani.",
    ],
    userInsightMetrics: [
      { label: "Personil Aktif Harian", value: 1085, change: "+3%" },
      { label: "Alert Ditindaklanjuti", value: 176, change: "+8%" },
      { label: "Respons Rata-rata", value: 48, suffix: "mnt", change: "-2 mnt" },
    ],
    contentTable: [
      {
        platform: "Instagram",
        title: "Live Relawan Lalu Lintas",
        format: "Live",
        reach: 38240,
        engagement: 6.1,
        takeaway: "Kolaborasi komunitas meningkatkan pertanyaan edukatif",
      },
      {
        platform: "Instagram",
        title: "Carousel Tips Aman Konvoi",
        format: "Carousel",
        reach: 33110,
        engagement: 5.7,
        takeaway: "Checklist visual memicu simpan konten",
      },
      {
        platform: "TikTok",
        title: "Challenge #AmanBerkendara",
        format: "Video",
        reach: 28490,
        engagement: 5.4,
        takeaway: "UGC memperluas jangkauan komunitas",
      },
      {
        platform: "TikTok",
        title: "Quick Tips Lampu Hazard",
        format: "Video",
        reach: 23980,
        engagement: 4.9,
        takeaway: "Format 30 detik ideal untuk edukasi singkat",
      },
    ],
    platformAnalytics: {
      platforms: [
        {
          key: "instagram",
          label: "Instagram",
          followers: 82300,
          posts: 38,
          likes: 35240,
          comments: 4180,
          engagementRate: 5.9,
          shares: { followers: 49, likes: 53, comments: 57 },
          derived: {
            totalInteractions: 39420,
            averageInteractions: 1038,
            averageReach: 33680,
            averageEngagementRate: 5.9,
            contentTypeDistribution: [
              { key: "carousel", label: "Carousel", share: 37, count: 14 },
              { key: "foto", label: "Foto", share: 37, count: 14 },
              { key: "live", label: "Live", share: 26, count: 10 },
            ],
          },
          profile: {
            username: "ditbinmasjatim",
            followers: 82300,
            posts: 38,
            externalUrl: "https://www.instagram.com/ditbinmasjatim",
            bio: "Cerita komunitas dan edukasi keselamatan berlalu lintas.",
          },
          postsData: [
            {
              id: "ig-sep-1",
              title: "Live Relawan Lalu Lintas",
              type: "Live",
              permalink: "https://instagram.com/p/ig-sep-1",
              publishedAt: new Date("2024-09-05T19:30:00+07:00"),
              metrics: {
                likes: 14200,
                comments: 980,
                shares: 520,
                saves: 310,
                reach: 38240,
                views: 61200,
                engagementRate: 6.1,
                interactions: 16010,
              },
            },
            {
              id: "ig-sep-2",
              title: "Carousel Tips Aman Konvoi",
              type: "Carousel",
              permalink: "https://instagram.com/p/ig-sep-2",
              publishedAt: new Date("2024-09-14T09:10:00+07:00"),
              metrics: {
                likes: 12980,
                comments: 760,
                shares: 430,
                saves: 280,
                reach: 33110,
                views: 0,
                engagementRate: 5.7,
                interactions: 14450,
              },
            },
            {
              id: "ig-sep-3",
              title: "Foto Edukasi Sekolah",
              type: "Foto",
              permalink: "https://instagram.com/p/ig-sep-3",
              publishedAt: new Date("2024-09-24T08:45:00+07:00"),
              metrics: {
                likes: 8040,
                comments: 460,
                shares: 290,
                saves: 200,
                reach: 28620,
                views: 0,
                engagementRate: 5.3,
                interactions: 8990,
              },
            },
          ],
        },
        {
          key: "tiktok",
          label: "TikTok",
          followers: 46200,
          posts: 29,
          likes: 28940,
          comments: 3520,
          engagementRate: 5.4,
          shares: { followers: 28, likes: 34, comments: 33 },
          derived: {
            totalInteractions: 32460,
            averageInteractions: 1120,
            averageReach: 28650,
            averageEngagementRate: 5.4,
            contentTypeDistribution: [
              { key: "challenge", label: "Challenge", share: 38, count: 11 },
              { key: "video", label: "Video Edukatif", share: 34, count: 10 },
              { key: "live", label: "Live", share: 28, count: 8 },
            ],
          },
          profile: {
            username: "ditbinmasjatim",
            followers: 46200,
            posts: 29,
            externalUrl: "https://www.tiktok.com/@ditbinmasjatim",
            bio: "Tantangan dan edukasi singkat seputar keamanan berkendara.",
          },
          postsData: [
            {
              id: "tt-sep-1",
              title: "Challenge #AmanBerkendara",
              type: "Video",
              permalink: "https://www.tiktok.com/@ditbinmasjatim/video/tt-sep-1",
              publishedAt: new Date("2024-09-07T10:20:00+07:00"),
              metrics: {
                likes: 11980,
                comments: 950,
                shares: 680,
                saves: 420,
                reach: 28490,
                views: 84500,
                engagementRate: 5.4,
                interactions: 14030,
              },
            },
            {
              id: "tt-sep-2",
              title: "Quick Tips Lampu Hazard",
              type: "Video",
              permalink: "https://www.tiktok.com/@ditbinmasjatim/video/tt-sep-2",
              publishedAt: new Date("2024-09-16T16:50:00+07:00"),
              metrics: {
                likes: 10120,
                comments: 720,
                shares: 410,
                saves: 260,
                reach: 23980,
                views: 69200,
                engagementRate: 4.9,
                interactions: 11510,
              },
            },
            {
              id: "tt-sep-3",
              title: "UGC Komunitas Sekolah",
              type: "Live",
              permalink: "https://www.tiktok.com/@ditbinmasjatim/video/tt-sep-3",
              publishedAt: new Date("2024-09-25T19:30:00+07:00"),
              metrics: {
                likes: 8850,
                comments: 640,
                shares: 360,
                saves: 240,
                reach: 22350,
                views: 57400,
                engagementRate: 5.2,
                interactions: 10090,
              },
            },
          ],
        },
      ],
    },
  },
};

const PIE_COLORS = ["#22d3ee", "#6366f1", "#fbbf24", "#f43f5e"];
const SATKER_PIE_COLORS = [
  "#38bdf8",
  "#22d3ee",
  "#818cf8",
  "#f472b6",
  "#f97316",
  "#22c55e",
  "#a855f7",
];
const MIN_SELECTABLE_YEAR = 2025;
const MAX_SELECTABLE_YEAR = 2035;
export default function ExecutiveSummaryPage() {
  useRequireAuth();
  const router = useRouter();
  const { token, clientId, role } = useAuth();
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (clientId === null || role === null) {
      setIsAuthorized(false);
      setIsCheckingAccess(true);
      return;
    }

    const normalizedClientId = clientId?.toLowerCase();
    const normalizedRole = role?.toLowerCase();
    const allowed =
      normalizedClientId === "ditbinmas" && normalizedRole === "ditbinmas";

    if (!allowed) {
      router.replace("/dashboard");
    }

    setIsAuthorized(allowed);
    setIsCheckingAccess(false);
  }, [clientId, role, router]);
  const availableYears = useMemo(() => {
    return Object.keys(monthlyData)
      .map((key) => extractYearFromMonthKey(key))
      .filter((year) => Number.isFinite(year));
  }, []);
  const resolvedYear = useMemo(() => {
    if (availableYears.length > 0) {
      return Math.max(...availableYears);
    }
    return new Date().getFullYear();
  }, [availableYears]);
  const monthOptions = useMemo(() => {
    return mergeAvailableMonthOptions({ availableYears, locale: "id-ID" });
  }, [availableYears]);
  const defaultSelectedMonth = useMemo(() => {
    const now = new Date();
    const currentMonthKey = buildMonthKey(now.getFullYear(), now.getMonth());
    const hasCuratedData = (data) =>
      Array.isArray(data?.platformAnalytics?.platforms) &&
      data.platformAnalytics.platforms.length > 0;

    const monthOptionKeys = new Set(monthOptions.map((option) => option.key));
    const currentMonthHasOption = monthOptionKeys.has(currentMonthKey);

    if (currentMonthHasOption && hasCuratedData(monthlyData[currentMonthKey])) {
      return currentMonthKey;
    }

    const availableDataKeys = Object.keys(monthlyData)
      .filter((key) => monthOptionKeys.has(key))
      .sort()
      .reverse();

    for (const key of availableDataKeys) {
      if (hasCuratedData(monthlyData[key])) {
        return key;
      }
    }

    if (currentMonthHasOption) {
      return currentMonthKey;
    }

    return monthOptions[0]?.key ?? currentMonthKey;
  }, [monthOptions]);
  const yearOptions = useMemo(() => {
    return Array.from(
      { length: MAX_SELECTABLE_YEAR - MIN_SELECTABLE_YEAR + 1 },
      (_, index) => MIN_SELECTABLE_YEAR + index,
    );
  }, []);
  const defaultSelection = useMemo(() => {
    const now = new Date();
    const fallbackYear = clamp(
      now.getFullYear(),
      MIN_SELECTABLE_YEAR,
      MAX_SELECTABLE_YEAR,
    );
    const fallbackMonthIndex = clamp(now.getMonth(), 0, 11);

    if (typeof defaultSelectedMonth !== "string") {
      return {
        year: fallbackYear,
        monthIndex: fallbackMonthIndex,
      };
    }

    const [yearPart, monthPart] = defaultSelectedMonth.split("-");
    const parsedYear = Number.parseInt(yearPart, 10);
    const parsedMonth = Number.parseInt(monthPart, 10) - 1;

    const normalizedYear = clamp(
      Number.isFinite(parsedYear) ? parsedYear : fallbackYear,
      MIN_SELECTABLE_YEAR,
      MAX_SELECTABLE_YEAR,
    );
    const normalizedMonthIndex = clamp(
      Number.isFinite(parsedMonth) ? parsedMonth : fallbackMonthIndex,
      0,
      11,
    );

    return {
      year: normalizedYear,
      monthIndex: normalizedMonthIndex,
    };
  }, [defaultSelectedMonth]);
  const [selectedYear, setSelectedYear] = useState(defaultSelection.year);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(
    defaultSelection.monthIndex,
  );
  useEffect(() => {
    setSelectedYear((previous) => {
      if (previous === defaultSelection.year) {
        return previous;
      }
      return clamp(
        defaultSelection.year,
        MIN_SELECTABLE_YEAR,
        MAX_SELECTABLE_YEAR,
      );
    });
    setSelectedMonthIndex((previous) => {
      if (previous === defaultSelection.monthIndex) {
        return previous;
      }
      return clamp(defaultSelection.monthIndex, 0, 11);
    });
  }, [defaultSelection.monthIndex, defaultSelection.year]);
  const selectedMonthKey = useMemo(() => {
    return buildMonthKey(selectedYear, selectedMonthIndex);
  }, [selectedMonthIndex, selectedYear]);
  const selectedMonthOption = useMemo(() => {
    return (
      monthOptions.find((option) => option.key === selectedMonthKey) ?? null
    );
  }, [monthOptions, selectedMonthKey]);
  const filteredMonthOptions = useMemo(() => {
    return monthOptions.filter(
      (option) => extractYearFromMonthKey(option.key) === selectedYear,
    );
  }, [monthOptions, selectedYear]);
  const monthDropdownOptions = useMemo(() => {
    const monthFormatter = new Intl.DateTimeFormat("id-ID", { month: "long" });
    const availableKeys = new Set(filteredMonthOptions.map((option) => option.key));

    return Array.from({ length: 12 }, (_, index) => {
      const key = buildMonthKey(selectedYear, index);
      return {
        key,
        label: monthFormatter.format(new Date(selectedYear, index, 1)),
        monthIndex: index,
        isAvailable: availableKeys.has(key),
      };
    });
  }, [filteredMonthOptions, selectedYear]);
  useEffect(() => {
    if (filteredMonthOptions.length === 0) {
      return;
    }

    const availableIndexes = filteredMonthOptions
      .map((option) => {
        const [, monthPart] = option.key.split("-");
        const parsedMonth = Number.parseInt(monthPart, 10);
        if (!Number.isFinite(parsedMonth)) {
          return null;
        }
        return clamp(parsedMonth - 1, 0, 11);
      })
      .filter((indexValue) => typeof indexValue === "number")
      .sort((a, b) => a - b);

    if (availableIndexes.length === 0) {
      return;
    }

    if (availableIndexes.includes(selectedMonthIndex)) {
      return;
    }

    const fallbackIndex = availableIndexes[availableIndexes.length - 1];
    setSelectedMonthIndex(fallbackIndex);
  }, [filteredMonthOptions, selectedMonthIndex]);
  const selectedMonthLabel = useMemo(() => {
    if (selectedMonthOption?.label) {
      return selectedMonthOption.label;
    }

    const formatter = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    });
    return formatter.format(new Date(selectedYear, selectedMonthIndex, 1));
  }, [selectedMonthIndex, selectedMonthOption, selectedYear]);
  const selectedMonthName = useMemo(() => {
    if (!Number.isFinite(selectedMonthIndex) || !Number.isFinite(selectedYear)) {
      return "";
    }

    const formatter = new Intl.DateTimeFormat("id-ID", { month: "long" });
    const safeIndex = clamp(selectedMonthIndex, 0, 11);
    const displayDate = new Date(selectedYear, safeIndex, 1);

    if (Number.isNaN(displayDate.getTime())) {
      return "";
    }

    return formatter.format(displayDate);
  }, [selectedMonthIndex, selectedYear]);
  const selectedYearLabel = useMemo(() => {
    return Number.isFinite(selectedYear) ? String(selectedYear) : "";
  }, [selectedYear]);
  const [userInsightState, setUserInsightState] = useState({
    loading: true,
    error: "",
    summary: null,
    completionBarData: [],
    lowestCompletionDivisions: [],
    pieData: [],
    pieTotal: 0,
    divisionComposition: [],
    divisionCompositionTotal: 0,
    divisionDistribution: [],
    narrative: "",
    activityBuckets: null,
  });
  const [platformState, setPlatformState] = useState({
    loading: true,
    error: "",
    likesSummary: createEmptyLikesSummary(),
    activity: { likes: [], comments: [] },
    trendActivity: { likes: [], comments: [] },
    posts: { instagram: [], tiktok: [] },
    previousLikesSummary: null,
    previousPostTotals: null,
    previousPeriodLabel: "",
  });

  const rawMonthlyData = monthlyData[selectedMonthKey];
  const fallbackMonthLabel =
    rawMonthlyData?.monthLabel ??
    selectedMonthLabel ??
    (selectedMonthKey ? selectedMonthKey : "Periode Tidak Tersedia");
  const defaultMonthlyEntry = {
    monthLabel: fallbackMonthLabel,
    overviewNarrative: "Belum ada ringkasan kinerja untuk periode ini.",
    summaryMetrics: [],
    highlights: [],
    engagementByChannel: [],
    audienceComposition: [],
    contentTable: [],
    dashboardNarrative: "Belum ada narasi dashboard untuk periode ini.",
    userInsightNarrative: "Belum ada insight pengguna untuk periode ini.",
    instagramNarrative: "Belum ada ringkasan Instagram untuk periode ini.",
    tiktokNarrative: "Belum ada ringkasan TikTok untuk periode ini.",
    platformAnalytics: { platforms: [] },
  };
  const data = {
    ...defaultMonthlyEntry,
    ...(rawMonthlyData ?? {}),
    monthLabel: rawMonthlyData?.monthLabel ?? defaultMonthlyEntry.monthLabel,
    summaryMetrics: Array.isArray(rawMonthlyData?.summaryMetrics)
      ? rawMonthlyData.summaryMetrics
      : defaultMonthlyEntry.summaryMetrics,
    highlights: Array.isArray(rawMonthlyData?.highlights)
      ? rawMonthlyData.highlights
      : defaultMonthlyEntry.highlights,
    engagementByChannel: Array.isArray(rawMonthlyData?.engagementByChannel)
      ? rawMonthlyData.engagementByChannel
      : defaultMonthlyEntry.engagementByChannel,
    audienceComposition: Array.isArray(rawMonthlyData?.audienceComposition)
      ? rawMonthlyData.audienceComposition
      : defaultMonthlyEntry.audienceComposition,
    contentTable: Array.isArray(rawMonthlyData?.contentTable)
      ? rawMonthlyData.contentTable
      : defaultMonthlyEntry.contentTable,
    platformAnalytics:
      Array.isArray(rawMonthlyData?.platformAnalytics?.platforms)
        ? rawMonthlyData.platformAnalytics
        : defaultMonthlyEntry.platformAnalytics,
  };

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const loadUserInsight = async () => {
      if (!token || !clientId) {
        setUserInsightState((prev) => ({
          ...prev,
          loading: false,
          error: prev.error || "",
          activityBuckets: null,
        }));
        setPlatformState({
          loading: false,
          error: "",
          platforms: [],
          profiles: { byKey: {} },
          activity: { likes: [], comments: [] },
          trendActivity: { likes: [], comments: [] },
          likesSummary: createEmptyLikesSummary(),
          posts: { instagram: [], tiktok: [] },
          previousLikesSummary: null,
          previousPostTotals: null,
          previousPeriodLabel: "",
        });
        return;
      }

      setUserInsightState((prev) => ({
        ...prev,
        loading: true,
        error: "",
        activityBuckets: null,
      }));
      setPlatformState((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));

      const periodRange = getMonthDateRange(selectedMonthKey);
      const periodeParam = periodRange ? "bulanan" : undefined;
      const tanggalParam = periodRange?.startDate;
      const startDateParam = periodRange?.startDate;
      const endDateParam = periodRange?.endDate;
      const activityPeriodeParam = "harian";
      const previousMonthKey = getPreviousMonthKey(selectedMonthKey);
      const previousPeriodRange = previousMonthKey
        ? getMonthDateRange(previousMonthKey)
        : null;
      const previousPeriodLabel = previousPeriodRange
        ? (() => {
            const startDateValue = parseDateValue(previousPeriodRange.startDate);
            const endDateValue = parseDateValue(previousPeriodRange.endDate);
            if (
              startDateValue instanceof Date &&
              !Number.isNaN(startDateValue.valueOf())
            ) {
              return formatMonthRangeLabel(
                startDateValue,
                endDateValue instanceof Date && !Number.isNaN(endDateValue.valueOf())
                  ? endDateValue
                  : startDateValue,
              );
            }
            return "";
          })()
        : "";
      const previousStartDateParam = previousPeriodRange?.startDate;
      const previousEndDateParam = previousPeriodRange?.endDate;

      try {
        const [directoryResponse, statsResult, likesResult, commentsResult] =
          await Promise.all([
            getUserDirectory(token, clientId, controller.signal),
            getDashboardStats(
              token,
              periodeParam,
              tanggalParam,
              startDateParam,
              endDateParam,
              clientId,
              controller.signal,
            ),
            getRekapLikesIG(
              token,
              clientId,
              activityPeriodeParam,
              tanggalParam,
              startDateParam,
              endDateParam,
              controller.signal,
            ).catch((error) => {
              console.warn("Gagal memuat rekap likes IG", error);
              return { data: [] };
            }),
            getRekapKomentarTiktok(
              token,
              clientId,
              activityPeriodeParam,
              tanggalParam,
              startDateParam,
              endDateParam,
              controller.signal,
            ).catch((error) => {
              console.warn("Gagal memuat rekap komentar TikTok", error);
              return { data: [] };
            }),
          ]);

        if (cancelled) {
          return;
        }

        const rawDirectory =
          directoryResponse?.data || directoryResponse?.users || directoryResponse;
        const users = Array.isArray(rawDirectory) ? rawDirectory : [];
        const insight = computeUserInsight(users);
        const insightPersonnelByClient = insight?.personnelByClient;
        const activeDirectoryUsers = users.filter((user) =>
          resolveDirectoryIsActive(user),
        );

        const stats = statsResult?.data ?? statsResult ?? {};
        const totalIGPosts = extractNumericValue(
          stats.instagramPosts,
          stats.igPosts,
          stats.ig_posts,
          stats.instagram_posts,
          stats.totalIGPost,
          stats.total_ig_post,
        );
        const totalTikTokPosts = extractNumericValue(
          stats.tiktokPosts,
          stats.ttPosts,
          stats.tt_posts,
          stats.tiktok_posts,
          stats.totalTikTokPost,
          stats.total_tiktok_post,
        );

        const likesRawAll = ensureArray(likesResult);
        const commentsRawAll = ensureArray(commentsResult);

        const fallbackTrendDateIso = periodRange?.startDate
          ? `${periodRange.startDate}T00:00:00.000Z`
          : null;

        const likesTrendRecordsAll = prepareTrendActivityRecords(likesRawAll);
        const commentsTrendRecordsAll =
          prepareTrendActivityRecords(commentsRawAll);

        const likesTrendRecordsWithFallback = fallbackTrendDateIso
          ? prepareTrendActivityRecords(likesRawAll, {
              fallbackDate: fallbackTrendDateIso,
            })
          : likesTrendRecordsAll;
        const commentsTrendRecordsWithFallback = fallbackTrendDateIso
          ? prepareTrendActivityRecords(commentsRawAll, {
              fallbackDate: fallbackTrendDateIso,
            })
          : commentsTrendRecordsAll;

        const likesRecordsInSelectedRange = filterRecordsByDateRange(
          likesTrendRecordsWithFallback,
          periodRange,
        );
        const commentsRecordsInSelectedRange = filterRecordsByDateRange(
          commentsTrendRecordsWithFallback,
          periodRange,
        );
        let previousLikesRecordsInRange = [];
        let previousCommentsRecordsInRange = [];

        if (previousPeriodRange) {
          previousLikesRecordsInRange = filterRecordsByDateRange(
            likesTrendRecordsWithFallback,
            previousPeriodRange,
          );
          previousCommentsRecordsInRange = filterRecordsByDateRange(
            commentsTrendRecordsWithFallback,
            previousPeriodRange,
          );

          const previousFallbackTrendDateIso = previousStartDateParam
            ? `${previousStartDateParam}T00:00:00.000Z`
            : null;

          if (previousLikesRecordsInRange.length === 0) {
            try {
              const previousLikesResponse = await getRekapLikesIG(
                token,
                clientId,
                activityPeriodeParam,
                previousStartDateParam,
                previousStartDateParam,
                previousEndDateParam,
                controller.signal,
              );
              const previousLikesRaw = ensureArray(previousLikesResponse);
              const preparedPreviousLikes = prepareTrendActivityRecords(
                previousLikesRaw,
                previousFallbackTrendDateIso
                  ? { fallbackDate: previousFallbackTrendDateIso }
                  : undefined,
              );
              previousLikesRecordsInRange = filterRecordsByDateRange(
                preparedPreviousLikes,
                previousPeriodRange,
              );
            } catch (error) {
              console.warn(
                "Gagal memuat rekap likes IG periode sebelumnya",
                error,
              );
            }
          }

          if (previousCommentsRecordsInRange.length === 0) {
            try {
              const previousCommentsResponse = await getRekapKomentarTiktok(
                token,
                clientId,
                activityPeriodeParam,
                previousStartDateParam,
                previousStartDateParam,
                previousEndDateParam,
                controller.signal,
              );
              const previousCommentsRaw = ensureArray(previousCommentsResponse);
              const preparedPreviousComments = prepareTrendActivityRecords(
                previousCommentsRaw,
                previousFallbackTrendDateIso
                  ? { fallbackDate: previousFallbackTrendDateIso }
                  : undefined,
              );
              previousCommentsRecordsInRange = filterRecordsByDateRange(
                preparedPreviousComments,
                previousPeriodRange,
              );
            } catch (error) {
              console.warn(
                "Gagal memuat rekap komentar TikTok periode sebelumnya",
                error,
              );
            }
          }
        }

        let instagramPostsRaw = [];
        let tiktokPostsRaw = [];
        let instagramDatabasePostsRaw = [];
        let tiktokDatabasePostsRaw = [];
        let instagramDatabaseError = null;
        let tiktokDatabaseError = null;
        let previousInstagramPostsRaw = [];
        let previousTiktokPostsRaw = [];
        let previousInstagramPostsFiltered = [];
        let previousTiktokPostsFiltered = [];

        if (clientId) {
          try {
            const instagramDatabaseResponse = await getInstagramPosts(token, clientId, {
              startDate: startDateParam,
              endDate: endDateParam,
              signal: controller.signal,
            });
            instagramDatabasePostsRaw = ensureArray(instagramDatabaseResponse);
          } catch (error) {
            console.warn("Gagal memuat konten Instagram dari database", error);
            instagramDatabaseError = error;
          }
        }

        if (clientId) {
          try {
            const tiktokDatabaseResponse = await getTiktokPosts(token, clientId, {
              startDate: startDateParam,
              endDate: endDateParam,
              signal: controller.signal,
            });
            tiktokDatabasePostsRaw = ensureArray(tiktokDatabaseResponse);
          } catch (error) {
            console.warn("Gagal memuat konten TikTok dari database", error);
            tiktokDatabaseError = error;
          }
        }

        if (clientId && previousPeriodRange) {
          try {
            const previousInstagramResponse = await getInstagramPosts(token, clientId, {
              startDate: previousStartDateParam,
              endDate: previousEndDateParam,
              signal: controller.signal,
            });
            previousInstagramPostsRaw = ensureArray(previousInstagramResponse);
          } catch (error) {
            console.warn(
              "Gagal memuat konten Instagram periode sebelumnya dari database",
              error,
            );
          }
        }

        if (clientId && previousPeriodRange) {
          try {
            const previousTiktokResponse = await getTiktokPosts(token, clientId, {
              startDate: previousStartDateParam,
              endDate: previousEndDateParam,
              signal: controller.signal,
            });
            previousTiktokPostsRaw = ensureArray(previousTiktokResponse);
          } catch (error) {
            console.warn(
              "Gagal memuat konten TikTok periode sebelumnya dari database",
              error,
            );
          }
        }

        instagramPostsRaw = instagramDatabasePostsRaw;
        tiktokPostsRaw = tiktokDatabasePostsRaw;

        if (cancelled) {
          return;
        }

        const platformErrorMessage = (() => {
          const targets = [];
          if (instagramDatabaseError) {
            targets.push("Instagram");
          }
          if (tiktokDatabaseError) {
            targets.push("TikTok");
          }
          if (targets.length === 0) {
            return "";
          }
          if (targets.length === 1) {
            return `Gagal memuat data konten ${targets[0]}.`;
          }
          return `Gagal memuat data konten ${targets.join(" dan ")}.`;
        })();

        const activityBuckets = computeActivityBuckets({
          users: activeDirectoryUsers,
          likes: likesRecordsInSelectedRange,
          comments: commentsRecordsInSelectedRange,
          totalIGPosts,
          totalTikTokPosts,
        });

        const mergedActivityRecords = mergeActivityRecords(
          likesRecordsInSelectedRange,
          commentsRecordsInSelectedRange,
        );
        const likesSummary = aggregateLikesRecords(mergedActivityRecords, {
          directoryUsers: activeDirectoryUsers,
          insightPersonnelByClient,
        });
        let previousLikesSummary = null;

        if (previousPeriodRange) {
          const mergedPreviousActivityRecords = mergeActivityRecords(
            previousLikesRecordsInRange,
            previousCommentsRecordsInRange,
          );
          previousLikesSummary = aggregateLikesRecords(
            mergedPreviousActivityRecords,
            {
              directoryUsers: activeDirectoryUsers,
              insightPersonnelByClient,
            },
          );
        }
        const instagramPostsSanitized = ensureRecordsHaveActivityDate(
          instagramPostsRaw,
          {
            extraPaths: POST_DATE_PATHS,
          },
        );
        const tiktokPostsSanitized = ensureRecordsHaveActivityDate(
          tiktokPostsRaw,
          {
            extraPaths: POST_DATE_PATHS,
          },
        );
        const previousInstagramPostsSanitized = ensureRecordsHaveActivityDate(
          previousInstagramPostsRaw,
          {
            extraPaths: POST_DATE_PATHS,
          },
        );
        const previousTiktokPostsSanitized = ensureRecordsHaveActivityDate(
          previousTiktokPostsRaw,
          {
            extraPaths: POST_DATE_PATHS,
          },
        );

        if (previousPeriodRange) {
          previousInstagramPostsFiltered = filterRecordsByDateRange(
            previousInstagramPostsSanitized,
            previousPeriodRange,
            {
              extraPaths: POST_DATE_PATHS,
            },
          );
          previousTiktokPostsFiltered = filterRecordsByDateRange(
            previousTiktokPostsSanitized,
            previousPeriodRange,
            {
              extraPaths: POST_DATE_PATHS,
            },
          );
        }

        const previousInstagramPostCount = previousPeriodRange
          ? previousInstagramPostsFiltered.length
          : 0;
        const previousTiktokPostCount = previousPeriodRange
          ? previousTiktokPostsFiltered.length
          : 0;
        const previousPostTotals = previousPeriodRange
          ? {
              instagram: previousInstagramPostCount,
              tiktok: previousTiktokPostCount,
            }
          : null;

        if (cancelled) {
          return;
        }

        setPlatformState({
          loading: false,
          error: platformErrorMessage,
          activity: {
            likes: likesRecordsInSelectedRange,
            comments: commentsRecordsInSelectedRange,
          },
          trendActivity: {
            likes: likesTrendRecordsAll,
            comments: commentsTrendRecordsAll,
          },
          likesSummary,
          previousLikesSummary: previousLikesSummary ?? null,
          posts: {
            instagram: instagramPostsSanitized,
            tiktok: tiktokPostsSanitized,
          },
          previousPostTotals,
          previousPeriodLabel,
        });

        setUserInsightState({
          loading: false,
          error: "",
          ...insight,
          activityBuckets,
        });
      } catch (error) {
        if (cancelled || error?.name === "AbortError") {
          return;
        }
        setUserInsightState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Gagal memuat insight pengguna.",
          activityBuckets: null,
        }));
        setPlatformState({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Gagal memuat data performa platform.",
          platforms: [],
          profiles: { byKey: {} },
          activity: { likes: [], comments: [] },
          trendActivity: { likes: [], comments: [] },
          likesSummary: createEmptyLikesSummary(),
          posts: { instagram: [], tiktok: [] },
          previousLikesSummary: null,
          previousPostTotals: null,
          previousPeriodLabel: "",
        });
      }
    };

    loadUserInsight();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, clientId, selectedMonthKey]);

  const {
    summary: userSummary,
    completionBarData,
    lowestCompletionDivisions,
    pieData,
    pieTotal,
    divisionComposition,
    divisionCompositionTotal,
    divisionDistribution: divisionDistributionRaw,
    narrative,
    activityBuckets,
  } = userInsightState;
  const divisionDistribution = useMemo(() => {
    if (!Array.isArray(divisionDistributionRaw)) {
      return [];
    }

    const sorted = [...divisionDistributionRaw].sort(
      compareDivisionByCompletion,
    );

    return sorted.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
  }, [divisionDistributionRaw]);
  const activityCategories = Array.isArray(activityBuckets?.categories)
    ? activityBuckets.categories
    : [];
  const totalEvaluated = Number(activityBuckets?.evaluatedUsers) || 0;
  const totalContentEvaluated = Number(activityBuckets?.totalContent) || 0;
  const {
    loading: platformsLoading,
    error: platformError,
    likesSummary,
    previousLikesSummary,
    previousPostTotals,
    previousPeriodLabel,
    activity: platformActivityState,
    posts: platformPostsState,
  } = platformState;
  const platformActivity =
    platformActivityState && typeof platformActivityState === "object"
      ? platformActivityState
      : EMPTY_ACTIVITY;
  const platformPosts =
    platformPostsState && typeof platformPostsState === "object"
      ? platformPostsState
      : { instagram: [], tiktok: [] };
  const postsForSelectedMonth = useMemo(() => {
    const instagramPosts = filterRecordsWithResolvableDate(
      Array.isArray(platformPosts?.instagram) ? platformPosts.instagram : [],
      {
        extraPaths: POST_DATE_PATHS,
      },
    );
    const tiktokPosts = filterRecordsWithResolvableDate(
      Array.isArray(platformPosts?.tiktok) ? platformPosts.tiktok : [],
      {
        extraPaths: POST_DATE_PATHS,
      },
    );
    const periodRange = getMonthDateRange(selectedMonthKey);

    if (!periodRange) {
      return {
        instagram: instagramPosts,
        tiktok: tiktokPosts,
      };
    }

    return {
      instagram: filterRecordsByDateRange(instagramPosts, periodRange, {
        extraPaths: POST_DATE_PATHS,
      }),
      tiktok: filterRecordsByDateRange(tiktokPosts, periodRange, {
        extraPaths: POST_DATE_PATHS,
      }),
    };
  }, [platformPosts?.instagram, platformPosts?.tiktok, selectedMonthKey]);

  const instagramPostsForSelectedMonth = Array.isArray(
    postsForSelectedMonth?.instagram,
  )
    ? postsForSelectedMonth.instagram
    : [];
  const tiktokPostsForSelectedMonth = Array.isArray(
    postsForSelectedMonth?.tiktok,
  )
    ? postsForSelectedMonth.tiktok
    : [];

  const instagramPostCount = instagramPostsForSelectedMonth.length;
  const tiktokPostCount = tiktokPostsForSelectedMonth.length;
  const summaryCards = useMemo(() => {
    const totals = likesSummary?.totals;

    if (!totals) {
      return [];
    }

    const previousTotals = previousLikesSummary?.totals ?? null;
    const hasPreviousPosts =
      previousPostTotals &&
      Number.isFinite(Number(previousPostTotals.instagram)) &&
      Number.isFinite(Number(previousPostTotals.tiktok));
    const previousPostsTotal = hasPreviousPosts
      ? Number(previousPostTotals.instagram ?? 0) +
        Number(previousPostTotals.tiktok ?? 0)
      : null;
    const comparisonPeriod = previousPeriodLabel
      ? previousPeriodLabel
      : "bulan sebelumnya";

    const formatSigned = (value, options = {}) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return null;
      }
      const formatted = formatNumber(Math.abs(numeric), options);
      if (numeric > 0) {
        return `+${formatted}`;
      }
      if (numeric < 0) {
        return `-${formatted}`;
      }
      return formatted;
    };

    const buildComparison = (
      currentValue,
      previousValue,
      {
        absoluteOptions = { maximumFractionDigits: 0 },
        percentOptions = { maximumFractionDigits: 1 },
        absoluteSuffix = "",
        percentSuffix = "%",
      } = {},
    ) => {
      if (previousValue == null || Number.isNaN(previousValue)) {
        return null;
      }

      const currentNumeric = Number(currentValue);
      const previousNumeric = Number(previousValue);

      if (!Number.isFinite(previousNumeric)) {
        return null;
      }

      const safeCurrent = Number.isFinite(currentNumeric) ? currentNumeric : 0;
      const delta = safeCurrent - previousNumeric;
      const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";

      if (direction === "flat" || Math.abs(delta) < 0.000001) {
        return {
          direction: "flat",
          label: `Tetap dibanding ${comparisonPeriod}`,
        };
      }

      const relativeChange =
        Math.abs(previousNumeric) > 0.000001
          ? (delta / previousNumeric) * 100
          : null;
      const absoluteLabel = formatSigned(delta, absoluteOptions);
      const percentLabel =
        relativeChange != null
          ? `${formatSigned(relativeChange, percentOptions)}${percentSuffix}`
          : null;
      const parts = [
        absoluteLabel ? `${absoluteLabel}${absoluteSuffix}` : null,
        percentLabel,
      ].filter(Boolean);

      if (parts.length === 0) {
        return {
          direction: "flat",
          label: `Tetap dibanding ${comparisonPeriod}`,
        };
      }

      return {
        direction,
        label: `${parts.join(" · ")} dibanding ${comparisonPeriod}`,
      };
    };

    const totalActive = totals.activePersonnel ?? 0;
    const likeContributors = totals.personnelWithLikes ?? 0;
    const commentContributors = totals.personnelWithComments ?? 0;
    const instagramCompliance =
      totals.instagramCompliance ?? totals.complianceRate ?? 0;
    const tiktokCompliance = totals.tiktokCompliance ?? 0;
    const previousInstagramCompliance = previousTotals
      ? previousTotals.instagramCompliance ?? previousTotals.complianceRate ?? null
      : null;
    const previousTiktokCompliance = previousTotals
      ? previousTotals.tiktokCompliance ?? null
      : null;

    return [
      {
        key: "total-posts",
        label: "Total Post",
        value: formatNumber(instagramPostCount + tiktokPostCount, {
          maximumFractionDigits: 0,
        }),
        description: `Post Instagram: ${formatNumber(instagramPostCount, {
          maximumFractionDigits: 0,
        })} · Post TikTok: ${formatNumber(tiktokPostCount, {
          maximumFractionDigits: 0,
        })}`,
        comparison: buildComparison(
          instagramPostCount + tiktokPostCount,
          previousPostsTotal,
          { absoluteOptions: { maximumFractionDigits: 0 } },
        ),
      },
      {
        key: "total-likes",
        label: "Total Likes",
        value: formatNumber(totals.totalLikes ?? 0, {
          maximumFractionDigits: 0,
        }),
        description: "Seluruh likes personil pada periode terpilih.",
        comparison: buildComparison(
          totals.totalLikes ?? 0,
          previousTotals ? previousTotals.totalLikes ?? null : null,
          { absoluteOptions: { maximumFractionDigits: 0 } },
        ),
      },
      {
        key: "total-comments",
        label: "Total Komentar",
        value: formatNumber(totals.totalComments ?? 0, {
          maximumFractionDigits: 0,
        }),
        description: "Kumulatif komentar personil yang terekam.",
        comparison: buildComparison(
          totals.totalComments ?? 0,
          previousTotals ? previousTotals.totalComments ?? null : null,
          { absoluteOptions: { maximumFractionDigits: 0 } },
        ),
      },
      {
        key: "instagram-compliance",
        label: "Kepatuhan Instagram",
        value: formatPercent(instagramCompliance),
        description: `${formatNumber(likeContributors, {
          maximumFractionDigits: 0,
        })} personil memberi likes dari ${formatNumber(totalActive, {
          maximumFractionDigits: 0,
        })} personil aktif.`,
        comparison: buildComparison(instagramCompliance, previousInstagramCompliance, {
          absoluteOptions: { maximumFractionDigits: 1 },
          percentOptions: { maximumFractionDigits: 1 },
          absoluteSuffix: " poin",
        }),
      },
      {
        key: "tiktok-compliance",
        label: "Kepatuhan TikTok",
        value: formatPercent(tiktokCompliance),
        description: `${formatNumber(commentContributors, {
          maximumFractionDigits: 0,
        })} personil berkomentar dari ${formatNumber(totalActive, {
          maximumFractionDigits: 0,
        })} personil aktif.`,
        comparison: buildComparison(tiktokCompliance, previousTiktokCompliance, {
          absoluteOptions: { maximumFractionDigits: 1 },
          percentOptions: { maximumFractionDigits: 1 },
          absoluteSuffix: " poin",
        }),
      },
    ];
  }, [
    likesSummary,
    previousLikesSummary,
    previousPostTotals,
    previousPeriodLabel,
    instagramPostCount,
    tiktokPostCount,
  ]);
  const topContentRows = useMemo(() => {
    const instagramPosts = Array.isArray(instagramPostsForSelectedMonth)
      ? instagramPostsForSelectedMonth
      : [];
    const tiktokPosts = Array.isArray(tiktokPostsForSelectedMonth)
      ? tiktokPostsForSelectedMonth
      : [];

    const buildRow = (normalized, platformLabel) => {
      if (!normalized) {
        return null;
      }

      const likes = Math.max(0, Number(normalized?.metrics?.likes) || 0);
      const comments = Math.max(
        0,
        Number(normalized?.metrics?.comments) || 0,
      );
      const publishedAt = ensureValidDate(normalized?.publishedAt);

      return {
        id: normalized.id,
        platform: platformLabel,
        title: normalized.title,
        format: normalized.type,
        publishedAt,
        likes,
        comments,
        totalInteractions: likes + comments,
      };
    };

    const normalizedInstagram = instagramPosts
      .map((post, index) =>
        buildRow(
          normalizePlatformPost(post, {
            platformKey: "instagram",
            platformLabel: "Instagram",
            fallbackIndex: index,
          }),
          "Instagram",
        ),
      )
      .filter(Boolean);

    const normalizedTiktok = tiktokPosts
      .map((post, index) =>
        buildRow(
          normalizePlatformPost(post, {
            platformKey: "tiktok",
            platformLabel: "TikTok",
            fallbackIndex: index,
          }),
          "TikTok",
        ),
      )
      .filter(Boolean);

    const combined = [...normalizedInstagram, ...normalizedTiktok]
      .filter((entry) => entry && entry.id);

    combined.sort((a, b) => {
      if (b.totalInteractions !== a.totalInteractions) {
        return b.totalInteractions - a.totalInteractions;
      }
      if (b.likes !== a.likes) {
        return b.likes - a.likes;
      }
      if (b.comments !== a.comments) {
        return b.comments - a.comments;
      }
      return a.title.localeCompare(b.title);
    });

    const limited = combined.slice(0, 10);

    if (limited.length > 0) {
      return limited;
    }

    if (!Array.isArray(data.contentTable)) {
      return [];
    }

    const periodRange = getMonthDateRange(selectedMonthKey);
    const filteredContentTable = periodRange
      ? filterRecordsByDateRange(data.contentTable, periodRange, {
          extraPaths: POST_DATE_PATHS,
        })
      : data.contentTable;

    return filteredContentTable
      .map((row, index) => {
        if (!row || typeof row !== "object") {
          return null;
        }

        const likes = Math.max(
          0,
          Number(
            row.likes ??
              row.likeCount ??
              row.metrics?.likes ??
              row.interactions?.likes ??
              0,
          ) || 0,
        );
        const comments = Math.max(
          0,
          Number(
            row.comments ??
              row.commentCount ??
              row.metrics?.comments ??
              row.interactions?.comments ??
              0,
          ) || 0,
        );
        const totalInteractions = Math.max(
          0,
          Number(
            row.totalInteractions ??
              row.interactions ??
              likes + comments,
          ) ||
            likes + comments,
        );

        const publishedAt = ensureValidDate(
          row.publishedAt ??
            row.tanggal ??
            row.date ??
            row.published_at ??
            row.created_at ??
            null,
        );

        return {
          id: String(
            row.id ??
              row.contentId ??
              row.slug ??
              `${row.platform ?? "content"}-${index + 1}`,
          ),
          platform: row.platform ?? row.channel ?? "",
          title: row.title ?? row.name ?? row.caption ?? "Konten",
          format: normalizeContentType(row.format ?? row.type ?? ""),
          publishedAt,
          likes,
          comments,
          totalInteractions,
        };
      })
      .filter((entry) => entry && entry.id)
      .slice(0, 10);
  }, [
    instagramPostsForSelectedMonth,
    tiktokPostsForSelectedMonth,
    data.contentTable,
    selectedMonthKey,
  ]);
  const pageNarrative = useMemo(() => {
    const paragraphs = [];
    const totals = likesSummary?.totals ?? null;
    const safeNumber = (value) => {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric : null;
    };
    const joinWithAnd = (items = []) => {
      const filtered = items.filter((item) => item && typeof item === "string");
      if (filtered.length === 0) {
        return "";
      }
      if (filtered.length === 1) {
        return filtered[0];
      }
      if (filtered.length === 2) {
        return `${filtered[0]} dan ${filtered[1]}`;
      }
      return `${filtered.slice(0, -1).join(", ")}, dan ${filtered[filtered.length - 1]}`;
    };
    const getSummaryCard = (key) =>
      summaryCards.find((card) => card && card.key === key) ?? null;

    const instagramPostsTotal = safeNumber(instagramPostCount) ?? 0;
    const tiktokPostsTotal = safeNumber(tiktokPostCount) ?? 0;
    const totalPostsCount = instagramPostsTotal + tiktokPostsTotal;
    const totalLikes = safeNumber(totals?.totalLikes);
    const totalComments = safeNumber(totals?.totalComments);

    if (
      (Number.isFinite(totalPostsCount) && totalPostsCount > 0) ||
      totalLikes != null ||
      totalComments != null
    ) {
      const monthLabel = selectedMonthLabel ?? "periode ini";
      const summaryParts = [];
      if (Number.isFinite(totalPostsCount) && totalPostsCount > 0) {
        summaryParts.push(
          `${formatNumber(totalPostsCount, { maximumFractionDigits: 0 })} konten`,
        );
      }
      if (totalLikes != null) {
        summaryParts.push(
          `${formatNumber(totalLikes, { maximumFractionDigits: 0 })} likes`,
        );
      }
      if (totalComments != null) {
        summaryParts.push(
          `${formatNumber(totalComments, { maximumFractionDigits: 0 })} komentar`,
        );
      }

      if (summaryParts.length > 0) {
        const totalPostsCard = getSummaryCard("total-posts");
        const totalLikesCard = getSummaryCard("total-likes");
        const totalCommentsCard = getSummaryCard("total-comments");
        const comparisonMessages = [
          totalPostsCard?.comparison?.label,
          totalLikesCard?.comparison?.label,
          totalCommentsCard?.comparison?.label,
        ]
          .filter(Boolean)
          .map((label) => `${label}.`);

        const complianceParts = [];
        const instagramComplianceCard = getSummaryCard("instagram-compliance");
        if (instagramComplianceCard?.value) {
          complianceParts.push(
            `Kepatuhan Instagram berada di ${instagramComplianceCard.value}${
              instagramComplianceCard?.comparison?.label
                ? ` (${instagramComplianceCard.comparison.label})`
                : ""
            }`,
          );
        }
        const tiktokComplianceCard = getSummaryCard("tiktok-compliance");
        if (tiktokComplianceCard?.value) {
          complianceParts.push(
            `Kepatuhan TikTok berada di ${tiktokComplianceCard.value}${
              tiktokComplianceCard?.comparison?.label
                ? ` (${tiktokComplianceCard.comparison.label})`
                : ""
            }`,
          );
        }

        let paragraph = `Selama ${monthLabel}, tim menghasilkan ${joinWithAnd(
          summaryParts,
        )}.`;
        if (complianceParts.length > 0) {
          paragraph += ` ${joinWithAnd(complianceParts)}.`;
        }
        if (comparisonMessages.length > 0) {
          paragraph += ` ${comparisonMessages.join(" ")}`;
        }
        paragraphs.push(paragraph.trim());
      }
    }

    const dailySeries = Array.isArray(dailyInteractionTrend?.series)
      ? dailyInteractionTrend.series
      : [];
    if (dailySeries.length > 0) {
      const peakDay = dailySeries.reduce((best, point) => {
        const interactions = safeNumber(point?.interactions) ?? 0;
        if (!best || interactions > best.interactions) {
          return {
            label: point?.label ?? "",
            interactions,
            likes: safeNumber(point?.likes) ?? 0,
            comments: safeNumber(point?.comments) ?? 0,
          };
        }
        return best;
      }, null);
      const totalsInteractions = safeNumber(dailyInteractionTrend?.totals?.interactions);
      const averageInteractions =
        totalsInteractions != null && dailySeries.length > 0
          ? totalsInteractions / dailySeries.length
          : null;
      const peakLabel = peakDay?.label ? `pada ${peakDay.label}` : "";
      const peakInteractionsLabel = formatNumber(peakDay?.interactions ?? 0, {
        maximumFractionDigits: 0,
      });
      const peakLikesLabel = formatNumber(peakDay?.likes ?? 0, {
        maximumFractionDigits: 0,
      });
      const peakCommentsLabel = formatNumber(peakDay?.comments ?? 0, {
        maximumFractionDigits: 0,
      });
      let paragraph = `Aktivitas tertinggi tercatat ${peakLabel} dengan ${peakInteractionsLabel} interaksi (${peakLikesLabel} likes dan ${peakCommentsLabel} komentar).`;
      if (averageInteractions != null) {
        paragraph += ` Rata-rata interaksi harian berada di ${formatNumber(averageInteractions, {
          maximumFractionDigits: 1,
          minimumFractionDigits: averageInteractions < 10 ? 1 : 0,
        })}.`;
      }
      paragraphs.push(paragraph.trim());
    }

    const buildWeeklySentence = (trend, platformLabel) => {
      const latest = trend?.latestWeek ?? null;
      if (!latest) {
        return null;
      }
      const previous = trend?.previousWeek ?? null;
      const latestInteractions = safeNumber(latest?.interactions) ?? 0;
      const latestLabel = latest?.label ?? "pekan ini";
      let sentence = `${platformLabel} mencatat ${formatNumber(latestInteractions, {
        maximumFractionDigits: 0,
      })} interaksi pada ${latestLabel}`;
      if (previous) {
        const previousInteractions = safeNumber(previous?.interactions) ?? 0;
        const delta = latestInteractions - previousInteractions;
        if (Math.abs(delta) < 0.5) {
          sentence += `, setara dengan ${previous.label}`;
        } else {
          sentence += `, ${delta > 0 ? "naik" : "turun"} ${formatNumber(Math.abs(delta), {
            maximumFractionDigits: 0,
          })} dibanding ${previous.label}`;
        }
      } else if (trend?.weeksCount > 1 || trend?.hasAnyPosts) {
        sentence += ", sementara data pekan sebelumnya belum tersedia";
      }
      return `${sentence}.`;
    };

    const weeklySentences = [
      buildWeeklySentence(instagramWeeklyTrendCardData, "Instagram"),
      buildWeeklySentence(tiktokWeeklyTrendCardData, "TikTok"),
    ].filter(Boolean);
    if (weeklySentences.length > 0) {
      paragraphs.push(weeklySentences.join(" "));
    }

    const buildMonthlySentence = (data, platformLabel) => {
      if (!data?.hasRecords) {
        return null;
      }
      const currentPeriod = data?.currentPeriodLabel ?? "periode ini";
      const interactionsMetric = Array.isArray(data?.currentMetrics)
        ? data.currentMetrics.find((metric) => metric?.key === "interactions")
        : null;
      const postsMetric = Array.isArray(data?.currentMetrics)
        ? data.currentMetrics.find((metric) => metric?.key === "posts")
        : null;
      const interactionValue = safeNumber(interactionsMetric?.value);
      const postValue = safeNumber(postsMetric?.value);
      const interactionLabel =
        interactionValue != null
          ? `${formatNumber(interactionValue, { maximumFractionDigits: 0 })} interaksi`
          : null;
      const postLabel =
        postValue != null
          ? `${formatNumber(postValue, { maximumFractionDigits: 0 })} konten`
          : null;
      const changeMetric = Array.isArray(data?.deltaMetrics)
        ? data.deltaMetrics.find((metric) => metric?.key === "interactions")
        : null;
      let changeLabel = "";
      if (changeMetric && data?.previousPeriodLabel) {
        const delta = safeNumber(changeMetric?.absolute) ?? 0;
        if (Math.abs(delta) < 0.5) {
          changeLabel = ` setara dengan ${data.previousPeriodLabel}`;
        } else {
          changeLabel = ` ${delta > 0 ? "naik" : "turun"} ${formatNumber(Math.abs(delta), {
            maximumFractionDigits: 0,
          })} dibanding ${data.previousPeriodLabel}`;
        }
      }
      const baseline = joinWithAnd([interactionLabel, postLabel]);
      if (!baseline) {
        return null;
      }
      return `${platformLabel} pada ${currentPeriod} meraih ${baseline}.${changeLabel}`.trim();
    };

    const monthlySentences = [
      buildMonthlySentence(instagramMonthlyCardData, "Instagram"),
      buildMonthlySentence(tiktokMonthlyCardData, "TikTok"),
    ].filter(Boolean);
    if (monthlySentences.length > 0) {
      paragraphs.push(monthlySentences.join(" "));
    }

    if (userSummary?.totalUsers) {
      const instagramPercentLabel = Number.isFinite(userSummary.instagramPercent)
        ? formatPercent(userSummary.instagramPercent)
        : null;
      const tiktokPercentLabel = Number.isFinite(userSummary.tiktokPercent)
        ? formatPercent(userSummary.tiktokPercent)
        : null;
      const parts = [
        `${formatNumber(userSummary.totalUsers, { maximumFractionDigits: 0 })} personil terdata`,
        userSummary.instagramFilled
          ? `${formatNumber(userSummary.instagramFilled, { maximumFractionDigits: 0 })} memiliki akun Instagram${
              instagramPercentLabel ? ` (${instagramPercentLabel})` : ""
            }`
          : null,
        userSummary.tiktokFilled
          ? `${formatNumber(userSummary.tiktokFilled, { maximumFractionDigits: 0 })} memiliki akun TikTok${
              tiktokPercentLabel ? ` (${tiktokPercentLabel})` : ""
            }`
          : null,
        userSummary.bothCount
          ? `${formatNumber(userSummary.bothCount, { maximumFractionDigits: 0 })} mengisi kedua kanal`
          : null,
      ].filter(Boolean);
      if (parts.length > 0) {
        paragraphs.push(`Kesiapan personil mencakup ${joinWithAnd(parts)}.`);
      }
    }

    const topContent = Array.isArray(topContentRows) && topContentRows.length > 0
      ? topContentRows[0]
      : null;
    if (topContent) {
      const platformLabel = topContent.platform || "Konten";
      const publishedLabel = formatPublishedDate(topContent.publishedAt);
      const topInteractions = formatNumber(topContent.totalInteractions ?? 0, {
        maximumFractionDigits: 0,
      });
      const topLikes = formatNumber(topContent.likes ?? 0, {
        maximumFractionDigits: 0,
      });
      const topComments = formatNumber(topContent.comments ?? 0, {
        maximumFractionDigits: 0,
      });
      const title = topContent.title ? `"${topContent.title}"` : "konten unggulan";
      paragraphs.push(
        `${platformLabel} ${title} yang terbit pada ${publishedLabel} menghasilkan ${topInteractions} interaksi (${topLikes} likes dan ${topComments} komentar).`,
      );
    }

    return paragraphs.filter(
      (paragraph) => typeof paragraph === "string" && paragraph.trim().length > 0,
    );
  }, [
    summaryCards,
    likesSummary,
    instagramPostCount,
    tiktokPostCount,
    selectedMonthLabel,
    dailyInteractionTrend,
    instagramWeeklyTrendCardData,
    tiktokWeeklyTrendCardData,
    instagramMonthlyCardData,
    tiktokMonthlyCardData,
    userSummary,
    topContentRows,
  ]);
  const maxDistributionTotal = useMemo(() => {
    if (!divisionDistribution.length) {
      return 0;
    }
    return divisionDistribution.reduce((maxValue, item) => {
      const total = Number(item?.total) || 0;
      return total > maxValue ? total : maxValue;
    }, 0);
  }, [divisionDistribution]);


  const instagramMonthlyTrend = useMemo(() => {
    const instagramPosts = filterRecordsWithResolvableDate(
      Array.isArray(platformPosts?.instagram) ? platformPosts.instagram : [],
      {
        extraPaths: POST_DATE_PATHS,
      },
    );

    return buildMonthlyEngagementTrend(instagramPosts, {
      platformKey: "instagram",
      platformLabel: "Instagram",
    });
  }, [platformPosts?.instagram]);

  const instagramWeeklyTrendCardData = useMemo(() => {
    return buildWeeklyEngagementTrend(instagramPostsForSelectedMonth, {
      platformKey: "instagram",
      platformLabel: "Instagram",
    });
  }, [instagramPostsForSelectedMonth]);

  const tiktokMonthlyTrend = useMemo(() => {
    const tiktokPosts = filterRecordsWithResolvableDate(
      Array.isArray(platformPosts?.tiktok) ? platformPosts.tiktok : [],
      {
        extraPaths: POST_DATE_PATHS,
      },
    );

    return buildMonthlyEngagementTrend(tiktokPosts, {
      platformKey: "tiktok",
      platformLabel: "TikTok",
    });
  }, [platformPosts?.tiktok]);

  const tiktokWeeklyTrendCardData = useMemo(() => {
    return buildWeeklyEngagementTrend(tiktokPostsForSelectedMonth, {
      platformKey: "tiktok",
      platformLabel: "TikTok",
    });
  }, [tiktokPostsForSelectedMonth]);

  const dailyInteractionTrend = useMemo(() => {
    return buildDailyInteractionTrend({
      instagramPosts: instagramPostsForSelectedMonth,
      tiktokPosts: tiktokPostsForSelectedMonth,
    });
  }, [instagramPostsForSelectedMonth, tiktokPostsForSelectedMonth]);

  const instagramMonthlyCardData = useMemo(() => {
    const trend = instagramMonthlyTrend ?? {};
    const months = Array.isArray(trend.months) ? trend.months : [];

    const selectedIndex = selectedMonthKey
      ? months.findIndex((month) => month.key === selectedMonthKey)
      : -1;
    const currentIndex = selectedIndex >= 0 ? selectedIndex : months.length - 1;
    const currentMonth = currentIndex >= 0 ? months[currentIndex] : null;
    const previousMonth = currentIndex > 0 ? months[currentIndex - 1] : null;

    const computeDelta = (currentValue, previousValue) => {
      const safeCurrent = Number.isFinite(currentValue) ? currentValue : 0;
      const safePrevious = Number.isFinite(previousValue) ? previousValue : 0;
      const absolute = safeCurrent - safePrevious;
      const percent = safePrevious !== 0 ? (absolute / safePrevious) * 100 : null;
      return { absolute, percent };
    };

    const delta =
      currentMonth && previousMonth
        ? {
            posts: computeDelta(currentMonth.posts, previousMonth.posts),
            interactions: computeDelta(
              currentMonth.interactions,
              previousMonth.interactions,
            ),
            likes: computeDelta(currentMonth.likes, previousMonth.likes),
            comments: computeDelta(currentMonth.comments, previousMonth.comments),
          }
        : null;

    const safeLatestInteractions = sanitizeMonthlyValue(
      currentMonth?.interactions,
    );
    const safeLatestLikes = sanitizeMonthlyValue(currentMonth?.likes);
    const safeLatestComments = sanitizeMonthlyValue(currentMonth?.comments);
    const safeLatestPosts = sanitizeMonthlyValue(currentMonth?.posts);
    const safePreviousInteractions = sanitizeMonthlyValue(
      previousMonth?.interactions,
    );
    const safePreviousLikes = sanitizeMonthlyValue(previousMonth?.likes);
    const safePreviousComments = sanitizeMonthlyValue(previousMonth?.comments);
    const safePreviousPosts = sanitizeMonthlyValue(previousMonth?.posts);

    const currentMetrics = currentMonth
      ? [
          {
            key: "posts",
            label: "Post Instagram",
            value: safeLatestPosts,
          },
          { key: "likes", label: "Likes Personil", value: safeLatestLikes },
          {
            key: "comments",
            label: "Komentar Personil",
            value: safeLatestComments,
          },
          {
            key: "interactions",
            label: "Interaksi Personil",
            value: safeLatestInteractions,
          },
        ]
      : [];

    const previousMetrics = previousMonth
      ? [
          {
            key: "posts",
            label: "Post Instagram",
            value: safePreviousPosts,
          },
          { key: "likes", label: "Likes Personil", value: safePreviousLikes },
          {
            key: "comments",
            label: "Komentar Personil",
            value: safePreviousComments,
          },
          {
            key: "interactions",
            label: "Interaksi Personil",
            value: safePreviousInteractions,
          },
        ]
      : [];

    const deltaMetrics =
      delta && previousMonth
        ? [
            {
              key: "posts",
              label: "Perubahan Post",
              absolute: Math.round(delta.posts?.absolute ?? 0),
              percent:
                delta.posts?.percent !== null &&
                delta.posts?.percent !== undefined
                  ? delta.posts.percent
                  : null,
            },
            {
              key: "likes",
              label: "Perubahan Likes Personil",
              absolute: Math.round(delta.likes?.absolute ?? 0),
              percent:
                delta.likes?.percent !== null &&
                delta.likes?.percent !== undefined
                  ? delta.likes.percent
                  : null,
            },
            {
              key: "comments",
              label: "Perubahan Komentar Personil",
              absolute: Math.round(delta.comments?.absolute ?? 0),
              percent:
                delta.comments?.percent !== null &&
                delta.comments?.percent !== undefined
                  ? delta.comments.percent
                  : null,
            },
            {
              key: "interactions",
              label: "Perubahan Interaksi Personil",
              absolute: Math.round(delta.interactions?.absolute ?? 0),
              percent:
                delta.interactions?.percent !== null &&
                delta.interactions?.percent !== undefined
                  ? delta.interactions.percent
                  : null,
            },
          ]
        : [];

    const series = Array.isArray(months)
      ? (() => {
          if (currentIndex < 0) {
            return [];
          }
          const startIndex = Math.max(0, currentIndex - 5);
          return months.slice(startIndex, currentIndex + 1).map((month) => {
            const interactions = sanitizeMonthlyValue(month.interactions);
            const posts = sanitizeMonthlyValue(month.posts);
            const likes = sanitizeMonthlyValue(month.likes);
            const comments = sanitizeMonthlyValue(month.comments);
            return {
              key: month.key,
              label: formatMonthRangeLabel(month.start, month.end),
              primary: interactions,
              secondary: posts,
              posts,
              likes,
              comments,
              start: month.start,
              end: month.end,
            };
          });
        })()
      : [];

    const monthsCount = months.length;
    const currentPeriodLabel = currentMonth
      ? formatMonthRangeLabel(currentMonth.start, currentMonth.end)
      : null;
    const previousPeriodLabel = previousMonth
      ? formatMonthRangeLabel(previousMonth.start, previousMonth.end)
      : null;

    return {
      currentMetrics,
      previousMetrics,
      deltaMetrics,
      series,
      monthsCount,
      currentPeriodLabel,
      previousPeriodLabel,
      hasComparison: Boolean(previousMonth),
      hasRecords: Boolean(trend.hasRecords && currentMonth),
    };
  }, [instagramMonthlyTrend, selectedMonthKey]);

  const tiktokMonthlyCardData = useMemo(() => {
    const trend = tiktokMonthlyTrend ?? {};
    const months = Array.isArray(trend.months) ? trend.months : [];

    const selectedIndex = selectedMonthKey
      ? months.findIndex((month) => month.key === selectedMonthKey)
      : -1;
    const currentIndex = selectedIndex >= 0 ? selectedIndex : months.length - 1;
    const currentMonth = currentIndex >= 0 ? months[currentIndex] : null;
    const previousMonth = currentIndex > 0 ? months[currentIndex - 1] : null;

    const computeDelta = (currentValue, previousValue) => {
      const safeCurrent = Number.isFinite(currentValue) ? currentValue : 0;
      const safePrevious = Number.isFinite(previousValue) ? previousValue : 0;
      const absolute = safeCurrent - safePrevious;
      const percent = safePrevious !== 0 ? (absolute / safePrevious) * 100 : null;
      return { absolute, percent };
    };

    const delta =
      currentMonth && previousMonth
        ? {
            posts: computeDelta(currentMonth.posts, previousMonth.posts),
            interactions: computeDelta(
              currentMonth.interactions,
              previousMonth.interactions,
            ),
            likes: computeDelta(currentMonth.likes, previousMonth.likes),
            comments: computeDelta(currentMonth.comments, previousMonth.comments),
          }
        : null;

    const safeLatestInteractions = sanitizeMonthlyValue(
      currentMonth?.interactions,
    );
    const safeLatestComments = sanitizeMonthlyValue(currentMonth?.comments);
    const safeLatestLikes = sanitizeMonthlyValue(currentMonth?.likes);
    const safeLatestPosts = sanitizeMonthlyValue(currentMonth?.posts);
    const safePreviousInteractions = sanitizeMonthlyValue(
      previousMonth?.interactions,
    );
    const safePreviousComments = sanitizeMonthlyValue(previousMonth?.comments);
    const safePreviousLikes = sanitizeMonthlyValue(previousMonth?.likes);
    const safePreviousPosts = sanitizeMonthlyValue(previousMonth?.posts);

    const currentMetrics = currentMonth
      ? [
          { key: "posts", label: "Post TikTok", value: safeLatestPosts },
          { key: "likes", label: "Likes Personil", value: safeLatestLikes },
          {
            key: "comments",
            label: "Komentar Personil",
            value: safeLatestComments,
          },
          {
            key: "interactions",
            label: "Interaksi Personil",
            value: safeLatestInteractions,
          },
        ]
      : [];

    const previousMetrics = previousMonth
      ? [
          { key: "posts", label: "Post TikTok", value: safePreviousPosts },
          { key: "likes", label: "Likes Personil", value: safePreviousLikes },
          {
            key: "comments",
            label: "Komentar Personil",
            value: safePreviousComments,
          },
          {
            key: "interactions",
            label: "Interaksi Personil",
            value: safePreviousInteractions,
          },
        ]
      : [];

    const deltaMetrics =
      delta && previousMonth
        ? [
            {
              key: "posts",
              label: "Perubahan Post",
              absolute: Math.round(delta.posts?.absolute ?? 0),
              percent:
                delta.posts?.percent !== null &&
                delta.posts?.percent !== undefined
                  ? delta.posts.percent
                  : null,
            },
            {
              key: "likes",
              label: "Perubahan Likes Personil",
              absolute: Math.round(delta.likes?.absolute ?? 0),
              percent:
                delta.likes?.percent !== null &&
                delta.likes?.percent !== undefined
                  ? delta.likes.percent
                  : null,
            },
            {
              key: "comments",
              label: "Perubahan Komentar Personil",
              absolute: Math.round(delta.comments?.absolute ?? 0),
              percent:
                delta.comments?.percent !== null &&
                delta.comments?.percent !== undefined
                  ? delta.comments.percent
                  : null,
            },
            {
              key: "interactions",
              label: "Perubahan Interaksi Personil",
              absolute: Math.round(delta.interactions?.absolute ?? 0),
              percent:
                delta.interactions?.percent !== null &&
                delta.interactions?.percent !== undefined
                  ? delta.interactions.percent
                  : null,
            },
          ]
        : [];

    const series = Array.isArray(months)
      ? (() => {
          if (currentIndex < 0) {
            return [];
          }
          const startIndex = Math.max(0, currentIndex - 5);
          return months.slice(startIndex, currentIndex + 1).map((month) => {
            const interactions = sanitizeMonthlyValue(month.interactions);
            const posts = sanitizeMonthlyValue(month.posts);
            const comments = sanitizeMonthlyValue(month.comments);
            const likes = sanitizeMonthlyValue(month.likes);
            return {
              key: month.key,
              label: formatMonthRangeLabel(month.start, month.end),
              primary: interactions,
              secondary: posts,
              posts,
              comments,
              likes,
              start: month.start,
              end: month.end,
            };
          });
        })()
      : [];

    const monthsCount = months.length;
    const currentPeriodLabel = currentMonth
      ? formatMonthRangeLabel(currentMonth.start, currentMonth.end)
      : null;
    const previousPeriodLabel = previousMonth
      ? formatMonthRangeLabel(previousMonth.start, previousMonth.end)
      : null;

    return {
      currentMetrics,
      previousMetrics,
      deltaMetrics,
      series,
      monthsCount,
      currentPeriodLabel,
      previousPeriodLabel,
      hasComparison: Boolean(previousMonth),
      hasRecords: Boolean(trend.hasRecords && currentMonth),
    };
  }, [tiktokMonthlyTrend, selectedMonthKey]);

  const showPlatformLoading = platformsLoading;
  const instagramMonthlyTrendDescription =
    instagramMonthlyCardData.monthsCount < 2
      ? "Interaksi, likes & komentar personil serta jumlah post Instagram per bulan. Data perbandingan belum lengkap."
      : "Interaksi, likes & komentar personil serta jumlah post Instagram per bulan.";
  const instagramMonthlyCardError = !showPlatformLoading
    ? platformError
      ? platformError
      : instagramMonthlyCardData.monthsCount === 0 &&
        instagramMonthlyCardData.hasRecords
      ? "Belum ada data aktivitas Instagram bulanan yang terekam."
      : instagramMonthlyCardData.monthsCount === 1
      ? "Belum cukup data bulanan Instagram untuk dibandingkan."
      : ""
    : "";

  const tiktokMonthlyTrendDescription =
    tiktokMonthlyCardData.monthsCount < 2
      ? "Interaksi, komentar & likes personel serta jumlah post TikTok per bulan. Data perbandingan belum lengkap."
      : "Interaksi, komentar & likes personel serta jumlah post TikTok per bulan.";
  const tiktokMonthlyCardError = !showPlatformLoading
    ? platformError
      ? platformError
      : tiktokMonthlyCardData.monthsCount === 0 &&
        tiktokMonthlyCardData.hasRecords
      ? "Belum ada data aktivitas TikTok bulanan yang terekam."
      : tiktokMonthlyCardData.monthsCount === 1
      ? "Belum cukup data bulanan TikTok untuk dibandingkan."
      : ""
    : "";

  const shouldShowInstagramTrendCard = shouldShowWeeklyTrendCard({
    showPlatformLoading,
    platformError,
    hasMonthlyPlatforms: true,
    cardHasRecords: instagramMonthlyCardData.hasRecords,
  });
  const shouldShowTiktokTrendCard = shouldShowWeeklyTrendCard({
    showPlatformLoading,
    platformError,
    hasMonthlyPlatforms: true,
    cardHasRecords: tiktokMonthlyCardData.hasRecords,
  });

  const shouldShowInstagramWeeklyTrendCard = shouldShowWeeklyTrendCard({
    showPlatformLoading,
    platformError,
    hasMonthlyPlatforms: Boolean(instagramMonthlyTrend?.months?.length > 0),
    cardHasRecords: instagramWeeklyTrendCardData.hasRecords,
  });
  const shouldShowTiktokWeeklyTrendCard = shouldShowWeeklyTrendCard({
    showPlatformLoading,
    platformError,
    hasMonthlyPlatforms: Boolean(tiktokMonthlyTrend?.months?.length > 0),
    cardHasRecords: tiktokWeeklyTrendCardData.hasRecords,
  });
  const shouldShowDailyTrend = dailyInteractionTrend.series.length > 0;

  const instagramWeeklyTrendError = !showPlatformLoading
    ? platformError
      ? platformError
      : instagramWeeklyTrendCardData.hasAnyPosts &&
        !instagramWeeklyTrendCardData.hasRecords
      ? "Belum ada data engagement mingguan Instagram yang siap ditampilkan."
      : ""
    : "";
  const tiktokWeeklyTrendError = !showPlatformLoading
    ? platformError
      ? platformError
      : tiktokWeeklyTrendCardData.hasAnyPosts &&
        !tiktokWeeklyTrendCardData.hasRecords
      ? "Belum ada data engagement mingguan TikTok yang siap ditampilkan."
      : ""
    : "";

  if (isCheckingAccess) {
    return null;
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-brand-100/60 bg-gradient-to-br from-white via-brand-50 to-collab-50 p-8 shadow-[0_25px_55px_rgba(18,74,97,0.14)]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-neutral-navy">Executive Summary</h1>
            <p className="max-w-2xl text-sm text-neutral-slate">
              Sistem Cicero dibangun sebagai sarana pengawasan dan pengendalian terhadap kepatuhan personil Ditbinmas Polda Jatim dan Bhabinkamtibmas Polres Jajaran
              dalam melaksanakan tugas likes dan komentar pada konten akun official Instagram dan TikTok.
              Melalui data yang dihimpun secara otomatis, Cicero menyajikan gambaran menyeluruh terkait kinerja personil,
              tingkat partisipasi, serta kualitas pelaksanaan tugas dalam mendukung komunikasi publik Polri.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-end lg:justify-end">
            <div className="w-full sm:w-64">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-700/80">
                  Show Data By
                </span>
                <div className="grid gap-3">
                  <label className="flex flex-col text-sm font-medium text-neutral-slate">
                    <span className="text-base font-semibold text-neutral-navy">Month</span>
                    <select
                      value={selectedMonthIndex}
                      onChange={(event) => {
                        const nextIndex = Number.parseInt(event.target.value, 10);
                        setSelectedMonthIndex((previous) => {
                          if (!Number.isFinite(nextIndex)) {
                            return previous;
                          }
                          return clamp(nextIndex, 0, 11);
                        });
                      }}
                      className="mt-2 w-full rounded-xl border border-brand-100 bg-white/90 px-4 py-2 text-neutral-navy shadow-none transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand/50"
                      aria-label="Filter data by month"
                    >
                      {monthDropdownOptions.map((option) => (
                        <option
                          key={option.key}
                          value={option.monthIndex}
                          disabled={
                            !option.isAvailable && filteredMonthOptions.length > 0
                          }
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col text-sm font-medium text-neutral-slate">
                    <span className="text-base font-semibold text-neutral-navy">Year</span>
                    <select
                      value={selectedYear}
                      onChange={(event) => {
                        const nextYear = Number.parseInt(event.target.value, 10);
                        setSelectedYear((previous) => {
                          if (!Number.isFinite(nextYear)) {
                            return previous;
                          }
                          return clamp(
                            nextYear,
                            MIN_SELECTABLE_YEAR,
                            MAX_SELECTABLE_YEAR,
                          );
                        });
                      }}
                      className="mt-2 w-full rounded-xl border border-brand-100 bg-white/90 px-4 py-2 text-neutral-navy shadow-none transition focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand/50"
                      aria-label="Filter data by year"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section
        aria-label="Tren Aktivitas Harian"
        className="space-y-6 rounded-3xl border border-brand-100/60 bg-gradient-to-br from-white via-brand-50/60 to-collab-50/60 p-6 shadow-[0_20px_45px_rgba(29,107,135,0.12)]"
      >
        <div className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-600">
            Tren Aktivitas Harian
          </h2>
          <p className="text-sm text-neutral-mist">
            Pergerakan harian jumlah konten, likes, komentar, dan total interaksi personil pada periode terpilih.
          </p>
        </div>

        {showPlatformLoading ? (
          <div className="flex h-48 items-center justify-center text-sm text-neutral-slate">
            Menyiapkan tren harian…
          </div>
        ) : shouldShowDailyTrend ? (
          <DailyTrendChart
            series={dailyInteractionTrend.series}
            totals={dailyInteractionTrend.totals}
            dayCount={dailyInteractionTrend.dayCount}
            formatNumber={formatNumber}
          />
        ) : (
          <div className="rounded-2xl border border-brand-100/50 bg-white/85 p-6 text-sm text-neutral-slate">
            Belum ada data tren harian untuk periode ini.
          </div>
        )}
      </section>

      {(shouldShowInstagramWeeklyTrendCard || shouldShowTiktokWeeklyTrendCard) ? (
        <section
          aria-label="Tren Interaksi Mingguan"
          className="space-y-6 rounded-3xl border border-brand-100/60 bg-gradient-to-br from-white via-brand-50/60 to-collab-50/60 p-6 shadow-[0_20px_45px_rgba(29,107,135,0.12)]"
        >
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-600">
              Tren Interaksi Mingguan
            </h2>
            <p className="text-sm text-neutral-mist">
              Perbandingan performa konten mingguan berdasarkan total interaksi.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {shouldShowInstagramWeeklyTrendCard ? (
              <PlatformEngagementTrendChart
                platformKey="instagram"
                platformLabel="Instagram"
                series={instagramWeeklyTrendCardData.series}
                latest={instagramWeeklyTrendCardData.latestWeek}
                previous={instagramWeeklyTrendCardData.previousWeek}
                loading={showPlatformLoading}
                error={instagramWeeklyTrendError}
                formatNumber={formatNumber}
              />
            ) : null}

            {shouldShowTiktokWeeklyTrendCard ? (
              <PlatformEngagementTrendChart
                platformKey="tiktok"
                platformLabel="TikTok"
                series={tiktokWeeklyTrendCardData.series}
                latest={tiktokWeeklyTrendCardData.latestWeek}
                previous={tiktokWeeklyTrendCardData.previousWeek}
                loading={showPlatformLoading}
                error={tiktokWeeklyTrendError}
                formatNumber={formatNumber}
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {!showPlatformLoading &&
      (shouldShowInstagramTrendCard || shouldShowTiktokTrendCard) ? (
        <section
          aria-label="Tren Aktivitas Bulanan"
          className="space-y-6 rounded-3xl border border-brand-100/60 bg-gradient-to-br from-white via-brand-50/60 to-collab-50/60 p-6 shadow-[0_20px_45px_rgba(29,107,135,0.12)]"
        >
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-600">
              Tren Aktivitas Bulanan
            </h2>
            <p className="text-sm text-neutral-mist">
              Ringkasan performa konten dan interaksi personel berdasarkan data bulanan
              terbaru.
            </p>
            {selectedMonthName || selectedYearLabel ? (
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-neutral-slate">
                {selectedMonthName ? (
                  <span>
                    Bulan dipilih:{" "}
                    <span className="font-semibold text-neutral-navy">
                      {selectedMonthName}
                    </span>
                  </span>
                ) : null}
                {selectedYearLabel ? (
                  <span>
                    Tahun dipilih:{" "}
                    <span className="font-semibold text-neutral-navy">
                      {selectedYearLabel}
                    </span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {shouldShowInstagramTrendCard ? (
              <MonthlyTrendCard
                title="Instagram"
                description={instagramMonthlyTrendDescription}
                error={instagramMonthlyCardError}
                currentMetrics={instagramMonthlyCardData.currentMetrics}
                previousMetrics={instagramMonthlyCardData.previousMetrics}
                deltaMetrics={instagramMonthlyCardData.deltaMetrics}
                series={instagramMonthlyCardData.series}
                currentPeriodLabel={instagramMonthlyCardData.currentPeriodLabel}
                previousPeriodLabel={instagramMonthlyCardData.previousPeriodLabel}
                formatNumber={formatNumber}
                formatPercent={formatPercent}
                primaryMetricLabel="Interaksi Personil"
                secondaryMetricLabel="Jumlah Post"
              />
            ) : null}

            {shouldShowTiktokTrendCard ? (
              <MonthlyTrendCard
                title="TikTok"
                description={tiktokMonthlyTrendDescription}
                error={tiktokMonthlyCardError}
                currentMetrics={tiktokMonthlyCardData.currentMetrics}
                previousMetrics={tiktokMonthlyCardData.previousMetrics}
                deltaMetrics={tiktokMonthlyCardData.deltaMetrics}
                series={tiktokMonthlyCardData.series}
                currentPeriodLabel={tiktokMonthlyCardData.currentPeriodLabel}
                previousPeriodLabel={tiktokMonthlyCardData.previousPeriodLabel}
                formatNumber={formatNumber}
                formatPercent={formatPercent}
                primaryMetricLabel="Interaksi Personil"
                secondaryMetricLabel="Jumlah Post"
              />
            ) : null}
          </div>
        </section>
      ) : null}

      <section
        aria-label="Insight Pengguna Aktual"
        className="space-y-6 rounded-3xl border border-sky-100 bg-white p-6 shadow-md"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-sky-700">
              Insight User / Personil Ditbinmas dan Binmas Polres Jajaran Polda Jatim.
            </h2>
          </div>
        </div>

        {userInsightState.loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-neutral-slate">
            Memuat insight pengguna…
          </div>
        ) : userInsightState.error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {userInsightState.error}
          </div>
        ) : (
          <div className="space-y-8 text-slate-800">
            {userSummary ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:border-sky-200">
                    <div className="relative space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                        Total Personil
                      </p>
                      <p className="text-3xl font-semibold text-slate-900">
                        {formatNumber(userSummary.totalUsers, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-slate-500">Tercatat dalam direktori aktif.</p>
                    </div>
                  </div>
                  <div className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:border-sky-200">
                    <div className="relative space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                        Instagram Lengkap
                      </p>
                      <p className="text-2xl font-semibold text-slate-900">
                        {formatNumber(userSummary.instagramFilled, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatPercent(userSummary.instagramPercent)} dari total personil.
                      </p>
                    </div>
                  </div>
                  <div className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:border-sky-200">
                    <div className="relative space-y-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-700">
                        TikTok Lengkap
                      </p>
                      <p className="text-2xl font-semibold text-slate-900">
                        {formatNumber(userSummary.tiktokFilled, { maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatPercent(userSummary.tiktokPercent)} dari total personil.
                      </p>
                    </div>
                  </div>
                  <div className="group relative overflow-hidden rounded-2xl border border-sky-100 bg-white p-5 shadow-md transition-transform duration-300 hover:-translate-y-1 hover:border-emerald-200/60">
                    <div className="relative flex h-full flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-600">
                          IG & TikTok Lengkap
                        </p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {formatNumber(userSummary.bothCount, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <span className="inline-flex items-center justify-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 ring-1 ring-inset ring-emerald-100">
                        {formatPercent(userSummary.bothPercent)} dari keseluruhan data
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="space-y-6">
              <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-2">
                <section className="group relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-md transition-colors hover:border-sky-200">
                  <div className="relative">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                          Rasio Kelengkapan Data Tertinggi per Satker / Polres
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Menampilkan lima Polres dengan jumlah personil terbesar.
                        </p>
                      </div>
                    </div>
                    {completionBarData.length > 0 ? (
                      <div className="mt-6 h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={completionBarData}
                            layout="vertical"
                            margin={{ top: 10, right: 24, bottom: 10, left: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(125, 211, 252, 0.25)" horizontal={false} />
                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              ticks={[0, 25, 50, 75, 100]}
                              tickFormatter={(value) => `${value}%`}
                              tick={{ fill: "#0f172a", fontSize: 11 }}
                              axisLine={{ stroke: "rgba(148, 163, 184, 0.5)" }}
                            />
                            <YAxis
                              dataKey="division"
                              type="category"
                              width={120}
                              tick={{ fill: "#0f172a", fontSize: 12 }}
                              axisLine={{ stroke: "rgba(148, 163, 184, 0.5)" }}
                            />
                            <Tooltip cursor={{ fill: "rgba(125, 211, 252, 0.16)" }} content={<CompletionTooltip />} />
                            <Bar dataKey="completion" fill="#0ea5e9" radius={[0, 6, 6, 0]} maxBarSize={24}>
                              <LabelList
                                dataKey="completion"
                                position="right"
                                formatter={(value) => `${value}%`}
                                fill="#0f172a"
                                fontSize={11}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="mt-6 flex h-48 items-center justify-center text-sm text-slate-500">
                        Belum ada data divisi yang bisa ditampilkan.
                      </div>
                    )}
                  </div>
                </section>

                <section className="group relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-md transition-colors hover:border-sky-200">
                  <div className="relative">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                          10 Polres dengan Rasio Kelengkapan Data Terendah
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Fokuskan pendampingan pada satuan kerja dengan performa terendah.
                        </p>
                      </div>
                    </div>
                    {lowestCompletionDivisions.length > 0 ? (
                      <div className="mt-6 h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={lowestCompletionDivisions}
                            layout="vertical"
                            margin={{ top: 10, right: 24, bottom: 10, left: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(252, 211, 77, 0.25)" horizontal={false} />
                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              ticks={[0, 25, 50, 75, 100]}
                              tickFormatter={(value) => `${value}%`}
                              tick={{ fill: "#0f172a", fontSize: 11 }}
                              axisLine={{ stroke: "rgba(148, 163, 184, 0.5)" }}
                            />
                            <YAxis
                              dataKey="division"
                              type="category"
                              width={120}
                              tick={{ fill: "#0f172a", fontSize: 12 }}
                              axisLine={{ stroke: "rgba(148, 163, 184, 0.5)" }}
                            />
                            <Tooltip cursor={{ fill: "rgba(253, 186, 116, 0.16)" }} content={<CompletionTooltip />} />
                            <Bar dataKey="completion" fill="#f97316" radius={[0, 6, 6, 0]} maxBarSize={24}>
                              <LabelList
                                dataKey="completion"
                                position="right"
                                formatter={(value) => `${value}%`}
                                fill="#0f172a"
                                fontSize={11}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="mt-6 flex h-48 items-center justify-center text-sm text-slate-500">
                        Belum ada data satker yang bisa dibandingkan.
                      </div>
                    )}
                  </div>
                </section>

                <section className="group relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-md transition-colors hover:border-sky-200">
                  <div className="relative">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                          Komposisi Kelengkapan Data Username Sosial Media
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Peta distribusi personil berdasarkan status pengisian akun.
                        </p>
                      </div>
                    </div>
                    {pieData.length > 0 && pieTotal > 0 ? (
                      <div className="mt-6 h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={100}
                              paddingAngle={4}
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                              <LabelList
                                dataKey="value"
                                position="outside"
                                formatter={(value) =>
                                  pieTotal
                                    ? `${formatPercent((value / pieTotal) * 100)}`
                                    : "0%"
                                }
                                fill="#0f172a"
                                fontSize={11}
                              />
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.96)",
                                borderRadius: 16,
                                borderColor: "rgba(125, 211, 252, 0.4)",
                                color: "#0f172a",
                              }}
                              formatter={(value) => [
                                `${formatNumber(value, { maximumFractionDigits: 0 })} admin`,
                                "Jumlah",
                              ]}
                            />
                            <Legend verticalAlign="bottom" wrapperStyle={{ color: "#0f172a" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="mt-6 flex h-60 items-center justify-center text-sm text-slate-500">
                        Belum ada distribusi data yang bisa divisualisasikan.
                      </div>
                    )}
                  </div>
                </section>

                <section className="group relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-md transition-colors hover:border-sky-200">
                  <div className="relative">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                          Komposisi Data Personil pada Satker
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Proporsi personil berdasarkan satker dengan agregasi satker lainnya.
                        </p>
                      </div>
                    </div>
                    {divisionComposition.length > 0 && divisionCompositionTotal > 0 ? (
                      <div className="mt-6 h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={divisionComposition}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={55}
                              outerRadius={100}
                              paddingAngle={3}
                            >
                              {divisionComposition.map((entry, index) => (
                                <Cell
                                  key={entry.name}
                                  fill={SATKER_PIE_COLORS[index % SATKER_PIE_COLORS.length]}
                                />
                              ))}
                              <LabelList
                                dataKey="value"
                                position="outside"
                                formatter={(value) =>
                                  divisionCompositionTotal
                                    ? `${formatPercent((value / divisionCompositionTotal) * 100)}`
                                    : "0%"
                                }
                                fill="#0f172a"
                                fontSize={11}
                              />
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "rgba(255, 255, 255, 0.96)",
                                borderRadius: 16,
                                borderColor: "rgba(125, 211, 252, 0.4)",
                                color: "#0f172a",
                              }}
                              formatter={(value, _name, item) => [
                                `${formatNumber(value, { maximumFractionDigits: 0 })} personil`,
                                item?.payload?.name ?? "Satker",
                              ]}
                            />
                            <Legend verticalAlign="bottom" wrapperStyle={{ color: "#0f172a" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="mt-6 flex h-60 items-center justify-center text-sm text-slate-500">
                        Belum ada komposisi satker yang bisa divisualisasikan.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <section className="group relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-md transition-colors hover:border-sky-200">
                <div className="relative space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                        Distribusi User per Satker
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Diurutkan berdasarkan kelengkapan dan total personil.
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Data diperbarui untuk periode {fallbackMonthLabel}.
                      </p>
                    </div>
                    {userSummary?.totalUsers ? (
                      <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 ring-1 ring-sky-100">
                        Total {formatNumber(userSummary.totalUsers, { maximumFractionDigits: 0 })} personil
                      </span>
                    ) : null}
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-sky-100 bg-white">
                    {divisionDistribution.length > 0 ? (
                      <div className="divide-y divide-sky-100 text-sm text-slate-800">
                        <div className="grid grid-cols-[minmax(3rem,4rem)_minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_minmax(0,1fr)] gap-4 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
                          <span>Peringkat</span>
                          <span>Satker / Polres</span>
                          <span className="text-right">Total Personil</span>
                          <span className="text-right">Instagram</span>
                          <span className="text-right">TikTok</span>
                          <span className="text-right">Rasio Kelengkapan</span>
                        </div>
                        {divisionDistribution.map((row) => {
                          const instagramPercent = Math.min(Math.max(row.instagramPercent, 0), 100);
                          const tiktokPercent = Math.min(Math.max(row.tiktokPercent, 0), 100);
                          const completionPercent = Math.min(Math.max(row.completionPercent, 0), 100);

                          return (
                            <div
                              key={row.id || row.division}
                              className="grid grid-cols-[minmax(3rem,4rem)_minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_minmax(0,1fr)] items-start gap-4 px-4 py-4 transition-colors hover:bg-sky-50"
                            >
                              <div className="tabular-nums text-sm font-semibold text-slate-500">
                                {String(row.rank).padStart(2, "0")}
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-800">{row.division}</p>
                                <p className="text-xs text-slate-500">
                                  {formatPercent(row.sharePercent)} dari total personil
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="tabular-nums text-base font-semibold text-slate-800">
                                  {formatNumber(row.total, { maximumFractionDigits: 0 })}
                                </p>
                                <p className="text-xs text-slate-500">Personil</p>
                              </div>
                              <div className="text-right">
                                <p className="tabular-nums text-base font-semibold text-slate-800">
                                  {formatNumber(row.instagramFilled, { maximumFractionDigits: 0 })}
                                </p>
                                <p className="text-xs text-slate-500">{formatPercent(instagramPercent)}</p>
                              </div>
                              <div className="text-right">
                                <p className="tabular-nums text-base font-semibold text-slate-800">
                                  {formatNumber(row.tiktokFilled, { maximumFractionDigits: 0 })}
                                </p>
                                <p className="text-xs text-slate-500">{formatPercent(tiktokPercent)}</p>
                              </div>
                              <div className="text-right">
                                <p className="tabular-nums text-base font-semibold text-slate-800">
                                  {formatPercent(completionPercent)}
                                </p>
                                <p className="text-xs text-slate-500">Kelengkapan</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex h-48 items-center justify-center text-sm text-slate-500">
                        Belum ada distribusi satker yang bisa ditampilkan.
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <article className="w-full rounded-3xl border border-sky-100 bg-white p-6 shadow-md">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                  Catatan Insight Data Personil
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{narrative}</p>
              </article>
            </div>
          </div>
        )}
      </section>

      <section
        className="relative overflow-hidden rounded-[36px] border border-sky-200/70 bg-gradient-to-br from-sky-50 via-indigo-50/70 to-emerald-50/70 p-8 shadow-[0_32px_68px_rgba(16,63,95,0.16)]"
        aria-label="Rincian Kinerja Platform"
      >
        <div className="pointer-events-none absolute -top-24 -right-16 h-60 w-60 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-10 h-72 w-72 rounded-full bg-emerald-200/35 blur-3xl" />
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-sky-800/80 shadow-sm ring-1 ring-white/70">
              Rincian Kinerja Platform
            </span>
            <h2 className="text-2xl font-semibold text-neutral-navy">
              Pemetaan Kontribusi Kanal Sosial
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-neutral-mist">
              Bandingkan performa inti tiap kanal untuk melihat kontribusi terhadap interaksi keseluruhan dan menjaga
              konsistensi keterlibatan tim.
            </p>
            <p className="text-xs text-neutral-slate/80">
              Seluruh data pada segmen ini mengikuti pilihan bulan dan tahun pada filter di bagian atas halaman.
            </p>
          </div>

          <div className="space-y-6">
            {showPlatformLoading ? (
              <div className="flex h-40 items-center justify-center rounded-3xl border border-sky-200/70 bg-white/75 p-6 text-sm text-neutral-slate shadow-inner">
                Memuat data rekap likes…
              </div>
            ) : platformError ? (
              <div className="flex h-40 items-center justify-center rounded-3xl border border-rose-400/50 bg-rose-100/60 p-6 text-sm font-semibold text-rose-700 shadow-sm">
                {platformError}
              </div>
            ) : likesSummary?.clients?.length ? (
              <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-[0_18px_38px_rgba(14,78,102,0.12)] backdrop-blur">
                <PlatformLikesSummary
                  data={likesSummary}
                  formatNumber={formatNumber}
                  formatPercent={formatPercent}
                  personnelActivity={{
                    loading: userInsightState.loading,
                    error: userInsightState.error,
                    categories: activityCategories,
                    totalEvaluated,
                    totalContentEvaluated,
                    hasSummary: Boolean(activityBuckets),
                  }}
                  postTotals={{
                    instagram: instagramPostCount,
                    tiktok: tiktokPostCount,
                  }}
                  summaryCards={summaryCards}
                />
              </div>
            ) : (
              <div className="rounded-3xl border border-sky-200/70 bg-white/75 p-6 text-sm text-neutral-slate shadow-inner">
                Belum ada data rekap likes untuk periode ini.
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        aria-label="Daftar Konten Berperforma"
        className="rounded-3xl border border-brand-100/60 bg-white/95 p-6 shadow-[0_20px_45px_rgba(29,107,135,0.12)]"
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-600">
          Konten dengan Performa Tertinggi
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-brand-100/50 text-left">
            <thead className="bg-brand-50 text-xs uppercase tracking-wider text-neutral-mist">
              <tr>
                <th scope="col" className="w-32 px-4 py-3">Platform</th>
                <th scope="col" className="px-4 py-3">Judul Konten</th>
                <th scope="col" className="w-32 px-4 py-3">Format</th>
                <th scope="col" className="w-36 px-4 py-3">Tanggal</th>
                <th scope="col" className="w-32 px-4 py-3 text-right">Likes</th>
                <th scope="col" className="w-32 px-4 py-3 text-right">Komentar</th>
                <th scope="col" className="w-40 px-4 py-3 text-right">Total Interaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-100/50 text-sm text-neutral-navy">
              {topContentRows.length > 0 ? (
                topContentRows.map((row) => {
                  const title = row.title || "-";
                  const truncatedTitle =
                    title.length > 120 ? `${title.slice(0, 120)}...` : title;

                  return (
                    <tr key={row.id} className="transition-colors hover:bg-brand-50/60">
                      <td className="px-4 py-3 font-medium text-brand-600">
                        {row.platform || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-navy" title={title}>
                          {truncatedTitle}
                        </p>
                      </td>
                    <td className="px-4 py-3 text-neutral-mist">
                      {row.format || "-"}
                    </td>
                    <td className="px-4 py-3 text-neutral-mist">
                      {formatPublishedDate(row.publishedAt)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(row.likes, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatNumber(row.comments, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-brand-600">
                      {formatNumber(row.totalInteractions, { maximumFractionDigits: 0 })}
                    </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-neutral-slate" colSpan={7}>
                    Belum ada data konten untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section
        aria-label="Ringkasan Narasi Performa"
        className="rounded-3xl border border-brand-100/60 bg-white/95 p-6 shadow-[0_20px_45px_rgba(29,107,135,0.12)]"
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-brand-600">
          Narasi Performa Otomatis
        </h2>
        {pageNarrative.length > 0 ? (
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-navy">
            {pageNarrative.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-slate">
            Narasi akan muncul ketika data performa tersedia untuk periode terpilih.
          </p>
        )}
      </section>

    </div>
  );
}
