"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import DarkModeToggle from "@/components/DarkModeToggle";
import { confirmDashboardPasswordReset } from "@/utils/api";

export default function ResetPasswordClient({ token }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenInput, setTokenInput] = useState(token || "");
  const redirectTimer = useRef(null);

  const networkErrorMessage =
    "Server tidak merespons. Silakan hubungi admin Cicero.";

  useEffect(() => {
    setTokenInput(token || "");
  }, [token]);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  const handleNetworkFailure = () => {
    if (typeof window !== "undefined") {
      window.alert(networkErrorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const trimmedToken = (tokenInput || "").trim();

    if (!trimmedToken) {
      setError(
        "Token reset diperlukan. Mohon masukkan token atau gunakan tautan terbaru.",
      );
      return;
    }

    if (!trimmedPassword || !trimmedConfirmPassword) {
      setError("Mohon isi password baru dan konfirmasinya.");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    setLoading(true);

    try {
      const response = await confirmDashboardPasswordReset({
        token: trimmedToken,
        password: trimmedPassword,
        confirmPassword: trimmedConfirmPassword,
      });
      if (response.success !== false) {
        setMessage(
          response.message ||
            "Password berhasil diperbarui. Anda akan dialihkan ke halaman login.",
        );
        redirectTimer.current = setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(
          response.message ||
            "Gagal memperbarui password. Mohon cek kembali token reset Anda.",
        );
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("NEXT_PUBLIC_API_URL")
          ? err.message
          : networkErrorMessage;
      setError(message);
      if (!(err instanceof Error && err.message.includes("NEXT_PUBLIC_API_URL"))) {
        handleNetworkFailure();
      }
    }

    setLoading(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#e9f3ff,_#cde9ff_58%)] text-slate-900">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/40 blur-[160px]" />
        <div className="absolute -left-32 top-[18%] h-56 w-56 rounded-full bg-indigo-300/35 blur-[120px]" />
        <div className="absolute -right-20 bottom-[10%] h-64 w-64 rounded-full bg-teal-300/35 blur-[120px]" />
      </div>

      <div className="absolute top-4 right-4 z-30">
        <DarkModeToggle />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
        <div className="w-full max-w-xl space-y-8 rounded-[32px] border border-sky-200/60 bg-white/50 p-8 text-slate-700 shadow-2xl backdrop-blur-2xl">
          <div className="flex items-start gap-3 rounded-2xl border border-sky-200/60 bg-white/60 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-200 via-cyan-200 to-indigo-200 text-sky-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sky-600/90">
                Reset Password
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Perbarui Password Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Tetapkan password baru untuk menyelesaikan proses reset akses dashboard Cicero.
              </p>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {!token && (
              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="reset_token"
                    className="text-sm font-medium text-slate-700"
                  >
                    Token reset
                  </label>
                </div>
                <input
                  id="reset_token"
                  type="text"
                  placeholder="Masukkan token reset dari email"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onBlur={(e) => setTokenInput(e.target.value.trim())}
                  required
                  className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
                <p className="text-xs text-slate-500">
                  Salin token unik dari email reset password Anda dan tempel di sini.
                </p>
              </div>
            )}

            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password baru
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password baru"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={(e) => setPassword(e.target.value.trim())}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 pr-12 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-4 flex items-center text-slate-500"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <label htmlFor="confirm_password" className="sr-only">
                Konfirmasi password baru
              </label>
              <input
                id="confirm_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Konfirmasi password baru"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={(e) => setConfirmPassword(e.target.value.trim())}
                required
                autoComplete="new-password"
                className="w-full rounded-xl border border-sky-200/60 bg-white/70 px-4 py-3 pr-12 text-sm text-slate-800 placeholder:text-slate-400 transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute inset-y-0 right-4 flex items-center text-slate-500"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/40 bg-red-100 px-4 py-3 text-center text-sm text-red-600">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-xl border border-emerald-400/50 bg-emerald-100 px-4 py-3 text-center text-sm text-emerald-600">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl border border-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:ring-offset-transparent ${
                loading ? "opacity-60" : "hover:shadow-xl hover:shadow-sky-200/60"
              }`}
            >
              {loading ? "Memproses reset..." : "Simpan password baru"}
            </button>

            <p className="text-center text-xs text-slate-500">
              Jika proses ini berulang kali gagal, hubungi admin Cicero untuk bantuan manual.
            </p>

            <div className="text-center text-xs text-slate-500">
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="font-semibold text-sky-600 transition hover:text-sky-700"
              >
                Kembali ke halaman login
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
