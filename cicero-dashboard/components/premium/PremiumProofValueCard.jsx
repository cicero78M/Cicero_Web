"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

const toneMap = {
  critical: {
    panel: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50",
    badge: "bg-rose-100 text-rose-700",
    icon: AlertTriangle,
    iconWrap: "bg-rose-100 text-rose-600",
  },
  warning: {
    panel: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50",
    badge: "bg-amber-100 text-amber-700",
    icon: ShieldCheck,
    iconWrap: "bg-amber-100 text-amber-600",
  },
  opportunity: {
    panel: "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50",
    badge: "bg-sky-100 text-sky-700",
    icon: TrendingUp,
    iconWrap: "bg-sky-100 text-sky-600",
  },
};

export default function PremiumProofValueCard({
  badge = 'Proof of Value',
  title,
  description,
  metrics = [],
  bullets = [],
  cta,
  tone = 'opportunity',
  stateLabel,
  stateHelper,
}) {
  if (!title) return null;

  const palette = toneMap[tone] || toneMap.opportunity;
  const Icon = palette.icon || Sparkles;

  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${palette.panel}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${palette.badge}`}>
            <Sparkles className="h-3.5 w-3.5" />
            {badge}
          </span>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description ? <p className="max-w-3xl text-sm text-slate-600">{description}</p> : null}
          </div>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${palette.iconWrap}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>

      {stateLabel ? (
        <div className="mt-4 rounded-xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
              {stateLabel}
            </span>
            {stateHelper ? <p className="text-xs text-slate-600">{stateHelper}</p> : null}
          </div>
        </div>
      ) : null}

      {metrics.length > 0 ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-white/80 bg-white/85 p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{metric.value}</p>
              {metric.helper ? <p className="mt-1 text-xs text-slate-500">{metric.helper}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {bullets.length > 0 ? (
        <div className="mt-5 space-y-2">
          {bullets.map((bullet) => (
            <div key={bullet} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-sky-500" />
              <p>{bullet}</p>
            </div>
          ))}
        </div>
      ) : null}

      {cta?.href ? (
        <div className="mt-5">
          <Link
            href={cta.href}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
              cta.tone === 'critical'
                ? 'border border-rose-200 bg-rose-600 text-white hover:bg-rose-700'
                : cta.tone === 'warning'
                  ? 'border border-amber-200 bg-amber-500 text-white hover:bg-amber-600'
                  : 'border border-slate-200 bg-white text-slate-800 hover:border-sky-200 hover:text-sky-700'
            }`}
          >
            {cta.label || 'Lihat premium'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
