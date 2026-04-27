"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useRequirePremium from "@/hooks/useRequirePremium";
import useAuth from "@/hooks/useAuth";
import { getDashboardAnev, type DashboardAnevResponse } from "@/utils/api";
import { formatPremiumTierLabel } from "@/utils/premium";
import { showToast } from "@/utils/showToast";
import { useCallback, useEffect, useState } from "react";
import { Suspense } from "react";

type UnknownRecord = Record<string, unknown>;
type IdentityEntry = {
  name: string;
  username?: string;
  satfung?: string;
};
const PAGE_SIZE = 50;

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" ? (value as UnknownRecord) : {};
}

function getText(source: UnknownRecord, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
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

function formatNumber(value: number | undefined | null) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  return new Intl.NumberFormat("id-ID").format(value);
}

function normalizeHandleValue(raw?: string) {
  if (!raw) return "";
  const trimmed = String(raw).trim();
  if (!trimmed) return "";
  const ig = trimmed.match(/instagram\.com\/(?:p\/|reel\/)?@?([A-Za-z0-9._-]+)/i)?.[1];
  const tk = trimmed.match(/tiktok\.com\/@?([A-Za-z0-9._-]+)/i)?.[1];
  return (ig || tk || trimmed).replace(/^@+/, "").replace(/\/$/, "").toLowerCase();
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
        .map((item) => normalizeHandleValue(item))
        .filter(Boolean)
        .forEach((key) => byUsername.set(key, identity));
    });
  });

  return { byId, byUsername };
}

function mapTopPerformerRows(data: DashboardAnevResponse | null) {
  if (!data) return [] as Array<Record<string, string | number>>;
  const identityMaps = buildIdentityMaps(data);
  const byIdentity = new Map<string, { name: string; username?: string; satfung?: string; likesIg: number; commentsTiktok: number }>();

  const ingest = (rows: unknown, metric: "likesIg" | "commentsTiktok") => {
    if (!Array.isArray(rows)) return;
    rows.forEach((entry) => {
      const src = asRecord(entry);
      const userId = getText(src, ["user_id", "userId", "id"]);
      const username = getText(src, ["username", "handle", "account"]);
      const normalizedUsername = normalizeHandleValue(username);
      const identity =
        (userId ? identityMaps.byId.get(userId) : undefined) ||
        (normalizedUsername ? identityMaps.byUsername.get(normalizedUsername) : undefined);
      const isUnmapped = Boolean(src.unmapped || src.is_unmapped || src.unrecognized);
      const explicitName = getText(src, ["display_name", "full_name", "nama", "name"]);
      if (isUnmapped && !identity?.name && !explicitName) return;

      const name = getText(
        src,
        ["display_name", "full_name", "nama", "name"],
        identity?.name || username || userId || "User",
      );
      const satfung = getText(src, ["divisi", "division", "satfung"], identity?.satfung || "-");
      const value = metric === "likesIg"
        ? getNumber(src, ["likes", "total_likes", "engagement", "total_engagement"])
        : getNumber(src, ["comments", "total_comments", "engagement", "total_engagement"]);

      const key = userId || normalizedUsername || normalizeHandleValue(identity?.username) || normalizeHandleValue(name);
      if (!key) return;

      const existing = byIdentity.get(key);
      if (existing) {
        if (metric === "likesIg") existing.likesIg += value;
        else existing.commentsTiktok += value;
        if (!existing.username && (username || identity?.username)) existing.username = username || identity?.username;
        if ((!existing.satfung || existing.satfung === "-") && satfung) existing.satfung = satfung;
        if ((!existing.name || existing.name === existing.username) && name) existing.name = name;
        return;
      }

      byIdentity.set(key, {
        name,
        username: username || identity?.username,
        satfung,
        likesIg: metric === "likesIg" ? value : 0,
        commentsTiktok: metric === "commentsTiktok" ? value : 0,
      });
    });
  };

  ingest(data.instagram_engagement?.per_user, "likesIg");
  ingest(data.tiktok_engagement?.per_user, "commentsTiktok");

  return Array.from(byIdentity.values())
    .map((row) => ({
      personel: row.name,
      username: row.username ? `@${normalizeHandleValue(row.username) || row.username.replace(/^@+/, "")}` : "",
      satfung: row.satfung || "-",
      likes_ig: row.likesIg,
      komentar_tiktok: row.commentsTiktok,
      total_interaksi: row.likesIg + row.commentsTiktok,
    }))
    .sort((a, b) => Number(b.total_interaksi) - Number(a.total_interaksi));
}

function getViewConfig(view: string) {
  const normalized = (view || "ringkasan").toLowerCase();
  switch (normalized) {
    case "platform_posts":
      return { title: "Detail Aktivitas per Platform", key: "platform_posts" as const };
    case "compliance":
      return { title: "Detail Kepatuhan Pelaksana", key: "compliance" as const };
    case "user_satfung":
      return { title: "Detail Sebaran Personel per Satfung", key: "user_satfung" as const };
    case "ig_satfung":
      return { title: "Detail Instagram Likes per Satfung", key: "ig_satfung" as const };
    case "tiktok_satfung":
      return { title: "Detail TikTok Komentar per Satfung", key: "tiktok_satfung" as const };
    case "top_performer":
      return { title: "Detail Top Performer", key: "top_performer" as const };
    default:
      return { title: "Ringkasan Dashboard ANEV", key: "ringkasan" as const };
  }
}

function AnevPolresDetailContent() {
  useRequireAuth();
  const premiumStatus = useRequirePremium();
  const { token, clientId, premiumTier, isHydrating, isProfileLoading } = useAuth();
  const searchParams = useSearchParams();

  const [data, setData] = useState<DashboardAnevResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const view = searchParams.get("view") || "ringkasan";
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const [isExporting, setIsExporting] = useState(false);

  const filters = useMemo(
    () => ({
      time_range: searchParams.get("time_range") || "7d",
      start_date: searchParams.get("start_date") || undefined,
      end_date: searchParams.get("end_date") || undefined,
      role: searchParams.get("role") || undefined,
      scope: searchParams.get("scope") || undefined,
      regional_id: searchParams.get("regional_id") || undefined,
      client_id: searchParams.get("client_id") || clientId || "",
    }),
    [searchParams, clientId],
  );

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await getDashboardAnev(token, filters);
      setData(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat detail ANEV.";
      setError(message);
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    if (!token || !filters.client_id || !filters.role || premiumStatus !== "premium") return;
    void loadData();
  }, [token, filters, premiumStatus, loadData]);

  const viewConfig = getViewConfig(view);

  const rows = useMemo<Array<Record<string, string | number>>>(() => {
    if (!data) return [];
    const totals = asRecord(data.aggregates?.totals);
    const aggregates = asRecord(data.aggregates);
    const aggregatesRecord = asRecord(data.aggregates as unknown);
    const requestedPlatform = (searchParams.get("platform") || "").toLowerCase();

    if (viewConfig.key === "ringkasan") {
      return [
        { metric: "Total Users", value: getNumber(totals, ["total_users"], getNumber(aggregates, ["total_users"])) },
        { metric: "Posting Instagram", value: getNumber(asRecord(totals.posts), ["instagram"], getNumber(aggregates, ["instagram_posts"])) },
        { metric: "Posting TikTok", value: getNumber(asRecord(totals.posts), ["tiktok"], getNumber(aggregates, ["tiktok_posts"])) },
        { metric: "Total Likes", value: getNumber(totals, ["likes", "total_likes"], getNumber(aggregates, ["total_likes"])) },
        { metric: "Total Komentar", value: getNumber(totals, ["comments", "total_comments"], getNumber(aggregates, ["total_comments"])) },
        { metric: "Expected Actions", value: getNumber(totals, ["expected_actions"], getNumber(aggregates, ["expected_actions"])) },
      ];
    }

    if (viewConfig.key === "platform_posts") {
      const platforms = Array.isArray(data.aggregates.platforms) ? data.aggregates.platforms : [];
      const taskMap = asRecord((data.raw as UnknownRecord)?.platform_tasks);
      const mapped = platforms.flatMap((entry) => {
        const src = asRecord(entry);
        const platform = getText(src, ["platform", "name", "channel"]).toLowerCase();
        if (!platform) return [];
        if (requestedPlatform && platform !== requestedPlatform) return [];
        const tasks = Array.isArray(taskMap[platform]) ? (taskMap[platform] as unknown[]) : [];
        if (!tasks.length) {
          return [{ platform, task_id: "-", task_link: "-" }];
        }
        return tasks.map((task) => {
          const taskSrc = asRecord(task);
          return {
            platform,
            task_id: getText(taskSrc, ["task_id", "shortcode", "video_id"], "-"),
            task_link: getText(taskSrc, ["task_link", "link", "url"], "-"),
          };
        });
      });
      return mapped;
    }

    if (viewConfig.key === "compliance") {
      const candidates = [
        totals.compliance_per_pelaksana,
        (aggregates.raw as UnknownRecord)?.compliance_per_pelaksana,
        (aggregates.raw as UnknownRecord)?.compliance,
      ];
      const list = candidates.find((entry) => Array.isArray(entry));
      if (!Array.isArray(list)) return [];
      return list.map((entry) => {
        const src = asRecord(entry);
        const assigned = getNumber(src, ["assigned", "expected_actions", "expected", "tasks", "total"]);
        const completed = getNumber(src, ["completed", "total_actions", "done", "selesai"]);
        const rate = assigned > 0 ? (completed / assigned) * 100 : 0;
        return {
          pelaksana: getText(src, ["display_name", "full_name", "nama", "name", "pelaksana"], "-"),
          total_tugas: assigned,
          selesai: completed,
          likes_ig: getNumber(src, ["likes", "total_likes"]),
          komentar_tiktok: getNumber(src, ["comments", "total_comments"]),
          completion_rate: `${rate.toFixed(1)}%`,
        };
      });
    }

    if (viewConfig.key === "user_satfung") {
      const list = Array.isArray(data.aggregates.user_per_satfung)
        ? data.aggregates.user_per_satfung
        : Array.isArray(totals.user_per_satfung)
          ? totals.user_per_satfung
          : [];
      return list.map((entry) => {
        const src = asRecord(entry);
        return {
          satfung: getText(src, ["satfung", "division", "divisi", "label", "name"], "-"),
          personil: getNumber(src, ["count", "users", "total", "value"]),
        };
      });
    }

    if (viewConfig.key === "ig_satfung") {
      const list = Array.isArray(aggregatesRecord.likes_per_satfung)
        ? (aggregatesRecord.likes_per_satfung as unknown[])
        : Array.isArray(totals.likes_per_satfung)
          ? (totals.likes_per_satfung as unknown[])
          : [];
      return list.map((entry) => {
        const src = asRecord(entry);
        return {
          satfung: getText(src, ["satfung", "division", "divisi", "label", "name"], "-"),
          jumlah_personil_satfung: getNumber(src, ["total_personnel", "personnel_total", "personil_total"]),
          pelaksana_likes: getNumber(src, ["active_personnel", "personnel_active", "personil_aktif"]),
          post_tugas_instagram: getNumber(src, ["task_count", "assigned", "posts", "total_posts"]),
          total_likes: getNumber(src, ["likes", "total_likes", "value", "count"]),
        };
      });
    }

    if (viewConfig.key === "tiktok_satfung") {
      const list = Array.isArray(aggregatesRecord.tiktok_per_satfung)
        ? (aggregatesRecord.tiktok_per_satfung as unknown[])
        : Array.isArray(totals.tiktok_per_satfung)
          ? (totals.tiktok_per_satfung as unknown[])
          : [];
      return list.map((entry) => {
        const src = asRecord(entry);
        return {
          satfung: getText(src, ["satfung", "division", "divisi", "label", "name"], "-"),
          jumlah_personil_satfung: getNumber(src, ["total_personnel", "personnel_total", "personil_total"]),
          pelaksana_komentar: getNumber(src, ["active_personnel", "personnel_active", "personil_aktif"]),
          post_tugas_tiktok: getNumber(src, ["task_count", "assigned", "posts", "total_posts"]),
          total_komentar: getNumber(src, ["comments", "total_comments", "engagement"]),
        };
      });
    }

      return mapTopPerformerRows(data);
  }, [data, viewConfig.key, searchParams]);

  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const baseQuery = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    return params;
  }, [searchParams]);

  const pageHref = (nextPage: number) => {
    const params = new URLSearchParams(baseQuery.toString());
    params.set("page", String(nextPage));
    return `?${params.toString()}`;
  };

  const handleExportCurrentView = useCallback(async () => {
    if (!rows.length) {
      showToast("Belum ada data untuk diekspor.", "error");
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch("/api/dashboard/anev/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          fileName: `anev-polres-${(viewConfig.key || "detail").toLowerCase()}-${filters.time_range || "custom"}`,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Gagal mengekspor file Excel.");
      }

      const blob = await response.blob();

      const fileBase = `${(viewConfig.key || "detail").toLowerCase()}-${filters.time_range || "custom"}`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `anev-polres-${fileBase}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      showToast("File Excel berhasil diunduh.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal mengekspor file Excel.";
      showToast(message, "error");
    } finally {
      setIsExporting(false);
    }
  }, [rows, viewConfig.key, filters.time_range]);

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
          <p className="font-semibold text-amber-700">Akses Premium Diperlukan ({formatPremiumTierLabel(premiumTier)})</p>
        </div>
      </section>
    );
  }

  const columns = pagedRows.length ? Object.keys(pagedRows[0]) : [];

  return (
    <main className="space-y-6 px-4 py-6 md:px-6">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">ANEV POLRES · DETAIL</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">{viewConfig.title}</h1>
            <p className="mt-1 text-sm text-slate-600">Menampilkan seluruh data kategori dengan pagination otomatis tiap 50 baris.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleExportCurrentView()}
              disabled={isExporting || !rows.length}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isExporting ? "Menyiapkan..." : "Download Excel"}
            </button>
            <Link href="/anev/polres" className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </section>

      {error ? <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</section> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between text-sm text-slate-600">
          <span>Total baris: <span className="font-semibold text-slate-900">{formatNumber(totalRows)}</span></span>
          <span>Halaman {safePage} / {totalPages}</span>
        </div>

        {isLoading ? (
          <div className="flex min-h-[200px] items-center justify-center"><Loader /></div>
        ) : pagedRows.length ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-3 py-2 text-left font-semibold text-slate-600">
                      {column.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagedRows.map((row, index) => (
                  <tr key={index} className="hover:bg-slate-50/60">
                    {columns.map((column) => {
                      const value = row[column];
                      const text = typeof value === "number" ? formatNumber(value) : String(value ?? "-");
                      const isLink = column.includes("link") && text.startsWith("http");
                      return (
                        <td key={column} className="max-w-[420px] px-3 py-2 align-top text-slate-700">
                          {isLink ? (
                            <a href={text} target="_blank" rel="noreferrer" className="break-all text-blue-700 hover:text-blue-800 hover:underline">
                              {text}
                            </a>
                          ) : (
                            <span className="break-words">{text}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">Belum ada data untuk kategori ini.</p>
        )}

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between">
            <Link
              href={safePage > 1 ? pageHref(safePage - 1) : "#"}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ${safePage > 1 ? "border border-slate-300 text-slate-700 hover:bg-slate-50" : "cursor-not-allowed border border-slate-200 text-slate-400"}`}
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </Link>
            <Link
              href={safePage < totalPages ? pageHref(safePage + 1) : "#"}
              className={`inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-semibold ${safePage < totalPages ? "border border-slate-300 text-slate-700 hover:bg-slate-50" : "cursor-not-allowed border border-slate-200 text-slate-400"}`}
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default function AnevPolresDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader />
        </div>
      }
    >
      <AnevPolresDetailContent />
    </Suspense>
  );
}
