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

type WeeklyEngagementPoint = {
  key: string;
  label?: string;
  interactions?: number | null;
  posts?: number | null;
  likes?: number | null;
  comments?: number | null;
};

type PlatformEngagementTrendChartProps = {
  platformKey?: string | null;
  platformLabel?: string | null;
  series?: WeeklyEngagementPoint[];
  latest?: WeeklyEngagementPoint | null;
  previous?: WeeklyEngagementPoint | null;
  loading?: boolean;
  error?: string;
  formatNumber?: FormatNumberFn;
};

const defaultNumberFormatter: FormatNumberFn = (value, options) => {
  const numericValue = Number.isFinite(value) ? Number(value) : 0;
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    ...(options ?? {}),
  }).format(Math.max(0, numericValue));
};

const resolvePoint = (point?: WeeklyEngagementPoint | null) => {
  if (!point) {
    return {
      label: "",
      interactions: 0,
      posts: 0,
      likes: 0,
      comments: 0,
    };
  }

  const interactions = Number(point.interactions);
  const posts = Number(point.posts);
  const likes = Number(point.likes);
  const comments = Number(point.comments);

  return {
    label: point.label ?? point.key ?? "",
    interactions: Number.isFinite(interactions) ? Math.max(0, interactions) : 0,
    posts: Number.isFinite(posts) ? Math.max(0, posts) : 0,
    likes: Number.isFinite(likes) ? Math.max(0, likes) : 0,
    comments: Number.isFinite(comments) ? Math.max(0, comments) : 0,
  };
};

const PlatformEngagementTrendChart: React.FC<PlatformEngagementTrendChartProps> = ({
  platformKey,
  platformLabel,
  series = [],
  latest = null,
  previous = null,
  loading = false,
  error = "",
  formatNumber = defaultNumberFormatter,
}) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Menyiapkan tren interaksi…
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
        interactions: resolved.interactions,
      };
    });
  }, [series]);

  if (chartData.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Belum ada tren interaksi mingguan yang tersedia.
      </div>
    );
  }

  const latestPoint = resolvePoint(latest);
  const previousPoint = previous ? resolvePoint(previous) : null;

  const interactionDelta =
    previousPoint !== null
      ? latestPoint.interactions - (previousPoint?.interactions ?? 0)
      : null;

  const resolvedPlatformKey = platformKey?.toLowerCase?.() ?? "";
  const shouldShowLikes =
    resolvedPlatformKey === "instagram" || resolvedPlatformKey === "tiktok";
  const shouldShowComments = resolvedPlatformKey === "instagram";

  const buildMetricRows = (point: ReturnType<typeof resolvePoint>) => {
    const rows: { label: string; value: string }[] = [
      {
        label: "Jumlah Konten",
        value: formatNumber(point.posts, { maximumFractionDigits: 0 }),
      },
    ];

    if (shouldShowLikes) {
      rows.push({
        label: "Likes Personil",
        value: formatNumber(point.likes, { maximumFractionDigits: 0 }),
      });
    }

    if (shouldShowComments) {
      rows.push({
        label: "Komentar Personil",
        value: formatNumber(point.comments, { maximumFractionDigits: 0 }),
      });
    }

    rows.push({
      label: "Total Interaksi",
      value: formatNumber(point.interactions, { maximumFractionDigits: 0 }),
    });

    return rows;
  };

  const renderDelta = (value: number | null) => {
    if (value === null || !Number.isFinite(value)) {
      return null;
    }
    if (value === 0) {
      return <span className="text-xs text-slate-400">tidak berubah</span>;
    }
    const isPositive = value > 0;
    const accent = isPositive ? "text-emerald-300" : "text-rose-300";
    const prefix = isPositive ? "+" : "−";
    const formatted = formatNumber(Math.abs(value), { maximumFractionDigits: 0 });
    return <span className={`text-xs ${accent}`}>{`${prefix}${formatted}`}</span>;
  };

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
          Weekly Interactions
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-50">
          Tren Interaksi {platformLabel ? platformLabel : "Platform"}
        </h3>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Minggu Terakhir</p>
          <p className="mt-1 text-sm text-slate-400">{latestPoint.label}</p>
          <div className="mt-3 space-y-2 text-sm">
            {buildMetricRows(latestPoint).map((row) => (
              <div
                key={row.label}
                className="flex items-baseline justify-between"
              >
                <span className="text-slate-400">{row.label}</span>
                <span className="text-lg font-semibold text-slate-100">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Minggu Sebelumnya</p>
          {previousPoint ? (
            <>
              <p className="mt-1 text-sm text-slate-400">{previousPoint.label}</p>
              <div className="mt-3 space-y-2 text-sm">
                {buildMetricRows(previousPoint).map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between"
                  >
                    <span className="text-slate-400">{row.label}</span>
                    <span className="text-lg font-semibold text-slate-100">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Belum ada pembanding pekan sebelumnya.</p>
          )}
        </div>
      </div>

      {previousPoint ? (
        <div className="mt-4 rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Perubahan Interaksi
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-slate-400">vs minggu lalu</span>
            {renderDelta(interactionDelta)}
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
                const tooltipEntry =
                  payload && typeof payload === "object"
                    ? (payload as { dataKey?: string | undefined })
                    : undefined;
                const dataKey = tooltipEntry?.dataKey;

                if (dataKey === "interactions" || name === "interactions") {
                  return [
                    formatNumber(Number.isFinite(value) ? Number(value) : 0, {
                      maximumFractionDigits: 0,
                    }),
                    "Total Interaksi",
                  ];
                }

                return [value, name];
              }}
            />
            <defs>
              <linearGradient id="interactionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.7} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="interactions"
              name="Total Interaksi"
              stroke="#38bdf8"
              fill="url(#interactionGradient)"
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
