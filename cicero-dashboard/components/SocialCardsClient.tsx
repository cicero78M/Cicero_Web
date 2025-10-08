"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import SocialProfileCard from "./SocialProfileCard";
import SocialPostsCard from "./SocialPostsCard";

type PlatformKey = "instagram" | "tiktok";

type PlatformMetric = {
  key: PlatformKey;
  label?: string;
  followers: number;
  following?: number;
  likes: number;
  comments: number;
  views: number;
  posts: number;
  engagementRate: number;
  shares?: {
    followers: number;
    likes: number;
    comments: number;
  };
};

interface Props {
  igProfile: any;
  igPosts: any[];
  tiktokProfile: any;
  tiktokPosts: any[];
  platformMetrics?: Record<string, PlatformMetric>;
  clientUsernames?: Partial<Record<PlatformKey, string>>;
}

const formatNumber = (value?: number) => {
  if (!value || Number.isNaN(value)) return "0";
  const formatter = new Intl.NumberFormat("id-ID", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  });
  return formatter.format(value);
};

export default function SocialCardsClient({
  igProfile,
  igPosts,
  tiktokProfile,
  tiktokPosts,
  platformMetrics,
  clientUsernames,
}: Props) {
  const [platform, setPlatform] = useState<"all" | PlatformKey>("all");
  const instagramProfileRef = useRef<HTMLDivElement>(null);
  const tiktokProfileRef = useRef<HTMLDivElement>(null);
  const [profileCardHeight, setProfileCardHeight] = useState<number | null>(null);

  const metrics = useMemo(() => {
    const selectedPlatforms: PlatformKey[] =
      platform === "all" ? ["instagram", "tiktok"] : [platform as PlatformKey];

    return selectedPlatforms.map((key) => ({
      key,
      metric: platformMetrics?.[key],
    }));
  }, [platform, platformMetrics]);

  const metricsWrapperClasses = ["grid grid-cols-1 gap-4", "auto-rows-fr"];

  if (metrics.length === 1) {
    metricsWrapperClasses.push("mx-auto", "max-w-md", "sm:max-w-xl");
  } else if (metrics.length === 2) {
    metricsWrapperClasses.push("sm:grid-cols-2", "xl:grid-cols-2");
  } else {
    metricsWrapperClasses.push("sm:grid-cols-2", "xl:grid-cols-3");
  }

  useEffect(() => {
    if (platform !== "all") {
      setProfileCardHeight(null);
      return;
    }

    const measureHeights = () => {
      const heights = [instagramProfileRef.current?.offsetHeight ?? 0, tiktokProfileRef.current?.offsetHeight ?? 0];
      const maxHeight = Math.max(...heights);
      setProfileCardHeight((prev) => {
        if (maxHeight <= 0) {
          return null;
        }
        return prev === maxHeight ? prev : maxHeight;
      });
    };

    const frame = requestAnimationFrame(measureHeights);
    window.addEventListener("resize", measureHeights);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measureHeights);
    };
  }, [platform, igProfile, tiktokProfile, igPosts, tiktokPosts]);

  const renderPlatform = (key: PlatformKey) => {
    const ref = key === "instagram" ? instagramProfileRef : tiktokProfileRef;

    return (
      <div key={key} className="grid grid-cols-1 gap-6">
        <div
          ref={ref}
          style={{ minHeight: profileCardHeight ? `${profileCardHeight}px` : undefined }}
        >
          <SocialProfileCard
            className="h-full"
            platform={key}
            profile={key === "instagram" ? igProfile : tiktokProfile}
            postCount={key === "instagram" ? igPosts.length : tiktokPosts.length}
            username={clientUsernames?.[key]}
          />
        </div>
        <SocialPostsCard
          className="h-full"
          platform={key}
          posts={key === "instagram" ? igPosts : tiktokPosts}
        />
      </div>
    );
  };

  const buttons = [
    { key: "all" as const, label: "Semua" },
    { key: "instagram" as const, label: "Instagram" },
    { key: "tiktok" as const, label: "TikTok" },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-white/80 p-6 shadow-[0_28px_60px_rgba(59,130,246,0.18)] dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_0_36px_rgba(14,165,233,0.15)]">
      <div className="absolute -left-16 top-20 h-48 w-48 rounded-full bg-sky-300/40 blur-3xl dark:bg-violet-500/20" />
      <div className="absolute -right-12 bottom-0 h-44 w-44 rounded-full bg-cyan-200/40 blur-3xl dark:bg-cyan-500/20" />
      <div className="relative space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Radar Interaksi</h3>
            <p className="text-sm text-sky-700 dark:text-slate-300">
              Bandingkan performa audiens, likes, dan komentar antar platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {buttons.map((b) => (
              <button
                key={b.key}
                className={`relative overflow-hidden rounded-full border px-4 py-1.5 text-sm transition ${
                  platform === b.key
                    ? "border-sky-300/70 bg-sky-200/60 text-sky-900 shadow-[0_18px_40px_rgba(56,189,248,0.25)] dark:border-cyan-400/60 dark:bg-cyan-500/20 dark:text-cyan-200"
                    : "border-sky-200/70 bg-white/70 text-sky-700 hover:text-sky-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
                onClick={() => setPlatform(b.key)}
              >
                <span className="relative z-10">{b.label}</span>
                {platform === b.key && (
                  <span className="absolute inset-0 rounded-full bg-gradient-to-r from-sky-300/40 to-transparent dark:from-cyan-500/20" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={metricsWrapperClasses.join(" ")}>
          {metrics.map(({ key, metric }) => (
            <div
              key={key}
              className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-sky-200/70 bg-white/75 p-5 shadow-[0_18px_38px_rgba(79,70,229,0.18)] dark:border-slate-800/70 dark:bg-slate-900/70"
            >
              <div className="absolute -top-12 right-0 h-28 w-28 rounded-full bg-sky-300/40 blur-3xl dark:bg-cyan-500/10" />
              <div className="relative flex flex-1 flex-col gap-4">
                <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span className="text-xs uppercase tracking-[0.3em] text-sky-600 dark:text-slate-400">
                    {key}
                  </span>
                  <span className="text-xs text-sky-600 dark:text-slate-400">
                    {metric?.posts ?? 0} posts
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm text-slate-700 dark:text-slate-200">
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wide text-sky-600 dark:text-slate-400">Likes</p>
                    <p className="text-lg font-semibold text-sky-600 dark:text-cyan-300">
                      {formatNumber(metric?.likes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wide text-sky-600 dark:text-slate-400">Komentar</p>
                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-300">
                      {formatNumber(metric?.comments)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[0.65rem] uppercase tracking-wide text-sky-600 dark:text-slate-400">Followers</p>
                    <p className="text-lg font-semibold text-fuchsia-600 dark:text-fuchsia-300">
                      {formatNumber(metric?.followers)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                  <span>Engagement</span>
                  <span>{metric ? metric.engagementRate.toFixed(2) : "0.00"}%</span>
                </div>
                {metric?.shares && (
                  <div className="flex flex-wrap gap-2 text-[0.65rem] text-sky-600 dark:text-slate-400">
                    <span className="rounded-full bg-sky-100 px-2 py-1 dark:bg-slate-800/60">
                      Followers {metric.shares.followers.toFixed(1)}%
                    </span>
                    <span className="rounded-full bg-sky-100 px-2 py-1 dark:bg-slate-800/60">
                      Likes {metric.shares.likes.toFixed(1)}%
                    </span>
                    <span className="rounded-full bg-sky-100 px-2 py-1 dark:bg-slate-800/60">
                      Komentar {metric.shares.comments.toFixed(1)}%
                    </span>
                  </div>
                )}
                <div className="mt-auto h-1.5 overflow-hidden rounded-full bg-sky-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-300"
                    style={{
                      width: `${Math.min(metric ? metric.engagementRate : 0, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className={`grid gap-6 ${
            platform === "all" ? "lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {metrics.map(({ key }) => renderPlatform(key))}
        </div>
      </div>
    </div>
  );
}
