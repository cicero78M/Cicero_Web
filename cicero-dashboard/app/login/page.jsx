"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
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
      const res = await fetch("http://103.182.52.127:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id, client_operator }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.token) localStorage.setItem("cicero_token", data.token);
        localStorage.setItem("client_id", client_id); // <-- simpan client_id
        router.push("/");
      } else {
        setError(data.message || "Login gagal, cek Client ID / Operator");
      }
    } catch (err) {
      setError("Gagal koneksi ke server");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f5f9",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "white",
          padding: "2rem",
          borderRadius: "1rem",
          boxShadow: "0 6px 24px #0001",
          minWidth: 340,
        }}
      >
        <h2 style={{ marginBottom: 24, color: "#2563eb" }}>Login Cicero</h2>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Client ID"
            value={client_id}
            onChange={(e) => setClientId(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 5,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="Operator (misal: 08123xxxxxxx)"
            value={client_operator}
            onChange={(e) => setClientOperator(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 5,
              border: "1px solid #ccc",
            }}
          />
        </div>
        {error && <div style={{ color: "red", marginBottom: 16 }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 0",
            borderRadius: 6,
            border: "none",
            background: loading ? "#aaa" : "#2563eb",
            color: "white",
            fontWeight: "bold",
            fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
