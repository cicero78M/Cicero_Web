"use client";
import { Heart, MessageCircle, Eye } from "lucide-react";

interface Post {
  id?: string;
  post_id?: string;
  video_id?: string;
  thumbnail?: string;
  thumbnail_url?: string;
  cover_url?: string;
  caption?: string;
  like_count?: number;
  comment_count?: number;
  view_count?: number;
}

interface TiktokPostsGridProps {
  posts?: Post[];
}

export default function TiktokPostsGrid({ posts = [] }: TiktokPostsGridProps) {
  const getThumbnailSrc = (url?: string | null) => {
    if (!url) return "/file.svg";
    return url.replace(/\.heic(\?|$)/, ".jpg$1");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <div
          key={post.id || post.post_id || post.video_id}
          className="bg-white rounded-lg shadow border overflow-hidden"
        >
          <img
            src={getThumbnailSrc(
              post.thumbnail || post.thumbnail_url || post.cover_url
            )}
            alt={post.caption || "thumbnail"}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.currentTarget.src = "/file.svg";
            }}
          />
          <div className="p-4 flex flex-col gap-2">
            <p className="font-semibold text-sm break-words">
              {post.caption || "-"}
            </p>
            <div className="text-xs text-gray-600 flex gap-4">
              {post.like_count != null && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3" /> {post.like_count}
                </span>
              )}
              {post.comment_count != null && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> {post.comment_count}
                </span>
              )}
              {post.view_count != null && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" /> {post.view_count}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
      {posts.length === 0 && (
        <div className="col-span-full text-center text-gray-500">
          No posts available
        </div>
      )}
    </div>
  );
}
