"use client";
import { useMemo, useState, useEffect } from "react";

// Helper: Cek exception value
function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

const PAGE_SIZE = 25;

/**
 * Komponen RekapKomentarTiktok
 * @param {Array} users - array user hasil fetch/final filtering
 * @param {number} totalTiktokPost - jumlah TikTok Post hari ini/periode
 */
export default function RekapKomentarTiktok({ users = [], totalTiktokPost = 0 }) {
  const totalUser = users.length;

  // === Logic: Semua user exception (true/false) dianggap belum jika TikTok post = 0 ===
  const totalSudahKomentar =
    totalTiktokPost === 0
      ? 0
      : users.filter(
          (u) => Number(u.jumlah_komentar) > 0 || isException(u.exception)
        ).length;
  const totalBelumKomentar = totalUser - totalSudahKomentar;

  // Nilai jumlah_komentar tertinggi di seluruh user (kecuali exception)
  const maxJumlahKomentar = useMemo(
    () =>
      Math.max(
        0,
        ...users
          .filter((u) => !isException(u.exception))
          .map((u) => parseInt(u.jumlah_komentar || 0, 10))
      ),
    [users]
  );

  // Search/filter
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          (u.nama || "").toLowerCase().includes(search.toLowerCase()) ||
          (u.username_tiktok || "").toLowerCase().includes(search.toLowerCase()) ||
          (u.satfung || u.divisi || "").toLowerCase().includes(search.toLowerCase())
      ),
    [users, search]
  );

  // Sorting (identik dengan IG, urutkan: sudah komentar/max > exception > sudah > belum > nama)
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aException = isException(a.exception);
      const bException = isException(b.exception);
      const aKomen = Number(a.jumlah_komentar);
      const bKomen = Number(b.jumlah_komentar);

      // 1. Sudah komentar max, bukan exception
      if (!aException && aKomen === maxJumlahKomentar && (bException || bKomen < maxJumlahKomentar)) return -1;
      if (!bException && bKomen === maxJumlahKomentar && (aException || aKomen < maxJumlahKomentar)) return 1;

      // 2. Exception, jumlah_komentar == max → di bawah user yang komen max
      if (aException && bException) return 0;
      if (aException && !bException && bKomen === maxJumlahKomentar) return 1;
      if (!aException && bException && aKomen === maxJumlahKomentar) return -1;

      // 3. Sudah komentar non-exception jumlah_komentar < max
      if (!aException && !bException) {
        if (aKomen > 0 && bKomen === 0) return -1;
        if (aKomen === 0 && bKomen > 0) return 1;
        if (aKomen !== bKomen) return bKomen - aKomen;
        return (a.nama || "").localeCompare(b.nama || "");
      }

      // 4. Exception vs belum komen
      if (aException && !bException) return -1;
      if (!aException && bException) return 1;

      // 5. Sisanya urut nama
      return (a.nama || "").localeCompare(b.nama || "");
    });
  }, [filtered, maxJumlahKomentar]);

  // Pagination
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset ke halaman 1 jika search berubah
  useEffect(() => setPage(1), [search]);

  return (
    <div className="flex flex-col gap-6 mt-8">
      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="TikTok Post Hari Ini"
          value={totalTiktokPost}
          color="bg-gradient-to-r from-fuchsia-400 via-blue-400 to-black text-white"
          icon={<span className="text-3xl">🎵</span>}
        />
        <SummaryCard
          title="Total User"
          value={totalUser}
          color="bg-gradient-to-r from-blue-400 via-blue-500 to-black text-white"
          icon={
            <svg aria-label="Total User" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M3 20h5m0 0v-2a4 4 0 00-3-3.87m3 3.87a9 9 0 0010 0m-10 0a9 9 0 0110 0M6 20v-2a4 4 0 013-3.87M18 20v-2a4 4 0 00-3-3.87" /></svg>
          }
        />
        <SummaryCard
          title="Sudah Komentar"
          value={totalSudahKomentar}
          color="bg-gradient-to-r from-green-400 via-green-500 to-lime-400 text-white"
          icon={
            <svg aria-label="Sudah Komentar" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          }
        />
        <SummaryCard
          title="Belum Komentar"
          value={totalBelumKomentar}
          color="bg-gradient-to-r from-red-400 via-pink-500 to-yellow-400 text-white"
          icon={
            <svg aria-label="Belum Komentar" className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          }
        />
      </div>

      {/* Search bar */}
      <div className="flex justify-end mb-2">
        <input
          type="text"
          placeholder="Cari nama, username tiktok, atau satfung/divisi"
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
              <th className="py-2 px-2">Username TikTok</th>
              <th className="py-2 px-2">Satfung/Divisi</th>
              <th className="py-2 px-2 text-center">Status</th>
              <th className="py-2 px-2 text-center">Jumlah Komentar</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((u, i) => {
              const sudahKomentar = totalTiktokPost === 0
                ? false
                : Number(u.jumlah_komentar) > 0 || isException(u.exception);

              return (
                <tr key={u.user_id || u.username_tiktok || i} className={sudahKomentar ? "bg-green-50" : "bg-red-50"}>
                  <td className="py-1 px-2">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-1 px-2">
                    {(u.title ? `${u.title} ` : "") + (u.nama || "-")}
                  </td>
                  <td className="py-1 px-2 font-mono text-pink-700">
                    {u.username_tiktok ? `@${u.username_tiktok}` : <span className="text-gray-400 italic">-</span>}
                  </td>
                  <td className="py-1 px-2">
                    <span className="inline-block px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                      {u.satfung || u.divisi || "-"}
                    </span>
                  </td>
                  <td className="py-1 px-2 text-center">
                    {sudahKomentar ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-500 text-white font-semibold">
                        <svg aria-label="Sudah Komentar" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Sudah
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500 text-white font-semibold">
                        <svg aria-label="Belum Komentar" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        Belum
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-2 text-center font-bold">
                    {isException(u.exception) ? maxJumlahKomentar : u.jumlah_komentar}
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-sm text-gray-600">
            Halaman <b>{page}</b> dari <b>{totalPages}</b>
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// Semua card mengikuti style TikTok Post Hari Ini (identik IG, tapi dengan warna dan icon TikTok)
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
