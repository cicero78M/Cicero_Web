import { getRekapLikesIG, getClientProfile } from "@/utils/api";

interface FetchParams {
  periode: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

const REKAP_TOTAL_POST_FIELDS = [
  "totalPosts",
  "totalIGPost",
  "total_ig_post",
];

function normalizeNumber(value?: unknown): number | undefined {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function extractRekapUsers(payload: any): any[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload)) return payload;
  return [];
}

function extractRekapClients(payload: any): any[] {
  if (Array.isArray(payload?.clients)) return payload.clients;
  if (Array.isArray(payload?.directory)) return payload.directory;
  if (Array.isArray(payload?.client_directory)) return payload.client_directory;
  if (Array.isArray(payload?.clientDirectory)) return payload.clientDirectory;
  if (Array.isArray(payload?.meta?.clients)) return payload.meta.clients;
  if (Array.isArray(payload?.metadata?.clients)) return payload.metadata.clients;
  if (Array.isArray(payload?.summary?.clients)) return payload.summary.clients;
  return [];
}

function buildClientNameMap(
  clients: any[],
  users: any[],
): Record<string, string> {
  const entries = new Map<string, string>();
  clients.forEach((entry) => {
    const id = String(
      entry?.client_id ||
        entry?.clientId ||
        entry?.clientID ||
        entry?.client ||
        entry?.id ||
        "",
    );
    if (!id) return;
    const name =
      entry?.nama_client ||
      entry?.client_name ||
      entry?.client ||
      entry?.nama ||
      entry?.name;
    if (name) entries.set(id, name);
  });
  users.forEach((entry) => {
    const id = String(
      entry?.client_id ||
        entry?.clientId ||
        entry?.clientID ||
        entry?.client ||
        "",
    );
    if (!id || entries.has(id)) return;
    const name =
      entry?.nama_client ||
      entry?.client_name ||
      entry?.client ||
      entry?.nama ||
      entry?.name;
    if (name) entries.set(id, name);
  });
  return Object.fromEntries(entries);
}

function getTotalPostsFromRekap(payload: any, posts: any[]): number {
  const summary = payload?.summary ?? {};
  const summaryValue = REKAP_TOTAL_POST_FIELDS.reduce((acc, key) => {
    if (acc !== undefined) return acc;
    return normalizeNumber(summary?.[key]);
  }, undefined as number | undefined);
  const rootValue = REKAP_TOTAL_POST_FIELDS.reduce((acc, key) => {
    if (acc !== undefined) return acc;
    return normalizeNumber(payload?.[key]);
  }, undefined as number | undefined);
  if (summaryValue !== undefined) return summaryValue;
  if (rootValue !== undefined) return rootValue;
  return Array.isArray(posts) ? posts.length : 0;
}

export async function fetchDitbinmasAbsensiLikes(
  token: string,
  { periode, date, startDate, endDate }: FetchParams,
  signal?: AbortSignal,
  loginClientId?: string,
  scope: "client" | "all" = "client",
  effectiveClientId: string = "DITBINMAS",
  requestContext?: { role?: string; scope?: string; regional_id?: string },
) {
  const clientId = effectiveClientId || "DITBINMAS";
  // effectiveClientId allows alternate Ditbinmas-style coordinators (e.g.
  // DITSAMAPTA with role BIDHUMAS) to reuse this aggregator without
  // hard-coding the root Ditbinmas client ID.
  const rekapRes = await getRekapLikesIG(
    token,
    clientId,
    periode,
    date,
    startDate,
    endDate,
    signal,
    requestContext,
  );
  const posts =
    rekapRes?.posts ||
    rekapRes?.ig_posts ||
    rekapRes?.igPosts ||
    rekapRes?.instagram_posts ||
    [];
  const totalIGPost = getTotalPostsFromRekap(rekapRes, posts);

  const profileRes = await getClientProfile(
    token,
    clientId,
    signal,
    requestContext,
  );
  const profile = profileRes.client || profileRes.profile || profileRes || {};

  let users = extractRekapUsers(rekapRes);
  const clients = extractRekapClients(rekapRes);

  const normalizedLoginClientId = String(loginClientId || "")
    .trim()
    .toLowerCase();
  if (scope === "client" && normalizedLoginClientId) {
    const normalizeValue = (value: unknown) =>
      String(value || "")
        .trim()
        .toLowerCase();
    users = users.filter((u) => {
      const userClientId = normalizeValue(
        u.client_id || u.clientId || u.clientID || u.client || "",
      );
      return userClientId === normalizedLoginClientId;
    });
  }
  const nameMap = buildClientNameMap(clients, users);

  users = users.map((u) => {
    const clientName =
      nameMap[
        String(u.client_id || u.clientId || u.clientID || u.client || "")
      ] ||
      u.nama_client ||
      u.client_name ||
      u.client;
    return { ...u, nama_client: clientName, client_name: clientName };
  });

  const totalUser = users.length;
  const isZeroPost = totalIGPost === 0;
  let totalSudahLike = 0;
  let totalKurangLike = 0;
  let totalBelumLike = 0;
  let totalTanpaUsername = 0;

  users.forEach((u: any) => {
    const username = String(u.username || "").trim();
    if (!username) {
      totalTanpaUsername += 1;
      return;
    }
    const jumlah = Number(u.jumlah_like) || 0;
    if (isZeroPost) {
      totalBelumLike += 1;
      return;
    }
    if (jumlah >= totalIGPost) {
      totalSudahLike += 1;
    } else if (jumlah > 0) {
      totalKurangLike += 1;
    } else {
      totalBelumLike += 1;
    }
  });

  const summary = {
    totalUser,
    totalSudahLike,
    totalKurangLike,
    totalBelumLike,
    totalTanpaUsername,
    totalIGPost,
  };

  const clientName =
    profile.nama ||
    profile.nama_client ||
    profile.client_name ||
    profile.client ||
    "";

  return { users, summary, posts, clientName };
}

export default fetchDitbinmasAbsensiLikes;
