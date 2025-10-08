"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardStats from "@/components/DashboardStats";
import SocialCardsClient from "@/components/SocialCardsClient";
import useAuth from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

type PlatformKey = "instagram" | "tiktok";
type PostType = "video" | "carousel" | "image";

const formatCompactNumber = (value: number) => {
  if (!value || Number.isNaN(value)) return "0";
  const formatter = new Intl.NumberFormat("id-ID", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  });
  return formatter.format(value);
};

const isVideoLikeUrl = (url: unknown) =>
  typeof url === "string" && /\.(mp4|mov|m4v|webm|avi)(?:\?.*)?$/i.test(url);

const detectPostType = (post: any, platform: PlatformKey): PostType => {
  if (platform === "tiktok") return "video";

  const typeCandidates = [
    post?.media_type,
    post?.mediaType,
    post?.product_type,
    post?.productType,
    post?.type,
    post?.__typename,
    post?.media?.type,
    post?.media?.media_type,
  ]
    .map((value: unknown) => (typeof value === "string" ? value.toLowerCase() : ""))
    .filter(Boolean);

  const hasVideoIndicator =
    typeCandidates.some((type) =>
      ["video", "reel", "igtv", "clip"].some((keyword) => type.includes(keyword))
    ) ||
    post?.is_video === true ||
    post?.isVideo === true ||
    Boolean(post?.video_url || post?.videoUrl) ||
    (Array.isArray(post?.video_versions) && post.video_versions.length > 0) ||
    isVideoLikeUrl(post?.media_url) ||
    isVideoLikeUrl(post?.display_url);

  if (hasVideoIndicator) return "video";

  const hasCarouselIndicator =
    typeCandidates.some((type) =>
      ["carousel", "album", "sidecar"].some((keyword) => type.includes(keyword))
    ) ||
    Array.isArray(post?.is_carousel) ||
    Array.isArray(post?.children) ||
    Array.isArray(post?.slides) ||
    Array.isArray(post?.resources);

  if (hasCarouselIndicator) return "carousel";

  const hasImageIndicator =
    typeCandidates.some((type) =>
      ["image", "photo", "graphimage", "picture"].some((keyword) => type.includes(keyword))
    ) ||
    typeof post?.image_versions2 !== "undefined" ||
    typeof post?.display_url === "string" ||
    (typeof post?.media_url === "string" && !isVideoLikeUrl(post.media_url));

  if (hasImageIndicator) return "image";

  return "image";
};

const countPostTypes = (posts: any[], platform: PlatformKey): Record<PostType, number> => {
  return posts.reduce<Record<PostType, number>>(
    (acc, post) => {
      const type = detectPostType(post, platform);
      acc[type] += 1;
      return acc;
    },
    { video: 0, carousel: 0, image: 0 }
  );
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
  const { token, profile } = useAuth();
  const [igProfile, setIgProfile] = useState<any>(null);
  const [igPosts, setIgPosts] = useState<any[]>([]);
  const [tiktokProfile, setTiktokProfile] = useState<any>(null);
  const [tiktokPosts, setTiktokPosts] = useState<any[]>([]);

  const clientUsernames = useMemo(() => {
    const sanitizeUsername = (value: unknown) =>
      typeof value === "string" ? value.replace(/^@+/, "").trim() : "";

    const pickUsername = (candidates: unknown[]) => {
      for (const candidate of candidates) {
        const sanitized = sanitizeUsername(candidate);
        if (sanitized) return sanitized;
      }
      return "";
    };

    const instagram = pickUsername([
      profile?.client?.client_insta,
      profile?.client_insta,
      profile?.client?.instagram,
      profile?.instagram,
      profile?.client?.instagram_username,
      profile?.instagram_username,
    ]);

    const tiktok = pickUsername([
      profile?.client?.client_tiktok,
      profile?.client_tiktok,
      profile?.client?.tiktok,
      profile?.tiktok,
      profile?.client?.tiktok_username,
      profile?.tiktok_username,
    ]);

    return {
      instagram: instagram || undefined,
      tiktok: tiktok || undefined,
    } as const;
  }, [profile]);

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

    const instagramTypeCounts = countPostTypes(igPosts, "instagram");
    const tiktokTypeCounts = countPostTypes(tiktokPosts, "tiktok");

    const totals = {
      followers: instagramFollowers + tiktokFollowers,
      following: instagramFollowing + tiktokFollowing,
      likes: instagramLikes + tiktokLikes,
      comments: instagramComments + tiktokComments,
      views: instagramViews + tiktokViews,
      posts: igPosts.length + tiktokPosts.length,
      videoPosts: instagramTypeCounts.video + tiktokTypeCounts.video,
      carouselPosts: instagramTypeCounts.carousel + tiktokTypeCounts.carousel,
      imagePosts: instagramTypeCounts.image + tiktokTypeCounts.image,
    };

    const totalEngagements = totals.likes + totals.comments;
    const carouselImagePosts = totals.carouselPosts + totals.imagePosts;
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
        engagements: totalEngagements,
        carouselImagePosts,
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
        title: "Engagement",
        value: `${analytics.totals.engagements}`,
        subtitle: "Likes + Komentar",
        icon: "⚡",
      },
    ];
  }, [analytics]);

  const snapshotMetrics = useMemo(
    () => [
      {
        key: "posts",
        label: "Total Konten",
        value: analytics.totals.posts,
        accent: "text-emerald-600 dark:text-emerald-300",
        helper: "Konten dianalisis hari ini",
      },
      {
        key: "videos",
        label: "Total Video",
        value: analytics.totals.videoPosts,
        accent: "text-sky-600 dark:text-cyan-300",
        helper: "Video lintas platform",
      },
      {
        key: "carousel-image",
        label: "Total Carousel / Image",
        value: analytics.totals.carouselImagePosts,
        accent: "text-fuchsia-600 dark:text-fuchsia-300",
        helper: "Konten gambar & carousel",
      },
      {
        key: "engagement",
        label: "Total Engagement",
        value: formatCompactNumber(analytics.totals.engagements),
        accent: "text-amber-600 dark:text-amber-300",
        helper: "Akumulasi likes & komentar",
      },
    ],
    [analytics]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-cyan-50 to-indigo-100 text-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -right-32 h-96 w-96 rounded-full bg-sky-200/60 blur-3xl dark:bg-cyan-500/30" />
        <div className="absolute bottom-0 left-0 h-[28rem] w-[28rem] rounded-full bg-indigo-200/40 blur-[200px] dark:bg-purple-500/20" />
        <div className="absolute right-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-cyan-200/50 blur-3xl dark:bg-blue-500/10" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-12">
        <section className="space-y-8">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/80 px-4 py-1 text-xs uppercase tracking-[0.3em] text-sky-700 shadow-[0_12px_30px_rgba(14,165,233,0.12)] dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0.6rem_rgba(52,211,153,0.45)] dark:shadow-[0_0_0.6rem_rgba(52,211,153,0.7)]" />
              Command Center
            </span>
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl dark:text-slate-50">
              Ikhtisar Data Keterlibatan Audiens Instagram & TikTok secara Real-time
            </h1>
            <p className="max-w-2xl text-base text-sky-700 md:text-lg dark:text-slate-300">
              Pantau detik demi detik perkembangan audiens, reaksi komunitas, dan percakapan yang terjadi di Instagram serta TikTok melalui satu kanvas visual yang imersif.
            </p>
            <div className="grid gap-3 text-sm text-sky-700 sm:grid-cols-2 dark:text-slate-300">
              <div className="flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/80 px-3 py-1.5 shadow-[0_10px_25px_rgba(56,189,248,0.12)] dark:border-slate-700/60 dark:bg-slate-900/60">
                <span className="text-emerald-500 dark:text-emerald-300">◎</span>
                <span>Data terintegrasi lintas platform</span>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/80 px-3 py-1.5 shadow-[0_10px_25px_rgba(129,140,248,0.12)] dark:border-slate-700/60 dark:bg-slate-900/60">
                <span className="text-sky-600 dark:text-cyan-300">◎</span>
                <span>Visual responsif & mudah dipahami</span>
              </div>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-white/80 via-sky-50/80 to-cyan-50/60 p-6 shadow-[0_35px_60px_-15px_rgba(14,165,233,0.2)] dark:border-slate-700/60 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-slate-900/10">
              <div className="absolute inset-x-10 top-4 h-24 rounded-full bg-gradient-to-b from-sky-300/40 via-transparent to-transparent blur-2xl dark:from-cyan-400/30" />
              <div className="relative flex flex-1 flex-col gap-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Snapshot Hari Ini</h2>
                <p className="text-sm text-sky-700 dark:text-slate-300">
                  {analytics.totals.posts > 0
                    ? `Analisis ${analytics.totals.posts} konten terbaru dengan akumulasi likes dan komentar sebanyak ${formatCompactNumber(
                        analytics.totals.engagements
                      )}`
                    : "Menunggu konten terbaru untuk dianalisis."}
                </p>
                <div className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2 xl:grid-cols-2 dark:text-slate-200">
                  {snapshotMetrics.map((metric) => (
                    <div
                      key={metric.key}
                      className="group flex flex-col gap-2 rounded-2xl border border-sky-200/70 bg-white/75 p-4 shadow-[0_18px_40px_rgba(14,165,233,0.14)] transition duration-200 hover:-translate-y-1 hover:border-sky-300/70 hover:shadow-[0_22px_45px_rgba(56,189,248,0.2)] dark:border-slate-800/60 dark:bg-slate-900/60 dark:shadow-[0_0_1.5rem_rgba(56,189,248,0.12)] dark:hover:border-cyan-400/40 dark:hover:shadow-[0_0_2.5rem_rgba(56,189,248,0.25)]"
                    >
                      <span className="text-xs font-medium uppercase tracking-[0.2em] text-sky-600 dark:text-slate-400">
                        {metric.label}
                      </span>
                      <p className={cn("text-2xl font-semibold", metric.accent)}>{metric.value}</p>
                      <span className="text-xs text-sky-600 dark:text-slate-400">{metric.helper}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex h-full flex-col justify-center gap-6">
              <DashboardStats
                highlights={highlightCards}
                igProfile={igProfile}
                igPosts={igPosts}
                tiktokProfile={tiktokProfile}
                tiktokPosts={tiktokPosts}
                className="grid-cols-1 sm:grid-cols-2 h-full"
                cardClassName="border-sky-200/70 bg-white/75 dark:border-slate-800/70 dark:bg-slate-900/70"
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Rincian Kinerja Platform</h2>
            <p className="text-sm text-sky-700 dark:text-slate-300">
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
                  accent: "text-sky-600 dark:text-cyan-300",
                },
                {
                  key: "comments",
                  label: "Komentar",
                  value: formatCompactNumber(platform.comments),
                  accent: "text-emerald-600 dark:text-emerald-300",
                },
                {
                  key: "engagement",
                  label: "Engagement",
                  value: `${platform.engagementRate.toFixed(2)}%`,
                  accent: "text-fuchsia-600 dark:text-fuchsia-300",
                },
              ];

              const shareMetrics = [
                {
                  key: "followers",
                  label: "Followers",
                  value: platform.shares.followers,
                  gradient: "from-violet-500 via-fuchsia-400 to-cyan-300",
                },
                {
                  key: "likes",
                  label: "Likes",
                  value: platform.shares.likes,
                  gradient: "from-sky-500 via-cyan-400 to-emerald-300",
                },
                {
                  key: "comments",
                  label: "Komentar",
                  value: platform.shares.comments,
                  gradient: "from-amber-400 via-orange-400 to-rose-400",
                },
              ];

              return (
                <div
                  key={platform.key}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-sky-200/70 bg-white/75 p-6 shadow-[0_28px_60px_rgba(99,102,241,0.18)] transition duration-200 hover:-translate-y-1 hover:border-sky-300/70 hover:shadow-[0_32px_70px_rgba(129,140,248,0.25)] dark:border-slate-800/70 dark:bg-slate-900/50 dark:shadow-[0_0_30px_rgba(79,70,229,0.25)] dark:hover:border-cyan-400/40 dark:hover:shadow-[0_0_45px_rgba(34,211,238,0.22)]"
                >
                  <div className="absolute -top-12 right-4 h-32 w-32 rounded-full bg-gradient-to-br from-sky-300/50 via-transparent to-transparent blur-2xl transition group-hover:from-sky-300/70 dark:from-cyan-400/40 dark:group-hover:from-cyan-400/60" />
                  <div className="relative flex h-full flex-col gap-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-[0.25em] text-sky-600 dark:text-slate-400">Platform</p>
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">{platform.label}</h3>
                      </div>
                      <div className="flex flex-col items-end rounded-2xl border border-sky-200/70 bg-white/80 px-3 py-2 text-xs text-sky-700 shadow-[0_12px_30px_rgba(14,165,233,0.12)] dark:border-slate-800/60 dark:bg-slate-900/60 dark:text-slate-300">
                        <span className="font-medium text-slate-900 dark:text-slate-200">Followers</span>
                        <span className="text-lg font-semibold text-sky-600 dark:text-cyan-300">
                          {formatCompactNumber(platform.followers)}
                        </span>
                        <span className="mt-1 text-sky-600 dark:text-slate-400">Posts: {platform.posts}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-3 dark:text-slate-200">
                      {primaryMetrics.map((metric) => (
                        <div
                          key={metric.key}
                          className="flex flex-col gap-2 rounded-2xl border border-sky-200/70 bg-white/80 p-4 shadow-[0_15px_35px_rgba(14,165,233,0.12)] dark:border-slate-800/60 dark:bg-slate-900/60"
                        >
                          <span className="text-xs font-medium uppercase tracking-wide text-sky-600 dark:text-slate-400">
                            {metric.label}
                          </span>
                          <span className={cn("text-lg font-semibold", metric.accent)}>{metric.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-auto space-y-3 text-xs text-sky-700 dark:text-slate-300">
                      {shareMetrics.map((share) => (
                        <div
                          key={share.key}
                          className="rounded-2xl border border-sky-200/70 bg-white/80 p-3 shadow-[0_12px_28px_rgba(56,189,248,0.16)] dark:border-slate-800/60 dark:bg-slate-900/60"
                        >
                          <div className="mb-2 flex justify-between text-[0.7rem] font-medium uppercase tracking-wider text-sky-600 dark:text-slate-400">
                            <span>{share.label}</span>
                            <span>{share.value.toFixed(1)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-sky-100 dark:bg-slate-800">
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
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Detak Interaksi & Percakapan</h2>
            <p className="text-sm text-sky-700 dark:text-slate-300">
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
            clientUsernames={clientUsernames}
          />
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Konten Paling Resonansi</h2>
            <p className="text-sm text-sky-700 dark:text-slate-300">
              Sorotan posting dengan likes, komentar, dan views tertinggi untuk memetakan pola konten
              yang paling disukai audiens.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {analytics.topPosts.length === 0 && (
              <div className="col-span-full rounded-3xl border border-sky-200/70 bg-white/75 p-8 text-center text-sm text-sky-700 shadow-[0_25px_60px_rgba(59,130,246,0.18)] dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-300">
                Data konten belum tersedia. Unggah konten baru untuk melihat analitik terbaru.
              </div>
            )}
            {analytics.topPosts.map((post) => (
              <a
                key={`${post.platform}-${post.id}`}
                href={post.url || undefined}
                target={post.url ? "_blank" : undefined}
                rel={post.url ? "noopener noreferrer" : undefined}
                className="group relative overflow-hidden rounded-3xl border border-sky-200/70 bg-white/80 p-4 transition hover:-translate-y-1 hover:border-sky-300/70 hover:shadow-[0_28px_60px_rgba(56,189,248,0.22)] dark:border-slate-800/60 dark:bg-slate-900/50 dark:hover:border-cyan-400/60 dark:hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]"
              >
                <div className="absolute -top-16 right-0 h-32 w-32 rounded-full bg-sky-300/40 blur-3xl transition group-hover:bg-sky-300/60 dark:bg-cyan-500/20 dark:group-hover:bg-cyan-400/30" />
                <div className="relative space-y-4">
                  {post.thumbnail ? (
                    <img
                      src={post.thumbnail}
                      alt={`Thumbnail ${post.platform}`}
                      className="h-40 w-full rounded-2xl object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-40 w-full items-center justify-center rounded-2xl border border-sky-200/70 bg-white/70 text-sky-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-500">
                      Tidak ada thumbnail
                    </div>
                  )}
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.2em] text-sky-700 shadow-[0_12px_28px_rgba(79,70,229,0.18)] dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300">
                      {post.platform}
                    </span>
                    <p
                      className="text-sm text-slate-800 dark:text-slate-200"
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
                  <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-700 dark:text-slate-300">
                    <div className="rounded-2xl border border-sky-200/70 bg-white/80 px-3 py-2 shadow-[0_12px_30px_rgba(56,189,248,0.15)] dark:border-slate-800/70 dark:bg-slate-900/70">
                      <p className="text-[0.65rem] uppercase tracking-wide text-sky-600 dark:text-slate-400">Likes</p>
                      <p className="text-base font-semibold text-sky-600 dark:text-cyan-300">
                        {formatCompactNumber(post.likes)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-sky-200/70 bg-white/80 px-3 py-2 shadow-[0_12px_30px_rgba(16,185,129,0.15)] dark:border-slate-800/70 dark:bg-slate-900/70">
                      <p className="text-[0.65rem] uppercase tracking-wide text-sky-600 dark:text-slate-400">Komentar</p>
                      <p className="text-base font-semibold text-emerald-600 dark:text-emerald-300">
                        {formatCompactNumber(post.comments)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-sky-200/70 bg-white/80 px-3 py-2 shadow-[0_12px_30px_rgba(217,70,239,0.15)] dark:border-slate-800/70 dark:bg-slate-900/70">
                      <p className="text-[0.65rem] uppercase tracking-wide text-sky-600 dark:text-slate-400">Views</p>
                      <p className="text-base font-semibold text-fuchsia-600 dark:text-fuchsia-300">
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
