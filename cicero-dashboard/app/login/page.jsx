"use client";

import useAuthRedirect from "@/hooks/useAuthRedirect";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function LoginPage() {
  useAuthRedirect(); // Akan redirect ke /dashboard jika sudah login
  const { setAuth } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ""; // fall back to relative '/api'
      if (!process.env.NEXT_PUBLIC_API_URL) {
        console.warn(
          "NEXT_PUBLIC_API_URL is not defined; defaulting to relative '/api'"
        );
      }
      const res = await fetch(`${apiUrl}/api/auth/dashboard-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        const userId = data.user?.user_id || null;
        const userClient = data.user?.client_id || null;
        setAuth(data.token, userClient, userId);
        router.push("/dashboard");
      } else {
        setError(data.message || "Login gagal");
      }
    } catch (err) {
      setError("Gagal koneksi ke server");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative">
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm"
      >
        <h2 className="mb-6 text-2xl font-bold text-blue-600 text-center">
          Login Cicero
        </h2>
        <div className="mb-4">
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-4 relative">
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {error && (
          <div className="text-red-600 text-sm mb-2 text-center">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-semibold text-lg transition ${
            loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
        <div className="text-sm text-center mt-4">
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="text-blue-600 hover:underline"
          >
            Belum punya akun? Register
          </button>
        </div>
      </form>
    </main>
  );
}

