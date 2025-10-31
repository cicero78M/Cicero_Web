"use client";

import type { ReactNode } from "react";

interface WeeklyReportHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  filters?: ReactNode;
  meta?: ReactNode;
}

export default function WeeklyReportHeader({
  badge = "Ditbinmas Insight",
  title,
  description,
  filters,
  meta,
}: WeeklyReportHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white/80 p-8 shadow-xl backdrop-blur">
      <div className="pointer-events-none absolute -top-16 right-12 h-40 w-40 rounded-full bg-sky-100/70 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-14 h-44 w-44 rounded-full bg-emerald-100/70 blur-3xl" />

      <div className="relative flex flex-col gap-6">
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
              {badge}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="max-w-2xl text-sm text-slate-600">{description}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:items-end">
            {meta}
            {filters}
          </div>
        </header>
      </div>
    </section>
  );
}
