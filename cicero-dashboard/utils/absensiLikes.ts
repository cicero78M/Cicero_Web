import { getDashboardStats, getRekapLikesIG, getClientProfile, getClientNames, getUserDirectory } from "@/utils/api";

function isException(val: any) {
  return val === true || val === "true" || val === 1 || val === "1";
}

interface FetchParams {
  periode: string;
  date?: string;
  startDate?: string;
  endDate?: string;
}

export async function fetchDitbinmasAbsensiLikes(
  token: string,
  { periode, date, startDate, endDate }: FetchParams,
) {
  const clientId = "DITBINMAS";

  const statsData = await getDashboardStats(
    token,
    periode,
    date,
    startDate,
    endDate,
    clientId,
  );
  const posts =
    statsData.ig_posts ||
    statsData.igPosts ||
    statsData.instagram_posts ||
    [];
  const totalIGPost = Number(statsData.instagramPosts) || 0;

  // gather user directory
  const profileRes = await getClientProfile(token, clientId);
  const profile = profileRes.client || profileRes.profile || profileRes || {};

  const directoryRes = await getUserDirectory(token, clientId);
  const dirData = directoryRes.data || directoryRes.users || directoryRes || [];
  const expectedRole = clientId.toLowerCase();
  const clientIds = Array.from(
    new Set(
      dirData
        .filter(
          (u: any) =>
            String(
              u.role || u.user_role || u.userRole || u.roleName || "",
            ).toLowerCase() === expectedRole,
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

  const nameMap = await getClientNames(
    token,
    users.map((u) =>
      String(u.client_id || u.clientId || u.clientID || u.client || ""),
    ),
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
    if (isException(u.exception) || jumlah >= totalIGPost * 0.5) {
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
