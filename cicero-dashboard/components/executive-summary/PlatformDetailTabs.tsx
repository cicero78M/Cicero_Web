"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type FormatNumberFn = (value: number, options?: Intl.NumberFormatOptions) => string;

type PlatformDetailTabsProps = {
  platform?: {
    key: string;
    label: string;
    postCount?: number;
    followers: number;
    engagementRate: number;
    derived?: {
      totalInteractions?: number;
      averageInteractions?: number;
      averageEngagementRate?: number;
      contentTypeDistribution?: { key: string; label: string; share: number; count: number }[];
    };
    insight?: string;
  } | null;
  profile?: {
    username?: string | null;
    followers?: number | null;
    following?: number | null;
    posts?: number | null;
    bio?: string | null;
  } | null;
  loading?: boolean;
  error?: string;
  formatNumber: FormatNumberFn;
  formatPercent: (value: number) => string;
};

const tabs = [
  { key: "insight", label: "Insight" },
  { key: "distribution", label: "Distribusi" },
  { key: "profile", label: "Profil" },
];

const PlatformDetailTabs: React.FC<PlatformDetailTabsProps> = ({
  platform,
  profile,
  loading = false,
  error = "",
  formatNumber,
  formatPercent,
}) => {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.key ?? "insight");

  const distribution = useMemo(() => {
    return platform?.derived?.contentTypeDistribution ?? [];
  }, [platform]);

  if (loading) {
    return (
      <div className="h-full rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Menyusun detail platform…
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
        Detail platform belum tersedia.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
          Rangkuman Mendalam
        </h3>
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                activeTab === tab.key
                  ? "bg-cyan-500/20 text-cyan-200"
                  : "bg-slate-900/60 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-200">
        {activeTab === "insight" ? (
          <p className="leading-relaxed text-slate-200">
            {platform.insight || "Belum ada insight naratif yang dapat ditampilkan."}
          </p>
        ) : null}

        {activeTab === "distribution" ? (
          distribution.length > 0 ? (
            <ul className="space-y-2 text-sm text-slate-200">
              {distribution.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between rounded-2xl border border-slate-800/60 bg-slate-900/60 px-3 py-2"
                >
                  <span className="font-medium text-slate-100">{item.label}</span>
                  <span className="text-xs text-cyan-300">
                    {item.count} konten · {formatPercent(item.share)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Belum ada distribusi konten yang tercatat.</p>
          )
        ) : null}

        {activeTab === "profile" ? (
          <div className="space-y-3 text-sm text-slate-200">
            <p>
              Followers: {formatNumber(profile?.followers ?? platform.followers ?? 0, { maximumFractionDigits: 0 })}
            </p>
            <p>
              Mengikuti: {formatNumber(profile?.following ?? 0, { maximumFractionDigits: 0 })}
            </p>
            <p>
              Total konten tercatat: {formatNumber(profile?.posts ?? platform.postCount ?? 0, { maximumFractionDigits: 0 })}
            </p>
            <p>
              Engagement rate rata-rata: {formatPercent(platform.derived?.averageEngagementRate ?? platform.engagementRate ?? 0)}
            </p>
            {profile?.bio ? (
              <p className="text-xs text-slate-400">“{profile.bio}”</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default PlatformDetailTabs;
