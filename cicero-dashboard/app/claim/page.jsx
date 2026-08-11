"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn, ShieldCheck, UserPlus } from "lucide-react";

import ClaimLayout from "@/components/claim/ClaimLayout";
import {
  loginClaimUser,
  registerClaimCredential,
  requestClaimPasswordResetOtp,
  verifyClaimPasswordResetOtp,
  confirmClaimPasswordReset,
} from "@/utils/api";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ClaimPage() {
  const [mode, setMode] = useState("login");
  const [nrp, setNrp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [resetNrp, setResetNrp] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetRequestId, setResetRequestId] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const router = useRouter();

  const passwordChecks = useMemo(
    () => ({
      minLength: password.length >= 8,
      hasLetter: /[A-Za-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[^A-Za-z0-9]/.test(password),
    }),
    [password],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const tokenFromUrl = new URLSearchParams(window.location.search).get("token") || "";
    if (tokenFromUrl) {
      setShowForgot(true);
      setMode("login");
      setResetToken(tokenFromUrl);
      setMessage("Link reset terdeteksi. Silakan masukkan password baru.");
    }
  }, []);

  const saveClaimSession = (token) => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("claim_nrp");
    sessionStorage.removeItem("claim_password");
    if (token) sessionStorage.setItem("claim_token", token);
    else sessionStorage.removeItem("claim_token");
  };

  const clearForm = () => {
    setPassword("");
    setConfirmPassword("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedNrp = nrp.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!PASSWORD_RULE.test(trimmedPassword)) {
      setError(
        "Password minimal 8 karakter dan wajib mengandung huruf, angka, serta karakter khusus.",
      );
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerClaimCredential({
        nrp: trimmedNrp,
        password: trimmedPassword,
      });
      if (res.success !== false) {
        setMessage("Registrasi berhasil. Silakan login dengan NRP dan password baru.");
        setMode("login");
        clearForm();
      } else {
        setError(res.message || "Registrasi gagal.");
      }
    } catch (err) {
      setError(err?.message?.trim() || "Registrasi gagal.");
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedNrp = nrp.trim();
    const trimmedPassword = password.trim();
    if (!trimmedNrp || !trimmedPassword) {
      setError("NRP dan password wajib diisi.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginClaimUser({ nrp: trimmedNrp, password: trimmedPassword });
      if (res.success !== false) {
        saveClaimSession(res.token);
        router.push("/claim/edit");
      } else {
        setError(res.message || "Login gagal.");
      }
    } catch (err) {
      setError(err?.message?.trim() || "Login gagal.");
    }
    setLoading(false);
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await requestClaimPasswordResetOtp({
        nrp: resetNrp.trim(),
        email: resetEmail.trim() || undefined,
      });
      const payload = res?.data || res;
      setResetRequestId(payload?.request_id || "");
      if (payload?.email) setResetEmail(payload.email);
      setMessage(payload?.message || "OTP terkirim.");
    } catch (err) {
      setError(err?.message || "Gagal request OTP.");
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await verifyClaimPasswordResetOtp({
        request_id: resetRequestId,
        otp: resetOtp.trim(),
      });
      const payload = res?.data || res;
      setResetToken(payload?.reset_token || "");
      setMessage(payload?.message || "OTP valid. Silakan buat password baru.");
    } catch (err) {
      setError(err?.message || "OTP tidak valid.");
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!PASSWORD_RULE.test(newPassword)) {
      setError("Password minimal 8 karakter dan wajib mengandung huruf, angka, serta karakter khusus.");
      return;
    }
    if (newPassword !== newConfirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }
    setLoading(true);
    try {
      await confirmClaimPasswordReset({
        token: resetToken,
        password: newPassword,
        confirmPassword: newConfirmPassword,
      });
      setMessage("Password berhasil diubah. Silakan login.");
      setShowForgot(false);
      setMode("login");
      setResetNrp("");
      setResetEmail("");
      setResetRequestId("");
      setResetOtp("");
      setResetToken("");
      setNewPassword("");
      setNewConfirmPassword("");
    } catch (err) {
      setError(err?.message || "Gagal reset password.");
    }
    setLoading(false);
  };

  return (
    <ClaimLayout
      stepLabel="Langkah 1 dari 2"
      title="Login atau Registrasi Claim"
      description="Akses claim menggunakan NRP + password. Jika lupa password, gunakan reset OTP via email pada kartu di bawah."
      icon={<ShieldCheck className="h-5 w-5" />}
      infoTitle="Autentikasi claim berbasis kredensial"
      infoDescription="Proses utama tetap memakai NRP + password. Fitur lupa password sekarang disederhanakan: NRP + email, lalu OTP dikirim ke email."
      infoHighlights={[
        "Reset password hanya melalui OTP email (tanpa WhatsApp/Telegram).",
        "Jika email pada NRP sudah terdaftar, OTP langsung dikirim ke email tersebut.",
        "Jika belum, masukkan email aktif untuk menerima OTP.",
        "Setelah OTP valid, buat password baru lalu login kembali.",
      ]}
      cardAccent="trust"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 rounded-2xl bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            className={`w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
              mode === "login" ? "bg-white text-neutral-navy shadow" : "text-neutral-slate hover:text-neutral-navy"
            }`}
          >
            <span className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap">
              <LogIn className="h-4 w-4 shrink-0" /> Login
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setMessage("");
            }}
            className={`w-full cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${
              mode === "register" ? "bg-white text-neutral-navy shadow" : "text-neutral-slate hover:text-neutral-navy"
            }`}
          >
            <span className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap">
              <UserPlus className="h-4 w-4 shrink-0" /> Registrasi
            </span>
          </button>
        </div>

        {!(mode === "login" && showForgot) && (
          <form onSubmit={mode === "register" ? handleRegister : handleLogin} className="space-y-4">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

            <div className="space-y-2">
              <label htmlFor="nrp" className="text-sm font-medium text-neutral-navy">NRP</label>
              <input
                id="nrp"
                type="text"
                value={nrp}
                onChange={(e) => setNrp(e.target.value)}
                placeholder="Masukkan NRP"
                required
                className="w-full rounded-2xl border border-trust-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-trust-400 focus:outline-none focus:ring-2 focus:ring-trust-200"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-neutral-navy">Password</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-slate" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  className="w-full rounded-2xl border border-trust-200/80 bg-white py-3 pl-10 pr-4 text-sm text-neutral-navy shadow-inner focus:border-trust-400 focus:outline-none focus:ring-2 focus:ring-trust-200"
                />
              </div>
            </div>

            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <label htmlFor="confirm_password" className="text-sm font-medium text-neutral-navy">Konfirmasi Password</label>
                  <input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    required
                    className="w-full rounded-2xl border border-trust-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-trust-400 focus:outline-none focus:ring-2 focus:ring-trust-200"
                  />
                </div>

                <div className="rounded-xl border border-trust-100 bg-trust-50/70 px-4 py-3 text-xs text-neutral-slate">
                  <p className="mb-2 font-semibold text-neutral-navy">Password Strength (wajib):</p>
                  <ul className="space-y-1">
                    <li className={passwordChecks.minLength ? "text-emerald-600" : "text-neutral-slate"}>• Minimal 8 karakter</li>
                    <li className={passwordChecks.hasLetter ? "text-emerald-600" : "text-neutral-slate"}>• Mengandung huruf</li>
                    <li className={passwordChecks.hasNumber ? "text-emerald-600" : "text-neutral-slate"}>• Mengandung angka</li>
                    <li className={passwordChecks.hasSpecial ? "text-emerald-600" : "text-neutral-slate"}>• Mengandung karakter khusus</li>
                  </ul>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-trust-300 via-consistency-300 to-spirit-300 px-6 py-3 text-sm font-semibold text-neutral-navy shadow-md transition-all hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-trust-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Memproses..." : mode === "register" ? "Daftar" : "Login & Lanjutkan"}
            </button>
          </form>
        )}

        {mode === "login" && !showForgot && (
          <button
            type="button"
            onClick={() => {
              setShowForgot(true);
              setError("");
              setMessage("");
            }}
            className="w-full text-sm font-semibold text-trust-700 hover:underline"
          >
            Lupa Password?
          </button>
        )}

        {showForgot && (
          <div className="space-y-4 rounded-xl border border-trust-100 bg-trust-50/40 p-4">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-navy">Lupa Password (NRP + Email)</p>
              <button
                type="button"
                onClick={() => {
                  setShowForgot(false);
                  setError("");
                  setMessage("");
                }}
                className="text-xs font-semibold text-trust-700 hover:underline"
              >
                Kembali ke Login
              </button>
            </div>

            {!resetRequestId && (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <input
                  type="text"
                  value={resetNrp}
                  onChange={(e) => setResetNrp(e.target.value)}
                  placeholder="NRP"
                  className="w-full rounded-xl border border-trust-200 px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Email aktif"
                  className="w-full rounded-xl border border-trust-200 px-3 py-2 text-sm"
                />
                <p className="text-xs text-neutral-slate">
                  Jika email pada NRP sudah terdaftar, OTP otomatis dikirim ke email tersebut.
                </p>
                <button type="submit" disabled={loading || !resetNrp.trim() || !resetEmail.trim()} className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-navy border disabled:opacity-60">
                  Kirim OTP ke Email
                </button>
              </form>
            )}

            {resetRequestId && !resetToken && (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input
                  type="text"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="Masukkan OTP"
                  className="w-full rounded-xl border border-trust-200 px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button type="submit" disabled={loading} className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-navy border disabled:opacity-60">
                    Verifikasi OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetRequestId("");
                      setResetOtp("");
                      setMessage("");
                      setError("");
                    }}
                    className="w-full rounded-xl bg-transparent px-4 py-2 text-sm font-semibold text-neutral-slate border border-trust-200"
                  >
                    Kirim Ulang
                  </button>
                </div>
              </form>
            )}

            {resetToken && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Password baru"
                  className="w-full rounded-xl border border-trust-200 px-3 py-2 text-sm"
                />
                <input
                  type="password"
                  value={newConfirmPassword}
                  onChange={(e) => setNewConfirmPassword(e.target.value)}
                  placeholder="Konfirmasi password baru"
                  className="w-full rounded-xl border border-trust-200 px-3 py-2 text-sm"
                />
                <button type="submit" disabled={loading} className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-navy border disabled:opacity-60">
                  Simpan Password Baru
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </ClaimLayout>
  );
}
