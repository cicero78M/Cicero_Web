"use client";

import Link from "next/link";
import {
  AlarmClock,
  CalendarRange,
  FileSpreadsheet,
  MessageCircle,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import useRequireAuth from "@/hooks/useRequireAuth";

const features = [
  {
    title: "Recap otomatis via WA Bot",
    description:
      "WA Bot mengirim recap ke nomor dashboard terdaftar sehingga pimpinan selalu menerima ringkasan tanpa membuka dashboard.",
    icon: MessageCircle,
  },
  {
    title: "Jadwal recap 15:00 / 18:00 / 20:30",
    description:
      "Pengiriman recap terjadwal memastikan update sore dan malam selalu tersampaikan sebelum batas akhir tugas.",
    icon: AlarmClock,
  },
  {
    title: "Halaman ANEV lengkap",
    description:
      "Akses halaman ANEV harian, mingguan, bulanan, hingga rentang kustom untuk monitoring lintas periode.",
    icon: CalendarRange,
  },
  {
    title: "Unduhan Excel fleksibel",
    description:
      "Setiap periode ANEV dapat diunduh ke Excel untuk pelaporan formal atau analisis lanjutan.",
    icon: FileSpreadsheet,
  },
  {
    title: "Panduan khusus operator",
    description:
      "Dokumentasi dan alur kerja operator premium untuk memastikan distribusi tugas dan eskalasi berjalan rapi.",
    icon: NotebookPen,
  },
  {
    title: "Workflow siap pakai",
    description:
      "Bot, dashboard, dan rekap terhubung otomatis sehingga tim tinggal mengikuti alur yang sudah teruji.",
    icon: Workflow,
  },
];

export default function PremiumContent() {
  useRequireAuth();

  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-3xl border border-sky-200/60 bg-gradient-to-br from-white via-sky-50 to-indigo-50 p-8 shadow-[0_25px_65px_-35px_rgba(56,189,248,0.5)]">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-600 shadow-inner ring-1 ring-sky-100">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              Premium
            </div>
            <h1 className="text-3xl font-semibold leading-tight text-sky-800">
              Paket Premium Cicero
            </h1>
            <p className="max-w-3xl text-sm text-slate-600 md:text-base">
              Nikmati recap otomatis via WA Bot, halaman ANEV siap unduh, dan panduan operator yang
              dirancang untuk memastikan absensi digital berjalan lancar setiap hari.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/premium/register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_-12px_rgba(79,70,229,0.55)] transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
              >
                Daftar Sekarang
              </Link>
              <Link
                href="/premium/register"
                className="inline-flex items-center justify-center rounded-xl border border-sky-100/70 bg-white/80 px-5 py-3 text-sm font-semibold text-sky-700 shadow-inner transition hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
              >
                Lihat alur pendaftaran
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-sky-100/70 bg-white/80 p-5 shadow-inner md:max-w-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">WA Bot</p>
                <p className="text-sm font-semibold text-slate-800">Recap otomatis ke dashboard number</p>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <p>• Nomor WA dashboard terdaftar menerima recap tugas harian.</p>
              <p>• Pesan dikirim otomatis pada 15:00, 18:00, dan 20:30.</p>
              <p>• Termasuk rangkuman KPI, data absensi, dan tindak lanjut.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className="flex flex-col gap-3 rounded-2xl border border-sky-100/80 bg-white/80 p-5 shadow-[0_18px_45px_-30px_rgba(56,189,248,0.55)] backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-100 via-white to-indigo-100 text-sky-700 shadow-inner ring-1 ring-sky-50">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold text-slate-800">{feature.title}</h2>
              </div>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-3xl border border-indigo-100/80 bg-white/80 p-7 shadow-[0_20px_55px_-35px_rgba(99,102,241,0.55)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-indigo-700">Alur Recap Premium</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Semua recap dikirim ke nomor WA dashboard yang terdaftar. Pastikan nomor tersebut aktif
              dan tidak memblokir pesan WA Bot Cicero.
            </p>
          </div>
          <Link
            href="/premium/register"
            className="inline-flex items-center justify-center rounded-xl border border-indigo-100/70 bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(99,102,241,0.65)] transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
          >
            Ajukan akses premium
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-indigo-50 bg-indigo-50/60 p-4 text-sm text-indigo-800 shadow-inner">
            <p className="font-semibold">Sesi 15:00</p>
            <p className="mt-1 text-indigo-700/80">
              Update sore untuk mengecek progres awal dan menyiapkan eskalasi ringan.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-50 bg-sky-50/70 p-4 text-sm text-sky-800 shadow-inner">
            <p className="font-semibold">Sesi 18:00</p>
            <p className="mt-1 text-sky-700/80">
              Rekap petang dengan status lengkap likes/komentar serta rekomendasi tindak lanjut.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-50 bg-emerald-50/80 p-4 text-sm text-emerald-800 shadow-inner">
            <p className="font-semibold">Sesi 20:30</p>
            <p className="mt-1 text-emerald-700/80">
              Final recap sebelum batas waktu, termasuk daftar akun yang masih perlu aksi.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
