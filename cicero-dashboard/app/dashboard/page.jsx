"use client";
import { useEffect, useState } from "react";
import { getClientProfile } from "@/utils/api";
import Loader from "@/components/Loader";

export default function DashboardPage() {
  const [clientProfile, setClientProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const client_id = typeof window !== "undefined" ? localStorage.getItem("client_id") : null;

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
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-fuchsia-50 to-white flex items-center justify-center overflow-hidden">
        <div className="bg-white rounded-2xl shadow-lg text-center text-red-500 font-bold max-w-sm w-full p-6">{error}</div>
      </div>
    );

  if (!clientProfile)
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-fuchsia-50 to-white flex items-center justify-center overflow-hidden">
        <div className="bg-white rounded-2xl shadow-lg text-center text-gray-600 font-bold max-w-sm w-full p-6">
          Data profil client tidak tersedia.
        </div>
      </div>
    );

  const igUsername = clientProfile.client_insta?.replace(/^@/, "");
  const tiktokUsername = clientProfile.client_tiktok?.replace(/^@/, "");

  return (
  <div className="min-h-screen bg-gradient-to-br from-blue-100 via-fuchsia-50 to-white transition-all duration-200 pl-0 md:pl-64 flex items-center justify-center">
    <div className="w-full max-w-md px-2">
        <div className="bg-white rounded-2xl shadow-2xl px-4 md:px-8 py-6 md:py-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 via-blue-500 to-fuchsia-500 flex items-center justify-center shadow mb-2">
              <span className="text-4xl text-white">📋</span>
            </div>
            <div className="text-xl font-extrabold text-blue-700">{clientProfile.client_id}</div>
            <div className="flex items-center mt-2">
              {clientProfile.client_status ? (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Row label="Nama" value={clientProfile.nama || "-"} />
            <Row label="Tipe" value={clientProfile.client_type || "-"} />
            <Row
              label="Instagram"
              value={
                igUsername ? (
                  <a
                    href={`https://instagram.com/${igUsername}`}
                    className="text-pink-600 underline font-semibold hover:text-pink-800 transition"
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
                  clientProfile.client_insta_status ? (
                    <svg className="w-5 h-5 ml-1 text-green-600 inline" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 ml-1 text-red-500 inline" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )
                )
              }
            />
            <Row
              label="TikTok"
              value={
                tiktokUsername ? (
                  <a
                    href={`https://www.tiktok.com/@${tiktokUsername}`}
                    className="text-blue-600 underline font-semibold hover:text-blue-800 transition"
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
                  clientProfile.client_tiktok_status ? (
                    <svg className="w-5 h-5 ml-1 text-green-600 inline" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 ml-1 text-red-500 inline" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )
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

// Row dengan padding atas bawah seperti sebelumnya
function Row({ label, value, status }) {
  return (
    <div className="flex items-center py-2 px-2 gap-2 w-full">
      <div className="w-28 text-gray-500 font-medium flex-shrink-0">{label}</div>
      <div className="text-gray-300 select-none">:</div>
      <div className="flex-1 text-gray-800 flex flex-wrap items-center gap-1 break-all">{value}{status && status}</div>
    </div>
  );
}
