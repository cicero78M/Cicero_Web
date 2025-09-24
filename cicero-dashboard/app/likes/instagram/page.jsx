"use client";
import { useEffect, useMemo, useState } from "react";
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
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    chartData,
    loading,
    error,
    rekapSummary,
    isDirectorate,
    clientName,
  } = useInstagramLikesData({ viewBy, customDate, fromDate, toDate });

  const viewOptions = VIEW_OPTIONS;
  useEffect(() => {
    if (!loading) {
      setHasLoaded(true);
      setIsRefreshing(false);
    } else if (hasLoaded) {
      setIsRefreshing(true);
    }
  }, [loading, hasLoaded]);

  if (!hasLoaded && loading) return <Loader />;
  if (error)
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-[-120px] h-[420px] w-[420px] rounded-full bg-sky-500/20 blur-[160px]" />
          <div className="absolute right-[-120px] top-1/3 h-[380px] w-[380px] rounded-full bg-fuchsia-400/20 blur-[160px]" />
        </div>
        <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
          <div className="max-w-lg rounded-3xl border border-rose-500/40 bg-slate-900/80 px-8 py-6 text-center text-rose-200 shadow-[0_0_35px_rgba(244,63,94,0.25)]">
            {error}
          </div>
        </div>
      </div>
    );

  // Group chartData by kelompok jika bukan direktorat
  const kelompok = useMemo(() => {
    if (isDirectorate) return null;
    return groupUsersByKelompok(chartData);
  }, [chartData, isDirectorate]);

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
    <div
      className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100"
      aria-busy={isRefreshing}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-120px] h-[420px] w-[420px] rounded-full bg-sky-500/20 blur-[160px]" />
        <div className="absolute right-[-120px] top-1/3 h-[380px] w-[380px] rounded-full bg-fuchsia-400/20 blur-[160px]" />
        <div className="absolute inset-x-0 bottom-[-180px] h-[320px] bg-gradient-to-t from-slate-900 via-slate-950/60 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        {isRefreshing && (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-20 flex justify-center sm:justify-end">
            <div className="flex items-center gap-2 rounded-full border border-sky-500/40 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200 shadow-[0_0_24px_rgba(56,189,248,0.25)]">
              <span
                className="h-4 w-4 rounded-full border-2 border-sky-400/80 border-t-transparent animate-spin"
                aria-hidden="true"
              ></span>
              Memuat data
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col gap-10">
          <div className="space-y-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-sky-200">
              Instagram Command
            </span>
            <h1 className="text-3xl font-semibold leading-tight text-slate-50 md:text-4xl">
              Instagram Engagement Command Center
            </h1>
            <p className="max-w-3xl text-sm text-slate-300 md:text-base">
              Pantau performa keterlibatan personel pada Instagram untuk {" "}
              <span className="font-semibold text-sky-200">
                {clientName || "satuan Anda"}
              </span>
              . Panel ini membantu mengidentifikasi personel yang sudah aktif
              memberi like, yang perlu ditingkatkan, hingga yang belum melakukan
              aktivitas sama sekali.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <ViewDataSelector
              value={viewBy}
              onChange={setViewBy}
              options={viewOptions}
              date={
                viewBy === "custom_range"
                  ? { startDate: fromDate, endDate: toDate }
                  : customDate
              }
              onDateChange={(val) => {
                if (viewBy === "custom_range") {
                  setFromDate(val.startDate || "");
                  setToDate(val.endDate || "");
                } else {
                  setCustomDate(val);
                }
              }}
              disabled={isRefreshing}
              className="justify-start gap-3 rounded-3xl border border-slate-800/70 bg-slate-900/70 px-4 py-4 backdrop-blur"
              labelClassName="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400/90"
              controlClassName="border-slate-700/60 bg-slate-900/70 text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryItem
                label="Jumlah IG Post"
                value={rekapSummary.totalIGPost}
                color="blue"
                icon={<Camera className="h-5 w-5" />}
              />
              <SummaryItem
                label="Total User"
                value={rekapSummary.totalUser}
                color="gray"
                icon={<User className="h-5 w-5" />}
              />
              <SummaryItem
                label="Sudah Like"
                value={rekapSummary.totalSudahLike}
                color="green"
                icon={<ThumbsUp className="h-5 w-5" />}
                percentage={getPercentage(rekapSummary.totalSudahLike)}
              />
              <SummaryItem
                label="Kurang Like"
                value={rekapSummary.totalKurangLike}
                color="orange"
                icon={<ThumbsDown className="h-5 w-5" />}
                percentage={getPercentage(rekapSummary.totalKurangLike)}
              />
              <SummaryItem
                label="Belum Like"
                value={rekapSummary.totalBelumLike}
                color="red"
                icon={<ThumbsDown className="h-5 w-5" />}
                percentage={getPercentage(rekapSummary.totalBelumLike)}
              />
              <SummaryItem
                label="Tanpa Username"
                value={rekapSummary.totalTanpaUsername}
                color="gray"
                icon={<UserX className="h-5 w-5" />}
                percentage={getPercentage(
                  rekapSummary.totalTanpaUsername,
                  totalUser,
                )}
              />
            </div>
          </div>

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
                users={kelompok?.BAG || []}
                totalPost={rekapSummary.totalIGPost}
                narrative="Grafik ini menampilkan perbandingan jumlah like Instagram dari user di divisi BAG."
                sortBy="percentage"
              />
              <ChartBox
                title="SAT"
                users={kelompok?.SAT || []}
                totalPost={rekapSummary.totalIGPost}
                narrative="Grafik ini menampilkan perbandingan jumlah like Instagram dari user di divisi SAT."
                sortBy="percentage"
              />
              <ChartBox
                title="SI & SPKT"
                users={kelompok?.["SI & SPKT"] || []}
                totalPost={rekapSummary.totalIGPost}
                narrative="Grafik ini menampilkan perbandingan jumlah like Instagram dari user di divisi SI & SPKT."
                sortBy="percentage"
              />
              <ChartBox
                title="LAINNYA"
                users={kelompok?.LAINNYA || []}
                totalPost={rekapSummary.totalIGPost}
                narrative="Grafik ini menampilkan perbandingan jumlah like Instagram dari user di divisi lainnya."
                sortBy="percentage"
              />
              <ChartHorizontal
                title="POLSEK"
                users={kelompok?.POLSEK || []}
                totalPost={rekapSummary.totalIGPost}
                fieldJumlah="jumlah_like"
                labelSudah="User Sudah Like"
                labelKurang="User Kurang Like"
                labelBelum="User Belum Like"
                labelTotal="Total Like"
                showTotalUser
                sortBy="percentage"
              />
              <Narrative>
                Grafik POLSEK menggambarkan distribusi aktivitas like antar
                pengguna di tiap polsek serta total like yang terkumpul.
              </Narrative>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={handleCopyRekap}
              className="group flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-emerald-200 shadow-[0_0_25px_rgba(16,185,129,0.25)] transition hover:border-emerald-300/70 hover:bg-emerald-400/20"
            >
              <Copy className="h-4 w-4" />
              Rekap Likes
            </button>
            <Link
              href="/likes/instagram/rekap"
              className="group flex items-center gap-2 rounded-2xl border border-sky-400/40 bg-sky-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-sky-200 shadow-[0_0_25px_rgba(56,189,248,0.25)] transition hover:border-sky-300/70 hover:bg-sky-500/20"
            >
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              Lihat Rekap Detail
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
