"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, Loader2, MessageCircle, Shield } from "lucide-react";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { submitPremiumRequest } from "@/utils/api";
import { showToast } from "@/utils/showToast";

const premiumTiers = [
  {
    value: "premium_monthly",
    label: "Premium 30 Hari",
    description: "Recap otomatis + ANEV kustom selama 30 hari.",
    basePrice: 300000,
  },
  {
    value: "premium_quarterly",
    label: "Premium 90 Hari",
    description: "Cocok untuk evaluasi triwulan dengan jadwal recap rutin.",
    basePrice: 200000,
  },
  {
    value: "premium_custom",
    label: "Premium Kustom",
    description: "Untuk kebutuhan di luar periode standar (isi nominal sesuai invoice).",
    basePrice: 100000,
  },
];

const initialFormState = {
  username: "",
  clientId: "",
  uuid: "",
  bankName: "",
  senderName: "",
  accountNumber: "",
  premiumTier: "",
  amount: "",
  amountSuffix: "",
};

export default function PremiumRegisterContent() {
  useRequireAuth();
  const { profile, clientId, userId, token, isHydrating } = useAuth();

  const [formState, setFormState] = useState(initialFormState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedUsername = useMemo(() => {
    return (
      profile?.username ||
      profile?.user?.username ||
      profile?.name ||
      profile?.nama_client ||
      profile?.client_name ||
      ""
    );
  }, [profile]);

  const resolvedClientId = useMemo(() => {
    return (
      clientId ||
      profile?.client_id ||
      profile?.clientId ||
      profile?.id_client ||
      ""
    );
  }, [clientId, profile]);

  const resolvedUuid = useMemo(() => {
    return (
      userId ||
      profile?.user_id ||
      profile?.userId ||
      profile?.uuid ||
      profile?.id ||
      ""
    );
  }, [profile, userId]);

  useEffect(() => {
    if (isHydrating) return;
    setFormState((prev) => ({
      ...prev,
      username: resolvedUsername || prev.username,
      clientId: resolvedClientId || prev.clientId,
      uuid: resolvedUuid || prev.uuid,
    }));
  }, [isHydrating, resolvedClientId, resolvedUsername, resolvedUuid]);

  const selectedTier = useMemo(
    () => premiumTiers.find((tier) => tier.value === formState.premiumTier),
    [formState.premiumTier],
  );

  const formattedAmount = useMemo(() => {
    const numericAmount = Number(formState.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return "-";
    return `Rp ${numericAmount.toLocaleString("id-ID")}`;
  }, [formState.amount]);

  const formattedSuggestedAmount = useMemo(() => {
    if (!formState.premiumTier) return "-";
    const tier = premiumTiers.find((item) => item.value === formState.premiumTier);
    if (!tier || !formState.amountSuffix) return "-";
    const baseLabel = (tier.basePrice / 1000).toLocaleString("id-ID");
    return `Rp ${baseLabel}.${formState.amountSuffix}`;
  }, [formState.amountSuffix, formState.premiumTier]);

  const templateMessage = useMemo(() => {
    return `Halo Tim Cicero, saya ingin mendaftarkan paket Premium.

Username Dashboard: ${formState.username || "(diisi otomatis)"}
Client ID: ${formState.clientId || "(diisi otomatis)"}
UUID User: ${formState.uuid || "(diisi otomatis)"}

Paket Premium: ${selectedTier?.label || formState.premiumTier || "-"}
Nama Bank: ${formState.bankName || "-"}
Nama Pengirim: ${formState.senderName || "-"}
No. Rekening: ${formState.accountNumber || "-"}
Nominal Transfer: ${formattedAmount}

Catatan tambahan:`;
  }, [formState, formattedAmount, selectedTier]);

  const whatsappTarget = useMemo(() => {
    return (
      "https://wa.me/+6281235114745?text=" + encodeURIComponent(templateMessage)
    );
  }, [templateMessage]);

  const isFormLocked = isSubmitting || Boolean(successMessage);

  const handleTierChange = (value) => {
    if (isFormLocked) return;

    const selectedTier = premiumTiers.find((tier) => tier.value === value);
    const newSuffix = selectedTier
      ? String(Math.floor(Math.random() * 1000)).padStart(3, "0")
      : "";
    const basePrice = selectedTier?.basePrice ?? 0;
    const computedAmount = selectedTier ? String(basePrice + Number(newSuffix)) : "";

    setFormState((prev) => ({
      ...prev,
      premiumTier: value,
      amountSuffix: newSuffix,
      amount: computedAmount,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    const missingFields = [];
    if (!formState.username.trim()) missingFields.push("username");
    if (!formState.clientId.trim()) missingFields.push("client_id");
    if (!formState.uuid.trim()) missingFields.push("UUID");
    if (!formState.premiumTier.trim()) missingFields.push("paket premium");
    if (!formState.bankName.trim()) missingFields.push("nama bank");
    if (!formState.senderName.trim()) missingFields.push("nama pengirim");
    if (!formState.accountNumber.trim()) missingFields.push("nomor rekening");
    if (!formState.amount.trim()) missingFields.push("nominal transfer");

    if (missingFields.length > 0) {
      const message = `Lengkapi kolom berikut sebelum mengirim: ${missingFields.join(
        ", ",
      )}.`;
      setError(message);
      showToast(message, "error");
      return;
    }

    const numericAmount = Number(formState.amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      const message = "Nominal transfer harus lebih dari 0.";
      setError(message);
      showToast(message, "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await submitPremiumRequest(
        {
          username: formState.username.trim(),
          client_id: formState.clientId.trim(),
          uuid: formState.uuid.trim(),
          premium_tier: formState.premiumTier.trim(),
          bank_name: formState.bankName.trim(),
          sender_name: formState.senderName.trim(),
          account_number: formState.accountNumber.trim(),
          amount: numericAmount,
        },
        token,
      );
      const successText =
        response.message || "Permintaan premium berhasil dikirim.";
      setSuccessMessage(successText);
      showToast(successText, "success");
      setFormState((prev) => ({
        ...prev,
        bankName: "",
        senderName: "",
        accountNumber: "",
        premiumTier: "",
        amount: "",
        amountSuffix: "",
      }));
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Pengajuan premium gagal dikirim. Silakan coba lagi.";
      setError(message);
      showToast(message, "error");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href="/premium"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-600 shadow-inner transition hover:border-indigo-200 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke halaman Premium
        </Link>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-indigo-600">
          Pendaftaran
        </span>
      </div>

      <section className="overflow-hidden rounded-3xl border border-indigo-100/80 bg-white/80 p-7 shadow-[0_18px_48px_-30px_rgba(99,102,241,0.55)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Formulir Permintaan Premium</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Isi detail berikut, kirim permintaan premium, lalu salin template WA agar tim kami
              dapat memverifikasi pembayaran dan mengaktifkan recap otomatis ke nomor dashboard Anda.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-2 text-sm font-semibold text-emerald-700 shadow-inner">
            <Shield className="h-5 w-5" />
            Layanan dipantau tim CICERO
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 via-white to-indigo-50 p-5 shadow-inner">
              <h2 className="text-sm font-semibold text-slate-800">Langkah cepat</h2>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-sm text-slate-600">
                <li>Periksa data login yang terisi otomatis (username, Client ID, UUID).</li>
                <li>Lengkapi paket premium, detail bank, dan nominal transfer.</li>
                <li>Kirim formulir ini, lalu salin template WA untuk konfirmasi pembayaran.</li>
                <li>Tunggu verifikasi dari tim CICERO. Formulir akan terkunci setelah berhasil.</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-indigo-50 bg-white/90 p-6 shadow-[0_15px_32px_-25px_rgba(99,102,241,0.35)]">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-indigo-500" />
                <h3 className="text-base font-semibold text-slate-800">Data permintaan</h3>
              </div>
              <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
                {error && (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </div>
                )}
                {successMessage && (
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-semibold">Username</span>
                    <input
                      value={formState.username}
                      readOnly
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-inner"
                      placeholder="Memuat username..."
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-semibold">Client ID</span>
                    <input
                      value={formState.clientId}
                      readOnly
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-inner"
                      placeholder="Memuat client ID..."
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-semibold">UUID User</span>
                    <input
                      value={formState.uuid}
                      readOnly
                      disabled
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-inner"
                      placeholder="Memuat UUID..."
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-semibold">Paket premium</span>
                    <select
                      value={formState.premiumTier}
                      disabled={isFormLocked}
                      onChange={(event) => handleTierChange(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="">Pilih paket</option>
                      {premiumTiers.map((tier) => (
                        <option key={tier.value} value={tier.value}>
                          {tier.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500">
                      {selectedTier?.description ||
                        "Pilih paket sesuai periode recap yang dibutuhkan."}
                    </p>
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-semibold">Nominal transfer</span>
                    <input
                      type="text"
                      value={formattedAmount === "-" ? "" : formattedAmount}
                      readOnly
                      disabled={isFormLocked}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 shadow-inner disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Nominal otomatis setelah pilih paket"
                    />
                    <p className="text-xs text-slate-500">
                      Nominal dihitung dari harga dasar + 3 digit acak untuk mempermudah verifikasi
                      pembayaran.
                    </p>
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 px-3 py-2 text-xs font-semibold text-indigo-700 shadow-inner">
                      Jumlah yang harus ditransfer: {formattedSuggestedAmount}
                    </div>
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-semibold">Nama bank</span>
                    <input
                      value={formState.bankName}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, bankName: event.target.value }))
                      }
                      disabled={isFormLocked}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Contoh: BRI"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-semibold">Nama pengirim</span>
                    <input
                      value={formState.senderName}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, senderName: event.target.value }))
                      }
                      disabled={isFormLocked}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Nama sesuai bukti transfer"
                    />
                  </label>
                  <label className="space-y-1 text-sm text-slate-700">
                    <span className="font-semibold">Nomor rekening</span>
                    <input
                      value={formState.accountNumber}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          accountNumber: event.target.value,
                        }))
                      }
                      disabled={isFormLocked}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Masukkan nomor rekening pengirim"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Data login diisi otomatis dari sesi aktif. Hubungi admin jika ada ketidaksesuaian.
                  </p>
                  <button
                    type="submit"
                    disabled={isFormLocked || isHydrating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(99,102,241,0.65)] transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengirim...
                      </>
                    ) : successMessage ? (
                      "Permintaan terkirim"
                    ) : (
                      "Kirim permintaan"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-white/80 p-5 shadow-[0_15px_32px_-25px_rgba(56,189,248,0.6)]">
            <h2 className="text-sm font-semibold text-slate-800">Template WA</h2>
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm font-mono text-slate-700">
              <pre className="whitespace-pre-wrap break-words">{templateMessage}</pre>
            </div>
            <a
              href={whatsappTarget}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_15px_35px_-14px_rgba(79,70,229,0.55)] transition hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-200"
            >
              <MessageCircle className="h-4 w-4" />
              Salin & kirim via WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-indigo-50 bg-indigo-50/70 p-4 text-sm text-indigo-800 shadow-inner">
            <p className="font-semibold">Nomor WA Dashboard</p>
            <p className="mt-1 text-indigo-700/80">
              Gunakan nomor yang sama dengan login dashboard agar recap otomatis terkirim ke kanal yang tepat.
            </p>
          </div>
          <div className="rounded-2xl border border-sky-50 bg-sky-50/70 p-4 text-sm text-sky-800 shadow-inner">
            <p className="font-semibold">Periode ANEV</p>
            <p className="mt-1 text-sky-700/80">
              Sebutkan kebutuhan periode (harian, mingguan, bulanan, atau rentang kustom) untuk konfigurasi jadwal recap.
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-50 bg-emerald-50/70 p-4 text-sm text-emerald-800 shadow-inner">
            <p className="font-semibold">Operator & panduan</p>
            <p className="mt-1 text-emerald-700/80">
              Operator menerima panduan khusus beserta link unduhan Excel agar pelaporan premium langsung siap pakai.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
