"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type FormatNumberFn = (
  value: number,
  options?: Intl.NumberFormatOptions,
) => string;

type DailyTrendPoint = {
  key: string;
  label?: string | null;
  posts?: number | null;
  likes?: number | null;
  comments?: number | null;
  interactions?: number | null;
};

type DailyTrendTotals = {
  posts: number;
  likes: number;
  comments: number;
  interactions: number;
};

type DailyTrendChartProps = {
  series?: DailyTrendPoint[];
  totals?: DailyTrendTotals | null;
  dayCount?: number;
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

const resolvePoint = (point?: DailyTrendPoint | null) => {
  if (!point) {
    return {
      key: "",
      label: "",
      posts: 0,
      likes: 0,
      comments: 0,
      interactions: 0,
    };
  }

  const toSafe = (value?: number | null) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
  };

  return {
    key: point.key,
    label: point.label ?? point.key ?? "",
    posts: toSafe(point.posts),
    likes: toSafe(point.likes),
    comments: toSafe(point.comments),
    interactions: toSafe(point.interactions),
  };
};

const DailyTrendChart: React.FC<DailyTrendChartProps> = ({
  series = [],
  totals,
  dayCount,
  formatNumber = defaultNumberFormatter,
}) => {
  const data = useMemo(() => {
    if (!Array.isArray(series)) {
      return [];
    }

    return series
      .map((point) => resolvePoint(point))
      .filter(
        (point) =>
          point.posts > 0 ||
          point.likes > 0 ||
          point.comments > 0 ||
          point.interactions > 0,
      );
  }, [series]);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Belum ada data tren harian yang siap ditampilkan.
      </div>
    );
  }

  const computedTotals = useMemo(() => {
    if (totals && typeof totals === "object") {
      return {
        posts: Math.max(0, Number(totals.posts) || 0),
        likes: Math.max(0, Number(totals.likes) || 0),
        comments: Math.max(0, Number(totals.comments) || 0),
        interactions: Math.max(0, Number(totals.interactions) || 0),
      };
    }

    return data.reduce(
      (acc, point) => {
        acc.posts += point.posts;
        acc.likes += point.likes;
        acc.comments += point.comments;
        acc.interactions += point.interactions;
        return acc;
      },
      { posts: 0, likes: 0, comments: 0, interactions: 0 },
    );
  }, [data, totals]);

  const safeDayCount = (() => {
    if (typeof dayCount === "number" && Number.isFinite(dayCount) && dayCount > 0) {
      return dayCount;
    }
    return data.length > 0 ? data.length : 1;
  })();

  const averages = {
    posts: computedTotals.posts / safeDayCount,
    likes: computedTotals.likes / safeDayCount,
    comments: computedTotals.comments / safeDayCount,
    interactions: computedTotals.interactions / safeDayCount,
  };

  const latestPoint = data[data.length - 1];

  const summaryCards = [
    {
      key: "posts",
      label: "Total Post",
      value: formatNumber(computedTotals.posts, { maximumFractionDigits: 0 }),
      helper: `Rata-rata ${formatNumber(averages.posts, {
        maximumFractionDigits: averages.posts < 10 ? 1 : 0,
        minimumFractionDigits: averages.posts > 0 && averages.posts < 10 ? 1 : 0,
      })} per hari`,
      accent: "from-amber-500/20 via-transparent to-slate-900/40",
    },
    {
      key: "likes",
      label: "Total Likes Personil",
      value: formatNumber(computedTotals.likes, { maximumFractionDigits: 0 }),
      helper: `Rata-rata ${formatNumber(averages.likes, {
        maximumFractionDigits: averages.likes < 10 ? 1 : 0,
        minimumFractionDigits: averages.likes > 0 && averages.likes < 10 ? 1 : 0,
      })} per hari`,
      accent: "from-cyan-500/20 via-transparent to-slate-900/40",
    },
    {
      key: "comments",
      label: "Total Komentar Personil",
      value: formatNumber(computedTotals.comments, { maximumFractionDigits: 0 }),
      helper: `Rata-rata ${formatNumber(averages.comments, {
        maximumFractionDigits: averages.comments < 10 ? 1 : 0,
        minimumFractionDigits:
          averages.comments > 0 && averages.comments < 10 ? 1 : 0,
      })} per hari`,
      accent: "from-fuchsia-500/20 via-transparent to-slate-900/40",
    },
    {
      key: "interactions",
      label: "Total Interaksi",
      value: formatNumber(computedTotals.interactions, { maximumFractionDigits: 0 }),
      helper: `Rata-rata ${formatNumber(averages.interactions, {
        maximumFractionDigits: averages.interactions < 10 ? 1 : 0,
        minimumFractionDigits:
          averages.interactions > 0 && averages.interactions < 10 ? 1 : 0,
      })} per hari`,
      accent: "from-sky-500/20 via-transparent to-slate-900/40",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.key}
            className="group relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.35)]"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80 transition-opacity duration-300 group-hover:opacity-100`}
            />
            <div className="relative space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">
                {card.label}
              </p>
              <p className="text-2xl font-semibold text-slate-100">{card.value}</p>
              <p className="text-xs text-slate-400">{card.helper}</p>
            </div>
          </div>
        ))}
      </div>

      {latestPoint ? (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/70 px-5 py-[21px] shadow-[0_18px_40px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                Aktivitas Terakhir
              </p>
              <p className="mt-1 text-base font-medium text-slate-200">{latestPoint.label}</p>
            </div>
            <div className="hidden flex-1 items-center gap-2 sm:flex">
              <span className="h-px flex-1 bg-slate-800/80" />
              <span className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                Ringkasan Hari Ini
              </span>
              <span className="h-px flex-1 bg-slate-800/80" />
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <div>
                <p className="text-xs text-amber-200/70">Post</p>
                <p className="mt-1 text-lg font-semibold text-amber-300">
                  {formatNumber(latestPoint.posts, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-sm font-semibold text-amber-300">
                P
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
              <div>
                <p className="text-xs text-cyan-200/70">Likes Personil</p>
                <p className="mt-1 text-lg font-semibold text-cyan-300">
                  {formatNumber(latestPoint.likes, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-300">
                L
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/5 px-4 py-3">
              <div>
                <p className="text-xs text-fuchsia-200/70">Komentar Personil</p>
                <p className="mt-1 text-lg font-semibold text-fuchsia-300">
                  {formatNumber(latestPoint.comments, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-fuchsia-500/10 text-sm font-semibold text-fuchsia-300">
                K
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-sky-500/20 bg-sky-500/5 px-4 py-3">
              <div>
                <p className="text-xs text-sky-200/70">Total Interaksi</p>
                <p className="mt-1 text-lg font-semibold text-sky-300">
                  {formatNumber(latestPoint.interactions, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/10 text-sm font-semibold text-sky-300">
                I
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              tick={{ fill: "#cbd5f5", fontSize: 12 }}
              tickFormatter={(value) =>
                formatNumber(Number.isFinite(value) ? Number(value) : 0, {
                  maximumFractionDigits: 0,
                })
              }
            />
            <YAxis
              yAxisId="right"
              orientation="right"
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
              formatter={(value: number, name: string) => {
                const numeric = Number(value);
                const safeValue = Number.isFinite(numeric) ? numeric : 0;
                return [
                  formatNumber(safeValue, {
                    maximumFractionDigits: name === "Post" ? 0 : 0,
                  }),
                  name,
                ];
              }}
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              wrapperStyle={{ color: "#e2e8f0" }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="posts"
              name="Post"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ stroke: "#fbbf24", strokeWidth: 2, fill: "#0f172a" }}
              activeDot={{ r: 6 }}
              strokeDasharray="6 4"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="likes"
              name="Likes Personil"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={{ stroke: "#06b6d4", strokeWidth: 2, fill: "#0f172a" }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="comments"
              name="Komentar Personil"
              stroke="#c084fc"
              strokeWidth={2}
              dot={{ stroke: "#a855f7", strokeWidth: 2, fill: "#0f172a" }}
              activeDot={{ r: 6 }}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="interactions"
              name="Total Interaksi"
              stroke="#38bdf8"
              strokeWidth={3}
              dot={{ stroke: "#38bdf8", strokeWidth: 2, fill: "#0f172a" }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyTrendChart;
