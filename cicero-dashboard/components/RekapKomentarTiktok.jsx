"use client";
import { cloneElement, useMemo, useEffect, useState } from "react";
import usePersistentState from "@/hooks/usePersistentState";
import { AlertTriangle, Music, User, Check, X, Minus, UserX } from "lucide-react";
import { showToast } from "@/utils/showToast";
import { cn } from "@/lib/utils";

function bersihkanSatfung(divisi = "") {
  return divisi
    .replace(/polsek\s*/i, "")
    .replace(/^[0-9.\-\s]+/, "")
    .trim();
}

const PAGE_SIZE = 25;

export default function RekapKomentarTiktok({
  users = [],
  totalTiktokPost = 0,
  showCopyButton = true,
}) {
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
  const validUserCount = Math.max(0, totalUser - totalTanpaUsername);

  const getPercentage = (value, base = validUserCount) => {
    const denominator = Number(base);
    if (!denominator) return undefined;
    const numerator = Number(value) || 0;
    return (numerator / denominator) * 100;
  };

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
        containerClass:
          "border border-fuchsia-500/30 bg-slate-950/60 text-slate-200 backdrop-blur",
        badgeClass:
          "bg-fuchsia-500/10 border border-fuchsia-400/40 text-fuchsia-200",
      }
    : showSearchEmptyState
    ? {
        badge: "HASIL PENCARIAN",
        message:
          trimmedSearch.length > 0
            ? `Hasil pencarian untuk “${trimmedSearch}” tidak ditemukan.`
            : "Tidak ada data yang cocok dengan filter saat ini.",
        description: "Coba ubah kata kunci atau atur ulang filter pencarian.",
        containerClass:
          "border border-cyan-500/30 bg-slate-950/60 text-slate-200 backdrop-blur",
        badgeClass:
          "bg-cyan-500/10 border border-cyan-400/40 text-cyan-200",
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
    <div className="relative mt-10 flex flex-col gap-10 pb-24">
      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          title="TikTok Post Aktif"
          value={totalTiktokPostCount}
          tone="fuchsia"
          icon={<Music className="h-6 w-6" />}
        />
        <SummaryCard
          title="Total Personel"
          value={totalUser}
          tone="slate"
          icon={<User className="h-6 w-6" />}
        />
        <SummaryCard
          title="Sudah Komentar"
          value={totalSudahKomentar}
          tone="emerald"
          icon={<Check className="h-6 w-6" />}
          percentage={getPercentage(totalSudahKomentar)}
        />
        <SummaryCard
          title="Kurang Komentar"
          value={totalKurangKomentar}
          tone="amber"
          icon={<AlertTriangle className="h-6 w-6" />}
          percentage={getPercentage(totalKurangKomentar)}
        />
        <SummaryCard
          title="Belum Komentar"
          value={totalBelumKomentar}
          tone="rose"
          icon={<X className="h-6 w-6" />}
          percentage={getPercentage(totalBelumKomentar)}
        />
        <SummaryCard
          title="Tanpa Username"
          value={totalTanpaUsername}
          tone="violet"
          icon={<UserX className="h-6 w-6" />}
          percentage={getPercentage(totalTanpaUsername, totalUser)}
        />
      </div>
      {tidakAdaPost && (
        <p className="text-xs text-slate-400 text-center md:text-right">
          Tidak ada posting aktif. Tidak diperlukan aksi komentar.
        </p>
      )}

      <div className="flex justify-end">
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
            className="w-full rounded-2xl border border-slate-800/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 shadow focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30 sm:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {tidakAdaPost && (
        <div className="rounded-3xl border border-slate-800/70 bg-slate-900/70 px-4 py-3 text-sm text-slate-300">
          Tidak ada posting TikTok yang perlu dikomentari hari ini. Tim kamu bisa
          beristirahat sejenak.
        </div>
      )}

      <div className="relative overflow-x-auto rounded-3xl border border-slate-800/70 bg-slate-900/60 shadow-[0_0_32px_rgba(15,118,110,0.2)]">
        <table className="w-full text-left text-sm text-slate-200">
          <thead className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur">
            <tr>
              <th className="py-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">No</th>
              <th className="py-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Satker</th>
              <th className="py-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Nama</th>
              <th className="py-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Username TikTok</th>
              <th className="py-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Divisi/Satfung</th>
              <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
                Status
              </th>
              <th className="py-3 px-3 text-center text-xs font-semibold uppercase tracking-widest text-slate-400">
                Jumlah Komentar
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 && emptyState ? (
              <tr>
                <td colSpan={7} className="py-10 px-4">
                  <div
                    className={`mx-auto flex max-w-xl flex-col items-center gap-3 rounded-3xl px-6 py-6 text-center text-sm shadow-inner ${emptyState.containerClass}`}
                  >
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] ${emptyState.badgeClass}`}
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
                const baseRowClass =
                  "border-b border-slate-800/60 transition duration-150 hover:bg-slate-800/60";
                const rowClass = tidakAdaPost
                  ? `bg-slate-900/60 ${baseRowClass}`
                  : sudahKomentar
                  ? `bg-emerald-500/10 ${baseRowClass}`
                  : `bg-rose-500/10 ${baseRowClass}`;
                const statusClass = tidakAdaPost
                  ? "inline-flex items-center gap-1 rounded-full border border-slate-600/70 bg-slate-800/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300"
                  : sudahKomentar
                  ? "inline-flex items-center gap-1 rounded-full border border-emerald-500/50 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200"
                  : "inline-flex items-center gap-1 rounded-full border border-rose-500/50 bg-rose-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-200";
                return (
                  <tr
                    key={u.user_id}
                    className={rowClass}
                  >
                    <td className="py-3 px-3 text-slate-400">{(page - 1) * PAGE_SIZE + i + 1}</td>
                    <td className="py-3 px-3">
                      {u.nama_client || u.client_name || u.client || u.client_id || "-"}
                    </td>
                    <td className="py-3 px-3">
                      {u.title ? `${u.title} ${u.nama}` : u.nama}
                    </td>
                    <td className="py-3 px-3 font-mono text-fuchsia-300">
                      {u.username}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
                        {bersihkanSatfung(u.divisi || "-")}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
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
                    <td className="py-3 px-3 text-center text-lg font-semibold text-slate-50">
                      {tidakAdaPost ? "-" : u.jumlah_komentar}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        Tabel ini merangkum status komentar TikTok setiap user dan total jumlah
        komentar yang diberikan.
      </p>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            className="rounded-full border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-cyan-400/60 hover:bg-cyan-500/10 disabled:opacity-40 disabled:hover:bg-slate-900/70"
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-sm text-slate-300">
            Halaman <b>{page}</b> dari <b>{totalPages}</b>
          </span>
          <button
            className="rounded-full border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-cyan-400/60 hover:bg-cyan-500/10 disabled:opacity-40 disabled:hover:bg-slate-900/70"
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      <div className="sticky bottom-6 z-20 flex w-full justify-end px-4">
        <div className="flex w-full max-w-xl flex-col gap-2 rounded-3xl border border-slate-700/60 bg-slate-900/80 p-4 shadow-[0_0_32px_rgba(217,70,239,0.25)] backdrop-blur-sm sm:flex-row sm:items-center">
          <button
            onClick={handleDownloadRekap}
            className="w-full rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/20 sm:w-auto"
          >
            Download Rekap
          </button>
          {showCopyButton && (
            <button
              onClick={handleCopyRekap}
              className="w-full rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-fuchsia-200 transition hover:border-fuchsia-300/60 hover:bg-fuchsia-500/20 sm:w-auto"
            >
              Salin Rekap
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, percentage, tone = "slate" }) {
  const palettes = {
    fuchsia: {
      icon: "text-fuchsia-300",
      border: "border-fuchsia-500/40",
      glow: "from-fuchsia-500/25 via-fuchsia-500/10 to-transparent",
      bar: "from-fuchsia-400 to-pink-500",
    },
    emerald: {
      icon: "text-emerald-300",
      border: "border-emerald-500/40",
      glow: "from-emerald-500/25 via-emerald-500/10 to-transparent",
      bar: "from-emerald-400 to-lime-400",
    },
    amber: {
      icon: "text-amber-200",
      border: "border-amber-400/40",
      glow: "from-amber-400/20 via-amber-500/10 to-transparent",
      bar: "from-amber-300 to-orange-400",
    },
    rose: {
      icon: "text-rose-300",
      border: "border-rose-500/40",
      glow: "from-rose-500/20 via-rose-500/10 to-transparent",
      bar: "from-rose-400 to-amber-400",
    },
    violet: {
      icon: "text-violet-300",
      border: "border-violet-500/40",
      glow: "from-violet-500/20 via-violet-500/10 to-transparent",
      bar: "from-violet-400 to-purple-500",
    },
    slate: {
      icon: "text-slate-300",
      border: "border-slate-500/40",
      glow: "from-slate-500/20 via-slate-500/10 to-transparent",
      bar: "from-slate-300 to-slate-400",
    },
  };
  const palette = palettes[tone] || palettes.slate;
  const formattedPercentage =
    typeof percentage === "number" && !Number.isNaN(percentage)
      ? `${percentage.toFixed(1).replace(".0", "")}%`
      : null;
  const clampedPercentage =
    typeof percentage === "number"
      ? Math.min(100, Math.max(0, percentage))
      : 0;
  const iconElement = icon
    ? cloneElement(icon, {
        className: cn("h-7 w-7", palette.icon, icon.props?.className),
      })
    : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/70 p-5 text-center shadow-[0_0_32px_rgba(30,64,175,0.25)]">
      <div
        className={cn(
          "pointer-events-none absolute inset-px rounded-[1.35rem] bg-gradient-to-br opacity-70 blur-2xl",
          palette.glow,
        )}
      />
      <div className="relative flex flex-col items-center gap-2">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border bg-slate-950/70",
            palette.border,
          )}
        >
          {iconElement}
        </div>
        <div className="text-3xl font-semibold text-slate-50">{value}</div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-400">
          {title}
        </div>
        {formattedPercentage && (
          <div className="mt-2 flex w-full max-w-[180px] flex-col items-center gap-2">
            <span className="text-[11px] font-medium text-slate-300">
              {formattedPercentage}
            </span>
            <div className="h-1.5 w-full rounded-full bg-slate-800/80">
              <div
                className={cn("h-full rounded-full bg-gradient-to-r", palette.bar)}
                style={{ width: `${clampedPercentage}%` }}
                role="progressbar"
                aria-valuenow={Math.round(Number(percentage) || 0)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${title} ${formattedPercentage}`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
