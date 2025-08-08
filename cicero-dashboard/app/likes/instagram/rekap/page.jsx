"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, getRekapLikesIG } from "@/utils/api";
import Loader from "@/components/Loader";
import RekapLikesIG from "@/components/RekapLikesIG";
import Link from "next/link";
import useRequireAuth from "@/hooks/useRequireAuth";
import ViewDataSelector, {
  getPeriodeDateForView,
} from "@/components/ViewDataSelector";
import { ArrowLeft } from "lucide-react";

// Helper: handle boolean/string/number for exception
function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

export default function RekapLikesIGPage() {
  useRequireAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [rekapSummary, setRekapSummary] = useState({
    totalUser: 0,
    totalSudahLike: 0,
    totalBelumLike: 0,
    totalIGPost: 0,
  });


  useEffect(() => {
    setLoading(true);
    setError("");
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
        const { periode, date } = getPeriodeDateForView(viewBy, customDate);
        const statsRes = await getDashboardStats(token, periode, date);
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

        const rekapRes = await getRekapLikesIG(token, client_id, periode, date);
        const users = Array.isArray(rekapRes?.data)
          ? rekapRes.data
          : Array.isArray(rekapRes)
          ? rekapRes
          : [];

        // Hitung jumlah IG post dari stats
        const igPostsData =
          statsData?.igPosts ??
          statsData?.instagramPosts ??
          statsData.igPosts ??
          statsData.instagramPosts ??
          0;
        const totalIGPost = Array.isArray(igPostsData)
          ? igPostsData.length
          : Number(igPostsData) || 0;
        const isZeroPost = (totalIGPost || 0) === 0;
        const totalUser = users.length;
        const totalSudahLike = isZeroPost
          ? 0
          : users.filter(
              (u) =>
                Number(u.jumlah_like) >= totalIGPost || isException(u.exception)
            ).length;
        const totalBelumLike = totalUser - totalSudahLike;

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
  }, [viewBy, customDate]);

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
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700">
              Rekapitulasi Likes Instagram
            </h1>
            <Link
              href="/likes/instagram"
              className="inline-block bg-gray-100 hover:bg-blue-50 text-blue-700 border border-blue-300 font-semibold px-4 py-2 rounded-lg transition-all duration-150 shadow flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
          <div className="flex items-center justify-end gap-3 mb-2">
            <ViewDataSelector
              value={viewBy}
              onChange={setViewBy}
              date={customDate}
              onDateChange={setCustomDate}
            />
          </div>

          {/* Kirim data dari fetch ke komponen rekap likes */}
          <RekapLikesIG
            users={chartData}
            totalIGPost={rekapSummary.totalIGPost}
          />
        </div>
      </div>
    </div>
  );
}
