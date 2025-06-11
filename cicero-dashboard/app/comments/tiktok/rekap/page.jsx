"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, getRekapKomentarTiktok } from "@/utils/api";
import Loader from "@/components/Loader";
import RekapKomentarTiktok from "@/components/RekapKomentarTiktok";
import Link from "next/link";

export default function RekapKomentarTiktokPage() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState("harian");
  const [rekapSummary, setRekapSummary] = useState({
    totalUser: 0,
    totalSudahKomentar: 0,
    totalBelumKomentar: 0,
    totalTiktokPost: 0,
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
        const statsData = statsRes.data || statsRes;

        const client_id =
          statsData?.client_id ||
          statsData.client_id ||
          localStorage.getItem("client_id");
        if (!client_id) {
          setError("Client ID tidak ditemukan.");
          setLoading(false);
          return;
        }

        const rekapRes = await getRekapKomentarTiktok(token, client_id, periode);
        const users = Array.isArray(rekapRes.data) ? rekapRes.data : [];

        // Sumber utama TikTok Post Hari Ini dari statsRes
        const totalTiktokPost =
          statsData?.ttPosts ||
          statsData?.tiktokPosts ||
          statsData.ttPosts ||
          statsData.tiktokPosts ||
          0;
        const isZeroPost = (totalTiktokPost || 0) === 0;
        const totalUser = users.length;
        const totalSudahKomentar = isZeroPost
          ? 0
          : users.filter(
              (u) => Number(u.jumlah_komentar) > 0 || u.exception
            ).length;
        const totalBelumKomentar = totalUser - totalSudahKomentar;

        setRekapSummary({
          totalUser,
          totalSudahKomentar,
          totalBelumKomentar,
          totalTiktokPost,
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-pink-700">
              Rekapitulasi Komentar TikTok
            </h1>
            <Link
              href="/comments/tiktok"
              className="inline-block bg-gray-100 hover:bg-pink-50 text-pink-700 border border-pink-300 font-semibold px-4 py-2 rounded-lg transition-all duration-150 shadow"
            >
              ← Kembali
            </Link>
          </div>
          <div className="flex items-center justify-end gap-3 mb-2">
            <span
              className={
                periode === "harian"
                  ? "font-semibold text-pink-700"
                  : "text-gray-400"
              }
            >
              Hari Ini
            </span>
            <button
              className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
                periode === "bulanan" ? "bg-pink-500" : "bg-gray-300"
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
                  ? "font-semibold text-pink-700"
                  : "text-gray-400"
              }
            >
              Bulan Ini
            </span>
          </div>

          {/* Kirim data ke komponen detail rekap TikTok */}
          <RekapKomentarTiktok
            users={chartData}
            totalTiktokPost={rekapSummary.totalTiktokPost}
          />
        </div>
      </div>
    </div>
  );
}
