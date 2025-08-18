"use client";
import { useMemo, useState, useEffect } from "react";
import { Camera, Users, Check, X } from "lucide-react";

// Utility: handle boolean/string/number for exception
function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

const PAGE_SIZE = 25;

/**
 * Komponen RekapLikesIG
 * @param {Array} users - array user rekap likes IG (sudah HARUS hasil filter/fetch periode yg benar dari parent)
 * @param {number} totalIGPost - jumlah IG Post hari ini (atau sesuai periode, dari parent)
 */
export default function RekapLikesIG({ users = [], totalIGPost = 0 }) {
  const totalUser = users.length;
  const hasClient = useMemo(
    () => users.some((u) => u.nama_client || u.client_name || u.client),
    [users],
  );

  // === LOGIC: Semua user exception (true/false) dianggap belum jika IG post = 0 ===
  const totalSudahLike = totalIGPost === 0
    ? 0
    : users.filter(u =>
        Number(u.jumlah_like) >= totalIGPost*0.5 || isException(u.exception)
      ).length;
  const totalBelumLike = totalIGPost === 0
    ? totalUser
    : users.filter(u =>
        Number(u.jumlah_like) < totalIGPost*0.5 && !isException(u.exception)
      ).length;

  // Hitung nilai jumlah_like tertinggi (max) di seluruh user
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
      users.filter((u) => {
        const term = search.toLowerCase();
        return (
          (u.nama || "").toLowerCase().includes(term) ||
          (u.username || "").toLowerCase().includes(term) ||
          (u.divisi || "").toLowerCase().includes(term) ||
          (u.nama_client || u.client_name || u.client || "").toLowerCase().includes(term)
        );
      }),
    [users, search],
  );

  // Sorting
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aException = isException(a.exception);
      const bException = isException(b.exception);

      const aLike = Number(a.jumlah_like);
      const bLike = Number(b.jumlah_like);

      // 1. User sudah like (bukan exception) DAN jumlah_like == max → paling atas
      if (!aException && aLike === maxJumlahLike && (bException || bLike < maxJumlahLike)) return -1;
      if (!bException && bLike === maxJumlahLike && (aException || aLike < maxJumlahLike)) return 1;

      // 2. User exception, jumlah_like == max → tepat di bawah user sudah like max
      if (aException && bException) return 0;
      if (aException && !bException && bLike === maxJumlahLike) return 1;
      if (!aException && bException && aLike === maxJumlahLike) return -1;

      // 3. User sudah like (non-exception) dengan jumlah_like < max → berikutnya
      if (!aException && !bException) {
        if (aLike > 0 && bLike === 0) return -1;
        if (aLike === 0 && bLike > 0) return 1;
        // Di dalam kelompok, urut jumlah_like desc, lalu nama
        if (aLike !== bLike) return bLike - aLike;
        return (a.nama || "").localeCompare(b.nama || "");
      }

      // 4. User exception vs user belum like
      if (aException && !bException) return -1;
      if (!aException && bException) return 1;

      // 5. Sisa: belum like, urut nama
      return (a.nama || "").localeCompare(b.nama || "");
    });
  }, [filtered, maxJumlahLike]);

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
          title="IG Post Hari Ini"
          value={totalIGPost}
          color="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-blue-400 text-white"
          icon={<Camera />}
        />
        <SummaryCard
          title="Total User"
          value={totalUser}
          color="bg-gradient-to-r from-blue-400 via-blue-500 to-sky-400 text-white"
          icon={<Users />}
        />
        <SummaryCard
          title="Sudah Like"
          value={totalSudahLike}
          color="bg-gradient-to-r from-green-400 via-green-500 to-lime-400 text-white"
          icon={<Check />}
        />
        <SummaryCard
          title="Belum Like"
          value={totalBelumLike}
          color="bg-gradient-to-r from-red-400 via-pink-500 to-yellow-400 text-white"
          icon={<X />}
        />
      </div>

      {/* Search bar */}
      <div className="flex justify-end mb-2">
        <input
          type="text"
          placeholder="Cari nama, username, divisi, atau client"
          className="px-3 py-2 border rounded-lg text-sm w-64 shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabel */}
      <div className="relative overflow-x-auto rounded-xl shadow">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="py-2 px-2">No</th>
              {hasClient && <th className="py-2 px-2">Client</th>}
              <th className="py-2 px-2">Nama</th>
              <th className="py-2 px-2">Username IG</th>
              <th className="py-2 px-2">Divisi/Satfung</th>
              <th className="py-2 px-2 text-center">Status</th>
              <th className="py-2 px-2 text-center">Jumlah Like</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((u, i) => {
              // LOGIC: semua user dianggap belum jika IG Post = 0
              const sudahLike = totalIGPost === 0
                ? false
                : Number(u.jumlah_like) >= totalIGPost*0.5 || isException(u.exception);

              return (
                <tr key={u.user_id} className={sudahLike ? "bg-green-50" : "bg-red-50"}>
                  <td className="py-1 px-2">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  {hasClient && (
                    <td className="py-1 px-2">
                      {u.nama_client || u.client_name || u.client || "-"}
                    </td>
                  )}
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
                        <Check className="w-3 h-3" />
                        Sudah
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500 text-white font-semibold">
                        <X className="w-3 h-3" />
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
      <p className="mt-2 text-sm text-gray-500 italic">
        Tabel ini menampilkan status like Instagram setiap user serta jumlah
        like yang berhasil dihimpun.
      </p>

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

// Semua card mengikuti style IG Post Hari Ini
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
