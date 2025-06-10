"use client";

import useAuthRedirect from "@/hooks/useAuthRedirect";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  useAuthRedirect(); // Akan redirect ke /dashboard jika sudah login

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://103.182.52.127:3000";
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id, client_operator }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("cicero_token", data.token);
        localStorage.setItem("client_id", client_id);
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
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-xl min-w-[340px] w-full max-w-sm"
      >
        <h2 className="mb-6 text-2xl font-bold text-blue-600 text-center">Login Cicero</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Client ID"
            value={client_id}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-4">
          <input
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
    </div>
  );
}
