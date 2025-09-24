"use client";
import InstagramPostsGrid from "./InstagramPostsGrid";
import TiktokPostsGrid from "./TiktokPostsGrid";

interface SocialPostsCardProps {
  platform: string;
  posts: any[];
}

export default function SocialPostsCard({
  platform,
  posts,
}: SocialPostsCardProps) {
  const platformLabel = platform === "instagram" ? "Instagram" : "TikTok";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-[0_0_32px_rgba(59,130,246,0.15)]">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 via-transparent to-slate-900/40" />
      <div className="absolute -right-20 top-12 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-50">{platformLabel} Posts</h2>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Highlights
          </span>
        </div>
        {posts && posts.length > 0 ? (
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/80 p-4">
            {platform === "instagram" ? (
              <InstagramPostsGrid posts={posts.slice(0, 3)} />
            ) : (
              <TiktokPostsGrid posts={posts.slice(0, 3)} />
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
            Belum ada posting untuk ditampilkan.
          </div>
        )}
      </div>
    </div>
  );
}
