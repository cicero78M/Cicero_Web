import { aggregateWeeklyLikesRecords, mergeWeeklyActivityRecords } from "./lib/dataTransforms";

type ActivityRecord = Record<string, any>;

function ensureNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeIdentifier(value?: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\\s._-]+/g, "")
    .replace(/[.,]/g, "");
}

export function filterDitbinmasRecords(records: ActivityRecord[] = []) {
  return records.filter((record) => {
    const clientId =
      (record.client_id || record.clientId || record.clientID || record.rekap?.client_id || "")
        .toString()
        .toUpperCase();
    const role = (record.role || record.rekap?.role || "").toString().toLowerCase();
    return clientId === "DITBINMAS" || role.includes("ditbinmas");
  });
}

export function resolveDitbinmasDirectoryUsers(users: ActivityRecord[] = []) {
  return users
    .filter((user) => {
      const clientId = (user.client_id || user.clientId || "").toString().trim();
      const isInactive =
        user.status === "inactive" ||
        user.is_active === false ||
        String(user.aktif || "").toLowerCase() === "tidak";
      return clientId && !isInactive;
    })
    .map((user) => {
      if (Array.isArray(user.target_clients) && user.target_clients.includes("DITBINMAS")) {
        return { ...user };
      }
      return { ...user };
    });
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
    normalizeIdentifier(person.username) ||
    normalizeIdentifier(person.nama) ||
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

export { aggregateWeeklyLikesRecords, mergeWeeklyActivityRecords };

