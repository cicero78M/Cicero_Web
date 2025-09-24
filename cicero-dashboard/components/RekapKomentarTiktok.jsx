"use client";
import { useMemo, useEffect, useState } from "react";
import usePersistentState from "@/hooks/usePersistentState";
import { AlertTriangle, Music, User, Check, X, Minus, UserX } from "lucide-react";
import { showToast } from "@/utils/showToast";

function bersihkanSatfung(divisi = "") {
  return divisi
    .replace(/polsek\s*/i, "")
    .replace(/^[0-9.\-\s]+/, "")
    .trim();
}

const PAGE_SIZE = 25;

export default function RekapKomentarTiktok({ users = [], totalTiktokPost = 0 }) {
  const totalTiktokPostCount = Number(totalTiktokPost) || 0;
  const summary = useMemo(() => {
    const totalUser = users.length;
    let totalSudahKomentar = 0;
    let totalKurangKomentar = 0;
    let totalBelumKomentar = 0;
    let totalTanpaUsername = 0;

    users.forEach((user) => {
      const username = String(user.username || "").trim();
      if (!username) {
        totalTanpaUsername += 1;
        return;
      }

      const jumlahKomentar = Number(user.jumlah_komentar) || 0;

      if (totalTiktokPostCount === 0) {
        totalBelumKomentar += 1;
        return;
      }

      if (jumlahKomentar >= totalTiktokPostCount * 0.5) {
        totalSudahKomentar += 1;
      } else if (jumlahKomentar > 0) {
        totalKurangKomentar += 1;
      } else {
        totalBelumKomentar += 1;
      }
    });

    return {
      totalUser,
      totalSudahKomentar,
      totalKurangKomentar,
      totalBelumKomentar,
      totalTanpaUsername,
    };
  }, [users, totalTiktokPostCount]);

  const {
    totalUser,
    totalSudahKomentar,
    totalKurangKomentar,
    totalBelumKomentar,
    totalTanpaUsername,
  } = summary;
  const tidakAdaPost = totalTiktokPostCount === 0;

  const hasSatker = useMemo(
    () =>
      users.some(
        (u) => u.nama_client || u.client_name || u.client || u.client_id,
      ),
    [users],
  );


  const [search, setSearch] = useState("");
  const searchInputId = "rekap-komentar-tiktok-search";
  const searchHelpId = "rekap-komentar-tiktok-search-help";
  const searchDescription = hasSatker
    ? "Pencarian mencakup nama, username, divisi, atau satker."
    : "Pencarian mencakup nama, username, atau divisi.";
  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.nama || "").toLowerCase().includes(term) ||
        (u.username || "").toLowerCase().includes(term) ||
        bersihkanSatfung(u.divisi || "").toLowerCase().includes(term) ||
        String(u.nama_client || u.client_name || u.client || u.client_id || "")
          .toLowerCase()
          .includes(term)
    );
  }, [users, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aCom = Number(a.jumlah_komentar);
      const bCom = Number(b.jumlah_komentar);

      if (aCom > 0 && bCom === 0) return -1;
      if (aCom === 0 && bCom > 0) return 1;
      if (aCom !== bCom) return bCom - aCom;
      return (a.nama || "").localeCompare(b.nama || "");
    });
  }, [filtered]);

  const [page, setPage] = usePersistentState("rekapKomentarTiktok_page", 1);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const trimmedSearch = search.trim();
  const isInitialDataEmpty = totalUser === 0;
  const showSearchEmptyState = !isInitialDataEmpty && filtered.length === 0;
  const emptyState = isInitialDataEmpty
    ? {
        badge: "DATA SUMBER",
        message: "Tidak ada data komentar TikTok yang tersedia untuk periode ini.",
        description:
          "Silakan cek kembali periode laporan atau pastikan sumber data sudah terhubung.",
        containerClass: "bg-amber-50 border border-amber-200 text-amber-700",
        badgeClass: "bg-amber-500/20 border border-amber-400/60 text-amber-700",
      }
    : showSearchEmptyState
    ? {
        badge: "HASIL PENCARIAN",
        message:
          trimmedSearch.length > 0
            ? `Hasil pencarian untuk “${trimmedSearch}” tidak ditemukan.`
            : "Tidak ada data yang cocok dengan filter saat ini.",
        description: "Coba ubah kata kunci atau atur ulang filter pencarian.",
        containerClass: "bg-indigo-50 border border-indigo-200 text-indigo-700",
        badgeClass: "bg-indigo-500/10 border border-indigo-400/50 text-indigo-700",
      }
    : null;
  useEffect(() => setPage(1), [search, setPage]);
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages || 1);
    }
  }, [page, totalPages, setPage]);

  function copyToClipboardFallback(text) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "absolute";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  }

  function handleCopyRekap() {
    const now = new Date();
    const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;

    const satkerMap = {};
    users.forEach((u) => {
      const client = (
        u.nama_client ||
        u.client_name ||
        u.client ||
        bersihkanSatfung(u.divisi || "LAINNYA") ||
        "LAINNYA"
      )
        .toString()
        .toUpperCase();
      if (!satkerMap[client]) {
        satkerMap[client] = {
          total: 0,
          sudah: 0,
          kurang: 0,
          belum: 0,
          tanpaUsername: 0,
        };
      }
      satkerMap[client].total += 1;
      const username = String(u.username || "").trim();
      if (!username) {
        satkerMap[client].tanpaUsername += 1;
        return;
      }
      const jumlahKomentar = Number(u.jumlah_komentar) || 0;
      if (totalTiktokPostCount === 0) {
        satkerMap[client].belum += 1;
      } else if (jumlahKomentar >= totalTiktokPostCount * 0.5) {
        satkerMap[client].sudah += 1;
      } else if (jumlahKomentar > 0) {
        satkerMap[client].kurang += 1;
      } else {
        satkerMap[client].belum += 1;
      }
    });

    const lines = [
      `Rekap Komentar TikTok (${tanggal})`,
      `Jumlah TikTok Post: ${totalTiktokPostCount}`,
      `Total User: ${totalUser}`,
      `Sudah Komentar: ${totalSudahKomentar}`,
      `Kurang Komentar: ${totalKurangKomentar}`,
      `Belum Komentar: ${totalBelumKomentar}`,
      `Tanpa Username TikTok: ${totalTanpaUsername}`,
      "",
      "Rekap per Satker:",
    ];

    Object.entries(satkerMap)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([name, data]) => {
        lines.push(
          `${name} (${data.total}): ✅ ${data.sudah}, ⚠️ ${data.kurang}, ❌ ${data.belum}, ⁉️ ${data.tanpaUsername}`,
        );
      });

    const message = lines.join("\n");
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(message)
        .then(() => {
          showToast("Rekap disalin ke clipboard", "success");
        })
        .catch(() => {
          const fallbackSuccess = copyToClipboardFallback(message);
          if (fallbackSuccess) {
            showToast("Rekap disalin ke clipboard", "success");
          } else {
            showToast(message, "info");
          }
        });
    } else {
      const fallbackSuccess = copyToClipboardFallback(message);
      if (fallbackSuccess) {
        showToast("Rekap disalin ke clipboard", "success");
      } else {
        showToast(message, "info");
      }
    }
  }

  function handleDownloadRekap() {
    const clients = {};
    users.forEach((u) => {
      const clientName =
        u.nama_client ||
        u.client_name ||
        u.client ||
        bersihkanSatfung(u.divisi || "Lainnya") ||
        "Lainnya";
      if (!clients[clientName]) {
        clients[clientName] = {
          Sudah: [],
          Kurang: [],
          Belum: [],
          UsernameKosong: [],
        };
      }
      const username = String(u.username || "").trim();
      if (!username) {
        clients[clientName].UsernameKosong.push(u);
        return;
      }
      const jumlahKomentar = Number(u.jumlah_komentar) || 0;
      let status = "Belum";
      if (totalTiktokPostCount !== 0) {
        if (jumlahKomentar >= totalTiktokPostCount * 0.5) {
          status = "Sudah";
        } else if (jumlahKomentar > 0) {
          status = "Kurang";
        }
      }
      clients[clientName][status].push(u);
    });

    const sortByName = (arr) =>
      [...arr].sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));

    const sortedClients = Object.keys(clients).sort((a, b) => {
      if (a === "Direktorat Binmas") return -1;
      if (b === "Direktorat Binmas") return 1;
      return a.localeCompare(b);
    });

    const now = new Date();
    const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
    const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const tanggalFile = `${String(now.getDate()).padStart(2, "0")}_${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}_${now.getFullYear()}`;
    const jam = now.toLocaleTimeString("id-ID", { hour12: false });

    const lines = [
      "Mohon ijin Komandan,",
      "",
      "📋 Rekap Akumulasi Komentar TikTok",
      `${hari}, ${tanggal}`,
      `Jam: ${jam}`,
      "",
      `Jumlah Konten TikTok: ${totalTiktokPostCount}`,
      `Jumlah Total Personil : ${totalUser} pers`,
      `Sudah melaksanakan : ${totalSudahKomentar} pers`,
      `Melaksanakan kurang lengkap : ${totalKurangKomentar} pers`,
      `Belum melaksanakan : ${totalBelumKomentar} pers`,
      `Belum Update Username TikTok : ${totalTanpaUsername} pers`,
      "",
    ];

    if (tidakAdaPost) {
      lines.push("Catatan: Tidak ada posting TikTok pada periode ini.");
      lines.push("");
    }

    sortedClients.forEach((client) => {
      const { Sudah, Kurang, Belum, UsernameKosong } = clients[client];
      lines.push(
        `${client.toUpperCase()} : ${Sudah.length}/${Kurang.length}/${Belum.length}/${UsernameKosong.length}`,
      );
      lines.push(`Sudah : ${Sudah.length}`);
      sortByName(Sudah).forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        const divisi = bersihkanSatfung(u.divisi || "-");
        lines.push(`- ${name}${divisi ? ` (${divisi})` : ""}, ${u.jumlah_komentar} komentar`);
      });
      lines.push(`Kurang : ${Kurang.length}`);
      sortByName(Kurang).forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        const divisi = bersihkanSatfung(u.divisi || "-");
        lines.push(`- ${name}${divisi ? ` (${divisi})` : ""}, ${u.jumlah_komentar} komentar`);
      });
      lines.push(`Belum : ${Belum.length}`);
      sortByName(Belum).forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        const username = String(u.username || "-").trim() || "-";
        const divisi = bersihkanSatfung(u.divisi || "-");
        lines.push(`- ${name}${divisi ? ` (${divisi})` : ""}, ${username}`);
      });
      lines.push(`Username Kosong : ${UsernameKosong.length}`);
      sortByName(UsernameKosong).forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        const divisi = bersihkanSatfung(u.divisi || "-");
        lines.push(`- ${name}${divisi ? ` (${divisi})` : ""}`);
      });
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rekap_Komentar_TikTok_${hari}_${tanggalFile}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast("File rekap berhasil diunduh", "success");
  }

  return (
    <div className="flex flex-col gap-6 mt-8 min-h-screen pb-24">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <SummaryCard
          title="TikTok Post Hari Ini"
          value={totalTiktokPostCount}
          color="bg-gradient-to-r from-pink-400 via-fuchsia-400 to-blue-400 text-white"
          icon={<Music className="h-7 w-7" />}
        />
        <SummaryCard
          title="Total User"
          value={totalUser}
          color="bg-gradient-to-r from-blue-400 via-blue-500 to-sky-400 text-white"
          icon={<User className="h-7 w-7" />}
        />
        <SummaryCard
          title="Sudah Komentar"
          value={totalSudahKomentar}
          color="bg-gradient-to-r from-green-400 via-green-500 to-lime-400 text-white"
          icon={<Check className="h-7 w-7" />}
        />
        <SummaryCard
          title="Kurang Komentar"
          value={totalKurangKomentar}
          color="bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white"
          icon={<AlertTriangle className="h-7 w-7" />}
        />
        <SummaryCard
          title="Belum Komentar"
          value={totalBelumKomentar}
          color="bg-gradient-to-r from-red-400 via-pink-500 to-yellow-400 text-white"
          icon={<X className="h-7 w-7" />}
        />
        <SummaryCard
          title="Tanpa Username"
          value={totalTanpaUsername}
          color="bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-gray-800"
          icon={<UserX className="h-7 w-7" />}
        />
      </div>
      {tidakAdaPost && (
        <p className="text-xs text-gray-500 italic text-center md:text-right">
          Tidak ada posting aktif. Tidak diperlukan aksi komentar.
        </p>
      )}

      <div className="flex justify-end mb-2">
        <div className="flex flex-col items-end">
          <label htmlFor={searchInputId} className="sr-only">
            Cari komentar TikTok
          </label>
          <p id={searchHelpId} className="sr-only">
            {searchDescription}
          </p>
          <input
            id={searchInputId}
            type="text"
            placeholder={
              hasSatker
                ? "Cari nama, username, divisi, atau satker"
                : "Cari nama, username, atau divisi"
            }
            aria-describedby={searchHelpId}
            className="px-3 py-2 border rounded-lg text-sm w-64 shadow focus:outline-none focus:ring-2 focus:ring-pink-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {tidakAdaPost && (
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          Tidak ada posting TikTok yang perlu dikomentari hari ini. Tim kamu bisa
          beristirahat sejenak.
        </div>
      )}

      <div className="relative overflow-x-auto rounded-xl shadow">
        <table className="w-full text-sm text-left">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr>
              <th className="py-2 px-2">No</th>
              <th className="py-2 px-2">Satker</th>
              <th className="py-2 px-2">Nama</th>
              <th className="py-2 px-2">Username tiktok</th>
              <th className="py-2 px-2">Divisi/Satfung</th>
              <th className="py-2 px-2 text-center">Status</th>
              <th className="py-2 px-2 text-center">Jumlah Komentar</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 && emptyState ? (
              <tr>
                <td colSpan={7} className="py-10 px-4">
                  <div
                    className={`mx-auto flex max-w-xl flex-col items-center gap-3 rounded-2xl px-6 py-6 text-center text-sm shadow-inner ${emptyState.containerClass}`}
                  >
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${emptyState.badgeClass}`}
                    >
                      {emptyState.badge}
                    </span>
                    <p className="text-base font-semibold">{emptyState.message}</p>
                    <p className="text-xs font-medium opacity-80">
                      {emptyState.description}
                    </p>
                  </div>
                </td>
              </tr>
            ) : currentRows.map((u, i) => {
                const sudahKomentar =
                  tidakAdaPost ? false : Number(u.jumlah_komentar) > 0;
                const rowClass = tidakAdaPost
                  ? "bg-gray-50"
                  : sudahKomentar
                  ? "bg-green-50"
                  : "bg-red-50";
                const statusClass = tidakAdaPost
                  ? "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-400 text-white font-semibold"
                  : sudahKomentar
                  ? "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-500 text-white font-semibold"
                  : "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500 text-white font-semibold";
                return (
                  <tr
                    key={u.user_id}
                    className={rowClass}
                  >
                    <td className="py-1 px-2">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="py-1 px-2">
                      {u.nama_client || u.client_name || u.client || u.client_id || "-"}
                    </td>
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
                      <span className={statusClass}>
                        {tidakAdaPost ? (
                          <>
                            <Minus className="w-3 h-3" />
                            Tidak ada posting hari ini
                          </>
                        ) : sudahKomentar ? (
                          <>
                            <Check className="w-3 h-3" />
                            Sudah
                          </>
                        ) : (
                          <>
                            <X className="w-3 h-3" />
                            Belum
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-center font-bold">
                      {tidakAdaPost ? "-" : u.jumlah_komentar}
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

      <div className="sticky bottom-4 z-20 flex w-full justify-end px-4">
        <div className="flex w-full max-w-xl flex-col gap-2 rounded-2xl border border-pink-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center">
          <button
            onClick={handleDownloadRekap}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow sm:w-auto"
          >
            Download Rekap
          </button>
          <button
            onClick={handleCopyRekap}
            className="w-full px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg shadow sm:w-auto"
          >
            Salin Rekap
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, color, icon }) {
  return (
    <div
      className={`rounded-2xl shadow-md p-6 flex flex-col items-center gap-2 text-center ${color}`}
    >
      <div className="flex items-center gap-2 text-3xl font-bold">
        {icon}
        <span>{value}</span>
      </div>
      <div className="text-xs mt-1 text-white font-semibold uppercase tracking-wider">
        {title}
      </div>
    </div>
  );
}
