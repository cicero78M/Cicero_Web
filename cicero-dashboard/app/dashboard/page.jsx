// app/dashboard/page.jsx
"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, getRekapLikesIG } from "@/utils/api";
import ChartAbsensi from "@/components/ChartAbsensi";
import CardStat from "@/components/CardStat";
import Loader from "@/components/Loader";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ambil token dari localStorage/session/cookie, sesuaikan dengan sistem auth Anda
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    if (!token) return;

    async function fetchData() {
      try {
        // Ambil stats global
        const statsRes = await getDashboardStats(token);
        setStats(statsRes.data);

        // Ambil data rekap likes IG (ganti client_id sesuai kebutuhan user)
        const client_id = statsRes.data?.client_id || "BOJONEGORO";
        const rekapRes = await getRekapLikesIG(token, client_id);

        // Data untuk chart: [{ nama_user, jumlah_like }]
        setChartData(rekapRes.data?.users || []);
      } catch (err) {
        alert("Gagal mengambil data: " + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  if (loading) return <Loader />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <CardStat title="Klien" value={stats?.clients || 0} />
        <CardStat title="User" value={stats?.users || 0} />
        <CardStat title="IG Post Hari Ini" value={stats?.igPosts || 0} />
        <CardStat title="TikTok Post Hari Ini" value={stats?.ttPosts || 0} />
      </div>
      <div className="mt-8">
        <h3 className="font-semibold text-lg mb-4">Rekap Absensi Likes IG Hari Ini</h3>
        <ChartAbsensi data={chartData} />
      </div>
    </div>
  );
}
