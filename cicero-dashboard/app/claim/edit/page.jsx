"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Edit3,
  Info,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";

import ClaimLayout from "@/components/claim/ClaimLayout";
import PendingContentCard from "@/components/claim/PendingContentCard";
import {
  getClaimPendingContent,
  getClaimProfile,
  normalizeWhatsapp,
  updateClaimProfile,
  validateClaimSocialProfile,
} from "@/utils/api";
import {
  extractInstagramUsername,
  extractTiktokUsername,
  normalizeSocialAccountList,
} from "./socialUtils";

const DEFINITIVE_SOCIAL_ERROR_CODES = new Set([
  "CLAIM_SOCIAL_PLATFORM_INVALID",
  "CLAIM_SOCIAL_USERNAME_INVALID",
  "CLAIM_SOCIAL_USERNAME_FORBIDDEN",
  "CLAIM_SOCIAL_USERNAME_DUPLICATE",
  "CLAIM_SOCIAL_USERNAME_CONFLICT",
]);

function SocialValidationResult({ validation }) {
  if (!validation) return null;
  if (validation.status === "loading") {
    return <p role="status" className="text-xs text-spirit-600">Memeriksa username...</p>;
  }
  if (validation.status === "warning") {
    return (
      <p role="alert" className="text-xs text-amber-700">
        {validation.message} Nilai tetap dapat disimpan; silakan coba lagi.
      </p>
    );
  }
  if (validation.status === "error") {
    return <p role="alert" className="text-xs text-red-500">{validation.message}</p>;
  }
  if (!validation.data?.found) {
    return <p className="text-xs font-medium text-amber-700">Profil tidak ditemukan.</p>;
  }

  const profile = validation.data;
  const quality = profile.data_quality;
  return (
    <div className="rounded-xl border border-spirit-200 bg-spirit-50/70 p-3 text-xs text-neutral-slate">
      <p className="font-semibold text-neutral-navy">Profil ditemukan</p>
      <dl className="mt-1 grid gap-x-3 gap-y-1 sm:grid-cols-2">
        <div><dt className="inline font-medium">Nama profil: </dt><dd className="inline">{profile.profile_name || "Tidak tersedia"}</dd></div>
        <div><dt className="inline font-medium">Visibilitas: </dt><dd className="inline">{profile.is_private ? "Privat" : "Publik"}</dd></div>
        <div><dt className="inline font-medium">Kualitas data: </dt><dd className="inline">{quality?.label || "Tidak tersedia"}{Number.isFinite(quality?.score) ? ` (${quality.score}/100)` : ""}</dd></div>
      </dl>
      <p className="mt-2">{quality?.explanation || "Kualitas data hanya menunjukkan kelengkapan data yang tersedia, bukan keaslian akun."}</p>
    </div>
  );
}

function SocialAccountFields({ platform, values, errors, validations, onChange, onValidate }) {
  const key = platform.toLowerCase();
  const updateRow = (index, value) =>
    onChange(
      values.map((item, itemIndex) => (itemIndex === index ? value : item)),
      validations.map((item, itemIndex) => (itemIndex === index ? null : item)),
    );
  const removeRow = (index) =>
    onChange(
      values.length === 1
        ? [""]
        : values.filter((_, itemIndex) => itemIndex !== index),
      values.length === 1
        ? [null]
        : validations.filter((_, itemIndex) => itemIndex !== index),
    );
  return (
    <fieldset className="space-y-3 rounded-2xl border border-spirit-200/80 bg-white/70 p-4">
      <legend className="px-1 text-sm font-semibold text-neutral-navy">
        Akun {platform}
      </legend>
      <p className="text-xs text-neutral-slate">
        Masukkan username, @username, atau URL profil {platform}.
      </p>
      {values.map((value, index) => (
        <div key={`${key}-${index}`} className="space-y-1">
          <label
            htmlFor={`${key}-account-${index}`}
            className="text-xs font-medium text-neutral-navy"
          >
            Username {platform} {index + 1}
          </label>
          <div className="flex gap-2">
            <input
              id={`${key}-account-${index}`}
              type="text"
              value={value}
              onChange={(event) => updateRow(index, event.target.value)}
              placeholder="username, @username, atau URL profil"
              aria-invalid={Boolean(errors[index])}
              className="min-w-0 flex-1 rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
            />
            <button
              type="button"
              onClick={() => removeRow(index)}
              aria-label={`Hapus akun ${platform} ${index + 1}`}
              className="rounded-2xl border border-red-200 px-3 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          {errors[index] && (
            <p className="text-xs text-red-500">{errors[index]}</p>
          )}
          <button
            type="button"
            disabled={validations[index]?.status === "loading"}
            onClick={() => onValidate(index, value)}
            className="rounded-xl border border-spirit-300 px-3 py-2 text-xs font-medium text-spirit-600 hover:bg-spirit-50 disabled:cursor-wait disabled:opacity-60"
          >
            {validations[index]?.status === "loading" ? "Memeriksa..." : "Periksa username"}
          </button>
          <SocialValidationResult validation={validations[index]} />
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, ""], [...validations, null])}
        className="inline-flex items-center gap-2 rounded-xl border border-spirit-300 px-3 py-2 text-xs font-medium text-spirit-600 hover:bg-spirit-50"
      >
        <Plus className="h-4 w-4" /> Tambah akun {platform}
      </button>
    </fieldset>
  );
}

export default function EditUserPage() {
  const [claimToken, setClaimToken] = useState("");
  const [nrp, setNrp] = useState("");
  const [kesatuan, setKesatuan] = useState("");
  const [nama, setNama] = useState("");
  const [pangkat, setPangkat] = useState("");
  const [satfung, setSatfung] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [desa, setDesa] = useState("");
  const [role, setRole] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [instagramAccounts, setInstagramAccounts] = useState([""]);
  const [tiktokAccounts, setTiktokAccounts] = useState([""]);
  const [instagramValidations, setInstagramValidations] = useState([null]);
  const [tiktokValidations, setTiktokValidations] = useState([null]);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [pendingContent, setPendingContent] = useState(null);
  const [contentLoading, setContentLoading] = useState(true);
  const [contentError, setContentError] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    whatsapp: "",
    email: "",
    instagramAccounts: [],
    tiktokAccounts: [],
  });
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = sessionStorage.getItem("claim_token");
      setClaimToken(token || "");
      loadUser(token || "");
    }
  }, [router]);

  async function loadUser(token) {
    setProfileLoading(true);
    setProfileError("");
    try {
      const res = await getClaimProfile(token);
      const user = res.data || res.user || res;
      setNrp(user.user_id || "");
      setRole(user.ditbinmas ? "ditbinmas" : "");
      setKesatuan(user.nama_client || user.client_name || user.client_id || "");
      setNama(user.nama || "");
      setPangkat(user.title || "");
      setSatfung(user.divisi || "");
      setJabatan(user.jabatan || "");
      setDesa(user.desa || "");
      setWhatsapp(user.whatsapp || user.no_wa || user.phone || user.telp || "");
      setEmail(user.email || user.mail || user.email_address || "");
      const instagramSource = Array.isArray(user.instagram_accounts)
        ? user.instagram_accounts
        : user.insta
          ? [user.insta]
          : [];
      const tiktokSource = Array.isArray(user.tiktok_accounts)
        ? user.tiktok_accounts
        : user.tiktok
          ? [user.tiktok]
          : [];
      const normalizedInstagram = instagramSource
        .map(extractInstagramUsername)
        .filter(Boolean);
      const normalizedTiktok = tiktokSource
        .map(extractTiktokUsername)
        .filter(Boolean);
      setInstagramAccounts(
        normalizedInstagram.length ? normalizedInstagram : [""],
      );
      setTiktokAccounts(normalizedTiktok.length ? normalizedTiktok : [""]);
      setInstagramValidations(
        Array(normalizedInstagram.length || 1).fill(null),
      );
      setTiktokValidations(Array(normalizedTiktok.length || 1).fill(null));
      loadPendingContent(token);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        router.replace("/claim");
        return;
      }
      const message = err?.message?.trim()
        ? err.message
        : "Gagal mengambil data user";
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadPendingContent(token = claimToken) {
    setContentLoading(true);
    setContentError("");
    try {
      const response = await getClaimPendingContent(token);
      setPendingContent(response.data);
    } catch (err) {
      setContentError(err?.message?.trim() || "Terjadi kesalahan pada server");
    } finally {
      setContentLoading(false);
    }
  }

  function isValidEmailWithBrowser(emailAddress) {
    if (!emailAddress) return false;

    const emailInput = document.createElement("input");
    emailInput.type = "email";
    emailInput.value = emailAddress;

    return emailInput.checkValidity();
  }

  async function handleSocialValidation(platform, index, username) {
    const setValidations =
      platform === "instagram"
        ? setInstagramValidations
        : setTiktokValidations;
    setValidations((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { status: "loading", input: username } : item,
      ),
    );
    try {
      const response = await validateClaimSocialProfile(
        { platform, username },
        claimToken,
      );
      setValidations((current) =>
        current.map((item, itemIndex) =>
          itemIndex === index && item?.input === username
            ? { status: "success", data: response.data }
            : item,
        ),
      );
    } catch (validationError) {
      const errorCode = validationError?.errorCode;
      const notFound = errorCode === "CLAIM_SOCIAL_PROFILE_NOT_FOUND";
      const definitive = DEFINITIVE_SOCIAL_ERROR_CODES.has(errorCode);
      setValidations((current) =>
        current.map((item, itemIndex) => {
          if (itemIndex !== index || item?.input !== username) return item;
          if (notFound) {
            return { status: "success", data: { found: false } };
          }
          return {
            status: definitive ? "error" : "warning",
            blocking: definitive,
            message:
              validationError?.message || "Validasi profil belum dapat dilakukan.",
          };
        }),
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const nextFieldErrors = {
      whatsapp: "",
      email: "",
      instagramAccounts: [],
      tiktokAccounts: [],
    };
    const whatsappInput = whatsapp.trim();
    const sanitizedWhatsapp = whatsappInput.replace(/(?!^\+)[^\d]/g, "");
    const normalizedWhatsapp = sanitizedWhatsapp.startsWith("0")
      ? normalizeWhatsapp(sanitizedWhatsapp)
      : sanitizedWhatsapp;
    const normalizedWhatsappDigits = normalizedWhatsapp.replace(/^\+/, "");

    if (!normalizedWhatsapp) {
      nextFieldErrors.whatsapp = "No WhatsApp wajib diisi.";
    } else if (normalizedWhatsappDigits.length < 8) {
      nextFieldErrors.whatsapp =
        "No WhatsApp terlalu pendek (minimal 8 digit).";
    } else if (!/^\d+$/.test(normalizedWhatsappDigits)) {
      nextFieldErrors.whatsapp =
        "No WhatsApp hanya boleh berisi angka. Tanda + hanya boleh di awal.";
    }

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !isValidEmailWithBrowser(normalizedEmail)) {
      nextFieldErrors.email = "Email wajib diisi dengan format valid";
    }

    if (nextFieldErrors.whatsapp) {
      setError("Nomor WhatsApp wajib diisi dengan format valid");
    } else if (nextFieldErrors.email) {
      setError("Email wajib diisi dengan format valid");
    }

    const normalizedInstagram = normalizeSocialAccountList(
      instagramAccounts,
      "instagram",
    );
    const normalizedTiktok = normalizeSocialAccountList(
      tiktokAccounts,
      "tiktok",
    );
    if (!normalizedInstagram.ok)
      nextFieldErrors.instagramAccounts[normalizedInstagram.index] =
        normalizedInstagram.message;
    if (!normalizedTiktok.ok)
      nextFieldErrors.tiktokAccounts[normalizedTiktok.index] =
        normalizedTiktok.message;

    instagramValidations.forEach((validation, index) => {
      if (validation?.blocking) {
        nextFieldErrors.instagramAccounts[index] = validation.message;
      }
    });
    tiktokValidations.forEach((validation, index) => {
      if (validation?.blocking) {
        nextFieldErrors.tiktokAccounts[index] = validation.message;
      }
    });

    setFieldErrors(nextFieldErrors);

    if (
      nextFieldErrors.whatsapp ||
      nextFieldErrors.email ||
      nextFieldErrors.instagramAccounts.some(Boolean) ||
      nextFieldErrors.tiktokAccounts.some(Boolean)
    ) {
      return;
    }
    const isDitbinmasRole = role.trim().toLowerCase() === "ditbinmas";
    setLoading(true);
    try {
      const res = await updateClaimProfile(
        {
          nama: nama.trim(),
          title: pangkat.trim(),
          divisi: satfung.trim(),
          jabatan: jabatan.trim(),
          // Aturan bisnis: field desa hanya diproses untuk personel role Ditbinmas.
          desa: isDitbinmasRole ? desa.trim() : "",
          whatsapp: normalizedWhatsapp,
          email: normalizedEmail,
          instagram_accounts: normalizedInstagram.accounts,
          tiktok_accounts: normalizedTiktok.accounts,
        },
        claimToken,
      );
      if (res.success) {
        setMessage("Data berhasil diperbarui");
      } else {
        setError(res.message || "Gagal memperbarui data");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Gagal terhubung ke server");
      } else {
        const message = err?.message?.trim()
          ? err.message
          : "Gagal memperbarui data";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  const isDitbinmasRole = role.trim().toLowerCase() === "ditbinmas";

  return (
    <ClaimLayout
      stepLabel="Langkah 3 dari 3"
      title="Perbarui & Sempurnakan Data Profil"
      description="Periksa kembali detailmu, tambahkan tautan media sosial aktif, dan simpan pembaruan agar profilmu tampil optimal."
      icon={<Edit3 className="h-5 w-5" />}
      infoTitle="Selesaikan pembaruan dengan penuh semangat"
      infoDescription="Langkah terakhir ini memastikan informasi pribadimu konsisten dan siap ditampilkan kepada publik."
      infoHighlights={[
        "Pastikan nama dan jabatan sesuai dokumen resmi.",
        "Gunakan tautan media sosial yang mudah diakses dan akurat.",
        "Simpan perubahan untuk memperbarui profil secara realtime.",
      ]}
      cardAccent="spirit"
    >
      <div className="space-y-8">
        <PendingContentCard
          data={pendingContent}
          loading={contentLoading}
          error={contentError}
          onRefresh={loadPendingContent}
          claimToken={claimToken}
          onOpenProfile={() =>
            document
              .getElementById("claim-profile-form")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />

        <section className="rounded-3xl border border-spirit-200/80 bg-gradient-to-br from-white/80 via-spirit-50/70 to-trust-50/70 px-6 py-5 text-sm text-neutral-slate shadow-inner">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-spirit-500" />
            <div className="space-y-3">
              <p className="text-neutral-navy">
                Verifikasi kembali nama, pangkat, satfung, dan jabatan sesuai
                data resmi sebelum menyimpan perubahan.
              </p>
              <p>
                Untuk Instagram, masukkan username, @username, atau tautan
                profil yang disalin dari aplikasi.
              </p>
              <p>
                Untuk TikTok, masukkan username, @username, atau tautan profil
                yang disalin dari aplikasi.
              </p>
              <p>
                Pastikan kedua akun disetel publik agar tim kami dapat melakukan
                verifikasi.
              </p>
              <p>
                Setelah menyesuaikan data akun, klik tombol{" "}
                <span className="font-medium text-spirit-600">Simpan</span> agar
                sistem memperbarui profilmu.
              </p>
            </div>
          </div>
        </section>

        <form
          id="claim-profile-form"
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {profileLoading && (
            <p role="status" className="text-sm text-neutral-slate">
              Memuat profil...
            </p>
          )}
          {profileError && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-600 shadow-sm">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>Gagal memuat profil: {profileError}</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-600 shadow-sm">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-600 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">
                Kesatuan
              </label>
              <input
                type="text"
                value={kesatuan}
                readOnly
                className="w-full rounded-2xl border border-spirit-200/60 bg-neutral-50 px-4 py-3 text-sm text-neutral-navy shadow-inner focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="nrp"
                className="text-sm font-medium text-neutral-navy"
              >
                NRP
              </label>
              <input
                id="nrp"
                type="text"
                value={nrp}
                readOnly
                className="w-full rounded-2xl border border-spirit-200/60 bg-neutral-50 px-4 py-3 text-sm text-neutral-navy shadow-inner focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">
                Nama
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">
                Pangkat
              </label>
              <input
                type="text"
                value={pangkat}
                onChange={(e) => setPangkat(e.target.value)}
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">
                Satfung
              </label>
              <input
                type="text"
                value={satfung}
                onChange={(e) => setSatfung(e.target.value)}
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">
                Jabatan
              </label>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
            </div>
          </div>

          {/* Aturan bisnis: Desa Binaan hanya relevan/ditampilkan untuk role Ditbinmas. */}
          {isDitbinmasRole && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">
                Desa Binaan
              </label>
              <input
                type="text"
                value={desa}
                onChange={(e) => setDesa(e.target.value)}
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
            </div>
          )}

          <section className="rounded-2xl border border-spirit-200/80 bg-spirit-50/70 px-4 py-4 text-sm text-neutral-navy shadow-inner">
            silahkan isi / perbaiki no whatsapp dan email agar kami dapat lebih
            mudah mengirimkan informasi terbaru kepada anda.
          </section>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">
                No WhatsApp
              </label>
              <input
                type="tel"
                inputMode="numeric"
                value={whatsapp}
                onChange={(e) => {
                  const value = e.target.value;
                  const sanitizedValue = value.replace(/(?!^\+)[^\d]/g, "");
                  setWhatsapp(sanitizedValue);
                  const sanitizedDigits = sanitizedValue.replace(/^\+/, "");
                  setFieldErrors((prev) => ({
                    ...prev,
                    whatsapp: !sanitizedValue
                      ? ""
                      : sanitizedDigits.length < 8
                        ? "No WhatsApp terlalu pendek (minimal 8 digit)."
                        : /^\d+$/.test(sanitizedDigits)
                          ? ""
                          : "No WhatsApp hanya boleh berisi angka. Tanda + hanya boleh di awal.",
                  }));
                }}
                placeholder="08xxxxxxxxxx / +628xxxxxxxxxx"
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
              <p className="text-xs text-neutral-slate">
                Gunakan format 08xxxxxxxxxx atau +628xxxxxxxxxx. Nomor 08 akan
                otomatis dinormalisasi menjadi 62xxxxxxxxxx saat disimpan.
              </p>
              {fieldErrors.whatsapp && (
                <p className="text-xs text-red-500">{fieldErrors.whatsapp}</p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  const value = e.target.value;
                  setEmail(value);
                  if (!value || isValidEmailWithBrowser(value.trim())) {
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }
                }}
                placeholder="nama@email.com"
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
              {fieldErrors.email && (
                <p className="text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>
          </div>

          <SocialAccountFields
            platform="Instagram"
            values={instagramAccounts}
            errors={fieldErrors.instagramAccounts}
            validations={instagramValidations}
            onChange={(values, validations) => {
              setInstagramAccounts(values);
              setInstagramValidations(validations);
            }}
            onValidate={(index, value) =>
              handleSocialValidation("instagram", index, value)
            }
          />
          <SocialAccountFields
            platform="TikTok"
            values={tiktokAccounts}
            errors={fieldErrors.tiktokAccounts}
            validations={tiktokValidations}
            onChange={(values, validations) => {
              setTiktokAccounts(values);
              setTiktokValidations(validations);
            }}
            onValidate={(index, value) =>
              handleSocialValidation("tiktok", index, value)
            }
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-spirit-400 via-consistency-300 to-trust-300 px-6 py-3 text-sm font-semibold text-neutral-navy shadow-md transition-all hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-spirit-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </div>
    </ClaimLayout>
  );
}
