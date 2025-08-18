"use client";
import { useMemo, useState, useEffect } from "react";
import { Link as LinkIcon, Users, Check, X } from "lucide-react";

function bersihkanSatfung(divisi = "") {
  return divisi.replace(/polsek\s*/i, "").replace(/^[0-9.\-\s]+/, "").trim();
}

const PAGE_SIZE = 25;

export default function RekapAmplifikasi({ users = [] }) {
  const totalUser = users.length;
  const totalSudahPost = users.filter((u) => Number(u.jumlah_link) > 0).length;
  const totalBelumPost = totalUser - totalSudahPost;
  const totalLink = users.reduce(
    (sum, u) => sum + Number(u.jumlah_link || 0),
    0,
  );

  const hasClient = useMemo(
    () => users.some((u) => u.nama_client || u.client_name || u.client),
    [users],
  );

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter((u) =>
      (u.nama || "").toLowerCase().includes(term) ||
      (u.username || "").toLowerCase().includes(term) ||
      bersihkanSatfung(u.divisi || "").toLowerCase().includes(term) ||
      (u.nama_client || u.client_name || u.client || "")
        .toLowerCase()
        .includes(term),
    );
  }, [users, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aLink = Number(a.jumlah_link);
      const bLink = Number(b.jumlah_link);
      if (aLink > 0 && bLink === 0) return -1;
      if (aLink === 0 && bLink > 0) return 1;
      if (aLink !== bLink) return bLink - aLink;
      return (a.nama || "").localeCompare(b.nama || "");
    });
  }, [filtered]);

  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  useEffect(() => setPage(1), [search]);

  return (
    <div className="flex flex-col gap-6 mt-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Link Amplifikasi"
          value={totalLink}
          color="bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-400 text-white"
          icon={<LinkIcon />}
        />
        <SummaryCard
          title="Total User"
          value={totalUser}
          color="bg-gradient-to-r from-blue-400 via-blue-500 to-sky-400 text-white"
          icon={<Users />}
        />
        <SummaryCard
          title="Sudah Post"
          value={totalSudahPost}
          color="bg-gradient-to-r from-green-400 via-green-500 to-lime-400 text-white"
          icon={<Check />}
        />
        <SummaryCard
          title="Belum Post"
          value={totalBelumPost}
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
          className="px-3 py-2 border rounded-lg text-sm w-64 shadow focus:outline-none focus:ring-2 focus:ring-indigo-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="relative overflow-x-auto rounded-xl shadow">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="py-2 px-2">No</th>
              <th className="py-2 px-2">Client</th>
              <th className="py-2 px-2">Nama</th>
              <th className="py-2 px-2">Username IG</th>
              <th className="py-2 px-2">Divisi/Satfung</th>
              <th className="py-2 px-2 text-center">Status</th>
              <th className="py-2 px-2 text-center">Jumlah Link</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((u, i) => {
              const sudahPost = Number(u.jumlah_link) > 0;
              return (
                <tr
                  key={u.user_id}
                  className={sudahPost ? "bg-green-50" : "bg-red-50"}
                >
                  <td className="py-1 px-2">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="py-1 px-2">
                    {u.nama_client || u.client_name || u.client || "-"}
                  </td>
                  <td className="py-1 px-2">
                    {u.title ? `${u.title} ${u.nama}` : u.nama}
                  </td>
                  <td className="py-1 px-2 font-mono text-indigo-700">@
                    {u.username}
                  </td>
                  <td className="py-1 px-2">
                    <span className="inline-block px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                      {bersihkanSatfung(u.divisi || "-")}
                    </span>
                  </td>
                  <td className="py-1 px-2 text-center">
                    {sudahPost ? (
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
                  <td className="py-1 px-2 text-center font-bold">{u.jumlah_link}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-gray-500 italic">
        Tabel ini menampilkan status posting link amplifikasi untuk setiap user
        beserta total link yang dibagikan.
      </p>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Sebelumnya
          </button>
          <span className="text-sm text-gray-600">
            Halaman {page} dari {totalPages}
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Berikutnya
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, color, icon }) {
  return (
    <div className={`flex flex-col p-4 rounded-lg shadow ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        {icon}
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  );
}

