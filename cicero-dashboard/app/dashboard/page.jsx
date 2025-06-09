"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, getRekapLikesIG, getClientProfile } from "@/utils/api";
import CardStat from "@/components/CardStat";
import Loader from "@/components/Loader";
import RekapLikesIG from "@/components/RekapLikesIG";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState("harian"); // "harian" | "bulanan"
  const [clientProfile, setClientProfile] = useState(null);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const client_id = typeof window !== "undefined" ? localStorage.getItem("client_id") : null;

    if (!token || !client_id) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const statsRes = await getDashboardStats(token);
        setStats(statsRes.data || statsRes);

        // Fetch profile client
        const profileRes = await getClientProfile(token, client_id);
        setClientProfile(profileRes.profile || profileRes);

        const rekapRes = await getRekapLikesIG(token, client_id, periode);
        setChartData(Array.isArray(rekapRes.data) ? rekapRes.data : []);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [periode]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* === Profil Client Login === */}
        {clientProfile && (
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <div className="text-lg font-semibold text-blue-700">Profil Client</div>
                <div className="text-md font-bold mt-1">{clientProfile.client_id}</div>
                <div className="text-gray-600">{clientProfile.nama || clientProfile.name}</div>
              </div>
              <div className="text-sm text-gray-400">
                Operator: <span className="font-medium">{clientProfile.operator || clientProfile.client_operator}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CardStat title="Klien" value={stats?.clients || 0} />
            <CardStat title="User" value={stats?.users || 0} />
            <CardStat title="IG Post Hari Ini" value={stats?.igPosts || 0} />
            <CardStat title="TikTok Post Hari Ini" value={stats?.ttPosts || 0} />
          </div>
          {/* Switch Periode */}
          <div className="flex items-center justify-end gap-3 mb-2">
            <span className={periode === "harian" ? "font-semibold text-blue-700" : "text-gray-400"}>Hari Ini</span>
            <button
              className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
                periode === "bulanan" ? "bg-blue-500" : "bg-gray-300"
              }`}
              onClick={() => setPeriode(periode === "harian" ? "bulanan" : "harian")}
              aria-label="Switch periode"
              type="button"
            >
              <span
                className={`block w-6 h-6 bg-white rounded-full shadow absolute top-0 transition-all duration-200 ${
                  periode === "bulanan" ? "left-6" : "left-0"
                }`}
              />
            </button>
            <span className={periode === "bulanan" ? "font-semibold text-blue-700" : "text-gray-400"}>Bulan Ini</span>
          </div>
          <ChartDivisiAbsensi users={chartData} />
          <RekapLikesIG users={chartData} />
        </div>
      </div>
    </div>
  );
}
