"use client";
import { useState } from "react";

interface SocialProfileCardProps {
  platform: string;
  profile: any;
  postCount?: number;
}

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

  if (!profile) {
    return (
      <div className="bg-white rounded-xl shadow p-4 flex items-center justify-center">
        <h2 className="font-semibold capitalize">{platform} Profile</h2>
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
  const name = profile.full_name ?? profile.nickname;

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col">
      <h2 className="font-semibold capitalize mb-2">{platform} Profile</h2>
      <div className="flex items-center gap-3 flex-wrap">
        {avatarSrc && (
          <img
            src={avatarSrc}
            alt="avatar"
            loading="lazy"
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div className="flex flex-col">
          {name && <span className="font-semibold">{name}</span>}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            @{profile.username}
          </a>
        </div>
        <span
          className="text-sm text-gray-500 relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {followers} followers
          {showTooltip && (
            <span className="absolute left-0 top-full mt-1 w-max bg-black text-white text-xs rounded px-2 py-1">
              Total pengikut akun
            </span>
          )}
        </span>
        <span className="text-sm text-gray-500">{following} following</span>
        <span className="text-sm text-gray-500">{postCount} posts</span>
      </div>
      {bio && (
        <div className="text-sm text-gray-500 whitespace-pre-line mt-2">
          {bio}
        </div>
      )}
    </div>
  );
}
