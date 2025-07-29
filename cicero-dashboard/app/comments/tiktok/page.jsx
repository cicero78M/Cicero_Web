"use client";
import { useEffect, useState } from "react";
import { getDashboardStats, getRekapKomentarTiktok } from "@/utils/api";
import Loader from "@/components/Loader";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";
import ChartHorizontal from "@/components/ChartHorizontal";
import { groupUsersByKelompok } from "@/utils/grouping";
import Link from "next/link";
import Narrative from "@/components/Narrative";
import useRequireAuth from "@/hooks/useRequireAuth";
import ViewDataSelector, {
  getPeriodeDateForView,
} from "@/components/ViewDataSelector";
import {
  Music,
  User,
  MessageCircle,
  X,
  ArrowRight
} from "lucide-react";

export default function TiktokKomentarTrackingPage() {
  useRequireAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBy, setViewBy] = useState("today");
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
        // Gunakan semua kemungkinan key post TikTok (ttPosts/tiktokPosts)
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

        const { periode, date } = getPeriodeDateForView(viewBy);
        const rekapRes = await getRekapKomentarTiktok(token, client_id, periode, date);
        const users = Array.isArray(rekapRes.data) ? rekapRes.data : [];

        // Ambil field TikTok Post dengan fallback urutan prioritas
        const totalTiktokPost =
          statsData?.ttPosts ||
          statsData?.tiktokPosts ||
          statsData.ttPosts ||
          statsData.tiktokPosts ||
          0;

        const totalUser = users.length;
        const isZeroPost = (totalTiktokPost || 0) === 0;
        const totalSudahKomentar = isZeroPost
          ? 0
          : users.filter((u) => Number(u.jumlah_komentar) > 0 || u.exception)
              .length;
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
  }, [viewBy]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  // Group chartData by kelompok (BAG, SAT, dst)
  const kelompok = groupUsersByKelompok(chartData);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-5xl px-2 md:px-8 py-8">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <h1 className="text-2xl md:text-3xl font-bold text-pink-700 mb-2">
              TikTok Comments Tracking
            </h1>

            {/* Card Ringkasan */}
            <div className="bg-gradient-to-tr from-fuchsia-50 to-white rounded-2xl shadow flex flex-col md:flex-row items-stretch justify-between p-3 md:p-5 gap-2 md:gap-4 border">
              <SummaryItem
                label="TikTok Post Hari Ini"
                value={rekapSummary.totalTiktokPost}
                color="fuchsia"
                icon={<Music className="text-fuchsia-400" />}
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
                label="Sudah Komentar"
                value={rekapSummary.totalSudahKomentar}
                color="green"
                icon={<MessageCircle className="text-green-500" />}
              />
              <Divider />
              <SummaryItem
                label="Belum Komentar"
                value={rekapSummary.totalBelumKomentar}
                color="red"
                icon={<X className="text-red-500" />}
              />
            </div>

            {/* Switch Periode */}
            <div className="flex items-center justify-end gap-3 mb-2">
              <ViewDataSelector value={viewBy} onChange={setViewBy} />
            </div>

            {/* Chart per kelompok */}
            <div className="flex flex-col gap-6">
              <ChartBox
                title="BAG"
                users={kelompok.BAG}
                totalTiktokPost={rekapSummary.totalTiktokPost}
                fieldJumlah="jumlah_komentar"
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi BAG."
              />
              <ChartBox
                title="SAT"
                users={kelompok.SAT}
                totalTiktokPost={rekapSummary.totalTiktokPost}
                fieldJumlah="jumlah_komentar"
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi SAT."
              />
              <ChartBox
                title="SI & SPKT"
                users={kelompok["SI & SPKT"]}
                totalTiktokPost={rekapSummary.totalTiktokPost}
                fieldJumlah="jumlah_komentar"
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi SI & SPKT."
              />
              <ChartHorizontal
                title="POLSEK"
                users={kelompok.POLSEK}
                totalPost={rekapSummary.totalTiktokPost}
                fieldJumlah="jumlah_komentar"
                labelSudah="User Sudah Komentar"
                labelBelum="User Belum Komentar"
                labelTotal="Total Komentar"
              />
              <Narrative>
                Grafik POLSEK menggambarkan distribusi komentar antar user dari
                setiap polsek serta total komentar yang berhasil dikumpulkan.
              </Narrative>
            </div>

            <div className="flex justify-end my-2">
              <Link
                href="/comments/tiktok/rekap"
                className="bg-pink-700 hover:bg-pink-800 text-white font-bold px-6 py-3 rounded-xl shadow transition-all duration-150 text-lg flex items-center gap-2"
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
  totalTiktokPost,
  fieldJumlah,
  narrative,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-bold text-pink-700 mb-2 text-center">{title}</div>
      {users && users.length > 0 ? (
        <ChartDivisiAbsensi
          users={users}
          title={title}
          orientation={orientation}
          totalPost={totalTiktokPost}
          fieldJumlah={fieldJumlah}
          labelSudah="User Sudah Komentar"
          labelBelum="User Belum Komentar"
          labelTotal="Total Komentar"
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
    fuchsia: "text-fuchsia-700",
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
  return <div className="hidden md:block w-px bg-gray-200 mx-2 my-2"></div>;
}
