"use client";

import WeeklyPlatformLikesSummary from "@/components/weekly-report/WeeklyPlatformLikesSummary";

import type { SummaryCardInfo } from "./WeeklySummaryCards";

interface WeeklyDistributionSectionProps {
  heading?: string;
  description?: string;
  periodLabel?: string;
  weekDescriptor?: string;
  summaryData: any;
  summaryCards?: SummaryCardInfo[] | null;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number) => string;
  postTotals?: { instagram: number; tiktok: number } | null;
  labelOverrides?: Record<string, unknown> | null;
  personnelDistribution?: any[] | null;
  personnelDistributionMeta?: Record<string, unknown> | null;
  loading?: boolean;
}

export default function WeeklyDistributionSection({
  heading = "Detail Kinerja Kanal Mingguan",
  description,
  periodLabel,
  weekDescriptor,
  summaryData,
  summaryCards,
  formatNumber,
  formatPercent,
  postTotals,
  labelOverrides,
  personnelDistribution,
  personnelDistributionMeta,
  loading = false,
}: WeeklyDistributionSectionProps) {
  return (
    <section
      className="relative overflow-hidden rounded-[36px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/90 p-8 shadow-[0_28px_60px_rgba(52,211,153,0.2)]"
      aria-label="Rincian Kinerja Platform"
    >
      <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-700 shadow-sm ring-1 ring-white/70">
              Rincian Kinerja Platform
            </span>
            <h2 className="text-2xl font-semibold text-emerald-900">{heading}</h2>
            {description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-emerald-800/80">{description}</p>
            ) : null}
            {weekDescriptor ? (
              <p className="text-xs text-emerald-700/70">
                Data dirangkum otomatis untuk {weekDescriptor}.
              </p>
            ) : null}
          </div>

          {periodLabel ? (
            <div className="rounded-full border border-emerald-200 bg-white/85 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600 shadow-sm">
              {periodLabel}
            </div>
          ) : null}
        </div>

        <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_24px_50px_rgba(16,185,129,0.18)] backdrop-blur">
          <WeeklyPlatformLikesSummary
            data={summaryData}
            formatNumber={formatNumber}
            formatPercent={formatPercent}
            postTotals={postTotals}
            summaryCards={summaryCards}
            labelOverrides={labelOverrides}
            personnelDistribution={personnelDistribution}
            personnelDistributionMeta={personnelDistributionMeta}
            hiddenSections={{
              summaryCards: true,
              topCompliance: true,
              topCommentPersonnel: true,
              topLikesPersonnel: true,
            }}
            loading={loading}
          />
        </div>
      </div>
    </section>
  );
}
