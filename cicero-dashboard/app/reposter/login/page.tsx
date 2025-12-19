"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useReposterAuth from "@/hooks/useReposterAuth";
import { getApiBaseUrl } from "@/utils/api";

const SESSION_COOKIE = "reposter_session";

export default function ReposterLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useReposterAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const nextPath = useMemo(() => {
    const candidate = searchParams.get("next");
    if (candidate && candidate.startsWith("/reposter")) return candidate;
    return "/reposter";
  }, [searchParams]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = getApiBaseUrl();
      const res = await fetch(`${apiUrl}/api/auth/reposter-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();
      const sessionToken = data?.session || data?.token || null;

      if (data?.success && sessionToken) {
        setAuth(sessionToken);
        const encoded = encodeURIComponent(sessionToken);
        document.cookie = `${SESSION_COOKIE}=${encoded}; Path=/reposter; SameSite=Lax; Max-Age=86400`;
        router.push(nextPath);
      } else {
        setError(data?.message || "Login gagal");
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("NEXT_PUBLIC_API_URL")
          ? err.message
          : "Server tidak merespons. Silakan hubungi admin Cicero.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-700 dark:bg-slate-950 dark:text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_24px_48px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Reposter
          </p>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
            Masuk Reposter
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            Gunakan akun khusus reposter untuk mengelola konten ulang.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="reposter-username">
              Username
            </label>
            <input
              id="reposter-username"
              type="text"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="reposter-password">
              Password
            </label>
            <input
              id="reposter-password"
              type="password"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-cyan-400 dark:focus:ring-cyan-500/20"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-cyan-500 dark:hover:bg-cyan-400"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
