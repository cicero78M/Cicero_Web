"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Loader from "@/components/Loader";
import ChartBox from "@/components/likes/instagram/Insight/ChartBox";
import ChartHorizontal from "@/components/ChartHorizontal";
import { groupUsersByKelompok, buildInstagramRekap } from "@/utils/instagramEngagement";
import { getEngagementStatus } from "@/utils/engagementStatus";
import {
  extractClientOptions,
  filterUsersByClientId,
} from "@/utils/directorateClientSelector";
import Narrative from "@/components/Narrative";
import DirectorateClientSelector from "@/components/DirectorateClientSelector";
import useRequireAuth from "@/hooks/useRequireAuth";
import useInstagramLikesData from "@/hooks/useInstagramLikesData";
import useAuth from "@/hooks/useAuth";
import { isPremiumTierAllowedForEngagementDate } from "@/utils/premium";
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

function buildSummaryFromUsers(users, totalIGPost, fallbackSummary) {
  const totalPost = Number(totalIGPost) || 0;
  const summary = {
    totalUser: users.length,
    totalSudahLike: 0,
    totalKurangLike: 0,
    totalBelumLike: 0,
    totalTanpaUsername: 0,
    totalIGPost: totalPost || Number(fallbackSummary?.totalIGPost) || 0,
  };

  users.forEach((u) => {
    const username = String(u?.username || "").trim();
    if (!username) {
      summary.totalTanpaUsername += 1;
      return;
    }

    const status = getEngagementStatus({
      completed: Number(u?.jumlah_like) || 0,
      totalTarget: summary.totalIGPost,
    });

    if (status === "sudah") summary.totalSudahLike += 1;
    else if (status === "kurang") summary.totalKurangLike += 1;
    else summary.totalBelumLike += 1;
  });

  return summary;
}

export default function InstagramEngagementInsightView({ initialTab = "insight" }) {
  useRequireAuth();
  const { premiumTier, effectiveRole, effectiveClientType } = useAuth();
  const [activeTab, setActiveTab] = useState(
    initialTab === "rekap" ? "rekap" : "insight",
  );
  const [directorateScope, setDirectorateScope] = useState("client");
  const [selectedClientId, setSelectedClientId] = useState("");
  const rekapSectionRef = useRef(null);

  const isOriginalDirectorateClient =
    String(effectiveClientType || "").trim().toUpperCase() === "DIREKTORAT";

  useEffect(() => {
    if (initialTab === "rekap" && rekapSectionRef.current) {
      rekapSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [initialTab]);

  useEffect(() => {
    if (isOriginalDirectorateClient) {
      setDirectorateScope("all");
    }
  }, [isOriginalDirectorateClient]);

  const isOrgOperator = effectiveClientType === "ORG" && effectiveRole === "OPERATOR";
  const hasPremiumDateAccess =
    isPremiumTierAllowedForEngagementDate(premiumTier) || isOrgOperator;
  const premiumViewOptions = [
    { value: "today", label: "Harian (hari ini)", periode: "harian" },
    { value: "week", label: "Mingguan (7 hari)", periode: "mingguan", week: true },
    { value: "month", label: "Bulanan", periode: "bulanan", month: true },
    {
      value: "custom_range",
      label: "Rentang Tanggal",
      periode: "harian",
      range: true,
    },
  ];
  const viewOptions = hasPremiumDateAccess
    ? premiumViewOptions
    : [{ value: "today", label: "Hari ini", periode: "harian" }];

  const {
    viewBy,
    viewOptions: resolvedViewOptions,
    selectorDateValue,
    handleViewChange,
    handleDateChange,
    normalizedCustomDate,
    normalizedRange,
    reportPeriodeLabel,
  } = useLikesDateSelector({ options: viewOptions });

  const {
    chartData,
    loading,
    error,
    rekapSummary,
    isDirectorateLayout,
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

  const shouldUseDirectorateLayout = isDirectorateLayout;

  const directorateClientOptions = useMemo(() => {
    if (!shouldUseDirectorateLayout || !isOriginalDirectorateClient) return [];
    return extractClientOptions(chartData);
  }, [chartData, shouldUseDirectorateLayout, isOriginalDirectorateClient]);

  useEffect(() => {
    if (!directorateClientOptions.length) {
      if (selectedClientId) setSelectedClientId("");
      return;
    }

    const hasSelected = directorateClientOptions.some(
      (entry) => entry.client_id === selectedClientId,
    );
    if (!hasSelected) {
      setSelectedClientId("");
    }
  }, [directorateClientOptions, selectedClientId]);

  const shouldShowClientSelector =
    shouldUseDirectorateLayout &&
    isOriginalDirectorateClient &&
    directorateClientOptions.length > 0;

  const displayedUsers =
    shouldShowClientSelector && selectedClientId
      ? filterUsersByClientId(chartData, selectedClientId)
      : chartData;

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 text-slate-700">
        <div className="rounded-3xl border border-rose-300/60 bg-white/80 px-8 py-6 text-center text-rose-600 shadow-[0_0_35px_rgba(248,113,113,0.18)] backdrop-blur">
          {error}
        </div>
      </div>
    );

  const resolvedClientLabel = clientName || "";
  const selectedClientName =
    directorateClientOptions.find((entry) => entry.client_id === selectedClientId)
      ?.nama_client || resolvedClientLabel;

  const shouldGroupByClient =
    shouldUseDirectorateLayout &&
    (directorateScope === "all" ||
      (!isDirectorateScopedClient && !isDirectorateRole));
  const directorateGroupBy = shouldGroupByClient ? "client_id" : "divisi";
  const directorateOrientation = shouldGroupByClient ? "horizontal" : "vertical";
  const directorateTitle = shouldGroupByClient
    ? "POLRES JAJARAN"
    : `DIVISI / SATFUNG${selectedClientName ? ` - ${selectedClientName}` : ""}`;
  const directorateNarrative = shouldGroupByClient
    ? undefined
    : "Grafik ini menampilkan perbandingan capaian likes berdasarkan divisi/satfung.";

  const effectiveRekapSummary =
    shouldShowClientSelector && selectedClientId
      ? buildSummaryFromUsers(displayedUsers, rekapSummary.totalIGPost, rekapSummary)
      : rekapSummary;

  const kelompok = shouldUseDirectorateLayout
    ? null
    : groupUsersByKelompok(displayedUsers);

  const totalUser = Number(effectiveRekapSummary.totalUser) || 0;
  const totalTanpaUsername = Number(effectiveRekapSummary.totalTanpaUsername) || 0;
  const validUserCount = Math.max(0, totalUser - totalTanpaUsername);
  const getPercentage = (value, base = validUserCount) => {
    const denominator = Number(base);
    if (!denominator) return undefined;
    const numerator = Number(value) || 0;
    return (numerator / denominator) * 100;
  };

  const complianceRate = getPercentage(effectiveRekapSummary.totalSudahLike);
  const actionNeededCount =
    (Number(effectiveRekapSummary.totalKurangLike) || 0) +
    (Number(effectiveRekapSummary.totalBelumLike) || 0);
  const actionNeededRate = getPercentage(actionNeededCount);
  const usernameCompletionPercent = getPercentage(validUserCount, totalUser);

  async function handleCopyRekap() {
    const message = buildInstagramRekap(
      effectiveRekapSummary,
      displayedUsers,
      selectedClientName,
    );

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        showToast("Rekap disalin ke clipboard.", "success");
        return;
      } catch {
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
      if (value === "client") {
        setSelectedClientId("");
      }
    }
  };

  const directorateScopeOptions = [
    { value: "client", label: resolvedClientLabel },
    { value: "all", label: `Satker Jajaran ${resolvedClientLabel}` },
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
            }, termasuk ${effectiveRekapSummary.totalBelumLike} yang belum memberi likes sama sekali.`
          : "Seluruh akun aktif sudah memenuhi target likes.",
    },
    {
      title: "Kebersihan data",
      detail:
        totalTanpaUsername > 0
          ? `${totalTanpaUsername} akun belum memiliki username dan tidak ikut dihitung dalam persentase kepatuhan (kelengkapan ${
              usernameCompletionPercent !== undefined
                ? `${Math.round(usernameCompletionPercent)}%`
                : "n/a"
            }).`
          : "Semua akun sudah memiliki username. Data siap dipantau tanpa blindspot.",
    },
  ];

  const summaryCards = [
    {
      key: "posts",
      label: "Jumlah IG Post",
      value: effectiveRekapSummary.totalIGPost,
      color: "blue",
      icon: <Camera className="h-6 w-6" />,
    },
    {
      key: "user",
      label: "Total User",
      value: effectiveRekapSummary.totalUser,
      color: "sky",
      icon: <User className="h-6 w-6" />,
    },
    {
      key: "sudah",
      label: "Sudah Likes",
      value: effectiveRekapSummary.totalSudahLike,
      color: "green",
      icon: <ThumbsUp className="h-6 w-6" />,
      percentage: getPercentage(effectiveRekapSummary.totalSudahLike),
    },
    {
      key: "kurang",
      label: "Kurang Likes",
      value: effectiveRekapSummary.totalKurangLike,
      color: "amber",
      icon: <ThumbsDown className="h-6 w-6" />,
      percentage: getPercentage(effectiveRekapSummary.totalKurangLike),
    },
    {
      key: "belum",
      label: "Belum Likes",
      value: effectiveRekapSummary.totalBelumLike,
      color: "red",
      icon: <ThumbsDown className="h-6 w-6" />,
      percentage: getPercentage(effectiveRekapSummary.totalBelumLike),
    },
    {
      key: "tanpa",
      label: "Tanpa Username",
      value: effectiveRekapSummary.totalTanpaUsername,
      color: "violet",
      icon: <UserX className="h-6 w-6" />,
      percentage: getPercentage(effectiveRekapSummary.totalTanpaUsername, totalUser),
    },
  ];

  const chartBoxCommonProps = {
    fieldJumlah: "jumlah_like",
    labelSudah: "User Sudah Likes",
    labelKurang: "User Kurang Likes",
    labelBelum: "User Belum Likes",
    labelTotal: "Total Likes",
    showTotalUser: true,
    titleClassName: "text-slate-700",
  };

  const scopeSelectorProps = {
    value: directorateScope,
    onChange: handleDirectorateScopeChange,
    options: directorateScopeOptions,
    canSelectScope,
  };

  const premiumCta = isOrgClient && !isOrgOperator
    ? {
        label: "Premium CICERO",
        description: "Jadwalkan rekap otomatis & briefing WA Bot tiap hari.",
        href: "/premium",
        actionLabel: "Lihat Paket",
      }
    : null;
  const viewSelectorProps = hasPremiumDateAccess
    ? {
        value: viewBy,
        onChange: handleViewChange,
        date: selectorDateValue,
        onDateChange: handleDateChange,
        options: resolvedViewOptions,
      }
    : null;

  return (
    <InsightLayout
      title="Instagram Engagement Insight"
      description="Pantau performa likes dan komentar harian."
      tabs={DEFAULT_INSIGHT_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      heroContent={null}
    >
      {activeTab === "insight" && (
        <EngagementInsightMobileScaffold
          viewSelectorProps={viewSelectorProps}
          scopeSelectorProps={scopeSelectorProps}
          premiumCta={premiumCta}
          onCopyRekap={handleCopyRekap}
          summaryCards={summaryCards}
          quickInsights={quickInsights}
          quickInsightTone="blue"
        >
          {shouldShowClientSelector ? (
            <div className="rounded-2xl border border-sky-100/70 bg-white/80 p-3 shadow-sm">
              <DirectorateClientSelector
                clients={directorateClientOptions}
                selectedClientId={selectedClientId}
                onClientChange={setSelectedClientId}
                label="Filter Polres"
              />
            </div>
          ) : null}

          {shouldUseDirectorateLayout ? (
            <ChartBox
              {...chartBoxCommonProps}
              title={directorateTitle}
              users={displayedUsers}
              totalPost={effectiveRekapSummary.totalIGPost}
              groupBy={directorateGroupBy}
              orientation={directorateOrientation}
              sortBy="percentage"
              narrative={directorateNarrative}
            />
          ) : (
            <div className="flex flex-col gap-6">
              {kelompok.BAG && kelompok.BAG.length > 0 && (
                <ChartBox
                  {...chartBoxCommonProps}
                  title="BAG"
                  users={kelompok.BAG}
                  totalPost={effectiveRekapSummary.totalIGPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah likes Instagram dari user di divisi BAG."
                  sortBy="percentage"
                />
              )}
              {kelompok.SAT && kelompok.SAT.length > 0 && (
                <ChartBox
                  {...chartBoxCommonProps}
                  title="SAT"
                  users={kelompok.SAT}
                  totalPost={effectiveRekapSummary.totalIGPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah likes Instagram dari user di divisi SAT."
                  sortBy="percentage"
                />
              )}
              {kelompok["SI & SPKT"] && kelompok["SI & SPKT"].length > 0 && (
                <ChartBox
                  {...chartBoxCommonProps}
                  title="SI & SPKT"
                  users={kelompok["SI & SPKT"]}
                  totalPost={effectiveRekapSummary.totalIGPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah likes Instagram dari user di divisi SI & SPKT."
                  sortBy="percentage"
                />
              )}
              {kelompok.LAINNYA && kelompok.LAINNYA.length > 0 && (
                <ChartBox
                  {...chartBoxCommonProps}
                  title="LAINNYA"
                  users={kelompok.LAINNYA}
                  totalPost={effectiveRekapSummary.totalIGPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah likes Instagram dari user di divisi lainnya."
                  sortBy="percentage"
                />
              )}
              {kelompok.POLSEK && kelompok.POLSEK.length > 0 && (
                <>
                  <ChartHorizontal
                    title="POLSEK"
                    users={kelompok.POLSEK}
                    totalPost={effectiveRekapSummary.totalIGPost}
                    fieldJumlah="jumlah_like"
                    labelSudah="User Sudah Likes"
                    labelBelum="User Belum Likes"
                    labelTotal="Total Likes"
                    showTotalUser
                    sortBy="percentage"
                  />
                  <Narrative>
                    Grafik ini menampilkan distribusi likes antar user dari setiap polsek serta total likes yang berhasil dikumpulkan.
                  </Narrative>
                </>
              )}
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
        {shouldShowClientSelector ? (
          <div className="mb-4 rounded-2xl border border-sky-100/70 bg-white/80 p-3 shadow-sm">
            <DirectorateClientSelector
              clients={directorateClientOptions}
              selectedClientId={selectedClientId}
              onClientChange={setSelectedClientId}
              label="Filter Polres"
            />
          </div>
        ) : null}

        <RekapLikesIG
          users={displayedUsers}
          totalIGPost={effectiveRekapSummary.totalIGPost}
          posts={igPosts}
          showRekapButton
          showCopyButton={false}
          clientName={selectedClientName}
          reportContext={{
            periodeLabel: reportPeriodeLabel,
            viewLabel: resolvedViewOptions.find((option) => option.value === viewBy)?.label,
          }}
          showPremiumCta={isOrgClient}
        />
      </DetailRekapSection>
    </InsightLayout>
  );
}
