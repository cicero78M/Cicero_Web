"use client";
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientNames,
} from "@/utils/api";
import Loader from "@/components/Loader";
import RekapKomentarTiktok from "@/components/RekapKomentarTiktok";
import Link from "next/link";
import useRequireAuth from "@/hooks/useRequireAuth";
import ViewDataSelector, {
  getPeriodeDateForView,
  VIEW_OPTIONS,
} from "@/components/ViewDataSelector";
import { ArrowLeft } from "lucide-react";

export default function RekapKomentarTiktokPage() {
  useRequireAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [rekapSummary, setRekapSummary] = useState({
    totalUser: 0,
    totalSudahKomentar: 0,
    totalBelumKomentar: 0,
    totalTiktokPost: 0,
  });

  const viewOptions = VIEW_OPTIONS;


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
        const selectedDate =
          viewBy === "custom_range"
            ? { startDate: fromDate, endDate: toDate }
            : customDate;
        const { periode, date, startDate, endDate } =
          getPeriodeDateForView(viewBy, selectedDate);
        const statsRes = await getDashboardStats(
          token,
          periode,
          date,
          startDate,
          endDate,
        );
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

        const rekapRes = await getRekapKomentarTiktok(
          token,
          client_id,
          periode,
          date,
          startDate,
          endDate,
        );
        const users = Array.isArray(rekapRes.data) ? rekapRes.data : [];

        // map client_id to client name for satker column
        const nameMap = await getClientNames(
          token,
          users.map((u) =>
            String(
              u.client_id || u.clientId || u.client || u.clientID || "",
            ),
          ),
        );
        const enrichedUsers = users.map((u) => {
          const cid = String(
            u.client_id || u.clientId || u.client || u.clientID || "",
          );
          const cName =
            nameMap[cid] ||
            u.nama_client ||
            u.client_name ||
            u.client ||
            cid;
          return { ...u, nama_client: cName, client_name: cName, client: cName };
        });

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
        setChartData(enrichedUsers);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [viewBy, customDate, fromDate, toDate]);

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
              className="inline-block bg-gray-100 hover:bg-pink-50 text-pink-700 border border-pink-300 font-semibold px-4 py-2 rounded-lg transition-all duration-150 shadow flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
          <div className="flex items-center justify-end gap-3 mb-2">
            <ViewDataSelector
              value={viewBy}
              onChange={setViewBy}
              options={viewOptions}
              date=
                {viewBy === "custom_range"
                  ? { startDate: fromDate, endDate: toDate }
                  : customDate}
              onDateChange={(val) => {
                if (viewBy === "custom_range") {
                  setFromDate(val.startDate || "");
                  setToDate(val.endDate || "");
                } else {
                  setCustomDate(val);
                }
              }}
            />
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
