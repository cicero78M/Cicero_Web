import { useMemo } from "react";

import { cn } from "@/lib/utils";

const formatValue = (value) => {
  if (typeof value === "number") {
    const formatter = new Intl.NumberFormat("id-ID", {
      notation: value >= 1000 ? "compact" : "standard",
      maximumFractionDigits: value >= 1000 ? 1 : 0,
    });
    return formatter.format(value);
  }
  return value ?? "-";
};

const extractCount = (source, keys) => {
  if (!source) return 0;
  for (const key of keys) {
    const segments = key.split(".");
    let current = source;
    for (const segment of segments) {
      if (current == null) break;
      current = current[segment];
    }
    if (current == null) continue;
    if (typeof current === "number" && Number.isFinite(current)) {
      return current;
    }
    if (typeof current === "string") {
      const parsed = Number(current.replace(/[^0-9.-]+/g, ""));
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
};

export default function DashboardStats({
  highlights,
  igProfile,
  igPosts,
  tiktokProfile,
  tiktokPosts,
  className,
  cardClassName,
}) {
  const fallbackHighlights = useMemo(() => {
    if (!igProfile && !tiktokProfile && !igPosts?.length && !tiktokPosts?.length) {
      return [];
    }
    const igFollowers = extractCount(igProfile, [
      "followers",
      "follower_count",
      "edge_followed_by.count",
    ]);
    const igPostsCount = igProfile?.post_count ?? igPosts?.length ?? 0;
    const tiktokFollowers = extractCount(tiktokProfile, [
      "followers",
      "follower_count",
      "stats.followerCount",
    ]);
    const tiktokPostsCount = tiktokProfile?.video_count ?? tiktokPosts?.length ?? 0;

    return [
      { key: "ig-followers", title: "IG Followers", value: igFollowers },
      { key: "ig-posts", title: "IG Posts", value: igPostsCount },
      { key: "tiktok-followers", title: "TikTok Followers", value: tiktokFollowers },
      { key: "tiktok-posts", title: "TikTok Posts", value: tiktokPostsCount },
    ];
  }, [igProfile, igPosts, tiktokProfile, tiktokPosts]);

  const cards = highlights?.length ? highlights : fallbackHighlights;

  if (!cards.length) return null;

  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2", className)}>
      {cards.map((item) => (
        <div
          key={item.key || item.title}
          className={cn(
            "group relative overflow-hidden rounded-3xl border border-sky-200/70 bg-white/80 p-5 shadow-[0_26px_55px_rgba(56,189,248,0.2)] transition duration-300 hover:-translate-y-1 hover:border-sky-300/70 hover:shadow-[0_30px_65px_rgba(56,189,248,0.28)] dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_0_32px_rgba(14,165,233,0.15)] dark:hover:border-cyan-400/60 dark:hover:shadow-[0_0_40px_rgba(34,211,238,0.35)]",
            cardClassName,
          )}
        >
          <div className="absolute -right-10 top-0 h-32 w-32 rounded-full bg-sky-300/40 blur-3xl transition duration-300 group-hover:bg-sky-300/60 dark:bg-cyan-500/10 dark:group-hover:bg-cyan-400/20" />
          <div className="absolute inset-x-6 top-8 h-16 rounded-full bg-gradient-to-b from-sky-200/40 to-transparent blur-2xl dark:from-slate-100/10" />
          <div className="relative space-y-3">
            <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
              <span className="text-xl">{item.icon ?? "◎"}</span>
              <span className="text-xs uppercase tracking-[0.3em] text-sky-600 dark:text-slate-400">
                {item.title}
              </span>
            </div>
            <p className="text-3xl font-semibold text-slate-900 dark:text-slate-50">
              {formatValue(item.value)}
            </p>
            {item.subtitle && (
              <p className="text-xs text-slate-600 dark:text-slate-300">{item.subtitle}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
