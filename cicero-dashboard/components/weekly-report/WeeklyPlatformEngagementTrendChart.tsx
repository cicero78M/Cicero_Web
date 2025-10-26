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

type WeeklyPlatformEngagementTrendChartProps = {
  platformKey?: string | null;
  platformLabel?: string | null;
  series?: WeeklyEngagementPoint[];
  latest?: WeeklyEngagementPoint | null;
  previous?: WeeklyEngagementPoint | null;
  loading?: boolean;
  error?: string;
  formatNumber?: FormatNumberFn;
  personnelCount?: number | null;
  personnelLabel?: string | null;
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

const WeeklyPlatformEngagementTrendChart: React.FC<WeeklyPlatformEngagementTrendChartProps> = ({
  platformKey,
  platformLabel,
  series = [],
  latest = null,
  previous = null,
  loading = false,
  error = "",
  formatNumber = defaultNumberFormatter,
  personnelCount = null,
  personnelLabel = null,
}) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Menyiapkan tren interaksi mingguan…
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
        Belum ada tren interaksi mingguan untuk laporan ini.
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
  const shouldShowComments =
    resolvedPlatformKey === "instagram" || resolvedPlatformKey === "tiktok";

  const weeklyInsights = useMemo(() => {
    const insights: string[] = [];
    const hasPrevious = previousPoint !== null;

    const formatInteger = (value: number) =>
      formatNumber(Number.isFinite(value) ? value : 0, {
        maximumFractionDigits: 0,
      });

    const formatAverage = (value: number) =>
      formatNumber(Number.isFinite(value) ? value : 0, {
        maximumFractionDigits: 1,
        minimumFractionDigits: 1,
      });

    const interactionsNow = latestPoint.interactions ?? 0;
    const interactionsPrev = hasPrevious ? previousPoint?.interactions ?? 0 : null;
    if (!hasPrevious) {
      insights.push(
        `Total interaksi minggu ini tercatat ${formatInteger(
          interactionsNow,
        )} tanpa pembanding minggu lalu.`,
      );
    } else if ((interactionsPrev ?? 0) === interactionsNow) {
      insights.push(
        `Total interaksi stabil di ${formatInteger(interactionsNow)} dibanding minggu lalu.`,
      );
    } else if ((interactionsPrev ?? 0) === 0) {
      insights.push(
        `Total interaksi mencapai ${formatInteger(interactionsNow)} dari 0 pada minggu lalu.`,
      );
    } else {
      const direction = interactionsNow > (interactionsPrev ?? 0) ? "naik" : "turun";
      const delta = Math.abs(interactionsNow - (interactionsPrev ?? 0));
      insights.push(
        `Total interaksi ${direction} ke ${formatInteger(interactionsNow)} dari ${formatInteger(
          interactionsPrev ?? 0,
        )} (Δ ${interactionsNow > (interactionsPrev ?? 0) ? "+" : "−"}${formatInteger(delta)}).`,
      );
    }

    const postsNow = latestPoint.posts ?? 0;
    const postsPrev = hasPrevious ? previousPoint?.posts ?? 0 : null;
    if (postsNow === 0) {
      if (!hasPrevious) {
        insights.push("Tidak ada konten baru minggu ini dan belum ada pembanding sebelumnya.");
      } else if ((postsPrev ?? 0) === 0) {
        insights.push("Tidak ada konten baru dua minggu terakhir.");
      } else {
        insights.push(
          `Tidak ada konten baru minggu ini (sebelumnya ${formatInteger(postsPrev ?? 0)}).`,
        );
      }
    } else if (!hasPrevious) {
      insights.push(
        `Jumlah konten minggu ini sebanyak ${formatInteger(
          postsNow,
        )} tanpa pembanding minggu lalu.`,
      );
    } else if ((postsPrev ?? 0) === postsNow) {
      insights.push(`Jumlah konten stabil di ${formatInteger(postsNow)}.`);
    } else {
      const direction = postsNow > (postsPrev ?? 0) ? "naik" : "turun";
      const delta = Math.abs(postsNow - (postsPrev ?? 0));
      insights.push(
        `Jumlah konten ${direction} ke ${formatInteger(postsNow)} dari ${formatInteger(
          postsPrev ?? 0,
        )} (Δ ${postsNow > (postsPrev ?? 0) ? "+" : "−"}${formatInteger(delta)}).`,
      );
    }

    const likesNow = latestPoint.likes ?? 0;
    const likesPrev = hasPrevious ? previousPoint?.likes ?? 0 : null;
    if (shouldShowLikes) {
      if (!hasPrevious) {
        insights.push(
          `Perolehan suka mencapai ${formatInteger(likesNow)} minggu ini tanpa pembanding minggu lalu.`,
        );
      } else {
        const direction = likesNow >= (likesPrev ?? 0) ? "naik" : "turun";
        const delta = Math.abs(likesNow - (likesPrev ?? 0));
        insights.push(
          `Jumlah suka ${direction} menjadi ${formatInteger(likesNow)} (Δ ${
            likesNow >= (likesPrev ?? 0) ? "+" : "−"
          }${formatInteger(delta)}).`,
        );
      }
    }

    const commentsNow = latestPoint.comments ?? 0;
    const commentsPrev = hasPrevious ? previousPoint?.comments ?? 0 : null;
    if (shouldShowComments) {
      if (!hasPrevious) {
        insights.push(
          `Komentar minggu ini sebanyak ${formatInteger(commentsNow)} tanpa pembanding minggu lalu.`,
        );
      } else {
        const direction = commentsNow >= (commentsPrev ?? 0) ? "naik" : "turun";
        const delta = Math.abs(commentsNow - (commentsPrev ?? 0));
        insights.push(
          `Jumlah komentar ${direction} menjadi ${formatInteger(commentsNow)} (Δ ${
            commentsNow >= (commentsPrev ?? 0) ? "+" : "−"
          }${formatInteger(delta)}).`,
        );
      }
    }

    if (Number.isFinite(personnelCount) && (personnelCount ?? 0) > 0) {
      const weeklyAverage = (latestPoint.interactions ?? 0) / (personnelCount ?? 1);
      const label = personnelLabel ?? "personel";
      insights.push(
        `Rata-rata interaksi per ${label} minggu ini ${formatAverage(weeklyAverage)}.`,
      );
    }

    return insights;
  }, [
    formatNumber,
    latestPoint,
    personnelCount,
    personnelLabel,
    previousPoint,
    shouldShowComments,
    shouldShowLikes,
  ]);

  const chartTitle = platformLabel
    ? `Tren Interaksi ${platformLabel} Mingguan`
    : "Tren Interaksi Mingguan";

  return (
    <div className="space-y-6 rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">{chartTitle}</h3>
          <p className="text-sm text-slate-400">
            Pantau perubahan interaksi mingguan beserta insight otomatis yang relevan untuk laporan ini.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-800/60 px-4 py-2 text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">Total Minggu Ini</p>
          <p className="text-xl font-semibold text-white">
            {formatNumber(latestPoint.interactions ?? 0, { maximumFractionDigits: 0 })}
          </p>
          {interactionDelta !== null && (
            <p className="text-xs text-slate-400">
              Δ {interactionDelta >= 0 ? "+" : "−"}
              {formatNumber(Math.abs(interactionDelta), { maximumFractionDigits: 0 })}
            </p>
          )}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer>
          <AreaChart data={chartData}>
            <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(value) =>
              formatNumber(Number(value) || 0, { maximumFractionDigits: 0 })
            } />
            <Tooltip
              cursor={{ strokeDasharray: "4 4", stroke: "#334155" }}
              contentStyle={{
                backgroundColor: "#0f172a",
                border: "1px solid #1e293b",
                borderRadius: "1rem",
                color: "#e2e8f0",
              }}
              formatter={(value: any) =>
                formatNumber(Number(value) || 0, { maximumFractionDigits: 0 })
              }
            />
            <Area type="monotone" dataKey="interactions" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {weeklyInsights.length > 0 && (
        <div className="space-y-2 rounded-2xl bg-slate-950/60 p-4 text-sm text-slate-300">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Insight Mingguan Otomatis
          </p>
          <ul className="list-disc space-y-1 pl-5">
            {weeklyInsights.map((insight, index) => (
              <li key={index}>{insight}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default WeeklyPlatformEngagementTrendChart;
