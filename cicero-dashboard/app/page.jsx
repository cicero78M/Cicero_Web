"use client";
import { useMemo, useState } from "react";
import useAuthRedirect from "@/hooks/useAuthRedirect";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  CheckCircle,
  Command,
  Database,
  Gauge,
  MessageCircle,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

const featureHighlights = [
  {
    id: "command",
    title: "Command Center",
    description:
      "Panel ringkas menampilkan KPI lintas platform, peringatan instan, dan rekomendasi aksi yang dapat dieksekusi satu klik.",
    icon: Command,
    stats: [
      "Alert otomatis berbasis AI",
      "Sinkronisasi multi-channel",
      "Rangkuman performa harian",
    ],
  },
  {
    id: "workflow",
    title: "Alur Kerja Cerdas",
    description:
      "Tetapkan tugas, auto-tag anggota, dan pantau progres dalam satu alur visual yang responsif layaknya dashboard futuristik.",
    icon: Workflow,
    stats: [
      "Penjadwalan dinamis",
      "Automasi persetujuan konten",
      "Kolaborasi lintas divisi",
    ],
  },
  {
    id: "insight",
    title: "Insight Prediktif",
    description:
      "Prediksi capaian engagement & reach, lengkap dengan simulasi skenario untuk menyempurnakan strategi berikutnya.",
    icon: Gauge,
    stats: [
      "Forecast tren mingguan",
      "Segmentasi audiens pintar",
      "Heatmap sentimen real-time",
    ],
  },
];

const timeline = [
  {
    title: "Sinkronisasi Otomatis",
    description: "Tarik aktivitas Instagram & TikTok tim secara langsung dan rapi.",
    time: "00:00",
  },
  {
    title: "Analitik Terpadu",
    description: "Visualisasi KPI tersaji dalam grafik interaktif siap presentasi.",
    time: "00:05",
  },
  {
    title: "Aksi Cepat",
    description: "Terapkan rekomendasi AI dan kirim briefing instan ke tim.",
    time: "00:10",
  },
];

const metrics = [
  { label: "Akun Aktif", value: "1.240", trend: "+18%" },
  { label: "Engagement", value: "3.4M", trend: "+26%" },
  { label: "SLA Respon", value: "2m 15s", trend: "-32%" },
];

export default function LandingPage() {
  useAuthRedirect();
  const [email, setEmail] = useState("");
  const [activeFeature, setActiveFeature] = useState(featureHighlights[0].id);

  const packages = useMemo(
    () => [
      {
        name: "Kelas A",
        users: "1500-3000 pengguna",
        setup: "Rp5.000.000",
        monthly: "Rp4.200.000",
        features: [
          "Analisis real-time",
          "Kolaborasi tim penuh",
          "Prioritas dukungan",
          "Integrasi kustom",
        ],
      },
      {
        name: "Kelas B",
        users: "800-1500 pengguna",
        setup: "Rp4.000.000",
        monthly: "Rp3.600.000",
        popular: true,
        features: [
          "Analisis real-time",
          "Kolaborasi tim",
          "Dukungan standar",
          "Integrasi dasar",
        ],
      },
      {
        name: "Kelas C",
        users: "maks. 800 pengguna",
        setup: "Rp3.000.000",
        monthly: "Rp2.400.000",
        features: [
          "Analisis dasar",
          "Kolaborasi tim",
          "Dukungan email",
          "1 akun sosial",
        ],
      },
    ],
    []
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Terima kasih!");
    setEmail("");
  };

  const selectedFeature = featureHighlights.find((item) => item.id === activeFeature);
  const SelectedIcon = selectedFeature?.icon;

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-950 to-purple-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.22),_transparent_60%)]" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-fuchsia-500/30 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/30">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="text-left">
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">Cicero</p>
              <p className="text-sm text-slate-300">Next-Gen Command Dashboard</p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-105 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
          >
            Login
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-grow flex-col items-center">
        <section className="w-full border-b border-white/5 bg-gradient-to-b from-white/5 via-transparent to-transparent pb-20 pt-16">
          <div className="container mx-auto flex max-w-6xl flex-col gap-12 px-6 text-center md:flex-row md:text-left">
            <div className="flex-1 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-indigo-200">
                Futuristic Control
              </span>
              <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
                Atur Operasi Media Sosial <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-300 to-fuchsia-400">seperti pusat komando modern</span>
              </h1>
              <p className="max-w-xl text-base text-slate-300 md:text-lg">
                Pantau performa, distribusikan tugas, dan aktifkan strategi hanya dalam sekali pandang. Cicero menghadirkan tampilan dashboard futuristik dengan insight real-time.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-[1.03] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300"
                >
                  Mulai Orkestrasi
                </Link>
                <a
                  href="https://wa.me/+6281235114745"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-indigo-300/50 px-6 py-3 text-base font-semibold text-slate-200 transition hover:border-fuchsia-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300"
                >
                  Demo Interaktif
                </a>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-fuchsia-500/10 p-4 text-left shadow-lg shadow-fuchsia-500/10"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{metric.label}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
                    <p className="text-xs text-emerald-300">{metric.trend}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-fuchsia-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-fuchsia-500/20" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-4">
                    <div>
                      <p className="text-xs text-slate-400">Live Audience Flow</p>
                      <p className="text-lg font-semibold">+245 joining</p>
                    </div>
                    <BarChart3 className="h-6 w-6 text-indigo-300" aria-hidden="true" />
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">Sentiment Heat</p>
                      <span className="text-xs text-emerald-300">Stable</span>
                    </div>
                    <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
                      {["IG", "TT", "YT", "FB", "TW"].map((channel) => (
                        <div
                          key={channel}
                          className="rounded-lg bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-fuchsia-500/20 px-3 py-2"
                        >
                          <p className="font-semibold text-white">{channel}</p>
                          <p className="text-[10px] text-slate-300">Active</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/80 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400">Auto Tasks</p>
                      <span className="text-xs text-indigo-200">12 in queue</span>
                    </div>
                    <div className="space-y-2">
                      {["Respond comment high priority", "Review draft carousel", "Schedule trend remix"].map(
                        (task) => (
                          <div
                            key={task}
                            className="flex items-center justify-between rounded-xl border border-white/5 bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-transparent px-3 py-2 text-xs"
                          >
                            <span className="text-slate-200">{task}</span>
                            <Zap className="h-4 w-4 text-fuchsia-300" aria-hidden="true" />
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Features */}
        <section className="w-full border-b border-white/5 bg-slate-950/50 py-16">
          <div className="container mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:flex-row">
            <div className="flex-1 space-y-5">
              <h2 className="text-3xl font-bold md:text-4xl">Kenapa Cicero Dibuat?</h2>
              <p className="text-slate-300">
                Cicero menggabungkan monitoring & evaluasi media sosial dalam satu ekosistem komando. Semua aktivitas anggota otomatis tersinkronisasi dengan database organisasi sehingga pimpinan memperoleh transparansi real-time.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {[Activity, MessageCircle, Database, BarChart3].map((Icon, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-fuchsia-500/10 p-5 shadow-lg shadow-fuchsia-500/10"
                  >
                    <Icon className="h-8 w-8 text-indigo-200" aria-hidden="true" />
                    <p className="mt-3 text-sm text-slate-300">
                      {[
                        "Monitoring & evaluasi terpusat",
                        "Laporan otomatis via WhatsApp",
                        "Minim administrasi manual",
                        "Visualisasi & analisis lengkap",
                      ][index]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-6">
              <div className="flex flex-wrap gap-3">
                {featureHighlights.map(({ id, title, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onMouseEnter={() => setActiveFeature(id)}
                    onFocus={() => setActiveFeature(id)}
                    className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                      activeFeature === id
                        ? "border-indigo-400 bg-gradient-to-r from-blue-500/30 via-indigo-500/30 to-fuchsia-500/30 text-white"
                        : "border-white/10 bg-white/5 text-slate-300 hover:border-indigo-300/60 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {title}
                  </button>
                ))}
              </div>
              {selectedFeature && SelectedIcon && (
                <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-slate-900/80 to-fuchsia-400/15 p-8 shadow-lg shadow-fuchsia-500/20">
                  <div className="flex items-center gap-3">
                    <SelectedIcon className="h-8 w-8 text-fuchsia-200" aria-hidden="true" />
                    <h3 className="text-2xl font-semibold">{selectedFeature.title}</h3>
                  </div>
                  <p className="mt-4 text-sm text-slate-200 md:text-base">{selectedFeature.description}</p>
                  <ul className="mt-6 grid gap-3 md:grid-cols-2">
                    {selectedFeature.stats.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-fuchsia-500/10 px-4 py-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-300" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Workflow Timeline */}
        <section className="w-full bg-gradient-to-b from-indigo-950/70 via-slate-950 to-purple-950/80 py-16">
          <div className="container mx-auto max-w-5xl px-6 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Workflow Terpadu dalam 10 Menit</h2>
            <p className="mt-4 text-slate-300">
              Dari sinkronisasi data hingga aksi taktis, semuanya terjadi secara otomatis dengan visual yang familiar seperti dashboard futuristik.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {timeline.map((step) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-fuchsia-500/10 p-6 text-left shadow-lg shadow-fuchsia-500/10"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-indigo-200">{step.time}</p>
                  <h3 className="mt-4 text-xl font-semibold">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-300">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full border-y border-white/5 bg-slate-950/60 py-16">
          <div className="container mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold md:text-4xl">Paket Cicero</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">
              Optimalkan pengelolaan media sosial Anda bersama Cicero dengan paket yang sesuai skala tim. Dapatkan potongan 10% untuk komitmen jangka menengah maupun jangka panjang.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`relative flex h-full flex-col rounded-3xl border border-white/10 bg-slate-950/70 p-6 text-slate-100 shadow-xl shadow-fuchsia-500/10 transition hover:-translate-y-1 hover:shadow-fuchsia-500/20 ${
                    pkg.popular ? "ring-2 ring-indigo-400" : ""
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{pkg.name}</h3>
                  <p className="text-sm text-slate-300">{pkg.users}</p>
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Biaya Setup</p>
                    <p className="text-3xl font-extrabold text-white">{pkg.setup}</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">Biaya Bulanan</p>
                    <p className="text-2xl font-semibold text-white">{pkg.monthly}</p>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-200">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle aria-hidden="true" className="mt-0.5 h-4 w-4 text-emerald-300" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="https://wa.me/+6281235114745"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Kirim pesan paket ${pkg.name}`}
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-[1.02] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300"
                  >
                    Kirim Pesan
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="w-full bg-slate-950/80 py-16">
          <div className="container mx-auto max-w-3xl px-6 text-center">
            <blockquote className="rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/20 via-indigo-600/20 to-fuchsia-400/20 p-8 text-lg italic text-slate-100 shadow-lg shadow-fuchsia-500/10">
              "Cicero menyulap proses monitoring kami menjadi pengalaman imersif. Insight proaktifnya membuat engagement melesat dalam hitungan minggu."
            </blockquote>
            <p className="mt-4 text-sm text-slate-400">- Marketing Manager, Cicero Devs</p>
          </div>
        </section>

        {/* Signup Form */}
        <section className="w-full border-t border-white/5 bg-slate-950/70 py-16">
          <div className="container mx-auto max-w-lg px-6">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-xl shadow-fuchsia-500/10"
            >
              <h3 className="text-2xl font-semibold">Dapatkan Update Produk</h3>
              <p className="mt-2 text-sm text-slate-300">
                Kami akan mengirimkan rangkuman fitur terbaru, studi kasus, dan undangan sesi demo eksklusif.
              </p>
              <div className="mt-6 space-y-3">
                <label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Email Anda
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-300/40"
                />
              </div>
              <button
                type="submit"
                className="mt-6 w-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:scale-[1.02] hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300"
              >
                Kirim Saya Update
              </button>
              <p className="mt-3 text-xs text-slate-400">Kami tidak akan membagikan email Anda.</p>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/80 py-6 text-center text-xs text-slate-400">
        <div className="container mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 md:flex-row md:justify-between">
          <p>&copy; {new Date().getFullYear()} Cicero. Semua hak cipta dilindungi.</p>
          <div className="flex gap-4">
            <Link href="/terms-of-service" className="transition hover:text-fuchsia-300">
              Ketentuan Layanan
            </Link>
            <Link href="/privacy-policy" className="transition hover:text-fuchsia-300">
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
