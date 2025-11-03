const CLIENT_ID_KEYS = ["client_id", "clientId", "clientID", "client"];

export function normalizeClientId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function extractClientId(record: any): string {
  if (!record || typeof record !== "object") return "";
  for (const key of CLIENT_ID_KEYS) {
    if (key in record) {
      const id = (record as any)[key];
      const normalized = normalizeClientId(id);
      if (normalized) return normalized;
    }
  }
  return "";
}

export function filterUsersByClientId<T = any>(
  users: T[] | undefined | null,
  clientId: unknown,
): T[] {
  const source = Array.isArray(users) ? users : [];
  const normalizedClientId = normalizeClientId(clientId);
  if (!normalizedClientId) {
    return [...source];
  }
  return source.filter((user) => extractClientId(user) === normalizedClientId);
}

export function buildInstagramSummary(
  users: any[] | undefined | null,
  totalIGPost: unknown,
) {
  const list = Array.isArray(users) ? users : [];
  const totalIGPostNumber = Number(totalIGPost) || 0;
  let totalSudahLike = 0;
  let totalKurangLike = 0;
  let totalBelumLike = 0;
  let totalTanpaUsername = 0;

  list.forEach((user) => {
    const username = String(user?.username ?? "").trim();
    if (!username) {
      totalTanpaUsername += 1;
      return;
    }
    const jumlahLike = Number(user?.jumlah_like) || 0;
    if (totalIGPostNumber === 0) {
      totalBelumLike += 1;
      return;
    }
    if (jumlahLike >= totalIGPostNumber) {
      totalSudahLike += 1;
    } else if (jumlahLike > 0) {
      totalKurangLike += 1;
    } else {
      totalBelumLike += 1;
    }
  });

  return {
    totalUser: list.length,
    totalSudahLike,
    totalKurangLike,
    totalBelumLike,
    totalTanpaUsername,
    totalIGPost: totalIGPostNumber,
  };
}
