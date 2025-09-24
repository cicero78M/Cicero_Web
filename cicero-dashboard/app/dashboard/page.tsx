"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardStats from "@/components/DashboardStats";
import SocialCardsClient from "@/components/SocialCardsClient";
import useAuth from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

const formatCompactNumber = (value: number) => {
  if (!value || Number.isNaN(value)) return "0";
  const formatter = new Intl.NumberFormat("id-ID", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  });
  return formatter.format(value);
};

const pickNumericValue = (source: any, paths: string[]): number => {
  if (!source) return 0;
  for (const path of paths) {
    const segments = path.split(".");
    let current: any = source;
    for (const segment of segments) {
      if (current == null) break;
      current = current[segment];
    }
    if (current == null) continue;
    if (typeof current === "number" && Number.isFinite(current)) {
      return current;
    }
    if (typeof current === "string") {
      const normalized = Number(current.replace(/[^0-9.-]+/g, ""));
      if (!Number.isNaN(normalized)) {
        return normalized;
      }
    }
  }
  return 0;
};

export default function DashboardPage() {
  const { token } = useAuth();
  const [igProfile, setIgProfile] = useState<any>(null);
  const [igPosts, setIgPosts] = useState<any[]>([]);
  const [tiktokProfile, setTiktokProfile] = useState<any>(null);
  const [tiktokPosts, setTiktokPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/aggregator?periode=harian`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch aggregator data");
        const json = await res.json();
        const data = json.data || json;
        setIgProfile(data.igProfile ?? null);
        setIgPosts(Array.isArray(data.igPosts) ? data.igPosts : []);
        setTiktokProfile(data.tiktokProfile ?? null);
        setTiktokPosts(Array.isArray(data.tiktokPosts) ? data.tiktokPosts : []);
      } catch (err) {
        console.error("Failed to fetch aggregator data", err);
      }
    }
    fetchData();
  }, [token]);

  useEffect(() => {
    const comment = document.querySelector<HTMLElement>("#comm1");
    if (comment) {
      comment.style.border = "1px solid red";
    }
  }, []);

  const analytics = useMemo(() => {
    const instagramFollowers = pickNumericValue(igProfile, [
      "followers",
      "follower_count",
      "edge_followed_by.count",
      "stats.followerCount",
    ]);
    const instagramFollowing = pickNumericValue(igProfile, [
      "following",
      "following_count",
      "edge_follow.count",
    ]);
    const instagramLikes = igPosts.reduce(
      (acc, post) =>
        acc +
        pickNumericValue(post, [
          "like_count",
          "likes",
          "edge_liked_by.count",
          "statistics.like_count",
          "metrics.like_count",
        ]),
      0
    );
    const instagramComments = igPosts.reduce(
      (acc, post) =>
        acc +
        pickNumericValue(post, [
          "comment_count",
          "comments_count",
          "edge_media_to_comment.count",
          "metrics.comment_count",
        ]),
      0
    );
    const instagramViews = igPosts.reduce(
      (acc, post) =>
        acc +
        pickNumericValue(post, [
          "view_count",
          "play_count",
          "video_view_count",
          "video_play_count",
        ]),
      0
    );

    const tiktokFollowers = pickNumericValue(tiktokProfile, [
      "followers",
      "follower_count",
      "stats.followerCount",
    ]);
    const tiktokFollowing = pickNumericValue(tiktokProfile, [
      "following",
      "following_count",
      "stats.followingCount",
    ]);
    const tiktokLikes = tiktokPosts.reduce(
      (acc, post) =>
        acc +
        pickNumericValue(post, [
          "digg_count",
          "like_count",
          "stats.diggCount",
          "statistics.like_count",
          "data.statistics.diggCount",
        ]),
      0
    );
    const tiktokComments = tiktokPosts.reduce(
      (acc, post) =>
        acc +
        pickNumericValue(post, [
          "comment_count",
          "stats.commentCount",
          "statistics.comment_count",
          "data.statistics.commentCount",
        ]),
      0
    );
    const tiktokViews = tiktokPosts.reduce(
      (acc, post) =>
        acc +
        pickNumericValue(post, [
          "play_count",
          "view_count",
          "stats.playCount",
          "statistics.play_count",
          "data.statistics.playCount",
        ]),
      0
    );

    const totals = {
      followers: instagramFollowers + tiktokFollowers,
      following: instagramFollowing + tiktokFollowing,
      likes: instagramLikes + tiktokLikes,
      comments: instagramComments + tiktokComments,
      views: instagramViews + tiktokViews,
      posts: igPosts.length + tiktokPosts.length,
    };

    const totalEngagements = totals.likes + totals.comments;
    const engagementRate = totals.followers
      ? (totalEngagements / totals.followers) * 100
      : 0;
    const averageViews = totals.posts ? totals.views / totals.posts : 0;

    const instagramEngagement = instagramFollowers
      ? ((instagramLikes + instagramComments) / instagramFollowers) * 100
      : 0;
    const tiktokEngagement = tiktokFollowers
      ? ((tiktokLikes + tiktokComments) / Math.max(tiktokFollowers, 1)) * 100
      : 0;

    const platformTotals = [
      {
        key: "instagram" as const,
        label: "Instagram",
        followers: instagramFollowers,
        following: instagramFollowing,
        likes: instagramLikes,
        comments: instagramComments,
        views: instagramViews,
        posts: igPosts.length,
        engagementRate: instagramEngagement,
      },
      {
        key: "tiktok" as const,
        label: "TikTok",
        followers: tiktokFollowers,
        following: tiktokFollowing,
        likes: tiktokLikes,
        comments: tiktokComments,
        views: tiktokViews,
        posts: tiktokPosts.length,
        engagementRate: tiktokEngagement,
      },
    ];

    const likeShare = totals.likes
      ? platformTotals.map((p) => ({
          key: p.key,
          value: (p.likes / totals.likes) * 100,
        }))
      : platformTotals.map((p) => ({ key: p.key, value: 0 }));

    const commentShare = totals.comments
      ? platformTotals.map((p) => ({
          key: p.key,
          value: (p.comments / totals.comments) * 100,
        }))
      : platformTotals.map((p) => ({ key: p.key, value: 0 }));

    const followerShare = totals.followers
      ? platformTotals.map((p) => ({
          key: p.key,
          value: (p.followers / totals.followers) * 100,
        }))
      : platformTotals.map((p) => ({ key: p.key, value: 0 }));

    const pickThumbnail = (post: any) => {
      return (
        post?.thumbnail_url ||
        post?.cover ||
        post?.image_versions2?.candidates?.[0]?.url ||
        post?.display_url ||
        post?.media_url ||
        post?.thumbnail?.url ||
        post?.thumbnail ||
        post?.images?.standard_resolution?.url ||
        ""
      );
    };

    const pickCaption = (post: any) => {
      if (!post) return "";
      if (typeof post.caption === "string") return post.caption;
      if (post.caption?.text) return post.caption.text;
      if (post.desc) return post.desc;
      if (post.description) return post.description;
      if (post.title) return post.title;
      return "Tanpa caption";
    };

    const pickUrl = (post: any) => {
      return (
        post?.permalink ||
        post?.link ||
        post?.url ||
        post?.share_url ||
        post?.video_url ||
        post?.shortlink ||
        ""
      );
    };

    const normalizedInstagramPosts = igPosts.map((post, index) => {
      const likes = pickNumericValue(post, [
        "like_count",
        "likes",
        "edge_liked_by.count",
        "statistics.like_count",
        "metrics.like_count",
      ]);
      const comments = pickNumericValue(post, [
        "comment_count",
        "comments_count",
        "edge_media_to_comment.count",
        "metrics.comment_count",
      ]);
      const views = pickNumericValue(post, [
        "view_count",
        "play_count",
        "video_view_count",
        "video_play_count",
      ]);
      return {
        id: post?.id || post?.pk || post?.code || `instagram-${index}`,
        platform: "Instagram",
        likes,
        comments,
        views,
        caption: pickCaption(post),
        thumbnail: pickThumbnail(post),
        url: pickUrl(post),
      };
    });

    const normalizedTiktokPosts = tiktokPosts.map((post, index) => {
      const likes = pickNumericValue(post, [
        "digg_count",
        "like_count",
        "stats.diggCount",
        "statistics.like_count",
        "data.statistics.diggCount",
      ]);
      const comments = pickNumericValue(post, [
        "comment_count",
        "stats.commentCount",
        "statistics.comment_count",
        "data.statistics.commentCount",
      ]);
      const views = pickNumericValue(post, [
        "play_count",
        "view_count",
        "stats.playCount",
        "statistics.play_count",
        "data.statistics.playCount",
      ]);
      return {
        id: post?.id || post?.aweme_id || post?.video_id || `tiktok-${index}`,
        platform: "TikTok",
        likes,
        comments,
        views,
        caption: pickCaption(post),
        thumbnail: pickThumbnail(post),
        url: pickUrl(post),
      };
    });

    const topPosts = [...normalizedInstagramPosts, ...normalizedTiktokPosts]
      .filter((post) => post.likes || post.comments || post.views)
      .sort(
        (a, b) =>
          b.likes + b.comments + b.views / 10 - (a.likes + a.comments + a.views / 10)
      )
      .slice(0, 6);

    return {
      totals: {
        ...totals,
        engagementRate,
        averageViews,
      },
      platforms: platformTotals.map((platform) => ({
        ...platform,
        shares: {
          followers:
            followerShare.find((item) => item.key === platform.key)?.value || 0,
          likes: likeShare.find((item) => item.key === platform.key)?.value || 0,
          comments:
            commentShare.find((item) => item.key === platform.key)?.value || 0,
        },
      })),
      topPosts,
    };
  }, [igProfile, igPosts, tiktokProfile, tiktokPosts]);

  const highlightCards = useMemo(() => {
    const igStats = analytics.platforms.find((platform) => platform.key === "instagram");
    const tiktokStats = analytics.platforms.find((platform) => platform.key === "tiktok");
    return [
      {
        key: "audience",
        title: "Total Audience",
        value: analytics.totals.followers,
        subtitle: `Instagram ${Math.round(igStats?.shares.followers ?? 0)}% · TikTok ${Math.round(
          tiktokStats?.shares.followers ?? 0
        )}%`,
        icon: "🛰️",
      },
      {
        key: "likes",
        title: "Total Likes",
        value: analytics.totals.likes,
        subtitle: `IG ${Math.round(igStats?.shares.likes ?? 0)}% · TikTok ${Math.round(
          tiktokStats?.shares.likes ?? 0
        )}%`,
        icon: "💡",
      },
      {
        key: "comments",
        title: "Total Komentar",
        value: analytics.totals.comments,
        subtitle: `IG ${Math.round(igStats?.shares.comments ?? 0)}% · TikTok ${Math.round(
          tiktokStats?.shares.comments ?? 0
        )}%`,
        icon: "💬",
      },
      {
        key: "engagement",
        title: "Engagement Rate",
        value: `${analytics.totals.engagementRate.toFixed(2)}%`,
        subtitle: "(Likes + Komentar) ÷ Followers",
        icon: "⚡",
      },
    ];
  }, [analytics]);

  const snapshotMetrics = useMemo(
    () => [
      {
        key: "views",
        label: "Total Views",
        value: formatCompactNumber(analytics.totals.views),
        accent: "text-cyan-300",
        helper: "Akumulasi views lintas platform",
      },
      {
        key: "posts",
        label: "Total Konten",
        value: analytics.totals.posts,
        accent: "text-emerald-300",
        helper: "Konten dianalisis hari ini",
      },
      {
        key: "followers",
        label: "Followers Aktif",
        value: formatCompactNumber(analytics.totals.followers),
        accent: "text-fuchsia-300",
        helper: "Audiens siap terlibat",
      },
      {
        key: "engagement",
        label: "Engagement Rate",
        value: `${analytics.totals.engagementRate.toFixed(2)}%`,
        accent: "text-amber-300",
        helper: "Rasio interaksi terkini",
      },
    ],
    [analytics]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-32 h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[28rem] w-[28rem] rounded-full bg-purple-500/20 blur-[200px]" />
        <div className="absolute right-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12">
        <section className="space-y-8">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-4 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0.6rem_rgba(52,211,153,0.7)]" />
              Command Center
            </span>
            <h1 className="text-3xl font-semibold leading-tight text-slate-50 md:text-4xl">
              Ikhtisar Data Keterlibatan Audiens Instagram & TikTok secara Real-time
            </h1>
            <p className="max-w-2xl text-base text-slate-300 md:text-lg">
              Pantau detik demi detik perkembangan audiens, reaksi komunitas, dan percakapan yang terjadi di Instagram serta TikTok melalui satu kanvas visual yang imersif.
            </p>
            <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
                <span className="text-emerald-300">◎</span>
                <span>Data terintegrasi lintas platform</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-3 py-1.5">
                <span className="text-cyan-300">◎</span>
                <span>Visual responsif & mudah dipahami</span>
              </div>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <div className="relative overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-br from-slate-900/60 via-slate-900/40 to-slate-900/10 p-6 shadow-[0_0_2rem_rgba(56,189,248,0.25)]">
              <div className="absolute inset-x-10 top-4 h-24 rounded-full bg-gradient-to-b from-cyan-400/30 via-transparent to-transparent blur-2xl" />
              <div className="relative flex h-full flex-col gap-6">
                <h2 className="text-lg font-semibold text-slate-100">Snapshot Hari Ini</h2>
                <p className="text-sm text-slate-300">
                  {analytics.totals.posts > 0
                    ? `Analisis ${analytics.totals.posts} konten terbaru dengan rata-rata ${formatCompactNumber(
                        analytics.totals.averageViews
                      )} views per konten.`
                    : "Menunggu konten terbaru untuk dianalisis."}
                </p>
                <div className="grid gap-4 text-sm text-slate-200 sm:grid-cols-2 xl:grid-cols-2">
                  {snapshotMetrics.map((metric) => (
                    <div
                      key={metric.key}
                      className="group flex flex-col gap-2 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4 shadow-[0_0_1.5rem_rgba(56,189,248,0.12)] transition duration-200 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_0_2.5rem_rgba(56,189,248,0.25)]"
                    >
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                        {metric.label}
                      </span>
                      <p className={cn("text-2xl font-semibold", metric.accent)}>{metric.value}</p>
                      <span className="text-xs text-slate-400">{metric.helper}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-6">
              <DashboardStats
                highlights={highlightCards}
                igProfile={igProfile}
                igPosts={igPosts}
                tiktokProfile={tiktokProfile}
                tiktokPosts={tiktokPosts}
                className="grid-cols-1 sm:grid-cols-2"
                cardClassName="border-slate-800/70 bg-slate-900/70"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-50">Rincian Kinerja Platform</h2>
            <p className="text-sm text-slate-300">
              Bandingkan performa inti tiap kanal untuk melihat kontribusi terhadap interaksi keseluruhan.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-2">
            {analytics.platforms.map((platform) => {
              const primaryMetrics = [
                {
                  key: "likes",
                  label: "Likes",
                  value: formatCompactNumber(platform.likes),
                  accent: "text-cyan-300",
                },
                {
                  key: "comments",
                  label: "Komentar",
                  value: formatCompactNumber(platform.comments),
                  accent: "text-emerald-300",
                },
                {
                  key: "engagement",
                  label: "Engagement",
                  value: `${platform.engagementRate.toFixed(2)}%`,
                  accent: "text-fuchsia-300",
                },
              ];

              const shareMetrics = [
                {
                  key: "followers",
                  label: "Share Followers",
                  value: platform.shares.followers,
                  gradient: "from-violet-500 via-fuchsia-400 to-cyan-300",
                },
                {
                  key: "likes",
                  label: "Share Likes",
                  value: platform.shares.likes,
                  gradient: "from-sky-500 via-cyan-400 to-emerald-300",
                },
                {
                  key: "comments",
                  label: "Share Komentar",
                  value: platform.shares.comments,
                  gradient: "from-amber-400 via-orange-400 to-rose-400",
                },
              ];

              return (
                <div
                  key={platform.key}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/50 p-6 shadow-[0_0_30px_rgba(79,70,229,0.25)] transition duration-200 hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-[0_0_45px_rgba(34,211,238,0.22)]"
                >
                  <div className="absolute -top-12 right-4 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-400/40 via-transparent to-transparent blur-2xl transition group-hover:from-cyan-400/60" />
                  <div className="relative flex h-full flex-col gap-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.25em] text-slate-400">Platform</p>
                        <h3 className="text-xl font-semibold text-slate-50">{platform.label}</h3>
                      </div>
                      <div className="flex flex-col items-end rounded-2xl border border-slate-800/60 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
                        <span className="font-medium text-slate-200">Followers</span>
                        <span>{formatCompactNumber(platform.followers)}</span>
                        <span className="mt-1 text-slate-400">Posts: {platform.posts}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm text-slate-200 sm:grid-cols-3">
                      {primaryMetrics.map((metric) => (
                        <div
                          key={metric.key}
                          className="flex flex-col gap-2 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4"
                        >
                          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            {metric.label}
                          </span>
                          <span className={cn("text-lg font-semibold", metric.accent)}>{metric.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto space-y-3 text-xs text-slate-300">
                      {shareMetrics.map((share) => (
                        <div
                          key={share.key}
                          className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-3"
                        >
                          <div className="mb-2 flex justify-between text-[0.7rem] font-medium uppercase tracking-wider text-slate-400">
                            <span>{share.label}</span>
                            <span>{share.value.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800">
                            <div
                              className={cn(
                                "h-full rounded-full bg-gradient-to-r",
                                share.gradient
                              )}
                              style={{ width: `${Math.min(share.value, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-50">Detak Interaksi & Percakapan</h2>
            <p className="text-sm text-slate-300">
              Pilih platform untuk menggali profil audiens, posting unggulan, dan percakapan yang
              sedang berlangsung.
            </p>
          </div>
          <SocialCardsClient
            igProfile={igProfile}
            igPosts={igPosts}
            tiktokProfile={tiktokProfile}
            tiktokPosts={tiktokPosts}
            platformMetrics={analytics.platforms.reduce(
              (acc, platform) => {
                acc[platform.key] = platform;
                return acc;
              },
              {} as Record<string, (typeof analytics.platforms)[number]>
            )}
          />
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-slate-50">Konten Paling Resonansi</h2>
            <p className="text-sm text-slate-300">
              Sorotan posting dengan likes, komentar, dan views tertinggi untuk memetakan pola konten
              yang paling disukai audiens.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analytics.topPosts.length === 0 && (
              <div className="col-span-full rounded-3xl border border-slate-800/70 bg-slate-900/50 p-8 text-center text-sm text-slate-300">
                Data konten belum tersedia. Unggah konten baru untuk melihat analitik terbaru.
              </div>
            )}
            {analytics.topPosts.map((post) => (
              <a
                key={`${post.platform}-${post.id}`}
                href={post.url || undefined}
                target={post.url ? "_blank" : undefined}
                rel={post.url ? "noopener noreferrer" : undefined}
                className="group relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/50 p-4 transition hover:border-cyan-400/60 hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
              >
                <div className="absolute -top-16 right-0 h-32 w-32 rounded-full bg-cyan-500/20 blur-3xl transition group-hover:bg-cyan-400/30" />
                <div className="relative space-y-4">
                  {post.thumbnail ? (
                    <img
                      src={post.thumbnail}
                      alt={`Thumbnail ${post.platform}`}
                      className="h-40 w-full rounded-2xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/60 text-slate-500">
                      Tidak ada thumbnail
                    </div>
                  )}
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                      {post.platform}
                    </span>
                    <p
                      className="text-sm text-slate-200"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {post.caption}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-300">
                    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-3 py-2">
                      <p className="text-[0.65rem] uppercase tracking-wide text-slate-400">Likes</p>
                      <p className="text-base font-semibold text-cyan-300">
                        {formatCompactNumber(post.likes)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-3 py-2">
                      <p className="text-[0.65rem] uppercase tracking-wide text-slate-400">Komentar</p>
                      <p className="text-base font-semibold text-emerald-300">
                        {formatCompactNumber(post.comments)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/70 px-3 py-2">
                      <p className="text-[0.65rem] uppercase tracking-wide text-slate-400">Views</p>
                      <p className="text-base font-semibold text-fuchsia-300">
                        {formatCompactNumber(post.views)}
                      </p>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
