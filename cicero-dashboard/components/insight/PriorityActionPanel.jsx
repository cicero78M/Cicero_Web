"use client";

import { ArrowRight, CheckCircle2, UserRoundX, ThumbsDown } from "lucide-react";

const ACTION_STYLES = {
  belum: {
    icon: UserRoundX,
    tone: "border-rose-200 bg-rose-50 text-rose-700",
    label: "Belum melaksanakan",
    description: "Belum ada aktivitas likes pada konten target.",
  },
  kurang: {
    icon: ThumbsDown,
    tone: "border-amber-200 bg-amber-50 text-amber-700",
    label: "Belum lengkap",
    description: "Sudah mulai, tetapi belum memenuhi seluruh target.",
  },
  tanpaUsername: {
    icon: UserRoundX,
    tone: "border-violet-200 bg-violet-50 text-violet-700",
    label: "Username belum tersedia",
    description: "Profil belum dapat dipetakan untuk penilaian otomatis.",
  },
};

export default function PriorityActionPanel({
  items = [],
  onAction,
  allComplete = false,
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="instagram-next-actions">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">Tindak lanjut</p>
          <h2 id="instagram-next-actions" className="mt-1 text-lg font-bold text-slate-900">Langkah berikutnya</h2>
          <p className="mt-1 text-sm text-slate-600">Pilih prioritas untuk membuka daftar personel yang perlu ditindaklanjuti.</p>
        </div>
        {allComplete ? <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Semua target terpenuhi</span> : null}
      </div>

      {allComplete ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Pertahankan pemantauan pada periode berikutnya dan pastikan konten target terbaru sudah tersinkron.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {items.map((item) => {
            const style = ACTION_STYLES[item.key] || ACTION_STYLES.kurang;
            const Icon = style.icon;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onAction?.(item.key)}
                className={`group rounded-xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${style.tone}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="text-2xl font-bold">{item.count}</span>
                </div>
                <p className="mt-3 text-sm font-bold">{style.label}</p>
                <p className="mt-1 text-xs leading-5 opacity-80">{style.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold">Lihat daftar <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" /></span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
