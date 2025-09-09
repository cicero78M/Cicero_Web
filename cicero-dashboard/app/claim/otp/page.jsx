"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      setError("Gagal terhubung ke server");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold text-center mb-4">Verifikasi OTP</h2>
        {error && (
          <p className="mb-2 text-red-500 text-sm text-center">{error}</p>
        )}
        <div className="mb-4">
          <label htmlFor="otp" className="sr-only">
            OTP
          </label>
          <input
            id="otp"
            type="text"
            placeholder="Masukkan OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Memverifikasi..." : "Verifikasi"}
        </button>
      </form>
    </main>
  );
}
