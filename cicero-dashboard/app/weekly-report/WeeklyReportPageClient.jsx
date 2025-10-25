"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import useAuth from "@/hooks/useAuth";
import useRequireAuth from "@/hooks/useRequireAuth";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
];

export default function WeeklyReportPageClient() {
  useRequireAuth();
  const { role, clientId } = useAuth();
  const [activeRange, setActiveRange] = useState("week");

  const normalizedRole = useMemo(() => {
    if (role) return String(role).trim().toLowerCase();
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("user_role") || "")
      .trim()
      .toLowerCase();
  }, [role]);

  const normalizedClientId = useMemo(() => {
    if (clientId) return String(clientId).trim().toUpperCase();
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("client_id") || "")
      .trim()
      .toUpperCase();
  }, [clientId]);

  const isDitbinmasAuthorized =
    normalizedRole === "ditbinmas" || normalizedClientId === "DITBINMAS";

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

              <div className="flex flex-col gap-2 sm:items-end">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Show Data By
                </span>
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-slate-50/80 p-1">
                  {VIEW_OPTIONS.map(({ label, value }) => {
                    const isActive = activeRange === value;
                    return (
                      <Button
                        key={value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => setActiveRange(value)}
                        className={cn(
                          "rounded-full px-5 py-2 text-sm font-semibold transition-all",
                          isActive
                            ? "bg-[color:var(--cicero-soft-emerald-ink)] text-white shadow-[0_10px_30px_rgba(45,212,191,0.35)] hover:bg-[color:var(--cicero-soft-emerald-ink)]"
                            : "border border-transparent bg-white/70 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700",
                        )}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </header>
          </div>
        </section>

        {isDitbinmasAuthorized ? (
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-lg backdrop-blur">
              <div className="pointer-events-none absolute -right-16 top-12 h-36 w-36 rounded-full bg-emerald-100/80 blur-3xl" />
              <div className="pointer-events-none absolute -left-14 bottom-10 h-32 w-32 rounded-full bg-sky-100/60 blur-2xl" />
              <div className="relative space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">
                  Ringkasan KPI Ditbinmas ({VIEW_OPTIONS.find((opt) => opt.value === activeRange)?.label})
                </h2>
                <p className="text-sm leading-relaxed text-slate-600">
                  Placeholder komponen rekap engagement akan ditempatkan di sini. Setiap grafik akan menyorot tingkat kepatuhan likes, komentar, dan amplifikasi lintas satfung sesuai periode terpilih.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 text-sm text-slate-700 shadow-inner">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-500">
                      Capaian Likes
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">—%</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Akan otomatis terisi berdasarkan rekap harian Ditbinmas.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 text-sm text-slate-700 shadow-inner">
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-500">
                      Partisipasi Komentar
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">—%</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Placeholder untuk insight komentar lintas polres.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white/70 p-6 shadow-lg backdrop-blur">
              <div className="pointer-events-none absolute -top-12 left-14 h-32 w-32 rounded-full bg-sky-100/70 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 right-14 h-36 w-36 rounded-full bg-emerald-100/70 blur-3xl" />
              <div className="relative space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Agenda Tindak Lanjut
                </h2>
                <p className="text-sm text-slate-600">
                  Daftar tindakan korektif dan apresiasi akan muncul di sini berdasarkan data engagement mingguan. Gunakan insight ini untuk memandu briefing Ditbinmas berikutnya.
                </p>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                    <span className="text-lg">📈</span>
                    <span>Placeholder analitik tren kenaikan interaksi polres prioritas.</span>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-3">
                    <span className="text-lg">🛠️</span>
                    <span>Rencana intervensi bagi satfung dengan capaian engagement terendah.</span>
                  </li>
                  <li className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                    <span className="text-lg">🤝</span>
                    <span>Kolaborasi lintas kanal yang akan diprioritaskan minggu depan.</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-3xl border border-rose-100 bg-white/70 p-8 text-center text-slate-600 shadow-lg backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl">⚠️</div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Akses Terbatas
            </h2>
            <p className="mt-2 text-sm">
              Laporan mingguan Ditbinmas hanya dapat diakses oleh peran Ditbinmas atau client ID DITBINMAS. Silakan hubungi admin untuk meminta akses.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
