"use client";

import React from "react";
import { cn } from "@/lib/utils";

type FormatNumberFn = (value: number, options?: Intl.NumberFormatOptions) => string;

type PlatformProfile = {
  label?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
  followers?: number | null;
  posts?: number | null;
  externalUrl?: string | null;
  bio?: string | null;
};

type PlatformOverviewCardProps = {
  platform?: {
    key: string;
    label: string;
    followers: number;
    postCount?: number;
    likes: number;
    comments: number;
    engagementRate: number;
    derived?: {
      totalInteractions?: number;
      averageInteractions?: number;
    };
  } | null;
  profile?: PlatformProfile | null;
  loading?: boolean;
  error?: string;
  formatNumber: FormatNumberFn;
  formatCompactNumber: (value: number) => string;
  formatPercent: (value: number) => string;
};

const MetricPill: React.FC<{
  label: string;
  value: string;
  accent?: string;
}> = ({ label, value, accent }) => {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className={cn("mt-2 text-xl font-semibold text-slate-100", accent)}>{value}</p>
    </div>
  );
};

const PlatformOverviewCard: React.FC<PlatformOverviewCardProps> = ({
  platform,
  profile,
  loading = false,
  error = "",
  formatNumber,
  formatCompactNumber,
  formatPercent,
}) => {
  if (loading) {
    return (
      <div className="h-full rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Memuat ringkasan platform…
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

  if (!platform) {
    return (
      <div className="h-full rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Data platform belum tersedia untuk periode ini.
      </div>
    );
  }

  const followerLabel = formatCompactNumber(platform.followers ?? 0);
  const postsLabel = formatNumber(platform.postCount ?? 0, { maximumFractionDigits: 0 });
  const likesLabel = formatCompactNumber(platform.likes ?? 0);
  const commentsLabel = formatCompactNumber(platform.comments ?? 0);
  const engagementLabel = formatPercent(platform.engagementRate ?? 0);
  const totalInteractions = platform.derived?.totalInteractions ?? 0;
  const averageInteractions = platform.derived?.averageInteractions ?? 0;

  const metrics = [
    { key: "followers", label: "Followers", value: followerLabel, accent: "text-cyan-300" },
    { key: "posts", label: "Total Posts", value: postsLabel, accent: "text-emerald-300" },
    { key: "likes", label: "Likes", value: likesLabel, accent: "text-sky-300" },
    { key: "comments", label: "Komentar", value: commentsLabel, accent: "text-fuchsia-300" },
    { key: "engagement", label: "Engagement", value: engagementLabel, accent: "text-amber-300" },
  ];

  return (
    <div className="relative h-full overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6">
      <div className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="relative space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-200/80">Platform</p>
            <h3 className="mt-2 text-2xl font-semibold text-slate-50">{platform.label}</h3>
            {profile?.username ? (
              <p className="text-sm text-slate-400">@{profile.username}</p>
            ) : null}
          </div>
          {profile?.avatarUrl ? (
            <div className="shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={profile.avatarUrl}
                alt={profile.label || platform.label}
                className="h-16 w-16 rounded-2xl border border-slate-800/80 object-cover"
              />
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {metrics.map((metric) => (
            <MetricPill key={metric.key} label={metric.label} value={metric.value} accent={metric.accent} />
          ))}
        </div>

        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
          <p>
            Total interaksi tercatat {formatNumber(totalInteractions, { maximumFractionDigits: 0 })} dengan rata-rata
            {" "}
            {formatNumber(averageInteractions, { maximumFractionDigits: 0 })} per konten.
          </p>
          {profile?.bio ? (
            <p className="mt-2 text-xs text-slate-500 line-clamp-3">“{profile.bio}”</p>
          ) : null}
          {profile?.externalUrl ? (
            <a
              href={profile.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200"
            >
              Lihat profil resmi →
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default PlatformOverviewCard;
