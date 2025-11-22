"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import ClaimLayout from "@/components/claim/ClaimLayout";
import { checkClaimEmailStatus, requestClaimOtp } from "@/utils/api";

export default function ClaimPage() {
  const [nrp, setNrp] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [validationStatus, setValidationStatus] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setValidationStatus("");
    setValidationMessage("");
    setLoading(true);
    const trimmedNrp = nrp.trim();
    const trimmedEmail = email.trim();

    try {
      const validation = await checkClaimEmailStatus(trimmedEmail);
      const status = (validation?.status || "").toLowerCase();
      const statusMessages = {
        inactive:
          "Email tampaknya tidak aktif atau sudah tidak bisa menerima pesan. Coba gunakan alamat lain yang aktif.",
        domain_not_found:
          "Domain email tidak ditemukan atau salah ketik. Periksa kembali alamat email kamu.",
        mailbox_full:
          "Kotak masuk email penuh sehingga kode OTP tidak dapat dikirim. Kosongkan kotak masuk atau gunakan email lain.",
      };

      if (!validation?.success && status === "deliverable") {
        setValidationStatus("error");
        setValidationMessage(
          validation?.message ||
            "Email tidak dapat diverifikasi saat ini. Pastikan alamat sudah benar dan coba lagi.",
        );
        setLoading(false);
        return;
      }

      if (status !== "deliverable") {
        const message =
          statusMessages[status] ||
          validation?.message ||
          "Email tidak dapat diverifikasi. Pastikan alamat sudah benar dan coba lagi.";
        setValidationStatus(status || "unknown");
        setValidationMessage(message);
        setLoading(false);
        return;
      }
    } catch (err) {
      setValidationStatus("error");
      const message = err?.message?.trim()
        ? err.message
        : "Validasi email gagal. Silakan coba lagi atau gunakan alamat email berbeda.";
      setValidationMessage(message);
      setLoading(false);
      return;
    }

    try {
      const res = await requestClaimOtp(trimmedNrp, trimmedEmail);
      if (res.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("claim_nrp", trimmedNrp);
          sessionStorage.setItem("claim_email", trimmedEmail);
        }
        router.push("/claim/otp");
      } else {
        setError(res.message || "Gagal mengirim OTP");
      }
    } catch (err) {
      const message = err?.message?.trim()
        ? err.message
        : "Gagal terhubung ke server";
      setError(message);
    }
    setLoading(false);
  }

  return (
    <ClaimLayout
      stepLabel="Langkah 1 dari 3"
      title="Klaim & Edit Data User"
      description="Masukkan NRP dan email aktif untuk menerima kode verifikasi ke akunmu."
      icon={<ShieldCheck className="h-5 w-5" />}
      infoTitle="Mulai proses update data dengan percaya diri"
      infoDescription="Kami memverifikasi identitasmu menggunakan data resmi agar perubahan profil tetap aman dan terkontrol."
      infoHighlights={[
        "Gunakan email aktif agar OTP dapat diterima dengan cepat.",
        "Kami hanya membutuhkan beberapa detik untuk mengirim kode verifikasi.",
        "Data pribadi terlindungi oleh sistem keamanan internal kami.",
      ]}
      cardAccent="trust"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {validationMessage && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${
              validationStatus === "error"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-amber-200 bg-amber-50 text-neutral-navy"
            }`}
          >
            {validationMessage}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200/80 bg-red-50/70 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="nrp" className="text-sm font-medium text-neutral-navy">
            NRP
          </label>
          <input
            id="nrp"
            type="text"
            placeholder="Masukkan NRP kamu"
            value={nrp}
            onChange={(e) => setNrp(e.target.value)}
            required
            className="w-full rounded-2xl border border-trust-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-trust-400 focus:outline-none focus:ring-2 focus:ring-trust-200"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-neutral-navy">
            Email Pribadi
          </label>
          <input
            id="email"
            type="email"
            placeholder="user@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-trust-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-trust-400 focus:outline-none focus:ring-2 focus:ring-trust-200"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-trust-400 via-consistency-300 to-spirit-400 px-6 py-3 text-sm font-semibold text-neutral-navy shadow-md transition-all hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-consistency-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Mengirim..." : "Kirim Kode OTP"}
        </button>
        <p className="text-xs text-neutral-slate">
          Pastikan kamu memiliki akses ke email tersebut karena OTP hanya berlaku selama 5 menit.
        </p>
      </form>
    </ClaimLayout>
  );
}
