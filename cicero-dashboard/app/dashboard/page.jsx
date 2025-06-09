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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 md:p-8 max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-xl shadow p-8">
          <div className="text-2xl font-bold text-blue-700 mb-4">Profil Client</div>
          <div className="flex flex-col gap-2">
            <div>
              <span className="text-gray-500 font-medium">Client ID:</span>
              <span className="ml-2 text-gray-900 font-mono">{clientProfile.client_id}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Nama:</span>
              <span className="ml-2">{clientProfile.nama}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Tipe:</span>
              <span className="ml-2">{clientProfile.client_type}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Status:</span>
              <span className={`ml-2 font-semibold ${clientProfile.client_status ? "text-green-600" : "text-red-600"}`}>
                {clientProfile.client_status ? "Aktif" : "Tidak Aktif"}
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Instagram:</span>
              <span className="ml-2">{clientProfile.client_insta || "-"}</span>
              <span className={`ml-2 text-xs ${clientProfile.client_insta_status ? "text-green-600" : "text-red-600"}`}>
                ({clientProfile.client_insta_status ? "Aktif" : "Tidak Aktif"})
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">TikTok:</span>
              <span className="ml-2">{clientProfile.client_tiktok || "-"}</span>
              <span className={`ml-2 text-xs ${clientProfile.client_tiktok_status ? "text-green-600" : "text-red-600"}`}>
                ({clientProfile.client_tiktok_status ? "Aktif" : "Tidak Aktif"})
              </span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Operator:</span>
              <span className="ml-2">{clientProfile.client_operator || "-"}</span>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Group:</span>
              <span className="ml-2">{clientProfile.client_group || "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
