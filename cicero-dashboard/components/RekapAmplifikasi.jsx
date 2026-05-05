"use client";

import { useMemo, useEffect } from "react";
import usePersistentState from "@/hooks/usePersistentState";
import { Download } from "lucide-react";
import { showToast } from "@/utils/showToast";

const PAGE_SIZE = 20;

function safeText(value) {
  const text = String(value ?? "").trim();
  return text || "-";
}

function cleanSatfung(divisi = "") {
  const cleaned = String(divisi || "")
    .replace(/polsek\s*/i, "")
    .replace(/^[0-9.\-\s]+/, "")
    .trim();
  return cleaned || "-";
}

function firstAvailableLink(user) {
  const candidates = [
    user.instagram_link,
    user.instagramLink,
    user.link_instagram,
    user.facebook_link,
    user.twitter_link,
    user.tiktok_link,
    user.youtube_link,
  ];
  return candidates.find((entry) => String(entry || "").trim()) || "-";
}

function mapExcelRows(rows) {
  return rows.map((u, index) => ({
    no: index + 1,
    client_id: safeText(u.client_id),
    client: safeText(u.nama_client || u.client_name || u.client),
    user_id: safeText(u.user_id),
    nama: safeText(u.title ? `${u.title} ${u.nama || ""}` : u.nama),
    username_instagram: safeText(u.username ? `@${u.username}` : ""),
    divisi_satfung: cleanSatfung(u.divisi),
    status_pelaksanaan: Number(u.jumlah_link || 0) > 0 ? "Sudah" : "Belum",
    jumlah_link: Number(u.jumlah_link || 0),
    link_pelaksanaan: safeText(firstAvailableLink(u)),
    instagram_link: safeText(u.instagram_link || u.instagramLink || u.link_instagram),
    facebook_link: safeText(u.facebook_link),
    twitter_link: safeText(u.twitter_link),
    tiktok_link: safeText(u.tiktok_link),
    youtube_link: safeText(u.youtube_link),
  }));
}

export default function RekapAmplifikasi({ users = [], fileNamePrefix = "rekap-amplify" }) {
  const [search, setSearch] = usePersistentState("rekapAmplifikasi_search", "");
  const [page, setPage] = usePersistentState("rekapAmplifikasi_page", 1);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return users;
    return users.filter((u) =>
      [
        u.nama,
        u.title,
        u.username,
        u.divisi,
        u.client_id,
        u.nama_client,
        u.client_name,
        u.client,
        firstAvailableLink(u),
      ]
        .map((entry) => String(entry || "").toLowerCase())
        .some((entry) => entry.includes(term)),
    );
  }, [users, search]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const byLink = Number(b.jumlah_link || 0) - Number(a.jumlah_link || 0);
        if (byLink !== 0) return byLink;
        return String(a.nama || "").localeCompare(String(b.nama || ""));
      }),
    [filtered],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, setPage]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages, setPage]);

  const exportExcel = async () => {
    try {
      const rows = mapExcelRows(sorted);
      if (!rows.length) {
        showToast("Data kosong, tidak ada yang bisa diexport.", "error");
        return;
      }
      const response = await fetch("/api/download-amplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows,
          fileName: `${fileNamePrefix}-${new Date().toISOString().slice(0, 10)}`,
        }),
      });
      if (!response.ok) throw new Error("Gagal membuat file Excel");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileNamePrefix}-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      showToast("Export Excel berhasil.", "success");
    } catch (error) {
      showToast(error?.message || "Gagal export Excel", "error");
    }
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="text"
          placeholder="Cari nama, satfung, client, username, atau link"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          onClick={exportExcel}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
        >
          <Download className="h-4 w-4" /> Export Excel
        </button>
      </div>

      <div className="space-y-2 md:hidden">
        {currentRows.map((u, idx) => (
          <div key={`${u.user_id}-${idx}`} className="rounded-lg border p-3 text-sm">
            <div className="font-semibold">{safeText(u.title ? `${u.title} ${u.nama || ""}` : u.nama)}</div>
            <div>Client: {safeText(u.nama_client || u.client_name || u.client || u.client_id)}</div>
            <div>Satfung: {cleanSatfung(u.divisi)}</div>
            <div>Username: {safeText(u.username ? `@${u.username}` : "")}</div>
            <div>Status: {Number(u.jumlah_link || 0) > 0 ? "Sudah" : "Belum"}</div>
            <div>Jumlah Link: {Number(u.jumlah_link || 0)}</div>
            <div className="break-all">Link: {safeText(firstAvailableLink(u))}</div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left">No</th>
              <th className="px-3 py-2 text-left">Client</th>
              <th className="px-3 py-2 text-left">Nama</th>
              <th className="px-3 py-2 text-left">Username</th>
              <th className="px-3 py-2 text-left">Satfung</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Jumlah Link</th>
              <th className="px-3 py-2 text-left">Link Pelaksanaan</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((u, i) => (
              <tr key={`${u.user_id}-${i}`} className="border-t align-top">
                <td className="px-3 py-2">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-3 py-2">{safeText(u.nama_client || u.client_name || u.client || u.client_id)}</td>
                <td className="px-3 py-2">{safeText(u.title ? `${u.title} ${u.nama || ""}` : u.nama)}</td>
                <td className="px-3 py-2">{safeText(u.username ? `@${u.username}` : "")}</td>
                <td className="px-3 py-2">{cleanSatfung(u.divisi)}</td>
                <td className="px-3 py-2">{Number(u.jumlah_link || 0) > 0 ? "Sudah" : "Belum"}</td>
                <td className="px-3 py-2">{Number(u.jumlah_link || 0)}</td>
                <td className="px-3 py-2 break-all">{safeText(firstAvailableLink(u))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          Sebelumnya
        </button>
        <span>
          Halaman {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}
