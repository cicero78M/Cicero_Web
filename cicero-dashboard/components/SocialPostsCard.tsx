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
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col">
      <h2 className="font-semibold capitalize mb-2">{platform} Posts</h2>
      {posts && posts.length > 0 ? (
        <div>
          {platform === "instagram" ? (
            <InstagramPostsGrid posts={posts.slice(0, 3)} />
          ) : (
            <TiktokPostsGrid posts={posts.slice(0, 3)} />
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-500">No posts available</div>
      )}
    </div>
  );
}
