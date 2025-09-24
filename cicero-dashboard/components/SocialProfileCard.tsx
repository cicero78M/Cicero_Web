"use client";
import { useState } from "react";

type PlatformKey = "instagram" | "tiktok" | string;

interface SocialProfileCardProps {
  platform: PlatformKey;
  profile: any;
  postCount?: number;
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
}: SocialProfileCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getThumb = (url: string | undefined | null) => {
    if (!url) return null;
    return url.replace(/\.heic(\?|$)/, ".jpg$1");
  };

  const platformLabel =
    platform === "instagram" ? "Instagram" : platform === "tiktok" ? "TikTok" : platform;
  const platformGradient =
    platform === "instagram"
      ? "from-pink-500/40 via-purple-500/40 to-sky-500/40"
      : "from-emerald-500/40 via-cyan-500/40 to-blue-500/40";

  if (!profile) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/40 to-transparent" />
        <div className="relative space-y-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
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

  const link =
    platform === "instagram"
      ? `https://instagram.com/${profile.username}`
      : `https://www.tiktok.com/@${profile.username}`;
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

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-[0_0_32px_rgba(79,70,229,0.2)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${platformGradient} opacity-40`} />
      <div className="absolute -right-16 top-10 h-32 w-32 rounded-full bg-white/5 blur-3xl" />
      <div className="relative space-y-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt="avatar"
                loading="lazy"
                className="h-16 w-16 rounded-full border border-white/20 object-cover shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-lg text-slate-400">
                {platformLabel[0] ?? "?"}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 inline-flex items-center rounded-full bg-slate-900/90 px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-slate-300">
              {platformLabel}
            </span>
          </div>
          <div className="flex flex-col">
            {name && <span className="text-lg font-semibold text-slate-50">{name}</span>}
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-300 hover:text-cyan-200"
            >
              @{profile.username}
            </a>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                {formatNumber(followers)} followers
                {showTooltip && (
                  <span className="absolute left-0 top-full mt-1 w-max rounded-md bg-slate-900/95 px-3 py-1 text-[0.65rem] text-slate-200 shadow-lg">
                    Total pengikut akun
                  </span>
                )}
              </span>
              <span className="text-slate-500">•</span>
              <span>{formatNumber(following)} following</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/70 px-3 py-1 text-xs text-slate-200"
            >
              <span className="text-slate-400">{badge.label}</span>
              <span className="font-semibold text-slate-100">{badge.value}</span>
            </span>
          ))}
        </div>
        {bio && (
          <div className="text-sm text-slate-200 whitespace-pre-line">
            {bio}
          </div>
        )}
      </div>
    </div>
  );
}
