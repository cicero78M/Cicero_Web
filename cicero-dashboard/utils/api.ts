// utils/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "NEXT_PUBLIC_API_URL is not defined; defaulting to relative '/api' paths"
  );
}

export function normalizeWhatsapp(whatsapp: string): string {
  const trimmed = whatsapp.trim();
  return trimmed.startsWith("0") ? `62${trimmed.slice(1)}` : trimmed;
}

type ApiMessageResponse = {
  success: boolean;
  message: string;
};

function extractResponseMessage(data: any, fallback: string): string {
  if (!data) return fallback;

  if (typeof data === "string") {
    return data.trim() || fallback;
  }

  const candidates: unknown[] = [
    data.message,
    data.detail,
    data.error,
    data.status,
  ];

  if (Array.isArray((data as any).errors)) {
    candidates.push((data as any).errors[0]);
  } else if ((data as any).errors) {
    candidates.push((data as any).errors);
  }

  const message = candidates.find(
    (entry) => typeof entry === "string" && entry.trim().length > 0,
  ) as string | undefined;

  return message?.trim() || fallback;
}

export type DashboardPasswordResetRequestPayload = {
  username: string;
  contact: string;
};

export type DashboardPasswordResetConfirmPayload = {
  token: string;
  password: string;
  confirmPassword?: string;
  password_confirmation?: string;
};

async function postMessagePayload(
  endpoint: string,
  payload: Record<string, any>,
  signal?: AbortSignal,
): Promise<ApiMessageResponse> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (error) {
    data = null;
  }

  const success = data?.success ?? res.ok;
  const message =
    data?.message ||
    data?.status ||
    data?.detail ||
    (success ? "Permintaan berhasil diproses." : "Permintaan gagal diproses.");

  if (!res.ok) {
    return { success: false, message };
  }

  return { success: Boolean(success), message };
}

export async function requestDashboardPasswordReset(
  payload: DashboardPasswordResetRequestPayload,
  signal?: AbortSignal,
): Promise<ApiMessageResponse> {
  return postMessagePayload(
    `${API_BASE_URL}/api/auth/dashboard-password-reset/request`,
    { username: payload.username, contact: payload.contact },
    signal,
  );
}

export async function confirmDashboardPasswordReset(
  payload: DashboardPasswordResetConfirmPayload,
  signal?: AbortSignal,
): Promise<ApiMessageResponse> {
  const confirmation =
    payload.confirmPassword ?? payload.password_confirmation ?? payload.password;
  const body = {
    token: payload.token,
    password: payload.password,
    confirmPassword: confirmation,
    password_confirmation: confirmation,
  };
  return postMessagePayload(
    `${API_BASE_URL}/api/auth/dashboard-password-reset/confirm`,
    body,
    signal,
  );
}

// Handle expired or invalid token by clearing storage and redirecting to login
function handleTokenExpired(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("cicero_token");
    localStorage.removeItem("client_id");
    window.location.href = "/";
  }
}

// Wrapper around fetch that attaches the Authorization header and
// automatically logs the user out when the token is rejected by the backend
async function fetchWithAuth(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    handleTokenExpired();
    throw new Error("Unauthorized");
  }
  return res;
}
export async function getDashboardStats(
  token: string,
  periode?: string,
  tanggal?: string,
  startDate?: string,
  endDate?: string,
  client_id?: string,
  signal?: AbortSignal,
): Promise<any> {
  const params = new URLSearchParams();
  if (periode) params.append("periode", periode);
  if (tanggal) params.append("tanggal", tanggal);
  if (startDate) params.append("tanggal_mulai", startDate);
  if (endDate) params.append("tanggal_selesai", endDate);
  if (client_id) params.append("client_id", client_id);
  const url = `${API_BASE_URL}/api/dashboard/stats${
    params.toString() ? `?${params.toString()}` : ""
  }`;
  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) throw new Error("Failed to fetch stats");
  const json = await res.json();
  const raw: any = json.data || json;
  const clientId = raw.client_id ?? raw.clientId ?? raw.clientID ?? null;
  const igPostsRaw =
    raw.instagramPosts ??
    raw.instagram_posts ??
    raw.igPosts ??
    raw.ig_posts ??
    0;
  const instagramPosts = Array.isArray(igPostsRaw)
    ? igPostsRaw.length
    : Number(igPostsRaw) || 0;
  return { ...raw, client_id: clientId, instagramPosts };
}

// Ambil rekap absensi instagram harian
export async function getRekapLikesIG(
  token: string,
  client_id: string,
  periode: string = "harian",
  tanggal?: string,
  startDate?: string,
  endDate?: string,
  signal?: AbortSignal,
): Promise<any> {
  const params = new URLSearchParams({ client_id, periode });
  if (tanggal) params.append("tanggal", tanggal);
  if (startDate) params.append("tanggal_mulai", startDate);
  if (endDate) params.append("tanggal_selesai", endDate);
  const url = `${API_BASE_URL}/api/insta/rekap-likes?${params.toString()}`;

  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) throw new Error("Failed to fetch rekap");
  return res.json();
}

// Ambil profile client berdasarkan token dan client_id
export async function getClientProfile(
  token: string,
  client_id: string,
  signal?: AbortSignal,
): Promise<any> {
  const params = new URLSearchParams({ client_id });
  const url = `${API_BASE_URL}/api/clients/profile?${params.toString()}`;

  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) throw new Error("Gagal fetch profile client");
  const json = await res.json();
  return (
    json?.data?.client ||
    json?.data ||
    json?.client ||
    json?.profile ||
    json ||
    {}
  );
}

// Ambil nama-nama client berdasarkan daftar client_id
export async function getClientNames(
  token: string,
  clientIds: string[],
  signal?: AbortSignal,
): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(clientIds.filter(Boolean)));
  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const profile = await getClientProfile(token, id, signal);
        const name =
          profile.nama ||
          profile.nama_client ||
          profile.client_name ||
          profile.client ||
          id;
        return [id, name] as [string, string];
      } catch {
        return [id, id] as [string, string];
      }
    }),
  );
  return Object.fromEntries(entries);
}

// Ambil daftar user untuk User Directory
export async function getUserDirectory(
  token: string,
  client_id: string,
  signal?: AbortSignal,
): Promise<any> {
  const url = `${API_BASE_URL}/api/users/list?client_id=${encodeURIComponent(client_id)}`;

  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) throw new Error("Gagal fetch daftar user");
  return res.json();
}

// Tambah user baru ke directory
export async function createUser(
  token: string,
  data: {
    client_id: string;
    nama: string;
    title: string;
    user_id: string;
    divisi: string;
  },
): Promise<any> {
  const url = `${API_BASE_URL}/api/users/create`;
  const res = await fetchWithAuth(url, token, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal menambah user: ${text}`);
  }
  return res.json();
}

// Perbarui data user yang ada
export async function updateUser(
  token: string,
  userId: string,
  data: Record<string, any>,
): Promise<any> {
  const url = `${API_BASE_URL}/api/users/${encodeURIComponent(userId)}`;
  const res = await fetchWithAuth(url, token, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal memperbarui user: ${text}`);
  }
  return res.json();
}

// Perbarui relasi user_roles ketika NRP/NIP berubah
export async function updateUserRoles(
  token: string,
  oldUserId: string,
  newUserId: string,
): Promise<any> {
  const url = `${API_BASE_URL}/api/user_roles/update`;
  const res = await fetchWithAuth(url, token, {
    method: "PUT",
    body: JSON.stringify({ old_user_id: oldUserId, new_user_id: newUserId }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gagal memperbarui user_roles: ${text}`);
  }
  return res.json();
}

// Ambil komentar TikTok
export async function getTikTokComments(token: string): Promise<any> {
  const url = `${API_BASE_URL}/api/tiktok/comments`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function getRekapKomentarTiktok(
  token: string,
  client_id: string,
  periode: string = "harian",
  tanggal?: string,
  startDate?: string,
  endDate?: string,
  signal?: AbortSignal,
): Promise<any> {
  const params = new URLSearchParams({ client_id, periode });
  if (tanggal) params.append("tanggal", tanggal);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  const url = `${API_BASE_URL}/api/tiktok/rekap-komentar?${params.toString()}`;

  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch rekap komentar tiktok: ${errText}`);
  }
  return res.json();
}

// Ambil rekap amplifikasi link konten
export async function getRekapAmplify(
  token: string,
  client_id: string,
  periode: string = "harian",
  tanggal?: string,
  startDate?: string,
  endDate?: string
): Promise<any> {
  const params = new URLSearchParams({ client_id, periode });
  if (tanggal) params.append("tanggal", tanggal);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  const url = `${API_BASE_URL}/api/amplify/rekap?${params.toString()}`;

  const res = await fetchWithAuth(url, token);
  if (!res.ok) throw new Error("Failed to fetch rekap amplifikasi");
  return res.json();
}

export async function getInstagramPosts(
  token: string,
  client_id: string,
  options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    signal?: AbortSignal;
  } = {},
): Promise<any> {
  const params = new URLSearchParams({ client_id });
  if (options.startDate) {
    params.append("start_date", options.startDate);
  }
  if (options.endDate) {
    params.append("end_date", options.endDate);
  }
  if (typeof options.limit === "number" && Number.isFinite(options.limit)) {
    params.append("limit", String(options.limit));
  }
  const query = params.toString();
  const url = `${API_BASE_URL}/api/insta/posts${query ? `?${query}` : ""}`;
  const res = await fetchWithAuth(url, token, { signal: options.signal });
  if (!res.ok) throw new Error("Failed to fetch instagram posts");
  return res.json();
}

// Fetch Instagram posts via backend using username (backend handles RapidAPI call)
export async function getInstagramPostsViaBackend(
  token: string,
  username: string,
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<any> {
  const params = new URLSearchParams({ username, limit: String(limit) });
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  const url = `${API_BASE_URL}/api/insta/rapid-posts?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch instagram posts: ${text}`);
  }
  return res.json();
}

// Fetch Instagram posts for the current month via backend using username
export async function getInstagramPostsThisMonthViaBackend(
  token: string,
  username: string
): Promise<any> {
  const params = new URLSearchParams({ username });
  const url = `${API_BASE_URL}/api/insta/rapid-posts-month?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch instagram posts this month: ${text}`);
  }
  return res.json();
}

// Fetch Instagram profile via backend using username
export async function getInstagramProfileViaBackend(token: string, username: string): Promise<any> {
  const params = new URLSearchParams({ username });
  const url = `${API_BASE_URL}/api/insta/rapid-profile?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch instagram profile: ${text}`);
  }
  const json = await res.json();
  const profile = json.data || json.profile || json;

  // Normalise fields so the frontend can use a consistent structure
  return {
    username: profile.username || profile.user_name || "",
    followers: profile.followers || profile.follower_count || 0,
    following: profile.following || profile.following_count || 0,
    bio: profile.bio || profile.biography || "",
    ...profile,
  };
}

// Fetch additional Instagram info via backend using username
export async function getInstagramInfoViaBackend(token: string, username: string): Promise<any> {
  const params = new URLSearchParams({ username });
  const url = `${API_BASE_URL}/api/insta/rapid-info?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch instagram info: ${text}`);
  }
  return res.json();
}


// Fetch TikTok profile via backend using username
export async function getTiktokProfileViaBackend(token: string, username: string): Promise<any> {
  const params = new URLSearchParams({ username });
  const url = `${API_BASE_URL}/api/tiktok/rapid-profile?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch tiktok profile: ${text}`);
  }
  const json = await res.json();
  const raw = json.data || json.profile || json;
  const userInfo = raw.userInfo || raw;
  const user = userInfo.user || raw.user || {};
  const stats = userInfo.stats || raw.stats || {};
  

  return {
    username:
      user.uniqueId ||
      user.username ||
      user.user_name ||
      raw.username ||
      "",
    followers:
      stats.followerCount ||
      stats.followers ||
      stats.follower_count ||
      raw.followers ||
      raw.follower_count ||
      0,
    following:
      stats.followingCount ||
      stats.following ||
      stats.following_count ||
      raw.following ||
      raw.following_count ||
      0,
    bio: user.signature || raw.bio || raw.signature || "",
    avatar: user.avatarLarger || user.avatarMedium || raw.avatar || "",
    ...raw,
    ...userInfo,
    ...user,
    ...stats,
  };
}

// Fetch additional TikTok info via backend using username
export async function getTiktokInfoViaBackend(token: string, username: string): Promise<any> {
  const params = new URLSearchParams({ username });
  const url = `${API_BASE_URL}/api/tiktok/rapid-info?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch tiktok info: ${text}`);
  }
  const json = await res.json();
  const raw = json.data || json.info || json;
  if (raw.userInfo) {
    const user = raw.userInfo.user || {};
    const stats = raw.userInfo.stats || {};
    return {
      full_name: user.nickname || raw.full_name,
      id: user.id || raw.id,
      biography: user.signature || raw.biography,
      is_verified: user.verified ?? raw.is_verified,
      video_count: stats.videoCount ?? raw.video_count,
      heart_count: stats.heart || stats.heartCount || raw.heart_count,
      follower_count: stats.followerCount ?? raw.follower_count,
      following_count: stats.followingCount ?? raw.following_count,
      hd_profile_pic_url_info: { url: user.avatarLarger },
      user,
      stats,
      ...raw,
    };
  }
  return raw;
}

// Fetch TikTok posts via backend using username
export async function getTiktokPostsViaBackend(
  token: string,
  client_id: string,
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<any> {
  const params = new URLSearchParams({ client_id, limit: String(limit) });
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  const url = `${API_BASE_URL}/api/tiktok/rapid-posts?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch tiktok posts: ${text}`);
  }
  const json = await res.json();
  let posts = json.data || json.posts || json;
  if (Array.isArray(posts)) {
    posts = posts.map((p) => ({
      id: p.id || p.post_id || p.aweme_id || p.video_id,
      caption: p.caption || p.desc || "",
      thumbnail:
        p.thumbnail ||
        p.cover ||
        p.video?.cover ||
        p.video?.originCover ||
        "",
      like_count: p.like_count ?? p.stats?.diggCount ?? p.diggCount ?? 0,
      comment_count:
        p.comment_count ?? p.stats?.commentCount ?? p.commentCount ?? 0,
      share_count: p.share_count ?? p.stats?.shareCount ?? p.shareCount ?? 0,
      view_count: p.view_count ?? p.stats?.playCount ?? p.playCount ?? 0,
      created_at:
        p.created_at ||
        (p.createTime ? new Date(p.createTime * 1000).toISOString() : ""),
      ...p,
    }));
  }
  return posts;
}

// Fetch TikTok posts via backend using username (for compare feature)
export async function getTiktokPostsByUsernameViaBackend(
  token: string,
  username: string,
  limit: number = 10
): Promise<any> {
  const params = new URLSearchParams({ username, limit: String(limit) });
  const url = `${API_BASE_URL}/api/tiktok/rapid-posts?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch tiktok posts: ${text}`);
  }
  const json = await res.json();
  let posts = json.data || json.posts || json;
  if (Array.isArray(posts)) {
    posts = posts.map((p) => ({
      id: p.id || p.post_id || p.aweme_id || p.video_id,
      caption: p.caption || p.desc || "",
      thumbnail:
        p.thumbnail ||
        p.cover ||
        p.video?.cover ||
        p.video?.originCover ||
        "",
      like_count: p.like_count ?? p.stats?.diggCount ?? p.diggCount ?? 0,
      comment_count:
        p.comment_count ?? p.stats?.commentCount ?? p.commentCount ?? 0,
      share_count: p.share_count ?? p.stats?.shareCount ?? p.shareCount ?? 0,
      view_count: p.view_count ?? p.stats?.playCount ?? p.playCount ?? 0,
      created_at:
        p.created_at ||
        (p.createTime ? new Date(p.createTime * 1000).toISOString() : ""),
      ...p,
    }));
  }
  return posts;
}

export async function getTiktokPosts(
  token: string,
  client_id: string,
  options: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    signal?: AbortSignal;
  } = {},
): Promise<any> {
  const params = new URLSearchParams({ client_id });
  if (options.startDate) {
    params.append("start_date", options.startDate);
  }
  if (options.endDate) {
    params.append("end_date", options.endDate);
  }
  if (typeof options.limit === "number" && Number.isFinite(options.limit)) {
    params.append("limit", String(options.limit));
  }
  const query = params.toString();
  const url = `${API_BASE_URL}/api/tiktok/posts${query ? `?${query}` : ""}`;
  const res = await fetchWithAuth(url, token, { signal: options.signal });
  if (!res.ok) throw new Error("Failed to fetch tiktok posts");
  return res.json();
}

// === Claim & User Update without auth token ===

// Fetch user data by NRP without requiring auth
export async function getUserById(nrp: string): Promise<any> {
  const url = `${API_BASE_URL}/api/users/${encodeURIComponent(nrp)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

// Fetch user data in claim flow after OTP verification
export async function getClaimUserData(
  nrp: string,
  email: string,
): Promise<any> {
  const url = `${API_BASE_URL}/api/claim/user-data`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ nrp, email }),
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

export type ClaimEmailValidationResponse = {
  status: string;
  success: boolean;
  message?: string;
};

// Validate email deliverability status before requesting an OTP
export async function checkClaimEmailStatus(
  email: string,
): Promise<ClaimEmailValidationResponse> {
  const url = `${API_BASE_URL}/api/claim/validate-email`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (error) {
    data = null;
  }

  const status =
    data?.status ||
    data?.data?.status ||
    (res.ok ? "deliverable" : "unknown");
  const message = extractResponseMessage(
    data,
    "Failed to validate email. Please check the address.",
  );

  if (!res.ok) {
    throw new Error(message);
  }

  return {
    status,
    success: data?.success ?? res.ok,
    message: message || undefined,
  };
}

// Request OTP to be sent via email
export async function requestClaimOtp(
  nrp: string,
  email: string,
): Promise<any> {
  const url = `${API_BASE_URL}/api/claim/request-otp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ nrp, email }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (error) {
    data = null;
  }

  const message = extractResponseMessage(
    data,
    "Gagal mengirim OTP. Silakan periksa kembali NRP dan email kamu.",
  );

  if (!res.ok) {
    throw new Error(message);
  }

  const success = data?.success ?? res.ok;
  return { ...data, success, message };
}

// Verify OTP provided by user
export async function verifyClaimOtp(
  nrp: string,
  email: string,
  otp: string,
): Promise<any> {
  const url = `${API_BASE_URL}/api/claim/verify-otp`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ nrp, email, otp }),
  });
  if (!res.ok) throw new Error("Failed to verify OTP");
  const data = await res.json();
  return { ...data, verified: data.verified ?? data.data?.verified };
}

// Update user data after OTP verification
export async function updateUserViaClaim(
  data: {
    nrp: string;
    email: string;
    nama?: string;
    title?: string;
    divisi?: string;
    jabatan?: string;
    desa?: string;
    insta?: string;
    tiktok?: string;
  },
): Promise<any> {
  const url = `${API_BASE_URL}/api/claim/update`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const defaultMessage = "Failed to update user";
    let message = defaultMessage;
    const contentType = res.headers?.get?.("content-type") ?? "";
    try {
      if (contentType.includes("application/json")) {
        const errorJson = await res.json();
        if (errorJson && typeof errorJson === "object") {
          const candidates: unknown[] = [
            errorJson.message,
            errorJson.error,
            errorJson.detail,
            errorJson.status,
            errorJson.data?.message,
          ];
          if (Array.isArray((errorJson as any).errors)) {
            candidates.push((errorJson as any).errors[0]);
          } else if (typeof (errorJson as any).errors === "string") {
            candidates.push((errorJson as any).errors);
          }
          const picked = candidates.find(
            (msg): msg is string => typeof msg === "string" && msg.trim().length > 0,
          );
          if (picked) {
            message = picked.trim();
          }
        } else if (typeof errorJson === "string") {
          message = errorJson.trim() || defaultMessage;
        }
      } else if (typeof res.text === "function") {
        const text = await res.text();
        if (text && typeof text === "string") {
          message = text.trim() || defaultMessage;
        }
      }
    } catch (err) {
      // Ignore parsing errors and fall back to default message
    }
    throw new Error(message);
  }
  return res.json();
}

