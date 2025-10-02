"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Download } from "lucide-react";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
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
} from "./dataTransforms";
import {
  pickNestedValue,
  pickNestedString,
  parseDateValue,
  resolveRecordDate,
  groupRecordsByWeek,
  groupRecordsByMonth,
  shouldShowWeeklyTrendCard,
  formatWeekRangeLabel,
  formatMonthRangeLabel,
} from "./weeklyTrendUtils";
import {
  INSTAGRAM_LIKE_FIELD_PATHS,
  TIKTOK_COMMENT_FIELD_PATHS,
  sumActivityRecords,
} from "./activityRecords";

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(Math.max(value, min), max);
};

const parsePercent = (value) => {
  if (typeof value === "number") {
    return clamp(value, 0, 100);
  }

  if (typeof value === "string") {
    const sanitized = value.replace(/[^0-9,.-]+/g, "").replace(/,/g, ".");
    const parsed = parseFloat(sanitized);
    return Number.isFinite(parsed) ? clamp(parsed, 0, 100) : 0;
  }

  const coerced = Number(value);
  return Number.isFinite(coerced) ? clamp(coerced, 0, 100) : 0;
};

const formatNumber = (value, options = {}) => {
  const formatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: options.maximumFractionDigits ?? 1,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  });
  return formatter.format(value ?? 0);
};

const formatPercent = (value) => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const fractionDigits = safeValue < 10 && safeValue > 0 ? 1 : 0;
  return `${formatNumber(safeValue, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  })}%`;
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
    <div className="rounded-2xl border border-slate-700/60 bg-slate-900/90 px-4 py-3 text-xs text-slate-200 shadow-xl">
      <p className="font-semibold text-slate-100">{data.fullDivision}</p>
      <p className="mt-2 text-slate-300">
        Rasio Kelengkapan: {formatPercent(data.completion)}
      </p>
      <p className="text-slate-400">Instagram Lengkap: {formatPercent(data.instagram)}</p>
      <p className="text-slate-400">TikTok Lengkap: {formatPercent(data.tiktok)}</p>
      <p className="mt-1 text-slate-500">
        Total Personil: {formatNumber(data.total, { maximumFractionDigits: 0 })}
      </p>
    </div>
  );
};

const beautifyDivisionName = (rawName) => {
  const cleaned = (rawName || "").toString().replace(/[_]+/g, " ").trim();
  if (!cleaned) {
    return "Unit Lainnya";
  }
  return cleaned
    .split(/\s+/)
    .map((segment) => {
      if (!segment) return segment;
      if (segment.length <= 3) {
        return segment.toUpperCase();
      }
      return segment.charAt(0) + segment.slice(1).toLowerCase();
    })
    .join(" ");
};

const shortenDivisionName = (name) => {
  const formatted = beautifyDivisionName(name);
  return formatted.length > 20 ? `${formatted.slice(0, 19)}…` : formatted;
};

const extractUserGroupInfo = (user) => {
  const candidateFields = [
    user?.client_id,
  ];

  for (const field of candidateFields) {
    if (typeof field === "string" && field.trim() !== "") {
      const label = field.trim();
      return {
        key: label.toUpperCase(),
        label,
      };
    }
  }

  const clientIdentifier =
    user?.client_id ?? user?.clientId ?? user?.clientID ?? user?.id;
  if (clientIdentifier) {
    const label = String(clientIdentifier).trim();
    return {
      key: label.toUpperCase(),
      label,
    };
  }

  return {
    key: "LAINNYA",
    label: "LAINNYA",
  };
};

const buildUserNarrative = ({
  totalUsers,
  bothCount,
  bothPercent,
  instagramPercent,
  tiktokPercent,
  onlyInstagramPercent,
  onlyTikTokPercent,
  nonePercent,
  bestDivision,
  lowestDivision,
}) => {
  if (!totalUsers) {
    return "Belum ada data pengguna yang dapat dianalisis. Minta pada satker untuk memperbarui direktori terlebih dahulu.";
  }

  const sentences = [];
  sentences.push(
    `Direktori saat ini memuat ${formatNumber(totalUsers, { maximumFractionDigits: 0 })} personil aktif.`,
  );

  if (bothCount > 0) {
    sentences.push(
      `${formatNumber(bothCount, { maximumFractionDigits: 0 })} personil (${formatPercent(
        bothPercent,
      )}) telah melengkapi data Instagram dan TikTok sekaligus sehingga absensi pada platform Instagram dan Tiktok berjalan mulus.`,
    );
  } else {
    sentences.push(
      `Belum ada personil yang melengkapi kedua akun sosial media sekaligus, sehingga perlu kampanye internal untuk melakukan update username pada Instagram dan Tiktok.`,
    );
  }

  const igVsTtGap = Math.abs(instagramPercent - tiktokPercent);
  if (igVsTtGap < 5) {
    sentences.push(
      `Kelengkapan akun Instagram (${formatPercent(instagramPercent)}) dan TikTok (${formatPercent(
        tiktokPercent,
      )}) sudah relatif seimbang, menandakan prosedur input berjalan konsisten.`,
    );
  } else if (instagramPercent > tiktokPercent) {
    sentences.push(
      `Instagram masih unggul dengan kelengkapan ${formatPercent(
        instagramPercent,
      )}, sementara TikTok berada di ${formatPercent(
        tiktokPercent,
      )}; dorong satker agar mengejar ketertinggalan dengan melakukan update username.`,
    );
  } else {
    sentences.push(
      `TikTok justru lebih siap (${formatPercent(
        tiktokPercent,
      )}) dibanding Instagram (${formatPercent(
        instagramPercent,
      )}); perlu penguatan dorongan update username.`,
    );
  }

  if (bestDivision) {
    sentences.push(
      `${beautifyDivisionName(
        bestDivision.displayName ?? bestDivision.division,
      )} menjadi Polres paling siap dengan kelengkapan rata-rata ${formatPercent(
        bestDivision.completionPercent,
      )} dan basis ${formatNumber(bestDivision.total, { maximumFractionDigits: 0 })} personil aktif.`,
    );
  }

  if (lowestDivision && lowestDivision.division !== bestDivision?.division) {
    sentences.push(
      `Pendampingan perlu difokuskan pada ${beautifyDivisionName(
        lowestDivision.displayName ?? lowestDivision.division,
      )} yang baru mencapai ${formatPercent(
        lowestDivision.completionPercent,
      )} rata-rata kelengkapan data username.`,
    );
  }

  if (nonePercent > 0) {
    sentences.push(
      `Dari total seluruh data personil yang sudah diinput, ${formatPercent(nonePercent)} personil belum melakukan update data username sama sekali.`,
    );
  } else if (onlyInstagramPercent > 0 || onlyTikTokPercent > 0) {
    sentences.push(
      `Sisanya tersebar pada personil yang baru melengkapi satu username (${formatPercent(
        onlyInstagramPercent + onlyTikTokPercent,
      )}); targetkan follow-up ringan agar profil mereka seratus persen siap.`,
    );
  }

  return sentences.join(" ");
};

const computeUserInsight = (users = []) => {
  const totalUsers = users.length;
  let instagramFilled = 0;
  let tiktokFilled = 0;
  let bothCount = 0;
  let onlyInstagram = 0;
  let onlyTikTok = 0;
  let none = 0;

  const divisionMap = new Map();

  users.forEach((user) => {
    const hasInstagram = Boolean(user?.insta && String(user.insta).trim() !== "");
    const hasTikTok = Boolean(user?.tiktok && String(user.tiktok).trim() !== "");

    if (hasInstagram) instagramFilled += 1;
    if (hasTikTok) tiktokFilled += 1;
    if (hasInstagram && hasTikTok) {
      bothCount += 1;
    } else if (hasInstagram) {
      onlyInstagram += 1;
    } else if (hasTikTok) {
      onlyTikTok += 1;
    } else {
      none += 1;
    }

    const { key: divisionKey, label: divisionLabel } = extractUserGroupInfo(user);

    if (!divisionMap.has(divisionKey)) {
      divisionMap.set(divisionKey, {
        division: divisionKey,
        displayName: divisionLabel,
        total: 0,
        igFilled: 0,
        ttFilled: 0,
      });
    }

    const record = divisionMap.get(divisionKey);
    record.total += 1;
    if (hasInstagram) record.igFilled += 1;
    if (hasTikTok) record.ttFilled += 1;
  });

  const instagramPercent = totalUsers ? (instagramFilled / totalUsers) * 100 : 0;
  const tiktokPercent = totalUsers ? (tiktokFilled / totalUsers) * 100 : 0;
  const bothPercent = totalUsers ? (bothCount / totalUsers) * 100 : 0;
  const onlyInstagramPercent = totalUsers ? (onlyInstagram / totalUsers) * 100 : 0;
  const onlyTikTokPercent = totalUsers ? (onlyTikTok / totalUsers) * 100 : 0;
  const nonePercent = totalUsers ? (none / totalUsers) * 100 : 0;

  const divisionArray = Array.from(divisionMap.values()).map((item) => {
    const igPercent = item.total ? (item.igFilled / item.total) * 100 : 0;
    const tiktokPercentDivision = item.total ? (item.ttFilled / item.total) * 100 : 0;
    const completionPercent = item.total
      ? ((item.igFilled + item.ttFilled) / (item.total * 2)) * 100
      : 0;
    return {
      ...item,
      displayName: item.displayName ?? item.division,
      igPercent,
      tiktokPercent: tiktokPercentDivision,
      completionPercent,
    };
  });

  const sortedByTotal = [...divisionArray].sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    return b.completionPercent - a.completionPercent;
  });

  const completionBarData = sortedByTotal.slice(0, 5).map((item) => ({
    division: shortenDivisionName(item.displayName ?? item.division),
    fullDivision: beautifyDivisionName(item.displayName ?? item.division),
    completion: Number(item.completionPercent.toFixed(1)),
    instagram: Number(item.igPercent.toFixed(1)),
    tiktok: Number(item.tiktokPercent.toFixed(1)),
    total: item.total,
  }));

  const lowestCompletionDivisions = divisionArray
    .filter((item) => item.total > 0)
    .sort((a, b) => {
      if (a.completionPercent !== b.completionPercent) {
        return a.completionPercent - b.completionPercent;
      }
      if (a.total !== b.total) {
        return a.total - b.total;
      }
      return beautifyDivisionName(a.displayName ?? a.division).localeCompare(
        beautifyDivisionName(b.displayName ?? b.division),
        "id-ID",
        { sensitivity: "base" },
      );
    })
    .slice(0, 10)
    .map((item) => ({
      division: shortenDivisionName(item.displayName ?? item.division),
      fullDivision: beautifyDivisionName(item.displayName ?? item.division),
      completion: Number(item.completionPercent.toFixed(1)),
      instagram: Number(item.igPercent.toFixed(1)),
      tiktok: Number(item.tiktokPercent.toFixed(1)),
      total: item.total,
    }));

  const bestDivision = [...divisionArray]
    .sort((a, b) => {
      if (b.completionPercent !== a.completionPercent) {
        return b.completionPercent - a.completionPercent;
      }
      return b.total - a.total;
    })
    .find((item) => item.total > 0);

  const lowestDivision = [...divisionArray]
    .sort((a, b) => {
      if (a.completionPercent !== b.completionPercent) {
        return a.completionPercent - b.completionPercent;
      }
      return b.total - a.total;
    })
    .find((item) => item.total > 0);

  const pieData = [
    { name: "IG & TikTok Lengkap", value: bothCount },
    { name: "Hanya IG", value: onlyInstagram },
    { name: "Hanya TikTok", value: onlyTikTok },
    { name: "Belum Diisi", value: none },
  ];

  const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const sortedByDivisionSize = [...divisionArray].sort((a, b) => b.total - a.total);
  const topDivisionCount = 6;
  const topDivisions = sortedByDivisionSize.slice(0, topDivisionCount);
  const remainingDivisions = sortedByDivisionSize.slice(topDivisionCount);

  const divisionComposition = topDivisions.map((item) => ({
    name: beautifyDivisionName(item.displayName ?? item.division),
    value: item.total,
  }));

  const remainingTotal = remainingDivisions.reduce((acc, item) => acc + item.total, 0);
  if (remainingTotal > 0) {
    divisionComposition.push({
      name: "Satker Lainnya",
      value: remainingTotal,
    });
  }

  const divisionCompositionTotal = divisionComposition.reduce(
    (acc, item) => acc + item.value,
    0,
  );

  const narrative = buildUserNarrative({
    totalUsers,
    bothCount,
    bothPercent,
    instagramPercent,
    tiktokPercent,
    onlyInstagramPercent,
    onlyTikTokPercent,
    nonePercent,
    bestDivision,
    lowestDivision,
  });

  return {
    summary: {
      totalUsers,
      instagramFilled,
      instagramPercent,
      tiktokFilled,
      tiktokPercent,
      bothCount,
      bothPercent,
    },
    completionBarData,
    lowestCompletionDivisions,
    pieData,
    pieTotal,
    divisionComposition,
    divisionCompositionTotal,
    narrative,
  };
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

const pickNestedNumeric = (source, paths = []) => {
  if (!source) {
    return 0;
  }

  for (const path of paths) {
    if (!path) {
      continue;
    }

    const segments = Array.isArray(path) ? path : String(path).split(".");
    let current = source;
    let valid = true;

    for (const segment of segments) {
      if (current == null) {
        valid = false;
        break;
      }
      current = current[segment];
    }

    if (!valid || current == null) {
      continue;
    }

    const numeric = normalizeNumericInput(current);

    if (typeof current === "number" || typeof current === "string") {
      return numeric;
    }

    if (Number.isFinite(numeric) && numeric !== 0) {
      return numeric;
    }
  }

  return 0;
};


const filterRecordsWithResolvableDate = (records, options = {}) => {
  if (!Array.isArray(records)) {
    return [];
  }

  return records.filter((record) => resolveRecordDate(record, options.extraPaths));
};

const pickNestedDate = (source, paths = []) => {
  const value = pickNestedValue(source, paths);
  return parseDateValue(value);
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

const normalizeContentType = (value, fallback = "Lainnya") => {
  if (!value) {
    return fallback;
  }

  const normalized = String(value)
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return fallback;
  }

  return normalized
    .split(/\s+/)
    .map((segment) => {
      if (!segment) {
        return segment;
      }
      if (segment.length <= 3) {
        return segment.toUpperCase();
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(" ");
};

const normalizePlatformPost = (post, { platformKey = "", fallbackIndex = 0, platformLabel = "" } = {}) => {
  if (!post || typeof post !== "object") {
    return null;
  }

  const idSource =
    pickNestedValue(post, [
      "id",
      "pk",
      "code",
      "post_id",
      "postId",
      "media_id",
      "mediaId",
      "video_id",
      "shortcode",
    ]) ?? `${platformKey || "post"}-${fallbackIndex + 1}`;
  const title =
    pickNestedString(post, [
      "title",
      "caption",
      "headline",
      "message",
      "text",
      "description",
    ]) ?? `${platformLabel || "Konten"} #${fallbackIndex + 1}`;
  const caption = pickNestedString(post, [
    "caption",
    "message",
    "description",
    "summary",
  ]);
  const permalink = pickNestedString(post, [
    "permalink",
    "url",
    "link",
    "permalink_url",
    "shortcode_url",
  ]);
  const thumbnail = pickNestedString(post, [
    "thumbnail_url",
    "thumbnail",
    "image",
    "media_url",
    "cover",
    "cover_url",
  ]);
  const type = normalizeContentType(
    pickNestedString(post, [
      "media_type",
      "type",
      "content_type",
      "format",
      "__typename",
    ]),
  );
  const publishedAt =
    pickNestedDate(post, [
      "timestamp",
      "taken_at",
      "created_time",
      "created_at",
      "publish_time",
      "published_at",
    ]) ?? null;

  const likes = Math.max(
    0,
    pickNestedNumeric(post, [
      "like_count",
      "likes",
      "statistics.like_count",
      "metrics.like_count",
      "metrics.likes",
      "insights.likes",
    ]),
  );
  const comments = Math.max(
    0,
    pickNestedNumeric(post, [
      "comment_count",
      "comments",
      "statistics.comment_count",
      "metrics.comment_count",
      "metrics.comments",
      "insights.comments",
    ]),
  );
  const shares = Math.max(
    0,
    pickNestedNumeric(post, [
      "share_count",
      "shares",
      "statistics.share_count",
      "metrics.share_count",
      "metrics.shares",
    ]),
  );
  const saves = Math.max(
    0,
    pickNestedNumeric(post, [
      "save_count",
      "saves",
      "metrics.save_count",
      "metrics.saves",
    ]),
  );
  const reach = Math.max(
    0,
    pickNestedNumeric(post, [
      "reach",
      "statistics.reach",
      "insights.reach",
      "metrics.reach",
      "metrics.played",
      "metrics.views",
    ]),
  );
  const views = Math.max(
    0,
    pickNestedNumeric(post, [
      "view_count",
      "views",
      "play_count",
      "plays",
      "statistics.view_count",
      "statistics.play_count",
    ]),
  );
  const engagementRate = Math.max(
    0,
    pickNestedNumeric(post, [
      "engagement_rate",
      "engagementRate",
      "metrics.engagement_rate",
      "metrics.engagementRate",
      "statistics.engagement_rate",
    ]),
  );

  const interactions = likes + comments + shares + saves;

  return {
    id: String(idSource),
    title,
    caption,
    type,
    permalink,
    thumbnail,
    publishedAt,
    metrics: {
      likes,
      comments,
      shares,
      saves,
      reach,
      views,
      engagementRate,
      interactions,
    },
    raw: post,
  };
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
        acc.posts += 1;

        return acc;
      },
      {
        interactions: 0,
        posts: 0,
      },
    );

    return {
      key: bucket.key,
      label: formatWeekRangeLabel(bucket.start, bucket.end),
      interactions: totals.interactions,
      posts: totals.posts,
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
const PPTX_SCRIPT_URL =
  "https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js";
const MIN_SELECTABLE_YEAR = 2025;
const MAX_SELECTABLE_YEAR = 2035;
export default function ExecutiveSummaryPage() {
  useRequireAuth();
  const { token, clientId } = useAuth();
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
  const [pptxFactory, setPptxFactory] = useState(null);
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
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let isMounted = true;

    const assignFactory = () => {
      if (!isMounted) {
        return;
      }

      const globalFactory = window.PptxGenJS;
      if (globalFactory) {
        setPptxFactory(() => globalFactory);
      }
    };

    const handleError = (event) => {
      if (!isMounted) {
        return;
      }

      console.error("Gagal memuat pustaka PptxGenJS", event);
      setPptxFactory(null);
    };

    if (window.PptxGenJS) {
      assignFactory();
      return () => {
        isMounted = false;
      };
    }

    const scriptId = "pptxgenjs-cdn-script";
    let scriptElement = document.getElementById(scriptId);

    if (!(scriptElement instanceof HTMLScriptElement)) {
      scriptElement = document.createElement("script");
      scriptElement.id = scriptId;
      scriptElement.src = PPTX_SCRIPT_URL;
      scriptElement.async = true;
      document.body.appendChild(scriptElement);
    }

    scriptElement.addEventListener("load", assignFactory);
    scriptElement.addEventListener("error", handleError);

    return () => {
      isMounted = false;
      scriptElement?.removeEventListener("load", assignFactory);
      scriptElement?.removeEventListener("error", handleError);
    };
  }, []);

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

        const likesRaw = ensureArray(likesResult);
        const commentsRaw = ensureArray(commentsResult);

        const fallbackTrendDateIso = periodRange?.startDate
          ? `${periodRange.startDate}T00:00:00.000Z`
          : null;

        const likesTrendRecords = prepareTrendActivityRecords(likesRaw, {
          fallbackDate: fallbackTrendDateIso,
        });
        const commentsTrendRecords = prepareTrendActivityRecords(commentsRaw, {
          fallbackDate: fallbackTrendDateIso,
        });

        let instagramPostsRaw = [];
        let tiktokPostsRaw = [];
        let instagramDatabasePostsRaw = [];
        let tiktokDatabasePostsRaw = [];
        let instagramDatabaseError = null;
        let tiktokDatabaseError = null;

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
          users,
          likes: likesRaw,
          comments: commentsRaw,
          totalIGPosts,
          totalTikTokPosts,
        });

        const mergedActivityRecords = mergeActivityRecords(
          likesRaw,
          commentsRaw,
        );
        const likesSummary = aggregateLikesRecords(mergedActivityRecords);
        const instagramPostsSanitized = ensureRecordsHaveActivityDate(
          instagramPostsRaw,
          {
            extraPaths: [
              "publishedAt",
              "published_at",
              "timestamp",
              "createdAt",
              "created_at",
              "date",
              "tanggal",
            ],
          },
        );
        const tiktokPostsSanitized = ensureRecordsHaveActivityDate(
          tiktokPostsRaw,
          {
            extraPaths: [
              "publishedAt",
              "published_at",
              "timestamp",
              "createdAt",
              "created_at",
              "date",
              "tanggal",
            ],
          },
        );

        if (cancelled) {
          return;
        }

        setPlatformState({
          loading: false,
          error: platformErrorMessage,
          activity: {
            likes: likesRaw,
            comments: commentsRaw,
          },
          trendActivity: {
            likes: likesTrendRecords,
            comments: commentsTrendRecords,
          },
          likesSummary,
          posts: {
            instagram: instagramPostsSanitized,
            tiktok: tiktokPostsSanitized,
          },
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
        });
      }
    };

    loadUserInsight();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, clientId, selectedMonthKey]);

  const pptSummary = useMemo(() => {
    return [
      data.dashboardNarrative,
      data.userInsightNarrative,
      data.instagramNarrative,
      data.tiktokNarrative,
    ];
  }, [data]);

  const handleDownload = () => {
    if (!pptxFactory) {
      console.error("PptxGenJS belum siap digunakan.");
      return;
    }

    const pptx = new pptxFactory();
    pptx.layout = "LAYOUT_16x9";

    const titleSlide = pptx.addSlide();
    titleSlide.addText(`Executive Summary ${data.monthLabel}`, {
      x: 0.5,
      y: 1,
      w: 9,
      fontSize: 34,
      bold: true,
      color: "1F2937",
    });
    titleSlide.addText(data.overviewNarrative, {
      x: 0.5,
      y: 2.1,
      w: 9,
      fontSize: 18,
      color: "334155",
    });

    const metricSlide = pptx.addSlide();
    metricSlide.addText("Sorotan Kinerja", {
      x: 0.5,
      y: 0.4,
      fontSize: 26,
      bold: true,
      color: "0f172a",
    });
    data.summaryMetrics.forEach((metric, index) => {
      metricSlide.addText(metric.label, {
        x: 0.5,
        y: 1.2 + index * 1.1,
        fontSize: 18,
        color: "0369a1",
      });
      metricSlide.addText(
        `${formatNumber(metric.value, { maximumFractionDigits: 1 })}${
          metric.suffix ? metric.suffix : ""
        }`,
        {
          x: 4.4,
          y: 1.2 + index * 1.1,
          fontSize: 20,
          bold: true,
          color: "0f172a",
        },
      );
      metricSlide.addText(metric.change, {
        x: 6.6,
        y: 1.2 + index * 1.1,
        fontSize: 16,
        color: "059669",
      });
    });

    const narrativeSlide = pptx.addSlide();
    narrativeSlide.addText("Insight Naratif", {
      x: 0.5,
      y: 0.4,
      fontSize: 26,
      bold: true,
      color: "0f172a",
    });
    pptSummary.forEach((item, idx) => {
      narrativeSlide.addText(`• ${item}`, {
        x: 0.5,
        y: 1.1 + idx * 0.8,
        w: 9,
        fontSize: 18,
        color: "1e293b",
      });
    });

    const tableSlide = pptx.addSlide();
    tableSlide.addText("Konten Terbaik", {
      x: 0.5,
      y: 0.4,
      fontSize: 26,
      bold: true,
      color: "0f172a",
    });
    const tableData = [
      ["Platform", "Judul", "Format", "Reach", "Engagement", "Takeaway"],
      ...data.contentTable.map((row) => [
        row.platform,
        row.title,
        row.format,
        formatNumber(row.reach, { maximumFractionDigits: 0 }),
        `${row.engagement}%`,
        row.takeaway,
      ]),
    ];
    tableSlide.addTable(tableData, {
      x: 0.3,
      y: 1.0,
      w: 9.4,
      fontSize: 14,
      colW: [1.1, 2.6, 1.0, 1.1, 1.3, 2.3],
      border: { pt: 1, color: "cbd5f5" },
      fill: "f8fafc",
      color: "0f172a",
      valign: "middle",
    });

    pptx.writeFile({
      fileName: `Executive-Summary-${data.monthLabel.replace(/\s+/g, "-")}.pptx`,
    });
  };

  const {
    summary: userSummary,
    completionBarData,
    lowestCompletionDivisions,
    pieData,
    pieTotal,
    divisionComposition,
    divisionCompositionTotal,
    narrative,
    activityBuckets,
  } = userInsightState;
  const activityCategories = Array.isArray(activityBuckets?.categories)
    ? activityBuckets.categories
    : [];
  const totalEvaluated = Number(activityBuckets?.evaluatedUsers) || 0;
  const totalContentEvaluated = Number(activityBuckets?.totalContent) || 0;
  const {
    loading: platformsLoading,
    error: platformError,
    likesSummary,
    activity: platformActivityState,
    trendActivity: platformTrendActivityState,
    posts: platformPostsState,
  } = platformState;
  const platformActivity =
    platformActivityState && typeof platformActivityState === "object"
      ? platformActivityState
      : EMPTY_ACTIVITY;
  const platformTrendActivity =
    platformTrendActivityState && typeof platformTrendActivityState === "object"
      ? platformTrendActivityState
      : EMPTY_ACTIVITY;
  const platformPosts =
    platformPostsState && typeof platformPostsState === "object"
      ? platformPostsState
      : { instagram: [], tiktok: [] };

  const instagramMonthlyTrend = useMemo(() => {
    const instagramPosts = filterRecordsWithResolvableDate(
      Array.isArray(platformPosts?.instagram) ? platformPosts.instagram : [],
      {
        extraPaths: [
          "publishedAt",
          "published_at",
          "timestamp",
          "createdAt",
          "created_at",
          "date",
          "tanggal",
        ],
      },
    );

    const monthlyPosts = groupRecordsByMonth(instagramPosts, {
      getDate: (post) => {
        if (post?.publishedAt instanceof Date) {
          return post.publishedAt;
        }
        return (
          post?.createdAt ??
          post?.created_at ??
          post?.timestamp ??
          post?.published_at ??
          null
        );
      },
    });

    const likesRecords = Array.isArray(platformTrendActivity?.likes)
      ? filterRecordsWithResolvableDate(platformTrendActivity.likes)
      : [];

    const monthlyLikes = groupRecordsByMonth(likesRecords, {
      datePaths: [
        "activityDate",
        "tanggal",
        "date",
        "created_at",
        "createdAt",
        "updated_at",
        "updatedAt",
        "time",
        "waktu",
        "rekap.tanggal",
        "rekap.date",
        "rekap.created_at",
        "rekap.createdAt",
      ],
    });

    const hasRecords = monthlyPosts.length > 0 || monthlyLikes.length > 0;
    const buckets = new Map();

    monthlyPosts.forEach((group) => {
      const key = group.key;
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          start: group.start,
          end: group.end,
          posts: 0,
          likes: 0,
        });
      }
      const entry = buckets.get(key);
      entry.posts += group.records.length;
    });

    monthlyLikes.forEach((group) => {
      const key = group.key;
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          start: group.start,
          end: group.end,
          posts: 0,
          likes: 0,
        });
      }
      const entry = buckets.get(key);
      const totalLikes = sumActivityRecords(
        group.records,
        INSTAGRAM_LIKE_FIELD_PATHS,
      );
      entry.likes += Math.max(0, Math.round(totalLikes) || 0);
    });

    const months = Array.from(buckets.values()).sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    if (months.length === 0) {
      return {
        months: [],
        latestMonth: null,
        previousMonth: null,
        delta: null,
        hasRecords,
      };
    }

    const latestMonth = months[months.length - 1];
    const previousMonth = months.length > 1 ? months[months.length - 2] : null;

    const computeDelta = (latestValue, previousValue) => {
      const safeLatest = Number.isFinite(latestValue) ? latestValue : 0;
      const safePrevious = Number.isFinite(previousValue) ? previousValue : 0;
      const absolute = safeLatest - safePrevious;
      const percent =
        safePrevious !== 0 ? (absolute / safePrevious) * 100 : null;

      return { absolute, percent };
    };

    const delta = previousMonth
      ? {
          posts: computeDelta(latestMonth.posts, previousMonth.posts),
          likes: computeDelta(latestMonth.likes, previousMonth.likes),
        }
      : null;

    return {
      months,
      latestMonth,
      previousMonth,
      delta,
      hasRecords,
    };
  }, [platformPosts?.instagram, platformTrendActivity]);

  const instagramWeeklyTrendCardData = useMemo(() => {
    const instagramPosts = filterRecordsWithResolvableDate(
      Array.isArray(platformPosts?.instagram) ? platformPosts.instagram : [],
      {
        extraPaths: [
          "publishedAt",
          "published_at",
          "timestamp",
          "createdAt",
          "created_at",
          "date",
          "tanggal",
        ],
      },
    );

    return buildWeeklyEngagementTrend(instagramPosts, {
      platformKey: "instagram",
      platformLabel: "Instagram",
    });
  }, [platformPosts?.instagram]);

  const tiktokMonthlyTrend = useMemo(() => {
    const tiktokPosts = filterRecordsWithResolvableDate(
      Array.isArray(platformPosts?.tiktok) ? platformPosts.tiktok : [],
      {
        extraPaths: [
          "publishedAt",
          "published_at",
          "timestamp",
          "createdAt",
          "created_at",
          "date",
          "tanggal",
        ],
      },
    );

    const monthlyPosts = groupRecordsByMonth(tiktokPosts, {
      getDate: (post) => {
        if (post?.publishedAt instanceof Date) {
          return post.publishedAt;
        }
        return (
          post?.createdAt ??
          post?.created_at ??
          post?.timestamp ??
          post?.published_at ??
          null
        );
      },
    });

    const commentRecords = Array.isArray(platformTrendActivity?.comments)
      ? filterRecordsWithResolvableDate(platformTrendActivity.comments)
      : [];

    const monthlyComments = groupRecordsByMonth(commentRecords, {
      datePaths: [
        "tanggal",
        "date",
        "created_at",
        "createdAt",
        "activityDate",
        "updated_at",
        "updatedAt",
        "time",
        "waktu",
        "rekap.tanggal",
        "rekap.date",
        "rekap.created_at",
        "rekap.createdAt",
      ],
    });

    const hasRecords = monthlyPosts.length > 0 || monthlyComments.length > 0;
    const buckets = new Map();

    monthlyPosts.forEach((group) => {
      const key = group.key;
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          start: group.start,
          end: group.end,
          posts: 0,
          comments: 0,
        });
      }
      const entry = buckets.get(key);
      entry.posts += group.records.length;
    });

    monthlyComments.forEach((group) => {
      const key = group.key;
      if (!buckets.has(key)) {
        buckets.set(key, {
          key,
          start: group.start,
          end: group.end,
          posts: 0,
          comments: 0,
        });
      }
      const entry = buckets.get(key);
      const totalComments = sumActivityRecords(
        group.records,
        TIKTOK_COMMENT_FIELD_PATHS,
      );
      entry.comments += Math.max(0, Math.round(totalComments) || 0);
    });

    const months = Array.from(buckets.values()).sort(
      (a, b) => a.start.getTime() - b.start.getTime(),
    );

    if (months.length === 0) {
      return {
        months: [],
        latestMonth: null,
        previousMonth: null,
        delta: null,
        hasRecords,
      };
    }

    const latestMonth = months[months.length - 1];
    const previousMonth = months.length > 1 ? months[months.length - 2] : null;

    const computeDelta = (latestValue, previousValue) => {
      const safeLatest = Number.isFinite(latestValue) ? latestValue : 0;
      const safePrevious = Number.isFinite(previousValue) ? previousValue : 0;
      const absolute = safeLatest - safePrevious;
      const percent =
        safePrevious !== 0 ? (absolute / safePrevious) * 100 : null;

      return { absolute, percent };
    };

    const delta = previousMonth
      ? {
          posts: computeDelta(latestMonth.posts, previousMonth.posts),
          comments: computeDelta(latestMonth.comments, previousMonth.comments),
        }
      : null;

    return {
      months,
      latestMonth,
      previousMonth,
      delta,
      hasRecords,
    };
  }, [platformPosts?.tiktok, platformTrendActivity]);

  const tiktokWeeklyTrendCardData = useMemo(() => {
    const tiktokPosts = filterRecordsWithResolvableDate(
      Array.isArray(platformPosts?.tiktok) ? platformPosts.tiktok : [],
      {
        extraPaths: [
          "publishedAt",
          "published_at",
          "timestamp",
          "createdAt",
          "created_at",
          "date",
          "tanggal",
        ],
      },
    );

    return buildWeeklyEngagementTrend(tiktokPosts, {
      platformKey: "tiktok",
      platformLabel: "TikTok",
    });
  }, [platformPosts?.tiktok]);

  const instagramMonthlyCardData = useMemo(() => {
    const { latestMonth, previousMonth, delta, months, hasRecords } =
      instagramMonthlyTrend ?? {};

    const safeLatestLikes = Math.max(0, Number(latestMonth?.likes) || 0);
    const safeLatestPosts = Math.max(0, Number(latestMonth?.posts) || 0);
    const safePreviousLikes = Math.max(0, Number(previousMonth?.likes) || 0);
    const safePreviousPosts = Math.max(0, Number(previousMonth?.posts) || 0);

    const currentMetrics = latestMonth
      ? [
          { key: "likes", label: "Likes Personil", value: safeLatestLikes },
          {
            key: "posts",
            label: "Post Instagram",
            value: safeLatestPosts,
          },
        ]
      : [];

    const previousMetrics = previousMonth
      ? [
          { key: "likes", label: "Likes Personil", value: safePreviousLikes },
          {
            key: "posts",
            label: "Post Instagram",
            value: safePreviousPosts,
          },
        ]
      : [];

    const deltaMetrics =
      delta && previousMonth
        ? [
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
              key: "posts",
              label: "Perubahan Post",
              absolute: Math.round(delta.posts?.absolute ?? 0),
              percent:
                delta.posts?.percent !== null &&
                delta.posts?.percent !== undefined
                  ? delta.posts.percent
                  : null,
            },
          ]
        : [];

    const series = Array.isArray(months)
      ? months.slice(-6).map((month) => {
          const posts = Math.max(0, Number(month.posts) || 0);
          const likes = Math.max(0, Number(month.likes) || 0);
          return {
            key: month.key,
            label: formatMonthRangeLabel(month.start, month.end),
            posts,
            likes,
            primary: likes,
            secondary: posts,
            start: month.start,
            end: month.end,
          };
        })
      : [];

    const monthsCount = Array.isArray(months) ? months.length : 0;

    return {
      currentMetrics,
      previousMetrics,
      deltaMetrics,
      series,
      monthsCount,
      hasComparison: Boolean(previousMonth),
      hasRecords: Boolean(hasRecords),
    };
  }, [instagramMonthlyTrend]);

  const tiktokMonthlyCardData = useMemo(() => {
    const { latestMonth, previousMonth, delta, months, hasRecords } =
      tiktokMonthlyTrend ?? {};

    const safeLatestComments = Math.max(0, Number(latestMonth?.comments) || 0);
    const safeLatestPosts = Math.max(0, Number(latestMonth?.posts) || 0);
    const safePreviousComments = Math.max(
      0,
      Number(previousMonth?.comments) || 0,
    );
    const safePreviousPosts = Math.max(0, Number(previousMonth?.posts) || 0);

    const currentMetrics = latestMonth
      ? [
          {
            key: "comments",
            label: "Komentar Personil",
            value: safeLatestComments,
          },
          { key: "posts", label: "Post TikTok", value: safeLatestPosts },
        ]
      : [];

    const previousMetrics = previousMonth
      ? [
          {
            key: "comments",
            label: "Komentar Personil",
            value: safePreviousComments,
          },
          { key: "posts", label: "Post TikTok", value: safePreviousPosts },
        ]
      : [];

    const deltaMetrics =
      delta && previousMonth
        ? [
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
              key: "posts",
              label: "Perubahan Post",
              absolute: Math.round(delta.posts?.absolute ?? 0),
              percent:
                delta.posts?.percent !== null &&
                delta.posts?.percent !== undefined
                  ? delta.posts.percent
                  : null,
            },
          ]
        : [];

    const series = Array.isArray(months)
      ? months.slice(-6).map((month) => {
          const posts = Math.max(0, Number(month.posts) || 0);
          const comments = Math.max(0, Number(month.comments) || 0);
          return {
            key: month.key,
            label: formatMonthRangeLabel(month.start, month.end),
            posts,
            likes: comments,
            comments,
            primary: comments,
            secondary: posts,
            start: month.start,
            end: month.end,
          };
        })
      : [];

    const monthsCount = Array.isArray(months) ? months.length : 0;

    return {
      currentMetrics,
      previousMetrics,
      deltaMetrics,
      series,
      monthsCount,
      hasComparison: Boolean(previousMonth),
      hasRecords: Boolean(hasRecords),
    };
  }, [tiktokMonthlyTrend]);

  const showPlatformLoading = platformsLoading;
  const instagramMonthlyTrendDescription =
    instagramMonthlyCardData.monthsCount < 2
      ? "Likes personil & post Instagram per bulan. Data perbandingan belum lengkap."
      : "Likes personil & post Instagram per bulan.";
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
      ? "Komentar personel & post TikTok per bulan. Data perbandingan belum lengkap."
      : "Komentar personel & post TikTok per bulan.";
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

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800/60 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 shadow-[0_0_35px_rgba(15,23,42,0.4)]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-100">Executive Summary</h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Sistem Cicero dibangun sebagai sarana pengawasan dan pengendalian terhadap kepatuhan personil Ditbinmas Polda Jatim dan Bhabinkamtibmas Polres Jajaran 
              dalam melaksanakan tugas likes dan komentar pada konten akun official Instagram dan TikTok. 
              Melalui data yang dihimpun secara otomatis, Cicero menyajikan gambaran menyeluruh terkait kinerja personil, 
              tingkat partisipasi, serta kualitas pelaksanaan tugas dalam mendukung komunikasi publik Polri.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-end lg:justify-end">
            <div className="w-full sm:w-64">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
                  Show Data By
                </span>
                <div className="grid gap-3">
                  <label className="flex flex-col text-sm font-medium text-slate-200">
                    <span className="text-base font-semibold text-slate-100">Month</span>
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
                      className="mt-2 w-full rounded-xl border border-cyan-500/40 bg-slate-900/80 px-4 py-2 text-slate-100 shadow-[0_0_20px_rgba(56,189,248,0.2)] focus:border-cyan-400 focus:outline-none"
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
                  <label className="flex flex-col text-sm font-medium text-slate-200">
                    <span className="text-base font-semibold text-slate-100">Year</span>
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
                      className="mt-2 w-full rounded-xl border border-cyan-500/40 bg-slate-900/80 px-4 py-2 text-slate-100 shadow-[0_0_20px_rgba(56,189,248,0.2)] focus:border-cyan-400 focus:outline-none"
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
            <Button
              onClick={handleDownload}
              disabled={!pptxFactory}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2 text-white shadow-[0_10px_30px_rgba(6,182,212,0.25)] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/60 disabled:shadow-none sm:w-auto"
            >
              <Download className="h-4 w-4" /> Unduh PPT
            </Button>
          </div>
        </div>
      </header>

      {!showPlatformLoading &&
      (shouldShowInstagramTrendCard || shouldShowTiktokTrendCard) ? (
        <section
          aria-label="Tren Aktivitas Bulanan"
          className="space-y-6 rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)]"
        >
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Tren Aktivitas Bulanan
            </h2>
            <p className="text-sm text-slate-300">
              Ringkasan performa konten dan interaksi personel berdasarkan data bulanan
              terbaru.
            </p>
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
                formatNumber={formatNumber}
                formatPercent={formatPercent}
                primaryMetricLabel="Likes Personil"
                secondaryMetricLabel="Post"
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
                formatNumber={formatNumber}
                formatPercent={formatPercent}
                primaryMetricLabel="Komentar Personil"
                secondaryMetricLabel="Post"
              />
            ) : null}
          </div>
        </section>
      ) : null}

      {(shouldShowInstagramWeeklyTrendCard || shouldShowTiktokWeeklyTrendCard) ? (
        <section
          aria-label="Tren Interaksi Mingguan"
          className="space-y-6 rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)]"
        >
          <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Tren Interaksi Mingguan
            </h2>
            <p className="text-sm text-slate-300">
              Perbandingan performa konten mingguan berdasarkan total interaksi.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {shouldShowInstagramWeeklyTrendCard ? (
              <PlatformEngagementTrendChart
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

      <section
        aria-label="Insight Pengguna Aktual"
        className="space-y-6 rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)]"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Insight User / Personil Ditbinmas dan Binmas Polres Jajaran Polda Jatim.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Data ini diambil langsung dari Database User / Personil.
            </p>
          </div>
        </div>

        {userInsightState.loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Memuat insight pengguna…
          </div>
        ) : userInsightState.error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {userInsightState.error}
          </div>
        ) : (
          <div className="space-y-6">
            {userSummary && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Total Personil
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-100">
                    {formatNumber(userSummary.totalUsers, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                    Instagram Lengkap
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-100">
                    {formatNumber(userSummary.instagramFilled, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatPercent(userSummary.instagramPercent)} dari total Personil
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-200/80">
                    TikTok Lengkap
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-100">
                    {formatNumber(userSummary.tiktokFilled, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatPercent(userSummary.tiktokPercent)} dari total Personil
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 sm:col-span-2 xl:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">
                    Personil dengan data Username Sosial Media lengkap
                  </p>
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                    <p className="text-2xl font-semibold text-slate-100">
                      {formatNumber(userSummary.bothCount, { maximumFractionDigits: 0 })} Personil
                    </p>
                    <p className="text-sm text-emerald-300">
                      {formatPercent(userSummary.bothPercent)} dari keseluruhan data Personil
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 xl:grid-cols-6 2xl:grid-cols-7">
              <section className="group relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/70 via-slate-950/60 to-slate-950/80 p-5 shadow-[0_0_35px_-20px_rgba(14,165,233,0.6)] transition-colors hover:border-cyan-400/30 xl:col-span-4 2xl:col-span-4">
                <div className="pointer-events-none absolute inset-x-10 -top-32 h-64 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                        Rasio Kelengkapan Data Tertinggi per Satker / Polres
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Menampilkan lima Polres dengan jumlah Personil terbesar.
                      </p>
                    </div>
                  </div>
                  {completionBarData.length > 0 ? (
                    <div className="mt-6 h-[360px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={completionBarData}
                          layout="vertical"
                          margin={{ top: 10, right: 24, bottom: 10, left: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="rgba(148, 163, 184, 0.2)"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            domain={[0, 100]}
                            ticks={[0, 25, 50, 75, 100]}
                            tickFormatter={(value) => `${value}%`}
                            tick={{ fill: "#94a3b8", fontSize: 11 }}
                            axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
                          />
                          <YAxis
                            dataKey="division"
                            type="category"
                            width={120}
                            tick={{ fill: "#e2e8f0", fontSize: 12 }}
                            axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
                          />
                          <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.08)" }} content={<CompletionTooltip />} />
                          <Bar dataKey="completion" fill="#38bdf8" radius={[0, 6, 6, 0]} maxBarSize={26}>
                            <LabelList
                              dataKey="completion"
                              position="right"
                              formatter={(value) => `${value}%`}
                              fill="#e2e8f0"
                              fontSize={11}
                            />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="mt-6 flex h-60 items-center justify-center text-sm text-slate-400">
                      Belum ada data divisi yang bisa ditampilkan.
                    </div>
                  )}
                </div>
              </section>

              <section className="group relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/70 via-slate-950/60 to-slate-950/80 p-5 shadow-[0_0_35px_-18px_rgba(56,189,248,0.45)] transition-colors hover:border-cyan-400/30 xl:col-span-2 2xl:col-span-3">
                <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-fuchsia-500/10 blur-3xl" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                        Komposisi Kelengkapan Data Username Sosial Media
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Peta Distribusi personil berdasarkan status pengisian akun.
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
                              fill="#e2e8f0"
                              fontSize={11}
                            />
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(15,23,42,0.92)",
                              borderRadius: 16,
                              borderColor: "rgba(148,163,184,0.4)",
                              color: "#e2e8f0",
                            }}
                            formatter={(value) => [
                              `${formatNumber(value, { maximumFractionDigits: 0 })} admin`,
                              "Jumlah",
                            ]}
                          />
                          <Legend verticalAlign="bottom" wrapperStyle={{ color: "#e2e8f0" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="mt-6 flex h-60 items-center justify-center text-sm text-slate-400">
                      Belum ada distribusi data yang bisa divisualisasikan.
                    </div>
                  )}
                </div>
              </section>

              <section className="group relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/70 via-slate-950/60 to-slate-950/80 p-5 shadow-[0_0_45px_-22px_rgba(16,185,129,0.45)] transition-colors hover:border-emerald-400/30 xl:col-span-3 2xl:col-span-4">
                <div className="pointer-events-none absolute inset-x-6 top-10 h-48 rounded-full bg-emerald-500/10 blur-3xl" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                        10 Polres dengan Rasio Kelengkapan Data Terendah
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Fokuskan pendampingan pada satuan kerja dengan performa terendah.
                      </p>
                      {lowestCompletionDivisions.length > 0 ? (
                        <div className="mt-6 h-[360px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={lowestCompletionDivisions}
                              layout="vertical"
                              margin={{ top: 10, right: 24, bottom: 10, left: 0 }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="rgba(148, 163, 184, 0.2)"
                                horizontal={false}
                              />
                              <XAxis
                                type="number"
                                domain={[0, 100]}
                                ticks={[0, 25, 50, 75, 100]}
                                tickFormatter={(value) => `${value}%`}
                                tick={{ fill: "#94a3b8", fontSize: 11 }}
                                axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
                              />
                              <YAxis
                                dataKey="division"
                                type="category"
                                width={120}
                                tick={{ fill: "#e2e8f0", fontSize: 12 }}
                                axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
                              />
                              <Tooltip cursor={{ fill: "rgba(148, 163, 184, 0.08)" }} content={<CompletionTooltip />} />
                              <Bar dataKey="completion" fill="#f97316" radius={[0, 6, 6, 0]} maxBarSize={26}>
                                <LabelList
                                  dataKey="completion"
                                  position="right"
                                  formatter={(value) => `${value}%`}
                                  fill="#e2e8f0"
                                  fontSize={11}
                                />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="mt-6 flex h-40 items-center justify-center text-sm text-slate-400">
                          Belum ada data satker yang bisa dibandingkan.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="group relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/70 via-slate-950/60 to-slate-950/80 p-5 shadow-[0_0_35px_-18px_rgba(14,165,233,0.4)] transition-colors hover:border-cyan-400/30 xl:col-span-3 2xl:col-span-3">
                <div className="pointer-events-none absolute -left-16 bottom-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                        Komposisi Data Personil pada Satker
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
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
                              fill="#e2e8f0"
                              fontSize={11}
                            />
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(15,23,42,0.92)",
                              borderRadius: 16,
                              borderColor: "rgba(148,163,184,0.4)",
                              color: "#e2e8f0",
                            }}
                            formatter={(value, _name, item) => [
                              `${formatNumber(value, { maximumFractionDigits: 0 })} personil`,
                              item?.payload?.name ?? "Satker",
                            ]}
                          />
                          <Legend verticalAlign="bottom" wrapperStyle={{ color: "#e2e8f0" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="mt-6 flex h-60 items-center justify-center text-sm text-slate-400">
                      Belum ada komposisi satker yang bisa divisualisasikan.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                Catatan Insight Data Personil
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">{narrative}</p>
            </article>
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-50">Rincian Kinerja Platform</h2>
          <p className="text-sm text-slate-300">
            Bandingkan performa inti tiap kanal untuk melihat kontribusi terhadap interaksi keseluruhan.
          </p>
        </div>
        <div className="space-y-6">
          {showPlatformLoading ? (
            <div className="flex h-40 items-center justify-center rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
              Memuat data rekap likes…
            </div>
          ) : platformError ? (
            <div className="flex h-40 items-center justify-center rounded-3xl border border-rose-500/40 bg-rose-950/40 p-6 text-sm text-rose-200">
              {platformError}
            </div>
          ) : likesSummary?.clients?.length ? (
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
            />
          ) : (
            <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
              Belum ada data rekap likes untuk periode ini.
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-7" aria-label="Visualisasi Kinerja">
        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.4)] lg:col-span-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
            Sebaran Reach & Engagement per Kanal
          </h2>
          <div className="mt-6 h-72">
            {data.engagementByChannel.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.engagementByChannel}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="channel" stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(15,23,42,0.3)" }}
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.92)",
                      borderRadius: 16,
                      borderColor: "rgba(148,163,184,0.4)",
                      boxShadow: "0 20px 45px rgba(14,116,144,0.3)",
                      color: "#e2e8f0",
                    }}
                    formatter={(value, name) => {
                      if (name === "reach") {
                        return [formatNumber(value, { maximumFractionDigits: 0 }), "Reach"];
                      }
                      return [`${formatNumber(value, { maximumFractionDigits: 1 })}%`, "Engagement Rate"];
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#e2e8f0" }} />
                  <Bar dataKey="reach" name="Reach" fill="#38bdf8" radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="reach"
                      position="top"
                      formatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })}
                      fill="#e2e8f0"
                      fontSize={11}
                    />
                  </Bar>
                  <Bar dataKey="engagementRate" name="Engagement Rate" fill="#a855f7" radius={[8, 8, 0, 0]}>
                    <LabelList
                      dataKey="engagementRate"
                      position="top"
                      formatter={(value) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`}
                      fill="#f5f3ff"
                      fontSize={11}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Belum ada data engagement kanal untuk periode ini.
              </div>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)] lg:col-span-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
            Komposisi Audiens
          </h2>
          <div className="mt-6 h-72">
            {data.audienceComposition.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.audienceComposition}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                  >
                    {data.audienceComposition.map((entry, index) => (
                      <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.92)",
                      borderRadius: 16,
                      borderColor: "rgba(148,163,184,0.4)",
                      color: "#e2e8f0",
                    }}
                    formatter={(value) => [`${value}%`, "Kontribusi"]}
                  />
                  <Legend verticalAlign="bottom" wrapperStyle={{ color: "#e2e8f0" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Belum ada data komposisi audiens untuk periode ini.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6" aria-label="Analisis Mendalam">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.4)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Dashboard & Monitoring
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              {data.dashboardNarrative}
            </p>
          </article>
          <article className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.4)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Insight Pengguna Internal
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              {data.userInsightNarrative}
            </p>
          </article>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Rekap Instagram
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              {data.instagramNarrative}
            </p>
          </article>
          <article className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Rekap TikTok
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              {data.tiktokNarrative}
            </p>
          </article>
        </div>
      </section>

      <section
        aria-label="Daftar Konten Berperforma"
        className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.4)]"
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
          Konten dengan Performa Tertinggi
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-left">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-wider text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3">Platform</th>
                <th scope="col" className="px-4 py-3">Judul Konten</th>
                <th scope="col" className="px-4 py-3">Format</th>
                <th scope="col" className="px-4 py-3 text-right">Reach</th>
                <th scope="col" className="px-4 py-3 text-right">Engagement</th>
                <th scope="col" className="px-4 py-3">Insight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
              {data.contentTable.length > 0 ? (
                data.contentTable.map((row) => (
                  <tr key={`${row.platform}-${row.title}`} className="hover:bg-slate-900/40">
                    <td className="px-4 py-3 font-medium text-cyan-200">{row.platform}</td>
                    <td className="px-4 py-3">{row.title}</td>
                    <td className="px-4 py-3">{row.format}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(row.reach, { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-3 text-right">{row.engagement}%</td>
                    <td className="px-4 py-3 text-slate-300">{row.takeaway}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-400" colSpan={6}>
                    Belum ada data konten untuk periode ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
