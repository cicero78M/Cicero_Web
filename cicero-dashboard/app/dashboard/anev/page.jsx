"use client";
import useRequireAuth from "@/hooks/useRequireAuth";
import useRequirePremium from "@/hooks/useRequirePremium";
import useAuth from "@/hooks/useAuth";

export default function DashboardAnevPage() {
  useRequireAuth();
  useRequirePremium();
  const { premiumTier, premiumExpiry } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50/70 px-6 py-10 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="rounded-2xl bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 shadow-[0_16px_45px_rgba(56,189,248,0.2)] ring-1 ring-sky-100/70 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:ring-cyan-500/30">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-cyan-300">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            Anev Polres
          </h1>
          <p className="mt-3 max-w-3xl text-base text-slate-700 dark:text-slate-200">
            Ringkasan ANEV premium untuk Polres akan muncul di sini. Gunakan menu
            ini untuk mengakses rekap harian, mingguan, atau bulanan ketika paket
            premium aktif.
          </p>
          <div className="mt-4 inline-flex flex-wrap items-center gap-3 rounded-xl bg-white/60 px-4 py-2 text-sm text-slate-700 ring-1 ring-sky-100/80 backdrop-blur dark:bg-white/5 dark:text-slate-200 dark:ring-cyan-500/30">
            <span className="font-semibold text-slate-900 dark:text-white">
              Tier aktif:
            </span>
            <span className="rounded-lg bg-sky-100 px-3 py-1 font-medium text-sky-700 dark:bg-cyan-500/20 dark:text-cyan-200">
              {premiumTier || "Tidak tersedia"}
            </span>
            {premiumExpiry ? (
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Berlaku sampai: {premiumExpiry}
              </span>
            ) : (
              <span className="text-sm text-slate-600 dark:text-slate-300">
                Hubungi tim Cicero untuk memperbarui paket premium Anda.
              </span>
            )}
          </div>
        </header>

        <section className="rounded-2xl border border-dashed border-sky-200 bg-white/80 p-6 text-center shadow-[0_18px_40px_rgba(56,189,248,0.12)] backdrop-blur dark:border-cyan-500/30 dark:bg-slate-900/70 dark:text-slate-200 dark:shadow-[0_0_24px_rgba(0,0,0,0.4)]">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Konten ANEV akan segera hadir
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Tim kami sedang menyiapkan tampilan detail ANEV Polres lengkap dengan
            filter periode, unduhan Excel, dan insight kepatuhan. Jika Anda baru
            mengaktifkan paket premium, pastikan data Polres telah sinkron dengan
            client aktif Anda.
          </p>
        </section>
      </div>
    </main>
  );
}
