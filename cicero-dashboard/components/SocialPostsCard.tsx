"use client";
import InstagramPostsGrid from "./InstagramPostsGrid";
import TiktokPostsGrid from "./TiktokPostsGrid";

interface SocialPostsCardProps {
  platform: string;
  posts: any[];
  className?: string;
}

export default function SocialPostsCard({
  platform,
  posts,
  className,
}: SocialPostsCardProps) {
  const platformLabel = platform === "instagram" ? "Instagram" : "TikTok";

  return (
    <div
      className={`relative flex h-full flex-col overflow-hidden rounded-3xl border border-sky-200/70 bg-white/80 p-6 shadow-[0_26px_55px_rgba(59,130,246,0.18)] dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_0_32px_rgba(59,130,246,0.15)]${
        className ? ` ${className}` : ""
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-sky-200/40 via-transparent to-cyan-100/40 dark:from-slate-800/40 dark:to-slate-900/40" />
      <div className="absolute -right-20 top-12 h-40 w-40 rounded-full bg-sky-300/40 blur-3xl dark:bg-cyan-500/20" />
      <div className="relative flex flex-1 flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">{platformLabel} Posts</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-sky-600 dark:text-slate-400">
            Highlights
          </span>
        </div>
        {posts && posts.length > 0 ? (
          <div className="rounded-2xl border border-sky-200/70 bg-white/75 p-4 shadow-[0_20px_45px_rgba(129,140,248,0.2)] dark:border-slate-800/60 dark:bg-slate-900/80">
            {platform === "instagram" ? (
              <InstagramPostsGrid posts={posts.slice(0, 3)} />
            ) : (
              <TiktokPostsGrid posts={posts.slice(0, 3)} />
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-sky-200/70 bg-white/70 p-6 text-center text-sm text-sky-700 shadow-[0_20px_45px_rgba(14,165,233,0.16)] dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
            Belum ada posting untuk ditampilkan.
          </div>
        )}
      </div>
    </div>
  );
}
