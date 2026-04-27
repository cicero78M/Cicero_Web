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
import {
  type DashboardAnevFilters,
  type DashboardAnevResponse,
  exportDashboardAnevExcel,
  getDashboardAnev,
} from "@/utils/api";
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
type InstagramSatfungRow = {
  satfung: string;
  totalPersonnel: number;
  activePersonnel: number;
  totalLikes: number;
};
type TiktokSatfungRow = {
  satfung: string;
  totalPersonnel: number;
  activePersonnel: number;
  totalComments: number;
};
type PerformerRow = {
  name: string;
  userId?: string;
  username?: string;
  satfung?: string;
  likesIg: number;
  commentsTiktok: number;
  totalEngagement: number;
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

function formatDateLabel(value?: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "short", year: "numeric" }).format(date);
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

function normalizeHandleValue(raw?: string) {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  const ig = trimmed.match(/instagram\.com\/(?:p\/|reel\/)?@?([A-Za-z0-9._-]+)/i)?.[1];
  const tk = trimmed.match(/tiktok\.com\/@?([A-Za-z0-9._-]+)/i)?.[1];
  return (ig || tk || trimmed).replace(/^@+/, "").replace(/\/$/, "").toLowerCase();
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
      const igHandle = getText(src, ["instagram", "insta", "instagram_username"]);
      const tkHandle = getText(src, ["tiktok", "tiktok_username"]);
      const kontak = asRecord(src.kontak_sosial);
      const kontakIg = getText(kontak, ["instagram"]);
      const kontakTk = getText(kontak, ["tiktok"]);
      const name = getText(src, ["display_name", "full_name", "nama", "name"], "");
      const satfung = getText(src, ["divisi", "division", "satfung"]);
      const identity: IdentityEntry = {
        name: name || username || userId || "User",
        username: username || undefined,
        satfung: satfung || undefined,
      };
      if (userId) byId.set(userId, identity);

      [username, igHandle, tkHandle, kontakIg, kontakTk]
        .map((entry) => normalizeHandleValue(entry))
        .filter(Boolean)
        .forEach((key) => byUsername.set(key, identity));
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
        (username ? identityMaps.byUsername.get(normalizeHandleValue(username)) : undefined);
      const assigned = getNumber(src, ["assigned", "expected_actions", "expected", "tasks", "total"]);
      const completed = getNumber(src, ["completed", "total_actions", "done", "selesai"]);
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

function mapInstagramLikesPerSatfung(data: DashboardAnevResponse | null): InstagramSatfungRow[] {
  if (!data) return [];
  const totals = asRecord(data.aggregates.totals);
  const usersBySatfung = mapUserPerSatfung(data);
  const totalPersonnelMap = new Map(usersBySatfung.map((row) => [row.label, row.value]));

  if (Array.isArray(totals.likes_per_satfung)) {
    const rows = totals.likes_per_satfung
      .map((entry) => {
        const src = asRecord(entry);
        const satfung = getText(src, ["satfung", "division", "divisi", "label", "name"]);
        if (!satfung) return null;
        const totalLikes = getNumber(src, ["likes", "total_likes", "value", "count"]);
        const totalPersonnel = getNumber(src, ["total_personnel", "personnel_total", "personil_total"], totalPersonnelMap.get(satfung) || 0);
        const activePersonnel = getNumber(src, ["active_personnel", "personnel_active", "personil_aktif", "liked_personnel", "personnel_likes"], totalLikes > 0 ? totalPersonnel : 0);
        return {
          satfung,
          totalPersonnel,
          activePersonnel,
          totalLikes,
        };
      })
      .filter((row): row is InstagramSatfungRow => Boolean(row));
    return rows.sort((a, b) => b.totalLikes - a.totalLikes);
  }

  return normalizeLabeledArray(totals.likes_per_satfung, ["likes", "total_likes", "value", "count"])
    .map((row) => ({
      satfung: row.label,
      totalPersonnel: totalPersonnelMap.get(row.label) || 0,
      activePersonnel: row.value > 0 ? totalPersonnelMap.get(row.label) || 0 : 0,
      totalLikes: row.value,
    }))
    .sort((a, b) => b.totalLikes - a.totalLikes);
}

function mapTiktokPerSatfung(data: DashboardAnevResponse | null): TiktokSatfungRow[] {
  if (!data) return [];
  const totals = asRecord(data.aggregates.totals);
  const candidates = [totals.tiktok_per_satfung, totals.tiktok_per_divisi, totals.tiktok_per_division];
  const usersBySatfung = mapUserPerSatfung(data);
  const totalPersonnelMap = new Map(usersBySatfung.map((row) => [row.label, row.value]));

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) continue;
    const rows = candidate
      .map((entry) => {
        const src = asRecord(entry);
        const satfung = getText(src, ["satfung", "division", "divisi", "label", "name"]);
        if (!satfung) return null;
        const totalComments = getNumber(src, ["comments", "total_comments", "engagement"]);
        const totalPersonnel = getNumber(src, ["total_personnel", "personnel_total", "personil_total"], totalPersonnelMap.get(satfung) || 0);
        const activePersonnel = getNumber(src, ["active_personnel", "personnel_active", "personil_aktif", "commented_personnel", "personnel_comments"], totalComments > 0 ? totalPersonnel : 0);
        return {
          satfung,
          totalPersonnel,
          activePersonnel,
          totalComments,
        };
      })
      .filter((row): row is TiktokSatfungRow => Boolean(row));

    if (rows.length) return rows.sort((a, b) => b.totalComments - a.totalComments);
  }

  return [];
}

function mapTopPerformers(data: DashboardAnevResponse | null): PerformerRow[] {
  if (!data) return [];
  const identityMaps = buildIdentityMaps(data);

  const merged = new Map<string, PerformerRow>();

  const upsertPerformer = (
    entry: unknown,
    metric: "likesIg" | "commentsTiktok",
  ) => {
    const src = asRecord(entry);
    const userId = getText(src, ["user_id", "userId", "id"]);
    const username = getText(src, ["username", "handle", "account"]);
    const identity =
      (userId ? identityMaps.byId.get(userId) : undefined) ||
      (username ? identityMaps.byUsername.get(normalizeHandleValue(username)) : undefined);
    const explicitName = getText(src, ["display_name", "full_name", "nama", "name"]);
    const isUnmapped = Boolean(src.unmapped || src.is_unmapped || src.unrecognized);
    if (isUnmapped && !identity?.name && !explicitName) return;

    const key = userId || normalizeHandleValue(username) || normalizeHandleValue(identity?.username) || explicitName;
    if (!key) return;

    const name = getText(
      src,
      ["display_name", "full_name", "nama", "name"],
      identity?.name || username || userId || "User",
    );
    const satfung = getText(src, ["divisi", "division", "satfung"], identity?.satfung || "");
    const value = metric === "likesIg"
      ? getNumber(src, ["likes", "total_likes", "engagement", "total_engagement"])
      : getNumber(src, ["comments", "total_comments", "engagement", "total_engagement"]);

    const existing = merged.get(key);
    if (existing) {
      existing.likesIg += metric === "likesIg" ? value : 0;
      existing.commentsTiktok += metric === "commentsTiktok" ? value : 0;
      existing.totalEngagement = existing.likesIg + existing.commentsTiktok;
      if (!existing.satfung && satfung) existing.satfung = satfung;
      if (!existing.username && (username || identity?.username)) {
        existing.username = username || identity?.username;
      }
      return;
    }

    const likesIg = metric === "likesIg" ? value : 0;
    const commentsTiktok = metric === "commentsTiktok" ? value : 0;
    merged.set(key, {
      name,
      userId: userId || undefined,
      username: username || identity?.username,
      satfung,
      likesIg,
      commentsTiktok,
      totalEngagement: likesIg + commentsTiktok,
    });
  };

  if (Array.isArray(data.instagram_engagement?.per_user)) {
    data.instagram_engagement.per_user.forEach((row) => upsertPerformer(row, "likesIg"));
  }
  if (Array.isArray(data.tiktok_engagement?.per_user)) {
    data.tiktok_engagement.per_user.forEach((row) => upsertPerformer(row, "commentsTiktok"));
  }

  return Array.from(merged.values())
    .sort((a, b) => b.totalEngagement - a.totalEngagement)
    .slice(0, 10);
}

function ProgressBar({ value }: { value: number }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-800">
      <div
        className="h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

function getQualityMeta(score: number) {
  if (score >= 80) {
    return {
      label: "Excellent",
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      card: "border-emerald-200/70 bg-emerald-50/40",
    };
  }
  if (score >= 50) {
    return {
      label: "Moderate",
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      card: "border-amber-200/70 bg-amber-50/40",
    };
  }
  return {
    label: "Low",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    card: "border-rose-200/70 bg-rose-50/40",
  };
}

function getPerformerQuality(totalEngagement: number) {
  if (totalEngagement >= 300) return getQualityMeta(90);
  if (totalEngagement >= 120) return getQualityMeta(65);
  return getQualityMeta(35);
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
    const overallRate = getNumber(totals, ["overall_completion_rate"], Number.NaN);
    const compliance = Number.isFinite(overallRate)
      ? (overallRate <= 1 ? overallRate * 100 : overallRate)
      : expected > 0 && totalUsers > 0
        ? ((likes + comments) / (expected * totalUsers)) * 100
        : 0;

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
  const platformPostMap = useMemo(
    () => new Map(platformPosts.map((row) => [row.platform.toLowerCase(), row.posts])),
    [platformPosts],
  );
  const instagramPostTotal = platformPostMap.get("instagram") || metrics.igPosts;
  const tiktokPostTotal = platformPostMap.get("tiktok") || metrics.tkPosts;
  const complianceRows = useMemo(() => mapCompliance(data), [data]);
  const usersBySatfung = useMemo(() => mapUserPerSatfung(data), [data]);
  const igLikesBySatfung = useMemo(() => mapInstagramLikesPerSatfung(data), [data]);
  const tiktokBySatfung = useMemo(() => mapTiktokPerSatfung(data), [data]);
  const topPerformers = useMemo(() => mapTopPerformers(data), [data]);
  const periodLabel = useMemo(() => {
    if (filters.time_range === "custom") {
      return `${formatDateLabel(filters.start_date)} - ${formatDateLabel(filters.end_date)}`;
    }
    const selected = TIME_RANGE_OPTIONS.find((option) => option.value === filters.time_range);
    return selected?.label || "Mingguan";
  }, [filters.time_range, filters.start_date, filters.end_date]);

  const buildDetailHref = (view: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams({ view, time_range: filters.time_range || "7d" });
    if (filters.start_date) params.set("start_date", filters.start_date);
    if (filters.end_date) params.set("end_date", filters.end_date);
    if (filters.role) params.set("role", filters.role);
    if (filters.scope) params.set("scope", filters.scope);
    if (filters.regional_id) params.set("regional_id", filters.regional_id);
    if (filters.client_id || clientId) params.set("client_id", filters.client_id || clientId || "");
    if (extra) {
      Object.entries(extra).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
    }
    return `/anev/polres/detail?${params.toString()}`;
  };

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
    if (!data || !token) return;
    setIsExporting(true);
    try {
      const result = await exportDashboardAnevExcel(
        token,
        {
          time_range: filters.time_range,
          start_date: filters.start_date,
          end_date: filters.end_date,
          role: filters.role,
          scope: filters.scope,
          regional_id: filters.regional_id,
          client_id: filters.client_id || clientId || "",
        },
      );

      const downloadUrl = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = result.filename || `anev-polres-${filters.time_range || "custom"}.xlsx`;
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
    <main className="space-y-6 bg-slate-50/70 px-4 py-6 md:px-6 dark:bg-slate-950/30">
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" /> ANEV POLRES
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Dashboard ANEV yang lebih ringkas & fokus aksi</h1>
            <p className="mt-1 text-sm text-slate-600">
              Alur kerja: pilih periode → cek capaian utama → analisis satfung/divisi → tindak lanjuti → export laporan.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">Periode: <span className="font-semibold text-slate-800">{periodLabel}</span></span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">Client: <span className="font-semibold text-slate-800">{filters.client_id || clientId || "-"}</span></span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">Role: <span className="font-semibold text-slate-800">{filters.role || "-"}</span></span>
            </div>
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

      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
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
        <article className="rounded-2xl border border-blue-200/70 bg-gradient-to-br from-white to-blue-50 p-4 shadow-[0_12px_35px_-24px_rgba(37,99,235,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Personel Aktif</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(metrics.totalUsers)}</p>
          <p className="mt-2 text-xs text-slate-500">Jumlah user terpetakan dalam periode</p>
          <Link href={buildDetailHref("ringkasan")} className="mt-3 inline-flex text-xs font-semibold text-blue-700 hover:text-blue-800">
            Lihat detail →
          </Link>
        </article>

        <article className="rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-white to-indigo-50 p-4 shadow-[0_12px_35px_-24px_rgba(79,70,229,0.42)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posting Instagram</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(metrics.igPosts)}</p>
          <p className="mt-2 text-xs text-slate-500">Total posting sumber IG</p>
          <Link href={buildDetailHref("platform_posts", { platform: "instagram" })} className="mt-3 inline-flex text-xs font-semibold text-blue-700 hover:text-blue-800">
            Lihat detail →
          </Link>
        </article>

        <article className="rounded-2xl border border-violet-200/70 bg-gradient-to-br from-white to-violet-50 p-4 shadow-[0_12px_35px_-24px_rgba(124,58,237,0.4)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Posting TikTok</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(metrics.tkPosts)}</p>
          <p className="mt-2 text-xs text-slate-500">Total posting sumber TikTok</p>
          <Link href={buildDetailHref("platform_posts", { platform: "tiktok" })} className="mt-3 inline-flex text-xs font-semibold text-blue-700 hover:text-blue-800">
            Lihat detail →
          </Link>
        </article>

        <article className="rounded-2xl border border-cyan-200/70 bg-gradient-to-br from-white to-cyan-50 p-4 shadow-[0_12px_35px_-24px_rgba(8,145,178,0.42)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interaksi</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatNumber(metrics.likes + metrics.comments)}</p>
          <p className="mt-2 text-xs text-slate-500">Likes + komentar terakumulasi</p>
          <Link href={buildDetailHref("top_performer")} className="mt-3 inline-flex text-xs font-semibold text-blue-700 hover:text-blue-800">
            Lihat detail →
          </Link>
        </article>

        <article className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-white to-emerald-50 p-4 shadow-[0_12px_35px_-24px_rgba(5,150,105,0.42)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kepatuhan</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{formatPercent(metrics.compliance)}</p>
          <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getQualityMeta(metrics.compliance).badge}`}>
            {getQualityMeta(metrics.compliance).label}
          </span>
          <p className="mt-2 text-xs text-slate-500">Rasio realisasi terhadap expected actions</p>
          <Link href={buildDetailHref("compliance")} className="mt-3 inline-flex text-xs font-semibold text-blue-700 hover:text-blue-800">
            Lihat detail →
          </Link>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-blue-600" />
              <h2 className="font-semibold text-slate-900">Aktivitas per Platform</h2>
            </div>
            <Link href={buildDetailHref("platform_posts")} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              Lihat semua →
            </Link>
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

        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <h2 className="font-semibold text-slate-900">Kepatuhan Pelaksana</h2>
            </div>
            <Link href={buildDetailHref("compliance")} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              Lihat semua →
            </Link>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Excellent ≥ 80%</span>
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">Moderate 50–79%</span>
            <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700">Low &lt; 50%</span>
          </div>
          <div className="space-y-3">
            {complianceRows.length ? (
              complianceRows.slice(0, 8).map((row) => {
                const quality = getQualityMeta(row.rate);
                return (
                <div key={`${row.pelaksana}-${row.assigned}`} className={`rounded-lg border p-3 ${quality.card}`}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <p className="font-medium text-slate-800">{row.pelaksana}</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${quality.badge}`}>
                        {quality.label}
                      </span>
                      <p className="text-slate-700">{formatPercent(row.rate)}</p>
                    </div>
                  </div>
                  <ProgressBar value={row.rate} />
                  <p className="mt-1 text-xs text-slate-500">
                    Selesai {formatNumber(row.completed)} dari {formatNumber(row.assigned)} tugas
                  </p>
                </div>
              );
              })
            ) : (
              <p className="text-sm text-slate-500">Belum ada data kepatuhan pelaksana.</p>
            )}
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <h2 className="font-semibold text-slate-900">Sebaran Personel per Satfung</h2>
            </div>
            <Link href={buildDetailHref("user_satfung")} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
              Lihat semua →
            </Link>
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

        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <h2 className="font-semibold text-slate-900">Instagram Likes per Satfung</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500">Post IG: {formatNumber(instagramPostTotal)}</span>
              <Link href={buildDetailHref("ig_satfung")} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                Lihat semua →
              </Link>
            </div>
          </div>
          {igLikesBySatfung.length ? (
            <>
              <div className="space-y-2 md:hidden">
                {igLikesBySatfung.slice(0, 8).map((row) => (
                  <div key={row.satfung} className="rounded-lg border border-slate-100 p-3 text-sm">
                    <p className="font-semibold text-slate-800">{row.satfung}</p>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <p>Personil: <span className="font-semibold text-slate-800">{formatNumber(row.totalPersonnel)}</span></p>
                      <p>Pelaksana: <span className="font-semibold text-slate-800">{formatNumber(row.activePersonnel)}</span></p>
                    </div>
                    <p className="mt-2 text-right text-sm font-semibold text-slate-900">Likes: {formatNumber(row.totalLikes)}</p>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Satfung</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Personil</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Pelaksana Likes</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Total Likes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {igLikesBySatfung.slice(0, 8).map((row) => (
                    <tr key={row.satfung}>
                      <td className="px-3 py-2 text-slate-700">{row.satfung}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatNumber(row.totalPersonnel)}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatNumber(row.activePersonnel)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatNumber(row.totalLikes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Data likes per satfung belum tersedia.</p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <LineChart className="h-4 w-4 text-blue-600" />
              <h2 className="font-semibold text-slate-900">TikTok Komentar per Satfung</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-slate-500">Post TikTok: {formatNumber(tiktokPostTotal)}</span>
              <Link href={buildDetailHref("tiktok_satfung")} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
                Lihat semua →
              </Link>
            </div>
          </div>
          {tiktokBySatfung.length ? (
            <>
              <div className="space-y-2 md:hidden">
                {tiktokBySatfung.slice(0, 8).map((row) => (
                  <div key={row.satfung} className="rounded-lg border border-slate-100 p-3 text-sm">
                    <p className="font-semibold text-slate-800">{row.satfung}</p>
                    <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-600">
                      <p>Personil: <span className="font-semibold text-slate-800">{formatNumber(row.totalPersonnel)}</span></p>
                      <p>Pelaksana: <span className="font-semibold text-slate-800">{formatNumber(row.activePersonnel)}</span></p>
                    </div>
                    <p className="mt-2 text-right text-sm font-semibold text-slate-900">Komentar: {formatNumber(row.totalComments)}</p>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-slate-600">Satfung</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Personil</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Pelaksana Komentar</th>
                    <th className="px-3 py-2 text-right font-semibold text-slate-600">Total Komentar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tiktokBySatfung.slice(0, 8).map((row) => (
                    <tr key={row.satfung}>
                      <td className="px-3 py-2 text-slate-700">{row.satfung}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatNumber(row.totalPersonnel)}</td>
                      <td className="px-3 py-2 text-right text-slate-700">{formatNumber(row.activePersonnel)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatNumber(row.totalComments)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">Data TikTok per satfung belum tersedia.</p>
          )}
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_35px_-24px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Top Performer (Gabungan IG + TikTok)</h2>
          <Link href={buildDetailHref("top_performer")} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
            Lihat semua →
          </Link>
        </div>
        {topPerformers.length ? (
          <>
            <div className="space-y-2 md:hidden">
              {topPerformers.map((row, index) => {
                const quality = getPerformerQuality(row.totalEngagement);
                return (
                <div key={`${row.name}-${row.userId || row.username || index}`} className={`rounded-lg border p-3 text-sm ${quality.card}`}>
                  <p className="font-semibold text-slate-800">{row.name || row.username || row.userId || "User"}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <p className="text-xs text-slate-500">{row.username ? `@${row.username}` : ""}</p>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${quality.badge}`}>
                      {quality.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Satfung: <span className="font-medium text-slate-800">{row.satfung || "-"}</span></p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <p className="rounded bg-slate-50 px-2 py-1 text-center">IG {formatNumber(row.likesIg)}</p>
                    <p className="rounded bg-slate-50 px-2 py-1 text-center">TT {formatNumber(row.commentsTiktok)}</p>
                    <p className="rounded bg-blue-50 px-2 py-1 text-center font-semibold text-blue-700">{formatNumber(row.totalEngagement)}</p>
                  </div>
                </div>
              );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Personel</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Satfung</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Likes IG</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Komentar TikTok</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Total Interaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topPerformers.map((row, index) => {
                  const quality = getPerformerQuality(row.totalEngagement);
                  return (
                    <tr key={`${row.name}-${row.userId || row.username || index}`}>
                      <td className="px-3 py-2 text-slate-800">
                        <p className="font-medium">{row.name || row.username || row.userId || "User"}</p>
                        {row.username ? <p className="text-xs text-slate-500">@{row.username}</p> : null}
                        <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${quality.badge}`}>
                          {quality.label}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">{row.satfung || "-"}</td>
                      <td className="px-3 py-2 text-right text-slate-800">{formatNumber(row.likesIg)}</td>
                      <td className="px-3 py-2 text-right text-slate-800">{formatNumber(row.commentsTiktok)}</td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-900">{formatNumber(row.totalEngagement)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">Belum ada data performer untuk periode ini.</p>
        )}
      </section>
    </main>
  );
}
