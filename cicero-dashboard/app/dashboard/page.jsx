"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, getRekapLikesIG } from "@/utils/api";
import CardStat from "@/components/CardStat";
import Loader from "@/components/Loader";
import RekapLikesIG from "@/components/RekapLikesIG";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("cicero_token")
        : null;
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const statsRes = await getDashboardStats(token);
        setStats(statsRes.data || statsRes); // backend bisa kirim { success, data: ... } atau langsung objek

        const client_id =
          statsRes.data?.client_id ||
          statsRes.client_id ||
          localStorage.getItem("client_id");
        if (!client_id) {
          setError("Client ID tidak ditemukan.");
          setLoading(false);
          return;
        }

        const rekapRes = await getRekapLikesIG(token, client_id);
        // FINAL: .data langsung array, tanpa .users
        setChartData(Array.isArray(rekapRes.data) ? rekapRes.data : []);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CardStat title="Klien" value={stats?.clients || 0} />
        <CardStat title="User" value={stats?.users || 0} />
        <CardStat title="IG Post Hari Ini" value={stats?.igPosts || 0} />
        <CardStat title="TikTok Post Hari Ini" value={stats?.ttPosts || 0} />
      </div>

      <div className="mt-8">
        <RekapLikesIG users={chartData} />
        <ChartDivisiAbsensi users={chartData} />
      </div>
    </div>
  );
}
