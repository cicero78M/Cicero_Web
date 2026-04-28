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
import PremiumProofValueCard from "@/components/premium/PremiumProofValueCard";
import ExecutiveRecapCard from "@/components/premium/ExecutiveRecapCard";
import RiskAlertCenter from "@/components/premium/RiskAlertCenter";
import { buildExecutiveRecap } from "@/utils/executiveRecap";
import { mapExecutiveRecapToCardProps, mapRiskSummaryToCardProps } from "@/utils/premiumInsightAdapters";
import { buildRiskComplianceAlertCenter } from "@/utils/riskComplianceAlerts";
import { buildEngagementPremiumUpsell } from "@/utils/premiumUpsell";
import useAuth from "@/hooks/useAuth";
import {
  hasActivePremiumSubscription,
  isPremiumTierAllowedForEngagementDate,
} from "@/utils/premium";
import {
  getDashboardPremiumExecutiveRecap,
  getDashboardPremiumRiskSummary,
  getInstagramPosts,
  getRekapKomentarTiktok,
  getRekapLikesIG,
  getTiktokPosts,
} from "@/utils/api";
import {
  buildWhatsappDetailedTaskRecapMessage,
  extractTaskLinksToday,
  getTodayWibDateKey,
  normalizeInstagramTaskPosts,
  normalizeTiktokTaskPosts,
} from "@/utils/taskRecapWhatsapp";

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
  const {
    premiumTier,
    premiumExpiry,
    effectiveRole,
    effectiveClientType,
    token,
    clientId,
    regionalId,
    profile,
  } = useAuth();
  const [activeTab, setActiveTab] = useState(
    initialTab === "rekap" ? "rekap" : "insight",
  );
  const [directorateScope, setDirectorateScope] = useState("client");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [remoteExecutiveRecap, setRemoteExecutiveRecap] = useState(null);
  const [remoteRiskSummary, setRemoteRiskSummary] = useState(null);
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
  const hasPremiumDateAccess = isPremiumTierAllowedForEngagementDate(premiumTier) || isOrgOperator;
  const showDateSelector = hasPremiumDateAccess || isOriginalDirectorateClient;
  const premiumViewOptions = [
    { value: "today", label: "Hari ini", periode: "harian" },
    { value: "week", label: "Mingguan (7 hari)", periode: "mingguan", week: true },
    { value: "month", label: "Bulanan", periode: "bulanan", month: true },
    {
      value: "custom_range",
      label: "Rentang Tanggal",
      periode: "harian",
      range: true,
    },
  ];
  const viewOptions = showDateSelector
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

  const hasPremiumAccess = hasActivePremiumSubscription(
    premiumTier,
    premiumExpiry || profile?.premium_expires_at || null,
    Boolean(profile?.premium_status),
  );
  const premiumInsightClientId = selectedClientId || clientId;
  const premiumInsightScope = isDirectorate
    ? selectedClientId
      ? "org"
      : directorateScope === "all"
        ? "direktorat"
        : "org"
    : "org";

  useEffect(() => {
    if (!hasPremiumAccess || !token || !premiumInsightClientId) {
      setRemoteExecutiveRecap(null);
      setRemoteRiskSummary(null);
      return;
    }

    const controller = new AbortController();
    const roleOption = String(effectiveRole || "").trim().toLowerCase();
    const filters = {
      platform: "tiktok",
      client_id: premiumInsightClientId,
      scope: premiumInsightScope,
      role: roleOption,
      regional_id: regionalId || undefined,
      periode: viewBy === "today" ? "harian" : viewBy === "week" ? "mingguan" : viewBy === "month" ? "bulanan" : "harian",
      tanggal: normalizedCustomDate || undefined,
      start_date: normalizedRange.startDate || undefined,
      end_date: normalizedRange.endDate || undefined,
    };

    Promise.all([
      getDashboardPremiumExecutiveRecap(token, filters, controller.signal),
      getDashboardPremiumRiskSummary(token, filters, controller.signal),
    ])
      .then(([executiveRes, riskRes]) => {
        setRemoteExecutiveRecap(
          mapExecutiveRecapToCardProps(executiveRes) || null,
        );
        setRemoteRiskSummary(
          mapRiskSummaryToCardProps(riskRes, {
            hasPremiumAccess,
            premiumHref: "/premium",
          }) || null,
        );
      })
      .catch((fetchError) => {
        if (fetchError?.name === "AbortError") return;
        console.warn("Gagal memuat premium insight TikTok dari backend:", fetchError);
        setRemoteExecutiveRecap(null);
        setRemoteRiskSummary(null);
      });

    return () => controller.abort();
  }, [
    clientId,
    directorateScope,
    effectiveRole,
    hasPremiumAccess,
    isDirectorate,
    normalizedCustomDate,
    normalizedRange.endDate,
    normalizedRange.startDate,
    premiumInsightClientId,
    premiumInsightScope,
    regionalId,
    selectedClientId,
    token,
    viewBy,
  ]);

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
  const totalSudahKomentar = Math.max(
    0,
    Math.min(validUserCount, Number(effectiveRekapSummary.totalSudahKomentar) || 0),
  );
  const totalKurangKomentar = Math.max(
    0,
    Math.min(validUserCount, Number(effectiveRekapSummary.totalKurangKomentar) || 0),
  );
  const totalBelumKomentarRaw = Number(effectiveRekapSummary.totalBelumKomentar) || 0;
  const maxBelumKomentarFromActiveUsers = Math.max(0, validUserCount - totalSudahKomentar - totalKurangKomentar);
  const totalBelumKomentar = Math.min(
    maxBelumKomentarFromActiveUsers,
    Math.max(0, totalBelumKomentarRaw),
  );
  const getPercentage = (value, base = validUserCount) => {
    const denominator = Number(base);
    if (!denominator) return undefined;
    const numerator = Number(value) || 0;
    return (numerator / denominator) * 100;
  };

  const complianceRate = getPercentage(totalSudahKomentar);
  const actionNeededCount = totalKurangKomentar + totalBelumKomentar;
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
      label: "Komentar Lengkap",
      value: totalSudahKomentar,
      color: "green",
      icon: <MessageCircle className="h-6 w-6" />,
      percentage: complianceRate,
    },
    {
      key: "kurang",
      label: "Kurang Komentar",
      value: totalKurangKomentar,
      color: "amber",
      icon: <MessageCircle className="h-6 w-6" />,
      percentage: getPercentage(totalKurangKomentar),
    },
    {
      key: "belum",
      label: "Belum Komentar",
      value: totalBelumKomentar,
      color: "red",
      icon: <MessageCircle className="h-6 w-6" />,
      percentage: getPercentage(totalBelumKomentar),
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
          ? `${actionNeededCount} akun ber-username masih perlu aksi komentar${
              actionNeededRate !== undefined
                ? ` (${Math.round(actionNeededRate)}% dari pengguna aktif)`
                : ""
            }, terdiri dari ${totalKurangKomentar} kurang lengkap dan ${totalBelumKomentar} belum melaksanakan sama sekali. ${totalTanpaUsername > 0 ? `${totalTanpaUsername} akun tanpa username dipisahkan dari prioritas aksi.` : ""}`
          : "Seluruh akun aktif sudah memenuhi target komentar.",
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

  const shouldGroupByClient =
    isDirectorate &&
    (directorateScope === "all" ||
      (!isDirectorateScopedClient && !isDirectorateRole));
  const directorateGroupBy = shouldGroupByClient ? "client_id" : "divisi";
  const directorateOrientation = shouldGroupByClient ? "horizontal" : "vertical";
  const directorateTitle = shouldGroupByClient
    ? "SATKER JAJARAN"
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
    labelSudah: "Komentar Lengkap",
    labelKurang: "Komentar Kurang Lengkap",
    labelBelum: "Tanpa Komentar",
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

  const { premiumCta, premiumProof } = buildEngagementPremiumUpsell({
    platform: "tiktok",
    hasPremiumAccess,
    isOrgClient,
    isOrgOperator,
    periodLabel: reportPeriodeLabel,
    totalUsers: totalUser,
    completedCount: totalSudahKomentar,
    actionNeededCount,
    notStartedCount: totalBelumKomentar,
    missingUsernameCount: totalTanpaUsername,
    totalPosts: effectiveRekapSummary.totalTiktokPost,
    complianceRate,
    premiumHref: "/premium",
  });
  const riskAlertCenter = buildRiskComplianceAlertCenter({
    platform: "TikTok",
    periodLabel: reportPeriodeLabel,
    totalUsers: totalUser,
    completedCount: totalSudahKomentar,
    partialCount: totalKurangKomentar,
    notStartedCount: totalBelumKomentar,
    missingUsernameCount: totalTanpaUsername,
    complianceRate,
    hasPremiumAccess,
    premiumHref: "/premium",
  });
  const executiveBrief = buildExecutiveRecap({
    platform: "TikTok",
    mode: "brief",
    clientName: selectedClientName || "Satker",
    periodLabel: reportPeriodeLabel,
    totalUsers: totalUser,
    totalPosts: effectiveRekapSummary.totalTiktokPost,
    completedCount: totalSudahKomentar,
    partialCount: totalKurangKomentar,
    notStartedCount: totalBelumKomentar,
    missingUsernameCount: totalTanpaUsername,
    complianceRate,
  });
  const executiveFull = buildExecutiveRecap({
    platform: "TikTok",
    mode: "full",
    clientName: selectedClientName || "Satker",
    periodLabel: reportPeriodeLabel,
    totalUsers: totalUser,
    totalPosts: effectiveRekapSummary.totalTiktokPost,
    completedCount: totalSudahKomentar,
    partialCount: totalKurangKomentar,
    notStartedCount: totalBelumKomentar,
    missingUsernameCount: totalTanpaUsername,
    complianceRate,
  });

  const viewSelectorProps = showDateSelector
    ? {
        value: viewBy,
        onChange: handleViewChange,
        date: selectorDateValue,
        onDateChange: handleDateChange,
        options: resolvedViewOptions,
      }
    : null;

  async function handleCopyTaskLinksToday() {
    const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("cicero_token") : "");
    const authClientId = clientId || (typeof window !== "undefined" ? localStorage.getItem("client_id") : "");

    if (!authToken || !authClientId) {
      showToast("Token atau client ID tidak ditemukan. Silakan login ulang.", "error");
      return;
    }

    const roleOption = String(effectiveRole || "").trim().toLowerCase() || undefined;
    const scopeOption =
      isOriginalDirectorateClient && directorateScope === "all" ? "DIREKTORAT" : "ORG";
    const todayWib = getTodayWibDateKey();

    try {
      const [igRecap, tiktokRecap, igPostsRes, tiktokPostsRes] = await Promise.all([
        getRekapLikesIG(authToken, authClientId, "harian", undefined, undefined, undefined, {
          role: roleOption,
          scope: scopeOption,
          regional_id: regionalId || undefined,
        }),
        getRekapKomentarTiktok(
          authToken,
          authClientId,
          "harian",
          undefined,
          undefined,
          undefined,
          undefined,
          {
            role: roleOption,
            scope: scopeOption,
            regional_id: regionalId || undefined,
          },
        ),
        getInstagramPosts(authToken, authClientId, {
          startDate: todayWib,
          endDate: todayWib,
          scope: scopeOption,
          role: roleOption,
          regional_id: regionalId || undefined,
        }),
        getTiktokPosts(authToken, authClientId, {
          startDate: todayWib,
          endDate: todayWib,
          scope: scopeOption,
          role: roleOption,
          regional_id: regionalId || undefined,
        }),
      ]);

      const igLinks = extractTaskLinksToday(igRecap, "instagram").links;
      const tiktokLinks = extractTaskLinksToday(tiktokRecap, "tiktok").links;
      const instagramPosts = normalizeInstagramTaskPosts(igPostsRes?.posts || igPostsRes?.data || []);
      const tiktokPosts = normalizeTiktokTaskPosts(tiktokPostsRes?.data || tiktokPostsRes?.posts || []);

      const message = buildWhatsappDetailedTaskRecapMessage({
        clientName: selectedClientName || clientName || authClientId,
        instagramPosts,
        tiktokPosts,
        instagramFallbackLinks: igLinks,
        tiktokFallbackLinks: tiktokLinks,
      });

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(message);
        showToast("Daftar tugas harian berhasil disalin.", "success");
        return;
      }

      if (typeof window !== "undefined") {
        window.prompt("Salin daftar tugas secara manual:", message);
        showToast("Clipboard tidak tersedia. Silakan salin manual.", "info");
      }
    } catch (error) {
      showToast(
        "Gagal menyusun daftar tugas Instagram/TikTok hari ini.",
        "error",
      );
    }
  }


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
    officialTiktokUsername:
      profile?.client_tiktok ||
      profile?.tiktok ||
      profile?.username_tiktok ||
      "",
  };

  const directorateClientSelectorLabel = "Pilih Client Direktorat / Satker";

  return (
    <InsightLayout
      title="TikTok Engagement Insight"
      description="Pantau performa komentar harian."
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
          premiumProof={premiumProof ? <PremiumProofValueCard {...premiumProof} /> : null}
          riskAlertCenter={<RiskAlertCenter {...(remoteRiskSummary || riskAlertCenter)} />}
          executiveRecap={
            <ExecutiveRecapCard
              {...(remoteExecutiveRecap || {
                title: executiveBrief.title,
                description: executiveBrief.description,
                summary: executiveBrief.summary,
                briefText: executiveBrief.text,
                fullText: executiveFull.text,
              })}
            />
          }
          onCopyRekap={handleCopyRekap}
          rekapTaskAction={{
            onClick: handleCopyTaskLinksToday,
            label: "Copy Tugas Hari Ini",
          }}
          summaryCards={uniqueSummaryCards}
          quickInsights={quickInsights}
          quickInsightTone="blue"
        >
          {shouldShowClientSelector ? (
            <div className="relative overflow-hidden rounded-2xl border-2 border-blue-100/80 bg-gradient-to-br from-white via-blue-50/20 to-white p-4 shadow-md backdrop-blur-sm">
              <div className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full bg-blue-200/20 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-sky-200/20 blur-2xl" />
              <div className="relative">
                <DirectorateClientSelector
                  clients={directorateClientOptions}
                  selectedClientId={selectedClientId}
                  onClientChange={setSelectedClientId}
                  label={directorateClientSelectorLabel}
                />
              </div>
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
        description="Rekap detail keterlibatan komentar tersedia tanpa perlu pindah halaman."
        showContent={activeTab === "rekap"}
      >
        {shouldShowClientSelector ? (
          <div className="relative overflow-hidden rounded-2xl border-2 border-blue-100/80 bg-gradient-to-br from-white via-blue-50/20 to-white p-4 shadow-md backdrop-blur-sm mb-4">
            <div className="pointer-events-none absolute -top-8 -left-8 h-24 w-24 rounded-full bg-blue-200/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-sky-200/20 blur-2xl" />
            <div className="relative">
              <DirectorateClientSelector
                clients={directorateClientOptions}
                selectedClientId={selectedClientId}
                onClientChange={setSelectedClientId}
                label={directorateClientSelectorLabel}
              />
            </div>
          </div>
        ) : null}

        <RekapKomentarTiktok
          users={displayedUsers}
          totalTiktokPost={effectiveRekapSummary.totalTiktokPost}
          showCopyButton={false}
          clientName={selectedClientName}
          reportContext={reportContext}
          rekapSummary={effectiveRekapSummary}
          showPremiumCta={isOrgClient && !hasPremiumAccess}
        />
      </DetailRekapSection>
    </InsightLayout>
  );
}
