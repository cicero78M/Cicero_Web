"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-full max-w-sm"
      >
        <h2 className="text-xl font-semibold text-center mb-4">
          Klaim &amp; Edit Data User
        </h2>
        {error && (
          <p className="mb-2 text-red-500 text-sm text-center">{error}</p>
        )}
        <div className="mb-4">
          <label htmlFor="nrp" className="sr-only">
            NRP
          </label>
          <input
            id="nrp"
            type="text"
            placeholder="NRP"
            value={nrp}
            onChange={(e) => setNrp(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Mengirim..." : "Kirim OTP"}
        </button>
      </form>
    </main>
  );
}
