"use client";
import { useState } from "react";
import Loader from "@/components/Loader";
import ChartHorizontal from "@/components/ChartHorizontal";
import ChartBox from "@/components/likes/instagram/ChartBox";
import SummaryItem from "@/components/likes/instagram/SummaryItem";
import { groupUsersByKelompok } from "@/utils/grouping";
import { showToast } from "@/utils/showToast";
import Link from "next/link";
import Narrative from "@/components/Narrative";
import useRequireAuth from "@/hooks/useRequireAuth";
import ViewDataSelector, { VIEW_OPTIONS } from "@/components/ViewDataSelector";
import {
  Music,
  User,
  MessageCircle,
  X,
  ArrowRight,
  UserX,
  Copy,
} from "lucide-react";
import useTiktokCommentsData from "@/hooks/useTiktokCommentsData";
import { buildTiktokRekap } from "@/utils/buildTiktokRekap";

export default function TiktokEngagementInsightPage() {
  useRequireAuth();
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const viewOptions = VIEW_OPTIONS;

  const {
    chartData,
    rekapSummary,
    isDirectorate,
    clientName,
    isDitbinmasRole,
    isDitbinmasScopedClient,
    loading,
    error,
  } = useTiktokCommentsData({ viewBy, customDate, fromDate, toDate });

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-indigo-50 to-white p-6 text-slate-900">
        <div className="rounded-3xl border border-rose-200/70 bg-white/85 px-8 py-6 text-center text-rose-600 shadow-[0_24px_60px_-28px_rgba(244,63,94,0.35)] backdrop-blur">
          {error}
        </div>
      </div>
    );

  const totalUser = Number(rekapSummary.totalUser) || 0;
  const totalTanpaUsername = Number(rekapSummary.totalTanpaUsername) || 0;
  const validUserCount = Math.max(0, totalUser - totalTanpaUsername);
  const getPercentage = (value, base = validUserCount) => {
    const denominator = Number(base);
    if (!denominator) return undefined;
    const numerator = Number(value) || 0;
    return (numerator / denominator) * 100;
  };

  const shouldGroupByClient =
    isDirectorate && !isDitbinmasScopedClient && !isDitbinmasRole;
  const directorateGroupBy = shouldGroupByClient ? "client_id" : "divisi";
  const directorateOrientation = shouldGroupByClient ? "horizontal" : "vertical";
  const directorateTitle = shouldGroupByClient
    ? "POLRES JAJARAN"
    : `DIVISI / SATFUNG${clientName ? ` - ${clientName}` : ""}`;

  const kelompok = isDirectorate ? null : groupUsersByKelompok(chartData);
  const DIRECTORATE_NAME = "direktorat binmas";
  const normalizeClientName = (name = "") =>
    String(name).toLowerCase().replace(/\s+/g, " ").trim();
  const isDirektoratBinmas = (name = "") => {
    const normalized = normalizeClientName(name);
    if (!normalized.startsWith(DIRECTORATE_NAME)) {
      return false;
    }
    const nextChar = normalized.charAt(DIRECTORATE_NAME.length);
    return nextChar === "" || /[^a-z0-9]/.test(nextChar);
  };

  const summaryItemContainerClassName =
    "border border-sky-200/70 bg-white/80 shadow-[0_20px_55px_-28px_rgba(79,70,229,0.35)] backdrop-blur transition hover:-translate-y-1 hover:shadow-[0_26px_65px_-30px_rgba(56,189,248,0.45)]";

  const summaryItemCommonProps = {
    useDefaultContainerStyle: false,
    containerClassName: summaryItemContainerClassName,
  };

  const chartBoxContainerClassName =
    "p-5 border border-sky-200/70 bg-white/80 shadow-[0_28px_65px_-32px_rgba(79,70,229,0.35)] backdrop-blur";

  const chartBoxEmptyStateClassName =
    "rounded-2xl border border-sky-200/70 bg-white/75 px-4 py-6 text-slate-600";

  const chartBoxDecorations = (
    <div className="absolute inset-x-6 top-0 h-20 rounded-full bg-gradient-to-b from-sky-200/50 via-indigo-200/20 to-transparent blur-2xl" />
  );

  const chartBoxCommonProps = {
    fieldJumlah: "jumlah_komentar",
    labelSudah: "User Sudah Komentar",
    labelKurang: "User Kurang Komentar",
    labelBelum: "User Belum Komentar",
    labelTotal: "Total Komentar",
    showTotalUser: true,
    useDefaultContainerStyle: false,
    containerClassName: chartBoxContainerClassName,
    emptyStateClassName: chartBoxEmptyStateClassName,
    decorations: chartBoxDecorations,
    titleClassName: "text-slate-700",
  };

  async function handleCopyRekap() {
    const message = buildTiktokRekap(rekapSummary, chartData, {
      clientName,
      isDirektoratBinmas,
    });

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        showToast("Rekap disalin ke clipboard.", "success");
        return;
      } catch (error) {
        showToast(
          "Gagal menyalin rekap. Izinkan akses clipboard di browser Anda.",
          "error",
        );
      }
    }

    if (typeof window !== "undefined") {
      window.prompt("Salin rekap komentar secara manual:", message);
      showToast(
        "Clipboard tidak tersedia. Silakan salin rekap secara manual.",
        "info",
      );
    }
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-indigo-50 to-white text-slate-900"
      aria-busy={loading}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-120px] h-[420px] w-[420px] rounded-full bg-sky-200/45 blur-[160px]" />
        <div className="absolute right-[-120px] top-1/3 h-[380px] w-[380px] rounded-full bg-indigo-200/45 blur-[160px]" />
        <div className="absolute inset-x-0 bottom-[-180px] h-[320px] bg-gradient-to-t from-indigo-100/70 via-sky-50/60 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <div className="flex flex-1 flex-col gap-10">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              TikTok Engagement Insight
            </h1>
            <p className="max-w-3xl text-sm text-slate-600 md:text-base">
              Pantau performa enggagement personel TikTok untuk{" "}
              <span className="font-semibold text-sky-700">
                {clientName || "satuan Anda"}
              </span>
              . Gunakan panel ini untuk melihat kepatuhan komentar, memantau
              Satker yang aktif / kurang aktif / belum aktif dan mengambil tindakan cepat ketika komentar
              belum terpenuhi.
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
              className="justify-start gap-3 rounded-3xl border border-sky-200/70 bg-white/80 px-4 py-4 text-slate-800 shadow-[0_22px_50px_-28px_rgba(14,116,144,0.35)] backdrop-blur"
              labelClassName="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
              controlClassName="border-sky-200/70 bg-white/90 text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <SummaryItem
                {...summaryItemCommonProps}
                label="Jumlah TikTok Post"
                value={rekapSummary.totalTiktokPost}
                color="fuchsia"
                icon={<Music className="h-5 w-5" />}
              />
              <SummaryItem
                {...summaryItemCommonProps}
                label="Total User"
                value={rekapSummary.totalUser}
                color="slate"
                icon={<User className="h-5 w-5" />}
              />
              <SummaryItem
                {...summaryItemCommonProps}
                label="Sudah Komentar"
                value={rekapSummary.totalSudahKomentar}
                color="green"
                icon={<MessageCircle className="h-5 w-5" />}
                percentage={getPercentage(rekapSummary.totalSudahKomentar)}
              />
              <SummaryItem
                {...summaryItemCommonProps}
                label="Kurang Komentar"
                value={rekapSummary.totalKurangKomentar}
                color="amber"
                icon={<MessageCircle className="h-5 w-5" />}
                percentage={getPercentage(rekapSummary.totalKurangKomentar)}
              />
              <SummaryItem
                {...summaryItemCommonProps}
                label="Belum Komentar"
                value={rekapSummary.totalBelumKomentar}
                color="red"
                icon={<X className="h-5 w-5" />}
                percentage={getPercentage(rekapSummary.totalBelumKomentar)}
              />
              <SummaryItem
                {...summaryItemCommonProps}
                label="Tanpa Username"
                value={rekapSummary.totalTanpaUsername}
                color="violet"
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
              {...chartBoxCommonProps}
              title={directorateTitle}
              users={chartData}
              totalPost={rekapSummary.totalTiktokPost}
              groupBy={directorateGroupBy}
              orientation={directorateOrientation}
              sortBy="percentage"
              narrative={
                shouldGroupByClient
                  ? undefined
                  : "Grafik ini menampilkan perbandingan capaian komentar berdasarkan divisi/satfung."
              }
            />
          ) : (
            <div className="flex flex-col gap-6">
              <ChartBox
                {...chartBoxCommonProps}
                title="BAG"
                users={kelompok.BAG}
                totalPost={rekapSummary.totalTiktokPost}
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi BAG."
                sortBy="percentage"
              />
              <ChartBox
                {...chartBoxCommonProps}
                title="SAT"
                users={kelompok.SAT}
                totalPost={rekapSummary.totalTiktokPost}
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi SAT."
                sortBy="percentage"
              />
              <ChartBox
                {...chartBoxCommonProps}
                title="SI & SPKT"
                users={kelompok["SI & SPKT"]}
                totalPost={rekapSummary.totalTiktokPost}
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi SI & SPKT."
                sortBy="percentage"
              />
              <ChartBox
                {...chartBoxCommonProps}
                title="LAINNYA"
                users={kelompok.LAINNYA}
                totalPost={rekapSummary.totalTiktokPost}
                narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi lainnya."
                sortBy="percentage"
              />
              <ChartHorizontal
                title="POLSEK"
                users={kelompok.POLSEK}
                totalPost={rekapSummary.totalTiktokPost}
                fieldJumlah="jumlah_komentar"
                labelSudah="User Sudah Komentar"
                labelBelum="User Belum Komentar"
                labelTotal="Total Komentar"
                showTotalUser
                sortBy="percentage"
              />
              <Narrative>
                Grafik POLSEK menggambarkan distribusi komentar antar user dari
                setiap polsek serta total komentar yang berhasil dikumpulkan.
              </Narrative>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={handleCopyRekap}
              className="group flex items-center gap-2 rounded-2xl border border-sky-300/70 bg-sky-500/20 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-sky-700 shadow-[0_18px_45px_-28px_rgba(14,165,233,0.45)] transition hover:border-sky-400/80 hover:bg-sky-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
            >
              <Copy className="h-4 w-4" />
              Rekap Komentar
            </button>
            <Link
              href="/comments/tiktok/rekap"
              className="group flex items-center gap-2 rounded-2xl border border-indigo-300/70 bg-indigo-500/20 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-indigo-700 shadow-[0_18px_45px_-28px_rgba(129,140,248,0.45)] transition hover:border-indigo-400/80 hover:bg-indigo-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
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

