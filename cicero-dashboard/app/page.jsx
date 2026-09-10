"use client";

import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  LayoutDashboard,
  MessageCircleMore,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Workflow,
} from "lucide-react";

import useAuthRedirect from "@/hooks/useAuthRedirect";
import Image from "next/image";

const products = [
  {
    name: "Dashboard",
    description: "Pantau performa, aktivitas, dan insight lintas kanal dalam satu ruang kerja.",
    href: "https://dashboard.papiqo.com/login",
    action: "Masuk Dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Claim",
    description: "Kelola identitas personel, akun sosial, dan tindak lanjut aktivitas secara mandiri.",
    href: "https://claim.papiqo.com/claim",
    action: "Buka Claim",
    icon: ShieldCheck,
  },
  {
    name: "Reposter",
    description: "Temukan tugas publikasi resmi dan laporkan hasilnya melalui alur yang terarah.",
    href: "https://reposter.papiqo.com/reposter/login",
    action: "Buka Reposter",
    icon: RefreshCcw,
  },
];

const capabilities = [
  {
    title: "Monitoring terpusat",
    description: "Informasi penting dari kanal digital disusun menjadi tampilan yang ringkas dan mudah ditindaklanjuti.",
    icon: BarChart3,
  },
  {
    title: "Koordinasi lebih rapi",
    description: "Tugas, pemilik pekerjaan, dan progres berada dalam alur yang sama agar tindak lanjut tidak terlewat.",
    icon: UsersRound,
  },
  {
    title: "Otomasi yang terukur",
    description: "Proses rutin dibantu sistem dengan kontrol, jejak aktivitas, dan batas akses yang jelas.",
    icon: Workflow,
  },
];

const flow = [
  ["01", "Kumpulkan", "Data operasional dan aktivitas kanal masuk ke ruang kerja terpusat."],
  ["02", "Pahami", "Dashboard menyajikan konteks, prioritas, dan progres yang relevan."],
  ["03", "Tindak lanjuti", "Tim menjalankan tugas melalui Claim, Reposter, dan alur operasional."],
];

export default function LandingPage() {
  useAuthRedirect();

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Cicero beranda">
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <Image src="/cicero-mark.png" alt="Logo Cicero" fill sizes="40px" className="object-contain p-1" priority />
            </span>
            <span>
              <span className="block text-sm font-bold tracking-[0.18em]">CICERO</span>
              <span className="block text-[11px] text-slate-500">Digital Operations Platform</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex" aria-label="Navigasi utama">
            <a href="#platform" className="transition hover:text-slate-950">Platform</a>
            <a href="#kapabilitas" className="transition hover:text-slate-950">Kapabilitas</a>
            <a href="#cara-kerja" className="transition hover:text-slate-950">Cara kerja</a>
          </nav>
          <Link
            href="https://dashboard.papiqo.com/login"
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Masuk <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-white">
          <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-[420px] max-w-5xl bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.12),transparent_68%)]" />
          <div className="relative mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <CircleDot className="h-3.5 w-3.5" aria-hidden="true" />
                Satu ekosistem untuk operasi digital
              </div>
              <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-6xl">
                Operasi digital yang lebih jelas, cepat, dan terkendali.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                Cicero menyatukan monitoring, evaluasi, pengelolaan personel, dan distribusi tugas dalam alur kerja yang sederhana untuk membantu tim bergerak dengan informasi yang tepat.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="https://dashboard.papiqo.com/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700">
                  Mulai dari Dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="#platform" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-950">
                  Jelajahi platform
                </a>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
                {["Akses berbasis peran", "Alur kerja terintegrasi", "Informasi terpusat"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" /> {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-3 shadow-2xl shadow-slate-300/60">
                <div className="rounded-[1.4rem] bg-white p-5 sm:p-7">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ruang Operasi</p>
                      <p className="mt-1 font-semibold text-slate-900">Ringkasan hari ini</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Aktif</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {["Monitoring kanal", "Progres personel", "Distribusi tugas", "Laporan & evaluasi"].map((label, index) => (
                      <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <span className={`mb-5 block h-2 w-10 rounded-full ${index % 2 ? "bg-violet-400" : "bg-indigo-500"}`} />
                        <p className="text-sm font-semibold text-slate-800">{label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">Tersusun dan siap ditinjau</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-3 rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-950">
                    <ShieldCheck className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden="true" />
                    Setiap pengguna masuk melalui ruang dan hak akses yang sesuai.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Platform Cicero</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Pilih ruang kerja sesuai kebutuhan.</h2>
              <p className="mt-4 leading-7 text-slate-600">Tiga layanan yang saling terhubung, dengan tujuan dan pengalaman yang tetap fokus.</p>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {products.map(({ name, description, href, action, icon: Icon }, index) => (
                <Link key={name} href={href} className="group flex min-h-64 flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/70">
                  <div className="flex items-start justify-between">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 0 ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"}`}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" aria-hidden="true" />
                  </div>
                  <h3 className="mt-8 text-xl font-bold">{name}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{description}</p>
                  <p className="mt-6 text-sm font-semibold text-indigo-700">{action}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="kapabilitas" className="scroll-mt-24 border-y border-slate-200 bg-white py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Kapabilitas inti</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Dibuat untuk mengurangi kerumitan operasional.</h2>
              <p className="mt-5 leading-7 text-slate-600">Antarmuka yang fokus membantu tim memahami kondisi, menentukan prioritas, dan menyelesaikan pekerjaan tanpa berpindah-pindah konteks.</p>
            </div>
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {capabilities.map(({ title, description, icon: Icon }) => (
                <div key={title} className="grid gap-4 py-7 sm:grid-cols-[auto_1fr] sm:gap-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                  <div><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{description}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600">Cara kerja</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Dari data menjadi tindakan.</h2>
              <p className="mt-4 leading-7 text-slate-600">Alur sederhana yang menjaga informasi, koordinasi, dan tindak lanjut tetap terhubung.</p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {flow.map(([number, title, description]) => (
                <div key={number} className="rounded-3xl border border-slate-200 bg-white p-7">
                  <span className="text-sm font-bold text-indigo-600">{number}</span>
                  <h3 className="mt-8 text-xl font-bold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 sm:px-8 sm:pb-24">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 overflow-hidden rounded-[2rem] bg-slate-950 px-7 py-10 text-white sm:px-10 lg:flex-row lg:items-center lg:px-14 lg:py-14">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-300">Akses Cicero</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.03em]">Mulai dari ruang kerja Anda.</h2>
              <p className="mt-4 leading-7 text-slate-300">Masuk ke Dashboard untuk monitoring atau pilih Claim dan Reposter sesuai tugas operasional Anda.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="https://dashboard.papiqo.com/login" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-indigo-50">Masuk Dashboard <ArrowRight className="h-4 w-4" /></Link>
              <a href="https://wa.me/6281235114745" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-900"><MessageCircleMore className="h-4 w-4" /> Hubungi tim</a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} Cicero. Platform operasi digital.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/terms-of-service" className="transition hover:text-slate-950">Ketentuan Layanan</Link>
            <Link href="/privacy-policy" className="transition hover:text-slate-950">Kebijakan Privasi</Link>
            <Link href="/admin-system/login" className="transition hover:text-slate-950">Portal Internal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
