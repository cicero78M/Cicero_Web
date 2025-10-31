"use client";

import WeeklyPlatformEngagementTrendChart from "@/components/weekly-report/WeeklyPlatformEngagementTrendChart";

export interface WeeklyTrendPoint {
  key: string;
  label?: string;
  interactions?: number | null;
  posts?: number | null;
  likes?: number | null;
  comments?: number | null;
}

export interface WeeklyTrendDataset {
  platformKey: string;
  platformLabel: string;
  series: WeeklyTrendPoint[];
  latest: WeeklyTrendPoint | null;
  previous: WeeklyTrendPoint | null;
  error?: string;
}

interface WeeklyTrendSectionProps {
  periodLabel: string;
  description: string;
  datasets: WeeklyTrendDataset[];
  loading?: boolean;
  personnelCount?: number | null;
}

export default function WeeklyTrendSection({
  periodLabel,
  description,
  datasets,
  loading = false,
  personnelCount = null,
}: WeeklyTrendSectionProps) {
  return (
    <section className="space-y-6 rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-white via-emerald-50/80 to-sky-50/80 p-6 shadow-[0_20px_45px_rgba(45,212,191,0.15)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">
            Tren Interaksi Mingguan
          </h2>
          <p className="text-sm text-slate-600">{description}</p>
        </div>
        <div className="rounded-full border border-emerald-100 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-500">
          {periodLabel}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {datasets.map((dataset) => (
          <WeeklyPlatformEngagementTrendChart
            key={dataset.platformKey}
            platformKey={dataset.platformKey}
            platformLabel={dataset.platformLabel}
            series={dataset.series}
            latest={dataset.latest}
            previous={dataset.previous}
            loading={loading}
            error={dataset.error}
            personnelCount={personnelCount ?? undefined}
          />
        ))}
      </div>
    </section>
  );
}
