"use client";
import { useMemo, useState } from "react";

// Utility: handle boolean/string/number for exception
function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

export default function RekapLikesIG({ users = [] }) {
  const totalUser = users.length;
  const totalSudahLike = users.filter(u =>
    Number(u.jumlah_like) > 0 || isException(u.exception)
  ).length;
  const totalBelumLike = totalUser - totalSudahLike;

  // Search/filter
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      users.filter(
        u =>
          (u.nama || "").toLowerCase().includes(search.toLowerCase()) ||
          (u.username || "").toLowerCase().includes(search.toLowerCase()) ||
          (u.divisi || "").toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  // Sort: Sudah Like (termasuk exception) di atas
  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const aSudah = Number(a.jumlah_like) > 0 || isException(a.exception);
        const bSudah = Number(b.jumlah_like) > 0 || isException(b.exception);
        if (aSudah === bSudah) {
          return Number(b.jumlah_like) - Number(a.jumlah_like);
        }
        return bSudah - aSudah;
      }),
    [filtered]
  );

  return (
    <div className="flex flex-col gap-6 mt-8">
      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total User"
          value={totalUser}
          color="bg-blue-100"
          icon={
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M3 20h5m0 0v-2a4 4 0 00-3-3.87m3 3.87a9 9 0 0010 0m-10 0a9 9 0 0110 0M6 20v-2a4 4 0 013-3.87M18 20v-2a4 4 0 00-3-3.87" /></svg>
          }
        />
        <SummaryCard
          title="Sudah Like"
          value={totalSudahLike}
          color="bg-green-100"
          icon={
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          }
        />
        <SummaryCard
          title="Belum Like"
          value={totalBelumLike}
          color="bg-red-100"
          icon={
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          }
        />
      </div>

      {/* Search bar */}
      <div className="flex justify-end mb-2">
        <input
          type="text"
          placeholder="Cari nama, username, atau divisi"
          className="px-3 py-2 border rounded-lg text-sm w-64 shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Tabel */}
      <div className="relative overflow-x-auto rounded-xl shadow">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="py-2 px-2">No</th>
              <th className="py-2 px-2">Nama</th>
              <th className="py-2 px-2">Username IG</th>
              <th className="py-2 px-2">Divisi/Satfung</th>
              <th className="py-2 px-2 text-center">Status</th>
              <th className="py-2 px-2 text-center">Jumlah Like</th>
            </tr>
          </thead>
<tbody>
  {sorted.map((u, i) => {
    const sudahLike = Number(u.jumlah_like) > 0 || isException(u.exception);
    return (
      <tr key={u.user_id} className={sudahLike ? "bg-green-50" : "bg-red-50"}>
        <td className="py-1 px-2">{i + 1}</td>
        <td className="py-1 px-2">
          {u.title ? `${u.title} ${u.nama}` : u.nama}
        </td>
        <td className="py-1 px-2 font-mono text-blue-700">@{u.username}</td>
        <td className="py-1 px-2">
          <span className="inline-block px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
            {u.divisi || "-"}
          </span>
        </td>
        <td className="py-1 px-2 text-center">
          {sudahLike ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-500 text-white font-semibold">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Sudah
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500 text-white font-semibold">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              Belum
            </span>
          )}
        </td>
        <td className="py-1 px-2 text-center font-bold">{u.jumlah_like}</td>
      </tr>
    );
  })}
</tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color, icon }) {
  return (
    <div className={`rounded-2xl shadow-md p-6 flex flex-col items-center gap-2 ${color}`}>
      <div className="flex items-center gap-2 text-3xl font-bold">
        {icon}
        <span>{value}</span>
      </div>
      <div className="text-xs mt-1 text-gray-700 font-semibold uppercase tracking-wider">{title}</div>
    </div>
  );
}
