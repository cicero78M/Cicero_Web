"use client";

import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import useReposterAuth from "@/hooks/useReposterAuth";
import { COOKIE_SESSION_TOKEN, getApiBaseUrl } from "@/utils/api";
import {
  decodeJwtPayload,
  extractReposterProfileFromLoginResponse,
  mergeReposterProfiles,
} from "@/utils/reposterProfile";

const SAVED_USERNAME_KEY = "reposter_saved_credentials";

type FormMode = "login" | "register";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const { setAuth } = useReposterAuth();

  const [formMode, setFormMode] = useState<FormMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [registerNrp, setRegisterNrp] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [registerSatker, setRegisterSatker] = useState("");

  useEffect(() => {
    const raw = window.localStorage.getItem(SAVED_USERNAME_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        username?: string;
        remember?: boolean;
      };
      if (parsed?.remember) {
        setUsername(parsed.username ?? "");
        setRememberUsername(true);
        window.localStorage.setItem(
          SAVED_USERNAME_KEY,
          JSON.stringify({ username: parsed.username ?? "", remember: true }),
        );
      }
    } catch (err) {
      console.warn("Gagal membaca kredensial reposter tersimpan.", err);
    }
  }, []);

  useEffect(() => {
    setError("");
    setMessage("");
  }, [formMode]);

  const nextPath = useMemo(() => {
    const candidate = searchParams.get("next");
    if (candidate && candidate.startsWith("/reposter")) return candidate;
    return "/reposter";
  }, [searchParams]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/auth/user-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nrp: username.trim(),
          password: password.trim(),
        }),
        credentials: "include",
      });

      const data = await res.json();
      const sessionToken =
        data?.session || data?.token || data?.data?.token || data?.data?.session || null;

      if (data?.success && sessionToken) {
        const tokenPayload = decodeJwtPayload(sessionToken);
        const profileSnapshot = extractReposterProfileFromLoginResponse(data);
        const mergedProfile = mergeReposterProfiles([
          profileSnapshot,
          tokenPayload,
        ]);
        setAuth(
          COOKIE_SESSION_TOKEN,
          mergedProfile ?? profileSnapshot ?? tokenPayload,
        );
        if (rememberUsername) {
          window.localStorage.setItem(
            SAVED_USERNAME_KEY,
            JSON.stringify({
              username: username.trim(),
              remember: true,
            }),
          );
        } else {
          window.localStorage.removeItem(SAVED_USERNAME_KEY);
        }
        window.location.assign(nextPath);
      } else {
        setError(data?.message || "Login gagal");
      }
    } catch (err) {
      const text =
        err instanceof Error && err.message.includes("NEXT_PUBLIC_API_URL")
          ? err.message
          : "Server tidak merespons. Silakan hubungi admin Cicero.";
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (registerPassword.trim() !== registerConfirmPassword.trim()) {
      setError("Konfirmasi password tidak sama.");
      return;
    }

    setLoading(true);
    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/auth/dashboard-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: registerNrp.trim(),
          password: registerPassword.trim(),
          email: registerEmail.trim(),
          role: "reposter",
          client_id: registerSatker.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data?.success) {
        setMessage(
          data?.status === false
            ? "Pengajuan akun diterima dan menunggu persetujuan admin."
            : "Registrasi berhasil. Silakan login dengan NRP dan password Anda.",
        );
        setRegisterNrp("");
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");
        setRegisterSatker("");
        setFormMode("login");
      } else {
        setError(data?.message || "Registrasi gagal.");
      }
    } catch (err) {
      const text =
        err instanceof Error && err.message.includes("NEXT_PUBLIC_API_URL")
          ? err.message
          : "Server tidak merespons. Silakan hubungi admin Cicero.";
      setError(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] px-4 py-12 text-slate-900">
      <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/60 lg:grid lg:grid-cols-[1.05fr_.95fr]">
        <aside className="bg-slate-950 p-8 text-white sm:p-10">
          <div className="flex items-center gap-3">
            <Image src="/cicero-mark.png" alt="Logo Cicero" width={42} height={42} className="rounded-xl bg-white p-1 object-contain" priority />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-indigo-300">Cicero Reposter</p>
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight">Ruang kerja reposter yang fokus dan terarah.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            Masuk untuk melihat tugas publikasi, kirim laporan, dan pantau progres harian.
            Jika belum punya akun, lakukan registrasi agar admin bisa mengaktifkan akses Anda.
          </p>

          <div className="mt-8 space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
            <p className="font-semibold text-white">Informasi penting</p>
            <ul className="space-y-2 text-slate-300">
              <li>• Gunakan NRP aktif yang sama untuk login dan registrasi.</li>
              <li>• Akses akun mengikuti kewenangan tugas yang diberikan admin.</li>
              <li>• Pastikan email aktif untuk menerima notifikasi aktivasi.</li>
            </ul>
          </div>
        </aside>

        <section className="p-6 sm:p-10">
          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setFormMode("login")}
              className={`rounded-xl px-4 py-2.5 transition ${
                formMode === "login" ? "bg-white text-slate-950 shadow" : "text-slate-600"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setFormMode("register")}
              className={`rounded-xl px-4 py-2.5 transition ${
                formMode === "register" ? "bg-white text-slate-950 shadow" : "text-slate-600"
              }`}
            >
              Registrasi
            </button>
          </div>

          {message ? (
            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}
          {error ? (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {formMode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="reposter-username">NRP</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reposter-username"
                    type="text"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    placeholder="Contoh: 85120123"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="reposter-password">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reposter-password"
                    type={showPassword ? "text" : "password"}
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 shadow-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    placeholder="Masukkan password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={rememberUsername}
                  onChange={(event) => setRememberUsername(event.target.checked)}
                />
                Simpan NRP di perangkat ini
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Masuk Reposter"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="register-nrp" className="text-sm font-medium">NRP</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-nrp"
                    type="text"
                    value={registerNrp}
                    onChange={(e) => setRegisterNrp(e.target.value)}
                    placeholder="NRP aktif"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="register-email" className="text-sm font-medium">Email aktif</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="register-email"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    placeholder="nama@instansi.go.id"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pl-10 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="register-satker" className="text-sm font-medium">Satker (opsional)</label>
                <input
                  id="register-satker"
                  type="text"
                  value={registerSatker}
                  onChange={(e) => setRegisterSatker(e.target.value)}
                  placeholder="Contoh: DITBINMAS"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="register-password" className="text-sm font-medium">Password</label>
                <input
                  id="register-password"
                  type="password"
                  value={registerPassword}
                  onChange={(e) => setRegisterPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="register-confirm-password" className="text-sm font-medium">Konfirmasi password</label>
                <input
                  id="register-confirm-password"
                  type="password"
                  value={registerConfirmPassword}
                  onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <p className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs text-indigo-800">
                Akun baru akan diverifikasi admin terlebih dahulu sebelum bisa digunakan.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Memproses..." : "Ajukan Registrasi"}
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
