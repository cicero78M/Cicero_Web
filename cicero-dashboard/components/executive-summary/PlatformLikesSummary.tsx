"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

interface LikesSummaryClient {
  clientKey: string;
  clientId: string | null;
  clientName: string;
  totalLikes: number;
  totalComments: number;
  activePersonnel: number;
  totalPersonnel: number;
  complianceRate: number;
  averageLikesPerUser: number;
}

interface LikesSummaryData {
  totals: {
    totalClients: number;
    totalLikes: number;
    totalComments: number;
    activePersonnel: number;
    averageComplianceRate: number;
  };
  clients: LikesSummaryClient[];
  lastUpdated: Date | string | null;
}

interface PlatformLikesSummaryProps {
  data: LikesSummaryData;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number) => string;
}

const formatDateTime = (value: Date | string | null) => {
  if (!value) {
    return "";
  }

  const dateValue = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(dateValue.valueOf())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return formatter.format(dateValue);
};

const PlatformLikesSummary = ({
  data,
  formatNumber,
  formatPercent,
}: PlatformLikesSummaryProps) => {
  const clients = Array.isArray(data?.clients) ? data.clients : [];

  const summaryCards = useMemo(() => {
    const totals = data?.totals;
    if (!totals) {
      return [];
    }

    return [
      {
        key: "total-likes",
        label: "Total Likes",
        value: formatNumber(totals.totalLikes ?? 0, { maximumFractionDigits: 0 }),
        description: "Akumulasi likes personil selama periode",
      },
      {
        key: "total-comments",
        label: "Total Komentar",
        value: formatNumber(totals.totalComments ?? 0, { maximumFractionDigits: 0 }),
        description: "Komentar yang terekam pada konten",
      },
      {
        key: "active-personnel",
        label: "Personil Aktif",
        value: formatNumber(totals.activePersonnel ?? 0, { maximumFractionDigits: 0 }),
        description: "Personil unik yang tercatat berinteraksi",
      },
      {
        key: "avg-compliance",
        label: "Rata-rata Kepatuhan",
        value: formatPercent(totals.averageComplianceRate ?? 0),
        description: "Rasio kepatuhan rata-rata lintas satker",
      },
    ];
  }, [data?.totals, formatNumber, formatPercent]);

  const distributionData = useMemo(() => {
    return clients.slice(0, 8).map((client) => ({
      name: client.clientName,
      likes: client.totalLikes,
      compliance: client.complianceRate,
    }));
  }, [clients]);

  const topCompliance = useMemo(() => {
    return [...clients]
      .sort((a, b) => b.complianceRate - a.complianceRate)
      .slice(0, 3);
  }, [clients]);

  const lastUpdatedLabel = formatDateTime(data?.lastUpdated);

  if (clients.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Belum ada data rekap likes yang dapat ditampilkan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div
            key={card.key}
            className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 to-slate-900/80 p-5 shadow-[0_20px_45px_rgba(56,189,248,0.15)]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
            <p className="mt-2 text-xs text-slate-400">{card.description}</p>
          </div>
        ))}
      </div>

      {lastUpdatedLabel ? (
        <p className="text-xs text-slate-400">
          Pemutakhiran terakhir: <span className="text-slate-200">{lastUpdatedLabel}</span>
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
            Distribusi Likes per Satker
          </h3>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="py-3 pr-4">Satker</th>
                  <th className="px-4 py-3">Likes</th>
                  <th className="px-4 py-3">Komentar</th>
                  <th className="px-4 py-3">Personil Aktif</th>
                  <th className="px-4 py-3">Personil Total</th>
                  <th className="px-4 py-3">Kepatuhan</th>
                  <th className="px-4 py-3">Likes/Personil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clients.map((client) => {
                  const compliance = formatPercent(client.complianceRate ?? 0);
                  const avgLikes = formatNumber(client.averageLikesPerUser ?? 0, {
                    maximumFractionDigits: 1,
                  });

                  return (
                    <tr key={client.clientKey} className="text-slate-200">
                      <td className="py-3 pr-4 font-semibold text-slate-100">
                        {client.clientName}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatNumber(client.totalLikes, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatNumber(client.totalComments, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatNumber(client.activePersonnel, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatNumber(client.totalPersonnel, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right text-cyan-300">{compliance}</td>
                      <td className="px-4 py-3 text-right">{avgLikes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
              Kontributor Likes Teratas
            </h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={distributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(15,23,42,0.3)" }}
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      borderRadius: 16,
                      borderColor: "rgba(148,163,184,0.4)",
                      boxShadow: "0 20px 45px rgba(14,116,144,0.3)",
                      color: "#e2e8f0",
                    }}
                    formatter={(value: number) => [
                      formatNumber(value, { maximumFractionDigits: 0 }),
                      "Likes",
                    ]}
                    labelFormatter={(label: string | number, payload: any[]) => {
                      const entry = payload && payload.length > 0 ? payload[0].payload : null;
                      if (entry && typeof entry.compliance === "number") {
                        return `${label} · Kepatuhan ${formatPercent(entry.compliance)}`;
                      }
                      return label as string;
                    }}
                  />
                  <Legend wrapperStyle={{ color: "#e2e8f0" }} />
                  <Bar dataKey="likes" fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
              Kepatuhan Tertinggi
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              {topCompliance.map((client) => (
                <li key={`compliance-${client.clientKey}`} className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-100">{client.clientName}</p>
                    <p className="text-xs text-slate-400">
                      {formatNumber(client.activePersonnel, { maximumFractionDigits: 0 })} personil aktif
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-cyan-300">
                    {formatPercent(client.complianceRate ?? 0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformLikesSummary;
