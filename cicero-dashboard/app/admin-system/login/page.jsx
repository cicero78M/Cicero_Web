"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  clearAdminSystemToken,
  requestAdminTelegramOtp,
  setAdminSystemToken,
  verifyAdminTelegramOtp,
} from "@/utils/adminSystemApi";

export default function AdminSystemLoginPage() {
  const router = useRouter();
  const [telegramUsername, setTelegramUsername] = useState("Cicero_Papiqo");
  const [requestId, setRequestId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [message, setMessage] = useState("Masukkan username Telegram admin lalu minta OTP.");
  const [error, setError] = useState("");

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoadingOtp(true);
    clearAdminSystemToken();
    try {
      const data = await requestAdminTelegramOtp(telegramUsername.trim().replace(/^@/, ""));
      setRequestId(String(data?.request_id || ""));
      setMessage("OTP berhasil dikirim ke Telegram admin terdaftar.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal request OTP");
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoadingVerify(true);
    try {
      const data = await verifyAdminTelegramOtp(
        requestId.trim(),
        otpCode.trim(),
        telegramUsername.trim().replace(/^@/, ""),
      );
      if (!data?.token) {
        throw new Error("Token admin tidak diterima dari server");
      }
      setAdminSystemToken(data.token);
      router.replace("/admin-system");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verifikasi OTP gagal");
    } finally {
      setLoadingVerify(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5 shadow-2xl">
        <div>
          <h1 className="text-2xl font-semibold">Admin System Login</h1>
          <p className="text-sm text-slate-400 mt-1">
            OTP hanya valid untuk akun Telegram <b>@Cicero_Papiqo</b>.
          </p>
        </div>

        <form onSubmit={handleRequestOtp} className="space-y-3">
          <label className="text-sm text-slate-300">Username Telegram</label>
          <input
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value)}
            placeholder="Cicero_Papiqo"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm"
            required
          />
          <button
            type="submit"
            disabled={loadingOtp}
            className="w-full rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold py-3 disabled:opacity-60"
          >
            {loadingOtp ? "Mengirim OTP..." : "Kirim OTP"}
          </button>
        </form>

        <form onSubmit={handleVerifyOtp} className="space-y-3 pt-2 border-t border-slate-700">
          <label className="text-sm text-slate-300">Request ID</label>
          <input
            value={requestId}
            onChange={(e) => setRequestId(e.target.value)}
            placeholder="otomatis terisi setelah request OTP"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm"
            required
          />

          <label className="text-sm text-slate-300">OTP Code</label>
          <input
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="6 digit OTP"
            className="w-full rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 text-sm"
            required
          />

          <button
            type="submit"
            disabled={loadingVerify}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold py-3 disabled:opacity-60"
          >
            {loadingVerify ? "Verifikasi..." : "Masuk Admin System"}
          </button>
        </form>

        {message && <p className="text-sm text-emerald-400">{message}</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
      </div>
    </main>
  );
}
