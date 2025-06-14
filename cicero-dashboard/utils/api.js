// utils/api.js
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

if (!process.env.NEXT_PUBLIC_API_URL) {
  console.warn(
    "NEXT_PUBLIC_API_URL is not defined; defaulting to relative '/api' paths"
  );
}

// Handle expired or invalid token by clearing storage and redirecting to login
function handleTokenExpired() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("cicero_token");
    localStorage.removeItem("client_id");
    window.location.href = "/";
  }
}

// Wrapper around fetch that attaches the Authorization header and
// automatically logs the user out when the token is rejected by the backend
async function fetchWithAuth(url, token, options = {}) {
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
export async function getDashboardStats(token) {
  const res = await fetchWithAuth(
    API_BASE_URL + "/api/dashboard/stats",
    token
  );
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
}

// Ambil rekap absensi instagram harian
export async function getRekapLikesIG(token, client_id, periode = "harian") {
  const params = new URLSearchParams({ client_id, periode });
  const url = `${API_BASE_URL}/api/insta/rekap-likes?${params.toString()}`;

  const res = await fetchWithAuth(url, token);
  if (!res.ok) throw new Error("Failed to fetch rekap");
  return res.json();
}

// Ambil profile client berdasarkan token dan client_id
export async function getClientProfile(token, client_id) {
  const params = new URLSearchParams({ client_id });
  const url = `${API_BASE_URL}/api/clients/profile?${params.toString()}`;

  const res = await fetchWithAuth(url, token);
  if (!res.ok) throw new Error("Gagal fetch profile client");
  return res.json();
}

// Ambil daftar user untuk User Directory
export async function getUserDirectory(token, client_id) {
  const url = `${API_BASE_URL}/api/users/list?client_id=${encodeURIComponent(client_id)}`;

  const res = await fetchWithAuth(url, token);
  if (!res.ok) throw new Error("Gagal fetch daftar user");
  return res.json();
}

// Ambil komentar TikTok
export async function getTikTokComments(token) {
  const url = `${API_BASE_URL}/api/tiktok/comments`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) throw new Error("Failed to fetch comments");
  return res.json();
}

export async function getRekapKomentarTiktok(token, client_id, periode = "harian") {
  const params = new URLSearchParams({ client_id, periode });
  const url = `${API_BASE_URL}/api/tiktok/rekap-komentar?${params.toString()}`;

  const res = await fetchWithAuth(url, token);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to fetch rekap komentar tiktok: ${errText}`);
  }
  return res.json();
}

export async function getInstagramPosts(token, client_id) {
  const params = new URLSearchParams({ client_id });
  const url = `${API_BASE_URL}/api/insta/posts?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) throw new Error("Failed to fetch instagram posts");
  return res.json();
}

// Fetch Instagram posts via backend using username (backend handles RapidAPI call)
export async function getInstagramPostsViaBackend(token, username, limit = 10) {
  const params = new URLSearchParams({ username, limit });
  const url = `${API_BASE_URL}/api/insta/rapid-posts?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch instagram posts: ${text}`);
  }
  return res.json();
}

// Fetch Instagram posts for the current month via backend using username
export async function getInstagramPostsThisMonthViaBackend(token, username) {
  const params = new URLSearchParams({ username });
  let url = `${API_BASE_URL}/api/insta/rapid-posts-month?${params.toString()}`;
  const allPosts = [];
  while (url) {
    const res = await fetchWithAuth(url, token);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to fetch instagram posts this month: ${text}`);
    }
    const json = await res.json();
    const posts = json.data || json.posts || json;
    if (Array.isArray(posts)) {
      allPosts.push(...posts);
    }
    const next =
      json.next ||
      json.next_url ||
      (json.pagination && json.pagination.next_url) ||
      (json.paging && json.paging.next);
    if (next) {
      url = next.startsWith("http") ? next : `${API_BASE_URL}${next}`;
    } else {
      url = null;
    }
  }
  return allPosts;
}

// Fetch Instagram profile via backend using username
export async function getInstagramProfileViaBackend(token, username) {
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
export async function getInstagramInfoViaBackend(token, username) {
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
export async function getTiktokProfileViaBackend(token, username) {
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
export async function getTiktokInfoViaBackend(token, username) {
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
export async function getTiktokPostsViaBackend(token, client_id, limit = 10) {
  const params = new URLSearchParams({ client_id, limit });
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
  token,
  username,
  limit = 10
) {
  const params = new URLSearchParams({ username, limit });
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

export async function getTiktokPosts(token, client_id) {
  const params = new URLSearchParams({ client_id });
  const url = `${API_BASE_URL}/api/tiktok/posts?${params.toString()}`;
  const res = await fetchWithAuth(url, token);
  if (!res.ok) throw new Error("Failed to fetch tiktok posts");
  return res.json();
}
