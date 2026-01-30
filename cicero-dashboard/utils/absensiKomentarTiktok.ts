import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientProfile,
  getClientNames,
  getUserDirectory,
} from "@/utils/api";
import { getEngagementStatus } from "@/utils/engagementStatus";
import {
  getUserDirectoryFetchScope,
  normalizeDirectoryRole,
} from "@/utils/userDirectoryScope";

interface FetchParams {
  periode: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

const COMMENT_METRIC_FIELDS = [
  "comments",
  "comment_count",
  "jumlah_komentar",
  "missingComments",
];
const USER_IDENTIFIER_FIELDS = [
  "nrp",
  "nip",
  "nrp_nip",
  "nrpNip",
  "user_id",
  "userId",
  "userID",
  "NRP",
  "NIP",
  "NRP_NIP",
];

function normalizeString(value?: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function hasCommentMetrics(user: any): boolean {
  return COMMENT_METRIC_FIELDS.some((field) => user?.[field] !== undefined);
}

function arrayHasCommentMetrics(users: any[]): boolean {
  return Array.isArray(users) && users.some((user) => hasCommentMetrics(user));
}

function getUserIdentifier(user: any): string {
  return USER_IDENTIFIER_FIELDS.reduce((acc, field) => {
    if (acc) return acc;
    const value = normalizeString(user?.[field]);
    return value || acc;
  }, "");
}

function getMergeKey(user: any): string {
  const identifier = getUserIdentifier(user);
  const label = normalizeString(user?.label || user?.nama || user?.name);
  const title = normalizeString(user?.title);
  const clientId = normalizeString(
    user?.client_id || user?.clientId || user?.clientID || user?.client,
  );
  const key = [clientId, identifier || label || title].filter(Boolean).join("::");

  return key;
}

function mergeUsersByKey(
  primary: any[],
  secondary: any[],
  options: { preferPrimary?: boolean } = {},
) {
  const { preferPrimary = true } = options;
  const secondaryMap = new Map<string, any>();
  const seenKeys = new Set<string>();

  secondary.forEach((user) => {
    const key = getMergeKey(user);
    if (key) secondaryMap.set(key, user);
  });

  const merged = primary.map((user) => {
    const key = getMergeKey(user);
    const match = key ? secondaryMap.get(key) : undefined;

    if (!key || !match) return user;
    seenKeys.add(key);
    return preferPrimary ? { ...match, ...user } : { ...user, ...match };
  });

  secondary.forEach((user) => {
    const key = getMergeKey(user);
    if (key && seenKeys.has(key)) return;
    if (!hasCommentMetrics(user)) return;
    merged.push(user);
  });

  return merged;
}

function extractRekapPayload(payload: any) {
  if (!payload) {
    return { users: [], summary: {} as Record<string, any> };
  }
  if (Array.isArray(payload)) {
    return { users: payload, summary: {} as Record<string, any> };
  }

  const data = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.users)
      ? payload.users
      : [];
  const chartData = Array.isArray(payload.chartData) ? payload.chartData : [];
  const chartHasComments = arrayHasCommentMetrics(chartData);
  const dataHasComments = arrayHasCommentMetrics(data);

  let users: any[] = [];

  if (chartHasComments) {
    users =
      data.length > 0
        ? mergeUsersByKey(chartData, data, { preferPrimary: true })
        : chartData;
  } else if (dataHasComments) {
    users = data;
  } else if (chartData.length > 0) {
    users = chartData;
  }

  const summary = payload.summary ?? payload.rekapSummary ?? payload.resume ?? {};
  return { users, summary };
}

function normalizeUserRecord(user: any) {
  const jumlahKomentarRaw =
    user?.jumlah_komentar ??
    user?.jumlahKomentar ??
    user?.comments ??
    user?.comment_count ??
    user?.commentCount ??
    user?.total_comments ??
    user?.totalComments ??
    user?.total_comment ??
    user?.totalComment ??
    0;
  const normalizedUsername =
    user?.username ??
    user?.tiktok_username ??
    user?.tiktokUsername ??
    user?.user_name ??
    user?.userName ??
    user?.handle ??
    user?.user_handle ??
    "";
  const rawName = user?.nama ?? user?.name ?? user?.full_name ?? user?.fullName;
  const rawLabel = user?.label ?? user?.Label;
  const normalizedName =
    String(rawName ?? "").trim() || String(rawLabel ?? "").trim();
  const normalizedTitle = user?.title ?? user?.pangkat ?? user?.rank ?? "";
  const normalizedDivisi =
    user?.divisi ?? user?.satfung ?? user?.unit ?? user?.division ?? "";
  const normalizedClientId =
    user?.client_id ?? user?.clientId ?? user?.clientID ?? user?.client ?? "";

  return {
    ...user,
    client_id: normalizedClientId || user?.client_id,
    nama: normalizedName || user?.nama,
    title: normalizedTitle || user?.title,
    divisi: normalizedDivisi || user?.divisi,
    username: String(normalizedUsername || user?.username || "").trim(),
    jumlah_komentar: Number(jumlahKomentarRaw) || 0,
  };
}

function deduplicateUsers(users: any[]) {
  const seen = new Set<string>();

  return users.filter((user) => {
    const clientId = normalizeString(
      user?.client_id || user?.clientId || user?.clientID || user?.client,
    );
    const identifier = getUserIdentifier(user);
    const username = normalizeString(user?.username);
    const name = normalizeString(user?.nama || user?.name);
    const key = [clientId, identifier || username || name]
      .filter(Boolean)
      .join("::");

    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchDitbinmasAbsensiKomentarTiktok(
  token: string,
  { periode, date, startDate, endDate }: FetchParams,
  signal?: AbortSignal,
  loginClientId?: string,
  scope: "client" | "all" = "client",
  effectiveClientId: string = "DITBINMAS",
  requestContext?: { role?: string; scope?: string; regional_id?: string },
) {
  const clientId = effectiveClientId || "DITBINMAS";
  const statsData = await getDashboardStats(
    token,
    periode,
    date,
    startDate,
    endDate,
    clientId,
    requestContext,
    signal,
  );
  const statsPayload = (statsData as any)?.data || statsData;
  const totalTiktokPost =
    Number(
      (statsPayload as any)?.ttPosts ??
        (statsPayload as any)?.tiktokPosts ??
        (statsPayload as any)?.totalTiktokPost ??
        (statsPayload as any)?.totalTiktokPosts ??
        (statsPayload as any)?.tt_posts ??
        (statsPayload as any)?.tiktok_posts ??
        0,
    ) || 0;

  const profileRes = await getClientProfile(
    token,
    clientId,
    signal,
    requestContext,
  );
  const profile = profileRes.client || profileRes.profile || profileRes || {};

  const normalizedRole = normalizeDirectoryRole(clientId);
  const directoryScope = getUserDirectoryFetchScope({
    role: normalizedRole || undefined,
  });
  const directoryRes = await getUserDirectory(
    token,
    clientId,
    {
      role: normalizedRole || undefined,
      scope: directoryScope,
      regional_id: requestContext?.regional_id,
    },
    signal,
  );
  const dirData = directoryRes.data || directoryRes.users || directoryRes || [];
  const directoryNameMap = (dirData as any[]).reduce(
    (acc, entry) => {
      const entryClientId = String(
        entry?.client_id ||
          entry?.clientId ||
          entry?.clientID ||
          entry?.client ||
          "",
      );
      if (!entryClientId) return acc;
      const name =
        entry?.nama_client ||
        entry?.client_name ||
        entry?.client ||
        entry?.nama ||
        entry?.name;
      if (name) acc[entryClientId] = name;
      return acc;
    },
    {} as Record<string, string>,
  );

  const expectedRole = clientId.toLowerCase();
  const clientIds: string[] = Array.from(
    new Set<string>(
      (dirData as any[])
        .filter(
          (u: any) =>
            String(
              u.role || u.user_role || u.userRole || u.roleName || "",
            ).toLowerCase() === expectedRole,
        )
        .map((u: any) =>
          String(u.client_id || u.clientId || u.clientID || u.client || ""),
        )
        .filter(Boolean),
    ),
  );
  if (!clientIds.includes(clientId)) clientIds.push(clientId);

  const rekapAll = await Promise.all(
    clientIds.map((cid) =>
      getRekapKomentarTiktok(
        token,
        cid,
        periode,
        date,
        startDate,
        endDate,
        signal,
        requestContext,
      ).catch(() => ({ data: [] })),
    ),
  );

  let users = rekapAll.flatMap((res) => extractRekapPayload(res).users);

  const normalizedLoginClientId = normalizeString(loginClientId);
  if (scope === "client" && normalizedLoginClientId) {
    users = users.filter((u) => {
      const userClientId = normalizeString(
        u.client_id || u.clientId || u.clientID || u.client || "",
      );
      return userClientId === normalizedLoginClientId;
    });
  }

  const nameMap = await getClientNames(
    token,
    users.map((u) =>
      String(u.client_id || u.clientId || u.clientID || u.client || ""),
    ),
    signal,
    requestContext,
  );

  const normalizedUsers = users
    .map((u) => {
      const key = String(
        u.client_id || u.clientId || u.clientID || u.client || "",
      );
      const clientName =
        nameMap[key] ||
        directoryNameMap[key] ||
        u.nama_client ||
        u.client_name ||
        u.client;
      return { ...u, nama_client: clientName, client_name: clientName };
    })
    .map(normalizeUserRecord);
  const uniqueUsers = deduplicateUsers(normalizedUsers);

  const totalUser = uniqueUsers.length;
  let totalSudahKomentar = 0;
  let totalKurangKomentar = 0;
  let totalBelumKomentar = 0;
  let totalTanpaUsername = 0;

  uniqueUsers.forEach((u: any) => {
    const username = String(u.username || "").trim();
    if (!username) {
      totalTanpaUsername += 1;
      return;
    }
    const jumlah = Number(u.jumlah_komentar) || 0;
    const status = getEngagementStatus({
      completed: jumlah,
      totalTarget: totalTiktokPost,
    });

    if (status === "sudah") totalSudahKomentar += 1;
    else if (status === "kurang") totalKurangKomentar += 1;
    else totalBelumKomentar += 1;
  });

  const summary = {
    totalUser,
    totalSudahKomentar,
    totalKurangKomentar,
    totalBelumKomentar,
    totalTanpaUsername,
    totalTiktokPost,
  };

  const clientName =
    profile.nama ||
    profile.nama_client ||
    profile.client_name ||
    profile.client ||
    "";

  return { users: uniqueUsers, summary, clientName };
}

export default fetchDitbinmasAbsensiKomentarTiktok;
