import { getApiBaseUrl } from "@/utils/api";

export const ADMIN_SYSTEM_TOKEN_KEY = "cicero_admin_system_token";

type AnyRecord = Record<string, unknown>;

function buildUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl().replace(/\/$/, "");

  // Prevent accidental double `/api/api/...` when NEXT_PUBLIC_API_URL already ends with `/api`.
  if (base.endsWith("/api") && normalized.startsWith("/api/")) {
    return `${base}${normalized.slice(4)}`;
  }

  return `${base}${normalized}`;
}

export function getAdminSystemToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_SYSTEM_TOKEN_KEY);
}

export function setAdminSystemToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_SYSTEM_TOKEN_KEY, token);
}

export function clearAdminSystemToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_SYSTEM_TOKEN_KEY);
}

async function parseResponse(res: Response): Promise<AnyRecord | null> {
  try {
    return (await res.json()) as AnyRecord;
  } catch {
    return null;
  }
}

export async function requestAdminTelegramOtp(telegramUsername: string) {
  const res = await fetch(buildUrl("/api/admin-system/auth/telegram/request"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ telegram_username: telegramUsername }),
  });

  const data = await parseResponse(res);
  if (!res.ok || data?.success === false) {
    throw new Error(String(data?.message || "Gagal mengirim OTP Telegram admin"));
  }
  return data;
}

export async function verifyAdminTelegramOtp(requestId: string, otpCode: string, telegramUsername: string) {
  const res = await fetch(buildUrl("/api/admin-system/auth/telegram/verify"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ request_id: requestId, otp_code: otpCode, telegram_username: telegramUsername }),
  });

  const data = await parseResponse(res);
  if (!res.ok || data?.success === false) {
    throw new Error(String(data?.message || "Verifikasi OTP admin gagal"));
  }
  return data;
}

// Legacy widget helpers intentionally removed from login flow.

async function fetchAdminProtected(path: string, token: string, init?: RequestInit) {
  const res = await fetch(buildUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const data = await parseResponse(res);
  if (!res.ok || data?.success === false) {
    throw new Error(String(data?.message || "Akses admin system ditolak"));
  }
  return (data?.data ?? data) as AnyRecord | AnyRecord[];
}

export async function getAdminSystemOverview(token: string) {
  return fetchAdminProtected("/api/admin-system/management/overview", token);
}

export async function getAdminSystemClientsSummary(token: string) {
  return fetchAdminProtected('/api/admin-system/management/clients/summary', token) as Promise<AnyRecord>;
}

export async function getAdminSystemFullAudit(token: string) {
  return fetchAdminProtected('/api/admin-system/management/system-audit', token) as Promise<AnyRecord>;
}

export async function getAdminSystemClients(token: string, params?: { page?: number; limit?: number; q?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.q) qs.set('q', params.q);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return fetchAdminProtected(`/api/admin-system/management/clients${suffix}`, token) as Promise<AnyRecord>;
}

export async function createAdminSystemClient(token: string, payload: AnyRecord) {
  return fetchAdminProtected('/api/admin-system/management/clients', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<AnyRecord>;
}

export async function updateAdminSystemClient(token: string, clientId: string, payload: AnyRecord) {
  return fetchAdminProtected(`/api/admin-system/management/clients/${encodeURIComponent(clientId)}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  }) as Promise<AnyRecord>;
}

export async function deleteAdminSystemClient(token: string, clientId: string) {
  return fetchAdminProtected(`/api/admin-system/management/clients/${encodeURIComponent(clientId)}`, token, {
    method: 'DELETE',
  }) as Promise<AnyRecord>;
}

export async function getAdminSystemPaymentRequests(token: string, params?: { page?: number; limit?: number; status?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.status) qs.set('status', params.status);
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return fetchAdminProtected(`/api/admin-system/management/payments/requests${suffix}`, token) as Promise<AnyRecord>;
}

export async function decideAdminSystemPaymentRequest(token: string, requestId: string, payload: { status: 'approved' | 'rejected'; note?: string }) {
  return fetchAdminProtected(`/api/admin-system/management/payments/requests/${requestId}/decision`, token, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<AnyRecord>;
}

export async function getAdminSystemFunds(token: string) {
  return fetchAdminProtected("/api/admin-system/management/funds", token);
}

export async function getFundPeriodSummary(token: string, period: "daily" | "weekly" | "monthly") {
  return fetchAdminProtected(`/api/admin-system/management/funds/summary?period=${period}`, token) as Promise<AnyRecord[]>;
}

export async function getAdminSystemConfigAnalysis(token: string) {
  return fetchAdminProtected('/api/admin-system/management/config', token) as Promise<AnyRecord>;
}

export async function previewAdminSystemConfigChange(
  token: string,
  payload: { config_key: string; config_value: string },
) {
  return fetchAdminProtected('/api/admin-system/management/config/preview', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<AnyRecord>;
}

export async function applyAdminSystemConfigChange(
  token: string,
  payload: { config_key: string; config_value: string; notes?: string; confirmation_token?: string; persist_to_env?: boolean },
) {
  return fetchAdminProtected('/api/admin-system/management/config/apply', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<AnyRecord>;
}

export async function rollbackAdminSystemConfigChange(
  token: string,
  payload: { config_key: string; target_audit_id?: string; notes?: string },
) {
  return fetchAdminProtected('/api/admin-system/management/config/rollback', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  }) as Promise<AnyRecord>;
}

export async function getAdminSystemConfigAudit(token: string, params?: { page?: number; limit?: number }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return fetchAdminProtected(`/api/admin-system/management/config/audit${suffix}`, token) as Promise<AnyRecord | AnyRecord[]>;
}

export async function getFundTransactions(token: string, params?: { page?: number; limit?: number; direction?: string; start_date?: string; end_date?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.direction) qs.set("direction", params.direction);
  if (params?.start_date) qs.set("start_date", params.start_date);
  if (params?.end_date) qs.set("end_date", params.end_date);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchAdminProtected(`/api/admin-system/management/funds/transactions${suffix}`, token) as Promise<AnyRecord[] | AnyRecord>;
}

export async function createFundTransaction(
  token: string,
  payload: { category: string; amount: number; direction: "inflow" | "outflow"; description?: string },
) {
  return fetchAdminProtected("/api/admin-system/management/funds/transactions", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFundRequests(token: string, params?: { page?: number; limit?: number; status?: string; start_date?: string; end_date?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  if (params?.start_date) qs.set("start_date", params.start_date);
  if (params?.end_date) qs.set("end_date", params.end_date);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchAdminProtected(`/api/admin-system/management/funds/requests${suffix}`, token) as Promise<AnyRecord[] | AnyRecord>;
}

export async function createFundRequest(
  token: string,
  payload: { title: string; requested_amount: number; note?: string },
) {
  return fetchAdminProtected("/api/admin-system/management/funds/requests", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function approveFundRequest(token: string, requestId: string, approvalNote?: string) {
  return fetchAdminProtected(`/api/admin-system/management/funds/requests/${requestId}/approve`, token, {
    method: "POST",
    body: JSON.stringify({ approval_note: approvalNote || null }),
  });
}

export async function rejectFundRequest(token: string, requestId: string, rejectionReason: string) {
  return fetchAdminProtected(`/api/admin-system/management/funds/requests/${requestId}/reject`, token, {
    method: "POST",
    body: JSON.stringify({ rejection_reason: rejectionReason }),
  });
}

export async function getFundAuditLogs(token: string, params?: { page?: number; limit?: number; action_type?: string; start_date?: string; end_date?: string }) {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.action_type) qs.set("action_type", params.action_type);
  if (params?.start_date) qs.set("start_date", params.start_date);
  if (params?.end_date) qs.set("end_date", params.end_date);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return fetchAdminProtected(`/api/admin-system/management/funds/audit${suffix}`, token) as Promise<AnyRecord[] | AnyRecord>;
}

export async function exportFundAuditCsv(token: string): Promise<Blob> {
  const res = await fetch(buildUrl('/api/admin-system/management/funds/audit/export.csv'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    throw new Error('Gagal export audit CSV');
  }
  return res.blob();
}
