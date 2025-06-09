"use client";
import { useEffect, useState } from "react";
import { getClientProfile } from "@/utils/api";
import Loader from "@/components/Loader";

export default function DashboardPage() {
  const [clientProfile, setClientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const client_id =
      typeof window !== "undefined" ? localStorage.getItem("client_id") : null;

    if (!token || !client_id) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        const profileRes = await getClientProfile(token, client_id);
        setClientProfile(profileRes.client || profileRes.profile || profileRes);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, []);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  if (!clientProfile)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-gray-600 font-bold">
          Data profil client tidak tersedia.
        </div>
      </div>
    );

  // Helper: bikin link Instagram dan TikTok
  const igUsername = clientProfile.client_insta?.replace(/^@/, "");
  const tiktokUsername = clientProfile.client_tiktok?.replace(/^@/, "");

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-lg p-10">
          <div className="text-3xl font-bold text-blue-700 mb-6 text-center">Profil Client</div>
          <div className="divide-y">
            {/* Isi profil */}
            <Row label="Client ID" value={<span className="font-mono">{clientProfile.client_id}</span>} />
            <Row label="Nama" value={clientProfile.nama} />
            <Row label="Tipe" value={clientProfile.client_type} />
            <Row
              label="Status"
              value={
                <span className={`font-semibold ${clientProfile.client_status ? "text-green-600" : "text-red-600"}`}>
                  {clientProfile.client_status ? "Aktif" : "Tidak Aktif"}
                </span>
              }
            />
            <Row
              label="Instagram"
              value={
                igUsername ? (
                  <a
                    href={`https://instagram.com/${igUsername}`}
                    className="text-blue-700 underline font-semibold hover:text-blue-900 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {clientProfile.client_insta}
                  </a>
                ) : (
                  "-"
                )
              }
              status={
                clientProfile.client_insta_status !== undefined && (
                  <span
                    className={`ml-2 text-xs ${clientProfile.client_insta_status ? "text-green-600" : "text-red-600"}`}
                  >
                    ({clientProfile.client_insta_status ? "Aktif" : "Tidak Aktif"})
                  </span>
                )
              }
            />
            <Row
              label="TikTok"
              value={
                tiktokUsername ? (
                  <a
                    href={`https://www.tiktok.com/@${tiktokUsername}`}
                    className="text-blue-700 underline font-semibold hover:text-blue-900 transition"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {clientProfile.client_tiktok}
                  </a>
                ) : (
                  "-"
                )
              }
              status={
                clientProfile.client_tiktok_status !== undefined && (
                  <span
                    className={`ml-2 text-xs ${clientProfile.client_tiktok_status ? "text-green-600" : "text-red-600"}`}
                  >
                    ({clientProfile.client_tiktok_status ? "Aktif" : "Tidak Aktif"})
                  </span>
                )
              }
            />
            <Row label="Administrator" value={clientProfile.client_super || "-"} />
            <Row label="Operator" value={clientProfile.client_operator || "-"} />
            <Row label="Group" value={clientProfile.client_group || "-"} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen Row untuk align ":" dan style rata
function Row({ label, value, status }) {
  return (
    <div className="flex items-center py-3 gap-3">
      <div className="w-36 text-gray-500 font-medium flex-shrink-0 text-right">{label}</div>
      <div className="text-gray-400 select-none">:</div>
      <div className="flex-1 text-gray-900 flex items-center gap-2">{value}{status && status}</div>
    </div>
  );
}
