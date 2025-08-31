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

// Utility: handle boolean/string/number for exception
function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

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
  const totalUser = users.length;
  const hasClient = useMemo(
    () => users.some((u) => u.nama_client || u.client_name || u.client),
    [users],
  );

  const validUsers = useMemo(
    () => users.filter((u) => String(u.username || "").trim() !== ""),
    [users],
  );
  const tanpaUsernameUsers = useMemo(
    () => users.filter((u) => String(u.username || "").trim() === ""),
    [users],
  );

  // Klasifikasi pengguna
  const totalSudahLike =
    totalIGPost === 0
      ? 0
      : validUsers.filter(
          (u) =>
            Number(u.jumlah_like) >= totalIGPost * 0.5 || isException(u.exception),
        ).length;
  const totalKurangLike =
    totalIGPost === 0
      ? 0
      : validUsers.filter((u) => {
          const likes = Number(u.jumlah_like) || 0;
          return likes > 0 && likes < totalIGPost * 0.5 && !isException(u.exception);
        }).length;
  const totalBelumLike =
    totalIGPost === 0
      ? validUsers.length
      : validUsers.filter(
          (u) => Number(u.jumlah_like) === 0 && !isException(u.exception),
        ).length;
  const totalTanpaUsername = tanpaUsernameUsers.length;

  // Hitung nilai jumlah_like tertinggi (max) di seluruh user
  const maxJumlahLike = useMemo(
    () =>
      Math.max(
        0,
        ...validUsers
          .filter((u) => !isException(u.exception))
          .map((u) => parseInt(u.jumlah_like || 0, 10)),
      ),
    [validUsers],
  );

  const sudahUsers = useMemo(() => {
    if (totalIGPost === 0) return [];
    return validUsers.filter(
      (u) =>
        Number(u.jumlah_like) >= totalIGPost * 0.5 || isException(u.exception),
    );
  }, [validUsers, totalIGPost]);

  const kurangUsers = useMemo(() => {
    if (totalIGPost === 0) return [];
    return validUsers.filter((u) => {
      const likes = Number(u.jumlah_like) || 0;
      return likes > 0 && likes < totalIGPost * 0.5 && !isException(u.exception);
    });
  }, [validUsers, totalIGPost]);

  const belumUsers = useMemo(() => {
    if (totalIGPost === 0) return validUsers;
    return validUsers.filter(
      (u) => Number(u.jumlah_like) === 0 && !isException(u.exception),
    );
  }, [validUsers, totalIGPost]);

  function groupByDivisi(arr) {
    return arr.reduce((acc, u) => {
      const d = u.divisi || "Lainnya";
      if (!acc[d]) acc[d] = [];
      acc[d].push(u);
      return acc;
    }, {});
  }

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
  const [page, setPage] = usePersistentState("rekapLikesIG_page", 1);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset ke halaman 1 jika search berubah
  useEffect(() => setPage(1), [search, setPage]);

  // Pastikan halaman tidak melebihi total yang tersedia
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages || 1);
    }
  }, [page, totalPages, setPage]);

  function handleCopyRekap() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = "Selamat Pagi";
    if (hour >= 18) greeting = "Selamat Malam";
    else if (hour >= 12) greeting = "Selamat Siang";

    const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
    const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const jam = now.toLocaleTimeString("id-ID", { hour12: false });

    const jumlahKonten = Array.isArray(posts) && posts.length > 0 ? posts.length : totalIGPost;
    const linkKonten = Array.isArray(posts) && posts.length > 0
      ? posts
          .map(p => p.permalink || p.permalink_url || p.media_url || p.link || p.url || "")
          .filter(Boolean)
          .join("\n")
      : "-";

    const belumGroup = groupByDivisi(belumUsers);
    const kurangGroup = groupByDivisi(kurangUsers);
    const sudahGroup = groupByDivisi(sudahUsers);
    const tanpaUsernameGroup = groupByDivisi(tanpaUsernameUsers);

    const formatGroup = grp =>
      Object.entries(grp)
        .map(([div, arr]) => {
          const list = arr
            .map(u => {
              const name = u.title ? `${u.title} ${u.nama}` : u.nama;
              return `- ${name} : @${u.username} (${u.jumlah_like}/${jumlahKonten} konten)`;
            })
            .join("\n");
          return `${div} (${arr.length} user):\n${list}`;
        })
        .join("\n");

    const message = `${greeting},\n\nMohon ijin melaporkan Rekap Akumulasi Likes dan komentar Instagram Pada Konten Social Media Akun Official Ditbinmas Polda Jatim oleh Personil Bhabinkamtibmas ${clientName} : \n\n${hari}, ${tanggal}\nJam: ${jam}\n\nJumlah Konten: ${jumlahKonten}\nDaftar Link Konten:\n${linkKonten}\n\nJumlah user: ${totalUser}\n✅ Sudah melaksanakan : ${totalSudahLike} user\n⚠️ Kurang like : ${totalKurangLike} user\n❌ Belum melaksanakan : ${totalBelumLike} user\n⁉️ Tanpa username IG : ${totalTanpaUsername} user\n\n⁉️ Tanpa Username IG (${totalTanpaUsername} user):\n${formatGroup(tanpaUsernameGroup)}\n\n❌ Belum melaksanakan (${totalBelumLike} user):\n${formatGroup(belumGroup)}\n\n⚠️ Kurang like (${totalKurangLike} user):\n${formatGroup(kurangGroup)}\n\n✅ Sudah melaksanakan (${totalSudahLike} user):\n${formatGroup(sudahGroup)}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        alert("Rekap disalin ke clipboard");
      });
    } else {
      alert(message);
    }
  }

  function handleDownloadRekap() {
    const clients = {};
    validUsers.forEach((u) => {
      const client =
        u.nama_client || u.client_name || u.client || "Lainnya";
      if (!clients[client])
        clients[client] = { Sudah: [], Kurang: [], Belum: [] };
      const likes = Number(u.jumlah_like) || 0;
      let status = "Belum";
      if (totalIGPost !== 0) {
        if (isException(u.exception) || likes >= totalIGPost * 0.5)
          status = "Sudah";
        else if (likes > 0) status = "Kurang";
      }
      clients[client][status].push(u);
    });

    const sortedClients = Object.keys(clients).sort((a, b) => {
      if (a === "Direktorat Binmas") return -1;
      if (b === "Direktorat Binmas") return 1;
      return a.localeCompare(b);
    });

    const lines = [];
    sortedClients.forEach((client) => {
      const { Sudah, Kurang, Belum } = clients[client];
      lines.push(client);
      lines.push("Sudah");
      Sudah.forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        lines.push(`- ${name}, ${u.jumlah_like}`);
      });
      lines.push("Kurang");
      Kurang.forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        lines.push(`- ${name}, ${u.jumlah_like}`);
      });
      lines.push("Belum");
      Belum.forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        lines.push(`- ${name}, @${u.username}`);
      });
      lines.push("");
    });

    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rekap_likes.txt";
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
    <div className="flex flex-col gap-6 mt-8 min-h-screen">
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
              const username = String(u.username || "").trim();
              let rowClass = "bg-red-50";
              let statusEl = (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-red-500 text-white font-semibold">
                  <X className="w-3 h-3" /> Belum
                </span>
              );
              let jumlahDisplay = isException(u.exception)
                ? maxJumlahLike
                : u.jumlah_like;
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
                if (isException(u.exception) || likes >= totalIGPost * 0.5) {
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

      {showRekapButton && (
        <div className="mt-auto flex justify-end gap-2 pt-4">
          <button
            onClick={handleDownloadRekap}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow"
          >
            Download Rekap
          </button>
          <button
            onClick={handleCopyRekap}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
          >
            Salin Rekap
          </button>
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
