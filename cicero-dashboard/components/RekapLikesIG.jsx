"use client";
import { useMemo, useState } from "react";

export default function RekapLikesIG({ users = [] }) {
  // Hitung status dengan exception
  const totalUser = users.length;
  const totalSudahLike = users.filter(u =>
    Number(u.jumlah_like) > 0 || u.exception === true
  ).length;
  const totalBelumLike = totalUser - totalSudahLike;

  // Search
  const [search, setSearch] = useState("");
  const filtered = useMemo(() =>
    users.filter(
      u =>
        (u.nama || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.username || "").toLowerCase().includes(search.toLowerCase())
    ),
    [users, search]
  );

  // Sort: Sudah Like duluan (termasuk exception)
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        // Sudah Like/exception di atas
        const aSudah = Number(a.jumlah_like) > 0 || a.exception === true;
        const bSudah = Number(b.jumlah_like) > 0 || b.exception === true;
        if (aSudah === bSudah) {
          // Jika sama, urutkan by jumlah_like
          return Number(b.jumlah_like) - Number(a.jumlah_like);
        }
        return bSudah - aSudah; // yang sudah di atas
      }),
    [filtered]
  );

  return (
    <div className="flex flex-col gap-6 mt-8">
      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title="Total User" value={totalUser} color="bg-blue-100" />
        <SummaryCard title="Sudah Like" value={totalSudahLike} color="bg-green-100" />
        <SummaryCard title="Belum Like" value={totalBelumLike} color="bg-red-100" />
      </div>

      {/* Search bar */}
      <div className="flex justify-end mb-2">
        <input
          type="text"
          placeholder="Cari nama atau username"
          className="px-3 py-1 border rounded-lg text-sm w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl shadow-md p-4 overflow-x-auto">
        <h3 className="font-semibold text-lg mb-3">Rekap Likes Instagram Hari Ini</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="py-2 text-left">No</th>
              <th className="py-2 text-left">Nama</th>
              <th className="py-2 text-left">Username IG</th>
              <th className="py-2 text-center">Status</th>
              <th className="py-2 text-center">Jumlah Like</th>
              <th className="py-2 text-center">Exception</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((u, i) => {
              const sudahLike = Number(u.jumlah_like) > 0 || u.exception === true;
              return (
                <tr key={u.user_id}
                  className={
                    sudahLike
                      ? "bg-green-50"
                      : "bg-red-50"
                  }
                >
                  <td className="py-1 px-2">{i + 1}</td>
                  <td className="py-1 px-2">{u.nama}</td>
                  <td className="py-1 px-2">@{u.username}</td>
                  <td className="py-1 px-2 text-center">
                    {sudahLike ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-500 text-white font-semibold">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Sudah
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-red-500 text-white font-semibold">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        Belum
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-2 text-center font-bold">{u.jumlah_like}</td>
                  <td className="py-1 px-2 text-center">{u.exception === true ? "✅" : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div className={`rounded-xl shadow p-4 flex flex-col items-center ${color}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs mt-1 text-gray-700 font-semibold">{title}</div>
    </div>
  );
}
