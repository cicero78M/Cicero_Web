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
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-2">
        <div className="bg-white rounded-lg shadow-md p-4 text-center text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  if (!clientProfile)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-2">
        <div className="bg-white rounded-lg shadow-md p-4 text-center text-gray-600 font-bold">
          Data profil client tidak tersedia.
        </div>
      </div>
    );

  const igUsername = clientProfile.client_insta?.replace(/^@/, "");
  const tiktokUsername = clientProfile.client_tiktok?.replace(/^@/, "");

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-xl px-2 md:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-8">
          <div className="text-2xl md:text-3xl font-bold text-blue-700 mb-4 md:mb-6 text-center">
            Profil Client
          </div>
          <div className="divide-y">
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
    <div className="flex items-center py-2 md:py-3 gap-2 md:gap-3">
      <div className="w-28 md:w-36 text-gray-500 font-medium flex-shrink-0 text-right">{label}</div>
      <div className="text-gray-400 select-none">:</div>
      <div className="flex-1 text-gray-900 flex items-center gap-2">{value}{status && status}</div>
    </div>
  );
}
