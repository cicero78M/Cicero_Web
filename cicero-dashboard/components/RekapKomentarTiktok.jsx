"use client";
import { cloneElement, useMemo, useEffect, useState } from "react";
import usePersistentState from "@/hooks/usePersistentState";
import { AlertTriangle, Music, User, Check, X, Minus, UserX } from "lucide-react";
import { showToast } from "@/utils/showToast";
import { cn } from "@/lib/utils";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { prioritizeUsersForClient } from "@/utils/userOrdering";

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
  reportContext = {},
}) {
  const {
    periodeLabel,
    viewLabel,
    directorateName,
    directorateOfficialName,
  } = reportContext || {};
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
  const inferredClientId = useMemo(() => {
    const candidate = users.find(
      (u) => u.client_id || u.client_name || u.client || u.nama_client,
    );
    return (
      candidate?.client_id ||
      candidate?.client ||
      candidate?.client_name ||
      candidate?.nama_client ||
      ""
    );
  }, [users]);

  const sorted = useMemo(() => {
    const sortedByRank = [...filtered].sort(compareUsersByPangkatAndNrp);
    return prioritizeUsersForClient(sortedByRank, inferredClientId);
  }, [filtered, inferredClientId]);

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
          "border border-indigo-100 bg-white text-slate-600 shadow-sm",
        badgeClass:
          "bg-indigo-50 border border-indigo-200 text-indigo-600",
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
          "border border-sky-100 bg-white text-slate-600 shadow-sm",
        badgeClass:
          "bg-sky-50 border border-sky-200 text-sky-600",
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

    const reportDirectorateName = directorateName || "Ditbinmas";
    const reportDirectorateOfficialName =
      directorateOfficialName || reportDirectorateName;

    const sortedClients = Object.keys(clients).sort((a, b) => {
      if (a === reportDirectorateOfficialName) return -1;
      if (b === reportDirectorateOfficialName) return 1;
      return a.localeCompare(b);
    });

    const now = new Date();
    const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
    const tanggal = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const jam = now.toLocaleTimeString("id-ID", { hour12: false });

    const uniqueClients = Array.from(
      new Set(
        sortedClients.length
          ? sortedClients
          : users.map((u) =>
              u.nama_client ||
              u.client_name ||
              u.client ||
              bersihkanSatfung(u.divisi || "Lainnya") ||
              "Lainnya",
            ),
      ),
    );
    const headerClientName =
      uniqueClients.length === 0
        ? "-"
        : uniqueClients.length === 1
        ? uniqueClients[0]
        : uniqueClients.join(", ");

    const headerLines = [
      "*Mohon ijin Komandan,*",
      "",
      `📋 *Laporan Rekap Komentar TikTok ${reportDirectorateName}*`,
      `Sumber: Konten akun official ${reportDirectorateOfficialName}`,
      `Dilaporkan oleh Operator: ${headerClientName}`,
      periodeLabel ? `Periode data: ${periodeLabel}` : null,
      viewLabel ? `Mode tampilan: ${viewLabel}` : null,
      `Waktu kompilasi: ${jam} WIB`,
      "",
      "Ringkasan Data:",
      "",
      `- Jumlah Konten TikTok : ${totalTiktokPostCount}`,
      `- Jumlah Total Personel : ${totalUser} pers`,
      `- Sudah Melaksanakan : ${totalSudahKomentar} pers`,
      `- Melaksanakan Kurang Lengkap : ${totalKurangKomentar} pers`,
      `- Belum Melaksanakan : ${totalBelumKomentar} pers`,
      `- Belum Update Username TikTok : ${totalTanpaUsername} pers`,
      "",
      "Rincian terperinci sebagai berikut:",
      "",
    ].filter(Boolean);

    const lines = [...headerLines];

    if (tidakAdaPost) {
      lines.push("Catatan: Tidak ada posting TikTok pada periode ini.");
      lines.push("");
    }

    sortedClients.forEach((client) => {
      const { Sudah, Kurang, Belum, UsernameKosong } = clients[client];
      const totalEntries =
        Sudah.length + Kurang.length + Belum.length + UsernameKosong.length;
      if (totalEntries === 0) {
        return;
      }

      lines.push(`*${client.toUpperCase()}*`);

      const pushSection = (title, entries, formatter) => {
        if (!entries.length) return;
        lines.push(`${title} (${entries.length} personel):`);
        formatter(entries).forEach((entry) => lines.push(entry));
        lines.push("");
      };

      const formatKomentar = (arr) =>
        sortByName(arr).map((u) => {
          const name = u.title ? `${u.title} ${u.nama}` : u.nama;
          const divisi = bersihkanSatfung(u.divisi || "-");
          const jumlahKomentar = Number(u.jumlah_komentar) || 0;
          return `- ${name}${divisi ? ` (${divisi})` : ""}, ${jumlahKomentar} komentar`;
        });

      const formatBelum = (arr) =>
        sortByName(arr).map((u) => {
          const name = u.title ? `${u.title} ${u.nama}` : u.nama;
          const username = String(u.username || "-").trim() || "-";
          const divisi = bersihkanSatfung(u.divisi || "-");
          return `- ${name}${divisi ? ` (${divisi})` : ""}, ${username}`;
        });

      const formatUsernameKosong = (arr) =>
        sortByName(arr).map((u) => {
          const name = u.title ? `${u.title} ${u.nama}` : u.nama;
          const divisi = bersihkanSatfung(u.divisi || "-");
          return `- ${name}${divisi ? ` (${divisi})` : ""}`;
        });

      pushSection("Sudah", Sudah, formatKomentar);
      pushSection("Kurang", Kurang, formatKomentar);
      pushSection("Belum", Belum, formatBelum);
      pushSection("Username belum tersedia", UsernameKosong, formatUsernameKosong);

      if (lines[lines.length - 1] === "") {
        lines.pop();
      }
      lines.push("");
    });

    const message = lines.join("\n");

    const copyMessage = () => {
      showToast(
        "Teks rekap siap kirim WhatsApp berhasil disalin",
        "success",
      );
    };

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(message)
        .then(copyMessage)
        .catch(() => {
          const fallbackSuccess = copyToClipboardFallback(message);
          if (fallbackSuccess) {
            copyMessage();
          } else {
            showToast(message, "info");
          }
        });
    } else {
      const fallbackSuccess = copyToClipboardFallback(message);
      if (fallbackSuccess) {
        copyMessage();
      } else {
        showToast(message, "info");
      }
    }
  }

  return (
    <div className="relative mt-10 flex flex-col gap-10 pb-24 text-slate-700">
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
        <p className="text-xs text-slate-500 text-center md:text-right">
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
            className="w-full rounded-2xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 shadow-sm transition focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-200/60 sm:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {tidakAdaPost && (
        <div className="rounded-3xl border border-indigo-100 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          Tidak ada posting TikTok yang perlu dikomentari hari ini. Tim kamu bisa
          beristirahat sejenak.
        </div>
      )}

      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-white/95 shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-800">
            <thead className="sticky top-0 z-10 bg-indigo-50/90 backdrop-blur">
              <tr>
                <th className="border-b border-indigo-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">No</th>
                <th className="border-b border-indigo-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Satker</th>
                <th className="border-b border-indigo-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Nama</th>
                <th className="border-b border-indigo-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Username TikTok</th>
                <th className="border-b border-indigo-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">Divisi/Satfung</th>
                <th className="border-b border-indigo-100 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">
                  Status
                </th>
                <th className="border-b border-indigo-100 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.28em] text-indigo-600">
                  Jumlah Komentar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
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
              ) : (
                currentRows.map((u, i) => {
                  const username = String(u.username || "").trim();
                  const jumlahKomentar = Number(u.jumlah_komentar) || 0;
                  const baseCellClass = "px-4 py-3 align-top";

                  const statusStyles = {
                    tidakAdaPost: {
                      row: "bg-slate-50",
                      badge: "border border-slate-200 bg-slate-50 text-slate-700",
                      icon: <Minus className="h-3 w-3" />,
                      label: "Tidak ada posting",
                    },
                    sudah: {
                      row: "bg-emerald-50",
                      badge: "border border-emerald-200 bg-emerald-50 text-emerald-700",
                      icon: <Check className="h-3 w-3" />,
                      label: "Sudah",
                    },
                    kurang: {
                      row: "bg-amber-50",
                      badge: "border border-amber-200 bg-amber-50 text-amber-700",
                      icon: <AlertTriangle className="h-3 w-3" />,
                      label: "Kurang",
                    },
                    belum: {
                      row: "bg-rose-50",
                      badge: "border border-rose-200 bg-rose-50 text-rose-700",
                      icon: <X className="h-3 w-3" />,
                      label: "Belum",
                    },
                    tanpaUsername: {
                      row: "bg-indigo-50",
                      badge: "border border-indigo-200 bg-indigo-50 text-indigo-700",
                      icon: <UserX className="h-3 w-3" />,
                      label: "Tanpa Username",
                    },
                  };

                  let statusKey = "belum";

                  if (tidakAdaPost) {
                    statusKey = "tidakAdaPost";
                  } else if (!username) {
                    statusKey = "tanpaUsername";
                  } else if (jumlahKomentar >= totalTiktokPostCount * 0.5) {
                    statusKey = "sudah";
                  } else if (jumlahKomentar > 0) {
                    statusKey = "kurang";
                  }

                  const status = statusStyles[statusKey];

                  return (
                    <tr
                      key={u.user_id}
                      className={`${status.row} text-slate-800 transition-colors hover:bg-indigo-50`}
                    >
                      <td className={`${baseCellClass} text-sm text-slate-600`}>
                        {(page - 1) * PAGE_SIZE + i + 1}
                      </td>
                      <td className={baseCellClass}>
                        <span className="font-medium text-slate-900">
                          {u.nama_client || u.client_name || u.client || u.client_id || "-"}
                        </span>
                      </td>
                      <td className={baseCellClass}>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-900">
                            {u.title ? `${u.title} ${u.nama}` : u.nama}
                          </span>
                          <span className="text-[11px] uppercase tracking-[0.2em] text-indigo-500">Personel</span>
                        </div>
                      </td>
                      <td className={`${baseCellClass} font-mono text-indigo-700`}>
                        @{username || "-"}
                      </td>
                      <td className={baseCellClass}>
                        <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                          {bersihkanSatfung(u.divisi || "-")}
                        </span>
                      </td>
                      <td className={`${baseCellClass} text-center`}>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] shadow-sm ${status.badge}`}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className={`${baseCellClass} text-center text-lg font-semibold text-slate-900`}>
                        {tidakAdaPost ? "-" : jumlahKomentar}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Tabel ini merangkum status komentar TikTok setiap user dan total jumlah komentar yang diberikan.
      </p>

      {totalPages > 1 && (
        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-indigo-100 bg-white/95 p-4 text-indigo-900 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <button
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-indigo-200 disabled:hover:bg-indigo-50"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-sm text-indigo-700">
            Halaman <b className="text-indigo-900">{page}</b> dari {" "}
            <b className="text-indigo-900">{totalPages}</b>
          </span>
          <button
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-indigo-200 disabled:hover:bg-indigo-50"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      )}

      <div className="sticky bottom-6 z-20 flex w-full justify-end px-4">
        <div className="flex w-full max-w-xl flex-col gap-2 rounded-3xl border border-sky-100 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center">
          <button
            onClick={handleDownloadRekap}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-sm transition hover:from-sky-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-sky-200/60 sm:w-auto"
          >
            Salin Teks Rekap
          </button>
          {showCopyButton && (
            <button
              onClick={handleCopyRekap}
              className="w-full rounded-2xl bg-gradient-to-r from-violet-400 to-fuchsia-400 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-white shadow-sm transition hover:from-violet-500 hover:to-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-200/60 sm:w-auto"
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
      icon: "text-rose-500",
      iconWrap: "border-rose-200 bg-rose-50",
      glow: "from-rose-100 via-rose-50 to-transparent",
      bar: "from-rose-400 to-pink-400",
      cardBorder: "border-rose-100",
    },
    emerald: {
      icon: "text-emerald-500",
      iconWrap: "border-emerald-200 bg-emerald-50",
      glow: "from-emerald-100 via-emerald-50 to-transparent",
      bar: "from-emerald-400 to-lime-400",
      cardBorder: "border-emerald-100",
    },
    amber: {
      icon: "text-amber-500",
      iconWrap: "border-amber-200 bg-amber-50",
      glow: "from-amber-100 via-amber-50 to-transparent",
      bar: "from-amber-300 to-orange-400",
      cardBorder: "border-amber-100",
    },
    rose: {
      icon: "text-rose-500",
      iconWrap: "border-rose-200 bg-rose-50",
      glow: "from-rose-100 via-rose-50 to-transparent",
      bar: "from-rose-400 to-amber-400",
      cardBorder: "border-rose-100",
    },
    violet: {
      icon: "text-violet-500",
      iconWrap: "border-violet-200 bg-violet-50",
      glow: "from-violet-100 via-violet-50 to-transparent",
      bar: "from-violet-400 to-purple-500",
      cardBorder: "border-violet-100",
    },
    slate: {
      icon: "text-slate-500",
      iconWrap: "border-slate-200 bg-slate-50",
      glow: "from-slate-100 via-slate-50 to-transparent",
      bar: "from-slate-300 to-slate-400",
      cardBorder: "border-slate-200",
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
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border bg-white p-5 text-center shadow-sm",
        palette.cardBorder,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 rounded-[1.35rem] bg-gradient-to-br opacity-60 blur-2xl",
          palette.glow,
        )}
      />
      <div className="relative flex flex-col items-center gap-2">
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-2xl border",
            palette.iconWrap,
          )}
        >
          {iconElement}
        </div>
        <div className="text-3xl font-semibold text-slate-900">{value}</div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-slate-500">
          {title}
        </div>
        {formattedPercentage && (
          <div className="mt-2 flex w-full max-w-[180px] flex-col items-center gap-2">
            <span className="text-[11px] font-medium text-slate-500">
              {formattedPercentage}
            </span>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
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
