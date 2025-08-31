import { getDashboardStats, getRekapLikesIG, getClientProfile, getClientNames } from "@/utils/api";

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

  const profileRes = await getClientProfile(token, clientId);
  const profile = profileRes.client || profileRes.profile || profileRes || {};

  const rekapRes = await getRekapLikesIG(
    token,
    undefined,
    periode,
    date,
    startDate,
    endDate,
    "ditbinmas",
  ).catch(() => ({ data: [] }));

  let users = Array.isArray(rekapRes?.data)
    ? rekapRes.data
    : Array.isArray(rekapRes)
    ? rekapRes
    : [];

  users = users.filter(
    (u: any) =>
      String(
        u.role || u.user_role || u.userRole || u.roleName || "",
      ).toLowerCase() === "ditbinmas",
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
