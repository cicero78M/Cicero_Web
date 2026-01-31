import {
  getDashboardStats,
  getRekapLikesIG,
  getClientProfile,
  getClientNames,
  getUserDirectory,
} from "@/utils/api";
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
  const posts =
    statsData.ig_posts ||
    statsData.igPosts ||
    statsData.instagram_posts ||
    [];
  const parsedInstagramPosts = Number(statsData.instagramPosts);
  const fallbackPostCounts = [
    Array.isArray(posts) ? posts.length : undefined,
    Array.isArray(statsData.ig_posts) ? statsData.ig_posts.length : undefined,
    Array.isArray(statsData.igPosts) ? statsData.igPosts.length : undefined,
    Array.isArray(statsData.instagram_posts)
      ? statsData.instagram_posts.length
      : undefined,
  ].filter((count) => typeof count === "number" && count > 0);
  const totalIGPost =
    Number.isFinite(parsedInstagramPosts) && parsedInstagramPosts > 0
      ? parsedInstagramPosts
      : fallbackPostCounts[0] || 0;

  // gather user directory
  const profileRes = await getClientProfile(
    token,
    clientId,
    signal,
    requestContext,
  );
  const profile = profileRes.client || profileRes.profile || profileRes || {};

  const normalizedRole = normalizeDirectoryRole(
    requestContext?.role || clientId,
  );
  const directoryScope = getUserDirectoryFetchScope({
    role: normalizedRole || undefined,
    effectiveClientType: requestContext?.scope,
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
  const expectedRole = normalizedRole || clientId.toLowerCase();
  const clientIds: string[] = Array.from(
    new Set<string>(
      dirData
        .filter(
          (u: any) =>
            normalizeDirectoryRole(
              u.role || u.user_role || u.userRole || u.roleName || "",
            ) === expectedRole,
        )
        .map((u: any) =>
          String(
            u.client_id || u.clientId || u.clientID || u.client || "",
          ),
        )
        .filter(Boolean),
    ),
  );
  if (!clientIds.includes(clientId)) clientIds.push(clientId);

  const rekapAll = await Promise.all(
    clientIds.map((cid) =>
      getRekapLikesIG(
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

  let users = rekapAll.flatMap((res) =>
    Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res)
      ? res
      : [],
  );

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

  const nameMap = await getClientNames(
    token,
    users.map((u) =>
      String(u.client_id || u.clientId || u.clientID || u.client || ""),
    ),
    signal,
    requestContext,
  );

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
