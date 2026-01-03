import { formatPremiumTierLabel, normalizePremiumTierKey } from "@/utils/premium";

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

export function isAbortError(
  error: unknown,
  signal?: AbortSignal,
): boolean {
  if (signal?.aborted) return true;
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }
  return false;
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

export type SubmitPremiumRequestPayload = {
  premium_tier: string;
  bank_name: string;
  sender_name: string;
  account_number: string;
  premium_request_id?: string;
  request_id?: string;
  unique_code?: string;
  transfer_amount?: number;
  amount?: number;
  dashboard_user_id?: string;
  user_id?: string;
};

export type SubmitPremiumRequestResponse = ApiMessageResponse & {
  data?: any;
  status?: string;
  locked?: boolean;
  requestId?: string;
  transferAmount?: number;
};

export type PremiumRequestContext = {
  dashboardUserId?: string;
  userId?: string;
  premiumTier?: string;
  transferAmount?: number;
  uniqueCode?: string;
  status?: string;
  locked?: boolean;
  lockReason?: string;
  bankName?: string;
  senderName?: string;
  accountNumber?: string;
  requestId?: string;
  message?: string;
};

export async function getPremiumRequestContext(
  token?: string | null,
  signal?: AbortSignal,
): Promise<PremiumRequestContext> {
  const endpoint = buildApiUrl("/api/premium/request/latest");
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, { headers, signal });

  let data: any = null;
  try {
    data = await res.json();
  } catch (error) {
    data = null;
  }

  if (res.status === 401 || res.status === 403) {
    handleTokenExpired();
  }

  const successFlag = res.ok && data?.success !== false;
  const message = extractResponseMessage(
    data,
    successFlag
      ? "Context permintaan premium berhasil dimuat."
      : "Gagal memuat context permintaan premium.",
  );

  if (!successFlag) {
    throw new Error(message);
  }

  const payload = data?.data ?? data ?? {};
  const requestPayload = payload?.request ?? payload?.context ?? payload;
  const normalizeValue = (keys: string[]): string => {
    for (const key of keys) {
      const value = payload?.[key] ?? requestPayload?.[key];
      if (typeof value === "string" || typeof value === "number") {
        const normalized = String(value).trim();
        if (normalized) return normalized;
      }
    }
    return "";
  };

  const normalizeNumber = (keys: string[]): number | undefined => {
    for (const key of keys) {
      const rawValue = payload?.[key] ?? requestPayload?.[key];
      if (rawValue === null || rawValue === undefined) continue;
      const numericValue =
        typeof rawValue === "string"
          ? Number(rawValue)
          : typeof rawValue === "number"
            ? rawValue
            : undefined;
      if (numericValue !== undefined && Number.isFinite(numericValue)) {
        return numericValue;
      }
    }
    return undefined;
  };

  const dashboardUserId = normalizeValue([
    "dashboard_user_id",
    "dashboardUserId",
    "dashboard_user",
    "dashboardUser",
  ]);
  const userId = normalizeValue(["user_id", "userId", "user_uuid", "uuid"]);
  const premiumTier = normalizeValue(["premium_tier", "premiumTier", "tier"]);
  const uniqueCode = normalizeValue(["unique_code", "uniqueCode", "suffix"]);
  const bankName = normalizeValue(["bank_name", "bankName"]);
  const senderName = normalizeValue(["sender_name", "senderName", "payer_name"]);
  const accountNumber = normalizeValue(["account_number", "accountNumber"]);
  const requestId = normalizeValue([
    "request_id",
    "premium_request_id",
    "requestId",
    "premiumRequestId",
    "id",
  ]);
  const status = normalizeValue(["status", "request_status", "state"]);
  const lockReason = normalizeValue(["lock_reason", "lockReason", "reason"]);
  const messageText =
    normalizeValue(["message", "detail"]) ||
    (typeof data?.message === "string" ? data.message : "");

  const transferAmount = normalizeNumber([
    "transfer_amount",
    "amount",
    "unique_amount",
    "nominal_transfer",
    "nominal",
  ]);
  const locked =
    Boolean(payload?.locked ?? requestPayload?.locked) ||
    Boolean(payload?.is_locked ?? requestPayload?.is_locked) ||
    (typeof status === "string" &&
      ["pending", "processing", "waiting_payment", "paid", "submitted"].includes(
        status.toLowerCase(),
      ));

  return {
    dashboardUserId,
    userId,
    premiumTier,
    uniqueCode,
    bankName,
    senderName,
    accountNumber,
    requestId,
    status,
    lockReason,
    message: messageText || message,
    transferAmount,
    locked,
  };
}

export async function submitPremiumRequest(
  payload: SubmitPremiumRequestPayload,
  token?: string | null,
  signal?: AbortSignal,
): Promise<SubmitPremiumRequestResponse> {
  const endpoint = buildApiUrl("/api/premium/request");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const transferAmount = payload.transfer_amount ?? payload.amount;
  const amount = payload.amount ?? transferAmount;
  const dashboardUserId =
    typeof payload.dashboard_user_id === "string"
      ? payload.dashboard_user_id.trim()
      : "";
  const userId =
    typeof payload.user_id === "string" ? payload.user_id.trim() : "";

  const body: Record<string, any> = {
    premium_tier: payload.premium_tier,
    bank_name: payload.bank_name,
    account_number: payload.account_number,
    sender_name: payload.sender_name,
  };
  if (dashboardUserId) {
    body.dashboard_user_id = dashboardUserId;
  }
  if (userId) {
    body.user_id = userId;
  }

  if (transferAmount !== undefined) {
    body.transfer_amount = transferAmount;
  }
  if (amount !== undefined) {
    body.amount = amount;
  }
  if (payload.unique_code) {
    body.unique_code = payload.unique_code;
  }
  if (payload.premium_request_id) {
    body.premium_request_id = payload.premium_request_id;
  }
  if (payload.request_id) {
    body.request_id = payload.request_id;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch (error) {
    data = null;
  }

  if (res.status === 401 || res.status === 403) {
    handleTokenExpired();
  }

  const successFlag = res.ok && data?.success !== false;
  const message = extractResponseMessage(
    data,
    successFlag
      ? "Permintaan premium berhasil dikirim."
      : "Permintaan premium gagal diproses.",
  );

  if (!successFlag) {
    throw new Error(message);
  }

  const responseData = data?.data ?? data ?? {};
  const status =
    responseData?.status ??
    responseData?.request_status ??
    (typeof data?.status === "string" ? data.status : undefined);
  const locked =
    Boolean(responseData?.locked ?? data?.locked) ||
    Boolean(responseData?.is_locked ?? data?.is_locked);
  const responseTransferAmount =
    responseData?.transfer_amount ??
    responseData?.amount ??
    (typeof data?.transfer_amount === "number" ? data.transfer_amount : undefined);
  const requestId =
    responseData?.request_id ??
    responseData?.premium_request_id ??
    (typeof data?.request_id === "string" ? data.request_id : undefined);

  return {
    success: data?.success ?? res.ok,
    message,
    data: data?.data ?? data,
    status: typeof status === "string" ? status : undefined,
    locked,
    transferAmount: Number(responseTransferAmount) || undefined,
    requestId: typeof requestId === "string" ? requestId : undefined,
  };
}

export type ExecutiveSummaryFilters = {
  month?: string;
  period?: string;
  periode?: string;
  periodScope?: string;
  period_scope?: string;
  startDate?: string;
  endDate?: string;
  clientId?: string;
  client_id?: string;
  scope?: string;
  role?: string;
  regional_id?: string;
  start_date?: string;
  end_date?: string;
};

export type ExecutiveSummaryResponse = {
  month?: string;
  monthKey?: string;
  monthLabel?: string;
  summaryMetrics?: any[];
  highlights?: any[];
  engagementByChannel?: any[];
  audienceComposition?: any[];
  contentTable?: any[];
  platformAnalytics?: any;
  narratives?: Record<string, unknown>;
  overviewNarrative?: string;
  dashboardNarrative?: string;
  userInsightNarrative?: string;
  instagramNarrative?: string;
  tiktokNarrative?: string;
  [key: string]: unknown;
};

export async function getExecutiveSummary(
  token: string,
  filters: ExecutiveSummaryFilters = {},
  signal?: AbortSignal,
): Promise<ExecutiveSummaryResponse> {
  const params = new URLSearchParams();

  const clientId = filters.clientId || filters.client_id;
  if (!clientId) {
    throw new Error("client_id wajib diisi untuk executive summary.");
  }

  const monthParam = filters.month || filters.period;
  if (monthParam) {
    params.set("month", monthParam);
    params.set("period", monthParam);
  }

  const periodScope =
    filters.periodScope || filters.period_scope || filters.periode || filters.period;
  if (periodScope) {
    params.set("period_scope", periodScope);
    params.set("periode", periodScope);
  }

  const startDate = filters.startDate || filters.start_date;
  const endDate = filters.endDate || filters.end_date;
  if (startDate) params.set("start_date", startDate);
  if (endDate) params.set("end_date", endDate);

  if (filters.scope) params.set("scope", filters.scope);
  if (filters.role) params.set("role", filters.role);
  if (filters.regional_id) params.set("regional_id", filters.regional_id);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetchWithAuth(
    `${buildApiUrl(`/api/clients/${encodeURIComponent(clientId)}/summary`)}${query}`,
    token,
    { signal },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Gagal memuat executive summary.");
  }

  const json = await res.json();
  return json?.data ?? json ?? {};
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
  shortcode: string;
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
  platform: string;
};

export const REPOSTER_DOWNLOADED_POSTS_KEY = "reposter_downloaded_posts";
export const REPOSTER_REPORTED_POSTS_KEY = "reposter_reported_posts";
export const REPOSTER_SPECIAL_REPORTED_POSTS_KEY =
  "reposter_special_reported_posts";

export type TaskListResponse = {
  tasks: TaskItem[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  filters: Record<string, any>;
};

export type ReportLinkItem = {
  platform: string;
  url: string;
};

export type ReportLinkDetailInfo = {
  caption: string;
  imageUrl: string;
  shortcode: string;
  postId?: string;
};

export type ReportLinkDetail = {
  links: ReportLinkItem[];
  info: ReportLinkDetailInfo | null;
};

export type ReposterReportPayload = {
  shortcode: string;
  userId: string;
  postId?: string;
  clientId?: string;
  instagramLink: string;
  facebookLink: string;
  twitterLink: string;
  tiktokLink?: string;
  youtubeLink?: string;
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

function normalizeAccessParam(
  value?: unknown,
  options?: { casing?: "upper" | "lower" },
): string | undefined {
  const normalized = ensureString(value, "").trim();
  if (!normalized) return undefined;

  const casing = options?.casing || "upper";
  if (casing === "lower") return normalized.toLowerCase();
  return normalized.toUpperCase();
}

function decodeJwtPayloadSafe(token?: string | null): Record<string, any> | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  try {
    const decodedString =
      typeof atob === "function"
        ? atob(padded)
        : typeof Buffer !== "undefined"
          ? Buffer.from(padded, "base64").toString("utf-8")
          : "";
    const parsed = JSON.parse(decodedString);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    console.warn("Gagal mendekode payload JWT untuk client_id", error);
    return null;
  }
}

function extractClientIdFromToken(token?: string | null): string {
  const payload = decodeJwtPayloadSafe(token);
  if (!payload) return "";
  const keys = ["client_id", "clientId", "clientID", "cid"];
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function readStoredClientId(): string {
  if (typeof window === "undefined") return "";
  const stored = window.localStorage.getItem("client_id");
  return stored && stored.trim() ? stored.trim() : "";
}

export type DashboardAnevFilters = {
  time_range: string;
  role?: string;
  scope?: string;
  regional_id?: string;
  start_date?: string;
  end_date?: string;
  permitted_time_ranges?: string[];
  client_id: string;
  clientId?: string;
};

export type DashboardAnevDirectoryEntry = {
  user_id?: string;
  username?: string;
  full_name?: string;
  satfung?: string;
  division?: string;
  platform?: string;
  unmapped?: boolean;
};

export type DashboardAnevEngagementUserRow = {
  user_id?: string;
  username?: string;
  posts?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  engagement?: number;
  platform?: string;
  satfung?: string;
  division?: string;
  unmapped?: boolean;
};

export type DashboardAnevEngagementBreakdown = {
  totals?: Record<string, any>;
  per_user?: DashboardAnevEngagementUserRow[];
  per_platform?: any[];
  per_satfung?: any[];
  raw?: any;
};

export type DashboardAnevAggregates = {
  totals: Record<string, any>;
  timeline: any[];
  platforms: any[];
  tasks: any[];
  instagram_engagement?: DashboardAnevEngagementBreakdown;
  tiktok_engagement?: DashboardAnevEngagementBreakdown;
  user_per_satfung?: any[] | Record<string, any>;
  users_per_satfung?: any[] | Record<string, any>;
  satfung_breakdown?: any[] | Record<string, any>;
  division_breakdown?: any[] | Record<string, any>;
  user_breakdown?: any[] | Record<string, any>;
  breakdown?: { satfung?: any; division?: any; [key: string]: any };
  breakdowns?: { satfung?: any; division?: any; [key: string]: any };
  raw: any;
};

export type DashboardAnevResponse = {
  filters: DashboardAnevFilters;
  aggregates: DashboardAnevAggregates;
  meta?: any;
  raw?: any;
  directory?: DashboardAnevDirectoryEntry[];
  instagram_engagement?: DashboardAnevEngagementBreakdown;
  tiktok_engagement?: DashboardAnevEngagementBreakdown;
};

function normalizeDashboardAnevFilters(
  raw: any,
  fallback: Pick<DashboardAnevFilters, "time_range" | "client_id"> & {
    start_date?: string;
    end_date?: string;
    role?: string;
    scope?: string;
    regional_id?: string;
    permitted_time_ranges?: string[];
  },
): DashboardAnevFilters {
  const time_range =
    ensureString(
      raw?.time_range ??
        raw?.timeRange ??
        raw?.range ??
        raw?.periode ??
        raw?.period,
    ) || fallback.time_range;
  const start_date =
    ensureString(raw?.start_date ?? raw?.tanggal_mulai ?? raw?.startDate) ||
    fallback.start_date;
  const end_date =
    ensureString(raw?.end_date ?? raw?.tanggal_selesai ?? raw?.endDate) ||
    fallback.end_date;
  const role =
    ensureString(raw?.role ?? raw?.user_role ?? raw?.userRole) ||
    fallback.role;
  const scope =
    ensureString(raw?.scope ?? raw?.client_scope ?? raw?.clientScope) ||
    fallback.scope;
  const regional_id =
    ensureString(raw?.regional_id ?? raw?.regional ?? raw?.regionalId) ||
    fallback.regional_id;
  const permitted_time_ranges = ensureArray(
    raw?.permitted_time_ranges ??
      raw?.permittedTimeRanges ??
      raw?.allowed_time_ranges ??
      raw?.allowedTimeRanges,
    (entry) => ensureString(entry).toLowerCase(),
  ).filter(Boolean);
  const resolvedPermittedRanges = permitted_time_ranges.length
    ? permitted_time_ranges
    : (fallback.permitted_time_ranges || []).map((entry) => entry.toLowerCase()).filter(Boolean);

  return {
    time_range,
    start_date,
    end_date,
    role: role || undefined,
    scope: scope || undefined,
    regional_id: regional_id || undefined,
    permitted_time_ranges: resolvedPermittedRanges.length ? resolvedPermittedRanges : undefined,
    client_id: ensureString(raw?.client_id ?? raw?.clientId ?? fallback.client_id),
  };
}

function normalizeDashboardAnevDirectory(raw: any): DashboardAnevDirectoryEntry[] {
  const candidates = [
    raw?.directory,
    raw?.directories,
    raw?.user_directory,
    raw?.userDirectory,
    raw?.users,
    raw?.data?.directory,
    raw?.data?.users,
    raw?.directory?.users,
    raw?.aggregates?.directory,
    raw?.aggregates?.user_directory,
  ];

  const normalizeEntry = (item: any): DashboardAnevDirectoryEntry | null => {
    if (!item || typeof item !== "object") return null;
    const user_id =
      ensureString(
        item.user_id ?? item.userId ?? item.id ?? item.uid ?? item.nrp ?? item.user,
      ) || undefined;
    const username =
      ensureString(
        item.username ?? item.handle ?? item.user_name ?? item.account ?? item.user,
      ) || undefined;
    const full_name =
      ensureString(
        item.full_name ?? item.fullName ?? item.name ?? item.display_name ?? item.displayName,
      ) || undefined;
    const satfung =
      ensureString(
        item.satfung ?? item.division ?? item.divisi ?? item.unit ?? item.department,
      ) || undefined;
    const division =
      ensureString(item.division ?? item.divisi ?? item.satfung ?? item.unit) || undefined;
    const platform =
      ensureString(item.platform ?? item.channel ?? item.media ?? item.account_type) ||
      undefined;
    const unmapped = Boolean(item.unmapped || item.is_unmapped || item.unrecognized);

    if (!user_id && !username && !full_name) return null;
    return {
      user_id,
      username,
      full_name,
      satfung,
      division,
      platform,
      unmapped: unmapped || undefined,
    };
  };

  const results: DashboardAnevDirectoryEntry[] = [];
  const seen = new Set<string>();

  const collect = (source: any) => {
    const asArray = Array.isArray(source)
      ? source
      : Array.isArray(source?.users)
        ? source.users
        : source && typeof source === "object"
          ? Object.values(source)
          : [];

    asArray.forEach((item) => {
      const normalized = normalizeEntry(item);
      if (!normalized) return;
      const key = `${normalized.user_id || ""}-${normalized.username || normalized.full_name}`;
      if (seen.has(key)) return;
      seen.add(key);
      results.push(normalized);
    });
  };

  candidates.forEach((candidate) => collect(candidate));
  return results;
}

function normalizeDashboardAnevEngagement(
  raw: any,
): DashboardAnevEngagementBreakdown | undefined {
  if (!raw || typeof raw !== "object") return undefined;

  const totals = raw?.totals ?? raw?.summary ?? raw?.metrics ?? raw;
  const per_platform = ensureArray(
    raw?.per_platform ?? raw?.platforms ?? raw?.platform ?? raw?.channels,
    (entry) => entry,
  );
  const per_satfung = ensureArray(
    raw?.per_satfung ?? raw?.per_divisi ?? raw?.per_division ?? raw?.satfung ?? raw?.division,
    (entry) => entry,
  );

  const normalizeUserEntries = (value: any): DashboardAnevEngagementUserRow[] => {
    const entries = Array.isArray(value)
      ? value
      : value && typeof value === "object"
        ? Object.entries(value).map(([key, val]) =>
            typeof val === "object" ? { user_id: key, ...val } : { user_id: key, engagement: val },
          )
        : [];

    return entries
      .map((item) => {
        const user_id =
          ensureString(item.user_id ?? item.userId ?? item.id ?? item.uid ?? item.nrp) || undefined;
        const username =
          ensureString(
            item.username ?? item.handle ?? item.account ?? item.user ?? item.user_name,
          ) || undefined;
        const posts = ensureNumber(
          item.posts ?? item.total_posts ?? item.post ?? item.count ?? item.total,
          0,
        );
        const likes = ensureNumber(item.likes ?? item.like_count ?? item.total_likes, 0);
        const comments = ensureNumber(
          item.comments ?? item.comment_count ?? item.total_comments,
          0,
        );
        const shares = ensureNumber(item.shares ?? item.share_count ?? item.total_shares, 0);
        const baseEngagement = likes + comments + shares;
        const engagement = ensureNumber(
          item.engagement ?? item.engagements ?? item.total_engagement ?? item.interactions,
          baseEngagement,
        );
        const platform =
          ensureString(item.platform ?? item.channel ?? item.media ?? item.account_type) ||
          undefined;
        const satfung =
          ensureString(
            item.satfung ?? item.division ?? item.divisi ?? item.unit ?? item.department,
          ) || undefined;
        const division =
          ensureString(item.division ?? item.divisi ?? item.satfung ?? item.unit) || undefined;
        const unmapped = Boolean(item.unmapped || item.is_unmapped || item.unrecognized);

        if (!user_id && !username) return null;
        return {
          user_id,
          username,
          posts,
          likes,
          comments,
          shares,
          engagement,
          platform,
          satfung,
          division,
          unmapped: unmapped || undefined,
        };
      })
      .filter(Boolean) as DashboardAnevEngagementUserRow[];
  };

  const per_user_candidate =
    raw?.per_user ?? raw?.perUser ?? raw?.users ?? raw?.user ?? raw?.per_account ?? raw?.accounts;
  const per_user = normalizeUserEntries(per_user_candidate);

  if (!per_user.length && !per_platform.length && !per_satfung.length && !totals) {
    return undefined;
  }

  return {
    totals,
    per_user: per_user.length ? per_user : undefined,
    per_platform: per_platform.length ? per_platform : undefined,
    per_satfung: per_satfung.length ? per_satfung : undefined,
    raw,
  };
}

function normalizeDashboardAnevAggregates(raw: any): DashboardAnevAggregates {
  const aggregates = raw?.aggregates ?? raw ?? {};
  const totals =
    aggregates?.totals ??
    aggregates?.summary ??
    aggregates?.total ??
    aggregates?.metrics ??
    {};
  const timeline = ensureArray(
    aggregates?.timeline ??
      aggregates?.timeseries ??
      aggregates?.series ??
      aggregates?.activity ??
      aggregates?.chart,
    (entry) => entry,
  );
  const platforms = ensureArray(
    aggregates?.platforms ?? aggregates?.by_platform ?? aggregates?.channels,
    (entry) => entry,
  );
  const tasks = ensureArray(
    aggregates?.tasks ?? aggregates?.reports ?? aggregates?.items,
    (entry) => entry,
  );

  const breakdown =
    aggregates?.breakdown && typeof aggregates.breakdown === "object"
      ? aggregates.breakdown
      : undefined;
  const breakdowns =
    aggregates?.breakdowns && typeof aggregates.breakdowns === "object"
      ? aggregates.breakdowns
      : undefined;
  const user_per_satfung =
    aggregates?.user_per_satfung ??
    aggregates?.users_per_satfung ??
    aggregates?.satfung_breakdown ??
    aggregates?.division_breakdown ??
    aggregates?.user_breakdown ??
    breakdown?.satfung ??
    breakdown?.division ??
    breakdowns?.satfung ??
    breakdowns?.division ??
    breakdown ??
    breakdowns;
  const users_per_satfung =
    aggregates?.users_per_satfung ??
    aggregates?.user_per_satfung ??
    breakdown?.satfung ??
    breakdown?.division ??
    breakdowns?.satfung ??
    breakdowns?.division;
  const satfung_breakdown =
    aggregates?.satfung_breakdown ?? breakdown?.satfung ?? breakdowns?.satfung;
  const division_breakdown =
    aggregates?.division_breakdown ?? breakdown?.division ?? breakdowns?.division;
  const user_breakdown = aggregates?.user_breakdown ?? breakdown ?? breakdowns;
  const instagram_engagement = normalizeDashboardAnevEngagement(
    aggregates?.instagram_engagement ?? aggregates?.engagement?.instagram ?? aggregates?.ig_engagement,
  );
  const tiktok_engagement = normalizeDashboardAnevEngagement(
    aggregates?.tiktok_engagement ??
      aggregates?.engagement?.tiktok ??
      aggregates?.tiktokEngagement,
  );

  return {
    totals,
    timeline,
    platforms,
    tasks,
    instagram_engagement,
    tiktok_engagement,
    user_per_satfung,
    users_per_satfung,
    satfung_breakdown,
    division_breakdown,
    user_breakdown,
    breakdown,
    breakdowns,
    raw: aggregates,
  };
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

function isLikelyShortcode(value: string): boolean {
  if (!value) return false;
  if (!/^[A-Za-z0-9_-]{5,20}$/.test(value)) return false;
  return /[A-Za-z]/.test(value);
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
  reportedStorageKey?: string;
};

async function fetchReposterPosts(
  token: string,
  clientId: string,
  endpoint: string,
  options: FetchPostsOptions = {},
): Promise<InstaPost[]> {
  if (!clientId) {
    throw new Error("Client ID belum tersedia.");
  }
  const params = new URLSearchParams({ client_id: clientId });
  const url = `${buildApiUrl(endpoint)}?${params.toString()}`;
  const res = await fetchWithAuth(url, token, { signal: options.signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Gagal memuat postingan reposter.");
  }
  const json = await res.json();
  const payload = json?.data ?? json ?? [];

  const downloadedSet = options.downloadedIds
    ? new Set(options.downloadedIds)
    : readLocalIdSet(REPOSTER_DOWNLOADED_POSTS_KEY);
  const reportedSet = options.reportedIds
    ? new Set(options.reportedIds)
    : readLocalIdSet(
        options.reportedStorageKey ?? REPOSTER_REPORTED_POSTS_KEY,
      );

  const today = new Date();
  const posts = ensureArray(payload, (entry) => {
    const shortcode =
      ensureString(entry?.shortcode) ||
      ensureString(entry?.short_code) ||
      ensureString(entry?.code);
    const id =
      shortcode || ensureString(entry?.id) || ensureString(entry?.post_id);
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
      shortcode: shortcode || (isLikelyShortcode(id) ? id : ""),
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
      platform: ensureString(entry?.platform) || "instagram",
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

export async function fetchPosts(
  token: string,
  clientId: string,
  options: FetchPostsOptions = {},
): Promise<InstaPost[]> {
  return fetchReposterPosts(token, clientId, "/api/insta/posts", options);
}

export async function fetchSpecialPosts(
  token: string,
  clientId: string,
  options: FetchPostsOptions = {},
): Promise<InstaPost[]> {
  return fetchReposterPosts(
    token,
    clientId,
    "/api/insta/posts-khusus",
    {
      ...options,
      reportedStorageKey:
        options.reportedStorageKey ?? REPOSTER_SPECIAL_REPORTED_POSTS_KEY,
    },
  );
}

const REPORT_LINK_FIELDS: Array<[string, string]> = [
  ["instagram_link", "instagram"],
  ["facebook_link", "facebook"],
  ["twitter_link", "twitter"],
  ["tiktok_link", "tiktok"],
  ["youtube_link", "youtube"],
];

function extractReportItems(raw: any): any[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data?.items)) return raw.data.items;
  if (Array.isArray(raw?.data?.data?.items)) return raw.data.data.items;
  return [];
}

function normalizeReportLinkRecord(record: any): ReportLinkItem[] {
  if (!record || typeof record !== "object") return [];
  return REPORT_LINK_FIELDS.map(([field, platform]) => ({
    platform,
    url: ensureString(record?.[field]),
  })).filter((entry) => entry.url);
}

function normalizeReportLinks(raw: any): ReportLinkItem[] {
  if (Array.isArray(raw)) {
    return raw.flatMap((entry) => {
      const fromFields = normalizeReportLinkRecord(entry);
      if (fromFields.length > 0) return fromFields;
      const platform =
        ensureString(entry?.platform) ||
        ensureString(entry?.name) ||
        ensureString(entry?.type);
      const url = ensureString(entry?.url) || ensureString(entry?.link);
      return platform && url ? [{ platform, url }] : [];
    });
  }
  if (raw && typeof raw === "object") {
    const fromFields = normalizeReportLinkRecord(raw);
    if (fromFields.length > 0) return fromFields;
    return Object.entries(raw)
      .map(([platform, url]) => ({
        platform: ensureString(platform),
        url: ensureString(url),
      }))
      .filter((entry) => entry.platform && entry.url);
  }
  return [];
}

function normalizeReportLinksPayload(raw: any): ReportLinkItem[] {
  const links = normalizeReportLinks(
    raw?.links ??
      raw?.data?.links ??
      raw?.data?.data ??
      raw?.data ??
      raw,
  );
  const items = extractReportItems(raw);
  if (items.length > 0) {
    const fromItems = items.flatMap((item) =>
      normalizeReportLinkRecord(item),
    );
    if (fromItems.length > 0) return fromItems;
  }
  return links;
}

function normalizeReportLinkInfo(raw: any): ReportLinkDetailInfo | null {
  if (!raw || typeof raw !== "object") return null;
  const caption = ensureString(raw?.caption);
  const imageUrl = ensureString(
    raw?.image_url || raw?.imageUrl || raw?.thumbnail_url,
  );
  const shortcode = ensureString(raw?.shortcode);
  const postId = ensureString(raw?.post_id || raw?.postId);
  if (!caption && !imageUrl && !shortcode && !postId) return null;
  return {
    caption,
    imageUrl,
    shortcode,
    postId,
  };
}

export async function getReposterReportLinks(
  token: string,
  params: {
    shortcode?: string;
    postId?: string;
    userId: string;
    isSpecial?: boolean;
  },
  signal?: AbortSignal,
): Promise<ReportLinkItem[]> {
  if (!params.userId) {
    throw new Error("User ID belum tersedia.");
  }
  if (!params.postId && !params.shortcode) {
    throw new Error("Post ID atau shortcode belum tersedia.");
  }
  const query = new URLSearchParams({ user_id: params.userId });
  if (params.postId) {
    query.set("post_id", params.postId);
  }
  if (!params.postId && params.shortcode) {
    query.set("shortcode", params.shortcode);
  }
  const endpoint = params.isSpecial
    ? "/api/link-reports-khusus"
    : "/api/link-reports";
  const url = `${buildApiUrl(endpoint)}?${query.toString()}`;
  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Gagal memuat link laporan.");
  }
  const json = await res.json();
  return normalizeReportLinksPayload(json ?? {});
}

export async function getReposterReportLinkDetail(
  token: string,
  params: {
    shortcode?: string;
    postId?: string;
    userId: string;
    isSpecial?: boolean;
  },
  signal?: AbortSignal,
): Promise<ReportLinkDetail> {
  if (!params.userId) {
    throw new Error("User ID belum tersedia.");
  }
  if (!params.postId && !params.shortcode) {
    throw new Error("Post ID atau shortcode belum tersedia.");
  }
  const query = new URLSearchParams({ user_id: params.userId });
  if (params.postId) {
    query.set("post_id", params.postId);
  }
  if (!params.postId && params.shortcode) {
    query.set("shortcode", params.shortcode);
  }
  const endpoint = params.isSpecial
    ? "/api/link-reports-khusus"
    : "/api/link-reports";
  const url = `${buildApiUrl(endpoint)}?${query.toString()}`;
  const res = await fetchWithAuth(url, token, { signal });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Gagal memuat link laporan.");
  }
  const json = await res.json();
  const items = extractReportItems(json ?? {});
  const info = normalizeReportLinkInfo(items[0]);
  return {
    links: normalizeReportLinksPayload(json ?? {}),
    info,
  };
}

function normalizeReportDuplicates(raw: any): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((entry) => ensureString(entry))
      .filter((entry) => entry.length > 0);
  }
  return [];
}

export async function getReposterReportLinkDuplicates(
  token: string,
  links: string[],
  options?: { isSpecial?: boolean; signal?: AbortSignal },
): Promise<string[]> {
  if (!links.length) return [];
  const params = new URLSearchParams();
  links.forEach((link) => params.append("links[]", link));
  const endpoint = options?.isSpecial
    ? "/api/link-reports-khusus"
    : "/api/link-reports";
  const url = `${buildApiUrl(endpoint)}?${params.toString()}`;
  const res = await fetchWithAuth(url, token, {
    signal: options?.signal,
  });
  if (!res.ok) return [];
  const json = await res.json();
  const payload = json?.data ?? json ?? {};
  const rawDuplicates =
    payload?.duplicates ?? payload?.data?.duplicates ?? json?.duplicates;
  return normalizeReportDuplicates(rawDuplicates).map((entry) =>
    entry.trim().toLowerCase(),
  );
}

export async function submitReposterReportLinks(
  token: string,
  payload: ReposterReportPayload,
  options?: { isSpecial?: boolean; signal?: AbortSignal },
): Promise<void> {
  const body = {
    shortcode: payload.shortcode,
    user_id: payload.userId,
    post_id: payload.postId,
    client_id: payload.clientId,
    instagram_link: payload.instagramLink,
    facebook_link: payload.facebookLink,
    twitter_link: payload.twitterLink,
    tiktok_link: payload.tiktokLink ?? "",
    youtube_link: payload.youtubeLink ?? "",
  };
  const endpoint = options?.isSpecial
    ? "/api/link-reports-khusus"
    : "/api/link-reports";
  const res = await fetchWithAuth(buildApiUrl(endpoint), token, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: options?.signal,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Gagal mengirim laporan.");
  }
}

export async function getDashboardAnev(
  token: string,
  filters: Partial<DashboardAnevFilters> = {},
  signal?: AbortSignal,
): Promise<DashboardAnevResponse> {
  const normalizedRole = normalizeAccessParam(
    filters.role ?? (filters as any)?.role,
  );
  const normalizedScope = normalizeAccessParam(
    filters.scope ?? (filters as any)?.scope,
    { casing: "lower" },
  );
  const normalizedRegionalId = normalizeAccessParam(
    filters.regional_id ?? (filters as any)?.regional_id,
  );
  const timeRange =
    ensureString(filters.time_range ?? (filters as any)?.timeRange) || "7d";
  const startDate =
    ensureString(filters.start_date ?? (filters as any)?.startDate) || undefined;
  const endDate =
    ensureString(filters.end_date ?? (filters as any)?.endDate) || undefined;
  const clientId =
    ensureString(filters.client_id ?? filters.clientId) ||
    readStoredClientId() ||
    extractClientIdFromToken(token);

  if (!normalizedRole) {
    const error: any = new Error(
      "Role login wajib tersedia untuk memuat Dashboard ANEV (400).",
    );
    error.status = 400;
    throw error;
  }

  if (!clientId) {
    const error: any = new Error(
      "client_id wajib diisi untuk memuat Dashboard ANEV (400).",
    );
    error.status = 400;
    throw error;
  }

  if (timeRange.toLowerCase() === "custom" && (!startDate || !endDate)) {
    const error: any = new Error(
      "Rentang waktu custom memerlukan start_date dan end_date.",
    );
    error.status = 400;
    throw error;
  }

  const params = new URLSearchParams({ time_range: timeRange, client_id: clientId });
  if (normalizedRole) params.append("role", normalizedRole);
  if (normalizedScope) params.append("scope", normalizedScope);
  if (normalizedRegionalId) params.append("regional_id", normalizedRegionalId);
  if (startDate) params.append("start_date", startDate);
  if (endDate) params.append("end_date", endDate);

  const url = `${buildApiUrl("/api/dashboard/anev")}?${params.toString()}`;
  const res = await fetchWithAuth(url, token, {
    signal,
    headers: {
      "X-Client-Id": clientId,
    },
  });

  let parsed: any = null;
  try {
    parsed = await res.clone().json();
  } catch {
    parsed = null;
  }

  if (res.status === 403) {
    const payload = parsed?.data ?? parsed ?? {};
    const rawTier = ensureString(payload?.tier ?? payload?.premium_tier);
    const normalizedTier = normalizePremiumTierKey(rawTier);
    const formattedTier = formatPremiumTierLabel(normalizedTier || rawTier);
    const expires_at = ensureString(
      payload?.expires_at ?? payload?.expiry ?? payload?.expired_at,
    );
    const message = extractResponseMessage(
      parsed,
      "Akses premium diperlukan untuk membuka Dashboard ANEV.",
    );
    const error: any = new Error(message);
    error.status = 403;
    error.premiumGuard = {
      tier: formattedTier || normalizedTier || rawTier || undefined,
      normalizedTier: normalizedTier || undefined,
      rawTier: rawTier || undefined,
      expires_at: expires_at || undefined,
      expiresAt: expires_at || undefined,
    };
    throw error;
  }

  if (!res.ok) {
    const text =
      parsed && typeof parsed === "object"
        ? extractResponseMessage(parsed, "")
        : await res.text();
    throw new Error(text || "Gagal memuat Dashboard ANEV.");
  }

  const json = parsed ?? (await res.json());
  const payload = json?.data ?? json ?? {};
  const normalizedFilters = normalizeDashboardAnevFilters(payload?.filters ?? {}, {
    time_range: timeRange,
    client_id: clientId,
    start_date: startDate,
    end_date: endDate,
    role: normalizedRole,
    scope: normalizedScope,
    regional_id: normalizedRegionalId,
  });
  const aggregates = normalizeDashboardAnevAggregates(
    payload?.aggregates ?? payload?.aggregate ?? payload,
  );
  const directory = normalizeDashboardAnevDirectory(payload);
  const instagram_engagement =
    normalizeDashboardAnevEngagement(
      payload?.instagram_engagement ??
        payload?.instagramEngagement ??
        payload?.engagement?.instagram ??
        payload?.engagements?.instagram ??
        payload?.aggregates?.instagram_engagement ??
        aggregates?.raw?.instagram_engagement ??
        aggregates?.raw?.engagement?.instagram,
    ) ?? aggregates?.instagram_engagement;
  const tiktok_engagement =
    normalizeDashboardAnevEngagement(
      payload?.tiktok_engagement ??
        payload?.tiktokEngagement ??
        payload?.engagement?.tiktok ??
        payload?.engagements?.tiktok ??
        payload?.aggregates?.tiktok_engagement ??
        aggregates?.raw?.tiktok_engagement ??
        aggregates?.raw?.engagement?.tiktok,
    ) ?? aggregates?.tiktok_engagement;

  return {
    filters: normalizedFilters,
    aggregates,
    meta: payload?.meta ?? payload?.pagination,
    directory: directory.length ? directory : undefined,
    instagram_engagement,
    tiktok_engagement,
    raw: payload,
  };
}

export async function getDashboardStats(
  token: string,
  periode?: string,
  tanggal?: string,
  startDate?: string,
  endDate?: string,
  client_id?: string,
  options?: { role?: string; scope?: string; regional_id?: string },
  signal?: AbortSignal,
): Promise<any> {
  const params = new URLSearchParams();
  if (periode) params.append("periode", periode);
  if (tanggal) params.append("tanggal", tanggal);
  if (startDate) params.append("tanggal_mulai", startDate);
  if (endDate) params.append("tanggal_selesai", endDate);
  if (client_id) params.append("client_id", client_id);
  if (options?.role) params.append("role", options.role);
  if (options?.scope) params.append("scope", options.scope);
  if (options?.regional_id) params.append("regional_id", options.regional_id);
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
export type RoleScopeRegionalOptions = {
  role?: string;
  scope?: string;
  regional_id?: string;
  signal?: AbortSignal;
};

function resolveRoleScopeRegionalOptions(
  signalOrOptions?: AbortSignal | RoleScopeRegionalOptions,
  options?: RoleScopeRegionalOptions,
): { options: RoleScopeRegionalOptions; signal?: AbortSignal } {
  const mergedOptions: RoleScopeRegionalOptions = {};
  let resolvedSignal: AbortSignal | undefined;

  [signalOrOptions, options].forEach((candidate) => {
    if (!candidate) return;
    if (isAbortSignal(candidate)) {
      if (!resolvedSignal) resolvedSignal = candidate;
      return;
    }
    Object.assign(mergedOptions, candidate);
    if (!resolvedSignal && candidate.signal && isAbortSignal(candidate.signal)) {
      resolvedSignal = candidate.signal;
    }
  });

  return { options: mergedOptions, signal: resolvedSignal };
}

export type MonthDateRange = {
  monthKey: string;
  startDate: string;
  endDate: string;
};

export function buildMonthDateRange(monthKey?: string | null): MonthDateRange | null {
  if (!monthKey || typeof monthKey !== "string") {
    return null;
  }

  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
    return null;
  }

  const pad = (value: number) => String(value).padStart(2, "0");
  const startDate = `${year}-${pad(monthIndex + 1)}-01`;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const endDate = `${year}-${pad(monthIndex + 1)}-${pad(lastDay)}`;

  return { monthKey, startDate, endDate };
}

export function getPreviousMonthKey(monthKey?: string | null): string | null {
  if (!monthKey || typeof monthKey !== "string") return null;

  const [yearStr, monthStr] = monthKey.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);

  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return null;
  }

  const previousMonth = month - 1;
  const previousYear = previousMonth >= 1 ? year : year - 1;
  const normalizedMonth = previousMonth >= 1 ? previousMonth : 12;

  if (!Number.isFinite(previousYear) || previousYear <= 0) {
    return null;
  }

  return `${previousYear}-${String(normalizedMonth).padStart(2, "0")}`;
}

export type MonthlyPlatformRecapResult = {
  range: MonthDateRange;
  previousRange: MonthDateRange | null;
  likes: any;
  comments: any;
  instagramPosts: any[];
  tiktokPosts: any[];
  previousLikes: any;
  previousComments: any;
  previousInstagramPosts: any[];
  previousTiktokPosts: any[];
};

export async function getMonthlyPlatformRecap(
  token: string,
  client_id: string,
  monthKey?: string | null,
  options?: RoleScopeRegionalOptions & { signal?: AbortSignal },
): Promise<MonthlyPlatformRecapResult> {
  const range = buildMonthDateRange(monthKey);
  if (!range) {
    throw new Error("monthKey tidak valid untuk rekap bulanan.");
  }

  const previousMonthKey = getPreviousMonthKey(range.monthKey);
  const previousRange = previousMonthKey
    ? buildMonthDateRange(previousMonthKey)
    : null;
  const { options: resolvedOptions, signal } = resolveRoleScopeRegionalOptions(
    options?.signal,
    options,
  );

  const tanggalParam = range.startDate;
  const startDateParam = range.startDate;
  const endDateParam = range.endDate;
  const previousTanggalParam = previousRange?.startDate;
  const previousStartDateParam = previousRange?.startDate;
  const previousEndDateParam = previousRange?.endDate;

  const [likes, comments, instagramPostsResponse, tiktokPostsResponse] =
    await Promise.all([
      getRekapLikesIG(
        token,
        client_id,
        "harian",
        tanggalParam,
        startDateParam,
        endDateParam,
        signal,
        resolvedOptions,
      ).catch((error) => {
        console.warn("Gagal memuat rekap likes IG bulanan", error);
        return { data: [] };
      }),
      getRekapKomentarTiktok(
        token,
        client_id,
        "harian",
        tanggalParam,
        startDateParam,
        endDateParam,
        signal,
        resolvedOptions,
      ).catch((error) => {
        console.warn("Gagal memuat rekap komentar TikTok bulanan", error);
        return { data: [] };
      }),
      getInstagramPosts(token, client_id, {
        startDate: startDateParam,
        endDate: endDateParam,
        scope: resolvedOptions.scope,
        role: resolvedOptions.role,
        regional_id: resolvedOptions.regional_id,
        signal,
      }).catch((error) => {
        console.warn("Gagal memuat konten Instagram bulanan", error);
        return { posts: [], data: [] };
      }),
      getTiktokPosts(token, client_id, {
        startDate: startDateParam,
        endDate: endDateParam,
        scope: resolvedOptions.scope,
        role: resolvedOptions.role,
        regional_id: resolvedOptions.regional_id,
        signal,
      }).catch((error) => {
        console.warn("Gagal memuat konten TikTok bulanan", error);
        return [];
      }),
    ]);

  let previousLikes: any = { data: [] };
  let previousComments: any = { data: [] };
  let previousInstagramPosts: any[] = [];
  let previousTiktokPosts: any[] = [];

  if (previousRange) {
    const [prevLikes, prevComments, prevIgPosts, prevTtPosts] = await Promise.all([
      getRekapLikesIG(
        token,
        client_id,
        "harian",
        previousTanggalParam,
        previousStartDateParam,
        previousEndDateParam,
        signal,
        resolvedOptions,
      ).catch((error) => {
        console.warn("Gagal memuat rekap likes IG bulan sebelumnya", error);
        return { data: [] };
      }),
      getRekapKomentarTiktok(
        token,
        client_id,
        "harian",
        previousTanggalParam,
        previousStartDateParam,
        previousEndDateParam,
        signal,
        resolvedOptions,
      ).catch((error) => {
        console.warn("Gagal memuat rekap komentar TikTok bulan sebelumnya", error);
        return { data: [] };
      }),
      getInstagramPosts(token, client_id, {
        startDate: previousStartDateParam,
        endDate: previousEndDateParam,
        scope: resolvedOptions.scope,
        role: resolvedOptions.role,
        regional_id: resolvedOptions.regional_id,
        signal,
      }).catch((error) => {
        console.warn("Gagal memuat konten Instagram bulan sebelumnya", error);
        return { posts: [], data: [] };
      }),
      getTiktokPosts(token, client_id, {
        startDate: previousStartDateParam,
        endDate: previousEndDateParam,
        scope: resolvedOptions.scope,
        role: resolvedOptions.role,
        regional_id: resolvedOptions.regional_id,
        signal,
      }).catch((error) => {
        console.warn("Gagal memuat konten TikTok bulan sebelumnya", error);
        return [];
      }),
    ]);

    previousLikes = prevLikes;
    previousComments = prevComments;
    previousInstagramPosts = Array.isArray(prevIgPosts?.posts)
      ? prevIgPosts.posts
      : Array.isArray(prevIgPosts?.data)
      ? prevIgPosts.data
      : Array.isArray(prevIgPosts)
      ? prevIgPosts
      : [];
    previousTiktokPosts = Array.isArray(prevTtPosts?.posts)
      ? prevTtPosts.posts
      : Array.isArray(prevTtPosts?.data)
      ? prevTtPosts.data
      : Array.isArray(prevTtPosts)
      ? prevTtPosts
      : [];
  }

  const instagramPosts = Array.isArray(instagramPostsResponse?.posts)
    ? instagramPostsResponse.posts
    : Array.isArray(instagramPostsResponse?.data)
    ? instagramPostsResponse.data
    : Array.isArray(instagramPostsResponse)
    ? instagramPostsResponse
    : [];
  const tiktokPosts = Array.isArray(tiktokPostsResponse?.posts)
    ? tiktokPostsResponse.posts
    : Array.isArray(tiktokPostsResponse?.data)
    ? tiktokPostsResponse.data
    : Array.isArray(tiktokPostsResponse)
    ? tiktokPostsResponse
    : [];

  return {
    range,
    previousRange,
    likes,
    comments,
    instagramPosts,
    tiktokPosts,
    previousLikes,
    previousComments,
    previousInstagramPosts,
    previousTiktokPosts,
  };
}

export async function getRekapLikesIG(
  token: string,
  client_id: string,
  periode: string = "harian",
  tanggal?: string,
  startDate?: string,
  endDate?: string,
  signalOrOptions?: AbortSignal | RoleScopeRegionalOptions,
  options?: RoleScopeRegionalOptions,
): Promise<any> {
  const { options: resolvedOptions, signal: resolvedSignal } =
    resolveRoleScopeRegionalOptions(signalOrOptions, options);
  const params = new URLSearchParams({ client_id, periode });
  if (tanggal) params.append("tanggal", tanggal);
  if (startDate) params.append("tanggal_mulai", startDate);
  if (endDate) params.append("tanggal_selesai", endDate);
  if (resolvedOptions.role) params.append("role", resolvedOptions.role);
  if (resolvedOptions.scope) params.append("scope", resolvedOptions.scope);
  if (resolvedOptions.regional_id) {
    params.append("regional_id", resolvedOptions.regional_id);
  }
  const url = `${buildApiUrl("/api/insta/rekap-likes")}?${params.toString()}`;

  const res = await fetchWithAuth(url, token, { signal: resolvedSignal });
  if (!res.ok) throw new Error("Failed to fetch rekap");
  return res.json();
}

// Ambil profile client berdasarkan token dan client_id
export type ClientProfileParams = {
  role?: string;
  scope?: string;
  regional_id?: string;
};

export async function getClientProfile(
  token: string,
  client_id: string,
  signal?: AbortSignal,
  options?: ClientProfileParams,
): Promise<any> {
  const params = new URLSearchParams({ client_id });
  if (options?.role) params.append("role", options.role);
  if (options?.scope) params.append("scope", options.scope);
  if (options?.regional_id) params.append("regional_id", options.regional_id);
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
  options?: ClientProfileParams,
): Promise<Record<string, string>> {
  const uniqueIds = Array.from(new Set(clientIds.filter(Boolean)));
  const entries = await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        const profile = await getClientProfile(token, id, signal, options);
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
export type UserDirectoryParams = {
  role?: string;
  scope?: "DIREKTORAT" | "ORG";
  regional_id?: string;
};

export function extractUserDirectoryUsers(payload: any): any[] {
  if (!payload) return [];
  const candidates = [
    payload.data,
    payload.users,
    payload.data?.users,
    payload.data?.data,
    payload.users?.data,
    payload.result,
    payload.result?.users,
    payload.result?.data,
  ];

  const match = candidates.find((entry) => Array.isArray(entry));
  return Array.isArray(match) ? match : [];
}

function isAbortSignal(value: unknown): value is AbortSignal {
  return (
    value !== null && typeof value === "object" && "aborted" in value
  );
}

export async function getUserDirectory(
  token: string,
  client_id: string,
  options?: UserDirectoryParams | AbortSignal,
  signal?: AbortSignal,
): Promise<any> {
  const resolvedSignal = isAbortSignal(options) ? options : signal;
  const resolvedOptions = isAbortSignal(options) ? {} : options;
  const params = new URLSearchParams({ client_id });
  if (resolvedOptions?.role) {
    params.set("role", resolvedOptions.role);
  }
  if (resolvedOptions?.scope) {
    params.set("scope", resolvedOptions.scope);
  }
  if (resolvedOptions?.regional_id) {
    params.set("regional_id", resolvedOptions.regional_id);
  }

  const url = `${buildApiUrl("/api/users/list")}?${params.toString()}`;

  const res = await fetchWithAuth(url, token, { signal: resolvedSignal });
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
  options?: { role?: string; scope?: string; regional_id?: string },
): Promise<any> {
  const params = new URLSearchParams({ client_id, periode });
  if (tanggal) params.append("tanggal", tanggal);
  if (startDate) {
    params.append("tanggal_mulai", startDate);
    params.append("start_date", startDate);
  }
  if (endDate) {
    params.append("tanggal_selesai", endDate);
    params.append("end_date", endDate);
  }
  if (options?.role) params.append("role", options.role);
  if (options?.scope) params.append("scope", options.scope);
  if (options?.regional_id) params.append("regional_id", options.regional_id);
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
  endDate?: string,
  options?: {
    role?: string;
    scope?: string;
    regional_id?: string;
    signal?: AbortSignal;
  },
): Promise<any> {
  const params = new URLSearchParams({ client_id, periode });
  if (tanggal) params.append("tanggal", tanggal);
  if (startDate) params.append("tanggal_mulai", startDate);
  if (endDate) params.append("tanggal_selesai", endDate);
  if (options?.role) params.append("role", options.role);
  if (options?.scope) params.append("scope", options.scope);
  if (options?.regional_id) params.append("regional_id", options.regional_id);
  const url = `${buildApiUrl("/api/amplify/rekap")}?${params.toString()}`;

  const res = await fetchWithAuth(url, token, { signal: options?.signal });
  if (!res.ok) throw new Error("Failed to fetch rekap amplifikasi");
  return res.json();
}

type InstagramPostFetchOptions = {
  startDate?: string;
  endDate?: string;
  limit?: number;
  scope?: string;
  role?: string;
  regional_id?: string;
  signal?: AbortSignal;
};

type InstagramPostMetrics = {
  like_count: number;
  comment_count: number;
  share_count: number;
  save_count: number;
  view_count: number;
  reach: number;
  engagement_rate: number;
  interactions: number;
  [key: string]: unknown;
};

type InstagramPostResponse = {
  posts: any[];
  data: any[];
  pagination?: any;
  raw?: any;
};

function normalizeInstagramPostRecord(post: any, index: number): any | null {
  if (!post || typeof post !== "object") {
    return null;
  }

  const metrics: Record<string, unknown> =
    post?.metrics && typeof post.metrics === "object" ? post.metrics : {};
  const likes = ensureNumber(
    post.like_count ??
      post.likes ??
      post.total_like ??
      metrics.like_count ??
      metrics.likes ??
      metrics.like ??
      metrics.total_likes,
    0,
  );
  const comments = ensureNumber(
    post.comment_count ??
      post.comments ??
      post.total_comment ??
      metrics.comment_count ??
      metrics.comments ??
      metrics.comment ??
      metrics.total_comments,
    0,
  );
  const shares = ensureNumber(
    post.share_count ??
      post.shares ??
      post.total_share ??
      metrics.share_count ??
      metrics.shares ??
      metrics.share ??
      metrics.total_shares,
    0,
  );
  const saves = ensureNumber(
    post.save_count ??
      post.saves ??
      metrics.save_count ??
      metrics.saves ??
      metrics.save,
    0,
  );
  const reach = ensureNumber(
    post.reach ??
      post.impression_count ??
      metrics.reach ??
      metrics.impressions ??
      metrics.reach_count,
    0,
  );
  const views = ensureNumber(
    post.view_count ??
      post.views ??
      post.play_count ??
      metrics.view_count ??
      metrics.views ??
      metrics.play_count ??
      metrics.played,
    0,
  );
  const engagementRate = ensureNumber(
    post.engagement_rate ??
      post.engagementRate ??
      post.engagement ??
      metrics.engagement_rate ??
      metrics.engagementRate ??
      metrics.engagement ??
      metrics.engagement_percent,
    0,
  );
  const interactionsBase = likes + comments + shares + saves;
  const interactions = ensureNumber(
    post.interactions ??
      post.interaction_count ??
      post.total_interaction ??
      post.total_engagement ??
      post.engagement_total ??
      metrics.interactions ??
      metrics.interaction_count ??
      metrics.total_interaction ??
      metrics.total_interactions ??
      metrics.total_engagement,
    interactionsBase,
  );

  const publishedSource =
    post.published_at ??
    post.publishedAt ??
    post.posted_at ??
    post.postedAt ??
    post.published_time ??
    post.publish_time ??
    post.post_date ??
    post.postDate ??
    post.timestamp ??
    post.created_at ??
    post.createdAt ??
    post.tanggal ??
    post.date ??
    metrics.published_at ??
    metrics.timestamp;

  const parsedTimestamp = publishedSource
    ? parseLocalTimestamp(String(publishedSource))
    : null;
  const isoTimestamp = parsedTimestamp
    ? parsedTimestamp.toISOString()
    : typeof publishedSource === "string"
    ? publishedSource
    : null;

  const idSource =
    post.id ??
    post.post_id ??
    post.media_id ??
    post.mediaId ??
    post.code ??
    post.shortcode ??
    post.pk ??
    `ig-post-${index + 1}`;

  const normalizedMetrics: InstagramPostMetrics = {
    like_count: likes,
    comment_count: comments,
    share_count: shares,
    save_count: saves,
    view_count: views,
    reach,
    engagement_rate: engagementRate,
    interactions,
    ...metrics,
  };

  return {
    ...post,
    id: String(idSource),
    caption: ensureString(
      post.caption ?? post.title ?? post.message ?? post.text ?? "",
      "",
    ),
    media_type: ensureString(
      post.media_type ?? post.type ?? post.content_type ?? post.format ?? "",
      "",
    ),
    type: ensureString(
      post.type ?? post.media_type ?? post.content_type ?? post.format ?? "",
      "",
    ),
    published_at: isoTimestamp ?? post.published_at ?? post.publishedAt ?? null,
    timestamp: isoTimestamp ?? post.timestamp ?? null,
    created_at: isoTimestamp ?? post.created_at ?? post.createdAt ?? null,
    activityDate: isoTimestamp ?? post.activityDate ?? post.activity_date ?? null,
    tanggal: post.tanggal ?? (isoTimestamp ? isoTimestamp.slice(0, 10) : post.tanggal),
    like_count: likes,
    comment_count: comments,
    share_count: shares,
    view_count: views,
    save_count: saves,
    reach,
    engagement_rate: engagementRate,
    interactions,
    metrics: normalizedMetrics,
  };
}

function extractInstagramPostsPayload(payload: any): any[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.posts)) {
    return payload.posts;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.records)) {
    return payload.records;
  }

  if (payload?.data) {
    return extractInstagramPostsPayload(payload.data);
  }

  return [];
}

export async function getInstagramPosts(
  token: string,
  client_id: string,
  options: InstagramPostFetchOptions = {},
): Promise<InstagramPostResponse> {
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
  if (options.scope) {
    params.append("scope", options.scope);
  }
  if (options.role) {
    params.append("role", options.role);
  }
  if (options.regional_id) {
    params.append("regional_id", options.regional_id);
  }
  const query = params.toString();
  const url = `${buildApiUrl("/api/instagram/posts")}${
    query ? `?${query}` : ""
  }`;
  const res = await fetchWithAuth(url, token, {
    signal: options.signal,
    headers: {
      "X-Cicero-Token": token,
      "X-Cicero-Reposter-Token": token,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch instagram posts: ${text}`);
  }

  const json = await res.json();
  const payload = json?.data ?? json ?? {};
  const postsRaw = extractInstagramPostsPayload(payload);
  const normalizedPosts = postsRaw
    .map((post: any, index: number) => normalizeInstagramPostRecord(post, index))
    .filter(Boolean);

  return {
    posts: normalizedPosts,
    data: normalizedPosts,
    pagination: payload?.pagination ?? json?.pagination ?? json?.meta,
    raw: payload,
  };
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
    scope?: string;
    role?: string;
    regional_id?: string;
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
  if (options.scope) {
    params.append("scope", options.scope);
  }
  if (options.role) {
    params.append("role", options.role);
  }
  if (options.regional_id) {
    params.append("regional_id", options.regional_id);
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
