"use client";
import { useState } from "react";

interface SocialCardProps {
  platform: string;
  profile: any;
  posts: any[];
}

export default function SocialCard({ platform, profile, posts }: SocialCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const getThumb = (url: string) => {
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
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:underline"
        >
          @{profile.username}
        </a>
        <span
          className="text-sm text-gray-500 relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {profile.followers} followers
          {showTooltip && (
            <span className="absolute left-0 top-full mt-1 w-max bg-black text-white text-xs rounded px-2 py-1">
              Total pengikut akun
            </span>
          )}
        </span>
        <span className="text-sm text-gray-500">{profile.following} following</span>
      </div>
      {profile.bio && (
        <div className="text-sm text-gray-500 whitespace-pre-line mt-1">
          {profile.bio}
        </div>
      )}
      {posts && posts.length > 0 && (
        <div className="flex gap-2 mt-4">
          {posts.slice(0, 3).map((p) => {
            const thumb = getThumb(p.thumbnail);
            return (
              thumb && (
                <img
                  key={p.id || p.post_id}
                  src={thumb}
                  alt="thumb"
                  loading="lazy"
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )
            );
          })}
        </div>
      )}
    </div>
  );
}

