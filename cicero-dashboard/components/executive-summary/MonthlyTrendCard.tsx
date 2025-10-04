"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

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
  formatOptions?: Intl.NumberFormatOptions;
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
  currentPeriodLabel?: string | null;
  previousPeriodLabel?: string | null;
};

const defaultNumberFormatter: FormatNumberFn = (value, options) => {
  const numericValue = Number.isFinite(value) ? Number(value) : 0;
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    ...(options ?? {}),
  }).format(Math.max(0, numericValue));
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

const toNullableNumber = (value?: number | null): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const resolveSeriesValue = (
  item: MonthlyTrendSeriesPoint,
  candidates: SeriesValueKey[],
  exclude?: SeriesValueKey,
) => {
  for (const candidate of candidates) {
    if (exclude && candidate === exclude) {
      continue;
    }

    const value = (() => {
      switch (candidate) {
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
    })();

    if (value !== null) {
      return { value, key: candidate } as const;
    }
  }

  return { value: null, key: null } as const;
};

const renderMetricsList = (
  metrics: MonthlyMetric[],
  formatNumber: FormatNumberFn,
  emptyLabel: string,
) => {
  if (metrics.length === 0) {
    return <p className="text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="mt-3 space-y-2 text-sm">
      {metrics.map((metric) => (
        <div
          key={metric.key}
          className="flex items-baseline justify-between text-slate-100"
        >
          <span className="text-slate-400">{metric.label}</span>
          <span className="text-lg font-semibold text-slate-100">
            {formatNumber(metric.value, {
              maximumFractionDigits: 0,
              ...(metric.formatOptions ?? {}),
            })}
            {metric.suffix ?? ""}
          </span>
        </div>
      ))}
    </div>
  );
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
  currentPeriodLabel = null,
  previousPeriodLabel = null,
}) => {
  const hasCurrentMetrics = currentMetrics.length > 0;
  const hasPreviousMetrics = previousMetrics.length > 0;
  const hasDelta = deltaMetrics.length > 0;

  const chartData = useMemo(() => {
    if (!Array.isArray(series) || series.length === 0) {
      return [] as Array<{
        key: string;
        label: string;
        primary: number;
        secondary: number | null;
      }>;
    }

    return series.map((item) => {
      const primary = resolveSeriesValue(item, [
        "primary",
        "likes",
        "comments",
      ]);
      const secondary = resolveSeriesValue(
        item,
        ["secondary", "posts", "likes", "comments"],
        primary.key ?? undefined,
      );

      return {
        key: item.key,
        label: resolveMonthLabel(item),
        primary: Math.max(0, primary.value ?? 0),
        secondary:
          secondary.value !== null ? Math.max(0, secondary.value) : null,
      };
    });
  }, [series]);

  const hasTrend = chartData.length > 0;
  const hasTrendData = hasTrend
    ? chartData.some((point) => point.primary > 0 || (point.secondary ?? 0) > 0)
    : false;

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 text-sm text-slate-400">
        Memuat tren bulanan…
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_18px_38px_rgba(15,23,42,0.35)]"
      style={{ minHeight: "calc(100% + 2px)" }}
    >
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
            {currentPeriodLabel ? (
              <p className="mt-1 text-sm text-slate-400">{currentPeriodLabel}</p>
            ) : null}
            {renderMetricsList(
              currentMetrics,
              formatNumber,
              "Belum ada data bulan ini.",
            )}
          </div>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Bulan Sebelumnya
            </p>
            {previousPeriodLabel ? (
              <p className="mt-1 text-sm text-slate-400">{previousPeriodLabel}</p>
            ) : null}
            {hasPreviousMetrics ? (
              renderMetricsList(
                previousMetrics,
                formatNumber,
                "Belum ada pembanding.",
              )
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                Belum ada pembanding.
              </p>
            )}
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
            const safeAbsolute =
              delta.absolute !== null && delta.absolute !== undefined
                ? Number(delta.absolute)
                : null;
            const absoluteValue =
              safeAbsolute !== null && Number.isFinite(safeAbsolute)
                ? safeAbsolute
                : null;
            const percentValue =
              delta.percent !== null && delta.percent !== undefined
                ? Number(delta.percent)
                : null;

            const accent = (() => {
              if (absoluteValue === null || absoluteValue === 0) {
                return "text-slate-200";
              }
              return absoluteValue > 0 ? "text-emerald-300" : "text-rose-300";
            })();

            const prefix = (() => {
              if (absoluteValue === null || absoluteValue === 0) {
                return "±";
              }
              return absoluteValue > 0 ? "+" : "−";
            })();

            const formattedAbsolute =
              absoluteValue !== null
                ? `${prefix}${formatNumber(Math.abs(absoluteValue), {
                    maximumFractionDigits: 0,
                  })}`
                : "–";

            const percentLabel = (() => {
              if (percentValue === null || !Number.isFinite(percentValue)) {
                return "Tidak ada perbandingan persentase.";
              }

              const safePercent = Math.abs(percentValue);
              return `${prefix}${formatPercent(safePercent)}`;
            })();

            return (
              <div
                key={delta.key}
                className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {delta.label}
                </p>
                <p className={`mt-2 text-lg font-semibold ${accent}`}>
                  {formattedAbsolute}
                </p>
                <p className="text-xs text-slate-400">{percentLabel}</p>
              </div>
            );
          })}
        </div>
      ) : null}

      {hasTrend ? (
        <div className="mt-6 space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Tren {primaryMetricLabel}
          </p>
          <div className="h-64">
            {hasTrendData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.2)"
                  />
                  <XAxis
                    dataKey="label"
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5f5", fontSize: 12 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5f5", fontSize: 12 }}
                    tickFormatter={(value) =>
                      formatNumber(Number.isFinite(value) ? Number(value) : 0, {
                        maximumFractionDigits: 0,
                      })
                    }
                  />
                  <Tooltip
                    cursor={{ stroke: "rgba(56,189,248,0.45)", strokeWidth: 2 }}
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.92)",
                      borderRadius: 16,
                      borderColor: "rgba(148,163,184,0.4)",
                      color: "#e2e8f0",
                    }}
                    formatter={(value: number, name: string, payload) => {
                      const entry =
                        payload && typeof payload === "object"
                          ? (payload as { dataKey?: string | undefined })
                          : undefined;
                      const dataKey = entry?.dataKey;

                      if (dataKey === "primary") {
                        return [
                          formatNumber(Number.isFinite(value) ? Number(value) : 0, {
                            maximumFractionDigits: 0,
                          }),
                          primaryMetricLabel,
                        ];
                      }

                      if (dataKey === "secondary") {
                        return [
                          formatNumber(Number.isFinite(value) ? Number(value) : 0, {
                            maximumFractionDigits: 0,
                          }),
                          secondaryMetricLabel,
                        ];
                      }

                      return [value, name];
                    }}
                  />
                  <defs>
                    <linearGradient id="monthlyPrimaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="primary"
                    name={primaryMetricLabel}
                    stroke="#38bdf8"
                    fill="url(#monthlyPrimaryGradient)"
                    strokeWidth={3}
                    dot={{
                      stroke: "#38bdf8",
                      strokeWidth: 2,
                      fill: "#0f172a",
                    }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-900/60 text-sm text-slate-400">
                Belum ada tren bulanan yang dapat ditampilkan.
              </div>
            )}
          </div>

          <ul className="space-y-2 text-xs text-slate-400">
            {chartData.map((point) => (
              <li key={point.key}>
                <span className="font-semibold text-slate-200">
                  {point.label}
                </span>
                {": "}
                {primaryMetricLabel}: {formatNumber(point.primary, {
                  maximumFractionDigits: 0,
                })}
                {point.secondary !== null
                  ? ` • ${secondaryMetricLabel}: ${formatNumber(point.secondary, {
                      maximumFractionDigits: 0,
                    })}`
                  : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default MonthlyTrendCard;
