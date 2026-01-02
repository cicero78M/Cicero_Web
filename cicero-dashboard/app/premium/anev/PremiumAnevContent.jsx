"use client";

import Link from "next/link";
import { FilePieChart, ShieldCheck, Sparkles } from "lucide-react";
import useRequireAuth from "@/hooks/useRequireAuth";

const highlights = [
  {
    title: "Terbuka untuk Premium 1 & 3",
    description:
      "Halaman /anev/polres tetap memakai guard premium sehingga hanya tier Premium 1 atau Premium 3 yang bisa mengakses dashboard ANEV.",
    icon: ShieldCheck,
  },
  {
    title: "Rangkuman ANEV lintas periode",
    description:
      "Snapshot harian, mingguan, bulanan, maupun rentang kustom membantu mengecek kepatuhan Polres sebelum batas waktu laporan.",
    icon: FilePieChart,
  },
  {
    title: "CTA khusus Anev Polres",
    description:
      "Arahkan tim langsung ke alur pendaftaran premium Anev tanpa bentrok dengan menu Premium umum di sidebar.",
    icon: Sparkles,
  },
];

export default function PremiumAnevContent() {
  useRequireAuth();

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-sky-200/60 bg-gradient-to-br from-white via-sky-50 to-indigo-50 p-8 shadow-[0_25px_65px_-35px_rgba(56,189,248,0.5)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 shadow-inner ring-1 ring-sky-100">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Premium Anev
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-sky-800">
              Aktifkan Anev Polres Premium
            </h1>
            <p className="max-w-3xl text-sm text-slate-600 md:text-base">
              Dapatkan akses penuh ke ANEV Polres (harian, mingguan, bulanan, hingga custom range)
              lengkap dengan ekspor Excel dan narasi otomatis untuk pimpinan. Akses dilindungi oleh
              guard premium agar hanya pelanggan terverifikasi yang bisa membuka dashboard /anev/polres.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/premium/register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_-12px_rgba(79,70,229,0.55)] transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
              >
                Ajukan akses premium Anev
              </Link>
              <Link
                href="/premium"
                className="inline-flex items-center justify-center rounded-xl border border-sky-100/70 bg-white/80 px-5 py-3 text-sm font-semibold text-sky-700 shadow-inner transition hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
              >
                Lihat fitur premium lainnya
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-sky-100/70 bg-white/80 p-5 shadow-inner md:max-w-sm">
            <div className="flex items-center gap-3">
              <FilePieChart className="h-6 w-6 text-indigo-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Anev Polres</p>
                <p className="text-sm font-semibold text-slate-800">Premium guard aktif</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>• Tier Premium 1 atau Premium 3 membuka dashboard ANEV secara penuh.</p>
              <p>• Pengguna lain diarahkan ke halaman CTA premium tanpa menumpuk tautan /premium.</p>
              <p>• Ekspor Excel dan filter waktu tetap tersedia setelah guard lolos.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.title}
              className="flex flex-col gap-3 rounded-2xl border border-sky-100/80 bg-white/80 p-5 shadow-[0_18px_45px_-30px_rgba(56,189,248,0.55)] backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 via-white to-indigo-100 text-sky-700 shadow-inner ring-1 ring-sky-50">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold text-slate-800">{item.title}</h2>
              </div>
              <p className="text-sm text-slate-600">{item.description}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-3xl border border-indigo-100/80 bg-white/80 p-7 shadow-[0_20px_55px_-35px_rgba(99,102,241,0.55)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-indigo-700">Siapkan tim untuk ANEV Premium</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Setelah permintaan premium disetujui, gunakan menu sidebar Anev Polres untuk membuka
              dashboard berisi filter waktu, tabel satfung/divisi, dan ekspor Excel yang sudah
              terkunci ke guard premium.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/premium/register"
              className="inline-flex items-center justify-center rounded-xl border border-indigo-100/70 bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(99,102,241,0.65)] transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
            >
              Ajukan paket Premium 1/3
            </Link>
            <Link
              href="/anev/polres"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-inner transition hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
            >
              Lihat alur ANEV (guarded)
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
