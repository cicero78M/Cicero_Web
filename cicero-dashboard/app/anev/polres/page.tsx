"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  Download,
  LineChart,
  MapPin,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useRequirePremium from "@/hooks/useRequirePremium";
import useAuth from "@/hooks/useAuth";
import { type DashboardAnevFilters, type DashboardAnevResponse, getDashboardAnev } from "@/utils/api";
import { formatPremiumTierLabel } from "@/utils/premium";
import { showToast } from "@/utils/showToast";

type FilterState = Pick<DashboardAnevFilters, "time_range" | "start_date" | "end_date"> & {
  role?: string;
  scope?: string;
  regional_id?: string;
  client_id?: string;
};

type LabeledCount = { label: string; value: number };
type PlatformPost = { platform: string; posts: number };
type ComplianceRow = { pelaksana: string; assigned: number; completed: number; rate: number };
type EngagementRow = { satfung: string; posts: number; comments: number; engagement: number };
type PerformerRow = {
  name: string;
  username?: string;
  satfung?: string;
  platform: "instagram" | "tiktok";
  engagement: number;
  posts: number;
};

type IdentityEntry = {
  name: string;
  username?: string;
  satfung?: string;
};

type UnknownRecord = Record<string, unknown>;

const TIME_RANGE_OPTIONS = [
  { value: "today", label: "Harian" },
  { value: "7d", label: "Mingguan" },
  { value: "30d", label: "Bulanan" },
  { value: "90d", label: "90 Hari" },
  { value: "all", label: "Semua" },
  { value: "custom", label: "Custom" },
] as const;

function formatNumber(value: number | undefined | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return new Intl.NumberFormat("id-ID").format(value);
}

function formatPercent(value: number | undefined | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0%";
  return `${value.toFixed(1)}%`;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function getNumber(source: UnknownRecord, keys: string[], fallback = 0) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function getText(source: UnknownRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function formatDateInput(date: Date) {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().split("T")[0];
}

function buildQuickRange(timeRange: "today" | "7d" | "30d") {
  const today = new Date();
  const endDate = formatDateInput(today);
  if (timeRange === "today") {
    return { start_date: endDate, end_date: endDate };
  }

  if (timeRange === "7d") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { start_date: formatDateInput(start), end_date: endDate };
  }

  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  return { start_date: formatDateInput(start), end_date: endDate };
}

function mapPlatformPosts(data: DashboardAnevResponse | null): PlatformPost[] {
  if (!data) return [];

  const rows = (data.aggregates.platforms || [])
    .map((entry) => {
      const src = asRecord(entry);
      return {
        platform: getText(src, ["platform", "name", "channel"]),
        posts: getNumber(src, ["posts", "total_posts", "count"]),
      };
    })
    .filter((row) => row.platform);

  if (rows.length) return rows.sort((a, b) => b.posts - a.posts);

  const totals = asRecord(data.aggregates.totals);
  const posts = asRecord(totals.posts ?? totals.post);
  return Object.keys(posts)
    .map((platform) => ({
      platform,
      posts: getNumber(posts, [platform]),
    }))
    .sort((a, b) => b.posts - a.posts);
}

function buildIdentityMaps(data: DashboardAnevResponse | null) {
  const byId = new Map<string, IdentityEntry>();
  const byUsername = new Map<string, IdentityEntry>();
  if (!data) return { byId, byUsername };

  const directoryCandidates: unknown[] = [
    data.directory,
    (data.raw as UnknownRecord)?.user_directory,
    (data.raw as UnknownRecord)?.directory,
  ];

  directoryCandidates.forEach((candidate) => {
    if (!Array.isArray(candidate)) return;
    candidate.forEach((entry) => {
      const src = asRecord(entry);
      const userId = getText(src, ["user_id", "userId", "id"]);
      const username = getText(src, ["username", "handle", "account"]);
      const name = getText(src, ["display_name", "full_name", "nama", "name"], "");
      const satfung = getText(src, ["divisi", "division", "satfung"]);
      const identity: IdentityEntry = {
        name: name || username || "Tanpa Nama",
        username: username || undefined,
        satfung: satfung || undefined,
      };
      if (userId) byId.set(userId, identity);
      if (username) byUsername.set(username.toLowerCase(), identity);
    });
  });

  return { byId, byUsername };
}

function mapCompliance(data: DashboardAnevResponse | null): ComplianceRow[] {
  if (!data) return [];
  const identityMaps = buildIdentityMaps(data);

  const totals = asRecord(data.aggregates.totals);
  const candidates = [
    totals.compliance_per_pelaksana,
    (data.aggregates.raw as UnknownRecord)?.compliance_per_pelaksana,
    (data.aggregates.raw as UnknownRecord)?.compliance,
  ];

  const rows = candidates.find((entry) => Array.isArray(entry));
  if (!Array.isArray(rows)) return [];

  return rows
    .map((entry) => {
      const src = asRecord(entry);
      const userId = getText(src, ["user_id", "userId", "id"]);
      const username = getText(src, ["username", "handle", "account"]);
      const identity =
        (userId ? identityMaps.byId.get(userId) : undefined) ||
        (username ? identityMaps.byUsername.get(username.toLowerCase()) : undefined);
      const assigned = getNumber(src, ["assigned", "total_actions", "total", "expected"]);
      const completed = getNumber(src, ["completed", "done", "total_actions", "selesai"]);
      const rateRaw = getNumber(src, ["completion_rate", "completionRate"], Number.NaN);
      const rate = Number.isFinite(rateRaw)
        ? rateRaw <= 1
          ? rateRaw * 100
          : rateRaw
        : assigned > 0
          ? (completed / assigned) * 100
          : 0;
      return {
        pelaksana: getText(
          src,
          ["display_name", "full_name", "nama", "pelaksana", "name", "label"],
          identity?.name || "-",
        ),
        assigned,
        completed,
        rate,
      };
    })
    .sort((a, b) => b.rate - a.rate);
}

function normalizeLabeledArray(candidate: unknown, valueKeys: string[]): LabeledCount[] {
  if (Array.isArray(candidate)) {
    return candidate
      .map((entry) => {
        const src = asRecord(entry);
        const label = getText(src, ["satfung", "division", "divisi", "label", "name"]);
        if (!label) return null;
        return { label, value: getNumber(src, valueKeys) };
      })
      .filter((row): row is LabeledCount => Boolean(row));
  }

  const src = asRecord(candidate);
  return Object.keys(src).map((key) => {
    const valueSource = asRecord(src[key]);
    const value = Object.keys(valueSource).length
      ? getNumber(valueSource, valueKeys)
      : getNumber({ value: src[key] }, ["value"]);
    return { label: key, value };
  });
}

function mapUserPerSatfung(data: DashboardAnevResponse | null): LabeledCount[] {
  if (!data) return [];
  const candidates = [
    data.aggregates.user_per_satfung,
    data.aggregates.users_per_satfung,
    data.aggregates.satfung_breakdown,
    data.aggregates.division_breakdown,
    asRecord(data.aggregates.totals).user_per_satfung,
  ];

  for (const candidate of candidates) {
    const rows = normalizeLabeledArray(candidate, ["count", "users", "total", "value"]);
    if (rows.length) return rows.sort((a, b) => b.value - a.value);
  }
  return [];
}

function mapInstagramLikesPerSatfung(data: DashboardAnevResponse | null): LabeledCount[] {
  if (!data) return [];
  const totals = asRecord(data.aggregates.totals);
  const rows = normalizeLabeledArray(totals.likes_per_satfung, ["likes", "total_likes", "value", "count"]);
  return rows.sort((a, b) => b.value - a.value);
}

function mapTiktokPerSatfung(data: DashboardAnevResponse | null): EngagementRow[] {
  if (!data) return [];
  const totals = asRecord(data.aggregates.totals);
  const candidates = [totals.tiktok_per_satfung, totals.tiktok_per_divisi, totals.tiktok_per_division];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const rows = candidate
      .map((entry) => {
        const src = asRecord(entry);
        const satfung = getText(src, ["satfung", "division", "divisi", "label", "name"]);
        if (!satfung) return null;
        return {
          satfung,
          posts: getNumber(src, ["posts", "total_posts", "count"]),
          comments: getNumber(src, ["comments", "total_comments", "engagement"]),
          engagement: getNumber(src, ["engagement", "comments", "total_comments"]),
        };
      })
      .filter((row): row is EngagementRow => Boolean(row));

    if (rows.length) return rows.sort((a, b) => b.engagement - a.engagement);
  }

  return [];
}

function mapTopPerformers(data: DashboardAnevResponse | null): PerformerRow[] {
  if (!data) return [];
  const identityMaps = buildIdentityMaps(data);

  const normalizePerUser = (
    rows: unknown,
    platform: "instagram" | "tiktok",
  ): PerformerRow[] => {
    if (!Array.isArray(rows)) return [];
    return rows
      .map((entry) => {
        const src = asRecord(entry);
        const userId = getText(src, ["user_id", "userId", "id"]);
        const username = getText(src, ["username", "handle", "account"]);
        const identity =
          (userId ? identityMaps.byId.get(userId) : undefined) ||
          (username ? identityMaps.byUsername.get(username.toLowerCase()) : undefined);
        const likes = getNumber(src, ["likes", "total_likes"]);
        const comments = getNumber(src, ["comments", "total_comments"]);
        const shares = getNumber(src, ["shares", "total_shares"]);
        const engagement = getNumber(src, ["engagement", "total_engagement"], likes + comments + shares);
        const name = getText(
          src,
          ["display_name", "full_name", "nama", "name"],
          identity?.name || username || "Tanpa Nama",
        );
        return {
          name,
          username: username || identity?.username,
          satfung: getText(src, ["divisi", "division", "satfung"], identity?.satfung || ""),
          platform,
          engagement,
          posts: getNumber(src, ["posts", "total_posts", "count"]),
        };
      })
      .sort((a, b) => b.engagement - a.engagement);
  };

  const igRows = normalizePerUser(data.instagram_engagement?.per_user, "instagram");
  const tkRows = normalizePerUser(data.tiktok_engagement?.per_user, "tiktok");

  return [...igRows, ...tkRows].sort((a, b) => b.engagement - a.engagement).slice(0, 10);
}

function makeExportRows(data: DashboardAnevResponse) {
  const totals = asRecord(data.aggregates.totals);
  const filters = data.filters;
  const context = {
    time_range: filters.time_range,
    start_date: filters.start_date || "",
    end_date: filters.end_date || "",
    role: filters.role || "",
    scope: filters.scope || "",
    regional_id: filters.regional_id || "",
    client_id: filters.client_id || "",
  };

  const rows: Array<Record<string, string | number>> = [
    { section: "ringkasan", metric: "total_users", value: getNumber(totals, ["total_users"]), ...context },
    { section: "ringkasan", metric: "total_likes", value: getNumber(totals, ["likes", "total_likes"]), ...context },
    {
      section: "ringkasan",
      metric: "total_comments",
      value: getNumber(totals, ["comments", "total_comments"]),
      ...context,
    },
    {
      section: "ringkasan",
      metric: "expected_actions",
      value: getNumber(totals, ["expected_actions"]),
      ...context,
    },
  ];

  mapPlatformPosts(data).forEach((entry) => {
    rows.push({ section: "posting_per_platform", platform: entry.platform, posts: entry.posts, ...context });
  });

  mapCompliance(data).forEach((entry) => {
    rows.push({
      section: "compliance_per_pelaksana",
      pelaksana: entry.pelaksana,
      assigned: entry.assigned,
      completed: entry.completed,
      completion_rate: Number(entry.rate.toFixed(2)),
      ...context,
    });
  });

  mapUserPerSatfung(data).forEach((entry) => {
    rows.push({ section: "user_per_satfung", satfung: entry.label, users: entry.value, ...context });
  });

  mapInstagramLikesPerSatfung(data).forEach((entry) => {
    rows.push({ section: "instagram_likes_per_satfung", satfung: entry.label, likes: entry.value, ...context });
  });

  mapTiktokPerSatfung(data).forEach((entry) => {
    rows.push({
      section: "tiktok_per_satfung",
      satfung: entry.satfung,
      posts: entry.posts,
      comments: entry.comments,
      engagement: entry.engagement,
      ...context,
    });
  });

  return rows;
}

function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-200">
      <div
        className="h-2.5 rounded-full bg-blue-600 transition-all"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

export default function AnevPolresPage() {
  useRequireAuth();
  const premiumStatus = useRequirePremium();
  const { token, clientId, role, effectiveRole, effectiveClientType, regionalId, premiumTier, isHydrating, isProfileLoading } =
    useAuth();

  const [filters, setFilters] = useState<FilterState>({ time_range: "7d" });
  const [data, setData] = useState<DashboardAnevResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    setFilters((prev) => {
      if (prev.client_id && prev.role && prev.scope) return prev;
      const defaultScope = (effectiveClientType || "").toLowerCase().includes("direktorat")
        ? "direktorat"
        : "org";
      return {
        ...prev,
        client_id: prev.client_id || clientId,
        role: prev.role || effectiveRole || role || undefined,
        scope: prev.scope || defaultScope,
        regional_id: prev.regional_id || regionalId || undefined,
      };
    });
  }, [clientId, role, effectiveRole, effectiveClientType, regionalId]);

  const loadData = useCallback(
    async (input: FilterState) => {
      if (!token) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await getDashboardAnev(token, {
          time_range: input.time_range,
          start_date: input.start_date,
          end_date: input.end_date,
          role: input.role,
          scope: input.scope,
          regional_id: input.regional_id,
          client_id: input.client_id || clientId || "",
        });
        setData(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Gagal memuat data ANEV Polres.";
        setError(message);
        showToast(message, "error");
      } finally {
        setIsLoading(false);
      }
    },
    [token, clientId],
  );

  useEffect(() => {
    if (!token || !filters.client_id || !filters.role || premiumStatus !== "premium") return;
    void loadData(filters);
  }, [token, filters, premiumStatus, loadData]);

  const metrics = useMemo(() => {
    const totals = asRecord(data?.aggregates?.totals);
    const igPosts = getNumber(asRecord(totals.posts), ["instagram"], getNumber(asRecord(data?.aggregates), ["instagram_posts"]));
    const tkPosts = getNumber(asRecord(totals.posts), ["tiktok"], getNumber(asRecord(data?.aggregates), ["tiktok_posts"]));
    const likes = getNumber(totals, ["likes", "total_likes"], getNumber(asRecord(data?.aggregates), ["total_likes"]));
    const comments = getNumber(totals, ["comments", "total_comments"], getNumber(asRecord(data?.aggregates), ["total_comments"]));
    const totalUsers = getNumber(totals, ["total_users"], getNumber(asRecord(data?.aggregates), ["total_users"]));
    const expected = getNumber(totals, ["expected_actions"], getNumber(asRecord(data?.aggregates), ["expected_actions"]));
    const compliance = expected > 0 ? ((likes + comments) / expected) * 100 : 0;

    return {
      totalUsers,
      igPosts,
      tkPosts,
      likes,
      comments,
      compliance,
    };
  }, [data]);

  const platformPosts = useMemo(() => mapPlatformPosts(data), [data]);
  const complianceRows = useMemo(() => mapCompliance(data), [data]);
  const usersBySatfung = useMemo(() => mapUserPerSatfung(data), [data]);
  const igLikesBySatfung = useMemo(() => mapInstagramLikesPerSatfung(data), [data]);
  const tiktokBySatfung = useMemo(() => mapTiktokPerSatfung(data), [data]);
  const topPerformers = useMemo(() => mapTopPerformers(data), [data]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (filters.time_range === "custom" && (!filters.start_date || !filters.end_date)) {
      showToast("Untuk custom, isi tanggal mulai dan tanggal akhir.", "error");
      return;
    }
    await loadData(filters);
  };

  const handleQuickRange = async (range: "today" | "7d" | "30d") => {
    const quick = buildQuickRange(range);
    const next: FilterState = {
      ...filters,
      time_range: range,
      start_date: quick.start_date,
      end_date: quick.end_date,
    };
    setFilters(next);
    await loadData(next);
  };

  const handleExport = async () => {
    if (!data) return;
    setIsExporting(true);
    try {
      const rows = makeExportRows(data);
      if (!rows.length) {
        showToast("Belum ada data untuk diekspor.", "error");
        return;
      }

      const response = await fetch("/api/dashboard/anev/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          fileName: `anev-polres-${data.filters.client_id || "client"}-${data.filters.time_range || "custom"}`,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Gagal mengekspor data ANEV.");
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `anev-polres-${data.filters.time_range || "custom"}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(downloadUrl);
      showToast("Export Excel berhasil diunduh.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengekspor data ANEV.";
      showToast(message, "error");
    } finally {
      setIsExporting(false);
    }
  };

  if (isHydrating || isProfileLoading || premiumStatus === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (premiumStatus !== "premium") {
    return (
      <section className="mx-auto max-w-3xl px-4 py-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="mb-2 flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            <p className="font-semibold">Akses Premium Diperlukan</p>
          </div>
          <p className="text-sm text-amber-800">
            Dashboard ANEV Polres hanya tersedia untuk paket premium. Paket Anda saat ini: {formatPremiumTierLabel(premiumTier)}.
          </p>
          <Link
            href="/premium/anev"
            className="mt-4 inline-flex items-center rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Lihat Paket Premium
          </Link>
        </div>
      </section>
    );
  }

  return (
    <main className="space-y-6 px-4 py-6 md:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" /> ANEV POLRES
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Dashboard ANEV yang lebih ringkas & fokus aksi</h1>
            <p className="mt-1 text-sm text-slate-600">
              Alur kerja: pilih periode → cek capaian utama → analisis satfung/divisi → tindak lanjuti → export laporan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadData(filters)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCcw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button
              type="button"
              onClick={() => void handleExport()}
              disabled={!data || isExporting}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <Download className={`h-4 w-4 ${isExporting ? "animate-pulse" : ""}`} /> Export Excel
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleQuickRange("today")}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Quick Harian
          </button>
          <button
            type="button"
            onClick={() => void handleQuickRange("7d")}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Quick Mingguan
          </button>
          <button
            type="button"
            onClick={() => void handleQuickRange("30d")}
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            Quick Bulanan
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Periode</span>
            <select
              value={filters.time_range}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  time_range: event.target.value,
                  ...(event.target.value !== "custom" ? { start_date: undefined, end_date: undefined } : {}),
                }))
              }
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {TIME_RANGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Role</span>
            <input
              value={filters.role || ""}
              onChange={(event) => setFilters((prev) => ({ ...prev, role: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="mis. DITBINMAS"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Scope</span>
            <select
              value={filters.scope || "org"}
              onChange={(event) => setFilters((prev) => ({ ...prev, scope: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="org">ORG</option>
              <option value="direktorat">Direktorat</option>
            </select>
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium text-slate-700">Regional</span>
            <input
              value={filters.regional_id || ""}
              onChange={(event) => setFilters((prev) => ({ ...prev, regional_id: event.target.value.toUpperCase() }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              placeholder="REGIONAL"
            />
          </label>

          {filters.time_range === "custom" && (
            <>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Mulai</span>
                <input
                  type="date"
                  value={filters.start_date || ""}
                  onChange={(event) => setFilters((prev) => ({ ...prev, start_date: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-medium text-slate-700">Selesai</span>
                <input
                  type="date"
                  value={filters.end_date || ""}
                  onChange={(event) => setFilters((prev) => ({ ...prev, end_date: event.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </>
          )}

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <CalendarClock className="h-4 w-4" /> Terapkan
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Personel Aktif</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(metrics.totalUsers)}</p>
          <p className="mt-2 text-xs text-slate-500">Jumlah user terpetakan dalam periode</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posting Instagram</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(metrics.igPosts)}</p>
          <p className="mt-2 text-xs text-slate-500">Total posting sumber IG</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posting TikTok</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(metrics.tkPosts)}</p>
          <p className="mt-2 text-xs text-slate-500">Total posting sumber TikTok</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interaksi</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(metrics.likes + metrics.comments)}</p>
          <p className="mt-2 text-xs text-slate-500">Likes + komentar terakumulasi</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kepatuhan</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatPercent(metrics.compliance)}</p>
          <p className="mt-2 text-xs text-slate-500">Rasio realisasi terhadap expected actions</p>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <LineChart className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Aktivitas per Platform</h2>
          </div>
          <div className="space-y-3">
            {platformPosts.length ? (
              platformPosts.map((row) => (
                <div key={row.platform}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">{row.platform.toUpperCase()}</span>
                    <span className="text-slate-900">{formatNumber(row.posts)} posting</span>
                  </div>
                  <ProgressBar
                    value={
                      platformPosts[0]?.posts > 0
                        ? (row.posts / platformPosts[0].posts) * 100
                        : 0
                    }
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Belum ada data platform pada periode ini.</p>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Kepatuhan Pelaksana</h2>
          </div>
          <div className="space-y-3">
            {complianceRows.length ? (
              complianceRows.slice(0, 8).map((row) => (
                <div key={`${row.pelaksana}-${row.assigned}`} className="rounded-lg border border-slate-100 p-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <p className="font-medium text-slate-800">{row.pelaksana}</p>
                    <p className="text-slate-700">{formatPercent(row.rate)}</p>
                  </div>
                  <ProgressBar value={row.rate} />
                  <p className="mt-1 text-xs text-slate-500">
                    Selesai {formatNumber(row.completed)} dari {formatNumber(row.assigned)} tugas
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Belum ada data kepatuhan pelaksana.</p>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Sebaran Personel per Satfung</h2>
          </div>
          <ul className="space-y-2">
            {usersBySatfung.length ? (
              usersBySatfung.slice(0, 8).map((row) => (
                <li key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{row.label}</span>
                  <span className="font-semibold text-slate-900">{formatNumber(row.value)}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">Data satfung belum tersedia.</li>
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900">Instagram Likes per Satfung</h2>
          </div>
          <ul className="space-y-2">
            {igLikesBySatfung.length ? (
              igLikesBySatfung.slice(0, 8).map((row) => (
                <li key={row.label} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{row.label}</span>
                  <span className="font-semibold text-slate-900">{formatNumber(row.value)}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">Data likes per satfung belum tersedia.</li>
            )}
          </ul>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <LineChart className="h-4 w-4 text-blue-600" />
            <h2 className="font-semibold text-slate-900">TikTok Engagement per Satfung</h2>
          </div>
          <ul className="space-y-2">
            {tiktokBySatfung.length ? (
              tiktokBySatfung.slice(0, 8).map((row) => (
                <li key={row.satfung} className="text-sm">
                  <p className="font-medium text-slate-700">{row.satfung}</p>
                  <p className="text-slate-500">
                    Post {formatNumber(row.posts)} • Komentar {formatNumber(row.comments)} • Engagement {formatNumber(row.engagement)}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500">Data TikTok per satfung belum tersedia.</li>
            )}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Top Performer (Gabungan IG + TikTok)</h2>
        {topPerformers.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Personel</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Satfung</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Platform</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Posts</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topPerformers.map((row, index) => (
                  <tr key={`${row.name}-${row.platform}-${index}`}>
                    <td className="px-3 py-2 text-slate-800">
                      <p className="font-medium">{row.name}</p>
                      {row.username ? <p className="text-xs text-slate-500">@{row.username}</p> : null}
                    </td>
                    <td className="px-3 py-2 text-slate-600">{row.satfung || "-"}</td>
                    <td className="px-3 py-2 uppercase text-slate-600">{row.platform}</td>
                    <td className="px-3 py-2 text-right text-slate-800">{formatNumber(row.posts)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatNumber(row.engagement)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Belum ada data performer untuk periode ini.</p>
        )}
      </section>
    </main>
  );
}
