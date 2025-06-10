"use client";
import { useMemo, useState, useEffect } from "react";

// Utility: handle boolean/string/number for exception
function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

const PAGE_SIZE = 25;

export default function RekapLikesIG({ users = [], totalIGPost = 0 }) {
  const totalUser = users.length;

  // LOGIC ABSENSI:
  // 1. Semua user dianggap "belum" jika IG Post hari ini = 0
  // 2. Jika IG post ada, "sudah like" jika jumlah_like > 0 ATAU exception
  const totalSudahLike = useMemo(() =>
    totalIGPost === 0
      ? 0
      : users.filter(u => Number(u.jumlah_like) > 0 || isException(u.exception)).length
    , [users, totalIGPost]
  );
  const totalBelumLike = totalUser - totalSudahLike;

  // Nilai tertinggi jumlah_like (bukan exception)
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

  // Sorting (urut absensi paling atas, urut nama jika sama)
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aSudah = totalIGPost > 0 && (Number(a.jumlah_like) > 0 || isException(a.exception));
      const bSudah = totalIGPost > 0 && (Number(b.jumlah_like) > 0 || isException(b.exception));
      if (aSudah && !bSudah) return -1;
      if (!aSudah && bSudah) return 1;
      // urut jumlah_like desc jika sama-sama sudah like
      if (aSudah && bSudah) {
        if (a.jumlah_like !== b.jumlah_like) return b.jumlah_like - a.jumlah_like;
      }
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

          {/* Card Ringkasan */}
          <div className="bg-gradient-to-tr from-blue-50 to-white rounded-2xl shadow flex flex-col md:flex-row items-stretch justify-between p-3 md:p-5 gap-2 md:gap-4 border">
            <SummaryItem
              label="IG Post Hari Ini"
              value={rekapSummary.totalIGPost}
              color="blue"
              icon={
                <span className="inline-block text-blue-400 text-2xl">📸</span>
              }
            />
            <Divider />
            <SummaryItem
              label="Total User"
              value={rekapSummary.totalUser}
              color="gray"
              icon={
                <span className="inline-block text-gray-400 text-2xl">👤</span>
              }
            />
            <Divider />
            <SummaryItem
              label="Sudah Likes"
              value={rekapSummary.totalSudahLike}
              color="green"
              icon={
                <span className="inline-block text-green-500 text-2xl">👍</span>
              }
            />
            <Divider />
            <SummaryItem
              label="Belum Likes"
              value={rekapSummary.totalBelumLike}
              color="red"
              icon={
                <span className="inline-block text-red-500 text-2xl">👎</span>
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
              // Status absensi
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

function SummaryItem({ label, value, color = "gray", icon }) {
  const colorMap = {
    blue: "text-blue-700",
    green: "text-green-600",
    red: "text-red-500",
    gray: "text-gray-700",
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-2">
      <div className="mb-1">{icon}</div>
      <div className={`text-3xl md:text-4xl font-bold ${colorMap[color]}`}>
        {value}
      </div>
      <div className="text-xs md:text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wide text-center">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  // Vertical divider in desktop, horizontal in mobile
  return <div className="hidden md:block w-px bg-gray-200 mx-2 my-2"></div>;
}
