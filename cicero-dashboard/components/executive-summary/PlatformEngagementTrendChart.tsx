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

type WeeklyEngagementPoint = {
  key: string;
  label?: string;
  engagementRate?: number | null;
  interactions?: number | null;
  posts?: number | null;
};

type PlatformEngagementTrendChartProps = {
  platformLabel?: string | null;
  series?: WeeklyEngagementPoint[];
  latest?: WeeklyEngagementPoint | null;
  previous?: WeeklyEngagementPoint | null;
  loading?: boolean;
  error?: string;
  formatNumber?: FormatNumberFn;
  formatPercent?: FormatPercentFn;
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

const resolvePoint = (point?: WeeklyEngagementPoint | null) => {
  if (!point) {
    return {
      label: "",
      engagementRate: 0,
      interactions: 0,
      posts: 0,
    };
  }

  const engagementRate = Number(point.engagementRate);
  const interactions = Number(point.interactions);
  const posts = Number(point.posts);

  return {
    label: point.label ?? point.key ?? "",
    engagementRate: Number.isFinite(engagementRate) ? Math.max(0, engagementRate) : 0,
    interactions: Number.isFinite(interactions) ? Math.max(0, interactions) : 0,
    posts: Number.isFinite(posts) ? Math.max(0, posts) : 0,
  };
};

const PlatformEngagementTrendChart: React.FC<PlatformEngagementTrendChartProps> = ({
  platformLabel,
  series = [],
  latest = null,
  previous = null,
  loading = false,
  error = "",
  formatNumber = defaultNumberFormatter,
  formatPercent = defaultPercentFormatter,
}) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Menyiapkan tren engagement…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  const chartData = useMemo(() => {
    if (!Array.isArray(series) || series.length === 0) {
      return [];
    }

    return series.map((point) => {
      const resolved = resolvePoint(point);
      return {
        key: point.key,
        label: resolved.label,
        engagementRate: resolved.engagementRate,
        interactions: resolved.interactions,
      };
    });
  }, [series]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Belum ada tren engagement mingguan yang tersedia.
      </div>
    );
  }

  const latestPoint = resolvePoint(latest);
  const previousPoint = previous ? resolvePoint(previous) : null;

  const engagementDelta =
    previousPoint !== null
      ? latestPoint.engagementRate - (previousPoint?.engagementRate ?? 0)
      : null;
  const interactionDelta =
    previousPoint !== null
      ? latestPoint.interactions - (previousPoint?.interactions ?? 0)
      : null;

  const renderDelta = (value: number | null, formatter: (val: number) => string) => {
    if (value === null || !Number.isFinite(value)) {
      return null;
    }
    if (value === 0) {
      return <span className="text-xs text-slate-400">tidak berubah</span>;
    }
    const isPositive = value > 0;
    const accent = isPositive ? "text-emerald-300" : "text-rose-300";
    const prefix = isPositive ? "+" : "−";
    const formatted = formatter(Math.abs(value));
    return <span className={`text-xs ${accent}`}>{`${prefix}${formatted}`}</span>;
  };

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
          Weekly Engagement
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-50">
          Tren Engagement {platformLabel ? platformLabel : "Platform"}
        </h3>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Minggu Terakhir</p>
          <p className="mt-1 text-sm text-slate-400">{latestPoint.label}</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-baseline justify-between">
              <span className="text-slate-400">Engagement Rate</span>
              <span className="text-lg font-semibold text-slate-100">
                {formatPercent(latestPoint.engagementRate)}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-slate-400">Total Interaksi</span>
              <span className="text-lg font-semibold text-slate-100">
                {formatNumber(latestPoint.interactions, { maximumFractionDigits: 0 })}
              </span>
            </div>
            {typeof latestPoint.posts === "number" && latestPoint.posts > 0 ? (
              <div className="flex items-baseline justify-between">
                <span className="text-slate-400">Jumlah Konten</span>
                <span className="text-lg font-semibold text-slate-100">
                  {formatNumber(latestPoint.posts, { maximumFractionDigits: 0 })}
                </span>
              </div>
            ) : null}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Minggu Sebelumnya</p>
          {previousPoint ? (
            <>
              <p className="mt-1 text-sm text-slate-400">{previousPoint.label}</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-400">Engagement Rate</span>
                  <span className="text-lg font-semibold text-slate-100">
                    {formatPercent(previousPoint.engagementRate)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-400">Total Interaksi</span>
                  <span className="text-lg font-semibold text-slate-100">
                    {formatNumber(previousPoint.interactions, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                {typeof previousPoint.posts === "number" && previousPoint.posts > 0 ? (
                  <div className="flex items-baseline justify-between">
                    <span className="text-slate-400">Jumlah Konten</span>
                    <span className="text-lg font-semibold text-slate-100">
                      {formatNumber(previousPoint.posts, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Belum ada pembanding pekan sebelumnya.</p>
          )}
        </div>
      </div>

      {previousPoint ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Perubahan Engagement
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-400">vs minggu lalu</span>
              {renderDelta(engagementDelta, formatPercent)}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              Perubahan Interaksi
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-slate-400">vs minggu lalu</span>
              {renderDelta(interactionDelta, (value) =>
                formatNumber(value, { maximumFractionDigits: 0 }),
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
            <YAxis
              stroke="#94a3b8"
              tick={{ fill: "#cbd5f5", fontSize: 12 }}
              tickFormatter={(value) => formatPercent(Number(value) || 0)}
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
                if (name === "engagementRate") {
                  return [formatPercent(value ?? 0), "Engagement Rate"];
                }

                if (name === "interactions") {
                  return [
                    formatNumber(value ?? 0, { maximumFractionDigits: 0 }),
                    "Total Interaksi",
                  ];
                }

                if (payload && typeof payload === "object" && "payload" in payload) {
                  const dataPoint = (payload as any).payload as { interactions?: number };
                  if (dataPoint?.interactions !== undefined) {
                    return [
                      formatNumber(dataPoint.interactions ?? 0, {
                        maximumFractionDigits: 0,
                      }),
                      "Total Interaksi",
                    ];
                  }
                }

                return [value, name];
              }}
            />
            <defs>
              <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="engagementRate"
              name="Engagement Rate"
              stroke="#38bdf8"
              fill="url(#engagementGradient)"
              strokeWidth={3}
              dot={{ stroke: "#38bdf8", strokeWidth: 2, fill: "#0f172a" }}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PlatformEngagementTrendChart;
