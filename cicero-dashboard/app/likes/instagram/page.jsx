"use client";
import { useState } from "react";
import Loader from "@/components/Loader";
import ChartBox from "@/components/likes/instagram/ChartBox";
import SummaryItem from "@/components/likes/instagram/SummaryItem";
import Divider from "@/components/likes/instagram/Divider";
import ChartHorizontal from "@/components/ChartHorizontal";
import { groupUsersByKelompok } from "@/utils/grouping"; // pastikan path benar
import Link from "next/link";
import Narrative from "@/components/Narrative";
import useRequireAuth from "@/hooks/useRequireAuth";
import useInstagramLikesData from "@/hooks/useInstagramLikesData";
import ViewDataSelector, { VIEW_OPTIONS } from "@/components/ViewDataSelector";
import { showToast } from "@/utils/showToast";
import { buildInstagramRekap } from "@/utils/buildInstagramRekap";
import {
  Camera,
  User,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  UserX,
  Copy,
} from "lucide-react";

export default function InstagramEngagementInsightPage() {
  useRequireAuth();
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const {
    chartData,
    loading,
    error,
    rekapSummary,
    isDirectorate,
    clientName,
  } = useInstagramLikesData({ viewBy, customDate, fromDate, toDate });

  const viewOptions = VIEW_OPTIONS;
  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  // Group chartData by kelompok jika bukan direktorat
  const kelompok = isDirectorate ? null : groupUsersByKelompok(chartData);

  function handleCopyRekap() {
    const message = buildInstagramRekap(rekapSummary, chartData, clientName);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        showToast("Rekap disalin ke clipboard", "success");
      });
    } else {
      showToast(message, "info");
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-5xl px-2 md:px-8 py-8">
          <div className="flex flex-col gap-8">
            {/* Header */}
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
              Instagram Engagement Insight
            </h1>

            {/* Card Ringkasan */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-sm font-semibold text-gray-600">
                  View Data By:
                </span>
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
                  label="Kurang Likes"
                  value={rekapSummary.totalKurangLike}
                  color="orange"
                  icon={<ThumbsDown className="text-orange-500" />}
                />
                <Divider />
                <SummaryItem
                  label="Belum Likes"
                  value={rekapSummary.totalBelumLike}
                  color="red"
                  icon={<ThumbsDown className="text-red-500" />}
                />
                <Divider />
                <SummaryItem
                  label="Tanpa Username"
                  value={rekapSummary.totalTanpaUsername}
                  color="gray"
                  icon={<UserX className="text-gray-400" />}
                />
              </div>
            </div>

            {/* Chart per kelompok / polres */}
            {isDirectorate ? (
              <ChartBox
                title="POLRES JAJARAN"
                users={chartData}
                totalPost={rekapSummary.totalIGPost}
                groupBy="client_id"
                orientation="horizontal"
                sortBy="percentage"
              />
            ) : (
              <div className="flex flex-col gap-6">
                <ChartBox
                  title="BAG"
                  users={kelompok.BAG}
                  totalPost={rekapSummary.totalIGPost}
                  narrative="Grafik ini menunjukkan perbandingan jumlah like dari user di divisi BAG."
                  sortBy="percentage"
                />
                <ChartBox
                  title="SAT"
                  users={kelompok.SAT}
                  totalPost={rekapSummary.totalIGPost}
                  narrative="Grafik ini menunjukkan perbandingan jumlah like dari user di divisi SAT."
                  sortBy="percentage"
                />
                <ChartBox
                  title="SI & SPKT"
                  users={kelompok["SI & SPKT"]}
                  totalPost={rekapSummary.totalIGPost}
                  narrative="Grafik ini menunjukkan perbandingan jumlah like dari user di divisi SI & SPKT."
                  sortBy="percentage"
                />
                <ChartBox
                  title="LAINNYA"
                  users={kelompok.LAINNYA}
                  totalPost={rekapSummary.totalIGPost}
                  narrative="Grafik ini menunjukkan perbandingan jumlah like dari user di divisi lainnya."
                  sortBy="percentage"
                />
                <ChartHorizontal
                  title="POLSEK"
                  users={kelompok.POLSEK}
                  totalPost={rekapSummary.totalIGPost}
                  showTotalUser
                  sortBy="percentage"
                />
                <Narrative>
                  Grafik POLSEK memperlihatkan jumlah like Instagram dari setiap
                  polsek dan membandingkan partisipasi pengguna.
                </Narrative>
              </div>
            )}

            <div className="flex justify-end gap-2 my-2">
              <button
                onClick={handleCopyRekap}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl shadow transition-all duration-150 text-lg flex items-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Salin Rekap
              </button>
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

