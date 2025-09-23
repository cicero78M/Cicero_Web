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
 * @param {boolean} showRekapButton - tampilkan tombol salin rekap jika true
 * @param {string} clientName - nama client ORG
 */
const RekapLikesIG = forwardRef(function RekapLikesIG(
  {
    users = [],
    totalIGPost = 0,
    posts = [],
    // tampilkan tombol rekap secara default
    showRekapButton = true,
    clientName = "",
  },
  ref,
) {
  const sortedUsers = useMemo(
    () => [...users].sort(compareUsersByPangkatAndNrp),
    [users],
  );

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
      : validUsers.filter((u) => Number(u.jumlah_like) >= totalIGPost * 0.5)
          .length;
  const totalKurangLike =
    totalIGPost === 0
      ? 0
      : validUsers.filter((u) => {
          const likes = Number(u.jumlah_like) || 0;
          return likes > 0 && likes < totalIGPost * 0.5;
        }).length;
  const totalBelumLike =
    totalIGPost === 0
      ? validUsers.length
      : validUsers.filter((u) => Number(u.jumlah_like) === 0).length;
  const totalTanpaUsername = tanpaUsernameUsers.length;

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
      } else if (likes >= totalIGPost * 0.5) {
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
        if (likes >= totalIGPost * 0.5) status = "Sudah";
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
    const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const tanggalFile = `${String(now.getDate()).padStart(2, "0")}_${String(
      now.getMonth() + 1
    ).padStart(2, "0")}_${now.getFullYear()}`;
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

    const lines = [
      "Mohon ijin Komandan,",
      "",
      "📋 Rekap Akumulasi Likes Instagram",
      `Polres: ${clientName || "-"}`,
      `${hari}, ${tanggal}`,
      `Jam: ${jam}`,
      "",
      `Jumlah Konten: ${jumlahKonten}`,
      "Daftar Link Konten:",
      linkKonten,
      "",
      `Jumlah Total Personil : ${totalUser} pers`,
      `Sudah melaksanakan : ${totalSudahLike} pers`,
      `Melaksanakan kurang lengkap : ${totalKurangLike} pers`,
      `Belum melaksanakan : ${totalBelumLike} pers`,
      `Belum Update Username Instagram : ${totalTanpaUsername} pers`,
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

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rekap_Likes dan Komentar_Ditbinmas_${hari}_${tanggalFile}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  useImperativeHandle(ref, () => ({
    copyRekap: handleCopyRekap,
    downloadRekap: handleDownloadRekap,
  }));

  return (
    <div className="flex flex-col gap-6 mt-8 min-h-screen pb-24">
      {/* Ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
          title="Kurang Like"
          value={totalKurangLike}
          color="bg-gradient-to-r from-yellow-400 via-orange-500 to-orange-600 text-white"
          icon={<AlertTriangle />}
        />
        <SummaryCard
          title="Belum Like"
          value={totalBelumLike}
          color="bg-gradient-to-r from-red-400 via-pink-500 to-yellow-400 text-white"
          icon={<X />}
        />
        <SummaryCard
          title="Tanpa Username"
          value={totalTanpaUsername}
          color="bg-gradient-to-r from-gray-300 via-gray-400 to-gray-500 text-gray-800"
          icon={<UserX />}
        />
      </div>

      {/* Search bar */}
      <div className="flex justify-end mb-2">
        <label
          className="flex flex-col items-end gap-1 w-full md:w-auto"
          htmlFor="rekap-likes-ig-search"
        >
          <span className="text-sm font-medium text-gray-700">
            Cari personel Instagram
          </span>
          <input
            id="rekap-likes-ig-search"
            type="text"
            placeholder="Cari nama, username, divisi, atau client"
            className="px-3 py-2 border rounded-lg text-sm w-full md:w-64 shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
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
            {currentRows.length === 0 ? (
              <tr>
                <td
                  colSpan={hasClient ? 7 : 6}
                  className="h-48 py-12 px-4 text-center text-sm text-gray-500"
                >
                  <div className="flex flex-col items-center gap-3">
                    <p className="font-medium">
                      Data tidak ditemukan untuk filter saat ini.
                    </p>
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
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
                let rowClass = "bg-red-50";
                let statusEl = (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500 text-white font-semibold">
                    <X className="w-3 h-3" /> Belum
                  </span>
                );
                let jumlahDisplay = u.jumlah_like;
                if (!username) {
                  rowClass = "bg-gray-50";
                  statusEl = (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-500 text-white font-semibold">
                      <UserX className="w-3 h-3" /> Tanpa Username
                    </span>
                  );
                  jumlahDisplay = 0;
                } else if (totalIGPost !== 0) {
                  const likes = Number(u.jumlah_like) || 0;
                  if (likes >= totalIGPost * 0.5) {
                    rowClass = "bg-green-50";
                    statusEl = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-green-500 text-white font-semibold">
                        <Check className="w-3 h-3" /> Sudah
                      </span>
                    );
                  } else if (likes > 0) {
                    rowClass = "bg-yellow-50";
                    statusEl = (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-yellow-500 text-white font-semibold">
                        <AlertTriangle className="w-3 h-3" /> Kurang
                      </span>
                    );
                  }
                }

                return (
                  <tr key={u.user_id} className={rowClass}>
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
                    <td className="py-1 px-2 text-center">{statusEl}</td>
                    <td className="py-1 px-2 text-center font-bold">{jumlahDisplay}</td>
                  </tr>
                );
              })
            )}
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

      {showRekapButton && (
        <div className="sticky bottom-4 z-20 flex w-full justify-end px-4">
          <div className="flex w-full max-w-xl flex-col gap-2 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm sm:flex-row sm:items-center">
            <button
              onClick={handleDownloadRekap}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow sm:w-auto"
            >
              Download Rekap
            </button>
            <button
              onClick={handleCopyRekap}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow sm:w-auto"
            >
              Salin Rekap
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default RekapLikesIG;

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
