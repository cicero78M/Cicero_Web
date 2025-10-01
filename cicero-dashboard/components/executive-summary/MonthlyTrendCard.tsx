"use client";

import React from "react";

type FormatNumberFn = (
  value: number,
  options?: Intl.NumberFormatOptions,
) => string;
type FormatPercentFn = (value: number) => string;

type MonthlyMetric = {
  key: string;
  label: string;
  value: number;
  suffix?: string;
};

type MonthlyDeltaMetric = {
  key: string;
  label: string;
  absolute: number | null;
  percent?: number | null;
};

type MonthlyTrendSeriesPoint = {
  key: string;
  label?: string;
  start?: Date | string | null;
  end?: Date | string | null;
  posts?: number;
  likes?: number;
  comments?: number;
  primary?: number;
  secondary?: number;
};

type SeriesValueKey =
  | "primary"
  | "secondary"
  | "likes"
  | "comments"
  | "posts";

type MonthlyTrendCardProps = {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string;
  currentMetrics?: MonthlyMetric[];
  previousMetrics?: MonthlyMetric[];
  deltaMetrics?: MonthlyDeltaMetric[];
  series?: MonthlyTrendSeriesPoint[];
  formatNumber?: FormatNumberFn;
  formatPercent?: FormatPercentFn;
  primaryMetricLabel?: string;
  secondaryMetricLabel?: string;
};

const defaultNumberFormatter: FormatNumberFn = (value, options) => {
  const numericValue = Number.isFinite(value) ? Number(value) : 0;
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    ...(options ?? {}),
  }).format(numericValue);
};

const defaultPercentFormatter: FormatPercentFn = (value) => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const fractionDigits = safeValue > 0 && safeValue < 10 ? 1 : 0;
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(safeValue)}%`;
};

const resolveMonthLabel = (item: MonthlyTrendSeriesPoint): string => {
  if (item.label) {
    return item.label;
  }

  const candidate = item.start ?? null;
  if (candidate instanceof Date && !Number.isNaN(candidate.valueOf())) {
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
    }).format(candidate);
  }

  if (typeof candidate === "string") {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.valueOf())) {
      return new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(parsed);
    }
  }

  return item.key;
};

const MonthlyTrendCard: React.FC<MonthlyTrendCardProps> = ({
  title,
  description,
  loading = false,
  error = "",
  currentMetrics = [],
  previousMetrics = [],
  deltaMetrics = [],
  series = [],
  formatNumber = defaultNumberFormatter,
  formatPercent = defaultPercentFormatter,
  primaryMetricLabel = "Likes",
  secondaryMetricLabel = "Komentar",
}) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 text-sm text-slate-400">
        Memuat tren bulanan…
      </div>
    );
  }

  const hasCurrentMetrics = currentMetrics.length > 0;
  const hasPreviousMetrics = previousMetrics.length > 0;
  const hasDelta = deltaMetrics.length > 0;
  const hasSeries = Array.isArray(series) && series.length > 0;

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_18px_38px_rgba(15,23,42,0.35)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
          Monthly Trend
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-50">{title}</h3>
        {description ? (
          <p className="mt-2 text-sm text-slate-300">{description}</p>
        ) : null}
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {error}
        </div>
      ) : null}

      {hasCurrentMetrics || hasPreviousMetrics ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Bulan Berjalan
            </p>
            <div className="mt-3 space-y-2">
              {hasCurrentMetrics ? (
                currentMetrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="flex items-baseline justify-between text-slate-100"
                  >
                    <span className="text-sm text-slate-400">{metric.label}</span>
                    <span className="text-lg font-semibold text-slate-100">
                      {formatNumber(metric.value, { maximumFractionDigits: 0 })}
                      {metric.suffix ?? ""}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Belum ada data bulan ini.</p>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Bulan Sebelumnya
            </p>
            <div className="mt-3 space-y-2">
              {hasPreviousMetrics ? (
                previousMetrics.map((metric) => (
                  <div
                    key={metric.key}
                    className="flex items-baseline justify-between text-slate-100"
                  >
                    <span className="text-sm text-slate-400">{metric.label}</span>
                    <span className="text-lg font-semibold text-slate-100">
                      {formatNumber(metric.value, { maximumFractionDigits: 0 })}
                      {metric.suffix ?? ""}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Belum ada pembanding.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
          Belum ada data bulanan yang dapat ditampilkan.
        </div>
      )}

      {hasDelta ? (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {deltaMetrics.map((delta) => {
            const rawAbsolute =
              delta.absolute !== null && delta.absolute !== undefined
                ? Number(delta.absolute)
                : 0;
            const absolute = Number.isFinite(rawAbsolute) ? rawAbsolute : 0;
            const isPositive = absolute > 0;
            const isNegative = absolute < 0;
            const sign = isPositive ? "+" : isNegative ? "−" : "±";
            const accent = isPositive
              ? "text-emerald-300"
              : isNegative
              ? "text-rose-300"
              : "text-slate-200";
            const absValue = Math.abs(absolute);
            const percentLabel =
              delta.percent !== null && delta.percent !== undefined
                ? `${sign}${formatPercent(Math.abs(Number(delta.percent) || 0))}`
                : null;

            return (
              <div
                key={delta.key}
                className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {delta.label}
                </p>
                <p className={`mt-2 text-lg font-semibold ${accent}`}>
                  {Number.isFinite(absValue)
                    ? `${sign}${formatNumber(absValue, { maximumFractionDigits: 0 })}`
                    : "–"}
                </p>
                {percentLabel ? (
                  <p className="text-xs text-slate-400">{percentLabel}</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    Tidak ada perbandingan persentase.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : null}

      {hasSeries ? (
        <div className="mt-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Rekap Bulanan
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {series.map((item) => {
              const toNullableNumber = (value?: number | null): number | null => {
                if (value === null || value === undefined) {
                  return null;
                }
                const numericValue = Number(value);
                return Number.isFinite(numericValue) ? numericValue : null;
              };

              const getNumericField = (field: SeriesValueKey): number | null => {
                switch (field) {
                  case "primary":
                    return toNullableNumber(item.primary);
                  case "secondary":
                    return toNullableNumber(item.secondary);
                  case "likes":
                    return toNullableNumber(item.likes);
                  case "comments":
                    return toNullableNumber(item.comments);
                  case "posts":
                    return toNullableNumber(item.posts);
                  default:
                    return null;
                }
              };

              const primaryCandidates: SeriesValueKey[] = [
                "primary",
                "likes",
                "comments",
                "posts",
              ];

              let primaryValue: number | null = null;
              let primaryKey: SeriesValueKey | null = null;

              for (const candidate of primaryCandidates) {
                const candidateValue = getNumericField(candidate);
                if (candidateValue !== null) {
                  primaryValue = candidateValue;
                  primaryKey = candidate;
                  break;
                }
              }

              const secondaryCandidates: SeriesValueKey[] = [
                "secondary",
                "posts",
                "likes",
                "comments",
              ];

              let secondaryValue: number | null = null;

              for (const candidate of secondaryCandidates) {
                if (primaryKey && candidate === primaryKey) {
                  continue;
                }
                const candidateValue = getNumericField(candidate);
                if (candidateValue !== null) {
                  secondaryValue = candidateValue;
                  break;
                }
              }

              const segments: string[] = [];

              if (primaryValue !== null) {
                segments.push(
                  `${primaryMetricLabel}: ${formatNumber(primaryValue, {
                    maximumFractionDigits: 0,
                  })}`,
                );
              }

              if (secondaryValue !== null) {
                segments.push(
                  `${secondaryMetricLabel}: ${formatNumber(secondaryValue, {
                    maximumFractionDigits: 0,
                  })}`,
                );
              }

              const detailLabel =
                segments.length > 0
                  ? segments.join(" • ")
                  : "Tidak ada data tersedia.";

              return (
                <div
                  key={item.key}
                  className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-3 py-2 text-xs text-slate-300"
                >
                  <p className="font-semibold text-slate-200">
                    {resolveMonthLabel(item)}
                  </p>
                  <p className="mt-1 text-slate-400">{detailLabel}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MonthlyTrendCard;
