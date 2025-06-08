// components/RekapLikesIG.jsx
"use client";
import { useMemo } from "react";

export default function RekapLikesIG({ users = [] }) {
  // users: [{ user_id, nama, username, jumlah_like }]

  // Summary statistik
  const totalUser = users.length;
  const totalSudahLike = users.filter(u => Number(u.jumlah_like) > 0).length;
  const totalBelumLike = totalUser - totalSudahLike;

  // Untuk sorting urut absen
  const sorted = useMemo(() =>
    [...users].sort((a, b) =>
      Number(b.jumlah_like) - Number(a.jumlah_like)
    ), [users]);

  return (
    <div className="flex flex-col gap-6 mt-8">
      {/* Summary card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total User" value={totalUser} color="bg-blue-100" />
        <SummaryCard title="Sudah Like" value={totalSudahLike} color="bg-green-100" />
        <SummaryCard title="Belum Like" value={totalBelumLike} color="bg-red-100" />
      </div>

      {/* Tabel absen */}
      <div className="bg-white rounded-xl shadow-md p-4 overflow-x-auto">
        <h3 className="font-semibold text-lg mb-3">Rekap Likes Instagram Hari Ini</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="py-2 text-left">No</th>
              <th className="py-2 text-left">Nama</th>
              <th className="py-2 text-left">Username IG</th>
              <th className="py-2 text-center">Status</th>
              <th className="py-2 text-center">Total Like</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u, i) => (
              <tr key={u.user_id}
                className={
                  Number(u.jumlah_like) > 0
                    ? "bg-green-50"
                    : "bg-red-50"
                }
              >
                <td className="py-1 px-2">{i + 1}</td>
                <td className="py-1 px-2">{u.nama}</td>
                <td className="py-1 px-2">{u.username}</td>
                <td className="py-1 px-2 text-center">
                  {Number(u.jumlah_like) > 0 ? (
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-500 text-white">Sudah</span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-500 text-white">Belum</span>
                  )}
                </td>
                <td className="py-1 px-2 text-center">{u.jumlah_like}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Komponen kecil untuk kartu summary
function SummaryCard({ title, value, color }) {
  return (
    <div className={`rounded-xl shadow p-4 flex flex-col items-center ${color}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs mt-1 text-gray-700 font-semibold">{title}</div>
    </div>
  );
}
