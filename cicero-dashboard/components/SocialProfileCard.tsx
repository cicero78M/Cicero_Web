"use client";
import { useState } from "react";

type PlatformKey = "instagram" | "tiktok" | string;

interface SocialProfileCardProps {
  platform: PlatformKey;
  profile: any;
  postCount?: number;
  className?: string;
  username?: string;
}

const formatNumber = (value?: number) => {
  if (!value || Number.isNaN(value)) return "0";
  const formatter = new Intl.NumberFormat("id-ID", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  });
  return formatter.format(value);
};

export default function SocialProfileCard({
  platform,
  profile,
  postCount = 0,
  className,
  username,
}: SocialProfileCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getThumb = (url: string | undefined | null) => {
    if (!url) return null;
    return url.replace(/\.heic(\?|$)/, ".jpg$1");
  };

  const sanitizeUsername = (value: unknown) =>
    typeof value === "string" ? value.replace(/^@+/, "").trim() : "";

  const pickUsername = (candidates: unknown[]) => {
    for (const candidate of candidates) {
      const sanitized = sanitizeUsername(candidate);
      if (sanitized) return sanitized;
    }
    return "";
  };

  const platformLabel =
    platform === "instagram" ? "Instagram" : platform === "tiktok" ? "TikTok" : platform;
  const platformGradient =
    platform === "instagram"
      ? "from-pink-500/40 via-purple-500/40 to-sky-500/40"
      : "from-emerald-500/40 via-cyan-500/40 to-blue-500/40";

  const aggregatorUsername = pickUsername([
    profile?.username,
    profile?.user_name,
    profile?.uniqueId,
    profile?.unique_id,
    profile?.handle,
  ]);
  const overrideUsername = sanitizeUsername(username);
  const effectiveUsername = overrideUsername || aggregatorUsername;
  const profileLink = effectiveUsername
    ? platform === "instagram"
      ? `https://instagram.com/${effectiveUsername}`
      : `https://www.tiktok.com/@${effectiveUsername}`
    : aggregatorUsername
      ? platform === "instagram"
        ? `https://instagram.com/${aggregatorUsername}`
        : `https://www.tiktok.com/@${aggregatorUsername}`
      : undefined;
  const displayUsername = effectiveUsername || aggregatorUsername;

  if (!profile) {
    const emptyStateClassName =
      "relative overflow-hidden rounded-3xl border border-sky-200/70 bg-white/80 p-6 text-center text-sm text-sky-700 shadow-[0_24px_50px_rgba(129,140,248,0.18)] dark:border-slate-800/70 dark:bg-slate-900/60 dark:text-slate-300";

    return (
      <div className={`${emptyStateClassName}${className ? ` ${className}` : ""}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-sky-200/40 to-transparent dark:from-slate-800/40" />
        <div className="relative space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/80 px-3 py-1 text-xs uppercase tracking-[0.3em] text-sky-700 shadow-[0_12px_28px_rgba(79,70,229,0.18)] dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300">
            {platformLabel} Profile
          </span>
          <p>Data profil belum tersedia.</p>
        </div>
      </div>
    );
  }

  const avatar =
    profile.profile_pic_url_hd ||
    profile.profile_pic_url ||
    profile.avatar_url ||
    profile.avatar ||
    profile.hd_profile_pic_url_info?.url ||
    profile.hd_profile_pic_versions?.[0]?.url ||
    "";

  const avatarSrc = getThumb(avatar);

  const followers = profile.followers ?? profile.follower_count ?? 0;
  const following = profile.following ?? profile.following_count ?? 0;
  const bio = profile.bio ?? profile.biography;
  const name = profile.full_name ?? profile.nickname ?? profile.name;

  const badges = [
    { label: "Followers", value: formatNumber(followers) },
    { label: "Following", value: formatNumber(following) },
    { label: "Posts", value: formatNumber(postCount) },
  ];

  const baseClassName =
    "relative flex h-full flex-col overflow-hidden rounded-3xl border border-sky-200/70 bg-white/80 p-6 shadow-[0_28px_60px_rgba(99,102,241,0.18)] dark:border-slate-800/70 dark:bg-slate-900/60 dark:shadow-[0_0_32px_rgba(79,70,229,0.2)]";

  return (
    <div className={`${baseClassName}${className ? ` ${className}` : ""}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${platformGradient} opacity-40`} />
      <div className="absolute -right-16 top-10 h-32 w-32 rounded-full bg-white/40 blur-3xl dark:bg-white/5" />
      <div className="relative flex flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="avatar"
                loading="lazy"
                className="h-16 w-16 rounded-full border border-white/40 object-cover shadow-[0_18px_36px_rgba(148,163,184,0.25)] dark:border-white/20 dark:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-sky-200 bg-white text-lg text-sky-600 shadow-[0_10px_28px_rgba(59,130,246,0.2)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {platformLabel[0] ?? "?"}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-sky-700 shadow-[0_8px_20px_rgba(14,165,233,0.2)] dark:bg-slate-900/90 dark:text-slate-300">
              {platformLabel}
            </span>
          </div>
          <div className="flex flex-col">
            {name && <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">{name}</span>}
            <a
              href={profileLink ?? undefined}
              target={profileLink ? "_blank" : undefined}
              rel={profileLink ? "noopener noreferrer" : undefined}
              className="text-sm text-sky-600 transition hover:text-sky-800 dark:text-cyan-300 dark:hover:text-cyan-200"
            >
              @{displayUsername || profile.username}
            </a>
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <span
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {formatNumber(followers)} followers
                {showTooltip && (
                  <span className="absolute left-0 top-full mt-1 w-max rounded-md bg-slate-900/90 px-3 py-1 text-[0.65rem] text-slate-100 shadow-lg">
                    Total pengikut akun
                  </span>
                )}
              </span>
              <span className="text-sky-400 dark:text-slate-500">•</span>
              <span>{formatNumber(following)} following</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-white/80 px-3 py-1 text-xs text-slate-800 shadow-[0_12px_30px_rgba(56,189,248,0.18)] dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-200"
            >
              <span className="text-sky-600 dark:text-slate-400">{badge.label}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{badge.value}</span>
            </span>
          ))}
        </div>
        {bio && (
          <div className="text-sm text-slate-700 whitespace-pre-line dark:text-slate-200">
            {bio}
          </div>
        )}
      </div>
    </div>
  );
}
