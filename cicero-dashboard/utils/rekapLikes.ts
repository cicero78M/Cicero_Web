const USER_KEY_HINTS = [
  "username",
  "nama",
  "jumlah_like",
  "jumlahLike",
  "client_id",
  "clientId",
  "clientID",
  "client",
  "polres",
  "polsek",
  "nrp",
  "nrk",
];

const KEY_PRIORITY: Record<string, number> = {
  rekap: 3,
  users: 3,
  data: 2,
  result: 2,
  records: 2,
  rows: 2,
  response: 1,
};

function isLikelyUserArray(value: any[]): boolean {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  const sample = value.find((item) => item && typeof item === "object");
  if (!sample) {
    return false;
  }

  return USER_KEY_HINTS.some((key) => key in sample);
}

function getKeyPriority(key: string): number {
  const normalized = key.toLowerCase();
  for (const [baseKey, score] of Object.entries(KEY_PRIORITY)) {
    if (normalized.includes(baseKey)) {
      return score;
    }
  }
  return 0;
}

function tryExtractUsersArray(
  value: any,
  hint: number = 0,
  visited: Set<any> = new Set(),
): any[] | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "object") {
    return null;
  }

  if (visited.has(value)) {
    return null;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return hint > 0 ? value : null;
    }

    if (isLikelyUserArray(value) || hint > 1) {
      return value;
    }

    for (const item of value) {
      const nested = tryExtractUsersArray(item, hint, visited);
      if (nested) {
        return nested;
      }
    }

    return null;
  }

  const entries = Object.entries(value as Record<string, any>);
  entries.sort((a, b) => getKeyPriority(b[0]) - getKeyPriority(a[0]));

  for (const [key, child] of entries) {
    const childHint = Math.max(hint, getKeyPriority(key));
    const extracted = tryExtractUsersArray(child, childHint, visited);
    if (extracted) {
      return extracted;
    }
  }

  return null;
}

export function extractRekapLikesUsers(response: any): any[] {
  if (!response) return [];

  const candidatePairs: Array<[any, number]> = [
    [response?.data?.data, 2],
    [response?.data?.rekap, 3],
    [response?.data?.users, 3],
    [response?.data?.records, 2],
    [response?.data?.rows, 2],
    [response?.data?.result, 2],
    [response?.data, 1],
    [response?.rekap, 3],
    [response?.users, 3],
    [response?.records, 2],
    [response?.rows, 2],
    [response?.result, 2],
    [response, 1],
  ];

  for (const [candidate, hint] of candidatePairs) {
    if (Array.isArray(candidate)) {
      return candidate;
    }

    const extracted = tryExtractUsersArray(candidate, hint);
    if (Array.isArray(extracted)) {
      return extracted;
    }
  }

  return [];
}

export default extractRekapLikesUsers;
