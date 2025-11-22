"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";

import ClaimLayout from "@/components/claim/ClaimLayout";
import { verifyClaimOtp } from "@/utils/api";

export default function OtpPage() {
  const [nrp, setNrp] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const n = sessionStorage.getItem("claim_nrp");
      const w = sessionStorage.getItem("claim_email");
      if (!n || !w) {
        router.replace("/claim");
      } else {
        setNrp(n);
        setEmail(w);
      }
    }
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await verifyClaimOtp(nrp, email, otp.trim());
      const verified = res.verified ?? res.data?.verified;
      if (res.success && verified) {
        router.push("/claim/edit");
      } else {
        setError(res.message || "OTP tidak valid");
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
      stepLabel="Langkah 2 dari 3"
      title="Verifikasi Kode OTP"
      description="Masukkan kode enam digit yang dikirim ke email untuk melanjutkan proses klaim."
      icon={<KeyRound className="h-5 w-5" />}
      infoTitle="Tetap konsisten dalam keamanan"
      infoDescription="Kode OTP memastikan hanya kamu yang dapat meneruskan pembaruan data. Jangan bagikan kode ini kepada siapa pun."
      infoHighlights={[
        "Cek folder inbox dan spam bila kode belum terlihat dalam 1 menit.",
        "OTP terdiri dari enam digit angka dan berlaku sangat terbatas.",
        "Kamu bisa meminta kode baru dari halaman sebelumnya jika diperlukan.",
      ]}
      cardAccent="consistency"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-red-200/80 bg-red-50/70 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="otp" className="text-sm font-medium text-neutral-navy">
            Kode OTP
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="••••••"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="w-full rounded-2xl border border-consistency-200/80 bg-white px-4 py-3 text-center text-lg font-semibold tracking-[0.4em] text-neutral-navy shadow-inner focus:border-consistency-400 focus:outline-none focus:ring-2 focus:ring-consistency-200"
          />
          <p className="text-xs text-neutral-slate">
            Kode dikirim ke <span className="font-medium text-consistency-600">{email}</span>. Pastikan koneksi email kamu stabil.
          </p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-gradient-to-r from-consistency-300 via-trust-300 to-spirit-300 px-6 py-3 text-sm font-semibold text-neutral-navy shadow-md transition-all hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-trust-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Memverifikasi..." : "Verifikasi & Lanjutkan"}
        </button>
      </form>
    </ClaimLayout>
  );
}
