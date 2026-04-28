"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, ShieldAlert, ShieldCheck } from "lucide-react";

const toneMap = {
  high: {
    panel: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-orange-50",
    badge: "bg-rose-100 text-rose-700",
    iconWrap: "bg-rose-100 text-rose-600",
    itemBorder: "border-rose-100",
  },
  medium: {
    panel: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50",
    badge: "bg-amber-100 text-amber-700",
    iconWrap: "bg-amber-100 text-amber-600",
    itemBorder: "border-amber-100",
  },
  low: {
    panel: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50",
    badge: "bg-emerald-100 text-emerald-700",
    iconWrap: "bg-emerald-100 text-emerald-600",
    itemBorder: "border-emerald-100",
  },
};

const levelLabel = {
  high: "Tinggi",
  medium: "Sedang",
  low: "Rendah",
};

function LevelIcon({ level }) {
  if (level === "high") return <AlertTriangle className="h-4 w-4" />;
  if (level === "medium") return <ShieldAlert className="h-4 w-4" />;
  return <ShieldCheck className="h-4 w-4" />;
}

export default function RiskAlertCenter({
  badge = "Risk & Compliance",
  title,
  description,
  summary,
  alerts = [],
  tone = "low",
  stateLabel,
  stateHelper,
  cta,
}) {
  if (!title) return null;

  const palette = toneMap[tone] || toneMap.low;

  return (
    <section className={`rounded-2xl border p-5 shadow-sm ${palette.panel}`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${palette.badge}`}>
            <LevelIcon level={tone} />
            {badge}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
            {summary ? <p className="mt-2 text-sm font-medium text-slate-700">{summary}</p> : null}
          </div>
        </div>
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${palette.iconWrap}`}>
          <LevelIcon level={tone} />
        </span>
      </div>

      {stateLabel ? (
        <div className="mt-4 rounded-xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
              {stateLabel}
            </span>
            {stateHelper ? <p className="text-xs text-slate-600">{stateHelper}</p> : null}
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3">
        {alerts.map((alert) => (
          <div key={alert.id || alert.title} className={`rounded-xl border bg-white/90 p-4 shadow-sm ${palette.itemBorder}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-800"><LevelIcon level={alert.level} /></span>
                  <h4 className="text-sm font-semibold text-slate-900">{alert.title}</h4>
                </div>
                {alert.detail ? <p className="mt-2 text-sm text-slate-600">{alert.detail}</p> : null}
                {alert.action ? <p className="mt-2 text-sm font-medium text-slate-800">Aksi: {alert.action}</p> : null}
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                {levelLabel[alert.level] || "Info"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {cta?.href ? (
        <div className="mt-5">
          <Link
            href={cta.href}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition ${
              cta.tone === 'high'
                ? 'border border-rose-200 bg-rose-600 text-white hover:bg-rose-700'
                : cta.tone === 'medium'
                  ? 'border border-amber-200 bg-amber-500 text-white hover:bg-amber-600'
                  : 'border border-slate-200 bg-white text-slate-800 hover:border-emerald-200 hover:text-emerald-700'
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
