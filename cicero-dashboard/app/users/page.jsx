"use client";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import usePersistentState from "@/hooks/usePersistentState";
import {
  getUserDirectory,
  getClientProfile,
  getClientNames,
  extractUserDirectoryUsers,
} from "@/utils/api";
import {
  filterUserDirectoryByScope,
  getUserDirectoryFetchScope,
  normalizeDirectoryRole,
} from "@/utils/userDirectoryScope";
import {
  extractClientOptions,
  normalizeClientId,
  normalizeUsersWithClientLabel,
} from "@/utils/directorateClientSelector";
import { RefreshCw } from "lucide-react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { useUserDirectoryFilters } from "@/hooks/useUserDirectoryFilters";
import { useUserDirectoryActions } from "@/hooks/useUserDirectoryActions";
import {
  PANGKAT_OPTIONS,
  SATFUNG_OPTIONS,
} from "@/utils/validateUserForm";
import DirectorateClientSelector from "@/components/DirectorateClientSelector";
import UserDirectoryCardList from "@/components/users/UserDirectoryCardList";
import UserDirectoryTable from "@/components/users/UserDirectoryTable";
import UserDirectoryPagination from "@/components/users/UserDirectoryPagination";
import DeactivateUserModal from "@/components/users/DeactivateUserModal";

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
  const isOriginalDirectorateRole =
    String(effectiveClientType || "").trim().toUpperCase() === "DIREKTORAT" &&
    normalizedRole !== "operator";


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
          const clientIds = arr
            .map((u) => normalizeClientId(u))
            .filter((cid) => cid !== "");
          const nameMap = await getClientNames(token, clientIds, undefined);
          arr = normalizeUsersWithClientLabel(arr, {
            fallbackNameByClientId: nameMap,
          });

          // Extract available clients for the selector
          const clients = extractClientOptions(arr, {
            fallbackNameByClientId: nameMap,
          });
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

  const {
    filtered,
    rekapFilteredUsers,
    summaryStats,
    isUserActive,
  } = useUserDirectoryFilters({
    users,
    clientId: client_id,
    isDirectorate,
    selectedClientId,
    isDitbinmasClient,
    showAllDitbinmas,
    statusFilter,
    debouncedSearch,
  });

  const pangkatOptions = useMemo(
    () => ({
      main: PANGKAT_OPTIONS.filter((option) => option !== "PHL"),
      hasPHL: PANGKAT_OPTIONS.includes("PHL"),
    }),
    [],
  );

  function handleEditClick(user) {
    setEditingRowId(user.user_id);
    setEditNama(user.nama || "");
    setEditPangkat(user.title || "");
    setEditNrpNip((user.user_id || "").replace(/\D/g, ""));
    setEditSatfung(user.divisi || "");
    setUpdateError("");
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

  const {
    handleSubmit,
    handleUpdateRow,
    handleConfirmDeactivate,
    handleActivateUser,
    handleCopyRekap,
  } = useUserDirectoryActions({
    token,
    clientId: client_id,
    clientName,
    rekapFilteredUsers,
    mutate,
    submitForm: { nama, pangkat, nrpNip, satfung, polsekName },
    editForm: { editNama, editPangkat, editNrpNip, editSatfung },
    deactivateForm: { deactivateTarget, confirmNrpInput },
    setters: {
      setSubmitError,
      setSubmitLoading,
      setNama,
      setPangkat,
      setNrpNip,
      setSatfung,
      setPolsekName,
      setShowForm,
      setUpdateLoading,
      setUpdateError,
      setEditingRowId,
      setDeactivateLoading,
      setDeactivateError,
      setToggleStatusLoadingId,
      closeDeactivateModal,
    },
  });

  // Data fetching handled by SWR

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
            <SummaryCard
              label="Update Instagram"
              value={summaryStats.insta}
              tone="info"
              note={formatPercentage(summaryStats.insta, summaryStats.total)}
            />
            <SummaryCard
              label="Update TikTok"
              value={summaryStats.tiktok}
              tone="pink"
              note={formatPercentage(summaryStats.tiktok, summaryStats.total)}
            />
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
                <label className="flex w-full min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm transition focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-200 sm:ml-auto sm:w-auto">
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

          <UserDirectoryCardList
            currentRows={currentRows}
            page={page}
            pageSize={PAGE_SIZE}
            editingRowId={editingRowId}
            editPangkat={editPangkat}
            editNama={editNama}
            editNrpNip={editNrpNip}
            editSatfung={editSatfung}
            updateLoading={updateLoading}
            updateError={updateError}
            showKesatuanColumn={showKesatuanColumn}
            columnLabel={columnLabel}
            isOriginalDirectorateRole={isOriginalDirectorateRole}
            toggleStatusLoadingId={toggleStatusLoadingId}
            isUserActive={isUserActive}
            setEditPangkat={setEditPangkat}
            setEditNama={setEditNama}
            setEditNrpNip={setEditNrpNip}
            setEditSatfung={setEditSatfung}
            setEditingRowId={setEditingRowId}
            handleUpdateRow={handleUpdateRow}
            handleEditClick={handleEditClick}
            openDeactivateModal={openDeactivateModal}
            handleActivateUser={handleActivateUser}
          />

          <UserDirectoryTable
            currentRows={currentRows}
            page={page}
            pageSize={PAGE_SIZE}
            columnLabel={columnLabel}
            showKesatuanColumn={showKesatuanColumn}
            editingRowId={editingRowId}
            editPangkat={editPangkat}
            editNama={editNama}
            editNrpNip={editNrpNip}
            editSatfung={editSatfung}
            updateLoading={updateLoading}
            updateError={updateError}
            isOriginalDirectorateRole={isOriginalDirectorateRole}
            toggleStatusLoadingId={toggleStatusLoadingId}
            isUserActive={isUserActive}
            setEditPangkat={setEditPangkat}
            setEditNama={setEditNama}
            setEditNrpNip={setEditNrpNip}
            setEditSatfung={setEditSatfung}
            setEditingRowId={setEditingRowId}
            handleUpdateRow={handleUpdateRow}
            handleEditClick={handleEditClick}
            openDeactivateModal={openDeactivateModal}
            handleActivateUser={handleActivateUser}
          />

          <UserDirectoryPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          />
        </div>
      </div>
      <DeactivateUserModal
        isOpen={isDeactivateOpen}
        deactivateTarget={deactivateTarget}
        confirmNrpInput={confirmNrpInput}
        deactivateError={deactivateError}
        deactivateLoading={deactivateLoading}
        setConfirmNrpInput={setConfirmNrpInput}
        onClose={closeDeactivateModal}
        onConfirm={handleConfirmDeactivate}
      />
    </div>
  );
}

function SummaryCard({ label, value, tone = "primary", note = "" }) {
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
        {note ? <span className="text-xs text-slate-600">{note}</span> : null}
      </div>
    </div>
  );
}

function formatPercentage(value, total) {
  if (!total) return "0% dari Total User";
  const percentage = (value / total) * 100;
  return `${percentage.toFixed(1)}% dari Total User`;
}
