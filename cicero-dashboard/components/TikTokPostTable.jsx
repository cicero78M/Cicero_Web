"use client";

export default function TikTokPostTable({ posts = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-2 px-2 text-left">Caption</th>
            <th className="py-2 px-2 text-left">Tanggal</th>
            <th className="py-2 px-2 text-left">Views</th>
            <th className="py-2 px-2 text-left">Likes</th>
            <th className="py-2 px-2 text-left">Komentar</th>
            <th className="py-2 px-2 text-left">Share</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p, idx) => (
            <tr key={idx} className="border-t">
              <td className="py-1 px-2 break-words">{p.text || p.caption}</td>
              <td className="py-1 px-2">
                {p.create_time
                  ? new Date(p.create_time * 1000).toLocaleDateString()
                  : "-"}
              </td>
              <td className="py-1 px-2">{p.play_count || p.views}</td>
              <td className="py-1 px-2">{p.like_count || p.likes}</td>
              <td className="py-1 px-2">{p.comment_count || p.comments}</td>
              <td className="py-1 px-2">{p.share_count || p.shares}</td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan="6" className="py-4 text-center text-gray-500">
                Tidak ada data post TikTok
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
