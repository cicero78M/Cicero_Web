"use client";
import { useMemo, useState, useEffect } from "react";

// Utility: handle boolean/string/number for exception
function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

const PAGE_SIZE = 25;

/**
 * Komponen RekapLikesIG
 * @param {Array} users - array user rekap likes IG (sudah hasil filter/fetch periode yg benar dari parent)
 * @param {number} totalIGPost - jumlah IG Post hari ini (atau sesuai periode, dari parent)
 */
export default function RekapLikesIG({ users = [], totalIGPost = 0 }) {
  const totalUser = users.length;

  // Nilai tertinggi jumlah_like dari semua user bukan exception
  const maxJumlahLike = useMemo(
    () =>
      Math.max(
        0,
        ...users
          .filter(u => !isException(u.exception))
          .map(u => parseInt(u.jumlah_like || 0, 10))
      ),
    [users]
  );

  // === LOGIC ABSENSI: ===
  // 1. Semua user "belum" jika tidak ada IG post hari ini
  // 2. Jika IG post ada, status "sudah" jika: jumlah_like > 0 ATAU exception
  const totalSudahLike = useMemo(() =>
    totalIGPost === 0
      ? 0
      : users.filter(u => Number(u.jumlah_like) > 0 || isException(u.exception)).length
    , [users, totalIGPost]
  );
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

  // Sorting: 1. Sudah Like, 2. Exception, 3. Belum Like, urut jumlah_like desc, lalu nama
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Status "sudah like" mengikuti workflow baru
      const aSudahLike = totalIGPost > 0 && (Number(a.jumlah_like) > 0 || isException(a.exception));
      const bSudahLike = totalIGPost > 0 && (Number(b.jumlah_like) > 0 || isException(b.exception));

      if (aSudahLike && !bSudahLike) return -1;
      if (!aSudahLike && bSudahLike) return 1;

      // Sama-sama "sudah like", urut exception ke bawah
      if (aSudahLike && bSudahLike) {
        const aIsExc = isException(a.exception);
        const bIsExc = isException(b.exception);
        if (aIsExc && !bIsExc) return 1;
        if (!aIsExc && bIsExc) return -1;
        // Urut jumlah_like desc, lalu nama
        if (a.jumlah_like !== b.jumlah_like) return b.jumlah_like - a.jumlah_like;
        return (a.nama || "").localeCompare(b.nama || "");
      }

      // Sisa: urut jumlah_like desc, lalu nama
      if (a.jumlah_like !== b.jumlah_like) return b.jumlah_like - a.jumlah_like;
      return (a.nama || "").localeCompare(b.nama || "");
    });
  }, [filtered, totalIGPost]);

  // Pagination
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset ke halaman 1 jika search berubah
  useEffect(() => setPage(1), [search]);

  return (
    <div className="flex flex-col gap-6 mt-8">

      {/* Summary Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="IG Post Hari Ini"
          value={totalIGPost}
          color="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-blue-400 text-white"
          icon={<span className="text-3xl">📸</span>}
        />
        <SummaryCard
          title="Total User"
          value={totalUser}
          color="bg-gradient-to-r from-blue-400 via-blue-500 to-sky-400 text-white"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M3 20h5m0 0v-2a4 4 0 00-3-3.87m3 3.87a9 9 0 0010 0m-10 0a9 9 0 0110 0M6 20v-2a4 4 0 013-3.87M18 20v-2a4 4 0 00-3-3.87" /></svg>
          }
        />
        <SummaryCard
          title="Sudah Like"
          value={totalSudahLike}
          color="bg-gradient-to-r from-green-400 via-green-500 to-lime-400 text-white"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          }
        />
        <SummaryCard
          title="Belum Like"
          value={totalBelumLike}
          color="bg-gradient-to-r from-red-400 via-pink-500 to-yellow-400 text-white"
          icon={
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
            {currentRows.map((u, i) => {
              // Status absensi mengikuti workflow baru
              const sudahLike = totalIGPost > 0 && (Number(u.jumlah_like) > 0 || isException(u.exception));
              return (
                <tr key={u.user_id} className={sudahLike ? "bg-green-50" : "bg-red-50"}>
                  <td className="py-1 px-2">{(page - 1) * PAGE_SIZE + i + 1}</td>
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
                  <td className="py-1 px-2 text-center font-bold">
                    {isException(u.exception) ? maxJumlahLike : u.jumlah_like}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Halaman <b>{page}</b> dari <b>{totalPages}</b>
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Ringkasan summary card (bisa custom style di sini)
function SummaryCard({ title, value, color, icon }) {
  return (
    <div className={`rounded-2xl shadow-md p-6 flex flex-col items-center gap-2 ${color}`}>
      <div className="flex items-center gap-2 text-3xl font-bold">
        {icon}
        <span>{value}</span>
      </div>
      <div className="text-xs mt-1 text-white font-semibold uppercase tracking-wider">{title}</div>
    </div>
  );
}
