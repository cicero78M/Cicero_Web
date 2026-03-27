import { CheckCircle2 } from "lucide-react";
import CtaGroup from "@/components/landing/CtaGroup";

export default function HeroSection({ content, primaryCta, secondaryCtas }) {
  return (
    <section className="w-full border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.28),_transparent_42%),linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(240,249,255,1)_55%,_rgba(255,251,235,0.92)_100%)]">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div>
          <p className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">
            {content.eyebrow}
          </p>
          <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-5xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 md:text-lg">{content.description}</p>
          <div className="mt-8">
            <CtaGroup primary={primaryCta} secondary={secondaryCtas} />
          </div>
          <ul className="mt-8 grid gap-3 text-sm text-slate-700 md:grid-cols-2">
            {content.supportPoints.map((point) => (
              <li key={point} className="flex items-start gap-3 rounded-2xl border border-white/80 bg-white/75 px-4 py-4 shadow-sm">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="absolute inset-0 rounded-[2rem] bg-sky-200/30 blur-3xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-sky-100">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Evaluasi cepat</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">Landing publik lebih relevan</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Pengunjung baru diarahkan ke konsultasi lebih dulu, sementara jalur login dan claim tetap tersedia tanpa menjadi fokus utama.
                </p>
              </div>
              <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-5">
                <p className="text-sm font-semibold text-sky-100">Yang tetap bisa diakses</p>
                <ul className="mt-3 space-y-2 text-sm text-slate-200">
                  <li>Login dashboard dan update akses login</li>
                  <li>Portal claim profil</li>
                  <li>Mekanisme absensi dan panduan SOP</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
                <p className="text-sm font-semibold text-amber-100">Yang sudah dihapus</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">
                  Tidak ada lagi KPI promosi, testimonial internal, pricing publik, atau form newsletter dengan status sukses palsu.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
