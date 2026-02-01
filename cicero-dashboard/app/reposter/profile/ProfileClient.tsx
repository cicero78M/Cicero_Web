"use client";

import { useEffect, useMemo, useState } from "react";
import useReposterAuth from "@/hooks/useReposterAuth";
import {
  getReposterUserProfile,
  isAbortError,
  updateUser,
} from "@/utils/api";
import {
  decodeJwtPayload,
  mergeReposterProfiles,
  normalizeReposterProfile,
  ReposterProfile,
} from "@/utils/reposterProfile";
import { X } from "lucide-react";

const fallbackInitials = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const sanitizeUsername = (value: string) => value.trim().replace(/^@/, "");

type ProfileFormState = {
  name: string;
  rank: string;
  satfung: string;
  jabatan: string;
  instagramUsername: string;
  tiktokUsername: string;
  email: string;
};

const emptyFormState: ProfileFormState = {
  name: "",
  rank: "",
  satfung: "",
  jabatan: "",
  instagramUsername: "",
  tiktokUsername: "",
  email: "",
};

const buildFormState = (profile: ReposterProfile | null): ProfileFormState => ({
  name: profile?.name || "",
  rank: profile?.rank || "",
  satfung: profile?.satfung || profile?.unit || "",
  jabatan: profile?.jabatan || profile?.role || "",
  instagramUsername: profile?.instagramUsername || "",
  tiktokUsername: profile?.tiktokUsername || "",
  email: profile?.email || "",
});

export default function ProfileClient() {
  const { token, profile, isHydrating, setAuth } = useReposterAuth();
  const [remoteProfile, setRemoteProfile] = useState<ReposterProfile | null>(
    null,
  );
  const [fetchState, setFetchState] = useState<{
    isLoading: boolean;
    error: string;
  }>({ isLoading: false, error: "" });
  const [formState, setFormState] = useState<ProfileFormState>(emptyFormState);
  const [initialFormState, setInitialFormState] =
    useState<ProfileFormState>(emptyFormState);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  
  // Delete email modal state
  const [isDeleteEmailOpen, setIsDeleteEmailOpen] = useState(false);
  const [confirmNrpInput, setConfirmNrpInput] = useState("");
  const [deleteEmailError, setDeleteEmailError] = useState("");
  const [deleteEmailLoading, setDeleteEmailLoading] = useState(false);

  const sessionProfile = useMemo(() => {
    const tokenProfile = token ? decodeJwtPayload(token) : null;
    return mergeReposterProfiles([profile, tokenProfile]);
  }, [profile, token]);

  const combinedProfile = useMemo(
    () => mergeReposterProfiles([remoteProfile, sessionProfile]),
    [remoteProfile, sessionProfile],
  );

  useEffect(() => {
    if (!token || !sessionProfile?.nrp) return;
    let isActive = true;
    const controller = new AbortController();
    setFetchState({ isLoading: true, error: "" });
    getReposterUserProfile(token, sessionProfile.nrp, controller.signal)
      .then((res) => {
        if (!isActive) return;
        const normalized = normalizeReposterProfile([
          res?.data?.user,
          res?.data?.profile,
          res?.data,
          res?.user,
          res?.profile,
          res,
        ]);
        setRemoteProfile(normalized);
        if (normalized) {
          setAuth(token, normalized.rawSources[0] ?? null);
        }
      })
      .catch((error) => {
        if (!isActive) return;
        if (isAbortError(error, controller.signal)) return;
        const message =
          error instanceof Error ? error.message : "Gagal memuat profil.";
        setFetchState({ isLoading: false, error: message });
      })
      .finally(() => {
        if (!isActive) return;
        setFetchState((prev) => ({ ...prev, isLoading: false }));
      });
    return () => {
      isActive = false;
      controller.abort();
    };
  }, [token, sessionProfile?.nrp]);

  const isDirty = useMemo(
    () => JSON.stringify(formState) !== JSON.stringify(initialFormState),
    [formState, initialFormState],
  );

  useEffect(() => {
    if (!combinedProfile) return;
    if (isDirty) return;
    const nextFormState = buildFormState(combinedProfile);
    setFormState(nextFormState);
    setInitialFormState(nextFormState);
  }, [combinedProfile, isDirty]);

  if (isHydrating) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!combinedProfile) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
        Data profil belum tersedia. Silakan login ulang agar profil tersimpan.
      </div>
    );
  }

  const displayName = combinedProfile.name || combinedProfile.nrp || "User";
  const avatarInitials = fallbackInitials(displayName);
  const inputClassName =
    "w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20";
  const readOnlyClassName =
    "w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-600 shadow-inner dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300";

  const handleChange = (
    field: keyof ProfileFormState,
    value: string,
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!token || !combinedProfile.nrp) return;
    setIsSaving(true);
    setSaveMessage("");
    setSaveError("");
    const payload = {
      nama: formState.name.trim(),
      title: formState.rank.trim(),
      divisi: formState.satfung.trim(),
      jabatan: formState.jabatan.trim(),
      insta: sanitizeUsername(formState.instagramUsername),
      tiktok: sanitizeUsername(formState.tiktokUsername),
      email: formState.email.trim(),
    };
    try {
      const res = await updateUser(token, combinedProfile.nrp, payload);
      const normalized = normalizeReposterProfile([
        res?.data?.user,
        res?.data?.profile,
        res?.data,
        res?.user,
        res?.profile,
        res,
        payload,
      ]);
      if (normalized) {
        setRemoteProfile(normalized);
        setFormState(buildFormState(normalized));
        setInitialFormState(buildFormState(normalized));
        setAuth(token, normalized.rawSources[0] ?? profile ?? null);
      }
      setSaveMessage("Data profil berhasil diperbarui.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memperbarui data.";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteEmailModal = () => {
    setIsDeleteEmailOpen(true);
    setConfirmNrpInput("");
    setDeleteEmailError("");
  };

  const closeDeleteEmailModal = () => {
    setIsDeleteEmailOpen(false);
    setConfirmNrpInput("");
    setDeleteEmailError("");
  };

  const handleConfirmDeleteEmail = async () => {
    if (!token || !combinedProfile.nrp) return;
    
    // Validate NRP matches
    if (confirmNrpInput !== combinedProfile.nrp) {
      setDeleteEmailError("NRP yang dimasukkan tidak sesuai.");
      return;
    }
    
    setDeleteEmailLoading(true);
    setDeleteEmailError("");
    
    try {
      const payload = {
        nama: formState.name.trim(),
        title: formState.rank.trim(),
        divisi: formState.satfung.trim(),
        jabatan: formState.jabatan.trim(),
        insta: sanitizeUsername(formState.instagramUsername),
        tiktok: sanitizeUsername(formState.tiktokUsername),
        email: "", // Clear the email
      };
      
      const res = await updateUser(token, combinedProfile.nrp, payload);
      const normalized = normalizeReposterProfile([
        res?.data?.user,
        res?.data?.profile,
        res?.data,
        res?.user,
        res?.profile,
        res,
        payload,
      ]);
      
      if (normalized) {
        setRemoteProfile(normalized);
        setFormState(buildFormState(normalized));
        setInitialFormState(buildFormState(normalized));
        setAuth(token, normalized.rawSources[0] ?? profile ?? null);
      }
      
      setSaveMessage("Email berhasil dihapus.");
      closeDeleteEmailModal();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus email.";
      setDeleteEmailError(message);
    } finally {
      setDeleteEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 md:flex-row md:items-center">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-xl font-semibold text-sky-700 dark:bg-cyan-900/40 dark:text-cyan-200">
          {combinedProfile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={combinedProfile.avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{avatarInitials}</span>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Profil Reposter
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-800 dark:text-white">
            {displayName}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            NRP: {combinedProfile.nrp || "-"}
          </p>
        </div>
      </div>

      {fetchState.error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
          {fetchState.error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Client ID
          </label>
          <input
            readOnly
            className={readOnlyClassName}
            value={combinedProfile.clientId || "-"}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            NRP
          </label>
          <input
            readOnly
            className={readOnlyClassName}
            value={combinedProfile.nrp || "-"}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Nama
          </label>
          <input
            className={inputClassName}
            value={formState.name}
            onChange={(event) => handleChange("name", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Pangkat
          </label>
          <input
            className={inputClassName}
            value={formState.rank}
            onChange={(event) => handleChange("rank", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Satfung
          </label>
          <input
            className={inputClassName}
            value={formState.satfung}
            onChange={(event) => handleChange("satfung", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Jabatan
          </label>
          <input
            className={inputClassName}
            value={formState.jabatan}
            onChange={(event) => handleChange("jabatan", event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Username Instagram
          </label>
          <input
            className={inputClassName}
            value={formState.instagramUsername}
            onChange={(event) =>
              handleChange("instagramUsername", event.target.value)
            }
            placeholder="contoh: polri"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Username TikTok
          </label>
          <input
            className={inputClassName}
            value={formState.tiktokUsername}
            onChange={(event) =>
              handleChange("tiktokUsername", event.target.value)
            }
            placeholder="contoh: polri"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Alamat email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              className={inputClassName}
              value={formState.email}
              onChange={(event) => handleChange("email", event.target.value)}
            />
            {formState.email && (
              <button
                type="button"
                onClick={openDeleteEmailModal}
                className="rounded-2xl bg-gradient-to-r from-rose-400 via-rose-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-rose-500 hover:via-rose-600 hover:to-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
              >
                Hapus Email
              </button>
            )}
          </div>
        </div>
      </div>

      {fetchState.isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
          Memuat data profil terbaru dari server Cicero_V2...
        </div>
      )}

      {saveError && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          {saveError}
        </div>
      )}

      {saveMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          {saveMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !isDirty}
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:bg-cyan-600 dark:hover:bg-cyan-500"
        >
          {isSaving ? "Menyimpan..." : "Simpan data"}
        </button>
        <span className="text-xs text-slate-400">
          Data profil diambil dari tabel user pada endpoint Cicero_V2.
        </span>
      </div>

      {/* Delete Email Confirmation Modal */}
      {isDeleteEmailOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-email-title"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="delete-email-title"
                  className="text-lg font-semibold text-slate-900 dark:text-white"
                >
                  Konfirmasi Hapus Email
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Masukkan NRP{" "}
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {combinedProfile.nrp || "-"}
                  </span>{" "}
                  untuk menghapus email dari profil Anda.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeleteEmailModal}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Tutup konfirmasi"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                NRP
              </label>
              <input
                type="text"
                value={confirmNrpInput}
                onChange={(e) => setConfirmNrpInput(e.target.value.replace(/\D/g, ""))}
                inputMode="numeric"
                pattern="[0-9]*"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-cyan-500 dark:focus:ring-cyan-500/20"
                placeholder="Masukkan NRP (hanya angka)"
              />
              {deleteEmailError && (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                  {deleteEmailError}
                </p>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeleteEmailModal}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                disabled={deleteEmailLoading}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEmail}
                className="rounded-xl bg-gradient-to-r from-rose-400 via-rose-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-rose-500 hover:via-rose-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={deleteEmailLoading}
              >
                {deleteEmailLoading ? "Memproses..." : "Hapus Email"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
