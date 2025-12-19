// utils/api.ts
let cachedApiBaseUrl: string | null = null;
let hasLoggedMissingApiBase = false;

export function getApiBaseUrl(): string {
  if (cachedApiBaseUrl) return cachedApiBaseUrl;

  const rawValue = (process.env.NEXT_PUBLIC_API_URL || "").trim();
  if (!rawValue) {
    const message =
      "NEXT_PUBLIC_API_URL belum disetel. Tambahkan ke .env.local agar dashboard terhubung ke backend Cicero (mis. https://api.cicero.example.com).";
    if (!hasLoggedMissingApiBase) {
      console.error(message);
      hasLoggedMissingApiBase = true;
    }
    throw new Error(message);
  }

  cachedApiBaseUrl = rawValue.replace(/\/$/, "");
  return cachedApiBaseUrl;
}

function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
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
    buildApiUrl("/api/auth/dashboard-password-reset/request"),
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
    buildApiUrl("/api/auth/dashboard-password-reset/confirm"),
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

export type SatbinmasFilterParams = {
  periode?: string;
  tanggal?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  startDate?: string;
  endDate?: string;
  platform?: string;
  clientId?: string;
  client_id?: string;
};

export type SatbinmasAccountCoverage = {
  clientId: string;
  polres: string;
  platform: string;
  accountHandle: string;
  status: string;
  followers: number;
  lastActive: string | null;
};

export type SatbinmasActivityItem = {
  date: string;
  platform: string;
  postCount: number;
  engagementCount: number;
  clientId?: string;
  polres?: string;
};

export type SatbinmasEngagementItem = {
  contentId: string;
  platform: string;
  polres: string;
  caption: string;
  postedAt: string | null;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  hashtags: string[];
  mentions: string[];
};

export type SatbinmasHashtagItem = {
  hashtag: string;
  count: number;
  platform: string;
  clientId?: string;
};

export type TaskFilterParams = {
  periode?: string;
  status?: string;
  clientId?: string;
  client_id?: string;
  userId?: string;
  user_id?: string;
  nrp?: string;
  startDate?: string;
  endDate?: string;
  tanggal_mulai?: string;
  tanggal_selesai?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
};

export type TaskItem = {
  id: string;
  title: string;
  description: string;
  status: string;
  taskType: string;
  clientId: string;
  clientName: string;
  assignedTo: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  metadata?: Record<string, any> | null;
};

export type InstaPost = {
  id: string;
  caption: string;
  imageUrl: string;
  createdAt: Date;
  taskNumber: number;
  isVideo: boolean;
  videoUrl: string;
  sourceUrl: string;
  carouselImages: string[];
  isCarousel: boolean;
  downloaded: boolean;
  reported: boolean;
};

export const REPOSTER_DOWNLOADED_POSTS_KEY = "reposter_downloaded_posts";
export const REPOSTER_REPORTED_POSTS_KEY = "reposter_reported_posts";

export type TaskListResponse = {
  tasks: TaskItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  filters: Record<string, any>;
};

export type SatbinmasSummary = {
  totals: {
    accounts: number;
    active: number;
    dormant: number;
    followers: number;
  };
  coverage: SatbinmasAccountCoverage[];
};

export type SatbinmasAccountDetail = {
  id: string;
  clientId: string;
  platform: string;
  handle: string;
  status: string;
  followers: number;
  lastActive: string | null;
  polres?: string;
};

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

function ensureNumber(value: unknown, fallback: number = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function ensureString(value: unknown, fallback: string = ""): string {
  return typeof value === "string" ? value : fallback;
}

function ensureArray<T>(value: unknown, mapper: (entry: any) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => mapper(item));
}

function parseLocalTimestamp(value: string): Date | null {
  if (!value) return null;
  if (value.includes("T")) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const match =
    value.match(
      /(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/,
    );
  if (!match) return null;
  const [, year, month, day, hour, minute, second] = match;
  const parsed = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second ?? 0),
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameLocalDay(target: Date, compareTo: Date): boolean {
  return (
    target.getFullYear() === compareTo.getFullYear() &&
    target.getMonth() === compareTo.getMonth() &&
    target.getDate() === compareTo.getDate()
  );
}

function readLocalIdSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem(key);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((entry) => typeof entry === "string"));
    }
  } catch {
    const fallback = raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    return new Set(fallback);
  }
  return new Set();
}

function buildSatbinmasQuery(filters: SatbinmasFilterParams): string {
  const params = new URLSearchParams();
  if (filters.periode) params.append("periode", filters.periode);
  if (filters.tanggal) params.append("tanggal", filters.tanggal);
  const startDate = filters.tanggal_mulai || filters.startDate;
  const endDate = filters.tanggal_selesai || filters.endDate;
  if (startDate) params.append("tanggal_mulai", startDate);
  if (endDate) params.append("tanggal_selesai", endDate);
  if (filters.platform) params.append("platform", filters.platform);
  const clientId = filters.clientId || filters.client_id;
  if (clientId) params.append("client_id", clientId);
  const query = params.toString();
  return query ? `?${query}` : "";
}

function buildTaskQuery(filters: TaskFilterParams): string {
  const params = new URLSearchParams();
  if (filters.periode) params.append("periode", filters.periode);
  if (filters.status) params.append("status", filters.status);
  const clientId = filters.clientId || filters.client_id;
  if (clientId) params.append("client_id", clientId);
  const userId = filters.userId || filters.user_id || filters.nrp;
  if (userId) params.append("user_id", userId);
  const startDate =
    filters.startDate || filters.start_date || filters.tanggal_mulai;
  const endDate = filters.endDate || filters.end_date || filters.tanggal_selesai;
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);
  if (typeof filters.limit === "number") {
    params.append("limit", String(filters.limit));
  }
  if (typeof filters.offset === "number") {
    params.append("offset", String(filters.offset));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

function normalizeTaskEntry(entry: any): TaskItem {
  return {
    id:
      ensureString(entry?.id) ||
      ensureString(entry?.task_id) ||
      ensureString(entry?.uuid),
    title:
      ensureString(entry?.title) ||
      ensureString(entry?.name) ||
      ensureString(entry?.task_name),
    description:
      ensureString(entry?.description) ||
      ensureString(entry?.detail) ||
      ensureString(entry?.notes),
    status:
      ensureString(entry?.status) ||
      ensureString(entry?.state) ||
      "unknown",
    taskType:
      ensureString(entry?.task_type) ||
      ensureString(entry?.type) ||
      ensureString(entry?.category),
    clientId:
      ensureString(entry?.client_id) ||
      ensureString(entry?.clientId) ||
      ensureString(entry?.polres_id),
    clientName:
      ensureString(entry?.client_name) ||
      ensureString(entry?.clientName) ||
      ensureString(entry?.polres_name),
    assignedTo:
      ensureString(entry?.assigned_to) ||
      ensureString(entry?.user_id) ||
      ensureString(entry?.nrp),
    dueDate:
      ensureString(entry?.due_date) ||
      ensureString(entry?.deadline) ||
      ensureString(entry?.dueAt),
    periodStart:
      ensureString(entry?.period_start) ||
      ensureString(entry?.start_date) ||
      ensureString(entry?.tanggal_mulai),
    periodEnd:
      ensureString(entry?.period_end) ||
      ensureString(entry?.end_date) ||
      ensureString(entry?.tanggal_selesai),
    metadata: entry?.metadata ?? entry?.meta ?? null,
  };
}

function extractCarouselImages(entry: any): string[] {
  const rawCarousel =
    entry?.carousel ??
    entry?.carousel_images ??
    entry?.children ??
    entry?.resources ??
    entry?.slides ??
    entry?.items ??
    [];
  return ensureArray(rawCarousel, (item) => {
    if (typeof item === "string") return item;
    return (
      ensureString(item?.image_url) ||
      ensureString(item?.thumbnail_url) ||
      ensureString(item?.display_url) ||
      ensureString(item?.url)
    );
  }).filter(Boolean);
}

function normalizeAccountCoverageEntry(entry: any): SatbinmasAccountCoverage {
  return {
    clientId:
      ensureString(entry?.client_id) ||
      ensureString(entry?.clientId) ||
      ensureString(entry?.polres_id),
    polres:
      ensureString(entry?.polres) ||
      ensureString(entry?.polres_name) ||
      ensureString(entry?.client_name),
    platform: ensureString(entry?.platform),
    accountHandle:
      ensureString(entry?.handle) ||
      ensureString(entry?.account_handle) ||
      ensureString(entry?.username),
    status:
      ensureString(entry?.status) ||
      ensureString(entry?.account_status) ||
      ensureString(entry?.kategori) ||
      "Tidak diketahui",
    followers: ensureNumber(entry?.followers ?? entry?.follower ?? entry?.total_followers),
    lastActive:
      ensureString(entry?.lastActive) ||
      ensureString(entry?.last_active) ||
      ensureString(entry?.last_post_date) ||
      null,
  };
}

export async function getSatbinmasSummary(
  token: string,
  filters: SatbinmasFilterParams = {},
  signal?: AbortSignal,
): Promise<SatbinmasSummary> {
  const query = buildSatbinmasQuery(filters);
  const url = `${buildApiUrl("/api/satbinmas-official/summary")}${query}`;
  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch Satbinmas summary");
  }
  const json = await res.json();
  const payload = json?.data ?? json ?? {};
  const totals = payload?.totals ?? payload?.summary ?? payload ?? {};

  return {
    totals: {
      accounts: ensureNumber(
        totals.accounts ?? totals.total_accounts ?? payload?.total_accounts,
      ),
      active: ensureNumber(totals.active ?? totals.active_accounts),
      dormant: ensureNumber(totals.dormant ?? totals.dormant_accounts),
      followers: ensureNumber(
        totals.followers ?? totals.total_followers ?? payload?.followers,
      ),
    },
    coverage: ensureArray(
      payload.coverage ?? payload.accounts ?? payload.data,
      normalizeAccountCoverageEntry,
    ),
  };
}

export async function getSatbinmasActivity(
  token: string,
  filters: SatbinmasFilterParams = {},
  signal?: AbortSignal,
): Promise<SatbinmasActivityItem[]> {
  const query = buildSatbinmasQuery(filters);
  const url = `${buildApiUrl("/api/satbinmas-official/activity")}${query}`;
  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch Satbinmas activity");
  }
  const json = await res.json();
  const payload = json?.data ?? json ?? [];

  return ensureArray(payload, (entry) => ({
    date: ensureString(entry?.date) || ensureString(entry?.tanggal),
    platform: ensureString(entry?.platform),
    postCount: ensureNumber(entry?.posts ?? entry?.post_count ?? entry?.count),
    engagementCount: ensureNumber(
      entry?.engagement ?? entry?.total_engagement ?? entry?.engagement_count,
    ),
    clientId: ensureString(entry?.client_id || entry?.clientId),
    polres: ensureString(entry?.polres) || ensureString(entry?.polres_name),
  }));
}

export async function getSatbinmasEngagement(
  token: string,
  filters: SatbinmasFilterParams = {},
  signal?: AbortSignal,
): Promise<SatbinmasEngagementItem[]> {
  const query = buildSatbinmasQuery(filters);
  const url = `${buildApiUrl("/api/satbinmas-official/engagement")}${query}`;
  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch Satbinmas engagement");
  }
  const json = await res.json();
  const payload = json?.data ?? json ?? [];

  return ensureArray(payload, (entry) => ({
    contentId:
      ensureString(entry?.content_id) ||
      ensureString(entry?.id) ||
      ensureString(entry?.post_id),
    platform: ensureString(entry?.platform),
    polres: ensureString(entry?.polres) || ensureString(entry?.client_name),
    caption: ensureString(entry?.caption) || ensureString(entry?.title),
    postedAt:
      ensureString(entry?.posted_at) ||
      ensureString(entry?.post_date) ||
      ensureString(entry?.created_at) ||
      null,
    likes: ensureNumber(entry?.likes ?? entry?.like_count),
    comments: ensureNumber(entry?.comments ?? entry?.comment_count),
    shares: ensureNumber(entry?.shares ?? entry?.share_count),
    views: ensureNumber(entry?.views ?? entry?.view_count ?? entry?.impressions),
    hashtags: Array.isArray(entry?.hashtags) ? entry.hashtags : [],
    mentions: Array.isArray(entry?.mentions) ? entry.mentions : [],
  }));
}

export async function getSatbinmasHashtags(
  token: string,
  filters: SatbinmasFilterParams = {},
  signal?: AbortSignal,
): Promise<SatbinmasHashtagItem[]> {
  const query = buildSatbinmasQuery(filters);
  const url = `${buildApiUrl("/api/satbinmas-official/hashtags")}${query}`;
  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch Satbinmas hashtags");
  }
  const json = await res.json();
  const payload = json?.data ?? json ?? [];

  return ensureArray(payload, (entry) => ({
    hashtag: ensureString(entry?.hashtag) || ensureString(entry?.tag),
    count: ensureNumber(entry?.count ?? entry?.usage ?? entry?.total),
    platform: ensureString(entry?.platform),
    clientId: ensureString(entry?.client_id || entry?.clientId),
  }));
}

export async function getSatbinmasAccounts(
  token: string,
  clientId: string,
  filters: SatbinmasFilterParams = {},
  signal?: AbortSignal,
): Promise<SatbinmasAccountDetail[]> {
  const query = buildSatbinmasQuery({ ...filters, clientId });
  const url = `${buildApiUrl(
    `/api/satbinmas-official/accounts/${encodeURIComponent(clientId)}`,
  )}${query}`;
  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch Satbinmas accounts");
  }
  const json = await res.json();
  const payload = json?.data ?? json ?? [];

  return ensureArray(payload, (entry) => ({
    id: ensureString(entry?.id) || ensureString(entry?.account_id),
    clientId: ensureString(entry?.client_id || entry?.clientId || clientId),
    platform: ensureString(entry?.platform),
    handle:
      ensureString(entry?.handle) ||
      ensureString(entry?.account_handle) ||
      ensureString(entry?.username),
    status:
      ensureString(entry?.status) ||
      ensureString(entry?.account_status) ||
      ensureString(entry?.kategori) ||
      "Tidak diketahui",
    followers: ensureNumber(entry?.followers ?? entry?.total_followers),
    lastActive:
      ensureString(entry?.lastActive) ||
      ensureString(entry?.last_active) ||
      ensureString(entry?.last_post_date) ||
      null,
    polres: ensureString(entry?.polres) || ensureString(entry?.polres_name),
  }));
}

async function getTaskList(
  token: string,
  endpoint: string,
  filters: TaskFilterParams = {},
  signal?: AbortSignal,
): Promise<TaskListResponse> {
  const query = buildTaskQuery(filters);
  const url = `${buildApiUrl(endpoint)}${query}`;
  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to fetch tasks");
  }
  const json = await res.json();
  const payload = json?.data ?? json ?? {};
  const pagination = payload?.pagination ?? payload?.meta ?? {};

  return {
    tasks: ensureArray(payload?.tasks ?? payload?.data ?? [], normalizeTaskEntry),
    pagination: {
      total: ensureNumber(pagination.total ?? payload?.total ?? 0),
      limit: ensureNumber(pagination.limit ?? filters.limit ?? 0),
      offset: ensureNumber(pagination.offset ?? filters.offset ?? 0),
    },
    filters: payload?.filters ?? filters ?? {},
  };
}

export async function getOfficialTasks(
  token: string,
  filters: TaskFilterParams = {},
  signal?: AbortSignal,
): Promise<TaskListResponse> {
  return getTaskList(token, "/api/tasks/official", filters, signal);
}

export async function getSpecialTasks(
  token: string,
  filters: TaskFilterParams = {},
  signal?: AbortSignal,
): Promise<TaskListResponse> {
  return getTaskList(token, "/api/tasks/special", filters, signal);
}

type FetchPostsOptions = {
  signal?: AbortSignal;
  downloadedIds?: string[];
  reportedIds?: string[];
};

export async function fetchPosts(
  token: string,
  clientId: string,
  options: FetchPostsOptions = {},
): Promise<InstaPost[]> {
  if (!clientId) {
    throw new Error("Client ID belum tersedia.");
  }
  const params = new URLSearchParams({ client_id: clientId });
  const url = `${buildApiUrl("/api/insta/posts")}?${params.toString()}`;
  const res = await fetchWithAuth(url, token, { signal: options.signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Gagal memuat postingan official.");
  }
  const json = await res.json();
  const payload = json?.data ?? json ?? [];

  const downloadedSet = options.downloadedIds
    ? new Set(options.downloadedIds)
    : readLocalIdSet(REPOSTER_DOWNLOADED_POSTS_KEY);
  const reportedSet = options.reportedIds
    ? new Set(options.reportedIds)
    : readLocalIdSet(REPOSTER_REPORTED_POSTS_KEY);

  const today = new Date();
  const posts = ensureArray(payload, (entry) => {
    const id =
      ensureString(entry?.shortcode) ||
      ensureString(entry?.id) ||
      ensureString(entry?.post_id);
    if (!id) return null;

    const createdAtRaw =
      ensureString(entry?.created_at) ||
      ensureString(entry?.createdAt) ||
      ensureString(entry?.timestamp) ||
      ensureString(entry?.taken_at);
    const createdAt =
      parseLocalTimestamp(createdAtRaw) ?? new Date(createdAtRaw);
    if (!createdAt || Number.isNaN(createdAt.getTime())) return null;

    const carouselImages = extractCarouselImages(entry);
    const imageUrl =
      ensureString(entry?.image_url) ||
      ensureString(entry?.thumbnail_url) ||
      carouselImages[0] ||
      ensureString(entry?.display_url) ||
      ensureString(entry?.media_url);
    const videoUrl =
      ensureString(entry?.video_url) ||
      ensureString(entry?.videoUrl) ||
      ensureString(entry?.media_url);
    const mediaType =
      ensureString(entry?.media_type) || ensureString(entry?.mediaType);
    const isVideo =
      Boolean(entry?.is_video || entry?.isVideo) ||
      mediaType.toLowerCase() === "video" ||
      Boolean(videoUrl);
    const isCarousel =
      Boolean(entry?.is_carousel) || carouselImages.length > 1;
    const sourceUrl =
      ensureString(entry?.source_url) ||
      ensureString(entry?.post_url) ||
      ensureString(entry?.permalink) ||
      ensureString(entry?.link);

    return {
      id,
      caption: ensureString(entry?.caption) || ensureString(entry?.text),
      imageUrl,
      createdAt,
      taskNumber: 0,
      isVideo,
      videoUrl,
      sourceUrl,
      carouselImages,
      isCarousel,
      downloaded: downloadedSet.has(id),
      reported: reportedSet.has(id),
    } satisfies InstaPost;
  }).filter((post): post is InstaPost => Boolean(post));

  return posts
    .filter((post) => isSameLocalDay(post.createdAt, today))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .map((post, index) => ({
      ...post,
      taskNumber: index + 1,
    }));
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
  const url = `${buildApiUrl("/api/dashboard/stats")}${
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
  const url = `${buildApiUrl("/api/insta/rekap-likes")}?${params.toString()}`;

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
  const url = `${buildApiUrl("/api/clients/profile")}?${params.toString()}`;

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
  const url = `${buildApiUrl("/api/users/list")}?client_id=${encodeURIComponent(client_id)}`;

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
  const url = buildApiUrl("/api/users/create");
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
  const url = buildApiUrl(`/api/users/${encodeURIComponent(userId)}`);
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

// Ambil profil user by NRP/NIP untuk modul reposter
export async function getReposterUserProfile(
  token: string,
  userId: string,
  signal?: AbortSignal,
): Promise<any> {
  const url = buildApiUrl(`/api/users/${encodeURIComponent(userId)}`);
  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) throw new Error("Gagal mengambil profil user");
  return res.json();
}

// Perbarui relasi user_roles ketika NRP/NIP berubah
export async function updateUserRoles(
  token: string,
  oldUserId: string,
  newUserId: string,
): Promise<any> {
  const url = buildApiUrl("/api/user_roles/update");
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
  const url = buildApiUrl("/api/tiktok/comments");
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
  const url = `${buildApiUrl("/api/tiktok/rekap-komentar")}?${params.toString()}`;

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
  const url = `${buildApiUrl("/api/amplify/rekap")}?${params.toString()}`;

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
  const url = `${buildApiUrl("/api/insta/posts")}${query ? `?${query}` : ""}`;
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
  const url = `${buildApiUrl("/api/insta/rapid-posts")}?${params.toString()}`;
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
  const url = `${buildApiUrl("/api/insta/rapid-posts-month")}?${params.toString()}`;
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
  const url = `${buildApiUrl("/api/insta/rapid-profile")}?${params.toString()}`;
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
  const url = `${buildApiUrl("/api/insta/rapid-info")}?${params.toString()}`;
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
  const url = `${buildApiUrl("/api/tiktok/rapid-profile")}?${params.toString()}`;
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
  const url = `${buildApiUrl("/api/tiktok/rapid-info")}?${params.toString()}`;
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
  const url = `${buildApiUrl("/api/tiktok/rapid-posts")}?${params.toString()}`;
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
  const url = `${buildApiUrl("/api/tiktok/rapid-posts")}?${params.toString()}`;
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
  const url = `${buildApiUrl("/api/tiktok/posts")}${query ? `?${query}` : ""}`;
  const res = await fetchWithAuth(url, token, { signal: options.signal });
  if (!res.ok) throw new Error("Failed to fetch tiktok posts");
  return res.json();
}

// === Claim & User Update without auth token ===

// Fetch user data by NRP without requiring auth
export async function getUserById(nrp: string): Promise<any> {
  const url = buildApiUrl(`/api/users/${encodeURIComponent(nrp)}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch user");
  return res.json();
}

// Fetch user data in claim flow after OTP verification
export async function getClaimUserData(
  nrp: string,
  email: string,
): Promise<any> {
  const url = buildApiUrl("/api/claim/user-data");
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
  const url = buildApiUrl("/api/claim/validate-email");
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
  const url = buildApiUrl("/api/claim/request-otp");
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
  const url = buildApiUrl("/api/claim/verify-otp");
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
  const url = buildApiUrl("/api/claim/update");
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
