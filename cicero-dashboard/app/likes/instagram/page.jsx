"use client";

import { useRef, useState } from "react";
import Loader from "@/components/Loader";
import InstagramInsightChartBox from "@/components/likes/instagram/Insight/InstagramInsightChartBox";
import InstagramInsightSummaryItem from "@/components/likes/instagram/Insight/InstagramInsightSummaryItem";
import ChartHorizontal from "@/components/ChartHorizontal";
import { buildInstagramRekap, groupUsersByKelompok } from "@/utils/instagramEngagement";
import Narrative from "@/components/Narrative";
import useRequireAuth from "@/hooks/useRequireAuth";
import useInstagramLikesData from "@/hooks/useInstagramLikesData";
import ViewDataSelector from "@/components/ViewDataSelector";
import { showToast } from "@/utils/showToast";
import {
  Camera,
  User,
  ThumbsUp,
  ThumbsDown,
  UserX,
  Copy,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import InstagramRekapLikes from "@/components/likes/instagram/Rekap/InstagramRekapLikes";
import useLikesDateSelector from "@/hooks/useLikesDateSelector";

const TABS = [
  { value: "insight", label: "Dashboard Insight", icon: BarChart3 },
  { value: "rekap", label: "Rekap Detail", icon: ClipboardList },
];

export default function InstagramEngagementInsightPage() {
  useRequireAuth();
  const [activeTab, setActiveTab] = useState("insight");
  const [ditbinmasScope, setDitbinmasScope] = useState("client");
  const rekapSectionRef = useRef(null);

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
    clientName,
    isDitbinmasScopedClient,
    isDitbinmasRole,
    igPosts,
  } = useInstagramLikesData({
    viewBy,
    customDate: normalizedCustomDate,
    fromDate: normalizedRange.startDate,
    toDate: normalizedRange.endDate,
    scope: ditbinmasScope,
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

  const ditbinmasScopeOptions = [
    { value: "client", label: "Client Saya" },
    { value: "all", label: "Seluruh Client Ditbinmas" },
  ];

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
                  <div className="flex flex-wrap gap-2 rounded-2xl border border-sky-100/80 bg-white/70 p-2 shadow-inner">
                    {TABS.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = tab.value === activeTab;
                      return (
                        <button
                          key={tab.value}
                          onClick={() => handleTabChange(tab.value)}
                          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 ${
                            isActive
                              ? "bg-sky-100 text-sky-800 shadow-[0_8px_20px_rgba(96,165,250,0.25)]"
                              : "text-slate-600 hover:bg-sky-50"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </header>

                <div className="flex flex-col gap-4 rounded-2xl border border-sky-100/60 bg-white/60 p-4 shadow-inner backdrop-blur">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <ViewDataSelector
                      value={viewBy}
                      onChange={handleViewChange}
                      options={viewOptions}
                      date={selectorDateValue}
                      onDateChange={handleDateChange}
                    />
                    <div className="flex flex-wrap gap-3 md:justify-end">
                      {isDitbinmasRole && (
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
                      {activeTab === "insight" && (
                        <button
                          onClick={() => handleTabChange("rekap")}
                          className="inline-flex items-center gap-2 rounded-2xl border border-sky-300/60 bg-sky-200/50 px-4 py-2 text-sm font-semibold text-sky-700 shadow-[0_0_25px_rgba(96,165,250,0.35)] transition-colors hover:border-sky-400/70 hover:bg-sky-200/70"
                        >
                          <ClipboardList className="h-4 w-4 text-sky-600" />
                          Buka Rekap Detail
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {activeTab === "insight" && (
              <div className="flex flex-col gap-10">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <InstagramInsightSummaryItem
                    label="Jumlah IG Post"
                    value={rekapSummary.totalIGPost}
                    color="blue"
                    icon={
                      <Camera className="h-7 w-7 text-sky-500 drop-shadow-[0_0_12px_rgba(56,189,248,0.45)]" />
                    }
                  />
                  <InstagramInsightSummaryItem
                    label="Total User"
                    value={rekapSummary.totalUser}
                    color="gray"
                    icon={
                      <User className="h-7 w-7 text-slate-500 drop-shadow-[0_0_12px_rgba(148,163,184,0.35)]" />
                    }
                  />
                  <InstagramInsightSummaryItem
                    label="Sudah Likes"
                    value={rekapSummary.totalSudahLike}
                    color="green"
                    icon={
                      <ThumbsUp className="h-7 w-7 text-teal-500 drop-shadow-[0_0_12px_rgba(45,212,191,0.4)]" />
                    }
                    percentage={getPercentage(rekapSummary.totalSudahLike)}
                  />
                  <InstagramInsightSummaryItem
                    label="Kurang Likes"
                    value={rekapSummary.totalKurangLike}
                    color="orange"
                    icon={
                      <ThumbsDown className="h-7 w-7 text-sky-500 drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]" />
                    }
                    percentage={getPercentage(rekapSummary.totalKurangLike)}
                  />
                  <InstagramInsightSummaryItem
                    label="Belum Likes"
                    value={rekapSummary.totalBelumLike}
                    color="red"
                    icon={
                      <ThumbsDown className="h-7 w-7 text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.4)]" />
                    }
                    percentage={getPercentage(rekapSummary.totalBelumLike)}
                  />
                  <InstagramInsightSummaryItem
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

                {isDirectorate ? (
                  <InstagramInsightChartBox
                    title={directorateTitle}
                    users={chartData}
                    totalPost={rekapSummary.totalIGPost}
                    groupBy={directorateGroupBy}
                    orientation={directorateOrientation}
                    sortBy="percentage"
                    narrative=
                      shouldGroupByClient
                        ? undefined
                        : "Grafik dan tabel ini menampilkan perbandingan capaian likes berdasarkan divisi/satfung."
                  />
                ) : (
                  <div className="flex flex-col gap-6">
                    <InstagramInsightChartBox
                      title="BAG"
                      users={kelompok.BAG}
                      totalPost={rekapSummary.totalIGPost}
                      narrative="Grafik ini menunjukkan perbandingan jumlah like dari user di divisi BAG."
                      sortBy="percentage"
                    />
                    <InstagramInsightChartBox
                      title="SAT"
                      users={kelompok.SAT}
                      totalPost={rekapSummary.totalIGPost}
                      narrative="Grafik ini menunjukkan perbandingan jumlah like dari user di divisi SAT."
                      sortBy="percentage"
                    />
                    <InstagramInsightChartBox
                      title="SI & SPKT"
                      users={kelompok["SI & SPKT"]}
                      totalPost={rekapSummary.totalIGPost}
                      narrative="Grafik ini menunjukkan perbandingan jumlah like dari user di divisi SI & SPKT."
                      sortBy="percentage"
                    />
                    <InstagramInsightChartBox
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
              </div>
            )}

            <section ref={rekapSectionRef} id="rekap-detail" className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 p-4 shadow-[0_24px_60px_rgba(59,130,246,0.12)] backdrop-blur">
              <div className="pointer-events-none absolute -top-16 left-0 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 right-6 h-44 w-44 rounded-full bg-sky-200/45 blur-3xl" />
              <div className="relative">
                <div className="flex flex-col gap-2 border-b border-blue-100/80 pb-4">
                  <h2 className="text-2xl font-semibold text-blue-900">Rekapitulasi Engagement Instagram</h2>
                  <p className="text-sm text-blue-700/80">
                    Rekap detail keterlibatan likes dan komentar tersedia tanpa perlu pindah halaman.
                  </p>
                </div>
                {activeTab === "rekap" && (
                  <div className="pt-4">
                    <InstagramRekapLikes
                      users={chartData}
                      totalIGPost={rekapSummary.totalIGPost}
                      posts={igPosts}
                      showRekapButton
                      showCopyButton={false}
                      clientName={clientName}
                      reportContext={{
                        periodeLabel: reportPeriodeLabel,
                        viewLabel:
                          viewOptions.find((option) => option.value === viewBy)?.label,
                      }}
                    />
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
