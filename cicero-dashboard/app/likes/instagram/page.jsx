"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, getRekapLikesIG } from "@/utils/api";
import Loader from "@/components/Loader";
import RekapLikesIG from "@/components/RekapLikesIG";
import ChartBox from "@/components/ChartDivisiAbsensi";
import { groupUsersByKelompok } from "@/utils/grouping"; // pastikan path sudah benar

export default function InstagramLikesTrackingPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState("harian"); // "harian" | "bulanan"

  // Untuk rekap likes summary (total user, sudah likes, belum likes)
  const [rekapSummary, setRekapSummary] = useState({
    totalUser: 0,
    totalSudahLike: 0,
    totalBelumLike: 0,
    totalIGPost: 0,
  });

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
        setStats(statsRes.data || statsRes);

        const client_id =
          statsRes.data?.client_id ||
          statsRes.client_id ||
          localStorage.getItem("client_id");
        if (!client_id) {
          setError("Client ID tidak ditemukan.");
          setLoading(false);
          return;
        }

        const rekapRes = await getRekapLikesIG(token, client_id, periode);
        const users = Array.isArray(rekapRes.data) ? rekapRes.data : [];

        // Rekap summary
        const totalUser = users.length;
        const totalSudahLike = users.filter(
          (u) => Number(u.jumlah_like) > 0 || u.exception
        ).length;
        const totalBelumLike = totalUser - totalSudahLike;
        const totalIGPost =
          statsRes.data?.igPosts || statsRes.igPosts || 0;

        setRekapSummary({
          totalUser,
          totalSudahLike,
          totalBelumLike,
          totalIGPost,
        });
        setChartData(users);
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

  // Group chartData by kelompok
  const kelompok = groupUsersByKelompok(chartData);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
            Instagram Likes Tracking
          </h1>

          {/* Card Ringkasan */}
          <div className="bg-white rounded-xl shadow flex flex-col md:flex-row items-center justify-between p-4 md:p-6 gap-3">
            <div className="flex-1">
              <div className="text-gray-500 font-medium text-sm mb-1">
                IG Post Hari Ini
              </div>
              <div className="text-2xl md:text-3xl font-bold text-blue-700">
                {rekapSummary.totalIGPost}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-gray-500 font-medium text-sm mb-1">
                Total User
              </div>
              <div className="text-2xl md:text-3xl font-bold text-blue-700">
                {rekapSummary.totalUser}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-gray-500 font-medium text-sm mb-1">
                Sudah Likes
              </div>
              <div className="text-2xl md:text-3xl font-bold text-green-600">
                {rekapSummary.totalSudahLike}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-gray-500 font-medium text-sm mb-1">
                Belum Likes
              </div>
              <div className="text-2xl md:text-3xl font-bold text-red-500">
                {rekapSummary.totalBelumLike}
              </div>
            </div>
          </div>

          {/* Switch Periode */}
          <div className="flex items-center justify-end gap-3 mb-2">
            <span
              className={
                periode === "harian"
                  ? "font-semibold text-blue-700"
                  : "text-gray-400"
              }
            >
              Hari Ini
            </span>
            <button
              className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
                periode === "bulanan" ? "bg-blue-500" : "bg-gray-300"
              }`}
              onClick={() =>
                setPeriode(periode === "harian" ? "bulanan" : "harian")
              }
              aria-label="Switch periode"
              type="button"
            >
              <span
                className={`block w-6 h-6 bg-white rounded-full shadow absolute top-0 transition-all duration-200 ${
                  periode === "bulanan" ? "left-6" : "left-0"
                }`}
              />
            </button>
            <span
              className={
                periode === "bulanan"
                  ? "font-semibold text-blue-700"
                  : "text-gray-400"
              }
            >
              Bulan Ini
            </span>
          </div>

          {/* Chart per kelompok */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartBox title="BAG" users={kelompok.BAG} />
            <ChartBox title="SAT" users={kelompok.SAT} />
            <ChartBox title="SI & SPKT" users={kelompok["SI & SPKT"]} />
            <ChartBox title="POLSEK" users={kelompok.POLSEK} />
          </div>

          {/* Tabel Rekap */}
          <RekapLikesIG users={chartData} />
        </div>
      </div>
    </div>
  );
}
