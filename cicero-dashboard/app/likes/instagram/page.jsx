"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, getRekapLikesIG } from "@/utils/api";
import Loader from "@/components/Loader";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";
import ChartHorizontal from "@/components/ChartHorizontal";
import { groupUsersByKelompok } from "@/utils/grouping"; // pastikan path benar
import Link from "next/link";
import Narrative from "@/components/Narrative";
import useRequireAuth from "@/hooks/useRequireAuth";
import ViewDataSelector, {
  getPeriodeDateForView,
} from "@/components/ViewDataSelector";
import {
  Camera,
  User,
  ThumbsUp,
  ThumbsDown,
  ArrowRight
} from "lucide-react";

export default function InstagramLikesTrackingPage() {
  useRequireAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);

  // Untuk rekap likes summary (total user, sudah likes, belum likes)
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

        const rekapRes = await getRekapLikesIG(token, client_id, periode, date);
        const users = Array.isArray(rekapRes.data) ? rekapRes.data : [];

        // Rekap summary
        const totalUser = users.length;
        const igPostsData = statsRes.data?.igPosts ?? statsRes.igPosts ?? 0;
        const totalIGPost = Array.isArray(igPostsData)
          ? igPostsData.length
          : Number(igPostsData) || 0;
        const isZeroPost = (totalIGPost || 0) === 0;
        const totalSudahLike = isZeroPost
          ? 0
          : users.filter((u) => Number(u.jumlah_like) > 0 || u.exception)
              .length;
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

  // Group chartData by kelompok
  const kelompok = groupUsersByKelompok(chartData);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-5xl px-2 md:px-8 py-8">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
              Instagram Likes Tracking
            </h1>

            {/* Card Ringkasan */}
            <div className="bg-gradient-to-tr from-blue-50 to-white rounded-2xl shadow flex flex-col md:flex-row items-stretch justify-between p-3 md:p-5 gap-2 md:gap-4 border">
              <SummaryItem
                label="Jumlah IG Post"
                value={rekapSummary.totalIGPost}
                color="blue"
                icon={<Camera className="text-blue-400" />}
              />
              <Divider />
              <SummaryItem
                label="Total User"
                value={rekapSummary.totalUser}
                color="gray"
                icon={<User className="text-gray-400" />}
              />
              <Divider />
              <SummaryItem
                label="Sudah Likes"
                value={rekapSummary.totalSudahLike}
                color="green"
                icon={<ThumbsUp className="text-green-500" />}
              />
              <Divider />
              <SummaryItem
                label="Belum Likes"
                value={rekapSummary.totalBelumLike}
                color="red"
                icon={<ThumbsDown className="text-red-500" />}
              />
            </div>

            {/* Switch Periode */}
            <div className="flex items-center justify-end gap-3 mb-2">
              <ViewDataSelector
                value={viewBy}
                onChange={setViewBy}
                date={customDate}
                onDateChange={setCustomDate}
              />
            </div>

            {/* Chart per kelompok */}
            <div className="flex flex-col gap-6">
              <ChartBox
                title="BAG"
                users={kelompok.BAG}
                totalIGPost={rekapSummary.totalIGPost}
                narrative="Grafik ini menunjukkan perbandingan jumlah like dari user di divisi BAG."
              />
              <ChartBox
                title="SAT"
                users={kelompok.SAT}
                totalIGPost={rekapSummary.totalIGPost}
                narrative="Grafik ini menunjukkan perbandingan jumlah like dari user di divisi SAT."
              />
              <ChartBox
                title="SI & SPKT"
                users={kelompok["SI & SPKT"]}
                totalIGPost={rekapSummary.totalIGPost}
                narrative="Grafik ini menunjukkan perbandingan jumlah like dari user di divisi SI & SPKT."
              />
              <ChartHorizontal
                title="POLSEK"
                users={kelompok.POLSEK}
                totalIGPost={rekapSummary.totalIGPost}
              />
              <Narrative>
                Grafik POLSEK memperlihatkan jumlah like Instagram dari setiap
                polsek dan membandingkan partisipasi pengguna.
              </Narrative>
            </div>

            <div className="flex justify-end my-2">
              <Link
                href="/likes/instagram/rekap"
                className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-6 py-3 rounded-xl shadow transition-all duration-150 text-lg flex items-center gap-2"
              >
                <ArrowRight className="w-5 h-5 inline" />
                Lihat Rekap Detail
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Komponen ChartBox di file yang sama
function ChartBox({
  title,
  users,
  orientation = "vertical",
  totalIGPost,
  narrative,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-bold text-blue-700 mb-2 text-center">{title}</div>
      {users && users.length > 0 ? (
        <ChartDivisiAbsensi
          users={users}
          title={title}
          orientation={orientation}
          totalIGPost={totalIGPost}
        />
      ) : (
        <div className="text-center text-gray-400 text-sm">Tidak ada data</div>
      )}
      {narrative && <Narrative>{narrative}</Narrative>}
    </div>
  );
}

function SummaryItem({ label, value, color = "gray", icon }) {
  const colorMap = {
    blue: "text-blue-700",
    green: "text-green-600",
    red: "text-red-500",
    gray: "text-gray-700",
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-2">
      <div className="mb-1">{icon}</div>
      <div className={`text-3xl md:text-4xl font-bold ${colorMap[color]}`}>
        {value}
      </div>
      <div className="text-xs md:text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wide text-center">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  // Vertical divider in desktop, horizontal in mobile
  return <div className="hidden md:block w-px bg-gray-200 mx-2 my-2"></div>;
}
