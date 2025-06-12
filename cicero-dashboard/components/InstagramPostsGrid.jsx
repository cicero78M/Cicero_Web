"use client";
export default function InstagramPostsGrid({ posts = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {posts.map((post) => (
        <div
          key={post.id || post.post_id}
          className="bg-white rounded-lg shadow border overflow-hidden"
        >
          <img
            src={post.thumbnail || "/file.svg"}
            alt={post.caption || "thumbnail"}
            className="w-full h-48 object-cover"
          />
          <div className="p-4 flex flex-col gap-2">
            <p className="font-semibold text-sm break-words">
              {post.caption || "-"}
            </p>
            <div className="text-xs text-gray-600 flex gap-4">
              {post.like_count != null && <span>❤️ {post.like_count}</span>}
              {post.comment_count != null && <span>💬 {post.comment_count}</span>}
              {post.view_count != null && <span>👁️ {post.view_count}</span>}
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
