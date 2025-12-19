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
      "Satu panel komando untuk agregasi lintas kanal, menyatukan inbox, KPI, dan SOP respon cepat sesuai playbook terbaru.",
    icon: Command,
    stats: [
      "Agregator omnichannel",
      "Peringatan prioritas WA",
      "Checklist SOP otomatis",
    ],
  },
  {
    id: "workflow",
    title: "Orkestrasi Workflow",
    description:
      "Tetapkan owner, jalankan automation bot WhatsApp, dan sinkronkan follow-up lintas tim dalam satu diagram operasional.",
    icon: Workflow,
    stats: [
      "Trigger bot WA adaptif",
      "Routing tugas berbasis SLA",
      "Integrasi knowledge base",
    ],
  },
  {
    id: "insight",
    title: "Insight Prediktif",
    description:
      "Prediksi lonjakan percakapan, rekomendasikan aksi preventif, dan validasi outcome dengan simulasi skenario otomatis.",
    icon: Gauge,
    stats: [
      "Forecast campaign harian",
      "Skor risiko sentimen",
      "Rekomendasi taktis AI",
    ],
  },
];

const timeline = [
  {
    title: "Agregasi Multi-Kanal",
    description:
      "Semua percakapan IG, TikTok, dan WhatsApp tersusun otomatis dalam satu feed prioritas.",
    time: "00:00",
  },
  {
    title: "Insight Prediktif",
    description:
      "Mesin analitik memetakan potensi eskalasi dan menyiapkan rencana mitigasi sesuai SOP.",
    time: "00:05",
  },
  {
    title: "Orkestrasi Bot",
    description:
      "Bot WhatsApp mengeksekusi follow-up, assign PIC, dan menutup loop laporan otomatis.",
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
  const loginCtas = [
    { label: "Login Dashboard", href: "/login", variant: "primary" },
    { label: "Login Update", href: "/login-update", variant: "outline" },
    { label: "Login Reposter", href: "/reposter/login", variant: "outline" },
  ];

  const packages = useMemo(
    () => [
      {
        name: "Kelas A",
        users: "1500-3000 pengguna",
        setup: "Rp5.000.000",
        monthly: "Rp4.200.000",
        features: [
          "Agregator omnichannel penuh",
          "Workflow lintas divisi",
          "Prioritas dukungan 24/7",
          "Integrasi ERP & CRM",
        ],
      },
      {
        name: "Kelas B",
        users: "800-1500 pengguna",
        setup: "Rp4.000.000",
        monthly: "Rp3.600.000",
        popular: true,
        features: [
          "Insight prediktif standar",
          "Orkestrasi bot WA",
          "Dukungan jam kerja",
          "Integrasi knowledge base",
        ],
      },
      {
        name: "Kelas C",
        users: "maks. 800 pengguna",
        setup: "Rp3.000.000",
        monthly: "Rp2.400.000",
        features: [
          "Agregasi kanal dasar",
          "Template SOP respon",
          "Dukungan email",
          "2 channel aktif",
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
    <div className="relative flex flex-col min-h-screen overflow-hidden bg-gradient-to-br from-sky-100 via-indigo-50 to-violet-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.28),_rgba(236,233,254,0.4)_45%,_transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-violet-200/70 blur-3xl" />

      {/* Header */}
      <header className="relative z-10 w-full border-b border-indigo-200/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-300 via-indigo-200 to-violet-300 shadow-lg shadow-violet-200/60">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="text-left">
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-600">Cicero</p>
              <p className="text-sm text-slate-600">Next-Gen Command Dashboard</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {loginCtas.map((cta) => (
              <Link
                key={cta.label}
                href={cta.href}
                className={
                  cta.variant === "primary"
                    ? "rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-200/70 transition hover:scale-105 hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                    : "rounded-full border border-indigo-200/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                }
              >
                {cta.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-grow flex-col items-center">
        <section className="w-full border-b border-indigo-200/30 bg-gradient-to-b from-white/80 via-indigo-50/50 to-transparent pb-20 pt-16">
          <div className="container mx-auto flex max-w-6xl flex-col gap-12 px-6 text-center md:flex-row md:text-left">
            <div className="flex-1 space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-300/60 bg-indigo-100/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-indigo-600">
                Omnichannel Upgrade
              </span>
              <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">
                Satukan Operasi Sosial <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500">dengan agregator lintas kanal</span>
              </h1>
              <p className="max-w-xl text-base text-slate-600 md:text-lg">
                Cicero kini menghadirkan insight prediktif, orkestrasi bot WhatsApp, dan kontrol workflow sesuai SOP terbaru agar tim Anda selalu selangkah di depan.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                  {loginCtas.map((cta) => (
                    <Link
                      key={cta.label}
                      href={cta.href}
                      className={
                        cta.variant === "primary"
                          ? "inline-flex flex-1 items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-violet-200/80 transition hover:scale-[1.03] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                          : "inline-flex flex-1 items-center justify-center rounded-full border border-indigo-200/70 bg-white/70 px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-violet-300 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                      }
                    >
                      {cta.label}
                    </Link>
                  ))}
                </div>
                <a
                  href="https://wa.me/+6281235114745"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-indigo-200/70 bg-white/50 px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-violet-300 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                >
                  Lihat Alur Terbaru
                </a>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-sky-200/60 via-indigo-100/60 to-violet-100/60 p-4 text-left shadow-lg shadow-indigo-200/40"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">{metric.label}</p>
                    <p className="mt-2 text-2xl font-bold text-slate-900">{metric.value}</p>
                    <p className="text-xs text-emerald-500">{metric.trend}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <div className="relative mx-auto max-w-lg overflow-hidden rounded-3xl border border-indigo-200/60 bg-white/80 p-6 shadow-2xl shadow-indigo-200/40">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-200/40 via-indigo-200/40 to-violet-200/40" />
                <div className="relative space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-indigo-200/60 bg-white/70 px-5 py-4">
                    <div>
                      <p className="text-xs text-slate-500">Live Audience Flow</p>
                      <p className="text-lg font-semibold text-slate-900">+245 joining</p>
                    </div>
                    <BarChart3 className="h-6 w-6 text-indigo-500" aria-hidden="true" />
                  </div>
                  <div className="rounded-2xl border border-indigo-200/60 bg-white/70 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">Sentiment Heat</p>
                      <span className="text-xs text-emerald-500">Stable</span>
                    </div>
                    <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs">
                      {["IG", "TT", "YT", "FB", "TW"].map((channel) => (
                        <div
                          key={channel}
                          className="rounded-lg bg-gradient-to-br from-sky-200/60 via-indigo-100/60 to-violet-200/60 px-3 py-2"
                        >
                          <p className="font-semibold text-slate-900">{channel}</p>
                          <p className="text-[10px] text-slate-600">Active</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 rounded-2xl border border-indigo-200/60 bg-white/70 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">Auto Tasks</p>
                      <span className="text-xs text-indigo-500">12 in queue</span>
                    </div>
                    <div className="space-y-2">
                      {["Respond comment high priority", "Review draft carousel", "Schedule trend remix"].map(
                        (task) => (
                          <div
                            key={task}
                            className="flex items-center justify-between rounded-xl border border-indigo-200/50 bg-gradient-to-r from-sky-200/50 via-indigo-100/40 to-transparent px-3 py-2 text-xs"
                          >
                            <span className="text-slate-700">{task}</span>
                            <Zap className="h-4 w-4 text-violet-400" aria-hidden="true" />
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
        <section className="w-full border-b border-indigo-200/40 bg-gradient-to-br from-sky-100/70 via-white/80 to-teal-100/70 py-16">
          <div className="container mx-auto flex max-w-6xl flex-col gap-12 px-6 lg:flex-row">
            <div className="flex-1 space-y-5">
              <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Kenapa Cicero Dibuat?</h2>
              <p className="text-slate-600">
                Cicero menggabungkan monitoring & evaluasi media sosial dalam satu ekosistem komando. Agregator lintas kanal, insight prediktif, dan orkestrasi bot WA memastikan setiap aktivitas mengikuti knowledge base resmi tanpa jeda.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {[Activity, MessageCircle, Database, BarChart3].map((Icon, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-sky-200/60 via-teal-100/60 to-violet-100/60 p-5 shadow-lg shadow-indigo-200/40"
                  >
                    <Icon className="h-8 w-8 text-indigo-500" aria-hidden="true" />
                    <p className="mt-3 text-sm text-slate-600">
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
                    className={`flex items-center gap-3 rounded-full border px-4 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                      activeFeature === id
                        ? "border-indigo-400 bg-gradient-to-r from-sky-200/70 via-indigo-200/70 to-violet-200/70 text-indigo-700"
                        : "border-indigo-200/50 bg-white/70 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {title}
                  </button>
                ))}
              </div>
              {selectedFeature && SelectedIcon && (
                <div className="rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-sky-100/70 via-white/80 to-violet-100/70 p-8 shadow-lg shadow-indigo-200/40">
                  <div className="flex items-center gap-3">
                    <SelectedIcon className="h-8 w-8 text-violet-500" aria-hidden="true" />
                    <h3 className="text-2xl font-semibold text-slate-900">{selectedFeature.title}</h3>
                  </div>
                  <p className="mt-4 text-sm text-slate-600 md:text-base">{selectedFeature.description}</p>
                  <ul className="mt-6 grid gap-3 md:grid-cols-2">
                    {selectedFeature.stats.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2 rounded-2xl border border-indigo-200/60 bg-gradient-to-r from-sky-200/60 via-indigo-100/60 to-violet-100/60 px-4 py-2 text-sm"
                      >
                        <CheckCircle className="h-4 w-4 text-emerald-500" aria-hidden="true" />
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
        <section className="w-full bg-gradient-to-b from-indigo-50 via-sky-100 to-violet-100 py-16">
          <div className="container mx-auto max-w-5xl px-6 text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">Workflow Terpadu dalam 10 Menit</h2>
            <p className="mt-4 text-slate-600">
              Dari agregasi lintas kanal, insight prediktif, hingga orkestrasi bot WA, setiap langkah mengikuti SOP terbaru tanpa perlu switching platform.
            </p>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {timeline.map((step) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-sky-200/60 via-indigo-100/60 to-violet-100/60 p-6 text-left shadow-lg shadow-indigo-200/40"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-indigo-500">{step.time}</p>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="w-full border-y border-indigo-200/40 bg-gradient-to-br from-indigo-50 via-sky-100 to-violet-100 py-16">
          <div className="container mx-auto max-w-6xl px-6">
            <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">Paket Cicero</h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
              Pilih paket yang menyelaraskan agregator lintas kanal, insight prediktif, dan orkestrasi bot WA dengan kebutuhan workflow tim Anda. Komitmen jangka menengah maupun panjang mendapat potongan 10%.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {packages.map((pkg) => (
                <div
                  key={pkg.name}
                  className={`relative flex h-full flex-col rounded-3xl border border-indigo-200/60 bg-white/80 p-6 text-slate-800 shadow-xl shadow-indigo-200/40 transition hover:-translate-y-1 hover:shadow-indigo-200/60 ${
                    pkg.popular ? "ring-2 ring-indigo-300" : ""
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-300 via-indigo-300 to-violet-400 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-slate-900">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-slate-900">{pkg.name}</h3>
                  <p className="text-sm text-slate-600">{pkg.users}</p>
                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-500">Biaya Setup</p>
                    <p className="text-3xl font-extrabold text-slate-900">{pkg.setup}</p>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-500">Biaya Bulanan</p>
                    <p className="text-2xl font-semibold text-slate-900">{pkg.monthly}</p>
                  </div>
                  <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-600">
                    {pkg.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle aria-hidden="true" className="mt-0.5 h-4 w-4 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href="https://wa.me/+6281235114745"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Kirim pesan paket ${pkg.name}`}
                    className="mt-6 inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-200/70 transition hover:scale-[1.02] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
                  >
                    Kirim Pesan
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="w-full bg-gradient-to-br from-indigo-50 via-white to-violet-100 py-16">
          <div className="container mx-auto max-w-3xl px-6 text-center">
            <blockquote className="rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-sky-200/60 via-indigo-200/60 to-violet-200/60 p-8 text-lg italic text-slate-700 shadow-lg shadow-indigo-200/40">
              "Agregator lintas kanal Cicero memotong waktu audit kami hingga 60%. Insight prediktifnya memicu orkestrasi bot WA yang menutup semua tiket sebelum melewati SLA."
            </blockquote>
            <p className="mt-4 text-sm text-slate-500">- Head of Digital Operations, Cicero Devs</p>
          </div>
        </section>

        {/* Signup Form */}
        <section className="w-full border-t border-indigo-200/40 bg-gradient-to-b from-white via-indigo-50 to-violet-100 py-16">
          <div className="container mx-auto max-w-lg px-6">
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-indigo-200/60 bg-white/80 p-8 shadow-xl shadow-indigo-200/40"
            >
              <h3 className="text-2xl font-semibold text-slate-900">Berlangganan Knowledge Pulse</h3>
              <p className="mt-2 text-sm text-slate-600">
                Terima ringkasan rilis agregator, template SOP operasional, serta insight prediktif mingguan langsung dari tim enablement kami.
              </p>
              <div className="mt-6 space-y-3">
                <label htmlFor="email" className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Email Anda
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@perusahaan.com"
                  required
                  className="w-full rounded-2xl border border-indigo-200/60 bg-white/90 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-violet-300/50"
                />
              </div>
              <button
                type="submit"
                className="mt-6 w-full rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-200/70 transition hover:scale-[1.02] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
              >
                Kirim Ringkasan
              </button>
              <p className="mt-3 text-xs text-slate-500">Kami mengacu pada kebijakan privasi & SOP keamanan data terbaru.</p>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-indigo-200/40 bg-white/80 py-6 text-center text-xs text-slate-500">
        <div className="container mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 md:flex-row md:justify-between">
          <p>&copy; {new Date().getFullYear()} Cicero. Semua hak cipta dilindungi.</p>
          <div className="flex gap-4">
            <Link href="/terms-of-service" className="transition hover:text-violet-500">
              Ketentuan Layanan
            </Link>
            <Link href="/privacy-policy" className="transition hover:text-violet-500">
              Kebijakan Privasi
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
