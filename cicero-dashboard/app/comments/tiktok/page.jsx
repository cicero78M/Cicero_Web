"use client";

import { useMemo, useRef, useState } from "react";
import Loader from "@/components/Loader";
import ChartHorizontal from "@/components/ChartHorizontal";
import ChartBox from "@/components/likes/instagram/Insight/ChartBox";
import SummaryItem from "@/components/likes/instagram/Insight/SummaryItem";
import { groupUsersByKelompok } from "@/utils/instagramEngagement";
import { showToast } from "@/utils/showToast";
import Narrative from "@/components/Narrative";
import useRequireAuth from "@/hooks/useRequireAuth";
import ViewDataSelector from "@/components/ViewDataSelector";
import {
  AlertTriangle,
  Music,
  User,
  MessageCircle,
  UserX,
  Copy,
  Sparkles,
  Users,
} from "lucide-react";
import useTiktokCommentsData from "@/hooks/useTiktokCommentsData";
import { buildTiktokRekap } from "@/utils/buildTiktokRekap";
import RekapKomentarTiktok from "@/components/RekapKomentarTiktok";
import InsightLayout from "@/components/InsightLayout";
import { DEFAULT_INSIGHT_TABS } from "@/components/insight/tabs";
import useLikesDateSelector from "@/hooks/useLikesDateSelector";
import DetailRekapSection from "@/components/insight/DetailRekapSection";

export default function TiktokEngagementInsightPage() {
  useRequireAuth();
  const [activeTab, setActiveTab] = useState("insight");
  const rekapSectionRef = useRef(null);
  const [ditbinmasScope, setDitbinmasScope] = useState("client");

  const {
    viewBy,
    viewOptions,
    selectorDateValue,
    handleViewChange,
    handleDateChange,
    normalizedCustomDate,
    normalizedRange,
    reportPeriodeLabel,
  } = useLikesDateSelector();

  const {
    chartData,
    rekapSummary,
    isDirectorate,
    clientName,
    isDitbinmasRole,
    isDitbinmasScopedClient,
    canSelectScope,
    loading,
    error,
  } = useTiktokCommentsData({
    viewBy,
    customDate: normalizedCustomDate,
    fromDate: normalizedRange.startDate,
    toDate: normalizedRange.endDate,
    scope: ditbinmasScope,
  });

  const viewLabel = useMemo(
    () => viewOptions.find((option) => option.value === viewBy)?.label,
    [viewOptions, viewBy],
  );

  const ditbinmasScopeOptions = [
    { value: "client", label: clientName },
    { value: "all", label: `Satker Jajaran ${clientName}` },
  ];

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "rekap" && rekapSectionRef.current) {
      rekapSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDitbinmasScopeChange = (event) => {
    const { value } = event.target || {};
    if (value === "client" || value === "all") {
      setDitbinmasScope(value);
    }
  };

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

  const complianceRate = getPercentage(rekapSummary.totalSudahKomentar);
  const actionNeededCount =
    (Number(rekapSummary.totalKurangKomentar) || 0) +
    (Number(rekapSummary.totalBelumKomentar) || 0);
  const actionNeededRate = getPercentage(actionNeededCount);
  const usernameCompletionPercent = getPercentage(validUserCount, totalUser);

  const summaryCards = [
    {
      key: "posts",
      label: "Jumlah TikTok Post",
      value: rekapSummary.totalTiktokPost,
      color: "fuchsia",
      icon: <Music className="h-5 w-5" />,
    },
    {
      key: "totalUser",
      label: "Total User",
      value: totalUser,
      color: "gray",
      icon: <Users className="h-5 w-5" />,
    },
    {
      key: "username",
      label: "Username Lengkap",
      value: validUserCount,
      color: "slate",
      icon: <User className="h-5 w-5" />,
      percentage: usernameCompletionPercent,
    },
    {
      key: "sudah",
      label: "Sudah Komentar",
      value: rekapSummary.totalSudahKomentar,
      color: "green",
      icon: <MessageCircle className="h-5 w-5" />,
      percentage: complianceRate,
    },
    {
      key: "aksi",
      label: "Perlu Aksi",
      value: actionNeededCount,
      color: "amber",
      icon: <AlertTriangle className="h-5 w-5" />,
      percentage: actionNeededRate,
    },
    {
      key: "tanpa",
      label: "Tanpa Username",
      value: rekapSummary.totalTanpaUsername,
      color: "violet",
      icon: <UserX className="h-5 w-5" />,
      percentage: getPercentage(rekapSummary.totalTanpaUsername, totalUser),
    },
  ];

  const uniqueSummaryCards = summaryCards.filter((card, index, cards) =>
    cards.findIndex((candidate) => candidate.key === card.key) === index,
  );

  const quickInsights = [
    {
      title: "Fokus kepatuhan",
      detail:
        complianceRate !== undefined
          ? `${Math.round(complianceRate)}% user aktif sudah memenuhi target komentar.`
          : "Menunggu data kepatuhan komentar terkini.",
    },
    {
      title: "Prioritas perbaikan",
      detail:
        actionNeededCount > 0
          ? `${actionNeededCount} akun masih membutuhkan aksi, termasuk ${rekapSummary.totalBelumKomentar} yang belum berkomentar sama sekali.`
          : "Seluruh akun aktif sudah memenuhi target komentar.",
    },
    {
      title: "Kebersihan data",
      detail:
        totalTanpaUsername > 0
          ? `${totalTanpaUsername} akun belum memiliki username dan tidak ikut dihitung dalam persentase kepatuhan.`
          : "Seluruh akun sudah memiliki username yang valid.",
    },
  ];

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

  const reportContext = {
    periodeLabel: reportPeriodeLabel,
    viewLabel,
    directorateName: clientName || "Satker",
    directorateOfficialName: clientName || "Satker",
  };

  const heroContent = (
    <div className="flex flex-col gap-4 rounded-2xl border border-sky-100/60 bg-white/60 p-4 shadow-inner backdrop-blur">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <ViewDataSelector
          value={viewBy}
          onChange={handleViewChange}
          options={viewOptions}
          date={selectorDateValue}
          onDateChange={handleDateChange}
          className="justify-start gap-3"
          labelClassName="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
          controlClassName="border-sky-200/70 bg-white/90 text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
        />
        <div className="flex flex-wrap gap-3 md:justify-end">
          {canSelectScope && (
            <div className="flex items-center gap-2 rounded-xl border border-sky-100/80 bg-white/70 px-3 py-2 text-sm text-slate-700 shadow-inner">
              <span className="font-semibold text-slate-800">Lingkup:</span>
              <select
                value={ditbinmasScope}
                onChange={handleDitbinmasScopeChange}
                className="rounded-lg border border-sky-100 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none"
              >
                {ditbinmasScopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            onClick={handleCopyRekap}
            className="inline-flex items-center gap-2 rounded-2xl border border-teal-300/60 bg-teal-200/50 px-4 py-2 text-sm font-semibold text-teal-700 shadow-[0_0_25px_rgba(45,212,191,0.35)] transition-colors hover:border-teal-400/70 hover:bg-teal-200/70"
          >
            <Copy className="h-4 w-4 text-teal-600" />
            Salin Rekap
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <InsightLayout
      title="TikTok Engagement Insight"
      description="Pantau performa engagement personel TikTok dengan ringkasan kepatuhan komentar dan tabel rekap terintegrasi."
      tabs={DEFAULT_INSIGHT_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      heroContent={heroContent}
    >
      {activeTab === "insight" && (
        <div className="flex flex-col gap-10">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {uniqueSummaryCards.map((card) => (
              <SummaryItem
                key={card.key}
                {...summaryItemCommonProps}
                label={card.label}
                value={card.value}
                color={card.color}
                icon={card.icon}
                percentage={card.percentage}
              />
            ))}
          </div>

          <div className="grid gap-3 rounded-2xl border border-indigo-100 bg-white/75 p-4 shadow-inner shadow-indigo-50/70 sm:grid-cols-3">
            {quickInsights.map((insight) => (
              <div key={insight.title} className="flex items-start gap-3 rounded-xl bg-indigo-50/60 p-3">
                <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm shadow-indigo-100">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </span>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">{insight.title}</p>
                  <p className="text-sm text-slate-700">{insight.detail}</p>
                </div>
              </div>
            ))}
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
                Grafik POLSEK menggambarkan distribusi komentar antar user dari setiap polsek serta total komentar yang berhasil dikumpulkan.
              </Narrative>
            </div>
          )}
        </div>
      )}

      <DetailRekapSection
        sectionRef={rekapSectionRef}
        title="Rekapitulasi Engagement TikTok"
        description="Rekap detail keterlibatan komentar TikTok tersedia tanpa perlu pindah halaman."
        showContent={activeTab === "rekap"}
      >
        <RekapKomentarTiktok
          users={chartData}
          totalTiktokPost={rekapSummary.totalTiktokPost}
          showCopyButton={false}
          reportContext={reportContext}
        />
      </DetailRekapSection>
    </InsightLayout>
  );
}
