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
  extractUserDirectoryUsers,
} from "@/utils/api";
import {
  filterUserDirectoryByScope,
  getUserDirectoryFetchScope,
  normalizeDirectoryRole,
} from "@/utils/userDirectoryScope";
import {
  extractClientOptions,
  filterUsersByClientId,
} from "@/utils/directorateClientSelector";
import { Pencil, Check, X, RefreshCw, Trash2 } from "lucide-react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { prioritizeUsersForClient } from "@/utils/userOrdering";
import ExcelJS from "exceljs/dist/exceljs.min.js";
import { showToast } from "@/utils/showToast";
import {
  PANGKAT_OPTIONS,
  SATFUNG_OPTIONS,
  validateNewUser,
} from "@/utils/validateUserForm";
import DirectorateClientSelector from "@/components/DirectorateClientSelector";

const PAGE_SIZE = 50;

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
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [confirmNrpInput, setConfirmNrpInput] = useState("");
  const [deactivateError, setDeactivateError] = useState("");
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [toggleStatusLoadingId, setToggleStatusLoadingId] = useState(null);
  const [deleteEmailLoadingId, setDeleteEmailLoadingId] = useState(null);
  const [isDirectorate, setIsDirectorate] = useState(false);
  const [clientName, setClientName] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  // Directorate client selector state
  const [selectedClientId, setSelectedClientId] = useState("");
  const [availableClients, setAvailableClients] = useState([]);
  const {
    token,
    clientId,
    role: authRole,
    effectiveRole,
    effectiveClientType,
    regionalId,
  } = useAuth();
  const client_id = clientId;
  const role = authRole;
  const normalizedRole = normalizeDirectoryRole(effectiveRole || role);
  const normalizedScope = String(effectiveClientType || "")
    .trim()
    .toUpperCase();
  const profileRequestContext = {
    role: normalizedRole || undefined,
    scope: normalizedScope || undefined,
    regional_id: regionalId ? String(regionalId) : undefined,
  };
  const isDitbinmasClient = client_id === "DITBINMAS";
  const isDitbinmas = isDitbinmasClient && normalizedRole === "ditbinmas";
  const [showAllDitbinmas, setShowAllDitbinmas] = useState(() => !isDitbinmas);

  const columnLabel = isDitbinmasClient
    ? showAllDitbinmas
      ? "Kesatuan"
      : "Divisi"
    : isDirectorate
    ? "Satfung/Divisi"
    : "Satfung";
  const showKesatuanColumn = isDitbinmasClient && showAllDitbinmas;

  const { error, isLoading, mutate } = useSWR(
    token && client_id
      ? ["user-directory", token, client_id, regionalId]
      : null,
    async ([_, tk, cid]) => {
      if (!tk) throw new Error("Token tidak ditemukan. Silakan login ulang.");
      if (!cid) throw new Error("Client ID tidak ditemukan.");
      const profileRes = await getClientProfile(tk, cid, undefined, profileRequestContext);
      const profile = profileRes.client || profileRes.profile || profileRes || {};
      const resolvedRegionalId =
        regionalId ??
        profile.regional_id ??
        profile.regionalId ??
        profile.regionalID ??
        profile.regional;
      const normalizedRegionalId = resolvedRegionalId
        ? String(resolvedRegionalId)
        : undefined;
      const rawClientType = (profile.client_type || "").toUpperCase();
      const scope = getUserDirectoryFetchScope({
        role: normalizedRole || undefined,
        clientType: rawClientType,
      });
      const directoryRes = await getUserDirectory(tk, cid, {
        role: normalizedRole || undefined,
        scope,
        regional_id: normalizedRegionalId,
      });
      return { directoryRes, profile };
    },
    {
      refreshInterval: 10000,
      onSuccess: async (res) => {
        let arr = extractUserDirectoryUsers(res.directoryRes);
        const profile = res.profile || {};
        const rawClientType = (profile.client_type || "").toUpperCase();
        const normalizedEffectiveClientType = String(
          rawClientType || effectiveClientType,
        ).toUpperCase();
        const { users: scopedUsers, scope } = filterUserDirectoryByScope(arr, {
          clientId: client_id,
          role: normalizedRole,
          effectiveClientType: normalizedEffectiveClientType,
        });
        arr = scopedUsers;
        const dir = scope === "DIREKTORAT";
        setIsDirectorate(dir && !isDitbinmas);
        setClientName(
          profile.nama_client ||
            profile.client_name ||
            profile.client ||
            profile.nama ||
            client_id,
        );

        if (dir && !isDitbinmas) {
          const nameMap = await getClientNames(
            token,
            arr.map((u) =>
              String(u.client_id || u.clientId || u.clientID || u.client || ""),
            ),
            undefined,
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

          // Extract available clients for the selector
          const clients = extractClientOptions(arr);
          setAvailableClients(clients);
        } else {
          setAvailableClients([]);
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

  const sortedUsers = useMemo(() => {
    const baseSorted = [...users].sort(compareUsersByPangkatAndNrp);
    return prioritizeUsersForClient(baseSorted, client_id);
  }, [users, client_id]);

  const rekapUsers = useMemo(() => {
    const grouped = {};
    
    // Apply client filter for directorate scope
    const clientFilteredUsers = isDirectorate
      ? filterUsersByClientId(sortedUsers, selectedClientId)
      : sortedUsers;
    
    clientFilteredUsers
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
  }, [sortedUsers, isDitbinmasClient, showAllDitbinmas, isDirectorate, selectedClientId]);

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

  const pangkatOptions = useMemo(
    () => ({
      main: PANGKAT_OPTIONS.filter((option) => option !== "PHL"),
      hasPHL: PANGKAT_OPTIONS.includes("PHL"),
    }),
    [],
  );

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

  function openDeactivateModal(user) {
    setDeactivateTarget(user);
    setConfirmNrpInput("");
    setDeactivateError("");
    setIsDeactivateOpen(true);
  }

  function closeDeactivateModal() {
    setIsDeactivateOpen(false);
    setDeactivateTarget(null);
    setConfirmNrpInput("");
    setDeactivateError("");
  }

  async function handleConfirmDeactivate() {
    const targetId = String(deactivateTarget?.user_id || "").replace(/\D/g, "");
    const normalizedInput = confirmNrpInput.replace(/\D/g, "");
    if (!normalizedInput) {
      setDeactivateError("NRP/NIP wajib diisi untuk konfirmasi.");
      return;
    }
    if (normalizedInput !== targetId) {
      setDeactivateError("NRP/NIP tidak cocok dengan user yang dipilih.");
      return;
    }
    setDeactivateLoading(true);
    setDeactivateError("");
    try {
      await updateUser(token || "", deactivateTarget.user_id, { status: false });
      await mutate();
      showToast("User berhasil dinonaktifkan", "success");
      closeDeactivateModal();
    } catch (err) {
      setDeactivateError(err.message || "Gagal menonaktifkan user");
    }
    setDeactivateLoading(false);
  }

  async function handleActivateUser(user) {
    setToggleStatusLoadingId(user.user_id);
    try {
      await updateUser(token || "", user.user_id, { status: true });
      await mutate();
      showToast("User berhasil diaktifkan kembali", "success");
    } catch (err) {
      showToast(err.message || "Gagal mengaktifkan user", "error");
    }
    setToggleStatusLoadingId(null);
  }

  async function handleDeleteEmail(user) {
    if (!confirm(`Apakah Anda yakin ingin menghapus email "${user.email}" untuk ${user.nama || "user ini"}?`)) {
      return;
    }
    setDeleteEmailLoadingId(user.user_id);
    try {
      await updateUser(token || "", user.user_id, { email: null });
      await mutate();
      showToast("Email berhasil dihapus", "success");
    } catch (err) {
      showToast(err.message || "Gagal menghapus email", "error");
    }
    setDeleteEmailLoadingId(null);
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

  async function handleDownloadData() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");
    worksheet.columns = [
      { header: "Nama", key: "nama", width: 40 },
      { header: "NRP/NIP", key: "nrp", width: 16 },
      { header: columnLabel, key: "kesatuan", width: 30 },
      { header: "Username IG", key: "ig", width: 20 },
      { header: "Username TikTok", key: "tiktok", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Status", key: "status", width: 10 },
    ];

    worksheet.addRows(
      users.map((u) => ({
        nama: (u.title ? `${u.title} ` : "") + (u.nama || "-"),
        nrp: u.user_id || "",
        kesatuan: showKesatuanColumn
          ? u.client_id || u.clientId || u.clientID || u.client || "-"
          : u.divisi || "",
        ig: u.insta || "",
        tiktok: u.tiktok || "",
        email: u.email || "",
        status:
          u.status === true || u.status === "true" ? "Aktif" : "Nonaktif",
      })),
    );

    try {
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "user_directory.xlsx";
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(
        "Gagal mengunduh data pengguna: " + (error.message || error),
        "error",
      );
    }
  }

  // Data fetching handled by SWR

  const filtered = useMemo(
    () => {
      // Apply client filter for directorate scope
      const clientFiltered = isDirectorate
        ? filterUsersByClientId(sortedUsers, selectedClientId)
        : sortedUsers;
      
      return clientFiltered
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
            (u.email || "").toLowerCase().includes(term) ||
            String(u.status).toLowerCase().includes(term)
          );
        });
    },
    [
      sortedUsers,
      debouncedSearch,
      isDitbinmasClient,
      showAllDitbinmas,
      statusFilter,
      isDirectorate,
      selectedClientId,
    ],
  );

  const sorted = filtered;

  const isUserActive = (user) =>
    user.status === true || String(user.status).toLowerCase() === "true";

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

          {isDirectorate && !isDitbinmas && (
            <div className="relative mt-4">
              <DirectorateClientSelector
                clients={availableClients}
                selectedClientId={selectedClientId}
                onClientChange={setSelectedClientId}
                label="Pilih Client Direktorat / Satker"
              />
            </div>
          )}

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
                    {showAllDitbinmas 
                      ? `Hanya ${(normalizedRole || client_id || "").toUpperCase()}` 
                      : `Semua ${clientName || client_id || ""}`}
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
                  {pangkatOptions.main.map((p) => (
                    <option key={p} value={p} className="bg-white text-slate-700">
                      {p}
                    </option>
                  ))}
                  {pangkatOptions.hasPHL && (
                    <>
                      <option value="__separator" disabled className="bg-white text-slate-400">
                        ─────────────
                      </option>
                      <option value="PHL" className="bg-white text-slate-700">
                        PHL
                      </option>
                    </>
                  )}
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
            <table className="w-full table-fixed text-sm text-slate-700">
              <thead className="bg-sky-50 text-slate-600">
                <tr className="text-left text-xs uppercase tracking-wider">
                  <th className="w-16 px-4 py-3 font-medium whitespace-normal break-words">No</th>
                  <th className="w-48 px-4 py-3 font-medium whitespace-normal break-words">Nama</th>
                  <th className="w-36 px-4 py-3 font-medium whitespace-normal break-words">NRP/NIP</th>
                  <th className="w-48 px-4 py-3 font-medium whitespace-normal break-words">{columnLabel}</th>
                  <th className="w-40 px-4 py-3 font-medium whitespace-normal break-words">Instagram</th>
                  <th className="w-40 px-4 py-3 font-medium whitespace-normal break-words">TikTok</th>
                  <th className="w-56 px-4 py-3 font-medium whitespace-normal break-words">Email</th>
                  <th className="w-32 px-4 py-3 font-medium whitespace-normal break-words">Status</th>
                  <th className="w-32 px-4 py-3 font-medium whitespace-normal break-words">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((u, idx) => (
                  <tr
                    key={u.user_id || idx}
                    className={`border-t border-slate-200 transition hover:bg-sky-50 ${editingRowId === u.user_id ? "bg-sky-100/60" : "bg-transparent"}`}
                  >
                    <td className="px-4 py-3 text-slate-600 whitespace-normal break-words">
                      {(page - 1) * PAGE_SIZE + idx + 1}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-normal break-words">
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
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-normal break-words">
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
                    <td className="px-4 py-3 text-slate-600 whitespace-normal break-words">
                      {showKesatuanColumn ? (
                        u.client_id || u.clientId || u.clientID || u.client || "-"
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
                    <td className="px-4 py-3 font-mono text-sky-500 whitespace-normal break-words">
                      {u.insta ? `@${u.insta}` : "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-purple-500 whitespace-normal break-words">
                      {u.tiktok || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-normal break-words">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex-1 truncate">{u.email || "-"}</span>
                        {u.email && (
                          <button
                            onClick={() => handleDeleteEmail(u)}
                            disabled={deleteEmailLoadingId === u.user_id}
                            className="rounded-lg border border-rose-200 bg-rose-100 p-1.5 text-rose-600 transition hover:bg-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                            type="button"
                            aria-label={`Hapus email ${u.nama || "user"}`}
                            title="Hapus email"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-normal break-words">
                      {isUserActive(u) ? (
                        <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-normal break-words">
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
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleEditClick(u)}
                            className="rounded-lg border border-sky-200 bg-sky-100 p-2 text-sky-600 transition hover:bg-sky-200"
                            type="button"
                            aria-label={`Edit data ${u.nama || "user"}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          {isUserActive(u) ? (
                            <button
                              onClick={() => openDeactivateModal(u)}
                              className="rounded-lg border border-rose-200 bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-200"
                              type="button"
                              aria-label={`Nonaktifkan ${u.nama || "user"}`}
                            >
                              Nonaktifkan
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivateUser(u)}
                              className="rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                              type="button"
                              disabled={toggleStatusLoadingId === u.user_id}
                              aria-label={`Aktifkan kembali ${u.nama || "user"}`}
                            >
                              {toggleStatusLoadingId === u.user_id
                                ? "Mengaktifkan..."
                                : "Aktifkan kembali"}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {editingRowId && updateError && (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-4 py-3 text-sm text-rose-500"
                      role="alert"
                    >
                      {updateError}
                    </td>
                  </tr>
                )}
                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-4 py-8 text-center text-slate-500">
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
      {isDeactivateOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="deactivate-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Konfirmasi Nonaktifkan User
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Masukkan NRP/NIP{" "}
                  <span className="font-semibold text-slate-900">
                    {deactivateTarget?.user_id || "-"}
                  </span>{" "}
                  untuk menonaktifkan {deactivateTarget?.nama || "user"}.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeactivateModal}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Tutup konfirmasi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                NRP/NIP
              </label>
              <input
                type="text"
                value={confirmNrpInput}
                onChange={(e) =>
                  setConfirmNrpInput(e.target.value.replace(/\D/g, ""))
                }
                inputMode="numeric"
                pattern="[0-9]*"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
                placeholder="Masukkan NRP/NIP"
              />
              {deactivateError && (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">
                  {deactivateError}
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeactivateModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                disabled={deactivateLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="rounded-xl bg-gradient-to-r from-rose-400 via-rose-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-rose-500 hover:via-rose-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={deactivateLoading}
              >
                {deactivateLoading ? "Memproses..." : "Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}
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
