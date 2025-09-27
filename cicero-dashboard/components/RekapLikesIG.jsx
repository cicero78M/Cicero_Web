"use client";
import {
  useMemo,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import usePersistentState from "@/hooks/usePersistentState";
import { Camera, Users, Check, X, AlertTriangle, UserX } from "lucide-react";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { showToast } from "@/utils/showToast";

const PAGE_SIZE = 25;

/**
 * Komponen RekapLikesIG
 * @param {Array} users - array user rekap likes IG (sudah HARUS hasil filter/fetch periode yg benar dari parent)
 * @param {number} totalIGPost - jumlah IG Post hari ini (atau sesuai periode, dari parent)
 * @param {Array} posts - daftar posting IG untuk rekap ORG
 * @param {boolean} showRekapButton - tampilkan panel aksi rekap jika true
 * @param {boolean} showCopyButton - tampilkan tombol salin rekap jika true
 * @param {string} clientName - nama client ORG
 */
const RekapLikesIG = forwardRef(function RekapLikesIG(
  {
    users = [],
    totalIGPost = 0,
    posts = [],
    // tampilkan tombol rekap secara default
    showRekapButton = true,
    showCopyButton = true,
    clientName = "",
  },
  ref,
) {
  const sortedUsers = useMemo(() => {
    const getClientIdentifier = (user) => {
      const rawClientId =
        user.client_id ??
        user.clientId ??
        user.clientID ??
        user.client ??
        "";
      const clientString = String(rawClientId).trim();
      if (!clientString) {
        return { hasValue: false, stringValue: "", numericValue: NaN };
      }

      const numericValue = Number(clientString);
      return {
        hasValue: true,
        stringValue: clientString,
        numericValue: Number.isFinite(numericValue) ? numericValue : NaN,
      };
    };

    const compareByClientId = (a, b) => {
      const clientA = getClientIdentifier(a);
      const clientB = getClientIdentifier(b);

      if (clientA.hasValue && clientB.hasValue) {
        const bothNumeric =
          !Number.isNaN(clientA.numericValue) &&
          !Number.isNaN(clientB.numericValue);

        if (bothNumeric && clientA.numericValue !== clientB.numericValue) {
          return clientA.numericValue - clientB.numericValue;
        }

        const stringCompare = clientA.stringValue.localeCompare(
          clientB.stringValue,
          "id",
          { sensitivity: "base" },
        );
        if (stringCompare !== 0) {
          return stringCompare;
        }
      } else if (clientA.hasValue !== clientB.hasValue) {
        return clientA.hasValue ? -1 : 1;
      }

      return compareUsersByPangkatAndNrp(a, b);
    };

    return [...users].sort(compareByClientId);
  }, [users]);

  const totalUser = sortedUsers.length;
  const hasClient = useMemo(
    () =>
      sortedUsers.some((u) => u.nama_client || u.client_name || u.client),
    [sortedUsers],
  );

  const validUsers = useMemo(
    () =>
      sortedUsers.filter((u) => String(u.username || "").trim() !== ""),
    [sortedUsers],
  );
  const tanpaUsernameUsers = useMemo(
    () =>
      sortedUsers.filter((u) => String(u.username || "").trim() === ""),
    [sortedUsers],
  );

  // Klasifikasi pengguna
  const totalSudahLike =
    totalIGPost === 0
      ? 0
      : validUsers.filter((u) => Number(u.jumlah_like) >= totalIGPost).length;
  const totalKurangLike =
    totalIGPost === 0
      ? 0
      : validUsers.filter((u) => {
          const likes = Number(u.jumlah_like) || 0;
          return likes > 0 && likes < totalIGPost;
        }).length;
  const totalBelumLike =
    totalIGPost === 0
      ? validUsers.length
      : validUsers.filter((u) => Number(u.jumlah_like) === 0).length;
  const totalTanpaUsername = tanpaUsernameUsers.length;
  const validUserCount = validUsers.length;

  const getPercentage = (value, base = validUserCount) => {
    const denominator = Number(base);
    if (!denominator) return undefined;
    const numerator = Number(value) || 0;
    return (numerator / denominator) * 100;
  };

  // Search/filter
  const [search, setSearch] = useState("");
  const sorted = useMemo(
    () =>
      sortedUsers.filter((u) => {
        const term = search.toLowerCase();
        return (
          (u.nama || "").toLowerCase().includes(term) ||
          (u.username || "").toLowerCase().includes(term) ||
          (u.divisi || "").toLowerCase().includes(term) ||
          (u.nama_client || u.client_name || u.client || "").toLowerCase().includes(term)
        );
      }),
    [sortedUsers, search],
  );

  // Pagination
  const [page, setPage] = usePersistentState("rekapLikesIG_page", 1);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset ke halaman 1 ketika data pengguna berubah dari parent
  useEffect(() => {
    setPage(1);
  }, [users, setPage]);

  // Reset ke halaman 1 jika search berubah
  useEffect(() => setPage(1), [search, setPage]);

  // Pastikan halaman tidak melebihi total yang tersedia
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
    sortedUsers.forEach((u) => {
      const client = (
        u.nama_client ||
        u.client_name ||
        u.client ||
        u.divisi ||
        "LAINNYA"
      ).toUpperCase();
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
      const likes = Number(u.jumlah_like) || 0;
      if (totalIGPost === 0) {
        satkerMap[client].belum += 1;
      } else if (likes >= totalIGPost) {
        satkerMap[client].sudah += 1;
      } else if (likes > 0) {
        satkerMap[client].kurang += 1;
      } else {
        satkerMap[client].belum += 1;
      }
    });

    const lines = [
      `Rekap Likes Instagram (${tanggal})`,
      `Jumlah IG Post: ${totalIGPost}`,
      `Total User: ${totalUser}`,
      `Sudah Like: ${totalSudahLike}`,
      `Kurang Like: ${totalKurangLike}`,
      `Belum Like: ${totalBelumLike}`,
      `Tanpa Username IG: ${totalTanpaUsername}`,
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
    sortedUsers.forEach((u) => {
      const client = u.nama_client || u.client_name || u.client || "Lainnya";
      if (!clients[client])
        clients[client] = { Sudah: [], Kurang: [], Belum: [], UsernameKosong: [] };
      const username = String(u.username || "").trim();
      if (!username) {
        clients[client].UsernameKosong.push(u);
        return;
      }
      const likes = Number(u.jumlah_like) || 0;
      let status = "Belum";
      if (totalIGPost !== 0) {
        if (likes >= totalIGPost) status = "Sudah";
        else if (likes > 0) status = "Kurang";
      }
      clients[client][status].push(u);
    });

    const sortByRank = (arr) =>
      [...arr].sort(compareUsersByPangkatAndNrp);

    const sortedClients = Object.keys(clients).sort((a, b) => {
      if (a === "Direktorat Binmas") return -1;
      if (b === "Direktorat Binmas") return 1;
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
    const jumlahKonten =
      Array.isArray(posts) && posts.length > 0 ? posts.length : totalIGPost;
    const linkKonten =
      Array.isArray(posts) && posts.length > 0
        ? posts
            .map(
              (p) =>
                p.permalink ||
                p.permalink_url ||
                p.media_url ||
                p.link ||
                p.url ||
                "",
            )
            .filter(Boolean)
            .join("\n")
        : "-";

    const headerClientName = clientName || "-";

    const lines = [
      "*Mohon ijin Komandan,*",
      "",
      "📋 *Rekapitulasi Akumulasi Likes Instagram*",
      "Konten dari akun official Direktorat Binmas",
      `Oleh Personel ${headerClientName}`,
      `Hari/Tanggal: ${hari}, ${tanggal}`,
      `Waktu: ${jam} WIB`,
      "",
      "Ringkasan Data:",
      "",
      `- Jumlah Konten Instagram : ${jumlahKonten}`,
      `- Jumlah Total Personel : ${totalUser} pers`,
      `- Sudah Melaksanakan : ${totalSudahLike} pers`,
      `- Melaksanakan Kurang Lengkap : ${totalKurangLike} pers`,
      `- Belum Melaksanakan : ${totalBelumLike} pers`,
      `- Belum Update Username Instagram : ${totalTanpaUsername} pers`,
      "",
      "Daftar Link Konten:",
      linkKonten,
      "",
      "Rincian terperinci sebagai berikut:",
      "",
    ];

    sortedClients.forEach((client) => {
      const { Sudah, Kurang, Belum, UsernameKosong } = clients[client];
      lines.push(
        `${client.toUpperCase()} : ${Sudah.length}/${Kurang.length}/${Belum.length}/${UsernameKosong.length}`,
      );
      lines.push(`Sudah : ${Sudah.length}`);
      sortByRank(Sudah).forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        lines.push(`- ${name}, ${u.jumlah_like}`);
      });
      lines.push(`Kurang : ${Kurang.length}`);
      sortByRank(Kurang).forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        lines.push(`- ${name}, ${u.jumlah_like}`);
      });
      lines.push(`Belum : ${Belum.length}`);
      sortByRank(Belum).forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        lines.push(`- ${name}, ${u.username}`);
      });
      lines.push(`Username Kosong : ${UsernameKosong.length}`);
      sortByRank(UsernameKosong).forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        lines.push(`- ${name}`);
      });
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

  useImperativeHandle(ref, () => ({
    copyRekap: handleCopyRekap,
    downloadRekap: handleDownloadRekap,
  }));

  return (
    <div className="mt-10 flex flex-col gap-10 pb-32">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <SummaryCard
          title="IG Post Hari Ini"
          value={totalIGPost}
          accent="sky"
          icon={
            <Camera className="h-6 w-6 text-sky-200 drop-shadow-[0_0_12px_rgba(56,189,248,0.55)]" />
          }
        />
        <SummaryCard
          title="Total User"
          value={totalUser}
          accent="slate"
          icon={
            <Users className="h-6 w-6 text-slate-200 drop-shadow-[0_0_12px_rgba(148,163,184,0.45)]" />
          }
        />
        <SummaryCard
          title="Sudah Like"
          value={totalSudahLike}
          accent="emerald"
          icon={
            <Check className="h-6 w-6 text-emerald-200 drop-shadow-[0_0_12px_rgba(16,185,129,0.55)]" />
          }
          percentage={getPercentage(totalSudahLike)}
        />
        <SummaryCard
          title="Kurang Like"
          value={totalKurangLike}
          accent="amber"
          icon={
            <AlertTriangle className="h-6 w-6 text-amber-100 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]" />
          }
          percentage={getPercentage(totalKurangLike)}
        />
        <SummaryCard
          title="Belum Like"
          value={totalBelumLike}
          accent="rose"
          icon={
            <X className="h-6 w-6 text-rose-200 drop-shadow-[0_0_12px_rgba(244,63,94,0.55)]" />
          }
          percentage={getPercentage(totalBelumLike)}
        />
        <SummaryCard
          title="Tanpa Username"
          value={totalTanpaUsername}
          accent="violet"
          icon={
            <UserX className="h-6 w-6 text-violet-200 drop-shadow-[0_0_12px_rgba(139,92,246,0.55)]" />
          }
          percentage={getPercentage(totalTanpaUsername, totalUser)}
        />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-[0_0_32px_rgba(56,189,248,0.08)] backdrop-blur">
        <div className="pointer-events-none absolute -left-24 top-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-sky-100">
                Rekap Personel Instagram
              </h2>
              <p className="text-sm text-slate-300">
                Filter dan telusuri status likes setiap personel pada periode terpilih.
              </p>
            </div>
            <label
              className="flex w-full max-w-xs flex-col gap-2 text-slate-200 md:max-w-sm"
              htmlFor="rekap-likes-ig-search"
            >
              <span className="text-[11px] uppercase tracking-[0.35em] text-slate-400">
                Cari personel Instagram
              </span>
              <input
                id="rekap-likes-ig-search"
                type="text"
                placeholder="Cari nama, username, divisi, atau client"
                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 shadow-inner transition focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full border-collapse text-left text-sm text-slate-200">
              <thead className="sticky top-0 z-10 bg-slate-950/80 text-xs uppercase tracking-[0.3em] text-slate-300">
                <tr>
                  <th className="px-3 py-3">No</th>
                  {hasClient && <th className="px-3 py-3">Client</th>}
                  <th className="px-3 py-3">Nama</th>
                  <th className="px-3 py-3">Username IG</th>
                  <th className="px-3 py-3">Divisi/Satfung</th>
                  <th className="px-3 py-3 text-center">Status</th>
                  <th className="px-3 py-3 text-center">Jumlah Like</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-950/40">
                {currentRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={hasClient ? 7 : 6}
                      className="h-48 px-4 text-center text-sm text-slate-300"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <p className="font-semibold text-slate-100">
                          Data tidak ditemukan untuk filter saat ini.
                        </p>
                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="rounded-xl border border-sky-400/40 bg-sky-500/20 px-4 py-1.5 text-sm font-semibold text-sky-200 shadow-[0_0_18px_rgba(56,189,248,0.25)] transition hover:border-sky-300/60 hover:bg-sky-400/30"
                          >
                            Reset pencarian
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentRows.map((u, i) => {
                    const username = String(u.username || "").trim();
                    let rowClass = "bg-rose-500/10";
                    let statusEl = (
                      <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 bg-rose-500/20 px-2 py-0.5 text-xs font-semibold text-rose-200 shadow-[0_0_14px_rgba(244,63,94,0.35)]">
                        <X className="h-3 w-3" /> Belum
                      </span>
                    );
                    let jumlahDisplay = u.jumlah_like;
                    if (!username) {
                      rowClass = "bg-slate-500/10";
                      statusEl = (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-400/40 bg-slate-500/20 px-2 py-0.5 text-xs font-semibold text-slate-200 shadow-[0_0_12px_rgba(148,163,184,0.35)]">
                          <UserX className="h-3 w-3" /> Tanpa Username
                        </span>
                      );
                      jumlahDisplay = 0;
                    } else if (totalIGPost !== 0) {
                      const likes = Number(u.jumlah_like) || 0;
                      if (likes >= totalIGPost) {
                        rowClass = "bg-emerald-500/10";
                        statusEl = (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.35)]">
                            <Check className="h-3 w-3" /> Sudah
                          </span>
                        );
                      } else if (likes > 0) {
                        rowClass = "bg-amber-500/10";
                        statusEl = (
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-100 shadow-[0_0_14px_rgba(251,191,36,0.35)]">
                            <AlertTriangle className="h-3 w-3" /> Kurang
                          </span>
                        );
                      }
                    }

                    return (
                      <tr
                        key={u.user_id}
                        className={`${rowClass} text-slate-100 transition-colors`}
                      >
                        <td className="px-3 py-2">{(page - 1) * PAGE_SIZE + i + 1}</td>
                        {hasClient && (
                          <td className="px-3 py-2">
                            {u.nama_client || u.client_name || u.client || "-"}
                          </td>
                        )}
                        <td className="px-3 py-2">
                          {u.title ? `${u.title} ${u.nama}` : u.nama}
                        </td>
                        <td className="px-3 py-2 font-mono text-sky-300">
                          @{u.username}
                        </td>
                        <td className="px-3 py-2">
                          <span className="inline-block rounded-full border border-sky-400/40 bg-sky-500/20 px-2 py-0.5 text-xs font-semibold text-sky-200">
                            {u.divisi || "-"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">{statusEl}</td>
                        <td className="px-3 py-2 text-center font-semibold text-sky-100">
                          {jumlahDisplay}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <p className="text-sm italic text-slate-300">
            Tabel ini menampilkan status like Instagram setiap user serta jumlah like yang berhasil dihimpun.
          </p>

          {totalPages > 1 && (
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-slate-200 shadow-inner sm:flex-row sm:items-center sm:justify-between">
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-sky-400/40 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/5"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span className="text-sm text-slate-300">
                Halaman <b className="text-sky-200">{page}</b> dari {" "}
                <b className="text-sky-200">{totalPages}</b>
              </span>
              <button
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-sky-400/40 hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/10 disabled:hover:bg-white/5"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {showRekapButton && (
        <div className="pointer-events-none sticky bottom-4 z-20 flex w-full justify-end px-4">
          <div className="pointer-events-auto flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/80 p-4 shadow-[0_20px_60px_rgba(15,118,110,0.2)] backdrop-blur md:flex-row md:items-center md:justify-end">
            <button
              onClick={handleDownloadRekap}
              className="w-full rounded-2xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition hover:border-emerald-300/60 hover:bg-emerald-400/30 md:w-auto"
            >
              Salin Teks Rekap
            </button>
            {showCopyButton && (
              <button
                onClick={handleCopyRekap}
                className="w-full rounded-2xl border border-sky-400/40 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-200 shadow-[0_0_25px_rgba(56,189,248,0.35)] transition hover:border-sky-300/60 hover:bg-sky-400/30 md:w-auto"
              >
                Salin Rekap
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default RekapLikesIG;

// Semua card mengikuti style IG Post Hari Ini
function SummaryCard({ title, value, icon, percentage, accent = "sky" }) {
  const formattedPercentage =
    typeof percentage === "number" && !Number.isNaN(percentage)
      ? `${percentage.toFixed(1).replace(".0", "")}%`
      : null;
  const clampedPercentage =
    typeof percentage === "number"
      ? Math.min(100, Math.max(0, percentage))
      : 0;

  const accentStyles = {
    sky: {
      border: "border-sky-400/40",
      glow: "bg-sky-500/30",
      text: "text-sky-200",
      progress: "bg-sky-400",
    },
    slate: {
      border: "border-slate-400/40",
      glow: "bg-slate-500/25",
      text: "text-slate-200",
      progress: "bg-slate-400",
    },
    emerald: {
      border: "border-emerald-400/40",
      glow: "bg-emerald-500/25",
      text: "text-emerald-200",
      progress: "bg-emerald-400",
    },
    amber: {
      border: "border-amber-400/50",
      glow: "bg-amber-500/30",
      text: "text-amber-100",
      progress: "bg-amber-400",
    },
    rose: {
      border: "border-rose-400/50",
      glow: "bg-rose-500/30",
      text: "text-rose-200",
      progress: "bg-rose-400",
    },
    violet: {
      border: "border-violet-400/50",
      glow: "bg-violet-500/30",
      text: "text-violet-200",
      progress: "bg-violet-400",
    },
  };

  const styles = accentStyles[accent] || accentStyles.sky;

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-slate-900/60 p-6 text-center shadow-[0_0_25px_rgba(56,189,248,0.08)] backdrop-blur`}>
      <div className={`pointer-events-none absolute -right-10 top-0 h-24 w-24 rounded-full blur-3xl ${styles.glow}`} />
      <div className="relative flex flex-col items-center gap-3">
        <div className={`flex items-center gap-3 text-3xl font-semibold ${styles.text}`}>
          <span className="rounded-full bg-white/5 p-2 shadow-inner">
            {icon}
          </span>
          <span>{value}</span>
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-300">
          {title}
        </div>
        {formattedPercentage && (
          <div className="mt-1 flex w-full max-w-[200px] flex-col items-center gap-1">
            <span className="text-[11px] font-medium text-slate-200">
              {formattedPercentage}
            </span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800/70">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${styles.progress}`}
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
