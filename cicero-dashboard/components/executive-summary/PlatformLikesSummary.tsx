"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";

interface LikesSummaryClient {
  key: string;
  clientId?: string | null;
  clientName: string;
  satfung?: string | null;
  totalLikes: number;
  totalComments: number;
  activePersonnel: number;
  totalPersonnel: number;
  personnelWithLikes: number;
  complianceRate: number;
  averageLikesPerUser: number;
  averageCommentsPerUser?: number;
}

interface LikesSummaryPersonnel {
  key: string;
  clientId?: string | null;
  clientName: string;
  username: string;
  nama: string;
  pangkat?: string;
  likes: number;
  comments: number;
  active: boolean;
}

interface LikesSummaryData {
  totals: {
    totalClients: number;
    totalLikes: number;
    totalComments: number;
    totalPersonnel: number;
    activePersonnel: number;
    personnelWithLikes: number;
    complianceRate: number;
    averageComplianceRate: number;
  };
  clients: LikesSummaryClient[];
  topPersonnel: LikesSummaryPersonnel[];
  lastUpdated: Date | string | null;
}

type SummaryCardTrend = "up" | "down" | "flat";

interface SummaryCardComparison {
  label: string;
  direction?: SummaryCardTrend;
}

interface SummaryCardInfo {
  key: string;
  label: string;
  value: string;
  description?: string;
  comparison?: SummaryCardComparison | null;
}

interface LabelOverrides {
  likesContributorsTitle?: string;
  likesContributorsDescription?: string;
  commentContributorsTitle?: string;
  commentContributorsDescription?: string;
  topComplianceTitle?: string;
  topComplianceDescription?: string;
  commentPersonnelTitle?: string;
  commentPersonnelDescription?: string;
  likesPersonnelTitle?: string;
  likesPersonnelDescription?: string;
  tableTitle?: string;
  tableSubtitle?: string | null;
  tableEmptyLabel?: string;
}

interface PersonnelDistributionRow {
  key: string;
  pangkat?: string | null;
  nama?: string | null;
  satfung?: string | null;
  likes: number;
  comments: number;
  interactions?: number;
}

interface PersonnelDistributionMeta {
  note?: string | null;
}

interface ActivityCategory {
  key: string;
  label: string;
  description: string;
  count: number;
}

interface PersonnelActivitySummary {
  loading: boolean;
  error?: string | null;
  categories: ActivityCategory[];
  totalEvaluated: number;
  totalContentEvaluated: number;
  hasSummary: boolean;
}

type HiddenSectionKey =
  | "topCompliance"
  | "topCommentPersonnel"
  | "topLikesPersonnel";

interface PlatformLikesSummaryProps {
  data: LikesSummaryData;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatPercent: (value: number) => string;
  personnelActivity?: PersonnelActivitySummary | null;
  postTotals?: {
    instagram: number;
    tiktok: number;
  } | null;
  summaryCards?: SummaryCardInfo[] | null;
  labelOverrides?: LabelOverrides | null;
  personnelDistribution?: PersonnelDistributionRow[] | null;
  personnelDistributionMeta?: PersonnelDistributionMeta | null;
  hiddenSections?: Partial<Record<HiddenSectionKey, boolean>> | null;
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
  personnelActivity,
  postTotals,
  summaryCards,
  labelOverrides,
  personnelDistribution,
  personnelDistributionMeta,
  hiddenSections,
}: PlatformLikesSummaryProps) => {
  const clients = Array.isArray(data?.clients) ? data.clients : [];
  const topPersonnel = Array.isArray(data?.topPersonnel) ? data.topPersonnel : [];
  const instagramPostCount = Math.max(0, Number(postTotals?.instagram) || 0);
  const tiktokPostCount = Math.max(0, Number(postTotals?.tiktok) || 0);
  const sectionVisibility: Partial<Record<HiddenSectionKey, boolean>> = hiddenSections ?? {};

  const computedSummaryCards = useMemo((): SummaryCardInfo[] => {
    if (Array.isArray(summaryCards) && summaryCards.length > 0) {
      return summaryCards;
    }

    const totals = data?.totals;
    if (!totals) {
      return [];
    }

    return [
      {
        key: "total-clients",
        label: "Satker Terdata",
        value: formatNumber(totals.totalClients ?? 0, { maximumFractionDigits: 0 }),
        description: "Jumlah satker/polres yang tercakup dalam rekap.",
      },
      {
        key: "total-posts",
        label: "Total Post",
        value: formatNumber(instagramPostCount + tiktokPostCount, {
          maximumFractionDigits: 0,
        }),
        description: `Post Instagram: ${formatNumber(instagramPostCount, {
          maximumFractionDigits: 0,
        })} · Post TikTok: ${formatNumber(tiktokPostCount, {
          maximumFractionDigits: 0,
        })}`,
      },
      {
        key: "total-likes",
        label: "Total Likes",
        value: formatNumber(totals.totalLikes ?? 0, { maximumFractionDigits: 0 }),
        description: "Seluruh likes personil pada periode terpilih.",
      },
      {
        key: "total-comments",
        label: "Total Komentar",
        value: formatNumber(totals.totalComments ?? 0, { maximumFractionDigits: 0 }),
        description: "Kumulatif komentar personil yang terekam.",
      },
      {
        key: "overall-compliance",
        label: "Kepatuhan Personil",
        value: formatPercent(totals.complianceRate ?? 0),
        description: `${formatNumber(totals.activePersonnel ?? 0, { maximumFractionDigits: 0 })} aktif dari ${formatNumber(totals.totalPersonnel ?? 0, { maximumFractionDigits: 0 })} personil terdata.`,
      },
    ];
  }, [
    data?.totals,
    formatNumber,
    formatPercent,
    instagramPostCount,
    tiktokPostCount,
    summaryCards,
  ]);

  const resolvedLabels: Required<LabelOverrides> = useMemo(
    () => ({
      likesContributorsTitle: "Kontributor Likes Teratas",
      likesContributorsDescription:
        "Satker dengan kontribusi likes tertinggi pada periode terpilih.",
      commentContributorsTitle: "Kontributor Komentar Teratas",
      commentContributorsDescription:
        "Satker dengan jumlah komentar terbanyak beserta rasio kepatuhan.",
      topComplianceTitle: "Kepatuhan Tertinggi",
      topComplianceDescription:
        "Satker dengan rasio kepatuhan tertinggi berdasarkan personil aktif.",
      commentPersonnelTitle: "Personil dengan Komentar Tertinggi",
      commentPersonnelDescription:
        "Individu dengan komentar terbanyak beserta asal satker terkait.",
      likesPersonnelTitle: "Personil dengan Likes Tertinggi",
      likesPersonnelDescription:
        "Individu dengan likes terbanyak beserta asal satker terkait.",
      tableTitle: "Distribusi Engagement per Satker",
      tableSubtitle: null,
      tableEmptyLabel: "Belum ada data distribusi engagement.",
      ...(labelOverrides ?? {}),
    }),
    [labelOverrides],
  );

  const distributionData = useMemo(() => {
    return [...clients]
      .sort((a, b) => b.totalLikes - a.totalLikes)
      .slice(0, 8)
      .map((client) => ({
        name: client.clientName,
        likes: client.totalLikes,
        compliance: client.complianceRate,
      }));
  }, [clients]);

  const commentDistributionData = useMemo(() => {
    return [...clients]
      .sort((a, b) => b.totalComments - a.totalComments)
      .slice(0, 8)
      .map((client) => ({
        name: client.clientName,
        comments: client.totalComments,
        compliance: client.complianceRate,
      }));
  }, [clients]);

  const topCompliance = useMemo(() => {
    return [...clients]
      .sort((a, b) => b.complianceRate - a.complianceRate)
      .slice(0, 6);
  }, [clients]);

  const clientsByCompliance = useMemo(() => {
    return [...clients].sort((a, b) => {
      const activePersonnelA = a.activePersonnel ?? 0;
      const activePersonnelB = b.activePersonnel ?? 0;

      if (activePersonnelB !== activePersonnelA) {
        return activePersonnelB - activePersonnelA;
      }

      const complianceA = a.complianceRate ?? 0;
      const complianceB = b.complianceRate ?? 0;
      const complianceDelta = complianceB - complianceA;

      if (Math.abs(complianceDelta) > 0.0001) {
        return complianceDelta;
      }

      const totalPersonnelA = a.totalPersonnel ?? 0;
      const totalPersonnelB = b.totalPersonnel ?? 0;

      if (totalPersonnelB !== totalPersonnelA) {
        return totalPersonnelB - totalPersonnelA;
      }

      return (a.clientName || "").localeCompare(b.clientName || "");
    });
  }, [clients]);

  const standoutPersonnel = useMemo(() => {
    return topPersonnel.slice(0, 5);
  }, [topPersonnel]);

  const topCommentPersonnel = useMemo(() => {
    return [...topPersonnel]
      .filter((person) => (person.username || person.nama) && (person.comments ?? 0) > 0)
      .sort((a, b) => {
        if ((b.comments ?? 0) !== (a.comments ?? 0)) {
          return (b.comments ?? 0) - (a.comments ?? 0);
        }
        if ((b.likes ?? 0) !== (a.likes ?? 0)) {
          return (b.likes ?? 0) - (a.likes ?? 0);
        }
        return (b.active ? 1 : 0) - (a.active ? 1 : 0);
      })
      .slice(0, 5);
  }, [topPersonnel]);

  const totalTopCommentPersonnel = topCommentPersonnel.length;
  const totalTopLikesPersonnel = standoutPersonnel.length;

  const activitySummary = personnelActivity ?? null;
  const activityCategories = activitySummary?.categories ?? [];
  const totalEvaluated = activitySummary?.totalEvaluated ?? 0;
  const totalContentEvaluated = activitySummary?.totalContentEvaluated ?? 0;

  const lastUpdatedLabel = formatDateTime(data?.lastUpdated);
  const hasPersonnelDistribution = Array.isArray(personnelDistribution) && personnelDistribution.length > 0;
  const distributionMetaNote = personnelDistributionMeta?.note ?? null;

  const hasVisibleStandoutPersonnel =
    !sectionVisibility.topLikesPersonnel && standoutPersonnel.length > 0;
  const hasVisibleClients = clients.length > 0;

  if (!hasVisibleClients && !hasVisibleStandoutPersonnel) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Belum ada data rekap likes yang dapat ditampilkan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {computedSummaryCards.map((card) => {
          const comparison = card.comparison ?? null;
          const direction = comparison?.direction ?? "flat";
          const toneClass =
            direction === "up"
              ? "text-emerald-300"
              : direction === "down"
              ? "text-rose-300"
              : "text-slate-400";
          const icon =
            direction === "up" ? "▲" : direction === "down" ? "▼" : "▬";

          return (
            <div
              key={card.key}
              className="h-full rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-950 to-slate-900/80 p-5 shadow-[0_20px_45px_rgba(56,189,248,0.15)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                {card.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-white">{card.value}</p>
              {card.description ? (
                <p className="mt-2 text-xs text-slate-400">{card.description}</p>
              ) : null}
              {comparison ? (
                <p className={`mt-3 text-xs font-semibold ${toneClass}`}>
                  <span className="mr-1 inline-block text-sm">{icon}</span>
                  {comparison.label}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {lastUpdatedLabel ? (
        <p className="text-xs text-slate-400">
          Pemutakhiran terakhir: <span className="text-slate-200">{lastUpdatedLabel}</span>
        </p>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex h-full flex-col rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
            {resolvedLabels.likesContributorsTitle}
          </h3>
          <p className="mt-2 text-xs text-slate-400">{resolvedLabels.likesContributorsDescription}</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={distributionData}
                margin={{ bottom: 40, left: 12, right: 12 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  tick={{ fill: "#cbd5f5", fontSize: 12 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={70}
                  tickMargin={16}
                />
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
                <Bar dataKey="likes" fill="#22d3ee" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex h-full flex-col rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
            {resolvedLabels.commentContributorsTitle}
          </h3>
          <p className="mt-2 text-xs text-slate-400">{resolvedLabels.commentContributorsDescription}</p>
          <div className="mt-4 h-64">
            {commentDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={commentDistributionData}
                  margin={{ bottom: 40, left: 12, right: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    tick={{ fill: "#cbd5f5", fontSize: 12 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={70}
                    tickMargin={16}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: "rgba(15,23,42,0.3)" }}
                    contentStyle={{
                      backgroundColor: "rgba(15,23,42,0.95)",
                      borderRadius: 16,
                      borderColor: "rgba(148,163,184,0.4)",
                      boxShadow: "0 20px 45px rgba(245,158,11,0.25)",
                      color: "#e2e8f0",
                    }}
                    formatter={(value: number) => [
                      formatNumber(value, { maximumFractionDigits: 0 }),
                      "Komentar",
                    ]}
                    labelFormatter={(label: string | number, payload: any[]) => {
                      const entry = payload && payload.length > 0 ? payload[0].payload : null;
                      if (entry && typeof entry.compliance === "number") {
                        return `${label} · Kepatuhan ${formatPercent(entry.compliance)}`;
                      }
                      return label as string;
                    }}
                  />
                  <Bar dataKey="comments" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Belum ada data komentar teratas.
              </div>
            )}
          </div>
        </div>

        {!sectionVisibility.topCompliance ? (
          <div className="flex h-full flex-col rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
              {resolvedLabels.topComplianceTitle}
            </h3>
            <p className="mt-2 text-xs text-slate-400">{resolvedLabels.topComplianceDescription}</p>
            <ul className="mt-4 flex-1 space-y-3 text-sm text-slate-200">
              {topCompliance.map((client) => (
                <li key={`compliance-${client.key}`} className="flex items-start justify-between">
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
        ) : null}

        {!sectionVisibility.topCommentPersonnel && topCommentPersonnel.length > 0 ? (
          <div className="flex h-full flex-col rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
              {resolvedLabels.commentPersonnelTitle}
            </h3>
            <p className="mt-2 text-xs text-slate-400">{resolvedLabels.commentPersonnelDescription}</p>
            <ul className="mt-4 flex-1 space-y-3 text-sm text-slate-200">
              {topCommentPersonnel.map((person) => {
                const displayName = [person.pangkat, person.nama].filter(Boolean).join(" ");
                const identity = person.username || displayName || "Tanpa Nama";
                const secondary = [
                  displayName && displayName !== identity ? displayName : null,
                  person.clientName,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={`commenter-${person.key}`} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-100">{identity}</p>
                      {secondary ? (
                        <p className="text-xs text-slate-400">{secondary}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-200">
                        {formatNumber(person.comments ?? 0, { maximumFractionDigits: 0 })} komentar
                      </p>
                      {person.likes > 0 ? (
                        <p className="text-xs text-slate-400">
                          {formatNumber(person.likes, { maximumFractionDigits: 0 })} like
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              Menampilkan {formatNumber(totalTopCommentPersonnel, { maximumFractionDigits: 0 })} personil dengan komentar tertinggi.
            </p>
          </div>
        ) : null}

        {!sectionVisibility.topLikesPersonnel && standoutPersonnel.length > 0 ? (
          <div className="flex h-full flex-col rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
              {resolvedLabels.likesPersonnelTitle}
            </h3>
            <p className="mt-2 text-xs text-slate-400">{resolvedLabels.likesPersonnelDescription}</p>
            <ul className="mt-4 flex-1 space-y-3 text-sm text-slate-200">
              {standoutPersonnel.map((person) => {
                const displayName = [person.pangkat, person.nama].filter(Boolean).join(" ");
                const identity = person.username || displayName || "Tanpa Nama";
                const secondary = [
                  displayName && displayName !== identity ? displayName : null,
                  person.clientName,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={`personnel-${person.key}`} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-100">{identity}</p>
                      {secondary ? (
                        <p className="text-xs text-slate-400">{secondary}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-cyan-200">
                        {formatNumber(person.likes, { maximumFractionDigits: 0 })} like
                      </p>
                      {person.comments > 0 ? (
                        <p className="text-xs text-slate-400">
                          {formatNumber(person.comments, { maximumFractionDigits: 0 })} komentar
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-slate-400">
              Menampilkan {formatNumber(totalTopLikesPersonnel, { maximumFractionDigits: 0 })} personil dengan likes tertinggi.
            </p>
          </div>
        ) : null}

        {activitySummary ? (
          <div className="flex h-full flex-col rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
              Aktivitas Personil
            </h3>
            {!activitySummary.loading && !activitySummary.error && activitySummary.hasSummary ? (
              <p className="mt-2 text-xs text-slate-400">
                {formatNumber(totalEvaluated, { maximumFractionDigits: 0 })} personil dievaluasi
                {totalContentEvaluated > 0
                  ? ` dari ${formatNumber(totalContentEvaluated, { maximumFractionDigits: 0 })} konten`
                  : " (tidak ada konten yang terbit)"}
                .
              </p>
            ) : null}
            <div className="mt-5 flex-1 space-y-5">
              {activitySummary.loading ? (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
                  Memuat aktivitas personil…
                </div>
              ) : activitySummary.error ? (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {activitySummary.error}
                </div>
              ) : activityCategories.length > 0 ? (
                activityCategories.map((category) => {
                  const percent = totalEvaluated > 0 ? (category.count / totalEvaluated) * 100 : 0;
                  return (
                    <div
                      key={category.key}
                      className="flex items-center justify-between rounded-2xl bg-slate-900/60 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-200">{category.label}</p>
                        <p className="text-xs text-slate-400">{category.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-semibold text-white">
                          {formatNumber(category.count, { maximumFractionDigits: 0 })}
                        </p>
                        {totalEvaluated > 0 ? (
                          <p className="text-xs text-cyan-300">{formatPercent(percent)}</p>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-400">
                  Aktivitas personil belum tersedia untuk periode ini.
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
          {resolvedLabels.tableTitle}
        </h3>
        {resolvedLabels.tableSubtitle ? (
          <p className="mt-2 text-xs text-slate-400">{resolvedLabels.tableSubtitle}</p>
        ) : null}
        {distributionMetaNote ? (
          <p className="mt-2 text-xs font-semibold text-cyan-200/80">{distributionMetaNote}</p>
        ) : null}
        <div className="mt-4 overflow-x-auto">
          {hasPersonnelDistribution ? (
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="py-3 pr-4">Pangkat &amp; Nama</th>
                  <th className="px-4 py-3">Satfung</th>
                  <th className="px-4 py-3 text-right">Likes</th>
                  <th className="px-4 py-3 text-right">Komentar</th>
                  <th className="px-4 py-3 text-right">Total Interaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {personnelDistribution!.map((row) => {
                  const pangkatNama = [row.pangkat, row.nama].filter(Boolean).join(" ");
                  const likesValue = Number(row.likes);
                  const safeLikes = Number.isFinite(likesValue) ? likesValue : 0;
                  const commentsValue = Number(row.comments);
                  const safeComments = Number.isFinite(commentsValue) ? commentsValue : 0;
                  const interactionsValueRaw =
                    row.interactions != null ? Number(row.interactions) : safeLikes + safeComments;
                  const interactionsValue = Number.isFinite(interactionsValueRaw)
                    ? interactionsValueRaw
                    : safeLikes + safeComments;
                  return (
                    <tr key={row.key} className="text-slate-200">
                      <td className="py-3 pr-4 font-semibold text-slate-100">
                        {pangkatNama || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{row.satfung || "-"}</td>
                      <td className="px-4 py-3 text-right">
                        {formatNumber(safeLikes, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatNumber(safeComments, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatNumber(interactionsValue, { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                  <th className="py-3 pr-4">Satker</th>
                  <th className="px-4 py-3 text-right">Likes</th>
                  <th className="px-4 py-3 text-right">Avg. Likes</th>
                  <th className="px-4 py-3 text-right">Komentar</th>
                  <th className="px-4 py-3 text-right">Avg. Komentar</th>
                  <th className="px-4 py-3 text-right">Personil Aktif</th>
                  <th className="px-4 py-3 text-right">Total Personil</th>
                  <th className="px-4 py-3 text-right">Rasio Kepatuhan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clientsByCompliance.length > 0 ? (
                  clientsByCompliance.map((client) => {
                    const compliance = formatPercent(client.complianceRate ?? 0);
                    return (
                      <tr key={client.key} className="text-slate-200">
                        <td className="py-3 pr-4 font-semibold text-slate-100">
                          {client.clientName}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(client.totalLikes, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(client.averageLikesPerUser ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(client.totalComments, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(client.averageCommentsPerUser ?? 0)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(client.activePersonnel, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(client.totalPersonnel, { maximumFractionDigits: 0 })}
                        </td>
                        <td className="px-4 py-3 text-right text-cyan-300">{compliance}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-400" colSpan={8}>
                      {resolvedLabels.tableEmptyLabel}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformLikesSummary;
