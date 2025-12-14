"use client";

import { useEffect, useRef, useState } from "react";
import Loader from "@/components/Loader";
import ChartBox from "@/components/likes/instagram/Insight/ChartBox";
import ChartHorizontal from "@/components/ChartHorizontal";
import { groupUsersByKelompok, buildInstagramRekap } from "@/utils/instagramEngagement";
import Narrative from "@/components/Narrative";
import useRequireAuth from "@/hooks/useRequireAuth";
import useInstagramLikesData from "@/hooks/useInstagramLikesData";
import { showToast } from "@/utils/showToast";
import {
  Camera,
  User,
  ThumbsUp,
  ThumbsDown,
  UserX,
} from "lucide-react";
import RekapLikesIG from "@/components/likes/instagram/Rekap/RekapLikesIG";
import useLikesDateSelector from "@/hooks/useLikesDateSelector";
import InsightLayout from "@/components/InsightLayout";
import { DEFAULT_INSIGHT_TABS } from "@/components/insight/tabs";
import DetailRekapSection from "@/components/insight/DetailRekapSection";
import EngagementInsightMobileScaffold from "@/components/insight/EngagementInsightMobileScaffold";

export default function InstagramEngagementInsightView({ initialTab = "insight" }) {
  useRequireAuth();
  const [activeTab, setActiveTab] = useState(
    initialTab === "rekap" ? "rekap" : "insight",
  );
  const [directorateScope, setDirectorateScope] = useState("client");
  const rekapSectionRef = useRef(null);

  useEffect(() => {
    if (initialTab === "rekap" && rekapSectionRef.current) {
      rekapSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [initialTab]);

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
    loading,
    error,
    rekapSummary,
    isDirectorate,
    isOrgClient,
    clientName,
    isDirectorateScopedClient,
    isDirectorateRole,
    canSelectScope,
    igPosts,
  } = useInstagramLikesData({
    viewBy,
    customDate: normalizedCustomDate,
    fromDate: normalizedRange.startDate,
    toDate: normalizedRange.endDate,
    scope: directorateScope,
  });

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 text-slate-700">
        <div className="rounded-3xl border border-rose-300/60 bg-white/80 px-8 py-6 text-center text-rose-600 shadow-[0_0_35px_rgba(248,113,113,0.18)] backdrop-blur">
          {error}
        </div>
      </div>
    );

  const kelompok = isDirectorate ? null : groupUsersByKelompok(chartData);
  const shouldGroupByClient =
    isDirectorate && !isDirectorateScopedClient && !isDirectorateRole;
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

  const complianceRate = getPercentage(rekapSummary.totalSudahLike);
  const actionNeededCount =
    (Number(rekapSummary.totalKurangLike) || 0) +
    (Number(rekapSummary.totalBelumLike) || 0);
  const actionNeededRate = getPercentage(actionNeededCount);
  const usernameCompletionPercent = getPercentage(validUserCount, totalUser);

  async function handleCopyRekap() {
    const message = buildInstagramRekap(rekapSummary, chartData, clientName);

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
      window.prompt("Salin rekap likes secara manual:", message);
      showToast(
        "Clipboard tidak tersedia. Silakan salin rekap secara manual.",
        "info",
      );
    }
  }

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "rekap" && rekapSectionRef.current) {
      rekapSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDirectorateScopeChange = (event) => {
    const { value } = event.target || {};
    if (value === "client" || value === "all") {
      setDirectorateScope(value);
    }
  };

  const directorateScopeOptions = [
    { value: "client", label: clientName },
    { value: "all", label: `Satker Jajaran ${clientName}` },
  ];

  const quickInsights = [
    {
      title: "Fokus kepatuhan",
      detail:
        complianceRate !== undefined
          ? `${Math.round(complianceRate)}% user aktif sudah memenuhi target likes.`
          : "Menunggu data kepatuhan likes terkini.",
    },
    {
      title: "Prioritas perbaikan",
      detail:
        actionNeededCount > 0
          ? `${actionNeededCount} akun masih perlu aksi likes${
              actionNeededRate !== undefined
                ? ` (${Math.round(actionNeededRate)}% dari pengguna aktif)`
                : ""
            }, termasuk ${rekapSummary.totalBelumLike} yang belum memberi likes sama sekali.`
          : "Seluruh akun aktif sudah memenuhi target likes.",
    },
    {
      title: "Kebersihan data",
      detail:
        totalTanpaUsername > 0
          ? `${totalTanpaUsername} akun belum memiliki username dan tidak ikut dihitung dalam persentase kepatuhan (kelengkapan ${
              usernameCompletionPercent !== undefined
                ? `${Math.round(usernameCompletionPercent)}%`
                : "sedang diproses"
            }).`
          : "Seluruh akun sudah memiliki username yang valid.",
    },
  ];

  const summaryCards = [
    {
      key: "ig-post",
      label: "Jumlah IG Post",
      value: rekapSummary.totalIGPost,
      color: "blue",
      icon: (
        <Camera className="h-7 w-7 text-sky-500 drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]" />
      ),
    },
    {
      key: "total-user",
      label: "Total User",
      value: rekapSummary.totalUser,
      color: "gray",
      icon: (
        <User className="h-7 w-7 text-slate-500 drop-shadow-[0_0_12px_rgba(148,163,184,0.35)]" />
      ),
    },
    {
      key: "sudah",
      label: "Sudah Likes",
      value: rekapSummary.totalSudahLike,
      color: "green",
      icon: (
        <ThumbsUp className="h-7 w-7 text-teal-500 drop-shadow-[0_0_12px_rgba(45,212,191,0.4)]" />
      ),
      percentage: getPercentage(rekapSummary.totalSudahLike),
    },
    {
      key: "kurang",
      label: "Kurang Likes",
      value: rekapSummary.totalKurangLike,
      color: "orange",
      icon: (
        <ThumbsDown className="h-7 w-7 text-sky-500 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" />
      ),
      percentage: getPercentage(rekapSummary.totalKurangLike),
    },
    {
      key: "belum",
      label: "Belum Likes",
      value: rekapSummary.totalBelumLike,
      color: "red",
      icon: (
        <ThumbsDown className="h-7 w-7 text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.4)]" />
      ),
      percentage: getPercentage(rekapSummary.totalBelumLike),
    },
    {
      key: "tanpa",
      label: "Tanpa Username",
      value: rekapSummary.totalTanpaUsername,
      color: "gray",
      icon: (
        <UserX className="h-7 w-7 text-slate-500 drop-shadow-[0_0_12px_rgba(148,163,184,0.35)]" />
      ),
      percentage: getPercentage(rekapSummary.totalTanpaUsername, totalUser),
    },
  ];

  const scopeSelectorProps = {
    value: directorateScope,
    onChange: handleDirectorateScopeChange,
    options: directorateScopeOptions,
    canSelectScope,
  };

  return (
    <InsightLayout
      title="Instagram Engagement Insight"
      description="Pantau performa likes dan komentar harian dengan visualisasi chart bar."
      tabs={DEFAULT_INSIGHT_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      heroContent={null}
    >
      {activeTab === "insight" && (
        <EngagementInsightMobileScaffold
          viewSelectorProps={{
            value: viewBy,
            onChange: handleViewChange,
            options: viewOptions,
            date: selectorDateValue,
            onDateChange: handleDateChange,
          }}
          scopeSelectorProps={scopeSelectorProps}
          onCopyRekap={handleCopyRekap}
          summaryCards={summaryCards}
          quickInsights={quickInsights}
          quickInsightTone="blue"
        >
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
        </EngagementInsightMobileScaffold>
      )}

      <DetailRekapSection
        sectionRef={rekapSectionRef}
        title="Rekapitulasi Engagement Instagram"
        description="Rekap detail keterlibatan likes dan komentar tersedia tanpa perlu pindah halaman."
        showContent={activeTab === "rekap"}
      >
        <RekapLikesIG
          users={chartData}
          totalIGPost={rekapSummary.totalIGPost}
          posts={igPosts}
          showRekapButton
          showCopyButton={false}
          clientName={clientName}
          reportContext={{
            periodeLabel: reportPeriodeLabel,
            viewLabel: viewOptions.find((option) => option.value === viewBy)?.label,
          }}
        />
      </DetailRekapSection>
    </InsightLayout>
  );
}
