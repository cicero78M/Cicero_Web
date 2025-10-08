"use client";
import { useState } from "react";
import Loader from "@/components/Loader";
import ChartBox from "@/components/likes/instagram/ChartBox";
import SummaryItem from "@/components/likes/instagram/SummaryItem";
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
    isDitbinmasScopedClient,
    isDitbinmasRole,
  } = useInstagramLikesData({ viewBy, customDate, fromDate, toDate });

  const viewOptions = VIEW_OPTIONS;
  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 text-slate-700">
        <div className="rounded-3xl border border-rose-300/60 bg-white/80 px-8 py-6 text-center text-rose-600 shadow-[0_0_35px_rgba(248,113,113,0.18)] backdrop-blur">
          {error}
        </div>
      </div>
    );

  // Group chartData by kelompok jika bukan direktorat
  const kelompok = isDirectorate ? null : groupUsersByKelompok(chartData);
  const shouldGroupByClient =
    isDirectorate && !isDitbinmasScopedClient && !isDitbinmasRole;
  const directorateGroupBy = shouldGroupByClient ? "client_id" : "divisi";
  const directorateOrientation = shouldGroupByClient ? "horizontal" : "vertical";
  const directorateTitle = shouldGroupByClient
    ? "POLRES JAJARAN"
    : `DIVISI / SATFUNG${clientName ? ` - ${clientName}` : ""}`;

  const totalUser = Number(rekapSummary.totalUser) || 0;
  const totalTanpaUsername = Number(rekapSummary.totalTanpaUsername) || 0;
  const validUserCount = Math.max(0, totalUser - totalTanpaUsername);
  const getPercentage = (value, base = validUserCount) => {
    const denominator = Number(base);
    if (!denominator) return undefined;
    const numerator = Number(value) || 0;
    return (numerator / denominator) * 100;
  };

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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50 text-slate-700">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.3),_transparent_65%)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,_rgba(165,243,252,0.35),_transparent_70%)]" />
      <div className="relative flex min-h-screen items-start justify-center">
        <div className="w-full max-w-6xl px-4 py-12 md:px-10">
          <div className="flex flex-col gap-10">
            <div className="relative overflow-hidden rounded-3xl border border-sky-200/60 bg-white/70 p-6 shadow-[0_0_48px_rgba(96,165,250,0.25)] backdrop-blur">
              <div className="pointer-events-none absolute -top-10 left-8 h-32 w-32 rounded-full bg-sky-200/50 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-14 right-10 h-36 w-36 rounded-full bg-indigo-200/50 blur-3xl" />
              <div className="relative flex flex-col gap-6">
                <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-sky-700">
                      Instagram Engagement Insight
                    </h1>
                    <p className="mt-1 max-w-2xl text-sm text-slate-600">
                      Pantau performa likes dan komentar harian dengan visualisasi chart bar.
                    </p>
                  </div>
                </header>
                <div className="rounded-2xl border border-sky-100/60 bg-white/60 p-4 shadow-inner backdrop-blur">
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
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <SummaryItem
                    label="Jumlah IG Post"
                    value={rekapSummary.totalIGPost}
                    color="blue"
                    icon={
                      <Camera className="h-7 w-7 text-sky-500 drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]" />
                    }
                  />
                  <SummaryItem
                    label="Total User"
                    value={rekapSummary.totalUser}
                    color="gray"
                    icon={
                      <User className="h-7 w-7 text-slate-500 drop-shadow-[0_0_12px_rgba(148,163,184,0.35)]" />
                    }
                  />
                  <SummaryItem
                    label="Sudah Likes"
                    value={rekapSummary.totalSudahLike}
                    color="green"
                    icon={
                      <ThumbsUp className="h-7 w-7 text-teal-500 drop-shadow-[0_0_12px_rgba(45,212,191,0.4)]" />
                    }
                    percentage={getPercentage(rekapSummary.totalSudahLike)}
                  />
                  <SummaryItem
                    label="Kurang Likes"
                    value={rekapSummary.totalKurangLike}
                    color="orange"
                    icon={
                      <ThumbsDown className="h-7 w-7 text-sky-500 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" />
                    }
                    percentage={getPercentage(rekapSummary.totalKurangLike)}
                  />
                  <SummaryItem
                    label="Belum Likes"
                    value={rekapSummary.totalBelumLike}
                    color="red"
                    icon={
                      <ThumbsDown className="h-7 w-7 text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.4)]" />
                    }
                    percentage={getPercentage(rekapSummary.totalBelumLike)}
                  />
                  <SummaryItem
                    label="Tanpa Username"
                    value={rekapSummary.totalTanpaUsername}
                    color="gray"
                    icon={
                      <UserX className="h-7 w-7 text-slate-500 drop-shadow-[0_0_12px_rgba(148,163,184,0.35)]" />
                    }
                    percentage={getPercentage(
                      rekapSummary.totalTanpaUsername,
                      totalUser,
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Chart per kelompok / polres */}
            {isDirectorate ? (
              <ChartBox
                title={directorateTitle}
                users={chartData}
                totalPost={rekapSummary.totalIGPost}
                groupBy={directorateGroupBy}
                orientation={directorateOrientation}
                sortBy="percentage"
                narrative={
                  shouldGroupByClient
                    ? undefined
                    : "Grafik dan tabel ini menampilkan perbandingan capaian likes berdasarkan divisi/satfung."
                }
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

            <div className="flex justify-end gap-3">
              <button
                onClick={handleCopyRekap}
                className="group inline-flex items-center gap-2 rounded-2xl border border-teal-300/60 bg-teal-200/50 px-6 py-3 text-lg font-semibold text-teal-700 shadow-[0_0_25px_rgba(45,212,191,0.35)] transition-colors hover:border-teal-400/70 hover:bg-teal-200/70"
              >
                <Copy className="h-5 w-5 text-teal-600" />
                Salin Rekap
              </button>
              <Link
                href="/likes/instagram/rekap"
                className="inline-flex items-center gap-2 rounded-2xl border border-sky-300/60 bg-sky-200/50 px-6 py-3 text-lg font-semibold text-sky-700 shadow-[0_0_25px_rgba(96,165,250,0.35)] transition-colors hover:border-sky-400/70 hover:bg-sky-200/70"
              >
                <ArrowRight className="h-5 w-5 text-sky-600" />
                Lihat Rekap Detail
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

