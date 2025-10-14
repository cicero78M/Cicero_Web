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
      const { error: validationError, nrpNip: sanitizedNrpNip, satfungValue } =
        validateNewUser({ nama, pangkat, nrpNip, satfung, polsekName });
      if (validationError) {
        throw new Error(validationError);
      }
      await createUser(token || "", {
        client_id,
        nama,
        title: pangkat,
        user_id: sanitizedNrpNip,
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
    setEditNrpNip((user.user_id || "").replace(/\D/g, ""));
    setEditSatfung(user.divisi || "");
    setUpdateError("");
  }

  async function handleUpdateRow(userId) {
    setUpdateLoading(true);
    setUpdateError("");
    try {
      const sanitizedNrpNip = editNrpNip.replace(/\D/g, "");
      if (!sanitizedNrpNip) {
        throw new Error("NRP/NIP wajib diisi");
      }
      await updateUser(token || "", userId, {
        nama: editNama,
        title: editPangkat,
        divisi: editSatfung,
        user_id: sanitizedNrpNip,
      });
      if (userId !== sanitizedNrpNip) {
        await updateUserRoles(token || "", userId, sanitizedNrpNip);
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 text-slate-700">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-5 text-sm font-semibold text-rose-600 shadow-lg backdrop-blur-md">
          {error.message || String(error)}
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50 text-slate-800">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-20 h-80 w-80 rounded-full bg-sky-100 blur-3xl" />
        <div className="absolute bottom-0 right-[-10rem] h-[26rem] w-[26rem] rounded-full bg-blue-100 blur-3xl" />
        <div className="absolute inset-x-0 top-1/3 h-1/3 bg-gradient-to-b from-transparent via-purple-100/50 to-indigo-100/70" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3">
          <span className="text-xs uppercase tracking-[0.35em] text-sky-500/80">User Directory</span>
          <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">User Matrix</h1>
          <p className="max-w-2xl text-sm text-slate-600">
            Kelola personel dan pantau aktivitas akun Personil.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-sky-200 bg-white/90 p-6 shadow-[0_20px_60px_rgba(15,118,190,0.12)] backdrop-blur-xl sm:p-8">
          <div className="absolute inset-x-12 top-0 h-36 bg-gradient-to-b from-sky-100/60 via-transparent to-transparent blur-3xl" />
          <button
            onClick={() => mutate()}
            className="absolute right-6 top-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-blue-400 to-indigo-400 text-white shadow-lg transition hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500"
            aria-label="Refresh"
            type="button"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          <div className="relative flex flex-col gap-2 pr-14 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Directory Overview</h2>
              <p className="text-sm text-slate-600">
                Client Name: {clientName || "-"} | {day}, {dateStr} {timeStr}
              </p>
            </div>
            <div className="text-xs uppercase tracking-[0.25em] text-sky-500/70">
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
            <div className="flex flex-col gap-3 rounded-2xl border border-sky-200 bg-white/95 p-4 text-slate-700 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setShowForm((s) => !s);
                  }}
                  className="relative overflow-hidden rounded-xl bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 px-4 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-sky-300/50 transition hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
                  type="button"
                >
                  {showForm ? "Tutup" : "Tambah User"}
                </button>
                <button
                  onClick={handleCopyRekap}
                  className="rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 px-4 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-teal-300/50 transition hover:from-teal-500 hover:via-emerald-500 hover:to-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-400"
                  type="button"
                >
                  Rekap User
                </button>
                <button
                  onClick={handleDownloadData}
                  className="rounded-xl bg-gradient-to-r from-fuchsia-400 via-purple-400 to-indigo-400 px-4 py-2 text-sm font-medium text-white shadow-lg ring-1 ring-fuchsia-300/50 transition hover:from-fuchsia-500 hover:via-purple-500 hover:to-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fuchsia-400"
                  type="button"
                >
                  Download Data
                </button>
                {isDitbinmasClient && (
                  <button
                    onClick={() => setShowAllDitbinmas((s) => !s)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-sky-50 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                    type="button"
                  >
                    {showAllDitbinmas ? "Hanya DITBINMAS" : "Semua Ditbinmas"}
                  </button>
                )}
                <label className="ml-auto flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-200">
                  <span className="sr-only">Cari pengguna</span>
                  <input
                    type="search"
                    placeholder="Cari berdasarkan nama, NRP, divisi, atau username"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    aria-label="Pencarian pengguna"
                  />
                </label>
              </div>
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 rounded-2xl border border-sky-200 bg-white p-4 text-slate-700 shadow-sm backdrop-blur md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
                <select
                  value={pangkat}
                  onChange={(e) => setPangkat(e.target.value)}
                  required
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="" className="bg-white text-slate-700">
                    Pilih Pangkat
                  </option>
                  {PANGKAT_OPTIONS.map((p) => (
                    <option key={p} value={p} className="bg-white text-slate-700">
                      {p}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="NRP/NIP"
                  value={nrpNip}
                  onChange={(e) => {
                    const sanitizedValue = e.target.value.replace(/\D/g, "");
                    setNrpNip(sanitizedValue);
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
                <select
                  value={satfung}
                  onChange={(e) => {
                    setSatfung(e.target.value);
                    if (e.target.value !== "POLSEK") setPolsekName("");
                  }}
                  required
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="" className="bg-white text-slate-700">
                    Pilih {columnLabel}
                  </option>
                  {SATFUNG_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-white text-slate-700">
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
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm transition focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 md:col-span-2"
                  />
                )}
                {submitError && (
                  <div
                    className="md:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600"
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
                    className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-sky-300/50 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${submitLoading ? "cursor-not-allowed bg-sky-200 text-slate-500" : "bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 hover:from-sky-500 hover:via-blue-500 hover:to-indigo-500"}`}
                  >
                    {submitLoading ? "Menyimpan..." : "Simpan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                    }}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-sky-50 hover:text-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="relative mt-6 overflow-x-auto overflow-y-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backdrop-blur">
            <table className="min-w-full text-sm text-slate-700">
              <thead className="bg-sky-50 text-slate-600">
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
                    className={`border-t border-slate-200 transition hover:bg-sky-50 ${editingRowId === u.user_id ? "bg-sky-100/60" : "bg-transparent"}`}
                  >
                    <td className="px-4 py-3 text-slate-600">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {editingRowId === u.user_id ? (
                        <div className="flex gap-2">
                          <input
                            value={editPangkat}
                            onChange={(e) => setEditPangkat(e.target.value)}
                            placeholder="Pangkat"
                            className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none"
                          />
                          <input
                            value={editNama}
                            onChange={(e) => setEditNama(e.target.value)}
                            placeholder="Nama"
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none"
                          />
                        </div>
                      ) : (
                        (u.title ? `${u.title} ` : "") + (u.nama || "-")
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {editingRowId === u.user_id ? (
                        <input
                          value={editNrpNip}
                          onChange={(e) =>
                            setEditNrpNip(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="NRP/NIP"
                          className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none"
                        />
                      ) : (
                        u.user_id || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {showKesatuanColumn ? (
                        u.nama_client || u.client_name || u.client || u.nama || "-"
                      ) : editingRowId === u.user_id ? (
                        <input
                          value={editSatfung}
                          onChange={(e) => setEditSatfung(e.target.value)}
                          placeholder={columnLabel}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none"
                        />
                      ) : (
                        u.divisi || "-"
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-sky-500">{u.insta ? `@${u.insta}` : "-"}</td>
                    <td className="px-4 py-3 font-mono text-purple-500">{u.tiktok || "-"}</td>
                    <td className="px-4 py-3">
                      {u.status === true || u.status === "true" ? (
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
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
                            className="rounded-lg border border-emerald-200 bg-emerald-100 p-2 text-emerald-600 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            aria-label="Simpan perubahan"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setEditingRowId(null)}
                            className="rounded-lg border border-rose-200 bg-rose-100 p-2 text-rose-600 transition hover:bg-rose-200"
                            type="button"
                            aria-label="Batalkan perubahan"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditClick(u)}
                          className="rounded-lg border border-sky-200 bg-sky-100 p-2 text-sky-600 transition hover:bg-sky-200"
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
                      className="px-4 py-3 text-sm text-rose-500"
                      role="alert"
                    >
                      {updateError}
                    </td>
                  </tr>
                )}
                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                      Tidak ada pengguna
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 shadow-sm transition hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-semibold text-slate-600 shadow-sm transition hover:bg-sky-50 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
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
      "from-sky-100 via-sky-50 to-blue-100 text-slate-800 border-sky-200",
    success:
      "from-emerald-100 via-teal-50 to-cyan-100 text-emerald-700 border-emerald-200",
    info:
      "from-cyan-100 via-sky-50 to-indigo-100 text-sky-700 border-sky-200",
    muted:
      "from-slate-100 via-blue-50 to-slate-200 text-slate-600 border-slate-200",
    pink:
      "from-rose-100 via-fuchsia-50 to-purple-100 text-purple-700 border-rose-200",
  };
  const displayValue =
    typeof value === "number" ? value.toLocaleString("id-ID") : value;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br px-4 py-4 shadow-lg backdrop-blur ${
        toneStyles[tone] || toneStyles.primary
      }`}
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/60 blur-2xl" />
      <div className="absolute inset-x-2 top-6 h-16 bg-white/40 blur-3xl" />
      <div className="relative flex flex-col gap-2">
        <span className="text-[0.65rem] uppercase tracking-[0.35em] text-slate-500/80">
          {label}
        </span>
        <span className="text-3xl font-semibold text-slate-900">{displayValue}</span>
      </div>
    </div>
  );
}
