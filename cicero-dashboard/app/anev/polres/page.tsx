"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useRequirePremium from "@/hooks/useRequirePremium";
import useAuth from "@/hooks/useAuth";
import {
  type DashboardAnevFilters,
  type DashboardAnevResponse,
  getDashboardAnev,
} from "@/utils/api";

type FilterFormState = Pick<DashboardAnevFilters, "time_range" | "start_date" | "end_date"> & {
  role?: string;
  scope?: string;
  regional_id?: string;
};

const TIME_RANGE_OPTIONS = ["today", "7d", "30d", "90d", "custom", "all"];

function formatNumber(value?: number) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return "0";
  return new Intl.NumberFormat("id-ID").format(Number(value));
}

function resolveNumber(source: Record<string, any>, candidates: string[], fallback = 0) {
  for (const key of candidates) {
    const value = source?.[key];
    if (typeof value === "number") return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return fallback;
}

function resolvePlatformPosts(aggregates?: DashboardAnevResponse["aggregates"]) {
  const totals = aggregates?.totals ?? {};
  const postsMap = (totals.posts as Record<string, any>) || (totals.post as Record<string, any>) || {};
  const platformsFromMap = Object.keys(postsMap).map((platform) => ({
    platform,
    posts: resolveNumber(postsMap, [platform], 0),
  }));

  if (platformsFromMap.length) return platformsFromMap;

  const fromArray = (aggregates?.platforms || []).map((entry: any) => ({
    platform: entry?.platform || entry?.name || entry?.channel || "",
    posts: resolveNumber(entry || {}, ["posts", "total_posts", "count"], 0),
  }));

  return fromArray.filter((item) => item.platform);
}

function resolveComplianceRows(aggregates?: DashboardAnevResponse["aggregates"]) {
  const raw = aggregates?.raw ?? aggregates;
  const candidates =
    raw?.compliance_per_pelaksana ||
    raw?.compliance ||
    aggregates?.totals?.compliance_per_pelaksana ||
    aggregates?.tasks;

  if (!candidates || !Array.isArray(candidates)) return [] as any[];
  return candidates.map((item: any) => ({
    name: item?.pelaksana || item?.name || item?.label || item?.executor || "-",
    assigned: resolveNumber(item || {}, ["assigned", "tugas", "expected", "total"], 0),
    completed: resolveNumber(item || {}, ["completed", "done", "finished", "selesai"], 0),
    completion_rate: typeof item?.completion_rate === "number"
      ? item?.completion_rate
      : typeof item?.completionRate === "number"
        ? item?.completionRate
        : null,
  }));
}

function computeCompletionRate(row: { assigned: number; completed: number; completion_rate?: number | null }) {
  if (typeof row.completion_rate === "number") return row.completion_rate;
  if (!row.assigned) return 0;
  return (row.completed / row.assigned) * 100;
}

export default function AnevPolresPage() {
  useRequireAuth();
  useRequirePremium();

  const { token, clientId, isHydrating, premiumTier } = useAuth();
  const [formState, setFormState] = useState<FilterFormState>({
    time_range: "7d",
    scope: "org",
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterFormState>({
    time_range: "7d",
    scope: "org",
  });
  const [data, setData] = useState<DashboardAnevResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [premiumBlocked, setPremiumBlocked] = useState<string | null>(null);
  const [badRequest, setBadRequest] = useState<string | null>(null);

  const isCustomRange = formState.time_range.toLowerCase() === "custom";
  const isCustomIncomplete =
    isCustomRange && (!formState.start_date || !formState.end_date);

  useEffect(() => {
    if (!token || !clientId || isHydrating) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setPremiumBlocked(null);
    setBadRequest(null);

    const normalizedRegional = appliedFilters.regional_id?.toUpperCase();

    getDashboardAnev(
      token,
      {
        ...appliedFilters,
        regional_id: normalizedRegional,
        client_id: clientId,
      },
      controller.signal,
    )
      .then((response) => {
        setData(response);
      })
      .catch((err: any) => {
        if (controller.signal.aborted) return;
        if (err?.status === 403) {
          const tierLabel = err?.premiumGuard?.tier || premiumTier || "";
          const expiry = err?.premiumGuard?.expires_at || err?.premiumGuard?.expiresAt;
          const message =
            err?.message ||
            "Akses premium diperlukan untuk membuka Dashboard ANEV.";
          setPremiumBlocked(
            `${message}${tierLabel ? ` (tier: ${tierLabel}${expiry ? `, expiry: ${expiry}` : ""})` : ""}`,
          );
          return;
        }
        if (err?.status === 400) {
          setBadRequest(err?.message || "Filter scope/role tidak valid.");
          return;
        }
        setError(err?.message || "Gagal memuat Dashboard ANEV Polres.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [appliedFilters, clientId, isHydrating, premiumTier, token]);

  const aggregates = data?.aggregates;
  const totals = aggregates?.totals || {};
  const totalUsers = useMemo(() => resolveNumber(totals, ["total_users", "users", "user_count", "personel"], 0), [totals]);
  const totalLikes = useMemo(() => resolveNumber(totals, ["likes", "total_likes"], 0), [totals]);
  const totalComments = useMemo(() => resolveNumber(totals, ["comments", "total_comments"], 0), [totals]);
  const expectedActions = useMemo(
    () => resolveNumber(totals, ["expected_actions", "actions", "tugas_harusnya", "expected"], 0),
    [totals],
  );

  const platformBreakdown = useMemo(() => resolvePlatformPosts(aggregates), [aggregates]);
  const complianceRows = useMemo(() => resolveComplianceRows(aggregates), [aggregates]);
  const completionRate = resolveNumber(totals, ["completion_rate", "compliance_rate", "rate"], null as any);

  const handleInputChange = (field: keyof FilterFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApply = () => {
    if (isCustomRange && (!formState.start_date || !formState.end_date)) return;
    setAppliedFilters({
      ...formState,
      regional_id: formState.regional_id?.toUpperCase(),
    });
  };

  const FilterSnapshot = () => {
    if (!data?.filters) return null;
    const filters = data.filters;
    const entries = [
      { label: "Time Range", value: filters.time_range },
      { label: "Start", value: filters.start_date },
      { label: "End", value: filters.end_date },
      { label: "Scope", value: filters.scope },
      { label: "Role", value: filters.role },
      { label: "Regional", value: filters.regional_id },
      { label: "Client", value: filters.client_id },
    ].filter((entry) => entry.value);

    if (!entries.length) return null;

    return (
      <div className="flex flex-wrap gap-2 text-sm">
        {entries.map((entry) => (
          <span
            key={`${entry.label}-${entry.value}`}
            className="rounded-full bg-slate-100 px-3 py-1 text-slate-700"
          >
            <span className="font-medium text-slate-900">{entry.label}:</span> {entry.value}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-700">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard ANEV Polres</h1>
            <p className="text-sm text-slate-600">
              Rekap aktivitas, kepatuhan, dan tugas pelaksana dengan filter waktu, scope, dan regional.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Filter</h2>
            <p className="text-sm text-slate-600">Sesuaikan rentang waktu, role, scope, dan regional untuk memuat data.</p>
          </div>
          <button
            type="button"
            onClick={handleApply}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={loading || (isCustomRange && isCustomIncomplete)}
          >
            Terapkan filter
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Time range
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              value={formState.time_range}
              onChange={(e) => handleInputChange("time_range", e.target.value)}
            >
              {TIME_RANGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          {isCustomRange && (
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              Start date
              <input
                type="date"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                value={formState.start_date || ""}
                onChange={(e) => handleInputChange("start_date", e.target.value)}
              />
            </label>
          )}

          {isCustomRange && (
            <label className="flex flex-col gap-1 text-sm text-slate-700">
              End date
              <input
                type="date"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                value={formState.end_date || ""}
                onChange={(e) => handleInputChange("end_date", e.target.value)}
              />
            </label>
          )}

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Role (opsional)
            <input
              type="text"
              placeholder="mis. operator"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              value={formState.role || ""}
              onChange={(e) => handleInputChange("role", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Scope
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
              value={formState.scope || ""}
              onChange={(e) => handleInputChange("scope", e.target.value)}
            >
              <option value="org">ORG</option>
              <option value="direktorat">DIREKTORAT</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            Regional ID (opsional)
            <input
              type="text"
              placeholder="contoh: jatim"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase text-slate-900 focus:border-blue-500 focus:outline-none"
              value={formState.regional_id || ""}
              onChange={(e) => handleInputChange("regional_id", e.target.value.toUpperCase())}
            />
            <span className="text-xs text-slate-500">Nilai akan dikirim sebagai huruf besar.</span>
          </label>
        </div>
        {isCustomRange && isCustomIncomplete && (
          <p className="mt-3 flex items-center gap-2 text-sm text-amber-700">
            <AlertCircle size={16} />
            Lengkapi tanggal mulai dan akhir untuk rentang custom.
          </p>
        )}
      </div>

      {premiumBlocked && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <ShieldAlert size={20} className="mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Akses premium diperlukan</p>
            <p className="text-sm leading-relaxed">{premiumBlocked}</p>
            <Link
              href="/premium"
              className="inline-flex w-fit items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              Daftar premium
              <Sparkles size={16} />
            </Link>
          </div>
        </div>
      )}

      {badRequest && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle size={20} className="mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Filter tidak valid</p>
            <p className="text-sm leading-relaxed">{badRequest}</p>
          </div>
        </div>
      )}

      {error && !premiumBlocked && !badRequest && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle size={20} className="mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Gagal memuat data</p>
            <p className="text-sm leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
          <Loader />
        </div>
      )}

      {!loading && data && !premiumBlocked && !badRequest && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Snapshot filter</h2>
                <p className="text-sm text-slate-600">
                  Filter aktif dari backend, termasuk scope, role, dan regional yang diterapkan.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck size={14} />
                Premium aktif
              </span>
            </div>
            <FilterSnapshot />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Total users</p>
              <p className="text-2xl font-semibold text-slate-900">{formatNumber(totalUsers)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Likes</p>
              <p className="text-2xl font-semibold text-slate-900">{formatNumber(totalLikes)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Comments</p>
              <p className="text-2xl font-semibold text-slate-900">{formatNumber(totalComments)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Expected actions</p>
              <p className="text-2xl font-semibold text-slate-900">{formatNumber(expectedActions)}</p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Posting per platform</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {platformBreakdown.length ? (
                platformBreakdown.map((item) => (
                  <div
                    key={`${item.platform}-${item.posts}`}
                    className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <p className="text-sm text-slate-600">{item.platform.toUpperCase()}</p>
                    <p className="text-xl font-semibold text-slate-900">{formatNumber(item.posts)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-600">Belum ada data platform untuk filter ini.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-semibold text-slate-900">Compliance per pelaksana</h3>
                <p className="text-sm text-slate-600">
                  Tabel kepatuhan berdasarkan pelaksana/tugas dengan completion rate.
                </p>
              </div>
              {completionRate !== null && completionRate !== undefined && (
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Completion: {formatNumber(completionRate)}%
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Pelaksana</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Tugas</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Selesai</th>
                    <th className="px-4 py-2 text-left font-semibold text-slate-700">Completion rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complianceRows.length ? (
                    complianceRows.map((row, idx) => {
                      const rate = computeCompletionRate(row);
                      return (
                        <tr key={`${row.name}-${idx}`} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                          <td className="px-4 py-3 text-slate-700">{formatNumber(row.assigned)}</td>
                          <td className="px-4 py-3 text-slate-700">{formatNumber(row.completed)}</td>
                          <td className="px-4 py-3 text-slate-700">{formatNumber(rate)}%</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="px-4 py-3 text-slate-600" colSpan={4}>
                        Tidak ada data kepatuhan untuk filter ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
