"use client";

import { useMemo, useState } from "react";
import PlatformEngagementTrendChart from "@/components/executive-summary/PlatformEngagementTrendChart";
import useAuth from "@/hooks/useAuth";
import useRequireAuth from "@/hooks/useRequireAuth";

const WEEK_OPTIONS = [
  { label: "Minggu 1", value: "1" },
  { label: "Minggu 2", value: "2" },
  { label: "Minggu 3", value: "3" },
  { label: "Minggu 4", value: "4" },
];

const MONTH_OPTIONS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
].map((label, index) => ({ label, value: String(index + 1) }));

const YEAR_OPTIONS = Array.from({ length: 11 }, (_, index) => {
  const year = 2025 + index;
  return { label: String(year), value: String(year) };
});

const getCurrentSelections = () => {
  const now = new Date();
  const weekOfMonth = Math.min(4, Math.max(1, Math.ceil(now.getDate() / 7)));
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return {
    week: WEEK_OPTIONS.find((option) => option.value === String(weekOfMonth))?.value ?? WEEK_OPTIONS[0].value,
    month:
      MONTH_OPTIONS.find((option) => option.value === String(month))?.value ?? MONTH_OPTIONS[0].value,
    year:
      YEAR_OPTIONS.find((option) => option.value === String(year))?.value ?? YEAR_OPTIONS[0].value,
  };
};

export default function WeeklyReportPageClient() {
  useRequireAuth();
  const { role, clientId } = useAuth();
  const [{ week: defaultWeek, month: defaultMonth, year: defaultYear }] = useState(() => getCurrentSelections());
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  const normalizedRole = useMemo(() => {
    if (role) return String(role).trim().toLowerCase();
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("user_role") || "").trim().toLowerCase();
  }, [role]);

  const normalizedClientId = useMemo(() => {
    if (clientId) return String(clientId).trim().toUpperCase();
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("client_id") || "").trim().toUpperCase();
  }, [clientId]);

  const isDitbinmasAuthorized =
    normalizedRole === "ditbinmas" && normalizedClientId === "DITBINMAS";

  const formatNumber = useMemo(
    () =>
      (value, options) => {
        const numericValue = Number.isFinite(value) ? Number(value) : 0;
        const formatter = new Intl.NumberFormat("id-ID", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
          ...(options ?? {}),
        });
        return formatter.format(Math.max(0, numericValue));
      },
    [],
  );

  const mockWeeklySeries = useMemo(() => {
    const base = Number(selectedWeek);
    const monthLabel = MONTH_OPTIONS.find((option) => option.value === selectedMonth)?.label ?? "";

    return [
      {
        key: `${selectedYear}-W${Math.max(base - 2, 1)}`,
        label: `Minggu ${Math.max(base - 2, 1)} ${monthLabel}`,
        interactions: Math.max(0, 1200 - base * 45),
        posts: Math.max(0, 18 - base),
        likes: Math.max(0, 780 - base * 28),
        comments: Math.max(0, 420 - base * 9),
      },
      {
        key: `${selectedYear}-W${Math.max(base - 1, 1)}`,
        label: `Minggu ${Math.max(base - 1, 1)} ${monthLabel}`,
        interactions: Math.max(0, 1340 - base * 30),
        posts: Math.max(0, 19 - base),
        likes: Math.max(0, 860 - base * 24),
        comments: Math.max(0, 470 - base * 7),
      },
      {
        key: `${selectedYear}-W${base}`,
        label: `Minggu ${base} ${monthLabel}`,
        interactions: Math.max(0, 1460 - base * 18),
        posts: Math.max(0, 20 - base),
        likes: Math.max(0, 930 - base * 18),
        comments: Math.max(0, 520 - base * 5),
      },
    ];
  }, [selectedWeek, selectedMonth, selectedYear]);

  const instagramLatest = mockWeeklySeries[mockWeeklySeries.length - 1] ?? null;
  const instagramPrevious = mockWeeklySeries[mockWeeklySeries.length - 2] ?? null;

  const tiktokSeries = useMemo(
    () =>
      mockWeeklySeries.map((point, index) => ({
        ...point,
        key: `${point.key}-tt`,
        label: point.label?.replace("Minggu", "TikTok Minggu"),
        interactions: Math.max(0, (point.interactions ?? 0) - 120 + index * 18),
        likes: Math.max(0, (point.likes ?? 0) - 160 + index * 14),
        comments: Math.max(0, (point.comments ?? 0) - 70 + index * 10),
      })),
    [mockWeeklySeries],
  );

  const tiktokLatest = tiktokSeries[tiktokSeries.length - 1] ?? null;
  const tiktokPrevious = tiktokSeries[tiktokSeries.length - 2] ?? null;

  const resolveActiveLabel = (options, value) => options.find((option) => option.value === value)?.label ?? "";

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50 text-slate-800">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute -right-12 bottom-12 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute inset-x-16 bottom-10 h-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(224,242,254,0.45),_rgba(255,255,255,0))] blur-2xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white/80 p-8 shadow-xl backdrop-blur">
          <div className="pointer-events-none absolute -top-16 right-12 h-40 w-40 rounded-full bg-sky-100/70 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-14 h-44 w-44 rounded-full bg-emerald-100/70 blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                  Ditbinmas Insight
                </span>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Laporan Mingguan Engagement Ditbinmas
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                  Pantau progres engagement lintas satfung Ditbinmas dengan nuansa pastel yang konsisten dengan dashboard utama. Gunakan filter di bawah ini untuk menyesuaikan periode agregasi.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Show Data By
                </span>
                <div className="grid w-full gap-2 sm:auto-cols-max sm:grid-flow-col sm:justify-end">
                  <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Minggu
                    <select
                      className="w-full min-w-[140px] rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={selectedWeek}
                      onChange={(event) => setSelectedWeek(event.target.value)}
                    >
                      {WEEK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Bulan
                    <select
                      className="w-full min-w-[160px] rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(event.target.value)}
                    >
                      {MONTH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Tahun
                    <select
                      className="w-full min-w-[130px] rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value)}
                    >
                      {YEAR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </header>
          </div>
        </section>

        {isDitbinmasAuthorized ? (
          <section className="space-y-6 rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-white via-emerald-50/80 to-sky-50/80 p-6 shadow-[0_20px_45px_rgba(45,212,191,0.15)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">
                  Tren Interaksi Mingguan
                </h2>
                <p className="text-sm text-slate-600">
                  Perbandingan performa konten mingguan berdasarkan total interaksi pada Instagram dan TikTok.
                </p>
              </div>
              <div className="rounded-full border border-emerald-100 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-500">
                {`${resolveActiveLabel(WEEK_OPTIONS, selectedWeek)} • ${resolveActiveLabel(MONTH_OPTIONS, selectedMonth)} ${resolveActiveLabel(YEAR_OPTIONS, selectedYear)}`}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <PlatformEngagementTrendChart
                platformKey="instagram"
                platformLabel="Instagram"
                series={mockWeeklySeries}
                latest={instagramLatest}
                previous={instagramPrevious}
                loading={false}
                error=""
                formatNumber={formatNumber}
              />

              <PlatformEngagementTrendChart
                platformKey="tiktok"
                platformLabel="TikTok"
                series={tiktokSeries}
                latest={tiktokLatest}
                previous={tiktokPrevious}
                loading={false}
                error=""
                formatNumber={formatNumber}
              />
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-rose-100 bg-white/70 p-8 text-center text-slate-600 shadow-lg backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl">⚠️</div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Akses Terbatas
            </h2>
            <p className="mt-2 text-sm">
              Laporan mingguan Ditbinmas hanya dapat diakses oleh pengguna dengan peran dan client ID Ditbinmas. Silakan hubungi admin untuk meminta akses.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
