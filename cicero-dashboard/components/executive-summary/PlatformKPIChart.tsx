"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

type FormatNumberFn = (value: number, options?: Intl.NumberFormatOptions) => string;

type PlatformKPIChartProps = {
  platform?: {
    key: string;
    label: string;
    likes: number;
    comments: number;
    derived?: {
      totalInteractions?: number;
      averageInteractions?: number;
      averageReach?: number;
    };
  } | null;
  loading?: boolean;
  error?: string;
  formatNumber: FormatNumberFn;
};

const PlatformKPIChart: React.FC<PlatformKPIChartProps> = ({
  platform,
  loading = false,
  error = "",
  formatNumber,
}) => {
  const chartData = useMemo(() => {
    if (!platform) {
      return [];
    }

    const totalInteractions = platform.derived?.totalInteractions ?? 0;
    const averageInteractions = platform.derived?.averageInteractions ?? 0;
    const averageReach = platform.derived?.averageReach ?? 0;

    return [
      {
        key: "likes",
        label: "Likes",
        value: Math.max(0, platform.likes ?? 0),
      },
      {
        key: "comments",
        label: "Komentar",
        value: Math.max(0, platform.comments ?? 0),
      },
      {
        key: "interactions",
        label: "Total Interaksi",
        value: Math.max(0, totalInteractions),
      },
      {
        key: "avg_interactions",
        label: "Rata-rata Interaksi",
        value: Math.max(0, averageInteractions),
      },
      {
        key: "avg_reach",
        label: "Rata-rata Reach",
        value: Math.max(0, averageReach),
      },
    ];
  }, [platform]);

  if (loading) {
    return (
      <div className="h-full rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Menyiapkan grafik KPI…
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full rounded-3xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  if (!platform || chartData.every((item) => !item.value)) {
    return (
      <div className="h-full rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Belum ada KPI yang dapat divisualisasikan.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
        KPI Inti Platform
      </h3>
      <div className="mt-6 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
            <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
            <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
            <Tooltip
              cursor={{ fill: "rgba(15,23,42,0.25)" }}
              contentStyle={{
                backgroundColor: "rgba(15,23,42,0.92)",
                borderRadius: 16,
                borderColor: "rgba(148,163,184,0.4)",
                color: "#e2e8f0",
              }}
              formatter={(value: number, _name: string, item) => {
                if (item?.payload?.key === "avg_interactions" || item?.payload?.key === "avg_reach") {
                  return [formatNumber(value, { maximumFractionDigits: 0 }), item?.payload?.label];
                }
                return [formatNumber(value, { maximumFractionDigits: 0 }), item?.payload?.label];
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#38bdf8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PlatformKPIChart;
