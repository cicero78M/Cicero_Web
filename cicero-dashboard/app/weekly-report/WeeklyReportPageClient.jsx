"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import WeeklyDistributionSection from "@/components/weekly-report/WeeklyDistributionSection";
import WeeklyReportFilters from "@/components/weekly-report/WeeklyReportFilters";
import WeeklyReportHeader from "@/components/weekly-report/WeeklyReportHeader";
import WeeklyReportLayout from "@/components/weekly-report/WeeklyReportLayout";
import WeeklySummaryCards from "@/components/weekly-report/WeeklySummaryCards";
import WeeklyTrendSection from "@/components/weekly-report/WeeklyTrendSection";
import useAuth from "@/hooks/useAuth";
import useRequireAuth from "@/hooks/useRequireAuth";
import {
  aggregateWeeklyLikesRecords,
  mergeWeeklyActivityRecords,
  prepareWeeklyTrendActivityRecords,
  createEmptyWeeklyLikesSummary,
  countUniquePersonnelRecords,
} from "./lib/dataTransforms";
import {
  formatWeeklyRangeLabel,
  parseWeeklyDateValue,
  resolveWeeklyRecordDate,
} from "./lib/weeklyTrendUtils";
import {
  WEEKLY_POST_DATE_PATHS,
  normalizeWeeklyPlatformPost,
} from "./lib/postUtils";
import {
  getInstagramPosts,
  getRekapKomentarTiktok,
  getRekapLikesIG,
  getTiktokPosts,
  getUserDirectory,
} from "@/utils/api";
import { compareUsersByPangkatOnly } from "@/utils/pangkat";

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

const resolveActivityFlag = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (value == null) {
    return null;
  }

  const normalized = String(value)
    .trim()
    .toLowerCase();

  if (!normalized) {
    return null;
  }

  const positive = [
    "active",
    "aktif",
    "ya",
    "yes",
    "true",
    "1",
    "on",
    "enabled",
    "enable",
  ];

  if (positive.includes(normalized)) {
    return true;
  }

  const negative = [
    "inactive",
    "inaktif",
    "nonaktif",
    "non-aktif",
    "tidak aktif",
    "tidakaktif",
    "tidak",
    "no",
    "false",
    "0",
    "off",
    "disabled",
    "disable",
    "suspend",
    "suspended",
    "deactivated",
  ];

  if (negative.includes(normalized)) {
    return false;
  }

  return null;
};

const resolveDirectoryIsActive = (entry) => {
  if (!entry || typeof entry !== "object") {
    return true;
  }

  const candidates = [
    entry?.is_active,
    entry?.isActive,
    entry?.active,
    entry?.aktif,
    entry?.enabled,
    entry?.is_enabled,
    entry?.isEnabled,
    entry?.status,
    entry?.user_status,
    entry?.userStatus,
    entry?.status_keaktifan,
    entry?.statusKeaktifan,
    entry?.keaktifan,
  ];

  for (const candidate of candidates) {
    const resolved = resolveActivityFlag(candidate);
    if (resolved != null) {
      return resolved;
    }
  }

  return true;
};

const buildWeekRanges = (monthValue, yearValue) => {
  const monthNumber = Number(monthValue);
  const yearNumber = Number(yearValue);

  if (!Number.isFinite(monthNumber) || !Number.isFinite(yearNumber)) {
    return [];
  }

  const firstDayOfMonth = new Date(yearNumber, monthNumber - 1, 1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  const lastDayOfMonth = new Date(yearNumber, monthNumber, 0);
  lastDayOfMonth.setHours(23, 59, 59, 999);

  const resolveKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate(),
    ).padStart(2, "0")}`;

  const startOfFirstWeek = new Date(firstDayOfMonth.getTime());
  const firstDayWeekday = startOfFirstWeek.getDay();
  const offsetToMonday = (firstDayWeekday + 6) % 7;
  startOfFirstWeek.setDate(startOfFirstWeek.getDate() - offsetToMonday);

  const ranges = [];
  let index = 1;

  for (
    let cursor = new Date(startOfFirstWeek.getTime());
    cursor.getTime() <= lastDayOfMonth.getTime();
    cursor.setDate(cursor.getDate() + 7)
  ) {
    const start = new Date(cursor.getTime());
    start.setHours(0, 0, 0, 0);

    const end = new Date(cursor.getTime());
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    ranges.push({
      index,
      start,
      end,
      key: resolveKey(start),
    });

    index += 1;
  }

  return ranges;
};

const DITBINMAS_CLIENT_TARGET = "DITBINMAS";
const DITBINMAS_ROLE_TARGET = "DITBINMAS";

const normalizeClientScopeIdentifier = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  return trimmed.toUpperCase();
};

const toComparableClientScope = (value) =>
  normalizeClientScopeIdentifier(value).replace(/[^A-Z0-9]/g, "");

const resolveClientScopeTarget = (value) => {
  const comparable = toComparableClientScope(value);
  if (comparable) {
    return comparable;
  }

  return DITBINMAS_CLIENT_TARGET;
};

const NEGATION_PREFIXES = [
  "NON",
  "NOT",
  "NO",
  "ANTI",
  "BKN",
  "BUKAN",
  "TIDAK",
];

const hasNegationPrefix = (collapsed, targetIndex) => {
  if (targetIndex <= 0) {
    return false;
  }

  const prefix = collapsed.slice(0, targetIndex);
  return NEGATION_PREFIXES.some((token) =>
    prefix.endsWith(token.replace(/[^A-Z0-9]/g, "")),
  );
};

const matchNormalizedValue = (value, target, { allowWordMatch = false } = {}) => {
  if (value == null) {
    return false;
  }

  const raw = String(value).trim();

  if (!raw) {
    return false;
  }

  const uppercased = raw.toUpperCase();
  const collapsed = uppercased.replace(/[^A-Z0-9]/g, "");
  const targetIndex = collapsed.indexOf(target);

  if (targetIndex !== -1 && !hasNegationPrefix(collapsed, targetIndex)) {
    if (!allowWordMatch) {
      return true;
    }
  } else if (!allowWordMatch) {
    return false;
  }

  const spaced = uppercased.replace(/[^A-Z0-9]/g, " ");
  const segments = spaced
    .split(" ")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) {
    return false;
  }

  let matchStartIndex = -1;
  for (let startIndex = 0; startIndex < segments.length; startIndex += 1) {
    let combined = "";
    for (let cursor = startIndex; cursor < segments.length; cursor += 1) {
      combined += segments[cursor];
      if (combined.length > target.length) {
        break;
      }
      if (combined === target) {
        matchStartIndex = startIndex;
        break;
      }
    }
    if (matchStartIndex !== -1) {
      break;
    }
  }

  if (matchStartIndex === -1) {
    return false;
  }

  const prefixSegments = segments.slice(0, matchStartIndex);
  const hasNegationSegment = prefixSegments.some((segment) =>
    NEGATION_PREFIXES.some((token) => segment.endsWith(token)),
  );

  return !hasNegationSegment;
};

const matchCandidates = (candidates, target, options) => {
  if (!Array.isArray(candidates)) {
    return false;
  }

  for (const candidate of candidates) {
    if (candidate == null) {
      continue;
    }

    if (Array.isArray(candidate)) {
      if (matchCandidates(candidate, target, options)) {
        return true;
      }
      continue;
    }

    if (typeof candidate === "object") {
      const nestedCandidates = [
        candidate.client_id,
        candidate.clientId,
        candidate.clientID,
        candidate.client,
        candidate.id_client,
        candidate.idClient,
        candidate.client_code,
        candidate.clientCode,
        candidate.client_name,
        candidate.clientName,
        candidate.name,
        candidate.label,
        candidate.value,
        candidate.role,
        candidate.role_name,
        candidate.roleName,
      ];

      if (matchCandidates(nestedCandidates, target, options)) {
        return true;
      }
      continue;
    }

    if (matchNormalizedValue(candidate, target, options)) {
      return true;
    }
  }

  return false;
};

const hasEvaluableCandidateValue = (candidate) => {
  if (candidate == null) {
    return false;
  }

  if (typeof candidate === "string") {
    return candidate.trim().length > 0;
  }

  if (typeof candidate === "number" || typeof candidate === "boolean") {
    return true;
  }

  if (Array.isArray(candidate)) {
    return candidate.some((entry) => hasEvaluableCandidateValue(entry));
  }

  if (typeof candidate === "object") {
    const nestedCandidates = [
      candidate.role,
      candidate.roles,
      candidate.user_role,
      candidate.userRole,
      candidate.role_name,
      candidate.roleName,
      candidate.name,
      candidate.label,
      candidate.value,
    ];

    return nestedCandidates.some((entry) => hasEvaluableCandidateValue(entry));
  }

  return false;
};

const mentionsTargetValue = (candidate, target) => {
  if (candidate == null) {
    return false;
  }

  if (typeof candidate === "string" || typeof candidate === "number") {
    const normalized = String(candidate)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");

    if (!normalized) {
      return false;
    }

    return normalized.includes(target);
  }

  if (Array.isArray(candidate)) {
    return candidate.some((entry) => mentionsTargetValue(entry, target));
  }

  if (typeof candidate === "object") {
    const nestedCandidates = [
      candidate.role,
      candidate.roles,
      candidate.user_role,
      candidate.userRole,
      candidate.role_name,
      candidate.roleName,
      candidate.name,
      candidate.label,
      candidate.value,
    ];

    return nestedCandidates.some((entry) => mentionsTargetValue(entry, target));
  }

  return false;
};

export const filterDitbinmasRecords = (records = [], options = {}) => {
  const clientMatcherOptions = { allowWordMatch: false };
  const roleMatcherOptions = { allowWordMatch: true };
  const clientTarget = resolveClientScopeTarget(options?.clientScope);

  return (Array.isArray(records) ? records : []).filter((record) => {
    if (!record || typeof record !== "object") {
      return false;
    }

    const clientCandidates = [
      record.client_id,
      record.clientId,
      record.client,
      record.clientID,
      record.clientid,
      record.id_client,
      record.idClient,
      record.client_code,
      record.clientCode,
      record.client_name,
      record.clientName,
      record.name,
      record?.client?.name,
      record?.rekap?.client_id,
      record?.rekap?.clientId,
      record?.rekap?.clientID,
      record?.rekap?.client,
      record?.rekap?.client_code,
      record?.rekap?.clientCode,
      record?.rekap?.client_name,
      record?.rekap?.clientName,
      record?.rekap?.name,
    ];

    const roleCandidates = [
      record.role,
      record.roles,
      record.user_role,
      record.userRole,
      record.role_name,
      record.roleName,
      record?.user?.role,
      record?.akun?.role,
      record?.profile?.role,
      record?.rekap?.role,
      record?.rekap?.roles,
      record?.rekap?.user_role,
      record?.rekap?.userRole,
      record?.rekap?.role_name,
      record?.rekap?.roleName,
    ];

    const matchesClient = matchCandidates(
      clientCandidates,
      clientTarget,
      clientMatcherOptions,
    );

    if (!matchesClient) {
      return false;
    }

    const matchesRole = matchCandidates(
      roleCandidates,
      DITBINMAS_ROLE_TARGET,
      roleMatcherOptions,
    );

    if (matchesRole) {
      return true;
    }

    const hasEvaluableRoles = roleCandidates.some((candidate) =>
      hasEvaluableCandidateValue(candidate),
    );

    if (!hasEvaluableRoles) {
      return true;
    }

    const mentionsDitbinmas = roleCandidates.some((candidate) =>
      mentionsTargetValue(candidate, DITBINMAS_ROLE_TARGET),
    );

    if (mentionsDitbinmas) {
      return false;
    }

    return false;
  });
};

export const resolveDitbinmasDirectoryUsers = (
  ditbinmasDirectory,
  options = {},
) => {
  if (!ditbinmasDirectory) {
    return [];
  }

  const possibleCollections = [
    ditbinmasDirectory,
    ditbinmasDirectory?.data,
    ditbinmasDirectory?.users,
    ditbinmasDirectory?.payload,
    ditbinmasDirectory?.data?.data,
    ditbinmasDirectory?.data?.users,
  ];

  const rawCollection = possibleCollections.find((collection) => Array.isArray(collection));
  const resolvedEntries = Array.isArray(rawCollection) ? rawCollection : [];

  const { clientScope } = options ?? {};
  const normalizedClientScope = normalizeClientScopeIdentifier(clientScope);
  const comparableScopeTarget = toComparableClientScope(normalizedClientScope);
  const hasCustomScope =
    Boolean(comparableScopeTarget) && comparableScopeTarget !== DITBINMAS_CLIENT_TARGET;

  const uniqueUsers = new Map();

  const resolveRole = (value) =>
    String(value || "")
      .trim()
      .toLowerCase();

  const resolveClientId = (value) =>
    String(value || "")
      .trim()
      .toUpperCase();

  const toComparableClientId = (value) =>
    resolveClientId(value)
      .replace(/[^A-Z0-9]/g, "")
      .trim();

  const collectTargetClientIds = (entry) => {
    const candidates = [
      entry?.target_client,
      entry?.targetClient,
      entry?.target_clients,
      entry?.targetClients,
      entry?.target_client_ids,
      entry?.targetClientIds,
      entry?.client_targets,
      entry?.clientTargets,
      entry?.ditbinmas_targets,
      entry?.ditbinmasTargets,
      entry?.target_ids,
      entry?.targetIds,
      entry?.targets,
    ];

    const targetIds = new Set();

    const appendValue = (value) => {
      if (value == null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(appendValue);
        return;
      }

      if (typeof value === "object") {
        const nestedCandidates = [
          value?.client_id,
          value?.clientId,
          value?.clientID,
          value?.client,
          value?.id,
          value?.code,
          value?.value,
          value?.name,
          value?.label,
        ];

        nestedCandidates.forEach(appendValue);
        return;
      }

      const normalized = resolveClientId(value);
      if (!normalized) {
        return;
      }

      normalized
        .split(/[;,\s]+/)
        .map((part) => resolveClientId(part))
        .filter(Boolean)
        .forEach((part) => targetIds.add(part));
    };

    candidates.forEach(appendValue);

    return targetIds;
  };

  const normalizedEntries = resolvedEntries.map((entry) => {
    const entryRole = resolveRole(entry?.role || entry?.user_role || entry?.userRole);
    const entryClientId = resolveClientId(
      entry?.client_id ||
        entry?.clientId ||
        entry?.clientID ||
        entry?.client ||
        entry?.client_code,
    );
    const comparableClientId = toComparableClientId(entryClientId);
    const targetIds = collectTargetClientIds(entry);
    const comparableTargets = new Set(
      Array.from(targetIds).map((target) => toComparableClientId(target)).filter(Boolean),
    );
    const roleIndicatesDitbinmas = entryRole.includes("ditbinmas");
    const targetsDitbinmas = comparableTargets.has("DITBINMAS");
    const clientIsDitbinmas = comparableClientId === "DITBINMAS";
    const isActive = resolveDirectoryIsActive(entry);

    return {
      entry,
      entryRole,
      entryClientId,
      comparableClientId,
      targetIds,
      comparableTargets,
      roleIndicatesDitbinmas,
      targetsDitbinmas,
      clientIsDitbinmas,
      isActive,
    };
  });

  const targetClientIds = new Set(
    comparableScopeTarget ? [comparableScopeTarget] : [DITBINMAS_CLIENT_TARGET],
  );

  normalizedEntries.forEach((normalized) => {
    if (!normalized) {
      return;
    }

    const {
      entryClientId,
      comparableClientId,
      targetIds,
      comparableTargets,
      roleIndicatesDitbinmas,
      targetsDitbinmas,
      clientIsDitbinmas,
      isActive,
    } = normalized;

    const hasDitbinmasSignal =
      roleIndicatesDitbinmas || targetsDitbinmas || clientIsDitbinmas;

    if (!hasCustomScope && hasDitbinmasSignal && comparableClientId) {
      targetClientIds.add(comparableClientId);
    }

    if (!hasCustomScope && hasDitbinmasSignal) {
      targetIds.forEach((targetId) => {
        const comparable = toComparableClientId(targetId);
        if (comparable) {
          targetClientIds.add(comparable);
        }
      });
    }

    if (
      !hasCustomScope &&
      hasDitbinmasSignal &&
      entryClientId &&
      !targetIds.has(entryClientId)
    ) {
      targetIds.add(entryClientId);
    }
  });

  normalizedEntries.forEach((normalized) => {
    if (!normalized) {
      return;
    }

    const {
      entry,
      entryRole,
      entryClientId,
      comparableClientId,
      comparableTargets,
      roleIndicatesDitbinmas,
      targetsDitbinmas,
      clientIsDitbinmas,
      isActive,
    } = normalized;

    const clientMatchesTarget =
      comparableClientId && targetClientIds.has(comparableClientId);
    const matchesComparableTargets =
      hasCustomScope && comparableScopeTarget && comparableTargets
        ? comparableTargets.has(comparableScopeTarget)
        : false;
    const hasDitbinmasSignal =
      roleIndicatesDitbinmas || targetsDitbinmas || clientIsDitbinmas;
    const shouldInclude = hasCustomScope
      ? clientMatchesTarget || matchesComparableTargets
      : hasDitbinmasSignal || clientMatchesTarget;

    if (!shouldInclude) {
      return;
    }

    if (!isActive) {
      return;
    }

    const identifier =
      entry?.user_id ||
      entry?.userId ||
      entry?.userID ||
      entry?.nrp ||
      entry?.nip ||
      entry?.email ||
      entry?.id ||
      JSON.stringify(entry);

    if (!identifier) {
      return;
    }

    const existingEntry = uniqueUsers.get(identifier);
    const existingRole = resolveRole(
      existingEntry?.role || existingEntry?.user_role || existingEntry?.userRole,
    );
    const entryIsPreferred = entryRole.includes("ditbinmas");
    const existingIsPreferred = existingRole.includes("ditbinmas");

    if (!existingEntry || (!existingIsPreferred && entryIsPreferred)) {
      uniqueUsers.set(identifier, entry);
    }
  });

  if (uniqueUsers.size === 0 && Array.isArray(normalizedEntries) && normalizedEntries.length) {
    // fallback: when entries exist but without client info, include all unique entries
    normalizedEntries.forEach(({ entry, isActive }) => {
      if (!isActive) {
        return;
      }

      const identifier =
        entry?.user_id ||
        entry?.userId ||
        entry?.userID ||
        entry?.nrp ||
        entry?.nip ||
        entry?.email ||
        entry?.id ||
        JSON.stringify(entry);

      if (!uniqueUsers.has(identifier)) {
        const normalizedEntry = { ...entry };
        const fallbackClientId = normalizedClientScope || DITBINMAS_CLIENT_TARGET;

        if (!normalizedEntry?.client_id) {
          normalizedEntry.client_id = fallbackClientId;
        }

        if (!normalizedEntry?.clientId) {
          normalizedEntry.clientId = normalizedEntry.client_id ?? fallbackClientId;
        }

        if (!normalizedEntry?.client) {
          normalizedEntry.client = normalizedEntry.client_id ?? fallbackClientId;
        }

        uniqueUsers.set(identifier, normalizedEntry);
      }
    });
  }

  return Array.from(uniqueUsers.values());
};

const findWeekRange = (ranges, weekIndex) =>
  ranges.find((range) => range.index === weekIndex) ?? null;

const computePreviousRange = (ranges, currentRange) => {
  if (!currentRange) {
    return null;
  }

  const previousIndex = currentRange.index - 1;
  if (previousIndex < 1) {
    return null;
  }

  return findWeekRange(ranges, previousIndex) ?? null;
};

export const normalizePostsForPlatform = (
  records = [],
  { platformKey, platformLabel },
) => {
  const safeRecords = Array.isArray(records)
    ? records.filter((record) => record && typeof record === "object")
    : [];

  return safeRecords
    .map((record, index) => {
      const normalized = normalizeWeeklyPlatformPost(record, {
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

        const parsedActivity = parseWeeklyDateValue(record?.activityDate);
        if (parsedActivity) {
          return parsedActivity;
        }

        const resolved = resolveWeeklyRecordDate(record, WEEKLY_POST_DATE_PATHS);
        if (resolved?.parsed) {
          return resolved.parsed;
        }

        if (normalized.publishedAt instanceof Date) {
          return normalized.publishedAt;
        }

        const parsedPublished = parseWeeklyDateValue(normalized.publishedAt);
        if (parsedPublished) {
          return parsedPublished;
        }

        return null;
      })();

      if (!(resolvedDate instanceof Date) || Number.isNaN(resolvedDate.valueOf())) {
        return null;
      }

      const metrics = normalized.metrics ?? {};
      const {
        likes: metricLikes,
        comments: metricComments,
        interactions: metricInteractions,
      } = metrics;

      const likesValue = Number(metricLikes);
      const likes = Number.isFinite(likesValue) ? Math.max(0, likesValue) : 0;
      const commentsValue = Number(metricComments);
      const comments = Number.isFinite(commentsValue) ? Math.max(0, commentsValue) : 0;
      const interactionsCandidate = Number(metricInteractions);
      const interactions = Number.isFinite(interactionsCandidate)
        ? Math.max(0, interactionsCandidate)
        : likes + comments;

      const date = new Date(resolvedDate);
      date.setHours(0, 0, 0, 0);

      return {
        key: normalized.id ?? normalized.key ?? `${platformKey}-${index}`,
        activityDate: date,
        likes,
        comments,
        interactions,
      };
    })
    .filter(Boolean);
};

export const buildWeeklySeries = (normalizedPosts, weekRanges, monthLabel) =>
  weekRanges.map((range) => {
    const totals = normalizedPosts.reduce(
      (acc, post) => {
        if (
          post.activityDate instanceof Date &&
          post.activityDate.getTime() >= range.start.getTime() &&
          post.activityDate.getTime() <= range.end.getTime()
        ) {
          acc.posts += 1;
          acc.likes += post.likes ?? 0;
          acc.comments += post.comments ?? 0;
          acc.interactions += post.interactions ?? 0;
        }
        return acc;
      },
      { interactions: 0, likes: 0, comments: 0, posts: 0 },
    );

    return {
      key: range.key,
      index: range.index,
      label: `Minggu ${range.index} ${monthLabel}`,
      interactions: totals.interactions,
      likes: totals.likes,
      comments: totals.comments,
      posts: totals.posts,
      rangeLabel: formatWeeklyRangeLabel(range.start, range.end),
    };
  });

const resolveRecordsForRange = (recordSets, range) => {
  if (!range) {
    return [];
  }

  if (Array.isArray(recordSets)) {
    return recordSets;
  }

  if (recordSets instanceof Map) {
    const fromMap = recordSets.get(range.key);
    return Array.isArray(fromMap) ? fromMap : [];
  }

  if (recordSets && typeof recordSets === "object") {
    const { byRange } = recordSets;

    if (byRange instanceof Map) {
      const mapped = byRange.get(range.key);
      if (Array.isArray(mapped)) {
        return mapped;
      }
    } else if (byRange && typeof byRange === "object") {
      const mapped = byRange[range.key];
      if (Array.isArray(mapped)) {
        return mapped;
      }
    }

    const fallbackCandidates = [
      recordSets.defaultRecords,
      recordSets.default,
      recordSets.records,
    ];

    for (const candidate of fallbackCandidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }
  }

  return [];
};

export const filterActivityRecordsByRange = (recordSets, range) => {
  if (!range) {
    return [];
  }

  const records = resolveRecordsForRange(recordSets, range);

  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const startTime = range.start.getTime();
  const endTime = range.end.getTime();

  return records.filter((record) => {
    const resolved = resolveWeeklyRecordDate(record, [
      "activityDate",
      "rekap.activityDate",
      "rekap.activity_date",
      "tanggal",
      "date",
      "created_at",
      "createdAt",
    ]);

    if (!resolved?.parsed) {
      return false;
    }

    const parsed = new Date(resolved.parsed);
    if (Number.isNaN(parsed.valueOf())) {
      return false;
    }

    parsed.setHours(0, 0, 0, 0);
    const timestamp = parsed.getTime();
    return timestamp >= startTime && timestamp <= endTime;
  });
};

export const prepareActivityRecordsByWeek = (
  records,
  { activeWeekRange, previousWeekRange, fallbackDate } = {},
) => {
  const safeFallback = fallbackDate ?? null;

  const defaultRecords = prepareWeeklyTrendActivityRecords(records, {
    fallbackDate: safeFallback,
  });

  const byRange = new Map();

  const registerRange = (range) => {
    if (!range?.key) {
      return;
    }

    byRange.set(range.key, defaultRecords);
  };

  registerRange(activeWeekRange);
  registerRange(previousWeekRange);

  return { defaultRecords, byRange };
};

export const extractClientPersonnel = (clients = []) => {
  const personnelMap = new Map();

  clients.forEach((client) => {
    if (!client || !Array.isArray(client.personnel)) {
      return;
    }

    client.personnel.forEach((person, index) => {
      if (!person || typeof person !== "object") {
        return;
      }

      const baseKey = person?.key ||
        `${client.key || client.clientId || "client"}-${person?.username || person?.nama || index || "person"}`;
      const key = String(baseKey);

      if (!personnelMap.has(key)) {
        personnelMap.set(key, {
          key,
          pangkat: person?.pangkat || "",
          nama: person?.nama || "",
          username: person?.username || "",
          satfung:
            person?.divisi ||
            client?.divisi ||
            person?.clientName ||
            client?.clientName ||
            client?.clientId ||
            "",
          likes: 0,
          comments: 0,
        });
      }

      const record = personnelMap.get(key);
      const likesValue = Number(person?.likes);
      const likes = Number.isFinite(likesValue) ? likesValue : 0;
      const commentsValue = Number(person?.comments);
      const comments = Number.isFinite(commentsValue) ? commentsValue : 0;

      record.likes += likes;
      record.comments += comments;

      if (!record.pangkat && person?.pangkat) {
        record.pangkat = person.pangkat;
      }
      if (!record.nama && person?.nama) {
        record.nama = person.nama;
      }
      if (!record.username && person?.username) {
        record.username = person.username;
      }
      if (
        !record.satfung &&
        (person?.divisi ||
          client?.divisi ||
          person?.clientName ||
          client?.clientName ||
          client?.clientId)
      ) {
        record.satfung =
          person?.divisi ||
          client?.divisi ||
          person?.clientName ||
          client?.clientName ||
          client?.clientId ||
          record.satfung;
      }
    });
  });

  return Array.from(personnelMap.values())
    .map((person) => {
      const likesValue = Number(person.likes);
      const safeLikes = Number.isFinite(likesValue) ? likesValue : 0;
      const commentsValue = Number(person.comments);
      const safeComments = Number.isFinite(commentsValue) ? commentsValue : 0;
      const resolvedName = person.nama || person.username || "";

      return {
        ...person,
        nama: resolvedName,
        likes: safeLikes,
        comments: safeComments,
        interactions: safeLikes + safeComments,
      };
    })
    .filter((person) => person.nama);
};

const PRIORITY_PERSONNEL_PATTERNS = [
  {
    tokens: ["LAFRI", "PRASETYONO"],
    aliases: [
      "KOMISARIS BESAR POLISI LAFRI PRASETYONO, S.I.K., M.H",
      "KOMBES POL LAFRI PRASETYONO",
      "KOMBESPOL LAFRI PRASETYONO",
    ],
  },
  {
    tokens: ["ARY", "MURTINI"],
    aliases: [
      "AKBP ARY MURTINI, S.I.K., M.SI.",
      "AKBP ARY MURTINI",
    ],
  },
];

const normalizePersonnelName = (person) =>
  String(person?.nama || person?.username || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const sanitizePersonnelName = (person) =>
  normalizePersonnelName(person).replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

const resolvePersonnelPriorityIndex = (person) => {
  const normalized = normalizePersonnelName(person);
  if (!normalized) {
    return Number.POSITIVE_INFINITY;
  }

  const sanitized = sanitizePersonnelName(person);

  for (let index = 0; index < PRIORITY_PERSONNEL_PATTERNS.length; index += 1) {
    const pattern = PRIORITY_PERSONNEL_PATTERNS[index];

    const aliasMatch = pattern.aliases.some((alias) =>
      sanitized.includes(alias.replace(/[^A-Z0-9\s]/g, " ").replace(/\s+/g, " ").trim()),
    );

    if (aliasMatch) {
      return index;
    }

    const tokensMatch = pattern.tokens.every((token) =>
      sanitized.includes(token.replace(/[^A-Z0-9]/g, "")),
    );

    if (tokensMatch) {
      return index;
    }
  }

  return Number.POSITIVE_INFINITY;
};

export const sortPersonnelDistribution = (personnel = []) => {
  return [...personnel].sort((a, b) => {
    const priorityDiff =
      resolvePersonnelPriorityIndex(a) - resolvePersonnelPriorityIndex(b);
    if (priorityDiff !== 0) {
      return priorityDiff;
    }

    const interactionsDiff = (b.interactions ?? 0) - (a.interactions ?? 0);
    if (interactionsDiff !== 0) {
      return interactionsDiff;
    }

    return compareUsersByPangkatOnly(a, b);
  });
};

const safeFetch = async (factory) => {
  try {
    const data = await factory();
    return { data, error: null };
  } catch (error) {
    console.warn("Gagal memuat data weekly report", error);
    return { data: null, error };
  }
};

const fetchDitbinmasWeeklyData = async ([, token, clientId, monthValue, yearValue]) => {
  const monthNumber = Number(monthValue);
  const yearNumber = Number(yearValue);

  if (!Number.isFinite(monthNumber) || !Number.isFinite(yearNumber)) {
    throw new Error("Periode mingguan tidak valid");
  }

  const normalizedClientId =
    typeof clientId === "string" ? clientId.trim().toUpperCase() : "";
  const resolvedClientId = normalizedClientId || "DITBINMAS";

  const monthStart = new Date(Date.UTC(yearNumber, monthNumber - 1, 1));
  const monthEnd = new Date(Date.UTC(yearNumber, monthNumber, 0));

  const weekRanges = buildWeekRanges(monthNumber, yearNumber);

  const normalizeToUtcDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.valueOf())) {
      return null;
    }

    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  };

  const expandedStart = normalizeToUtcDate(weekRanges[0]?.start) ?? monthStart;
  const expandedEnd =
    normalizeToUtcDate(weekRanges[weekRanges.length - 1]?.end) ?? monthEnd;

  const fetchStart =
    expandedStart.getTime() < monthStart.getTime() ? expandedStart : monthStart;
  const fetchEnd = expandedEnd.getTime() > monthEnd.getTime() ? expandedEnd : monthEnd;

  const toDateString = (date) => date.toISOString().slice(0, 10);

  const [likesResult, commentsResult, instagramResult, tiktokResult] = await Promise.all([
    safeFetch(() =>
      getRekapLikesIG(
        token,
        resolvedClientId,
        "harian",
        undefined,
        toDateString(fetchStart),
        toDateString(fetchEnd),
      ),
    ),
    safeFetch(() =>
      getRekapKomentarTiktok(
        token,
        resolvedClientId,
        "harian",
        undefined,
        toDateString(fetchStart),
        toDateString(fetchEnd),
      ),
    ),
    safeFetch(() =>
      getInstagramPosts(token, resolvedClientId, {
        startDate: toDateString(fetchStart),
        endDate: toDateString(fetchEnd),
      }),
    ),
    safeFetch(() =>
      getTiktokPosts(token, resolvedClientId, {
        startDate: toDateString(fetchStart),
        endDate: toDateString(fetchEnd),
      }),
    ),
  ]);

  const likesRecords = ensureArray(
    likesResult.data?.data,
    likesResult.data?.records,
    likesResult.data?.rekap,
    likesResult.data,
  );
  const commentRecords = ensureArray(
    commentsResult.data?.data,
    commentsResult.data?.records,
    commentsResult.data?.rekap,
    commentsResult.data,
  );
  const instagramPosts = ensureArray(
    instagramResult.data?.data,
    instagramResult.data?.posts,
    instagramResult.data,
  );
  const tiktokPosts = ensureArray(
    tiktokResult.data?.data,
    tiktokResult.data?.posts,
    tiktokResult.data,
  );

  return {
    monthStart,
    monthEnd,
    likesRecords,
    commentRecords,
    instagramPosts,
    tiktokPosts,
    errors: {
      likes: likesResult.error,
      comments: commentsResult.error,
      instagram: instagramResult.error,
      tiktok: tiktokResult.error,
    },
  };
};

const resolveActiveLabel = (options, value) =>
  options.find((option) => option.value === value)?.label ?? "";

const resolveWeekDateRange = (weekValue, monthValue, yearValue) => {
  const weekNumber = Number(weekValue);
  const monthNumber = Number(monthValue);
  const yearNumber = Number(yearValue);

  if (!Number.isFinite(weekNumber) || !Number.isFinite(monthNumber) || !Number.isFinite(yearNumber)) {
    return "";
  }

  const normalizedWeek = Math.max(Math.floor(weekNumber), 1);
  const normalizedMonth = Math.min(Math.max(Math.floor(monthNumber), 1), 12);
  const startDay = 1 + (normalizedWeek - 1) * 7;
  const daysInMonth = new Date(yearNumber, normalizedMonth, 0).getDate();
  const endDay = Math.min(startDay + 6, daysInMonth);

  const formatDay = (day) => String(day).padStart(2, "0");
  return `${formatDay(startDay)}-${formatDay(endDay)}`;
};

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

const DEFAULT_EARLIEST_YEAR = 2020;

const buildYearOptions = (earliestYear = DEFAULT_EARLIEST_YEAR) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const resolvedEarliestYear = Number.isFinite(earliestYear)
    ? Math.min(Math.floor(earliestYear), currentYear)
    : currentYear;

  const options = [];

  for (let year = currentYear; year >= resolvedEarliestYear; year -= 1) {
    options.push({ label: String(year), value: String(year) });
  }

  return options;
};

const ensureYearOption = (options, year) => {
  const yearValue = String(year);
  if (options.some((option) => option.value === yearValue)) {
    return options;
  }

  return [...options, { label: yearValue, value: yearValue }].sort(
    (left, right) => Number(right.value) - Number(left.value),
  );
};

const YEAR_OPTIONS = buildYearOptions();

const getCurrentSelections = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const currentDay = now.getDate();

  const yearOptions = ensureYearOption(YEAR_OPTIONS, year);
  const weekRanges = buildWeekRanges(month, year);

  const referenceDate = new Date(year, month - 1, currentDay);
  referenceDate.setHours(0, 0, 0, 0);

  const matchingRange = weekRanges.find(
    (range) =>
      referenceDate.getTime() >= range.start.getTime() &&
      referenceDate.getTime() <= range.end.getTime(),
  );

  const fallbackRange = matchingRange ?? weekRanges[weekRanges.length - 1] ?? weekRanges[0] ?? null;
  const resolvedWeek = fallbackRange ? String(fallbackRange.index) : "1";

  return {
    week: resolvedWeek,
    month:
      MONTH_OPTIONS.find((option) => option.value === String(month))?.value ??
      MONTH_OPTIONS[0].value,
    year:
      yearOptions.find((option) => option.value === String(year))?.value ??
      yearOptions[0]?.value ?? String(year),
  };
};

export default function WeeklyReportPageClient() {
  useRequireAuth();
  const { token, role, clientId } = useAuth();
  const [{ week: defaultWeek, month: defaultMonth, year: defaultYear }] = useState(() => getCurrentSelections());
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  const yearOptions = useMemo(
    () => ensureYearOption(YEAR_OPTIONS, selectedYear),
    [selectedYear],
  );

  const normalizedRole = useMemo(() => {
    if (role) return String(role).trim().toLowerCase();
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("user_role") || "").trim().toLowerCase();
  }, [role]);

  const normalizedClientId = useMemo(() => {
    if (clientId) return String(clientId).trim().toLowerCase();
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("client_id") || "").trim().toLowerCase();
  }, [clientId]);

  const indicatesDitbinmasRole = normalizedRole.includes("ditbinmas");
  const ditbinmasClientScope = indicatesDitbinmasRole
    ? normalizedClientId && normalizedClientId !== "ditbinmas"
      ? normalizedClientId
      : "ditbinmas"
    : normalizedClientId;
  const resolvedDitbinmasClientScope = useMemo(
    () => normalizeClientScopeIdentifier(ditbinmasClientScope) || DITBINMAS_CLIENT_TARGET,
    [ditbinmasClientScope],
  );

  const isDitbinmasAuthorized = indicatesDitbinmasRole;

  const formatNumber = useMemo(
    () =>
      (value, options) => {
        const numericValue = Number.isFinite(value) ? Number(value) : 0;
        const formatter = new Intl.NumberFormat("id-ID", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
          ...(options ?? {}),
        });
        return formatter.format(Math.max(0, numericValue));
      },
    [],
  );

  const formatPercentValue = useMemo(
    () =>
      (value) => {
        const numericValue = Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
        const fractionDigits = numericValue > 0 && numericValue < 10 ? 1 : 0;
        const formatter = new Intl.NumberFormat("id-ID", {
          maximumFractionDigits: fractionDigits,
          minimumFractionDigits: fractionDigits,
        });
        return `${formatter.format(numericValue)}%`;
      },
    [],
  );

  const { data: ditbinmasDirectory } = useSWR(
    token && isDitbinmasAuthorized
      ? ["ditbinmas-directory", token, ditbinmasClientScope]
      : null,
    ([, tk, scope]) =>
      getUserDirectory(
        tk,
        normalizeClientScopeIdentifier(scope) || resolvedDitbinmasClientScope,
      ),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const {
    data: weeklySource,
    error: weeklySourceError,
    isValidating: weeklyValidating,
  } = useSWR(
    token && isDitbinmasAuthorized
      ? [
          "ditbinmas-weekly-report",
          token,
          ditbinmasClientScope,
          selectedMonth,
          selectedYear,
        ]
      : null,
    fetchDitbinmasWeeklyData,
    {
      revalidateOnFocus: false,
      keepPreviousData: true,
    },
  );

  const weekRanges = useMemo(
    () => buildWeekRanges(selectedMonth, selectedYear),
    [selectedMonth, selectedYear],
  );

  const weekOptions = useMemo(() => {
    if (!weekRanges.length) {
      return [{ label: "Minggu 1", value: "1" }];
    }

    return weekRanges.map((range) => ({
      label: `Minggu ${range.index}`,
      value: String(range.index),
    }));
  }, [weekRanges]);

  useEffect(() => {
    if (!weekOptions.length) {
      return;
    }

    if (!weekOptions.some((option) => option.value === selectedWeek)) {
      setSelectedWeek(weekOptions[0].value);
    }
  }, [weekOptions, selectedWeek]);

  const activeWeekRange = useMemo(() => {
    if (!weekRanges.length) {
      return null;
    }
    const weekIndex = Number(selectedWeek) || 1;
    return findWeekRange(weekRanges, weekIndex) ?? weekRanges[0] ?? null;
  }, [weekRanges, selectedWeek]);

  const previousWeekRange = useMemo(
    () => computePreviousRange(weekRanges, activeWeekRange),
    [weekRanges, activeWeekRange],
  );

  const weeklyInitialLoading = Boolean(
    isDitbinmasAuthorized && !weeklySource && !weeklySourceError && weeklyValidating,
  );

  const [hasWeeklyLoaded, setHasWeeklyLoaded] = useState(false);
  const [weeklyRefreshing, setWeeklyRefreshing] = useState(false);
  const weeklySelectionRef = useRef({
    month: selectedMonth,
    year: selectedYear,
    week: selectedWeek,
  });

  useEffect(() => {
    if (!isDitbinmasAuthorized) {
      setHasWeeklyLoaded(false);
      setWeeklyRefreshing(false);
      weeklySelectionRef.current = {
        month: selectedMonth,
        year: selectedYear,
        week: selectedWeek,
      };
      return;
    }

    if (weeklySource) {
      setHasWeeklyLoaded(true);
    }
  }, [
    isDitbinmasAuthorized,
    weeklySource,
    selectedMonth,
    selectedYear,
    selectedWeek,
  ]);

  useEffect(() => {
    if (!isDitbinmasAuthorized || !hasWeeklyLoaded) {
      weeklySelectionRef.current = {
        month: selectedMonth,
        year: selectedYear,
        week: selectedWeek,
      };
      return;
    }

    const previous = weeklySelectionRef.current;
    const selectionChanged =
      previous.month !== selectedMonth ||
      previous.year !== selectedYear ||
      previous.week !== selectedWeek;

    if (selectionChanged) {
      weeklySelectionRef.current = {
        month: selectedMonth,
        year: selectedYear,
        week: selectedWeek,
      };
      setWeeklyRefreshing(true);
    }
  }, [isDitbinmasAuthorized, hasWeeklyLoaded, selectedMonth, selectedYear, selectedWeek]);

  useEffect(() => {
    if (!isDitbinmasAuthorized || !hasWeeklyLoaded) {
      setWeeklyRefreshing(false);
      return;
    }

    if (weeklyValidating) {
      setWeeklyRefreshing(true);
      return;
    }

    setWeeklyRefreshing(false);
  }, [isDitbinmasAuthorized, hasWeeklyLoaded, weeklyValidating]);

  const weeklyLoading = weeklyInitialLoading || weeklyRefreshing;

  const ditbinmasUsers = useMemo(
    () =>
      resolveDitbinmasDirectoryUsers(ditbinmasDirectory, {
        clientScope: ditbinmasClientScope,
      }),
    [ditbinmasDirectory, ditbinmasClientScope],
  );

  const ditbinmasPersonnelCount = ditbinmasUsers.length;

  const ditbinmasPersonnelDescriptor = useMemo(() => {
    const resolvedLabel = "Personil Ditbinmas";
    if (ditbinmasPersonnelCount === null || ditbinmasPersonnelCount === undefined) {
      return resolvedLabel;
    }

    return `${formatNumber(ditbinmasPersonnelCount, { maximumFractionDigits: 0 })} ${resolvedLabel}`;
  }, [ditbinmasPersonnelCount, formatNumber]);

  const weeklyPlatformSnapshot = useMemo(() => {
    const emptySnapshot = {
      likesSummaryData: createEmptyWeeklyLikesSummary(),
      summaryCards: [],
      labelOverrides: {},
      personnelDistribution: [],
      distributionMeta: { note: "" },
      postTotals: { instagram: 0, tiktok: 0 },
      periodLabel: "",
      weekDescriptor: "",
      instagramSeries: [],
      tiktokSeries: [],
      instagramLatest: null,
      instagramPrevious: null,
      tiktokLatest: null,
      tiktokPrevious: null,
      totals: {
        totalPosts: 0,
        previousPosts: 0,
        totalLikes: 0,
        previousLikes: 0,
        totalComments: 0,
        previousComments: 0,
        complianceRate: 0,
        previousComplianceRate: 0,
      },
      fetchErrors: weeklySource?.errors ?? {},
    };

    if (!isDitbinmasAuthorized) {
      return emptySnapshot;
    }

    if (!weeklySource || !activeWeekRange) {
      return emptySnapshot;
    }

    const weekIndex = activeWeekRange.index;
    const weekOptionLabel = resolveActiveLabel(weekOptions, selectedWeek);
    const monthLabel = resolveActiveLabel(MONTH_OPTIONS, selectedMonth) || "";
    const weekDescriptor = `Minggu ${weekIndex} ${monthLabel} ${selectedYear}`;
    const weekRangeLabel = formatWeeklyRangeLabel(
      activeWeekRange.start,
      activeWeekRange.end,
    );
    const periodLabel = `${weekOptionLabel} • ${weekRangeLabel} ${monthLabel} ${selectedYear}`;

    const fallbackDate =
      weeklySource.monthStart instanceof Date ? weeklySource.monthStart : null;

    const likesRecordsByWeek = prepareActivityRecordsByWeek(
      weeklySource.likesRecords,
      {
        fallbackDate,
        activeWeekRange,
        previousWeekRange,
      },
    );
    const commentRecordsByWeek = prepareActivityRecordsByWeek(
      weeklySource.commentRecords,
      {
        fallbackDate,
        activeWeekRange,
        previousWeekRange,
      },
    );

    const likesWeekRecords = filterActivityRecordsByRange(
      likesRecordsByWeek,
      activeWeekRange,
    );
    const commentsWeekRecords = filterActivityRecordsByRange(
      commentRecordsByWeek,
      activeWeekRange,
    );
    const likesPrevRecords = previousWeekRange
      ? filterActivityRecordsByRange(likesRecordsByWeek, previousWeekRange)
      : [];
    const commentsPrevRecords = previousWeekRange
      ? filterActivityRecordsByRange(commentRecordsByWeek, previousWeekRange)
      : [];

    const mergedWeekRecords = mergeWeeklyActivityRecords(
      likesWeekRecords,
      commentsWeekRecords,
    );
    const mergedPrevRecords = mergeWeeklyActivityRecords(
      likesPrevRecords,
      commentsPrevRecords,
    );

    const filteredWeekRecords = filterDitbinmasRecords(mergedWeekRecords, {
      clientScope: ditbinmasClientScope,
    });
    const filteredPrevRecords = filterDitbinmasRecords(mergedPrevRecords, {
      clientScope: ditbinmasClientScope,
    });

    const summaryWeekRaw = aggregateWeeklyLikesRecords(filteredWeekRecords, {
      directoryUsers: ditbinmasUsers,
    });
    const summaryPrevRaw = aggregateWeeklyLikesRecords(filteredPrevRecords, {
      directoryUsers: ditbinmasUsers,
    });

    const uniqueDirectoryPersonnelCount =
      countUniquePersonnelRecords(ditbinmasUsers);
    const resolvedTotalPersonnel =
      uniqueDirectoryPersonnelCount > 0
        ? uniqueDirectoryPersonnelCount
        : summaryWeekRaw?.totals?.totalPersonnel ?? 0;
    const totalActive = summaryWeekRaw?.totals?.activePersonnel || 0;
    const totalPersonnelWithLikes =
      summaryWeekRaw?.totals?.personnelWithLikes || 0;
    const previousActive = summaryPrevRaw?.totals?.activePersonnel || 0;
    const previousPersonnelWithLikes =
      summaryPrevRaw?.totals?.personnelWithLikes || 0;

    const complianceRate =
      totalActive > 0 ? (totalPersonnelWithLikes / totalActive) * 100 : 0;
    const previousComplianceRateRaw =
      previousActive > 0
        ? (previousPersonnelWithLikes / previousActive) * 100
        : 0;

    const summaryWeek = {
      ...summaryWeekRaw,
      totals: {
        ...summaryWeekRaw.totals,
        totalPersonnel: resolvedTotalPersonnel,
        activePersonnel: totalActive,
        personnelWithLikes: totalPersonnelWithLikes,
        complianceRate,
      },
      lastUpdated: summaryWeekRaw.lastUpdated ?? activeWeekRange.end,
    };

    const summaryPrev = {
      ...summaryPrevRaw,
      totals: {
        ...summaryPrevRaw.totals,
        totalPersonnel: resolvedTotalPersonnel,
        activePersonnel: previousActive,
        personnelWithLikes: previousPersonnelWithLikes,
        complianceRate: previousComplianceRateRaw,
      },
    };

    const instagramNormalized = normalizePostsForPlatform(weeklySource.instagramPosts, {
      platformKey: "instagram",
      platformLabel: "Instagram",
    });
    const tiktokNormalized = normalizePostsForPlatform(weeklySource.tiktokPosts, {
      platformKey: "tiktok",
      platformLabel: "TikTok",
    });

    const instagramSeries = buildWeeklySeries(instagramNormalized, weekRanges, monthLabel);
    const tiktokSeries = buildWeeklySeries(tiktokNormalized, weekRanges, monthLabel);

    const instagramLatest =
      instagramSeries.find((point) => point.index === weekIndex) ?? null;
    const instagramPrevious =
      previousWeekRange?.index
        ? instagramSeries.find((point) => point.index === previousWeekRange.index) ?? null
        : null;
    const tiktokLatest = tiktokSeries.find((point) => point.index === weekIndex) ?? null;
    const tiktokPrevious =
      previousWeekRange?.index
        ? tiktokSeries.find((point) => point.index === previousWeekRange.index) ?? null
        : null;

    const hasPreviousWeekRange = Boolean(previousWeekRange);
    const hasPreviousEngagementRecords =
      hasPreviousWeekRange &&
      (filteredPrevRecords.length > 0 || summaryPrevRaw?.lastUpdated instanceof Date);
    const hasPreviousPostRecords =
      hasPreviousWeekRange && (instagramPrevious || tiktokPrevious);

    const totalPosts = (instagramLatest?.posts ?? 0) + (tiktokLatest?.posts ?? 0);
    const previousPosts = hasPreviousPostRecords
      ? (instagramPrevious?.posts ?? 0) + (tiktokPrevious?.posts ?? 0)
      : null;

    const totalLikes = summaryWeek.totals.totalLikes ?? 0;
    const previousLikes = hasPreviousEngagementRecords
      ? summaryPrev.totals.totalLikes ?? 0
      : null;
    const totalComments = summaryWeek.totals.totalComments ?? 0;
    const previousComments = hasPreviousEngagementRecords
      ? summaryPrev.totals.totalComments ?? 0
      : null;

    const buildComparison = (currentValue, previousValue, formatter) => {
      const currentCandidate =
        typeof currentValue === "number" || typeof currentValue === "string"
          ? Number(currentValue)
          : NaN;
      const currentNumeric = Number.isFinite(currentCandidate) ? currentCandidate : 0;
      const previousCandidate =
        previousValue == null
          ? NaN
          : typeof previousValue === "number" || typeof previousValue === "string"
          ? Number(previousValue)
          : NaN;
      const previousNumeric = Number.isFinite(previousCandidate) ? previousCandidate : null;

      if (previousNumeric === null) {
        return {
          label: "Tidak ada data pembanding minggu sebelumnya",
          direction: "flat",
        };
      }

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

    const postsComparison = buildComparison(totalPosts, previousPosts, (value) =>
      formatNumber(value, { maximumFractionDigits: 0 }),
    );
    const likesComparison = buildComparison(totalLikes, previousLikes, (value) =>
      formatNumber(value, { maximumFractionDigits: 0 }),
    );
    const commentsComparison = buildComparison(totalComments, previousComments, (value) =>
      formatNumber(value, { maximumFractionDigits: 0 }),
    );

    const previousComplianceRate = hasPreviousEngagementRecords
      ? resolvedTotalPersonnel > 0
        ? (previousActive / resolvedTotalPersonnel) * 100
        : 0
      : null;

    const complianceComparison = (() => {
      if (!Number.isFinite(complianceRate)) {
        return null;
      }
      if (previousComplianceRate == null || !Number.isFinite(previousComplianceRate)) {
        return {
          label: "Tidak ada data pembanding minggu sebelumnya",
          direction: "flat",
        };
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

    const summaryCards = [
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
        description: `Post Instagram: ${formatNumber(instagramLatest?.posts ?? 0, {
          maximumFractionDigits: 0,
        })} · Post TikTok: ${formatNumber(tiktokLatest?.posts ?? 0, {
          maximumFractionDigits: 0,
        })}`,
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
        })} aktif dari ${formatNumber(resolvedTotalPersonnel, { maximumFractionDigits: 0 })} personil.`,
        comparison: complianceComparison,
      },
    ];

    const tableEmptyLabel = "Belum ada data engagement personil untuk minggu ini.";

    const rawPersonnelDistribution = extractClientPersonnel(
      summaryWeek.clients || [],
    );

    const personnelDistribution = sortPersonnelDistribution(
      rawPersonnelDistribution,
    );

    const labelOverrides = {
      likesContributorsTitle: "Kontributor Likes per Subsatker",
      likesContributorsDescription: "Subsatker dengan kontribusi likes tertinggi pada minggu ini.",
      commentContributorsDescription: "Subsatker dengan jumlah komentar terbanyak selama minggu ini.",
      tableTitle: "Distribusi Engagement Per User / Personil",
      tableEmptyLabel,
    };

    const distributionMeta = {
      note:
        rawPersonnelDistribution.length > 0
          ? `${weekDescriptor} • ${formatNumber(totalActive, {
              maximumFractionDigits: 0,
            })} personil aktif`
          : tableEmptyLabel,
    };

    const likesSummaryData = {
      ...summaryWeek,
    };

    return {
      likesSummaryData,
      summaryCards,
      labelOverrides,
      personnelDistribution,
      distributionMeta,
      postTotals: {
        instagram: instagramLatest?.posts ?? 0,
        tiktok: tiktokLatest?.posts ?? 0,
      },
      periodLabel,
      weekDescriptor,
      instagramSeries,
      tiktokSeries,
      instagramLatest,
      instagramPrevious,
      tiktokLatest,
      tiktokPrevious,
      totals: {
        totalPosts,
        previousPosts,
        totalLikes,
        previousLikes,
        totalComments,
        previousComments,
        complianceRate,
        previousComplianceRate,
      },
      fetchErrors: weeklySource.errors || {},
    };
  }, [
    isDitbinmasAuthorized,
    weeklySource,
    activeWeekRange,
    previousWeekRange,
    weekRanges,
    selectedWeek,
    selectedMonth,
    selectedYear,
    formatNumber,
    formatPercentValue,
    ditbinmasUsers,
  ]);

  const {
    likesSummaryData,
    summaryCards: weeklySummaryCards,
    labelOverrides: weeklyLabelOverrides,
    personnelDistribution: weeklyPersonnelDistribution,
    distributionMeta: weeklyDistributionMeta,
    postTotals: weeklyPostTotals,
    periodLabel: weeklyPeriodLabel,
    weekDescriptor,
    instagramSeries,
    tiktokSeries,
    instagramLatest,
    instagramPrevious,
    tiktokLatest,
    tiktokPrevious,
    fetchErrors: weeklyFetchErrors,
  } = weeklyPlatformSnapshot;

  const generalWeeklyError = weeklySourceError
    ? "Gagal memuat data mingguan Ditbinmas."
    : "";
  const instagramTrendError = generalWeeklyError
    ? generalWeeklyError
    : weeklyFetchErrors?.instagram
    ? "Gagal memuat data konten Instagram."
    : "";
  const tiktokTrendError = generalWeeklyError
    ? generalWeeklyError
    : weeklyFetchErrors?.tiktok
    ? "Gagal memuat data konten TikTok."
    : "";

  const resolvedPeriodLabel =
    weeklyPeriodLabel ||
    `${
      resolveActiveLabel(weekOptions, selectedWeek) ?? "Minggu Berjalan"
    } • ${resolveWeekDateRange(selectedWeek, selectedMonth, selectedYear)} ${
      resolveActiveLabel(MONTH_OPTIONS, selectedMonth) ?? ""
    } ${resolveActiveLabel(yearOptions, selectedYear) ?? ""}`.trim();

  const filters = (
    <WeeklyReportFilters
      weekOptions={weekOptions}
      monthOptions={MONTH_OPTIONS}
      yearOptions={yearOptions}
      selectedWeek={selectedWeek}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      onWeekChange={setSelectedWeek}
      onMonthChange={setSelectedMonth}
      onYearChange={setSelectedYear}
    />
  );

  const trendDescription = `Perbandingan performa konten mingguan berdasarkan total interaksi pada Instagram dan TikTok oleh ${ditbinmasPersonnelDescriptor}.`;

  return (
    <WeeklyReportLayout>
      <WeeklyReportHeader
        title="Laporan Mingguan Engagement Ditbinmas"
        description="Halaman ini merangkum analisis mingguan atas pelaksanaan likes dan komentar oleh Personil Ditbinmas, sehingga Anda dapat langsung melihat perkembangan interaksi dari pekan ke pekan berdasarkan pilihan periode di bawah."
        meta={
          <div className="rounded-full border border-emerald-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
            {ditbinmasPersonnelDescriptor}
          </div>
        }
        filters={
          <div className="flex flex-col gap-2 sm:items-end">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Show Data By
            </span>
            {filters}
          </div>
        }
      />

      {isDitbinmasAuthorized ? (
        <>
          <WeeklySummaryCards cards={weeklySummaryCards} loading={weeklyLoading} />

          <WeeklyTrendSection
            periodLabel={resolvedPeriodLabel}
            description={trendDescription}
            loading={weeklyLoading}
            personnelCount={ditbinmasPersonnelCount ?? null}
            datasets={[
              {
                platformKey: "instagram",
                platformLabel: "Instagram",
                series: instagramSeries,
                latest: instagramLatest,
                previous: instagramPrevious,
                error: instagramTrendError,
              },
              {
                platformKey: "tiktok",
                platformLabel: "TikTok",
                series: tiktokSeries,
                latest: tiktokLatest,
                previous: tiktokPrevious,
                error: tiktokTrendError,
              },
            ]}
          />

          <WeeklyDistributionSection
            description={`Menampilkan distribusi likes dan komentar per Subsatker Ditbinmas selama ${weekDescriptor || "periode terpilih"}, sehingga perkembangan kontribusi personil mudah dipantau.`}
            periodLabel={weeklyPeriodLabel ?? resolvedPeriodLabel}
            weekDescriptor={weekDescriptor ?? resolvedPeriodLabel}
            summaryData={likesSummaryData}
            summaryCards={weeklySummaryCards}
            formatNumber={formatNumber}
            formatPercent={formatPercentValue}
            postTotals={weeklyPostTotals}
            labelOverrides={weeklyLabelOverrides}
            personnelDistribution={weeklyPersonnelDistribution}
            personnelDistributionMeta={weeklyDistributionMeta}
            loading={weeklyLoading}
          />
        </>
      ) : (
        <section className="rounded-3xl border border-rose-100 bg-white/70 p-8 text-center text-slate-600 shadow-lg backdrop-blur">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl">⚠️</div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Akses Terbatas</h2>
          <p className="mt-2 text-sm">
            Laporan mingguan Ditbinmas hanya dapat diakses oleh pengguna dengan peran dan client ID Ditbinmas. Silakan hubungi admin untuk meminta akses.
          </p>
        </section>
      )}
    </WeeklyReportLayout>
  );
}
