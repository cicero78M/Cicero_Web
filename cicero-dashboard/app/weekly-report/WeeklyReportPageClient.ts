"use client";

import { useEffect } from "react";
import { aggregateWeeklyLikesRecords, mergeWeeklyActivityRecords } from "./lib/dataTransforms";
import useAuth from "@/hooks/useAuth";
import {
  getInstagramPosts,
  getRekapKomentarTiktok,
  getRekapLikesIG,
  getTiktokPosts,
  getUserDirectory,
} from "@/utils/api";

type ActivityRecord = Record<string, any>;

function ensureNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeIdentifier(value?: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, "")
    .replace(/[.,]/g, "");
}

type DitbinmasFilterOptions = {
  clientScope?: string;
};

function recordTokens(record: ActivityRecord): string[] {
  const client = record.client && typeof record.client === "object" ? record.client : {};
  const targetClients = Array.isArray(record.target_clients) ? record.target_clients : [];
  return [
    record.client_id,
    record.clientId,
    record.clientID,
    (record as any).clientid,
    (record as any).id_client,
    (record as any).idClient,
    (record as any).client_code,
    (record as any).clientCode,
    record.client_name,
    (record as any).clientName,
    (record as any).name,
    (client as any).name,
    record.parent_client_id,
    (record as any).parent_client,
    ...targetClients,
    record.rekap?.client_id,
    record.rekap?.client_name,
  ]
    .map((value) => normalizeIdentifier(value))
    .filter(Boolean);
}

function matchesDitbinmasToken(token: string): boolean {
  return token === "ditbinmas";
}

function scopeMatcher(record: ActivityRecord, scopeToken: string): boolean {
  const tokens = recordTokens(record);
  if (!scopeToken) return false;

  if (scopeToken === "ditbinmas") {
    return tokens.some(matchesDitbinmasToken);
  }

  return tokens.some((token) => token === scopeToken);
}

export function filterDitbinmasRecords(
  records: ActivityRecord[] = [],
  options: DitbinmasFilterOptions = {},
) {
  const scopeToken = normalizeIdentifier(options.clientScope);

  return records.filter((record) => {
    const tokens = recordTokens(record);
    const hasDitbinmasClient = tokens.some(matchesDitbinmasToken);

    if (scopeToken) {
      if (scopeToken === "ditbinmas") {
        return scopeMatcher(record, "ditbinmas");
      }
      return scopeMatcher(record, scopeToken);
    }

    return hasDitbinmasClient;
  });
}

export function resolveDitbinmasDirectoryUsers(users: ActivityRecord[] = []) {
  return users
    .filter((user) => {
      const clientId = (user.client_id || user.clientId || "").toString().trim();
      const targetClients = Array.isArray(user.target_clients) ? user.target_clients : [];
      const hasDitbinmasTarget = targetClients
        .map((value) => normalizeIdentifier(value))
        .includes("ditbinmas");
      const isInactive =
        user.status === "inactive" ||
        user.is_active === false ||
        String(user.aktif || "").toLowerCase() === "tidak";
      const isDitbinmasClient = normalizeIdentifier(clientId) === "ditbinmas";
      return (isDitbinmasClient || hasDitbinmasTarget) && !isInactive;
    })
    .map((user) => ({ ...user }));
}

export function normalizePostsForPlatform(
  records: ActivityRecord[],
  options: { platformKey: string; platformLabel: string },
) {
  return records.map((record, index) => {
    const timestamp = record.timestamp || record.created_at || record.date || record.tanggal || "";
    const likes = ensureNumber(record.metrics?.likes ?? record.like_count ?? record.likes, 0);
    const comments = ensureNumber(
      record.metrics?.comments ?? record.comment_count ?? record.comments,
      0,
    );
    const shares = ensureNumber(record.metrics?.shares ?? record.share_count ?? record.shares, 0);
    return {
      ...record,
      id: record.id || `record-${index}`,
      platformKey: options.platformKey,
      platformLabel: options.platformLabel,
      timestamp,
      metrics: {
        likes,
        comments,
        shares,
        interactions:
          ensureNumber(record.metrics?.interactions) || likes + comments + shares || 0,
      },
    };
  });
}

export function buildWeeklySeries(
  records: ActivityRecord[],
  weekRanges: { key: string; start: Date; end: Date }[],
  label: string,
) {
  return weekRanges.map((range) => {
    const withinRange = records.filter((record) => {
      const ts = new Date(record.timestamp);
      return ts >= range.start && ts <= range.end;
    });
    const likes = withinRange.reduce(
      (acc, record) => acc + ensureNumber(record.metrics?.likes ?? record.likes, 0),
      0,
    );
    const comments = withinRange.reduce(
      (acc, record) => acc + ensureNumber(record.metrics?.comments ?? record.comments, 0),
      0,
    );
    const shares = withinRange.reduce(
      (acc, record) => acc + ensureNumber(record.metrics?.shares ?? record.shares, 0),
      0,
    );
    const interactions = likes + comments + shares;
    return {
      key: range.key,
      label,
      likes,
      comments,
      shares,
      interactions,
      posts: withinRange.length,
    };
  });
}

export function filterActivityRecordsByRange(
  recordsOrContainer: any,
  range: { start: Date; end: Date },
) {
  const records = Array.isArray(recordsOrContainer)
    ? recordsOrContainer
    : recordsOrContainer.records || recordsOrContainer.defaultRecords || [];
  return records.filter((record: any) => {
    const timestamp = record.timestamp ? new Date(record.timestamp) : null;
    if (!timestamp) return false;
    return timestamp >= range.start && timestamp <= range.end;
  });
}

export function prepareActivityRecordsByWeek(
  records: ActivityRecord[],
  options: {
    fallbackDate: Date;
    activeWeekRange: { start: Date; end: Date };
    previousWeekRange: { start: Date; end: Date };
  },
) {
  const normalizedRecords = records.map((record) => {
    if (record.timestamp) return record;
    return { ...record, timestamp: options.fallbackDate.toISOString() };
  });

  return {
    records: normalizedRecords,
    defaultRecords: normalizedRecords,
  };
}

function resolvePersonnelKey(person: ActivityRecord, clientKey: string) {
  return (
    normalizeIdentifier(person.user_id) ||
    normalizeIdentifier(person.nrp) ||
    normalizeIdentifier(person.email) ||
    String(person.username || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-") ||
    String(person.nama || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-") ||
    clientKey
  );
}

export function extractClientPersonnel(clients: ActivityRecord[] = []) {
  const personnel: ActivityRecord[] = [];
  clients.forEach((client) => {
    (client.personnel || []).forEach((person: any) => {
      const likes = ensureNumber(person.likes, 0);
      const comments = ensureNumber(person.comments, 0);
      const interactions = likes + comments;
      personnel.push({
        ...person,
        key: person.key || `${client.key}-${resolvePersonnelKey(person, client.key)}`,
        nama: person.nama || person.username || "",
        satfung: person.divisi || person.satfung || client.divisi || client.clientName,
        likes,
        comments,
        interactions,
      });
    });
  });
  return personnel.filter((p) => p.nama || p.username);
}

const KEY_PERSONNEL = [
  "LAFRI PRASETYONO",
  "ARY MURTINI",
  "KOMISARIS BESAR POLISI LAFRI PRASETYONO",
  "AKBP ARY MURTINI",
];

export function sortPersonnelDistribution(personnel: ActivityRecord[]) {
  return [...personnel].sort((a, b) => {
    const aName = String(a.nama || "").toUpperCase();
    const bName = String(b.nama || "").toUpperCase();
    const aIsKey = KEY_PERSONNEL.some((name) => aName.includes(name));
    const bIsKey = KEY_PERSONNEL.some((name) => bName.includes(name));
    if (aIsKey && !bIsKey) return -1;
    if (!aIsKey && bIsKey) return 1;
    return ensureNumber(b.interactions, 0) - ensureNumber(a.interactions, 0);
  });
}

function normalizeClientScope(clientId?: unknown): string {
  return String(clientId || "")
    .trim()
    .toUpperCase();
}

export default function WeeklyReportPageClient() {
  const { token, clientId } = useAuth() as { token?: string; clientId?: string };

  useEffect(() => {
    if (!token) return;
    const scope = normalizeClientScope(clientId);
    if (!scope) return;

    const controller = new AbortController();

    const run = async () => {
      try {
        await Promise.all([
          getUserDirectory(token, scope, controller.signal),
          getInstagramPosts(token, scope, { signal: controller.signal }),
          getTiktokPosts(token, scope, { signal: controller.signal }),
          getRekapLikesIG(token, scope, "harian", undefined, undefined, undefined, controller.signal),
          getRekapKomentarTiktok(
            token,
            scope,
            "harian",
            undefined,
            undefined,
            undefined,
            controller.signal,
          ),
        ]);
      } catch {
        // noop untuk menjaga halaman tetap stabil saat salah satu endpoint gagal
      }
    };

    void run();
    return () => controller.abort();
  }, [token, clientId]);

  return null;
}

export { aggregateWeeklyLikesRecords, mergeWeeklyActivityRecords };
