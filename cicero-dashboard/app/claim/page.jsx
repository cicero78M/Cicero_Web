"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogIn, ShieldCheck, UserPlus } from "lucide-react";

import ClaimLayout from "@/components/claim/ClaimLayout";
import { loginClaimUser, registerClaimCredential } from "@/utils/api";

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ClaimPage() {
  const [mode, setMode] = useState("login");
  const [nrp, setNrp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
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

  const saveClaimSession = (trimmedNrp, trimmedPassword) => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("claim_nrp", trimmedNrp);
    sessionStorage.setItem("claim_password", trimmedPassword);
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
        saveClaimSession(trimmedNrp, trimmedPassword);
        router.push("/claim/edit");
      } else {
        setError(res.message || "Login gagal.");
      }
    } catch (err) {
      setError(err?.message?.trim() || "Login gagal.");
    }
    setLoading(false);
  };

  return (
    <ClaimLayout
      stepLabel="Langkah 1 dari 2"
      title="Login atau Registrasi Claim"
      description="Update terbaru: flow OTP email sudah tidak digunakan. Akses claim sekarang memakai registrasi dan login dengan NRP + password."
      icon={<ShieldCheck className="h-5 w-5" />}
      infoTitle="Autentikasi claim berbasis kredensial"
      infoDescription="Mulai saat ini, proses registrasi, login, dan update profil claim dilakukan menggunakan NRP dan password tanpa request OTP."
      infoHighlights={[
        "Tidak perlu request OTP email lagi pada halaman claim.",
        "Registrasi awal: NRP + password kuat (huruf, angka, karakter khusus).",
        "Login berikutnya: cukup NRP + password yang sudah didaftarkan.",
        "Kredensial yang sama digunakan saat simpan perubahan profil.",
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
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "login" ? "bg-white text-neutral-navy shadow" : "text-neutral-slate"
            }`}
          >
            <span className="inline-flex items-center gap-2"><LogIn className="h-4 w-4" /> Login</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError("");
              setMessage("");
            }}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "register" ? "bg-white text-neutral-navy shadow" : "text-neutral-slate"
            }`}
          >
            <span className="inline-flex items-center gap-2"><UserPlus className="h-4 w-4" /> Registrasi</span>
          </button>
        </div>

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
      </div>
    </ClaimLayout>
  );
}
