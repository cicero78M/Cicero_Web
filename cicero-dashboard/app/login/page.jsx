"use client";

import useAuthRedirect from "@/hooks/useAuthRedirect";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  useAuthRedirect(); // Akan redirect ke /dashboard jika sudah login
  const { setAuth } = useAuth();

  const [client_id, setClientId] = useState("");
  const [client_operator, setClientOperator] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id, client_operator }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        setAuth(data.token, client_id);
        router.push("/dashboard");
      } else {
        setError(data.message || "Login gagal, cek Client ID / Operator");
      }
    } catch (err) {
      setError("Gagal koneksi ke server");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm"
      >
        <h2 className="mb-6 text-2xl font-bold text-blue-600 text-center">Login Cicero</h2>
        <div className="mb-4">
          <label htmlFor="client_id" className="sr-only">
            Client ID
          </label>
          <input
            id="client_id"
            type="text"
            placeholder="Client ID"
            value={client_id}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="client_operator" className="sr-only">
            Operator
          </label>
          <input
            id="client_operator"
            type="text"
            placeholder="Operator"
            value={client_operator}
            onChange={(e) => setClientOperator(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        {error && (
          <div className="text-red-600 text-sm mb-4 text-center">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-lg text-white font-semibold text-lg transition
            ${loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}
          `}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </main>
  );
}
