"use client";
import { useMemo, useState, useEffect } from "react";
import { Music, Users, Check, X } from "lucide-react";

function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

function bersihkanSatfung(divisi = "") {
  return divisi
    .replace(/polsek\s*/i, "")
    .replace(/^[0-9.\-\s]+/, "")
    .trim();
}

const PAGE_SIZE = 25;

export default function RekapKomentarTiktok({ users = [], totalTiktokPost = 0 }) {
  const totalUser = users.length;
  const totalSudahKomentar = totalTiktokPost === 0
    ? 0
    : users.filter(u => Number(u.jumlah_komentar) > 0 || isException(u.exception)).length;
  const totalBelumKomentar = totalUser - totalSudahKomentar;

  const hasClient = useMemo(
    () => users.some(u => u.nama_client || u.client_name || u.client),
    [users]
  );

  const maxJumlahKomentar = useMemo(
    () =>
      Math.max(
        0,
        ...users
          .filter(u => !isException(u.exception))
          .map(u => parseInt(u.jumlah_komentar || 0, 10))
      ),
    [users]
  );

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.nama || "").toLowerCase().includes(term) ||
        (u.username || "").toLowerCase().includes(term) ||
        bersihkanSatfung(u.divisi || "").toLowerCase().includes(term) ||
        (u.nama_client || u.client_name || u.client || "")
          .toLowerCase()
          .includes(term)
    );
  }, [users, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aExc = isException(a.exception);
      const bExc = isException(b.exception);
      const aCom = Number(a.jumlah_komentar);
      const bCom = Number(b.jumlah_komentar);

      if (!aExc && aCom === maxJumlahKomentar && (bExc || bCom < maxJumlahKomentar)) return -1;
      if (!bExc && bCom === maxJumlahKomentar && (aExc || aCom < maxJumlahKomentar)) return 1;

      if (aExc && bExc) return 0;
      if (aExc && !bExc && bCom === maxJumlahKomentar) return 1;
      if (!aExc && bExc && aCom === maxJumlahKomentar) return -1;

      if (!aExc && !bExc) {
        if (aCom > 0 && bCom === 0) return -1;
        if (aCom === 0 && bCom > 0) return 1;
        if (aCom !== bCom) return bCom - aCom;
        return (a.nama || "").localeCompare(b.nama || "");
      }

      if (aExc && !bExc) return -1;
      if (!aExc && bExc) return 1;
      return (a.nama || "").localeCompare(b.nama || "");
    });
  }, [filtered, maxJumlahKomentar]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [search]);

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="TikTok Post Hari Ini"
          value={totalTiktokPost}
          color="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-blue-400 text-white"
          icon={<Music />}
        />
        <SummaryCard
          title="Total User"
          value={totalUser}
          color="bg-gradient-to-r from-blue-400 via-blue-500 to-sky-400 text-white"
          icon={<Users />}
        />
        <SummaryCard
          title="Sudah Komentar"
          value={totalSudahKomentar}
          color="bg-gradient-to-r from-green-400 via-green-500 to-lime-400 text-white"
          icon={<Check />}
        />
        <SummaryCard
          title="Belum Komentar"
          value={totalBelumKomentar}
          color="bg-gradient-to-r from-red-400 via-pink-500 to-yellow-400 text-white"
          icon={<X />}
        />
      </div>

      <div className="flex justify-end mb-2">
        <input
          type="text"
          placeholder={
            hasClient
              ? "Cari nama, username, divisi, atau client"
              : "Cari nama, username, atau divisi"
          }
          className="px-3 py-2 border rounded-lg text-sm w-64 shadow focus:outline-none focus:ring-2 focus:ring-pink-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="relative overflow-x-auto rounded-xl shadow">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="py-2 px-2">No</th>
              {hasClient && <th className="py-2 px-2">Client</th>}
              <th className="py-2 px-2">Nama</th>
              <th className="py-2 px-2">Username TikTok</th>
              <th className="py-2 px-2">Divisi/Satfung</th>
              <th className="py-2 px-2 text-center">Status</th>
              <th className="py-2 px-2 text-center">Jumlah Komentar</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((u, i) => {
              const sudahKomentar =
                totalTiktokPost === 0
                  ? false
                  : Number(u.jumlah_komentar) > 0 || isException(u.exception);
              return (
                <tr
                  key={u.user_id}
                  className={sudahKomentar ? "bg-green-50" : "bg-red-50"}
                >
                  <td className="py-1 px-2">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  {hasClient && (
                    <td className="py-1 px-2">
                      {u.nama_client || u.client_name || u.client || "-"}
                    </td>
                  )}
                  <td className="py-1 px-2">
                    {u.title ? `${u.title} ${u.nama}` : u.nama}
                  </td>
                  <td className="py-1 px-2 font-mono text-pink-700">{u.username}</td>
                  <td className="py-1 px-2">
                    <span className="inline-block px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                      {bersihkanSatfung(u.divisi || "-")}
                    </span>
                  </td>
                  <td className="py-1 px-2 text-center">
                    {sudahKomentar ? (
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
                    {isException(u.exception) ? maxJumlahKomentar : u.jumlah_komentar}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-gray-500 italic">
        Tabel ini merangkum status komentar TikTok setiap user dan total jumlah
        komentar yang diberikan.
      </p>

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
