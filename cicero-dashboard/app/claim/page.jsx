"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn, ShieldCheck, UserPlus } from "lucide-react";

import ClaimLayout from "@/components/claim/ClaimLayout";
import {
  loginClaimUser,
  registerClaimCredential,
  verifyClaimRegistration,
  requestClaimPasswordResetOtp,
  verifyClaimPasswordResetOtp,
  confirmClaimRecoveryEmail,
  confirmClaimPasswordReset,
} from "@/utils/api";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ClaimPage() {
  const [mode, setMode] = useState("login");
  const [nrp, setNrp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [registrationRequestId, setRegistrationRequestId] = useState("");
  const [registrationOtp, setRegistrationOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [resetNrp, setResetNrp] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetRequestId, setResetRequestId] = useState("");
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
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
    const searchParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = searchParams.get("token") || "";
    if (tokenFromUrl) {
      setShowForgot(true);
      setMode("login");
      setResetToken(tokenFromUrl);
      setMessage("Link reset terdeteksi. Silakan masukkan password baru.");
      return;
    }

    const emailConfirmationToken = searchParams.get("email_confirmation_token") || "";
    if (!emailConfirmationToken) return;

    setShowForgot(true);
    setMode("login");
    setLoading(true);
    setError("");
    confirmClaimRecoveryEmail({ token: emailConfirmationToken })
      .then((res) => {
        const payload = res?.data || res;
        setResetToken(payload?.reset_token || "");
        setMessage(
          payload?.message ||
            "Email baru berhasil dikonfirmasi. Silakan buat password baru.",
        );
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete("email_confirmation_token");
        window.history.replaceState({}, "", cleanUrl.toString());
      })
      .catch((err) => {
        setError(err?.message || "Tautan konfirmasi email tidak valid.");
      })
      .finally(() => setLoading(false));
  }, []);

  const clearLegacyClaimSession = () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("claim_nrp");
    sessionStorage.removeItem("claim_password");
    sessionStorage.removeItem("claim_token");
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
        email: registrationEmail.trim(),
      });
      if (res.success !== false) {
        const payload = res?.data || res;
        setRegistrationRequestId(payload.request_id || "");
        setMessage(payload.message || "OTP aktivasi dikirim ke email.");
      } else {
        setError(res.message || "Registrasi gagal.");
      }
    } catch (err) {
      setError(err?.message?.trim() || "Registrasi gagal.");
    }
    setLoading(false);
  };

  const handleVerifyRegistration = async (e) => {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      const res = await verifyClaimRegistration({ request_id: registrationRequestId, otp: registrationOtp.trim() });
      const payload = res?.data || res;
      setMessage(payload.message || "Akun aktif. Silakan login.");
      setRegistrationRequestId(""); setRegistrationOtp(""); setRegistrationEmail("");
      setMode("login"); clearForm();
    } catch (err) { setError(err?.message || "OTP aktivasi tidak valid."); }
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
        clearLegacyClaimSession();
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
      setEmailConfirmationSent(payload?.recovery_mode === "email_confirmation");
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
    const normalizedNewPassword = newPassword.trim();
    const normalizedConfirmPassword = newConfirmPassword.trim();
    if (!PASSWORD_RULE.test(normalizedNewPassword)) {
      setError("Password minimal 8 karakter dan wajib mengandung huruf, angka, serta karakter khusus.");
      return;
    }
    if (normalizedNewPassword !== normalizedConfirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }
    setLoading(true);
    try {
      await confirmClaimPasswordReset({
        token: resetToken,
        password: normalizedNewPassword,
        confirmPassword: normalizedConfirmPassword,
      });
      setMessage("Password berhasil diubah. Silakan login.");
      setShowForgot(false);
      setMode("login");
      setResetNrp("");
      setResetEmail("");
      setResetRequestId("");
      setEmailConfirmationSent(false);
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
      title="Akses Claim"
      description="Masuk untuk kelola data claim. Registrasi baru menggunakan OTP email agar aktivasi lebih aman dan jelas."
      icon={<ShieldCheck className="h-5 w-5" />}
      infoTitle="Autentikasi claim yang aman dan mudah dipahami"
      infoDescription="Form dibuat sederhana: isi data inti, verifikasi OTP, lalu akun langsung siap dipakai. Pemulihan password dilakukan sepenuhnya lewat email terverifikasi."
      infoHighlights={[
        "Registrasi baru wajib memverifikasi email melalui OTP.",
        "Jika email pada NRP sudah terdaftar, OTP langsung dikirim ke email tersebut.",
        "Akun yang belum verifikasi email dapat memasukkan email baru untuk menerima tautan konfirmasi.",
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

        {!(mode === "login" && showForgot) && !(mode === "register" && registrationRequestId) && (
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
                placeholder="Contoh: 85120123"
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
                  placeholder="Masukkan password akun"
                  required
                  className="w-full rounded-2xl border border-trust-200/80 bg-white py-3 pl-10 pr-4 text-sm text-neutral-navy shadow-inner focus:border-trust-400 focus:outline-none focus:ring-2 focus:ring-trust-200"
                />
              </div>
            </div>

            {mode === "register" && (
              <>
                <div className="space-y-2">
                  <label htmlFor="registration_email" className="text-sm font-medium text-neutral-navy">Email aktif</label>
                  <input id="registration_email" type="email" value={registrationEmail} onChange={(e) => setRegistrationEmail(e.target.value)} placeholder="nama@email.com" required className="w-full rounded-2xl border border-trust-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner" />
                  <p className="text-xs text-neutral-slate">Pastikan email bisa diakses sekarang karena OTP akan dikirim ke sini.</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm_password" className="text-sm font-medium text-neutral-navy">Konfirmasi Password</label>
                  <input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password yang sama"
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

        {mode === "register" && registrationRequestId && (
          <form onSubmit={handleVerifyRegistration} className="space-y-4 rounded-xl border border-trust-100 bg-trust-50/40 p-4">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
            <p className="text-sm font-semibold text-neutral-navy">Verifikasi email registrasi</p>
            <input type="text" inputMode="numeric" value={registrationOtp} onChange={(e) => setRegistrationOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6 digit OTP" required className="w-full rounded-xl border border-trust-200 px-3 py-2 text-sm" />
            <button type="submit" disabled={loading || registrationOtp.length !== 6} className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-navy border disabled:opacity-60">Verifikasi & Aktifkan Akun</button>
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
            className="w-full rounded-xl border border-trust-200 bg-white px-4 py-2.5 text-sm font-semibold text-trust-700 transition hover:border-trust-300"
          >
            Lupa Password?
          </button>
        )}

        {showForgot && (
          <div className="space-y-4 rounded-xl border border-trust-100 bg-trust-50/40 p-4">
            {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-navy">Pemulihan Password</p>
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

            {!resetRequestId && !resetToken && !emailConfirmationSent && (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <input
                  type="text"
                  value={resetNrp}
                  onChange={(e) => setResetNrp(e.target.value)}
                  placeholder="NRP akun claim"
                  className="w-full rounded-xl border border-trust-200 px-3 py-2 text-sm"
                />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Email aktif (boleh email baru jika belum terverifikasi)"
                  className="w-full rounded-xl border border-trust-200 px-3 py-2 text-sm"
                />
                <p className="text-xs text-neutral-slate">
                  Akun dengan email terverifikasi menerima OTP di email yang sudah terdaftar. Akun yang belum pernah mengonfirmasi email dapat memasukkan email baru dan akan menerima tautan konfirmasi.
                </p>
                <button type="submit" disabled={loading || !resetNrp.trim() || !resetEmail.trim()} className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-navy border disabled:opacity-60">
                  Lanjutkan Pemulihan via Email
                </button>
              </form>
            )}

            {emailConfirmationSent && !resetToken && (
              <div className="space-y-3 rounded-xl border border-trust-200 bg-white/70 p-3 text-sm text-neutral-slate">
                <p>
                  Buka email baru Anda lalu klik tautan konfirmasi. Email akun belum berubah sampai tautan tersebut diklik.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmailConfirmationSent(false);
                    setMessage("");
                    setError("");
                  }}
                  className="w-full rounded-xl border border-trust-200 px-4 py-2 text-sm font-semibold text-neutral-navy"
                >
                  Gunakan Email Lain / Kirim Ulang
                </button>
              </div>
            )}

            {resetRequestId && !resetToken && (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <input
                  type="text"
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value)}
                  placeholder="Masukkan 6 digit OTP"
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
                  placeholder="Password baru (minimal 8 karakter)"
                  className="w-full rounded-xl border border-trust-200 px-3 py-2 text-sm"
                />
                <input
                  type="password"
                  value={newConfirmPassword}
                  onChange={(e) => setNewConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
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
