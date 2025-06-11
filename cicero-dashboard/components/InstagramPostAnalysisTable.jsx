"use client";

export default function InstagramPostAnalysisTable({ posts = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-2 px-2 text-left">Caption</th>
            <th className="py-2 px-2 text-left">Tanggal</th>
            <th className="py-2 px-2 text-left">Likes</th>
            <th className="py-2 px-2 text-left">Komentar</th>
            <th className="py-2 px-2 text-left">Reach</th>
            <th className="py-2 px-2 text-left">Impresi</th>
            <th className="py-2 px-2 text-left">Engagement %</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((p, idx) => (
            <tr key={idx} className="border-t">
              <td className="py-1 px-2 break-words">{p.caption}</td>
              <td className="py-1 px-2">{p.date}</td>
              <td className="py-1 px-2">{p.likes}</td>
              <td className="py-1 px-2">{p.comments}</td>
              <td className="py-1 px-2">{p.reach}</td>
              <td className="py-1 px-2">{p.impressions}</td>
              <td className="py-1 px-2">{p.engagementRate}</td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan="7" className="py-4 text-center text-gray-500">
                Tidak ada data post Instagram
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
