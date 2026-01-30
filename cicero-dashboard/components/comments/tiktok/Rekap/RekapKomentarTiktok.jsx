"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Check,
  Music,
  Sparkles,
  UserX,
  Users,
  X,
} from "lucide-react";
import usePersistentState from "@/hooks/usePersistentState";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { prioritizeUsersForClient } from "@/utils/userOrdering";
import { showToast } from "@/utils/showToast";
import { clampEngagementCompleted } from "@/utils/engagementStatus";

const PAGE_SIZE = 25;

function bersihkanSatfung(divisi = "") {
  return divisi
    .replace(/polsek\s*/i, "")
    .replace(/^[0-9.\-\s]+/, "")
    .trim();
}

function getKomentarStatus({ jumlahKomentar = 0, totalPostCount = 0, hasUsername }) {
  if (!hasUsername) return "tanpaUsername";

  const safeTotalPost = Math.max(0, Number(totalPostCount) || 0);
  const safeJumlahKomentar = clampEngagementCompleted({
    completed: jumlahKomentar,
    totalTarget: safeTotalPost,
  });

  if (safeTotalPost === 0) return "belum";
  if (safeJumlahKomentar >= safeTotalPost) return "sudah";
  if (safeJumlahKomentar > 0) return "kurang";
  return "belum";
}

/**
 * Rekap komentar TikTok dengan workflow dan struktur selaras RekapLikesIG.
 * @param {Array} users daftar pengguna hasil filter periode yang valid
 * @param {number} totalTiktokPost jumlah total post TikTok pada periode
 * @param {boolean} showRekapButton tampilkan panel aksi rekap
 * @param {boolean} showCopyButton tampilkan tombol salin rekap standar
 * @param {string} clientName label client/direktorat manual (opsional)
 * @param {{ totalUser?: number, totalSudahKomentar?: number, totalKurangKomentar?: number, totalBelumKomentar?: number, totalTanpaUsername?: number, totalTiktokPost?: number }} summaryTotals ringkasan agregat agar kartu ringkasan tidak menghitung ulang dari daftar user
 * @param {{ periodeLabel?: string, viewLabel?: string, directorateName?: string }} reportContext konteks laporan
 * @param {boolean} showPremiumCta tampilkan CTA Premium di samping tombol salin rekap
 */
const RekapKomentarTiktok = forwardRef(function RekapKomentarTiktok(
  {
    users = [],
    totalTiktokPost = 0,
    showRekapButton = true,
    showCopyButton = true,
    clientName = "",
    summaryTotals,
    reportContext = {},
    showPremiumCta = false,
  },
  ref,
) {
  const { periodeLabel, viewLabel, directorateName } = reportContext || {};
  const totalTiktokPostCount =
    Number(summaryTotals?.totalTiktokPost ?? totalTiktokPost) || 0;
  const clampKomentarToTask = (jumlahKomentar = 0) =>
    clampEngagementCompleted({ completed: jumlahKomentar, totalTarget: totalTiktokPostCount });

  const getClientIdentifier = (user) => {
    const rawClientId =
      user.client_id ??
      user.clientId ??
      user.clientID ??
      user.client ??
      user.nama_client ??
      user.client_name ??
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

  const compareByClientIdOnly = (a, b) => {
    const clientA = getClientIdentifier(a);
    const clientB = getClientIdentifier(b);

    if (clientA.hasValue && clientB.hasValue) {
      const bothNumeric =
        !Number.isNaN(clientA.numericValue) && !Number.isNaN(clientB.numericValue);

      if (bothNumeric && clientA.numericValue !== clientB.numericValue) {
        return clientA.numericValue - clientB.numericValue;
      }

      const stringCompare = clientA.stringValue.localeCompare(clientB.stringValue, "id", {
        sensitivity: "base",
      });
      if (stringCompare !== 0) {
        return stringCompare;
      }
    } else if (clientA.hasValue !== clientB.hasValue) {
      return clientA.hasValue ? -1 : 1;
    }

    return 0;
  };

  const compareUsers = (a, b) => {
    const pangkatDiff = compareUsersByPangkatAndNrp(a, b);
    if (pangkatDiff !== 0) {
      return pangkatDiff;
    }

    const clientDiff = compareByClientIdOnly(a, b);
    if (clientDiff !== 0) {
      return clientDiff;
    }

    return 0;
  };

  const inferredClientId = useMemo(() => {
    const firstWithClient = users.find((u) => getClientIdentifier(u).hasValue);
    return firstWithClient ? getClientIdentifier(firstWithClient).stringValue : "";
  }, [users]);

  const directorateLabel = useMemo(() => {
    const explicitName = String(clientName || directorateName || "").trim();
    if (explicitName) return explicitName;

    const inferredClientLabel = String(inferredClientId || "").trim();
    if (inferredClientLabel) return inferredClientLabel;

    return "Ditbinmas";
  }, [clientName, directorateName, inferredClientId]);

  const sortedUsers = useMemo(() => {
    const sorted = [...users].sort(compareUsers);
    return prioritizeUsersForClient(sorted, inferredClientId);
  }, [users, inferredClientId]);

  const computedTotalUser = sortedUsers.length;
  const hasClient = useMemo(
    () =>
      sortedUsers.some(
        (u) => u.nama_client || u.client_name || u.client || u.client_id || u.clientId,
      ),
    [sortedUsers],
  );

  const validUsers = useMemo(
    () => sortedUsers.filter((u) => String(u.username || "").trim() !== ""),
    [sortedUsers],
  );
  const tanpaUsernameUsers = useMemo(
    () => sortedUsers.filter((u) => String(u.username || "").trim() === ""),
    [sortedUsers],
  );

  const classifyStatus = (user) =>
    getKomentarStatus({
      jumlahKomentar: user.jumlah_komentar,
      totalPostCount: totalTiktokPostCount,
      hasUsername: true,
    });

  const computedTotalSudah = validUsers.filter((u) => classifyStatus(u) === "sudah").length;
  const computedTotalKurang = validUsers.filter((u) => classifyStatus(u) === "kurang").length;
  const computedTotalBelum = validUsers.filter((u) => classifyStatus(u) === "belum").length;
  const computedTotalTanpaUsername = tanpaUsernameUsers.length;
  const totalUser = Number(summaryTotals?.totalUser ?? computedTotalUser) || 0;
  const totalSudahKomentar =
    Number(summaryTotals?.totalSudahKomentar ?? computedTotalSudah) || 0;
  const totalKurangKomentar =
    Number(summaryTotals?.totalKurangKomentar ?? computedTotalKurang) || 0;
  const totalBelumKomentar =
    Number(summaryTotals?.totalBelumKomentar ?? computedTotalBelum) || 0;
  const totalTanpaUsername =
    Number(summaryTotals?.totalTanpaUsername ?? computedTotalTanpaUsername) || 0;
  const validUserCount = Math.max(0, totalUser - totalTanpaUsername);

  const getPercentage = (value, base = validUserCount) => {
    const denominator = Number(base);
    if (!denominator) return undefined;
    const numerator = Number(value) || 0;
    return (numerator / denominator) * 100;
  };

  const [search, setSearch] = useState("");
  const sorted = useMemo(
    () =>
      sortedUsers.filter((u) => {
        const term = search.toLowerCase();
        return (
          (u.nama || "").toLowerCase().includes(term) ||
          (u.username || "").toLowerCase().includes(term) ||
          bersihkanSatfung(u.divisi || "").toLowerCase().includes(term) ||
          (u.nama_client || u.client_name || u.client || u.client_id || "")
            .toString()
            .toLowerCase()
            .includes(term)
        );
      }),
    [sortedUsers, search],
  );

  const [page, setPage] = usePersistentState("rekapKomentarTiktok_page", 1);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [users, setPage]);

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
    sortedUsers.forEach((u) => {
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
      const jumlahKomentar = clampKomentarToTask(u.jumlah_komentar);
      const statusKey = getKomentarStatus({
        jumlahKomentar,
        totalPostCount: totalTiktokPostCount,
        hasUsername: Boolean(username),
      });

      if (statusKey === "tanpaUsername") {
        satkerMap[client].tanpaUsername += 1;
        return;
      }

      if (statusKey === "sudah") {
        satkerMap[client].sudah += 1;
        return;
      }

      if (statusKey === "kurang") {
        satkerMap[client].kurang += 1;
        return;
      }

      satkerMap[client].belum += 1;
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
    const now = new Date();
    const tanggal = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const jam = now.toLocaleTimeString("id-ID", { hour12: false });

    const clients = {};
    sortedUsers.forEach((u) => {
      const client = u.nama_client || u.client_name || u.client || "Lainnya";
      if (!clients[client])
        clients[client] = { Sudah: [], Kurang: [], Belum: [], UsernameKosong: [] };
      const username = String(u.username || "").trim();
      const jumlahKomentar = clampKomentarToTask(u.jumlah_komentar);
      const statusKey = getKomentarStatus({
        jumlahKomentar,
        totalPostCount: totalTiktokPostCount,
        hasUsername: Boolean(username),
      });

      if (statusKey === "tanpaUsername") {
        clients[client].UsernameKosong.push(u);
        return;
      }

      if (statusKey === "sudah") {
        clients[client].Sudah.push(u);
        return;
      }

      if (statusKey === "kurang") {
        clients[client].Kurang.push(u);
        return;
      }

      clients[client].Belum.push(u);
    });

    const sortByRank = (arr) => [...arr].sort(compareUsers);

    const prioritizedClient = directorateLabel.trim().toUpperCase();
    const sortedClients = Object.keys(clients).sort((a, b) => {
      const clientA = String(a || "").trim().toUpperCase();
      const clientB = String(b || "").trim().toUpperCase();

      const aPrioritized = clientA === prioritizedClient;
      const bPrioritized = clientB === prioritizedClient;
      if (aPrioritized !== bPrioritized) return aPrioritized ? -1 : 1;

      return clientA.localeCompare(clientB, "id", { sensitivity: "base" });
    });

    const headerLines = [
      "Mohon ijin Komandan,",
      `📋 Laporan Rekap Komentar TikTok ${directorateLabel}`,
      `Sumber: Akun official ${directorateLabel}`,
      periodeLabel ? `Periode data: ${periodeLabel}` : null,
      viewLabel ? `Mode tampilan: ${viewLabel}` : null,
      `Waktu kompilasi: ${jam} WIB`,
      "",
    ].filter(Boolean);

    const lines = [
      ...headerLines,
      "Ringkasan Data:",
      `- Jumlah Konten TikTok : ${totalTiktokPostCount}`,
      `- Jumlah Total Personel : ${totalUser} pers`,
      `- Sudah Melaksanakan : ${totalSudahKomentar} pers`,
      `- Melaksanakan Kurang Lengkap : ${totalKurangKomentar} pers`,
      `- Belum Melaksanakan : ${totalBelumKomentar} pers`,
      `- Belum Update Username TikTok : ${totalTanpaUsername} pers`,
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
        lines.push(`- ${name}, ${clampKomentarToTask(u.jumlah_komentar)}`);
      });
      lines.push(`Kurang : ${Kurang.length}`);
      sortByRank(Kurang).forEach((u) => {
        const name = u.title ? `${u.title} ${u.nama}` : u.nama;
        lines.push(`- ${name}, ${clampKomentarToTask(u.jumlah_komentar)}`);
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
      showToast("Teks rekap siap kirim WhatsApp berhasil disalin", "success");
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
          title="TikTok Post"
          value={totalTiktokPostCount}
          accent="sky"
          icon={
            <Music className="h-6 w-6 text-sky-600 drop-shadow-[0_0_12px_rgba(56,189,248,0.25)]" />
          }
        />
        <SummaryCard
          title="Total User"
          value={totalUser}
          accent="slate"
          icon={
            <Users className="h-6 w-6 text-blue-600 drop-shadow-[0_0_12px_rgba(59,130,246,0.2)]" />
          }
        />
        <SummaryCard
          title="Sudah Komentar"
          value={totalSudahKomentar}
          accent="emerald"
          icon={
            <Check className="h-6 w-6 text-emerald-600 drop-shadow-[0_0_12px_rgba(16,185,129,0.25)]" />
          }
          percentage={getPercentage(totalSudahKomentar)}
        />
        <SummaryCard
          title="Kurang Komentar"
          value={totalKurangKomentar}
          accent="amber"
          icon={
            <AlertTriangle className="h-6 w-6 text-amber-600 drop-shadow-[0_0_12px_rgba(251,191,36,0.25)]" />
          }
          percentage={getPercentage(totalKurangKomentar)}
        />
        <SummaryCard
          title="Belum Komentar"
          value={totalBelumKomentar}
          accent="rose"
          icon={
            <X className="h-6 w-6 text-rose-600 drop-shadow-[0_0_12px_rgba(244,63,94,0.25)]" />
          }
          percentage={getPercentage(totalBelumKomentar)}
        />
        <SummaryCard
          title="Tanpa Username"
          value={totalTanpaUsername}
          accent="violet"
          icon={
            <UserX className="h-6 w-6 text-violet-600 drop-shadow-[0_0_12px_rgba(139,92,246,0.25)]" />
          }
          percentage={getPercentage(totalTanpaUsername, totalUser)}
        />
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-white/95 p-6 shadow-[0_12px_40px_rgba(30,64,175,0.08)]">
        <div className="pointer-events-none absolute -left-24 top-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-blue-900">
                Rekap Personel TikTok
              </h2>
              <p className="text-sm text-blue-700">
                Filter dan telusuri status komentar setiap personel pada periode terpilih.
              </p>
            </div>
            <label
              className="flex w-full max-w-xs flex-col gap-2 text-blue-900 md:max-w-sm"
              htmlFor="rekap-komentar-tiktok-search"
            >
              <span className="text-[11px] uppercase tracking-[0.35em] text-blue-500">
                Cari personel TikTok
              </span>
              <input
                id="rekap-komentar-tiktok-search"
                type="text"
                placeholder="Cari nama, username, divisi, atau client"
                className="w-full rounded-xl border border-blue-200/70 bg-white px-3 py-2 text-sm text-blue-900 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>

          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white/95 shadow-inner">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-800">
                <thead className="sticky top-0 z-10 bg-blue-50/90 backdrop-blur">
                  <tr>
                    <th className="border-b border-blue-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                      No
                    </th>
                    {hasClient && (
                      <th className="border-b border-blue-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                        Client
                      </th>
                    )}
                    <th className="border-b border-blue-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                      Nama
                    </th>
                    <th className="border-b border-blue-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                      Username TikTok
                    </th>
                    <th className="border-b border-blue-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                      Divisi/Satfung
                    </th>
                    <th className="border-b border-blue-100 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                      Status
                    </th>
                    <th className="border-b border-blue-100 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.28em] text-blue-600">
                      Jumlah Komentar
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50">
                  {currentRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={hasClient ? 7 : 6}
                        className="h-48 px-4 text-center text-sm text-blue-700"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <p className="font-semibold text-blue-900">
                            Data tidak ditemukan untuk filter saat ini.
                          </p>
                          {search && (
                            <button
                              type="button"
                              onClick={() => setSearch("")}
                              className="rounded-xl border border-blue-300 bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 transition hover:border-blue-400 hover:bg-blue-100"
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
                      const jumlahKomentar = clampKomentarToTask(u.jumlah_komentar);

                      const baseCellClass = "px-4 py-3 align-top";
                      const statusStyles = {
                        belum: {
                          row: "bg-rose-50",
                          badge: "border border-rose-200 bg-rose-50 text-rose-700",
                          icon: <X className="h-3 w-3" />,
                          label: "Belum",
                        },
                        kurang: {
                          row: "bg-amber-50",
                          badge: "border border-amber-200 bg-amber-50 text-amber-700",
                          icon: <AlertTriangle className="h-3 w-3" />,
                          label: "Kurang",
                        },
                        sudah: {
                          row: "bg-emerald-50",
                          badge: "border border-emerald-200 bg-emerald-50 text-emerald-700",
                          icon: <Check className="h-3 w-3" />,
                          label: "Sudah",
                        },
                        tanpaUsername: {
                          row: "bg-slate-50",
                          badge: "border border-slate-200 bg-slate-50 text-slate-700",
                          icon: <UserX className="h-3 w-3" />,
                          label: "Tanpa Username",
                        },
                      };

                      const statusKey = getKomentarStatus({
                        jumlahKomentar,
                        totalPostCount: totalTiktokPostCount,
                        hasUsername: Boolean(username),
                      });
                      const jumlahDisplay = statusKey === "tanpaUsername" ? 0 : jumlahKomentar;

                      const status = statusStyles[statusKey];

                      return (
                        <tr
                          key={`${u.nrp || u.username || u.nama || i}-${i}`}
                          className={`transition hover:bg-blue-50/60 ${status.row}`}
                        >
                          <td className={`${baseCellClass} text-xs font-semibold uppercase tracking-[0.2em] text-blue-500`}>
                            {(page - 1) * PAGE_SIZE + i + 1}
                          </td>
                          {hasClient && (
                            <td className={`${baseCellClass} text-sm text-blue-900`}>
                              <div className="flex flex-col">
                                <span className="font-semibold">
                                  {u.nama_client || u.client_name || u.client || "-"}
                                </span>
                                <span className="text-xs text-blue-600">
                                  {u.client_id || u.clientId || ""}
                                </span>
                              </div>
                            </td>
                          )}
                          <td className={`${baseCellClass} text-sm text-blue-900`}>
                            <div className="flex flex-col">
                              <span className="font-semibold">{u.nama || "-"}</span>
                              {u.title && (
                                <span className="text-xs text-blue-600">{u.title}</span>
                              )}
                            </div>
                          </td>
                          <td className={`${baseCellClass} text-sm font-mono text-blue-900`}>
                            {username || "-"}
                          </td>
                          <td className={`${baseCellClass} text-sm text-blue-900`}>
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {bersihkanSatfung(u.divisi || "-")}
                              </span>
                              {u.divisi && (
                                <span className="text-xs text-blue-600">{u.divisi}</span>
                              )}
                            </div>
                          </td>
                          <td className={`${baseCellClass} text-center`}>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}
                            >
                              {status.icon}
                              {status.label}
                            </span>
                          </td>
                          <td className={`${baseCellClass} text-center text-sm font-semibold text-blue-900`}>
                            {jumlahDisplay}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-3 border-t border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800 md:flex-row md:justify-between">
                <div className="text-[13px] font-semibold uppercase tracking-[0.28em] text-blue-500">
                  Halaman {page} dari {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-blue-200 bg-white px-4 py-1.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-blue-200 disabled:hover:bg-white"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-blue-200 bg-white px-4 py-1.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-blue-200 disabled:hover:bg-white"
                    onClick={() => setPage(1)}
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-blue-200 bg-white px-4 py-1.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-blue-200 disabled:hover:bg-white"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRekapButton && (
        <div className="pointer-events-none sticky bottom-4 z-20 flex w-full justify-end px-4">
          <div className="pointer-events-auto flex w-full max-w-full flex-col gap-3 rounded-2xl border border-blue-200 bg-white p-4 text-blue-900 shadow-[0_20px_45px_rgba(37,99,235,0.15)] md:flex-row md:items-center md:gap-4 md:justify-end">
            {showPremiumCta && (
              <Link
                href="/premium"
                className="group flex w-full flex-1 items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-3 text-left shadow-[0_18px_35px_rgba(99,102,241,0.25)] transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:ring-offset-2 md:min-w-[240px]"
              >
                <div className="flex flex-col text-white">
                  <span className="text-sm font-semibold">Aktifkan Premium & rekap otomatis</span>
                  <span className="text-xs font-medium text-indigo-100/90">
                    Nikmati reminder pintar dan ringkasan komentar siap kirim.
                  </span>
                </div>
                <span className="rounded-full bg-white/15 p-2 text-white transition group-hover:rotate-6">
                  <Sparkles className="h-5 w-5" aria-hidden />
                </span>
              </Link>
            )}
            <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center">
              <button
                onClick={handleDownloadRekap}
                className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 md:w-auto"
              >
                Salin Teks Rekap
              </button>
              {showCopyButton && (
                <button
                  onClick={handleCopyRekap}
                  className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 md:w-auto"
                >
                  Salin Rekap
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default RekapKomentarTiktok;

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
      border: "border-sky-200",
      glow: "bg-sky-100",
      progress: "bg-sky-500",
    },
    slate: {
      border: "border-blue-200",
      glow: "bg-blue-100",
      progress: "bg-blue-400",
    },
    emerald: {
      border: "border-emerald-200",
      glow: "bg-emerald-100",
      progress: "bg-emerald-500",
    },
    amber: {
      border: "border-amber-200",
      glow: "bg-amber-100",
      progress: "bg-amber-500",
    },
    rose: {
      border: "border-rose-200",
      glow: "bg-rose-100",
      progress: "bg-rose-500",
    },
    violet: {
      border: "border-violet-200",
      glow: "bg-violet-100",
      progress: "bg-violet-500",
    },
  };

  const styles = accentStyles[accent] || accentStyles.sky;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${styles.border} bg-white/95 p-6 text-center shadow-[0_15px_35px_rgba(59,130,246,0.08)]`}
    >
      <div className={`pointer-events-none absolute -right-10 top-0 h-24 w-24 rounded-full blur-3xl ${styles.glow}`} />
      <div className="relative flex flex-col items-center gap-3">
        <div className="flex items-center gap-3 text-3xl font-semibold text-blue-900">
          <span className="rounded-full bg-blue-50 p-2 shadow-sm">{icon}</span>
          <span>{value}</span>
        </div>
        <div className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-500">
          {title}
        </div>
        {formattedPercentage && (
          <div className="mt-1 flex w-full max-w-[200px] flex-col items-center gap-1">
            <span className="text-[11px] font-medium text-blue-700">{formattedPercentage}</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
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
