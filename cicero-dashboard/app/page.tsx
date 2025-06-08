'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Ganti URL_API sesuai endpoint profil client-mu
const URL_API = "http://103.182.52.127:3000/api/client/profile";

export default function HomePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("cicero_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Misal, client_id dan operator disimpan saat login, atau bisa dari token/jwt jika decode.
    // Di sini asumsikan client_id sudah diketahui, misal simpan juga di localStorage.
    const client_id = localStorage.getItem("client_id");
    if (!client_id) {
      router.push("/login");
      return;
    }

    // Fetch profil client dari API
    fetch(`${URL_API}?client_id=${client_id}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setProfile(data.profile || data.data); // Sesuaikan key jika perlu
        } else {
          setError(data.message || "Gagal fetch data profile");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Gagal koneksi ke server");
        setLoading(false);
      });
  }, [router]);

  if (loading) return <div style={{ padding: 32 }}>Loading...</div>;
  if (error) return <div style={{ color: "red", padding: 32 }}>{error}</div>;

  if (!profile) return <div style={{ padding: 32 }}>Profile tidak ditemukan.</div>;

  return (
    <div style={{
      maxWidth: 500,
      margin: "48px auto",
      padding: 24,
      background: "white",
      borderRadius: 16,
      boxShadow: "0 6px 32px #0001"
    }}>
      <h1 style={{ color: "#2563eb", marginBottom: 24 }}>Profil Client</h1>
      <table style={{ width: "100%", fontSize: 18 }}>
        <tbody>
          <tr>
            <td style={{ fontWeight: "bold", padding: 8 }}>Client ID</td>
            <td style={{ padding: 8 }}>{profile.client_id}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", padding: 8 }}>Nama</td>
            <td style={{ padding: 8 }}>{profile.nama || profile.name}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: "bold", padding: 8 }}>Operator</td>
            <td style={{ padding: 8 }}>{profile.operator || profile.client_operator}</td>
          </tr>
          {/* Tambah field lain sesuai response API */}
        </tbody>
      </table>
      <button
        onClick={() => {
          localStorage.removeItem("cicero_token");
          localStorage.removeItem("client_id");
          router.push("/login");
        }}
        style={{
          marginTop: 32,
          padding: "10px 32px",
          background: "#ef4444",
          color: "white",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        Logout
      </button>
    </div>
  );
}
