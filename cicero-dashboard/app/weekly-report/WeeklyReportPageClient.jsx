"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import PlatformEngagementTrendChart from "@/components/executive-summary/PlatformEngagementTrendChart";
import PlatformLikesSummary from "@/components/executive-summary/PlatformLikesSummary";
import useAuth from "@/hooks/useAuth";
import useRequireAuth from "@/hooks/useRequireAuth";
import {
  getInstagramPosts,
  getRekapKomentarTiktok,
  getRekapLikesIG,
  getTiktokPosts,
  getUserDirectory,
} from "@/utils/api";
import {
  aggregateLikesRecords,
  createEmptyLikesSummary,
  ensureRecordsHaveActivityDate,
  mergeActivityRecords,
  prepareTrendActivityRecords,
} from "@/app/executive-summary/dataTransforms";
import {
  POST_DATE_PATHS,
  normalizePlatformPost,
} from "@/app/executive-summary/sharedUtils";
import {
  formatWeekRangeLabel,
  groupRecordsByWeek,
  parseDateValue,
} from "@/app/executive-summary/weeklyTrendUtils";

const WEEK_OPTIONS = [
  { label: "Minggu 1", value: "1" },
  { label: "Minggu 2", value: "2" },
  { label: "Minggu 3", value: "3" },
  { label: "Minggu 4", value: "4" },
];

const MONTH_OPTIONS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
].map((label, index) => ({ label, value: String(index + 1) }));

const YEAR_OPTIONS = Array.from({ length: 6 }, (_, index) => {
  const year = 2023 + index;
  return { label: String(year), value: String(year) };
});

const CLIENT_ID = "DITBINMAS";

const padNumber = (value) => String(value).padStart(2, "0");

const buildMonthKey = (year, month) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  if (!Number.isFinite(numericYear) || !Number.isFinite(numericMonth)) {
    return null;
  }
  return `${numericYear}-${padNumber(Math.max(1, Math.min(12, numericMonth)))}`;
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
  const startDate = `${year}-${padNumber(monthIndex + 1)}-01`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const endDate = `${year}-${padNumber(monthIndex + 1)}-${padNumber(lastDay)}`;
  return {
    startDate,
    endDate,
    start: new Date(year, monthIndex, 1),
    end: new Date(year, monthIndex, lastDay),
  };
};

const getWeekDateRange = (weekValue, monthValue, yearValue) => {
  const weekNumber = Math.max(1, Math.min(4, Number(weekValue) || 1));
  const monthNumber = Math.max(1, Math.min(12, Number(monthValue) || 1));
  const yearNumber = Number(yearValue) || new Date().getFullYear();

  const startDay = 1 + (weekNumber - 1) * 7;
  const start = new Date(yearNumber, monthNumber - 1, startDay);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();
  if (end.getMonth() !== monthNumber - 1) {
    end.setFullYear(yearNumber, monthNumber - 1, daysInMonth);
  }

  const startDate = `${yearNumber}-${padNumber(monthNumber)}-${padNumber(start.getDate())}`;
  const endDate = `${yearNumber}-${padNumber(monthNumber)}-${padNumber(
    Math.min(end.getDate(), daysInMonth),
  )}`;

  return {
    weekNumber,
    monthNumber,
    yearNumber,
    start,
    end,
    startDate,
    endDate,
  };
};

const getPreviousWeekRange = (range) => {
  if (!range?.start) {
    return null;
  }
  const end = new Date(range.start);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);

  return {
    start,
    end,
    startDate: `${start.getFullYear()}-${padNumber(start.getMonth() + 1)}-${padNumber(start.getDate())}`,
    endDate: `${end.getFullYear()}-${padNumber(end.getMonth() + 1)}-${padNumber(end.getDate())}`,
  };
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

const filterRecordsByDateRange = (records, range) => {
  if (!Array.isArray(records)) {
    return [];
  }

  if (!range?.startDate && !range?.endDate) {
    return records;
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

  return records.filter((record) => {
    const resolvedDate = parseDateValue(record?.activityDate) ??
      parseDateValue(record?.tanggal ?? record?.date) ??
      parseDateValue(record?.created_at ?? record?.createdAt);

    if (!resolvedDate) {
      return false;
    }

    const timestamp = resolvedDate.getTime();

    if (startTime !== null && timestamp < startTime) {
      return false;
    }

    if (endTime !== null && timestamp > endTime) {
      return false;
    }

    return true;
  });
};

const buildWeeklyEngagementTrend = (records = [], { platformKey = "", platformLabel = "" } = {}) => {
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

      const resolvedDate =
        (record?.activityDate instanceof Date && !Number.isNaN(record.activityDate.valueOf())
          ? record.activityDate
          : null) ??
        parseDateValue(record?.activityDate) ??
        parseDateValue(record?.tanggal ?? record?.date) ??
        parseDateValue(
          record?.createdAt ?? record?.created_at ?? record?.timestamp ?? record?.published_at ?? null,
        ) ??
        (normalized.publishedAt instanceof Date && !Number.isNaN(normalized.publishedAt.valueOf())
          ? normalized.publishedAt
          : null);

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
      { interactions: 0, posts: 0, likes: 0, comments: 0 },
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

const resolveActiveLabel = (options, value) =>
  options.find((option) => option.value === value)?.label ?? "";

const resolveWeekDateRange = (weekValue, monthValue, yearValue) => {
  const range = getWeekDateRange(weekValue, monthValue, yearValue);
  if (!range) {
    return "";
  }
  const formatDay = (date) => padNumber(date.getDate());
  return `${formatDay(range.start)}-${formatDay(range.end)}`;
};

const buildComparison = (currentValue, previousValue, formatter) => {
  const currentNumeric = Number.isFinite(currentValue) ? Number(currentValue) : 0;
  const previousNumeric = Number.isFinite(previousValue) ? Number(previousValue) : 0;
  const delta = currentNumeric - previousNumeric;

  if (Math.abs(delta) < 0.0001) {
    return {
      label: "Setara dengan minggu sebelumnya",
      direction: "flat",
    };
  }

  const direction = delta > 0 ? "up" : "down";
  const formattedDelta = formatter(Math.abs(delta));
  const sign = delta > 0 ? "+" : "-";

  return {
    label: `${sign}${formattedDelta} dibanding minggu sebelumnya`,
    direction,
  };
};

const formatNumberFactory = () => {
  const cache = new Map();
  return (value, options) => {
    const numericValue = Number.isFinite(value) ? Number(value) : 0;
    const key = JSON.stringify(options ?? {});
    if (!cache.has(key)) {
      cache.set(key, new Intl.NumberFormat("id-ID", options ?? {}));
    }
    const formatter = cache.get(key);
    return formatter.format(Math.max(0, numericValue));
  };
};

const formatPercentFactory = () => {
  const cache = new Map();
  return (value) => {
    const numericValue = Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
    const fractionDigits = numericValue > 0 && numericValue < 10 ? 1 : 0;
    const key = String(fractionDigits);
    if (!cache.has(key)) {
      cache.set(
        key,
        new Intl.NumberFormat("id-ID", {
          maximumFractionDigits: fractionDigits,
          minimumFractionDigits: fractionDigits,
        }),
      );
    }
    const formatter = cache.get(key);
    return `${formatter.format(numericValue)}%`;
  };
};

const extractDirectoryUsers = (directoryResponse) => {
  const possibleCollections = [
    directoryResponse,
    directoryResponse?.data,
    directoryResponse?.users,
    directoryResponse?.payload,
    directoryResponse?.data?.data,
    directoryResponse?.data?.users,
  ];

  const collection = possibleCollections.find((value) => Array.isArray(value));
  return Array.isArray(collection) ? collection : [];
};

const normalizeDirectoryCount = (directoryResponse) => {
  const users = extractDirectoryUsers(directoryResponse);
  if (users.length > 0) {
    return users.length;
  }

  const possibleTotals = [
    directoryResponse?.total,
    directoryResponse?.count,
    directoryResponse?.data?.total,
    directoryResponse?.data?.count,
    directoryResponse?.data?.length,
    directoryResponse?.users?.length,
  ];

  const numericTotal = possibleTotals.find((value) => typeof value === "number" && Number.isFinite(value));
  return typeof numericTotal === "number" ? numericTotal : null;
};

const formatDirectoryDescriptor = (count, formatNumber) => {
  const label = "Personil Ditbinmas";
  if (count == null) {
    return label;
  }
  return `${formatNumber(count, { maximumFractionDigits: 0 })} ${label}`;
};

const computeSelectedSeriesPoint = (seriesData, selectedLabel) => {
  if (!Array.isArray(seriesData?.series) || seriesData.series.length === 0) {
    return { latest: seriesData?.latestWeek ?? null, previous: seriesData?.previousWeek ?? null };
  }

  if (!selectedLabel) {
    return { latest: seriesData.latestWeek ?? null, previous: seriesData.previousWeek ?? null };
  }

  const index = seriesData.series.findIndex((entry) => entry.label === selectedLabel);
  if (index < 0) {
    return { latest: seriesData.latestWeek ?? null, previous: seriesData.previousWeek ?? null };
  }

  return {
    latest: seriesData.series[index] ?? seriesData.latestWeek ?? null,
    previous:
      index > 0
        ? seriesData.series[index - 1]
        : seriesData.series.length > 1
        ? seriesData.series[0]
        : seriesData.previousWeek ?? null,
  };
};

export default function WeeklyReportPageClient() {
  useRequireAuth();
  const { token, role, clientId } = useAuth();
  const [{ week: defaultWeek, month: defaultMonth, year: defaultYear }] = useState(() => {
    const now = new Date();
    const weekOfMonth = Math.min(4, Math.max(1, Math.ceil(now.getDate() / 7)));
    return {
      week: String(weekOfMonth),
      month: String(now.getMonth() + 1),
      year: String(now.getFullYear()),
    };
  });
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  const normalizedRole = useMemo(() => {
    if (role) return String(role).trim().toLowerCase();
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("user_role") || "").trim().toLowerCase();
  }, [role]);

  const normalizedClientId = useMemo(() => {
    if (clientId) return String(clientId).trim().toUpperCase();
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("client_id") || "").trim().toUpperCase();
  }, [clientId]);

  const isDitbinmasAuthorized =
    normalizedRole === "ditbinmas" && normalizedClientId === CLIENT_ID;

  const formatNumber = useMemo(() => formatNumberFactory(), []);
  const formatPercentValue = useMemo(() => formatPercentFactory(), []);

  const { data: ditbinmasDirectory } = useSWR(
    token && isDitbinmasAuthorized ? ["ditbinmas-directory", token] : null,
    ([, tk]) => getUserDirectory(tk, CLIENT_ID),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const ditbinmasUsers = useMemo(
    () => extractDirectoryUsers(ditbinmasDirectory),
    [ditbinmasDirectory],
  );

  const ditbinmasPersonnelCount = useMemo(() => {
    const directoryCount = normalizeDirectoryCount(ditbinmasDirectory);
    if (directoryCount != null) {
      return directoryCount;
    }
    return ditbinmasUsers.length > 0 ? ditbinmasUsers.length : null;
  }, [ditbinmasDirectory, ditbinmasUsers.length]);

  const ditbinmasPersonnelDescriptor = useMemo(
    () => formatDirectoryDescriptor(ditbinmasPersonnelCount, formatNumber),
    [ditbinmasPersonnelCount, formatNumber],
  );

  const monthKey = useMemo(
    () => buildMonthKey(selectedYear, selectedMonth),
    [selectedMonth, selectedYear],
  );
  const monthRange = useMemo(() => getMonthDateRange(monthKey), [monthKey]);
  const weeklyRange = useMemo(
    () => getWeekDateRange(selectedWeek, selectedMonth, selectedYear),
    [selectedWeek, selectedMonth, selectedYear],
  );
  const previousWeekRange = useMemo(
    () => getPreviousWeekRange(weeklyRange),
    [weeklyRange],
  );

  const [monthlyState, setMonthlyState] = useState({
    loading: false,
    error: "",
    likesRecords: [],
    commentRecords: [],
    instagramPosts: [],
    tiktokPosts: [],
  });

  useEffect(() => {
    if (!token || !isDitbinmasAuthorized || !monthRange) {
      setMonthlyState((prev) => ({
        ...prev,
        loading: false,
      }));
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const loadData = async () => {
      setMonthlyState({
        loading: true,
        error: "",
        likesRecords: [],
        commentRecords: [],
        instagramPosts: [],
        tiktokPosts: [],
      });

      const errorTargets = [];

      try {
        const likesPromise = getRekapLikesIG(
          token,
          CLIENT_ID,
          "harian",
          undefined,
          monthRange.startDate,
          monthRange.endDate,
          controller.signal,
        ).catch((error) => {
          console.warn("Gagal memuat rekap likes IG", error);
          errorTargets.push("rekap likes Instagram");
          return { data: [] };
        });

        const commentsPromise = getRekapKomentarTiktok(
          token,
          CLIENT_ID,
          "harian",
          undefined,
          monthRange.startDate,
          monthRange.endDate,
          controller.signal,
        ).catch((error) => {
          console.warn("Gagal memuat rekap komentar TikTok", error);
          errorTargets.push("rekap komentar TikTok");
          return { data: [] };
        });

        const instagramPromise = getInstagramPosts(token, CLIENT_ID, {
          startDate: monthRange.startDate,
          endDate: monthRange.endDate,
          signal: controller.signal,
        }).catch((error) => {
          console.warn("Gagal memuat konten Instagram", error);
          errorTargets.push("konten Instagram");
          return [];
        });

        const tiktokPromise = getTiktokPosts(token, CLIENT_ID, {
          startDate: monthRange.startDate,
          endDate: monthRange.endDate,
          signal: controller.signal,
        }).catch((error) => {
          console.warn("Gagal memuat konten TikTok", error);
          errorTargets.push("konten TikTok");
          return [];
        });

        const [likesRes, commentsRes, instagramRes, tiktokRes] = await Promise.all([
          likesPromise,
          commentsPromise,
          instagramPromise,
          tiktokPromise,
        ]);

        if (cancelled) {
          return;
        }

        const likesRecords = prepareTrendActivityRecords(ensureArray(likesRes), {
          fallbackDate: monthRange.startDate,
        });
        const commentRecords = prepareTrendActivityRecords(ensureArray(commentsRes), {
          fallbackDate: monthRange.startDate,
        });
        const instagramPosts = ensureRecordsHaveActivityDate(ensureArray(instagramRes), {
          extraPaths: POST_DATE_PATHS,
        });
        const tiktokPosts = ensureRecordsHaveActivityDate(ensureArray(tiktokRes), {
          extraPaths: POST_DATE_PATHS,
        });

        const errorMessage = errorTargets.length
          ? `Gagal memuat ${errorTargets.join(", ")}.`
          : "";

        setMonthlyState({
          loading: false,
          error: errorMessage,
          likesRecords,
          commentRecords,
          instagramPosts,
          tiktokPosts,
        });
      } catch (error) {
        if (cancelled || error?.name === "AbortError") {
          return;
        }
        console.error("Gagal memuat data mingguan", error);
        setMonthlyState({
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Gagal memuat data mingguan Ditbinmas.",
          likesRecords: [],
          commentRecords: [],
          instagramPosts: [],
          tiktokPosts: [],
        });
      }
    };

    loadData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, isDitbinmasAuthorized, monthRange?.startDate, monthRange?.endDate]);

  const weeklyLikesRecords = useMemo(
    () => filterRecordsByDateRange(monthlyState.likesRecords, weeklyRange),
    [monthlyState.likesRecords, weeklyRange],
  );

  const weeklyCommentRecords = useMemo(
    () => filterRecordsByDateRange(monthlyState.commentRecords, weeklyRange),
    [monthlyState.commentRecords, weeklyRange],
  );

  const previousLikesRecords = useMemo(() => {
    if (!previousWeekRange) {
      return [];
    }
    return filterRecordsByDateRange(monthlyState.likesRecords, previousWeekRange);
  }, [monthlyState.likesRecords, previousWeekRange]);

  const previousCommentRecords = useMemo(() => {
    if (!previousWeekRange) {
      return [];
    }
    return filterRecordsByDateRange(monthlyState.commentRecords, previousWeekRange);
  }, [monthlyState.commentRecords, previousWeekRange]);

  const weeklyMergedRecords = useMemo(
    () => mergeActivityRecords(weeklyLikesRecords, weeklyCommentRecords),
    [weeklyLikesRecords, weeklyCommentRecords],
  );
  const previousMergedRecords = useMemo(
    () => mergeActivityRecords(previousLikesRecords, previousCommentRecords),
    [previousLikesRecords, previousCommentRecords],
  );

  const weeklyLikesSummary = useMemo(() => {
    if (weeklyMergedRecords.length === 0 && ditbinmasUsers.length === 0) {
      return createEmptyLikesSummary();
    }
    return aggregateLikesRecords(weeklyMergedRecords, { directoryUsers: ditbinmasUsers });
  }, [weeklyMergedRecords, ditbinmasUsers]);

  const previousWeeklySummary = useMemo(() => {
    if (previousMergedRecords.length === 0 && ditbinmasUsers.length === 0) {
      return createEmptyLikesSummary();
    }
    return aggregateLikesRecords(previousMergedRecords, { directoryUsers: ditbinmasUsers });
  }, [previousMergedRecords, ditbinmasUsers]);

  const weeklyInstagramPosts = useMemo(
    () => filterRecordsByDateRange(monthlyState.instagramPosts, weeklyRange),
    [monthlyState.instagramPosts, weeklyRange],
  );

  const weeklyTiktokPosts = useMemo(
    () => filterRecordsByDateRange(monthlyState.tiktokPosts, weeklyRange),
    [monthlyState.tiktokPosts, weeklyRange],
  );

  const previousInstagramPosts = useMemo(() => {
    if (!previousWeekRange) {
      return [];
    }
    return filterRecordsByDateRange(monthlyState.instagramPosts, previousWeekRange);
  }, [monthlyState.instagramPosts, previousWeekRange]);

  const previousTiktokPosts = useMemo(() => {
    if (!previousWeekRange) {
      return [];
    }
    return filterRecordsByDateRange(monthlyState.tiktokPosts, previousWeekRange);
  }, [monthlyState.tiktokPosts, previousWeekRange]);

  const totalPosts = weeklyInstagramPosts.length + weeklyTiktokPosts.length;
  const previousTotalPosts = previousInstagramPosts.length + previousTiktokPosts.length;

  const weeklyTotals = weeklyLikesSummary.totals ?? {
    totalLikes: 0,
    totalComments: 0,
    totalPersonnel: 0,
    activePersonnel: 0,
    complianceRate: 0,
    averageComplianceRate: 0,
  };

  const previousTotals = previousWeeklySummary.totals ?? {
    totalLikes: 0,
    totalComments: 0,
    totalPersonnel: 0,
    activePersonnel: 0,
    complianceRate: 0,
    averageComplianceRate: 0,
  };

  const resolvedTotalPersonnel = weeklyTotals.totalPersonnel || ditbinmasPersonnelCount || 0;
  const totalActive = weeklyTotals.activePersonnel || 0;
  const totalLikes = weeklyTotals.totalLikes || 0;
  const totalComments = weeklyTotals.totalComments || 0;
  const complianceRate = weeklyTotals.complianceRate || 0;
  const previousLikes = previousTotals.totalLikes || 0;
  const previousComments = previousTotals.totalComments || 0;
  const previousComplianceRate = previousTotals.complianceRate || 0;

  const instagramTrendData = useMemo(() => {
    const postsForTrend = monthRange
      ? filterRecordsByDateRange(monthlyState.instagramPosts, monthRange)
      : monthlyState.instagramPosts;
    return buildWeeklyEngagementTrend(postsForTrend, {
      platformKey: "instagram",
      platformLabel: "Instagram",
    });
  }, [monthlyState.instagramPosts, monthRange]);

  const tiktokTrendData = useMemo(() => {
    const postsForTrend = monthRange
      ? filterRecordsByDateRange(monthlyState.tiktokPosts, monthRange)
      : monthlyState.tiktokPosts;
    return buildWeeklyEngagementTrend(postsForTrend, {
      platformKey: "tiktok",
      platformLabel: "TikTok",
    });
  }, [monthlyState.tiktokPosts, monthRange]);

  const selectedWeekLabel = weeklyRange
    ? formatWeekRangeLabel(weeklyRange.start, weeklyRange.end)
    : "";

  const { latest: instagramLatest, previous: instagramPrevious } = useMemo(
    () => computeSelectedSeriesPoint(instagramTrendData, selectedWeekLabel),
    [instagramTrendData, selectedWeekLabel],
  );

  const { latest: tiktokLatest, previous: tiktokPrevious } = useMemo(
    () => computeSelectedSeriesPoint(tiktokTrendData, selectedWeekLabel),
    [tiktokTrendData, selectedWeekLabel],
  );

  const weeklySummaryCards = useMemo(() => {
    const postsComparison = buildComparison(totalPosts, previousTotalPosts, (value) =>
      formatNumber(value, { maximumFractionDigits: 0 }),
    );
    const likesComparison = buildComparison(totalLikes, previousLikes, (value) =>
      formatNumber(value, { maximumFractionDigits: 0 }),
    );
    const commentsComparison = buildComparison(totalComments, previousComments, (value) =>
      formatNumber(value, { maximumFractionDigits: 0 }),
    );

    const complianceComparison = (() => {
      if (!Number.isFinite(complianceRate) || !Number.isFinite(previousComplianceRate)) {
        return null;
      }
      const delta = complianceRate - previousComplianceRate;
      if (Math.abs(delta) < 0.01) {
        return {
          label: "Setara dengan minggu sebelumnya",
          direction: "flat",
        };
      }
      const direction = delta > 0 ? "up" : "down";
      const formatter = new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: Math.abs(delta) < 10 ? 1 : 0,
        minimumFractionDigits: Math.abs(delta) < 10 ? 1 : 0,
      });
      const label = `${delta > 0 ? "+" : "-"}${formatter.format(Math.abs(delta))} poin dibanding minggu sebelumnya`;
      return { label, direction };
    })();

    return [
      {
        key: "personnel-total",
        label: "Jumlah Personil",
        value: formatNumber(resolvedTotalPersonnel, { maximumFractionDigits: 0 }),
        description: "Total personil Ditbinmas terdaftar.",
      },
      {
        key: "total-posts",
        label: "Total Post",
        value: formatNumber(totalPosts, { maximumFractionDigits: 0 }),
        description: `Post Instagram: ${formatNumber(weeklyInstagramPosts.length, {
          maximumFractionDigits: 0,
        })} · Post TikTok: ${formatNumber(weeklyTiktokPosts.length, { maximumFractionDigits: 0 })}`,
        comparison: postsComparison,
      },
      {
        key: "total-likes",
        label: "Total Likes",
        value: formatNumber(totalLikes, { maximumFractionDigits: 0 }),
        description: "Seluruh likes personil selama minggu terpilih.",
        comparison: likesComparison,
      },
      {
        key: "total-comments",
        label: "Total Komentar",
        value: formatNumber(totalComments, { maximumFractionDigits: 0 }),
        description: "Kumulatif komentar personil pada minggu ini.",
        comparison: commentsComparison,
      },
      {
        key: "overall-compliance",
        label: "Kepatuhan Personil",
        value: formatPercentValue(complianceRate),
        description: `${formatNumber(totalActive, {
          maximumFractionDigits: 0,
        })} aktif dari ${formatNumber(resolvedTotalPersonnel, {
          maximumFractionDigits: 0,
        })} personil.`,
        comparison: complianceComparison,
      },
    ];
  }, [
    totalPosts,
    previousTotalPosts,
    totalLikes,
    previousLikes,
    totalComments,
    previousComments,
    complianceRate,
    previousComplianceRate,
    resolvedTotalPersonnel,
    totalActive,
    weeklyInstagramPosts.length,
    weeklyTiktokPosts.length,
    formatNumber,
    formatPercentValue,
  ]);

  const likesSummaryData = useMemo(() => ({
    ...weeklyLikesSummary,
    totals: {
      ...weeklyLikesSummary.totals,
      totalPersonnel: resolvedTotalPersonnel,
      activePersonnel: totalActive,
      complianceRate,
      averageComplianceRate:
        weeklyLikesSummary.totals?.averageComplianceRate ?? complianceRate ?? 0,
    },
  }), [weeklyLikesSummary, resolvedTotalPersonnel, totalActive, complianceRate]);

  const weeklyLabelOverrides = useMemo(
    () => ({
      likesContributorsDescription: "Satfung dengan kontribusi likes tertinggi pada minggu ini.",
      commentContributorsDescription:
        "Satfung dengan jumlah komentar terbanyak selama minggu ini.",
      tableTitle: "Distribusi Engagement Per Satker",
      tableEmptyLabel: "Belum ada data engagement personil untuk minggu ini.",
    }),
    [],
  );

  const weekDescriptor = useMemo(() => {
    const weekLabel = resolveActiveLabel(WEEK_OPTIONS, selectedWeek);
    const monthLabel = resolveActiveLabel(MONTH_OPTIONS, selectedMonth);
    if (!weekLabel || !monthLabel) {
      return "Periode terpilih";
    }
    return `${weekLabel} ${monthLabel} ${selectedYear}`;
  }, [selectedWeek, selectedMonth, selectedYear]);

  const weekRangeLabel = useMemo(
    () => resolveWeekDateRange(selectedWeek, selectedMonth, selectedYear),
    [selectedWeek, selectedMonth, selectedYear],
  );

  const weeklyPeriodLabel = useMemo(() => {
    if (!weeklyRange) {
      return weekDescriptor;
    }
    const formattedRange = formatWeekRangeLabel(weeklyRange.start, weeklyRange.end);
    return `${resolveActiveLabel(WEEK_OPTIONS, selectedWeek)} • ${formattedRange} ${selectedYear}`;
  }, [weeklyRange, weekDescriptor, selectedWeek, selectedYear]);

  const weeklyDistributionMeta = useMemo(() => {
    if (!weeklyRange) {
      return null;
    }
    const formattedRange = formatWeekRangeLabel(weeklyRange.start, weeklyRange.end);
    return {
      note: `${formattedRange} ${selectedYear} · ${formatNumber(totalPosts, {
        maximumFractionDigits: 0,
      })} konten dipantau`,
    };
  }, [weeklyRange, selectedYear, totalPosts, formatNumber]);

  const weeklyPostTotals = useMemo(
    () => ({
      instagram: weeklyInstagramPosts.length,
      tiktok: weeklyTiktokPosts.length,
    }),
    [weeklyInstagramPosts.length, weeklyTiktokPosts.length],
  );

  const loadingState = monthlyState.loading;
  const fetchError = monthlyState.error;

  const monthLabel = resolveActiveLabel(MONTH_OPTIONS, selectedMonth);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-24">
      <div className="mx-auto w-full max-w-6xl space-y-10 px-4 pt-8 sm:px-6 lg:px-8">
        <header className="rounded-3xl border border-emerald-200/40 bg-gradient-to-br from-emerald-100/20 via-emerald-50/10 to-sky-100/10 p-8 shadow-[0_30px_70px_rgba(16,185,129,0.22)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-200/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-200">
                Ditbinmas Weekly Report
              </div>
              <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Laporan Mingguan Engagement Ditbinmas
              </h1>
              <p className="max-w-2xl text-sm text-emerald-100/80">
                Halaman ini merangkum analisis mingguan atas pelaksanaan likes dan komentar oleh Personil Ditbinmas,
                sehingga Anda dapat langsung melihat perkembangan interaksi dari pekan ke pekan berdasarkan pilihan
                periode di bawah.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-emerald-200/30 bg-white/90 p-6 text-sm shadow-lg sm:w-80">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.28em] text-emerald-800">
                <span>Periode</span>
                <span>{selectedYear}</span>
              </div>
              <div className="mt-4 grid gap-3">
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Minggu</span>
                  <select
                    value={selectedWeek}
                    onChange={(event) => setSelectedWeek(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-emerald-200/70 bg-white px-4 py-2 text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  >
                    {WEEK_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Bulan</span>
                  <select
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-emerald-200/70 bg-white px-4 py-2 text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  >
                    {MONTH_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-sm font-medium text-slate-700">
                  <span className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Tahun</span>
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-emerald-200/70 bg-white px-4 py-2 text-slate-900 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
                  >
                    {YEAR_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-4 rounded-xl bg-emerald-50/70 px-4 py-3 text-xs text-emerald-700">
                <p className="font-semibold text-emerald-900">Ringkasan</p>
                <p className="mt-1 leading-relaxed text-emerald-700/80">
                  {weekDescriptor} · {monthLabel} {selectedYear}
                  {weekRangeLabel ? ` · Rentang ${weekRangeLabel}` : ""}
                </p>
              </div>
            </div>
          </div>
        </header>

        {isDitbinmasAuthorized ? (
          <>
            <section className="space-y-6 rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-white via-emerald-50/80 to-sky-50/80 p-6 shadow-[0_20px_45px_rgba(45,212,191,0.15)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">
                    Tren Interaksi Mingguan
                  </h2>
                  <p className="text-sm text-slate-600">
                    Perbandingan performa konten mingguan berdasarkan total interaksi pada Instagram dan TikTok oleh {ditbinmasPersonnelDescriptor}.
                  </p>
                </div>
                <div className="rounded-full border border-emerald-100 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-500">
                  {weeklyPeriodLabel}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <PlatformEngagementTrendChart
                  platformKey="instagram"
                  platformLabel="Instagram"
                  series={instagramTrendData.series}
                  latest={instagramLatest}
                  previous={instagramPrevious}
                  loading={loadingState}
                  error={fetchError}
                  formatNumber={formatNumber}
                  personnelCount={resolvedTotalPersonnel || undefined}
                />

                <PlatformEngagementTrendChart
                  platformKey="tiktok"
                  platformLabel="TikTok"
                  series={tiktokTrendData.series}
                  latest={tiktokLatest}
                  previous={tiktokPrevious}
                  loading={loadingState}
                  error={fetchError}
                  formatNumber={formatNumber}
                  personnelCount={resolvedTotalPersonnel || undefined}
                />
              </div>
            </section>

            <section
              className="relative overflow-hidden rounded-[36px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/90 p-8 shadow-[0_28px_60px_rgba(52,211,153,0.2)]"
              aria-label="Rincian Kinerja Platform"
            >
              <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

              <div className="relative space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-700 shadow-sm ring-1 ring-white/70">
                      Rincian Kinerja Platform
                    </span>
                    <h2 className="text-2xl font-semibold text-emerald-900">
                      Detail Kinerja Kanal Mingguan
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-emerald-800/80">
                      Menampilkan distribusi likes dan komentar per satfung Ditbinmas selama {weekDescriptor}, sehingga perkembangan kontribusi personil mudah dipantau.
                    </p>
                    <p className="text-xs text-emerald-700/70">
                      Data diringkas otomatis mengikuti pilihan minggu, bulan, dan tahun pada bagian atas halaman.
                    </p>
                  </div>

                  <div className="rounded-full border border-emerald-200 bg-white/85 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600 shadow-sm">
                    {weeklyPeriodLabel}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_24px_50px_rgba(16,185,129,0.18)] backdrop-blur">
                  {loadingState ? (
                    <div className="flex h-32 items-center justify-center text-sm text-emerald-700/70">
                      Menyiapkan ringkasan mingguan…
                    </div>
                  ) : (
                    <PlatformLikesSummary
                      data={{
                        ...likesSummaryData,
                        lastUpdated: likesSummaryData.lastUpdated ?? weeklyRange?.end ?? new Date(),
                      }}
                      formatNumber={formatNumber}
                      formatPercent={formatPercentValue}
                      personnelActivity={null}
                      postTotals={weeklyPostTotals}
                      summaryCards={weeklySummaryCards}
                      labelOverrides={weeklyLabelOverrides}
                      personnelDistribution={null}
                      personnelDistributionMeta={weeklyDistributionMeta}
                      hiddenSections={{
                        topCompliance: true,
                        topCommentPersonnel: true,
                        topLikesPersonnel: true,
                      }}
                    />
                  )}
                  {fetchError ? (
                    <p className="mt-4 text-center text-xs font-semibold text-rose-600">
                      {fetchError}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-3xl border border-rose-100 bg-white/70 p-8 text-center text-slate-600 shadow-lg backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl">⚠️</div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Akses Terbatas
            </h2>
            <p className="mt-2 text-sm">
              Laporan mingguan Ditbinmas hanya dapat diakses oleh pengguna dengan peran dan client ID Ditbinmas. Silakan hubungi admin untuk meminta akses.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

