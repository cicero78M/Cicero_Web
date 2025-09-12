"use client";
import { useState } from "react";
import SocialProfileCard from "./SocialProfileCard";
import SocialPostsCard from "./SocialPostsCard";

interface Props {
  igProfile: any;
  igPosts: any[];
  tiktokProfile: any;
  tiktokPosts: any[];
}

export default function SocialCardsClient({
  igProfile,
  igPosts,
  tiktokProfile,
  tiktokPosts,
}: Props) {
  const [platform, setPlatform] = useState<"all" | "instagram" | "tiktok">(
    "all"
  );

  const buttons = [
    { key: "all", label: "Semua" },
    { key: "instagram", label: "Instagram" },
    { key: "tiktok", label: "TikTok" },
  ] as const;

  return (
    <>
      <div className="flex gap-2 mb-4">
        {buttons.map((b) => (
          <button
            key={b.key}
            className={`px-3 py-1 rounded ${
              platform === b.key ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setPlatform(b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(platform === "all" || platform === "instagram") && (
          <>
            <SocialProfileCard
              platform="instagram"
              profile={igProfile}
              postCount={igPosts.length}
            />
            <SocialPostsCard platform="instagram" posts={igPosts} />
          </>
        )}
        {(platform === "all" || platform === "tiktok") && (
          <>
            <SocialProfileCard
              platform="tiktok"
              profile={tiktokProfile}
              postCount={tiktokPosts.length}
            />
            <SocialPostsCard platform="tiktok" posts={tiktokPosts} />
          </>
        )}
      </div>
    </>
  );
}
