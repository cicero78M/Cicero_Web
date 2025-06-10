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
      <div className="flex items-center justify-center min-h-[80vh] bg-gray-100 p-2">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center text-red-500 font-bold max-w-sm w-full">{error}</div>
      </div>
    );

  if (!clientProfile)
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-gray-100 p-2">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center text-gray-600 font-bold max-w-sm w-full">
          Data profil client tidak tersedia.
        </div>
      </div>
    );

  const igUsername = clientProfile.client_insta?.replace(/^@/, "");
  const tiktokUsername = clientProfile.client_tiktok?.replace(/^@/, "");

  return (
    <div className="min-h-[80vh] bg-gradient-to-br from-blue-100 via-fuchsia-50 to-white flex items-center justify-center py-8 px-2">
      <div className="w-full max-w-2xl">
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl px-4 md:px-10 py-7 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-pink-500 via-blue-500 to-fuchsia-500 flex items-center justify-center shadow">
                <span className="text-3xl text-white">📋</span>
              </div>
              <div>
                <div className="text-xl md:text-2xl font-extrabold text-blue-700">Client Profile</div>
                <div className="text-xs md:text-sm text-gray-400 font-semibold uppercase tracking-wide">
                  {clientProfile.client_id}
                </div>
              </div>
            </div>
            {clientProfile.client_status !== undefined && (
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold
                  ${clientProfile.client_status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                {clientProfile.client_status ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    Aktif
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    Tidak Aktif
                  </>
                )}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
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

// Komponen Row dengan rata dan no overflow
function Row({ label, value, status }) {
  return (
    <div className="flex items-center py-2 gap-2">
      <div className="w-28 text-gray-500 font-medium flex-shrink-0">{label}</div>
      <div className="text-gray-300 select-none">:</div>
      <div className="flex-1 text-gray-800 flex flex-wrap items-center gap-2 break-words">{value}{status && status}</div>
    </div>
  );
}
