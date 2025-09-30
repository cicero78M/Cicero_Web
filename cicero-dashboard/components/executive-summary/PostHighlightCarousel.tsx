"use client";

import React from "react";

type FormatNumberFn = (value: number, options?: Intl.NumberFormatOptions) => string;

type PostHighlightCarouselProps = {
  posts?: {
    id: string;
    title: string;
    type?: string;
    permalink?: string | null;
    publishedAt?: Date | null;
    metrics?: {
      likes?: number;
      comments?: number;
      interactions?: number;
      reach?: number;
    };
  }[];
  loading?: boolean;
  error?: string;
  formatNumber: FormatNumberFn;
};

const formatDate = (value?: Date | null) => {
  if (!value) {
    return "Tanggal tidak tersedia";
  }

  try {
    return value.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    console.warn("Gagal memformat tanggal highlight", error);
    return value.toISOString();
  }
};

const PostHighlightCarousel: React.FC<PostHighlightCarouselProps> = ({
  posts = [],
  loading = false,
  error = "",
  formatNumber,
}) => {
  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Memuat highlight konten…
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

  if (!posts || posts.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 text-sm text-slate-400">
        Belum ada highlight konten yang tersedia.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
        Konten Sorotan
      </h3>
      <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
        {posts.map((post) => {
          const interactions = Math.max(0, post.metrics?.interactions ?? 0);
          const reach = Math.max(0, post.metrics?.reach ?? 0);
          const likes = Math.max(0, post.metrics?.likes ?? 0);
          const comments = Math.max(0, post.metrics?.comments ?? 0);

          return (
            <article
              key={post.id}
              className="min-w-[240px] max-w-xs flex-1 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 text-sm text-slate-200 shadow-[0_0_25px_rgba(15,23,42,0.35)]"
            >
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">{post.type || "Konten"}</p>
              <h4 className="mt-2 text-base font-semibold text-slate-100 line-clamp-2">{post.title}</h4>
              <p className="mt-1 text-xs text-slate-400">{formatDate(post.publishedAt)}</p>
              <dl className="mt-3 space-y-1 text-xs text-slate-300">
                <div className="flex justify-between">
                  <dt>Interaksi</dt>
                  <dd className="font-semibold text-slate-100">
                    {formatNumber(interactions, { maximumFractionDigits: 0 })}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Reach</dt>
                  <dd>{formatNumber(reach, { maximumFractionDigits: 0 })}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Likes</dt>
                  <dd>{formatNumber(likes, { maximumFractionDigits: 0 })}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Komentar</dt>
                  <dd>{formatNumber(comments, { maximumFractionDigits: 0 })}</dd>
                </div>
              </dl>
              {post.permalink ? (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  Lihat konten →
                </a>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default PostHighlightCarousel;
