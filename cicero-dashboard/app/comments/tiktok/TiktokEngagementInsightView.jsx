"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Loader from "@/components/Loader";
import ChartHorizontal from "@/components/ChartHorizontal";
import ChartBox from "@/components/likes/instagram/Insight/ChartBox";
import { groupUsersByKelompok } from "@/utils/instagramEngagement";
import { getEngagementStatus } from "@/utils/engagementStatus";
import { filterUsersByClientId } from "@/utils/directorateClientSelector";
import { showToast } from "@/utils/showToast";
import Narrative from "@/components/Narrative";
import DirectorateClientSelector from "@/components/DirectorateClientSelector";
import useRequireAuth from "@/hooks/useRequireAuth";
import { Music, MessageCircle, UserX, Users } from "lucide-react";
import useTiktokCommentsData from "@/hooks/useTiktokCommentsData";
import { buildTiktokRekap } from "@/utils/buildTiktokRekap";
import RekapKomentarTiktok from "@/components/comments/tiktok/Rekap/RekapKomentarTiktok";
import InsightLayout from "@/components/InsightLayout";
import { DEFAULT_INSIGHT_TABS } from "@/components/insight/tabs";
import useLikesDateSelector from "@/hooks/useLikesDateSelector";
import DetailRekapSection from "@/components/insight/DetailRekapSection";
import EngagementInsightMobileScaffold from "@/components/insight/EngagementInsightMobileScaffold";
import useAuth from "@/hooks/useAuth";
import { isPremiumTierAllowedForEngagementDate } from "@/utils/premium";

function buildSummaryFromUsers(users, totalTiktokPost, fallbackSummary) {
  const totalPost = Number(totalTiktokPost) || 0;
  const summary = {
    totalUser: users.length,
    totalSudahKomentar: 0,
    totalKurangKomentar: 0,
    totalBelumKomentar: 0,
    totalTanpaUsername: 0,
    totalTiktokPost: totalPost || Number(fallbackSummary?.totalTiktokPost) || 0,
  };

  users.forEach((u) => {
    const username = String(u?.username || "").trim();
    if (!username) {
      summary.totalTanpaUsername += 1;
      return;
    }

    const status = getEngagementStatus({
      completed: Number(u?.jumlah_komentar) || 0,
      totalTarget: summary.totalTiktokPost,
    });

    if (status === "sudah") summary.totalSudahKomentar += 1;
    else if (status === "kurang") summary.totalKurangKomentar += 1;
    else summary.totalBelumKomentar += 1;
  });

  return summary;
}

export default function TiktokEngagementInsightView({ initialTab = "insight" }) {
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

  const isOrgOperator = effectiveClientType === "ORG" && effectiveRole === "OPERATOR";
  const hasPremiumDateAccess = isPremiumTierAllowedForEngagementDate(premiumTier) || isOrgOperator;
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
    users,
    chartData,
    rekapSummary,
    isDirectorate,
    clientName,
    isDirectorateRole,
    isDirectorateScopedClient,
    canSelectScope,
    isOrgClient,
    clientOptions,
    loading,
    error,
  } = useTiktokCommentsData({
    viewBy,
    customDate: normalizedCustomDate,
    fromDate: normalizedRange.startDate,
    toDate: normalizedRange.endDate,
    scope: directorateScope,
  });

  const viewLabel = useMemo(
    () => resolvedViewOptions.find((option) => option.value === viewBy)?.label,
    [resolvedViewOptions, viewBy],
  );

  const directorateClientOptions = useMemo(() => {
    if (!isDirectorate || !isOriginalDirectorateClient) return [];
    return clientOptions;
  }, [clientOptions, isDirectorate, isOriginalDirectorateClient]);

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
    isDirectorate && isOriginalDirectorateClient && directorateClientOptions.length > 0;

  const displayedUsers =
    shouldShowClientSelector && selectedClientId
      ? filterUsersByClientId(users, selectedClientId)
      : users;
  const displayedChartData =
    shouldShowClientSelector && selectedClientId
      ? filterUsersByClientId(chartData, selectedClientId)
      : chartData;

  const selectedClientName =
    directorateClientOptions.find((entry) => entry.client_id === selectedClientId)
      ?.nama_client || clientName;

  const effectiveRekapSummary =
    shouldShowClientSelector && selectedClientId
      ? buildSummaryFromUsers(
          displayedUsers,
          rekapSummary.totalTiktokPost,
          rekapSummary,
        )
      : rekapSummary;

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
    { value: "client", label: clientName },
    { value: "all", label: `Satker Jajaran ${clientName}` },
  ];


  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-indigo-50 to-white p-6 text-slate-900">
        <div className="rounded-3xl border border-rose-200/70 bg-white/85 px-8 py-6 text-center text-rose-600 shadow-[0_24px_60px_-28px_rgba(244,63,94,0.35)] backdrop-blur">
          {error}
        </div>
      </div>
    );

  const totalUser = Number(effectiveRekapSummary.totalUser) || 0;
  const totalTanpaUsername = Number(effectiveRekapSummary.totalTanpaUsername) || 0;
  const validUserCount = Math.max(0, totalUser - totalTanpaUsername);
  const getPercentage = (value, base = validUserCount) => {
    const denominator = Number(base);
    if (!denominator) return undefined;
    const numerator = Number(value) || 0;
    return (numerator / denominator) * 100;
  };

  const complianceRate = getPercentage(effectiveRekapSummary.totalSudahKomentar);
  const actionNeededCount =
    (Number(effectiveRekapSummary.totalKurangKomentar) || 0) +
    (Number(effectiveRekapSummary.totalBelumKomentar) || 0);
  const actionNeededRate = getPercentage(actionNeededCount);
  const usernameCompletionPercent = getPercentage(validUserCount, totalUser);

  const summaryCards = [
    {
      key: "posts",
      label: "Jumlah TikTok Post",
      value: effectiveRekapSummary.totalTiktokPost,
      color: "fuchsia",
      icon: <Music className="h-6 w-6" />,
    },
    {
      key: "totalUser",
      label: "Total User",
      value: totalUser,
      color: "gray",
      icon: <Users className="h-6 w-6" />,
    },
    {
      key: "sudah",
      label: "Sudah Komentar",
      value: effectiveRekapSummary.totalSudahKomentar,
      color: "green",
      icon: <MessageCircle className="h-6 w-6" />,
      percentage: complianceRate,
    },
    {
      key: "kurang",
      label: "Kurang Komentar",
      value: effectiveRekapSummary.totalKurangKomentar,
      color: "amber",
      icon: <MessageCircle className="h-6 w-6" />,
      percentage: getPercentage(effectiveRekapSummary.totalKurangKomentar),
    },
    {
      key: "belum",
      label: "Belum Komentar",
      value: effectiveRekapSummary.totalBelumKomentar,
      color: "red",
      icon: <MessageCircle className="h-6 w-6" />,
      percentage: getPercentage(effectiveRekapSummary.totalBelumKomentar),
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
          ? `${actionNeededCount} akun masih membutuhkan aksi${
              actionNeededRate !== undefined
                ? ` (${Math.round(actionNeededRate)}% dari pengguna aktif)`
                : ""
            }, termasuk ${effectiveRekapSummary.totalBelumKomentar} yang belum berkomentar sama sekali.`
          : "Seluruh akun aktif sudah memenuhi target komentar.",
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

  const shouldGroupByClient =
    isDirectorate &&
    (directorateScope === "all" ||
      (!isDirectorateScopedClient && !isDirectorateRole));
  const directorateGroupBy = shouldGroupByClient ? "client_id" : "divisi";
  const directorateOrientation = shouldGroupByClient ? "horizontal" : "vertical";
  const directorateTitle = shouldGroupByClient
    ? "POLRES JAJARAN"
    : `DIVISI / SATFUNG${selectedClientName ? ` - ${selectedClientName}` : ""}`;

  const kelompok = isDirectorate ? null : groupUsersByKelompok(displayedChartData);
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

  const chartBoxCommonProps = {
    fieldJumlah: "jumlah_komentar",
    labelSudah: "User Sudah Komentar",
    labelKurang: "User Kurang Komentar",
    labelBelum: "User Belum Komentar",
    labelTotal: "Total Komentar",
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
        description: "Dapatkan rekap otomatis & notifikasi WA Bot komentar.",
        href: "/premium",
        actionLabel: "Upgrade",
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

  async function handleCopyRekap() {
    const message = buildTiktokRekap(effectiveRekapSummary, displayedChartData, {
      clientName: selectedClientName,
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
    directorateName: selectedClientName || "Satker",
    directorateOfficialName: selectedClientName || "Satker",
  };

  const directorateClientSelectorLabel = "Pilih Client Direktorat / Satker";

  return (
    <InsightLayout
      title="TikTok Engagement Insight"
      description="Pantau performa engagement TikTok."
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
          summaryCards={uniqueSummaryCards}
          quickInsights={quickInsights}
          quickInsightTone="indigo"
        >
          {shouldShowClientSelector ? (
            <div className="rounded-2xl border border-sky-100/70 bg-white/80 p-3 shadow-sm">
              <DirectorateClientSelector
                clients={directorateClientOptions}
                selectedClientId={selectedClientId}
                onClientChange={setSelectedClientId}
                label={directorateClientSelectorLabel}
              />
            </div>
          ) : null}

          {isDirectorate ? (
            <ChartBox
              {...chartBoxCommonProps}
              title={directorateTitle}
              users={displayedChartData}
              totalPost={effectiveRekapSummary.totalTiktokPost}
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
              {kelompok.BAG && kelompok.BAG.length > 0 && (
                <ChartBox
                  {...chartBoxCommonProps}
                  title="BAG"
                  users={kelompok.BAG}
                  totalPost={effectiveRekapSummary.totalTiktokPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi BAG."
                  sortBy="percentage"
                />
              )}
              {kelompok.SAT && kelompok.SAT.length > 0 && (
                <ChartBox
                  {...chartBoxCommonProps}
                  title="SAT"
                  users={kelompok.SAT}
                  totalPost={effectiveRekapSummary.totalTiktokPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi SAT."
                  sortBy="percentage"
                />
              )}
              {kelompok["SI & SPKT"] && kelompok["SI & SPKT"].length > 0 && (
                <ChartBox
                  {...chartBoxCommonProps}
                  title="SI & SPKT"
                  users={kelompok["SI & SPKT"]}
                  totalPost={effectiveRekapSummary.totalTiktokPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi SI & SPKT."
                  sortBy="percentage"
                />
              )}
              {kelompok.LAINNYA && kelompok.LAINNYA.length > 0 && (
                <ChartBox
                  {...chartBoxCommonProps}
                  title="LAINNYA"
                  users={kelompok.LAINNYA}
                  totalPost={effectiveRekapSummary.totalTiktokPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi lainnya."
                  sortBy="percentage"
                />
              )}
              {kelompok.POLSEK && kelompok.POLSEK.length > 0 && (
                <>
                  <ChartHorizontal
                    title="POLSEK"
                    users={kelompok.POLSEK}
                    totalPost={effectiveRekapSummary.totalTiktokPost}
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
                </>
              )}
            </div>
          )}
        </EngagementInsightMobileScaffold>
      )}

      <DetailRekapSection
        sectionRef={rekapSectionRef}
        title="Rekapitulasi Engagement TikTok"
        description="Rekap detail keterlibatan komentar TikTok tersedia tanpa perlu pindah halaman."
        showContent={activeTab === "rekap"}
      >
        {shouldShowClientSelector ? (
          <div className="mb-4 rounded-2xl border border-sky-100/70 bg-white/80 p-3 shadow-sm">
            <DirectorateClientSelector
              clients={directorateClientOptions}
              selectedClientId={selectedClientId}
              onClientChange={setSelectedClientId}
              label={directorateClientSelectorLabel}
            />
          </div>
        ) : null}

        <RekapKomentarTiktok
          users={displayedUsers}
          totalTiktokPost={effectiveRekapSummary.totalTiktokPost}
          showCopyButton={false}
          clientName={selectedClientName}
          reportContext={reportContext}
          rekapSummary={effectiveRekapSummary}
          showPremiumCta={isOrgClient}
        />
      </DetailRekapSection>
    </InsightLayout>
  );
}
