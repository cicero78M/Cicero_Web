"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import ClaimLayout from "@/components/claim/ClaimLayout";
import { requestClaimOtp } from "@/utils/api";

export default function ClaimPage() {
  const [nrp, setNrp] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await requestClaimOtp(nrp.trim(), email.trim());
      if (res.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("claim_nrp", nrp.trim());
          sessionStorage.setItem("claim_email", email.trim());
        }
        router.push("/claim/otp");
      } else {
        setError(res.message || "Gagal mengirim OTP");
      }
    } catch (err) {
      setError("Gagal terhubung ke server");
    }
    setLoading(false);
  }

  return (
    <ClaimLayout
      stepLabel="Langkah 1 dari 3"
      title="Klaim & Edit Data User"
      description="Masukkan NRP dan email aktif untuk menerima kode verifikasi ke akunmu."
      icon={<ShieldCheck className="h-5 w-5" />}
      infoTitle="Mulai proses klaim dengan percaya diri"
      infoDescription="Kami memverifikasi identitasmu menggunakan data resmi agar perubahan profil tetap aman dan terkontrol."
      infoHighlights={[
        "Gunakan email aktif agar OTP dapat diterima dengan cepat.",
        "Kami hanya membutuhkan beberapa detik untuk mengirim kode verifikasi.",
        "Data pribadi terlindungi oleh sistem keamanan internal kami.",
      ]}
      cardAccent="trust"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
            Email Institusi
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
