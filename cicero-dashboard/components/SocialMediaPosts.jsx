"use client";
export default function SocialMediaPosts({ platform, posts = [] }) {
  return (
    <div className="bg-white rounded-xl shadow border p-4 flex flex-col gap-4">
      <h2 className="font-semibold text-lg text-blue-700">{platform} Posts</h2>
      {posts.length === 0 ? (
        <div className="text-gray-500">No posts available</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map((p, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden flex flex-col">
              {p.image || p.image_url ? (
                <img
                  src={p.image || p.image_url}
                  alt="post"
                  className="w-full h-48 object-cover"
                />
              ) : null}
              <div className="p-2 flex-1 flex flex-col">
                <p className="text-sm mb-2 flex-1">
                  {p.caption || p.text || ""}
                </p>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>❤️ {p.likes || p.like_count || 0}</span>
                  <span>💬 {p.comments || p.comment_count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
