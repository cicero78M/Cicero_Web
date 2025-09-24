"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import usePersistentState from "@/hooks/usePersistentState";
import {
  getUserDirectory,
  createUser,
  updateUser,
  getClientProfile,
  getClientNames,
  updateUserRoles,
} from "@/utils/api";
import { Pencil, Check, X, RefreshCw } from "lucide-react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import * as XLSX from "xlsx";
import { showToast } from "@/utils/showToast";
import { validateNewUser } from "@/utils/validateUserForm";

const PAGE_SIZE = 50;

const PANGKAT_OPTIONS = [
  "BHARADA",
  "BHARATU",
  "BHARAKA",
  "BRIPDA",
  "BRIPTU",
  "BRIGADIR",
  "BRIPKA",
  "AIPDA",
  "AIPTU",
  "IPDA",
  "IPTU",
  "AKP",
  "KOMPOL",
  "AKBP",
  "KOMISARIS BESAR POLISI",
  "JURU MUDA",
  "JURU MUDA TINGKAT I",
  "JURU",
  "JURU TINGKAT I",
  "PENGATUR MUDA",
  "PENGATUR MUDA TINGKAT I",
  "PENGATUR",
  "PENGATUR TINGKAT I",
  "PENATA MUDA",
  "PENATA MUDA TINGKAT I",
  "PENATA",
  "PENATA TINGKAT I",
  "PEMBINA",
  "PEMBINA TINGKAT I",
  "PEMBINA UTAMA MUDA",
  "PEMBINA UTAMA MADYA",
  "PEMBINA UTAMA",
];

const SATFUNG_OPTIONS = [
  "BAG LOG",
  "BAG SDM",
  "BAG REN",
  "BAG OPS",
  "SAT SAMAPTA",
  "SAT RESKRIM",
  "SAT INTEL",
  "SAT NARKOBA",
  "SAT BINMAS",
  "SAT LANTAS",
  "SI UM",
  "SI TIK",
  "SI WAS",
  "SI PROPAM",
  "SI DOKES",
  "SPKT",
  "SAT TAHTI",
  "DITBINMAS",
  "SUBBAGRENMIN",
  "BAGBINOPSNAL",
  "SUBDIT BINPOLMAS",
  "SUBDIT SATPAMPOLSUS",
  "SUBDIT BHABINKAMTIBMAS",
  "SUBDIT BINTIBSOS",
  "POLSEK",
];

export default function UserDirectoryPage() {
  useRequireAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = usePersistentState("users_page", 1);

  const [showForm, setShowForm] = useState(false);
  // state for new user form
  const [nama, setNama] = useState("");
  const [pangkat, setPangkat] = useState("");
  const [nrpNip, setNrpNip] = useState("");
  const [satfung, setSatfung] = useState("");
  const [polsekName, setPolsekName] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // inline edit state
  const [editingRowId, setEditingRowId] = useState(null);
  const [editNama, setEditNama] = useState("");
  const [editPangkat, setEditPangkat] = useState("");
  const [editNrpNip, setEditNrpNip] = useState("");
  const [editSatfung, setEditSatfung] = useState("");
  const [updateError, setUpdateError] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [isDirectorate, setIsDirectorate] = useState(false);
  const [clientName, setClientName] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const { token, clientId, role: authRole } = useAuth();
  const client_id = clientId || "BOJONEGORO";
  const role = authRole || "";

  const isDitbinmasClient = client_id === "DITBINMAS";
  const isDitbinmas =
    isDitbinmasClient && String(role).toLowerCase() === "ditbinmas";
  const [showAllDitbinmas, setShowAllDitbinmas] = useState(() => !isDitbinmas);

  const columnLabel = isDitbinmasClient
    ? showAllDitbinmas
      ? "Kesatuan"
      : "Divisi"
    : isDirectorate
    ? "Kesatuan"
    : "Satfung";
  const showKesatuanColumn = columnLabel === "Kesatuan";

  const { error, isLoading, mutate } = useSWR(
    token && client_id ? ["user-directory", token, client_id] : null,
    ([_, tk, cid]) => {
      if (!tk) throw new Error("Token tidak ditemukan. Silakan login ulang.");
      if (!cid) throw new Error("Client ID tidak ditemukan.");
      return getUserDirectory(tk, cid);
    },
    {
      refreshInterval: 10000,
      onSuccess: async (res) => {
        let data = res.data || res.users || res;
        let arr = Array.isArray(data) ? data : [];

        const profileRes = await getClientProfile(token, client_id);
        const profile = profileRes.client || profileRes.profile || profileRes || {};
        const dir = (profile.client_type || "").toUpperCase() === "DIREKTORAT";
        setIsDirectorate(dir && !isDitbinmas);
        setClientName(
          profile.nama_client ||
            profile.client_name ||
            profile.client ||
            profile.nama ||
            client_id,
        );

        if (dir) {
          const nameMap = await getClientNames(
            token,
            arr.map((u) =>
              String(u.client_id || u.clientId || u.clientID || u.client || ""),
            ),
          );
          arr = arr.map((u) => ({
            ...u,
            nama_client:
              nameMap[
                String(u.client_id || u.clientId || u.clientID || u.client || "")
              ] ||
              u.nama_client ||
              u.client_name ||
              u.client,
          }));
        }

        setUsers(arr);
      },
    },
  );

  useEffect(() => {
    const interval = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);

    return () => clearTimeout(handler);
  }, [search]);

  const sortedUsers = useMemo(
    () => [...users].sort(compareUsersByPangkatAndNrp),
    [users],
  );

  const rekapUsers = useMemo(() => {
    const grouped = {};
    sortedUsers
      .filter((u) => {
        if (isDitbinmasClient && !showAllDitbinmas) {
          const cid = String(
            u.client_id || u.clientId || u.clientID || u.client || "",
          ).toUpperCase();
          return cid === "DITBINMAS";
        }
        return true;
      })
      .forEach((u) => {
        const key = u.divisi || "-";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(u);
    });
    return grouped;
  }, [sortedUsers, isDitbinmasClient, showAllDitbinmas]);

  const summaryStats = useMemo(() => {
    const list = Object.values(rekapUsers).flat();
    const total = list.length;
    const aktif = list.filter(
      (u) => u.status === true || String(u.status).toLowerCase() === "true",
    ).length;
    const nonaktif = total - aktif;
    const insta = list.filter((u) => Boolean(u.insta)).length;
    const tiktok = list.filter((u) => Boolean(u.tiktok)).length;

    return { total, aktif, nonaktif, insta, tiktok };
  }, [rekapUsers]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitError("");
    setSubmitLoading(true);
    try {
      const { error: validationError, nrpNip: trimmedNrpNip, satfungValue } =
        validateNewUser({ nama, pangkat, nrpNip, satfung, polsekName });
      if (validationError) {
        throw new Error(validationError);
      }
      await createUser(token || "", {
        client_id,
        nama,
        title: pangkat,
        user_id: trimmedNrpNip,
        divisi: satfungValue,
      });
      setNama("");
      setPangkat("");
      setNrpNip("");
      setSatfung("");
      setPolsekName("");
      setShowForm(false);
      showToast("User berhasil ditambahkan", "success");
      mutate();
    } catch (err) {
      setSubmitError(err.message || "Gagal menambah user");
    }
    setSubmitLoading(false);
  }

  function handleEditClick(user) {
    setEditingRowId(user.user_id);
    setEditNama(user.nama || "");
    setEditPangkat(user.title || "");
    setEditNrpNip((user.user_id || "").trim());
    setEditSatfung(user.divisi || "");
    setUpdateError("");
  }

  async function handleUpdateRow(userId) {
    setUpdateLoading(true);
    setUpdateError("");
    try {
      const trimmedNrpNip = editNrpNip.trim();
      await updateUser(token || "", userId, {
        nama: editNama,
        title: editPangkat,
        divisi: editSatfung,
        user_id: trimmedNrpNip,
      });
      if (userId !== trimmedNrpNip) {
        await updateUserRoles(token || "", userId, trimmedNrpNip);
      }
      await mutate();
      setEditingRowId(null);
      showToast("Data user berhasil diperbarui", "success");
    } catch (err) {
      setUpdateError(err.message || "Gagal mengubah user");
    }
    setUpdateLoading(false);
  }

  async function handleCopyRekap() {
    const now = new Date();
    const day = now.toLocaleDateString("id-ID", { weekday: "long" });
    const date = now.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const time = now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const allUsers = Object.values(rekapUsers).flat();
    const totalUser = allUsers.length;
    const totalUpdateIG = allUsers.filter((u) => u.insta).length;
    const totalUpdateTiktok = allUsers.filter((u) => u.tiktok).length;
    const totalBelumUpdate = allUsers.filter(
      (u) => !u.insta && !u.tiktok,
    ).length;

    const lines = [
      `Client Name: ${clientName || "-"}`,
      `${day}, ${date} ${time}`,
      "",
      `Total User : ${totalUser}`,
      `Update Instagram : ${totalUpdateIG}`,
      `Update Tiktok : ${totalUpdateTiktok}`,
      `Belum Update : ${totalBelumUpdate}`,
      "",
      "Rincian",
      "",
    ];
    Object.entries(rekapUsers).forEach(([sf, list]) => {
      lines.push(`*${sf}*`);
      list.forEach((u) => {
        lines.push(
          `${u.title ? `${u.title} ` : ""}${u.nama || "-"}, IG ${
            u.insta || "Kosong"
          }, Tiktok ${u.tiktok || "Kosong"}`,
        );
      });
      lines.push("");
    });
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      showToast("Rekap user berhasil disalin ke clipboard", "success");
    } catch (err) {
      showToast(
        "Gagal menyalin rekap user: " + (err.message || err),
        "error",
      );
    }
  }

  function handleDownloadData() {
    const data = users.map((u) => ({
      Nama: (u.title ? `${u.title} ` : "") + (u.nama || "-"),
      "NRP/NIP": u.user_id || "",
      [columnLabel]: showKesatuanColumn
        ? u.nama_client || u.client_name || u.client || u.nama || "-"
        : u.divisi || "",
      "Username IG": u.insta || "",
      "Username TikTok": u.tiktok || "",
      Status:
        u.status === true || u.status === "true" ? "Aktif" : "Nonaktif",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Users");
    XLSX.writeFile(workbook, "user_directory.xlsx");
  }

  // Data fetching handled by SWR

  const filtered = useMemo(
    () =>
      sortedUsers
        .filter((u) => {
          if (isDitbinmasClient && !showAllDitbinmas) {
            return (
              String(
                u.client_id || u.clientId || u.clientID || u.client || "",
              ).toUpperCase() === "DITBINMAS"
            );
          }
          return true;
        })
        .filter((u) => {
          if (statusFilter === "ALL") return true;
          const isActive =
            u.status === true || String(u.status).toLowerCase() === "true";
          if (statusFilter === "ACTIVE") return isActive;
          if (statusFilter === "INACTIVE") return !isActive;
          return true;
        })
        .filter((u) => {
          if (!debouncedSearch) return true;
          const term = debouncedSearch.toLowerCase();
          return (
            (u.nama_client || u.nama || "")
              .toLowerCase()
              .includes(term) ||
            (u.title || "").toLowerCase().includes(term) ||
            (u.user_id || "").toLowerCase().includes(term) ||
            (u.divisi || "")
              .toLowerCase()
              .includes(term) ||
            (u.insta || "").toLowerCase().includes(term) ||
            (u.tiktok || "").toLowerCase().includes(term) ||
            String(u.status).toLowerCase().includes(term)
          );
        }),
    [
      sortedUsers,
      debouncedSearch,
      isDitbinmasClient,
      showAllDitbinmas,
      statusFilter,
    ],
  );

  const sorted = filtered;

  // Paging logic menggunakan data yang sudah diurutkan
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const currentRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Reset ke halaman 1 saat filter berubah
    useEffect(
      () => setPage(1),
      [debouncedSearch, statusFilter, showAllDitbinmas, setPage],
    );

  // Pastikan halaman tetap valid saat totalPages berubah
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages || 1);
    }
  }, [page, totalPages, setPage]);

  const day = currentDate.toLocaleDateString("id-ID", { weekday: "long" });
  const dateStr = currentDate.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = currentDate.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isLoading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <div className="rounded-3xl border border-red-500/40 bg-red-500/10 px-6 py-5 text-sm font-semibold shadow-lg backdrop-blur-md">
          {error.message || String(error)}
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-[-10rem] h-[26rem] w-[26rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute inset-x-0 top-1/3 h-1/3 bg-gradient-to-b from-slate-900/0 via-slate-900/40 to-slate-950" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.35em] text-cyan-300/70">User Directory</span>
          <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">User Matrix</h1>
          <p className="max-w-2xl text-sm text-slate-300">
            Kelola personel dan pantau aktivitas akun melalui antarmuka futuristik yang selaras dengan pusat kendali
            dashboard.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/60 p-6 shadow-[0_0_40px_rgba(14,165,233,0.25)] backdrop-blur-xl sm:p-8">
          <div className="absolute inset-x-12 top-0 h-36 bg-gradient-to-b from-slate-200/10 via-transparent to-transparent blur-3xl" />
          <button
            onClick={() => mutate()}
            className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-slate-900/70 text-cyan-200 shadow-lg transition hover:border-cyan-300 hover:text-cyan-100"
            aria-label="Refresh"
            type="button"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          <div className="relative flex flex-col gap-2 pr-14 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-100">Directory Overview</h2>
              <p className="text-sm text-slate-400">
                Client Name: {clientName || "-"} | {day}, {dateStr} {timeStr}
              </p>
            </div>
            <div className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
              Real-time sync
            </div>
          </div>

          <div className="relative mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard label="Total User" value={summaryStats.total} tone="primary" />
            <SummaryCard label="Aktif" value={summaryStats.aktif} tone="success" />
            <SummaryCard label="Nonaktif" value={summaryStats.nonaktif} tone="muted" />
            <SummaryCard label="Update Instagram" value={summaryStats.insta} tone="info" />
            <SummaryCard label="Update TikTok" value={summaryStats.tiktok} tone="pink" />
          </div>

          <div className="relative mt-6 flex flex-col gap-4">
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/70 p-4 shadow-inner backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setShowForm((s) => !s);
                  }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500/80 via-sky-500/70 to-blue-600/70 px-4 py-2 text-sm font-medium text-slate-50 shadow-lg ring-1 ring-cyan-400/40 transition hover:from-cyan-400 hover:via-sky-400 hover:to-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                  type="button"
                >
                  {showForm ? "Tutup" : "Tambah User"}
                </button>
                <button
                  onClick={handleCopyRekap}
                  className="rounded-xl bg-gradient-to-r from-emerald-500/70 to-teal-500/70 px-4 py-2 text-sm font-medium text-slate-50 shadow-lg ring-1 ring-emerald-400/40 transition hover:from-emerald-400 hover:to-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                  type="button"
                >
                  Rekap User
                </button>
                <button
                  onClick={handleDownloadData}
                  className="rounded-xl bg-gradient-to-r from-fuchsia-500/70 to-purple-600/70 px-4 py-2 text-sm font-medium text-slate-50 shadow-lg ring-1 ring-fuchsia-400/40 transition hover:from-fuchsia-400 hover:to-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-300"
                  type="button"
                >
                  Download Data
                </button>
                {isDitbinmasClient && (
                  <button
                    onClick={() => setShowAllDitbinmas((s) => !s)}
                    className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 shadow-inner transition hover:border-cyan-400/40 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                    type="button"
                  >
                    {showAllDitbinmas ? "Hanya DITBINMAS" : "Semua Ditbinmas"}
                  </button>
                )}
                <label className="ml-auto flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 shadow-inner transition focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/40">
                  <span className="sr-only">Cari pengguna</span>
                  <input
                    type="search"
                    placeholder="Cari berdasarkan nama, NRP, divisi, atau username"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                    aria-label="Pencarian pengguna"
                  />
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-700/60 bg-slate-900/80 px-4 py-2 text-sm text-slate-100 shadow-inner transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  aria-label="Filter status user"
                >
                  <option value="ALL" className="bg-slate-900 text-slate-100">
                    Semua Status
                  </option>
                  <option value="ACTIVE" className="bg-slate-900 text-slate-100">
                    Aktif
                  </option>
                  <option value="INACTIVE" className="bg-slate-900 text-slate-100">
                    Nonaktif
                  </option>
                </select>
              </div>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/70 p-4 shadow-inner backdrop-blur md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="rounded-xl border border-slate-700/60 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
                <select
                  value={pangkat}
                  onChange={(e) => setPangkat(e.target.value)}
                  required
                  className="rounded-xl border border-slate-700/60 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                >
                  <option value="" className="bg-slate-900 text-slate-100">
                    Pilih Pangkat
                  </option>
                  {PANGKAT_OPTIONS.map((p) => (
                    <option key={p} value={p} className="bg-slate-900 text-slate-100">
                      {p}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="NRP/NIP"
                  value={nrpNip}
                  onChange={(e) => setNrpNip(e.target.value.replace(/[^0-9]/g, ""))}
                  inputMode="numeric"
                  pattern="\\d*"
                  required
                  className="rounded-xl border border-slate-700/60 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
                <select
                  value={satfung}
                  onChange={(e) => {
                    setSatfung(e.target.value);
                    if (e.target.value !== "POLSEK") setPolsekName("");
                  }}
                  required
                  className="rounded-xl border border-slate-700/60 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                >
                  <option value="" className="bg-slate-900 text-slate-100">
                    Pilih {columnLabel}
                  </option>
                  {SATFUNG_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-slate-900 text-slate-100">
                      {s}
                    </option>
                  ))}
                </select>
                {satfung === "POLSEK" && (
                  <input
                    type="text"
                    placeholder="Nama Polsek"
                    value={polsekName}
                    onChange={(e) => setPolsekName(e.target.value)}
                    required
                    className="rounded-xl border border-slate-700/60 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 shadow-inner transition focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 md:col-span-2"
                  />
                )}
                {submitError && (
                  <div
                    className="md:col-span-2 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300"
                    role="alert"
                    aria-live="polite"
                  >
                    {submitError}
                  </div>
                )}
                <div className="md:col-span-2 flex gap-2">
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-slate-50 shadow-lg ring-1 ring-cyan-400/40 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300 ${submitLoading ? "cursor-not-allowed bg-cyan-500/40" : "bg-gradient-to-r from-cyan-500/80 via-sky-500/70 to-blue-600/70 hover:from-cyan-400 hover:via-sky-400 hover:to-blue-500"}`
                  >
                    {submitLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                    }}
                    className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-2 text-sm font-medium text-slate-200 shadow-inner transition hover:border-cyan-400/40 hover:text-cyan-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="relative mt-6 overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-900/70 shadow-2xl backdrop-blur">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/80 text-slate-300">
                <tr className="text-left text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">No</th>
                  <th className="px-4 py-3 font-medium">Nama</th>
                  <th className="px-4 py-3 font-medium">NRP/NIP</th>
                  <th className="px-4 py-3 font-medium">{columnLabel}</th>
                  <th className="px-4 py-3 font-medium">Instagram</th>
                  <th className="px-4 py-3 font-medium">TikTok</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((u, idx) => (
                  <tr
                    key={u.user_id || idx}
                    className={`border-t border-slate-800/60 transition hover:bg-slate-800/50 ${editingRowId === u.user_id ? "bg-cyan-500/10" : "bg-transparent"}`}
                  >
                    <td className="px-4 py-3 text-slate-300">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3 text-slate-100">
                      {editingRowId === u.user_id ? (
                        <div className="flex gap-2">
                          <input
                            value={editPangkat}
                            onChange={(e) => setEditPangkat(e.target.value)}
                            placeholder="Pangkat"
                            className="w-24 rounded-lg border border-slate-700/60 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 shadow-inner focus:border-cyan-400 focus:outline-none"
                          />
                          <input
                            value={editNama}
                            onChange={(e) => setEditNama(e.target.value)}
                            placeholder="Nama"
                            className="flex-1 rounded-lg border border-slate-700/60 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 shadow-inner focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                      ) : (
                        (u.title ? `${u.title} ` : "") + (u.nama || "-")
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-200">
                      {editingRowId === u.user_id ? (
                        <input
                          value={editNrpNip}
                          onChange={(e) => setEditNrpNip(e.target.value.trim())}
                          placeholder="NRP/NIP"
                          className="w-32 rounded-lg border border-slate-700/60 bg-slate-900/70 px-2 py-1 text-xs font-mono text-slate-100 shadow-inner focus:border-cyan-400 focus:outline-none"
                        />
                      ) : (
                        u.user_id || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-200">
                      {showKesatuanColumn ? (
                        u.nama_client || u.client_name || u.client || u.nama || "-"
                      ) : editingRowId === u.user_id ? (
                        <input
                          value={editSatfung}
                          onChange={(e) => setEditSatfung(e.target.value)}
                          placeholder={columnLabel}
                          className="w-full rounded-lg border border-slate-700/60 bg-slate-900/70 px-2 py-1 text-xs text-slate-100 shadow-inner focus:border-cyan-400 focus:outline-none"
                        />
                      ) : (
                        u.divisi || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-cyan-300">{u.insta ? `@${u.insta}` : "-"}</td>
                    <td className="px-4 py-3 font-mono text-fuchsia-300">{u.tiktok || "-"}</td>
                    <td className="px-4 py-3">
                      {u.status === true || u.status === "true" ? (
                        <span className="inline-flex rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-slate-500/40 bg-slate-500/15 px-3 py-1 text-xs font-medium text-slate-300">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingRowId === u.user_id ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateRow(u.user_id)}
                            disabled={updateLoading}
                            className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 p-2 text-emerald-300 transition hover:border-emerald-300 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            aria-label="Simpan perubahan"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingRowId(null)}
                            className="rounded-lg border border-rose-400/40 bg-rose-500/15 p-2 text-rose-300 transition hover:border-rose-300 hover:text-rose-200"
                            type="button"
                            aria-label="Batalkan perubahan"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(u)}
                          className="rounded-lg border border-cyan-400/40 bg-cyan-500/10 p-2 text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100"
                          type="button"
                          aria-label={`Edit data ${u.nama || "user"}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {editingRowId && updateError && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-3 text-sm text-rose-300"
                      role="alert"
                    >
                      {updateError}
                    </td>
                  </tr>
                )}
                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-400">
                      Tidak ada pengguna
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
              <button
                className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-2 font-semibold shadow-inner transition hover:border-cyan-400/40 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                Prev
              </button>
              <span>
                Halaman <b>{page}</b> dari <b>{totalPages}</b>
              </span>
              <button
                className="rounded-xl border border-slate-700/60 bg-slate-900/70 px-4 py-2 font-semibold shadow-inner transition hover:border-cyan-400/40 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                type="button"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone = "primary" }) {
  const toneStyles = {
    primary:
      "from-cyan-500/30 via-sky-500/20 to-blue-600/30 text-cyan-100 border-cyan-400/40",
    success:
      "from-emerald-500/25 via-emerald-500/15 to-teal-500/25 text-emerald-100 border-emerald-400/40",
    info:
      "from-sky-500/25 via-cyan-500/15 to-slate-500/20 text-sky-100 border-sky-400/40",
    muted:
      "from-slate-500/20 via-slate-600/10 to-slate-800/20 text-slate-200 border-slate-500/40",
    pink:
      "from-fuchsia-500/30 via-pink-500/20 to-purple-600/30 text-pink-100 border-fuchsia-400/40",
  };
  const displayValue =
    typeof value === "number" ? value.toLocaleString("id-ID") : value;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-4 py-4 shadow-lg backdrop-blur ${
        toneStyles[tone] || toneStyles.primary
      }`}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute inset-x-2 top-6 h-16 bg-white/10 blur-3xl" />
      <div className="relative flex flex-col gap-2">
        <span className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-200/70">
          {label}
        </span>
        <span className="text-3xl font-semibold text-slate-50">{displayValue}</span>
      </div>
    </div>
  );
}
