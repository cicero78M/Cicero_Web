"use client";

export default function TikTokCommentsTable({ comments = [] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="py-2 px-2 text-left">User</th>
            <th className="py-2 px-2 text-left">Comment</th>
            <th className="py-2 px-2 text-left">Waktu</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((c, idx) => (
            <tr key={idx} className="border-t">
              <td className="py-1 px-2 font-mono text-blue-700">@{c.username}</td>
              <td className="py-1 px-2 break-words">{c.comment || c.text}</td>
              <td className="py-1 px-2">
                {c.timestamp ? new Date(c.timestamp).toLocaleString() : "-"}
              </td>
            </tr>
          ))}
          {comments.length === 0 && (
            <tr>
              <td colSpan="3" className="py-4 text-center text-gray-500">
                Tidak ada data komentar
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
