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
import ViewDataSelector, { VIEW_OPTIONS } from "@/components/ViewDataSelector";
import {
  AlertTriangle,
  Music,
  User,
  MessageCircle,
  UserX,
  Copy,
  Sparkles,
  BarChart3,
  ClipboardList,
} from "lucide-react";
import useTiktokCommentsData from "@/hooks/useTiktokCommentsData";
import { buildTiktokRekap } from "@/utils/buildTiktokRekap";
import RekapKomentarTiktok from "@/components/RekapKomentarTiktok";

const TABS = [
  { value: "insight", label: "Dashboard Insight", icon: BarChart3 },
  { value: "rekap", label: "Rekap Detail", icon: ClipboardList },
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalMonthString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

const fullDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

function formatDisplayDate(value) {
  if (!value || typeof value !== "string") return "-";
  const [year, month, day] = value.split("-").map((part) => Number(part));
  if (!year || !month || !day) return value;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return value;
  return fullDateFormatter.format(date);
}

function formatDisplayMonth(value) {
  if (!value || typeof value !== "string") return "-";
  const [year, month] = value.split("-").map((part) => Number(part));
  if (!year || !month) return value;
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime())) return value;
  return monthFormatter.format(date);
}

function formatDisplayRange(start, end) {
  if (!start) return "-";
  if (!end || start === end) {
    return formatDisplayDate(start);
  }
  return `${formatDisplayDate(start)} s.d. ${formatDisplayDate(end)}`;
}

export default function TiktokEngagementInsightPage() {
  useRequireAuth();
  const [activeTab, setActiveTab] = useState("insight");
  const viewOptions = VIEW_OPTIONS;
  const today = getLocalDateString();
  const currentMonth = getLocalMonthString();
  const rekapSectionRef = useRef(null);

  const [viewBy, setViewBy] = useState("today");
  const [dailyDate, setDailyDate] = useState(today);
  const [monthlyDate, setMonthlyDate] = useState(currentMonth);
  const [dateRange, setDateRange] = useState({ startDate: today, endDate: today });
  const [ditbinmasScope, setDitbinmasScope] = useState("client");

  const normalizedDailyDate = dailyDate || today;
  const normalizedMonthlyDate = monthlyDate || currentMonth;
  const normalizedRangeStart = dateRange.startDate || today;
  const normalizedRangeEnd = dateRange.endDate || normalizedRangeStart;
  const normalizedRange = {
    startDate: normalizedRangeStart,
    endDate: normalizedRangeEnd,
  };

  const selectorDateValue =
    viewBy === "custom_range"
      ? normalizedRange
      : viewBy === "month"
        ? normalizedMonthlyDate
        : normalizedDailyDate;

  const customDate = viewBy === "month" ? normalizedMonthlyDate : normalizedDailyDate;

  const {
    chartData,
    rekapSummary,
    isDirectorate,
    clientName,
    isDitbinmasRole,
    isDitbinmasScopedClient,
    loading,
    error,
  } = useTiktokCommentsData({
    viewBy,
    customDate,
    fromDate: normalizedRange.startDate,
    toDate: normalizedRange.endDate,
    scope: ditbinmasScope,
  });

  const reportPeriodeLabel = useMemo(() => {
    if (viewBy === "custom_range") {
      return formatDisplayRange(normalizedRangeStart, normalizedRangeEnd);
    }
    if (viewBy === "month") {
      return formatDisplayMonth(normalizedMonthlyDate);
    }
    return formatDisplayDate(normalizedDailyDate);
  }, [
    viewBy,
    normalizedRangeStart,
    normalizedRangeEnd,
    normalizedMonthlyDate,
    normalizedDailyDate,
  ]);

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

  const handleViewChange = (nextView) => {
    setViewBy((prevView) => {
      if (nextView === "today") {
        setDailyDate(today);
      }
      if (nextView === "date" && prevView !== "date") {
        setDailyDate(today);
      }
      if (nextView === "month" && prevView !== "month") {
        setMonthlyDate(currentMonth);
      }
      if (nextView === "custom_range" && prevView !== "custom_range") {
        setDateRange({
          startDate: today,
          endDate: today,
        });
      }
      return nextView;
    });
  };

  const handleDateChange = (val) => {
    if (viewBy === "custom_range") {
      if (!val || typeof val !== "object") {
        return;
      }
      setDateRange((prev) => {
        const nextRange = {
          startDate: val.startDate ?? prev.startDate ?? today,
          endDate: val.endDate ?? prev.endDate ?? prev.startDate ?? today,
        };
        if (!nextRange.startDate) {
          nextRange.startDate = today;
        }
        if (!nextRange.endDate) {
          nextRange.endDate = nextRange.startDate;
        }
        if (nextRange.startDate && nextRange.endDate) {
          const start = new Date(nextRange.startDate);
          const end = new Date(nextRange.endDate);
          if (start > end) {
            return {
              startDate: nextRange.endDate,
              endDate: nextRange.startDate,
            };
          }
        }
        return nextRange;
      });
      return;
    }
    if (viewBy === "month") {
      const nextMonth = typeof val === "string" && val ? val.slice(0, 7) : currentMonth;
      setMonthlyDate(nextMonth || currentMonth);
      return;
    }
    setDailyDate(val || today);
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
          <div className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-white/85 p-5 shadow-[0_22px_50px_-28px_rgba(14,116,144,0.35)] backdrop-blur">
            <div className="pointer-events-none absolute -left-10 top-8 h-32 w-32 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-4 h-36 w-36 rounded-full bg-indigo-200/50 blur-3xl" />
            <div className="relative flex flex-col gap-6">
              <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
                    TikTok Engagement Insight
                  </h1>
                  <p className="mt-1 max-w-3xl text-sm text-slate-600 md:text-base">
                    Pantau performa enggagement personel TikTok untuk {" "}
                    <span className="font-semibold text-sky-700">{clientName || "satuan Anda"}</span>. Gunakan panel ini untuk
                    melihat kepatuhan komentar, memantau Satker yang aktif / kurang aktif / belum aktif dan mengambil tindakan
                    cepat ketika komentar belum terpenuhi.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 rounded-2xl border border-sky-100/80 bg-white/70 p-2 shadow-inner">
                  {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.value;
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
                    className="justify-start gap-3"
                    labelClassName="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500"
                    controlClassName="border-sky-200/70 bg-white/90 text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
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
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                    Grafik POLSEK menggambarkan distribusi komentar antar user dari setiap polsek serta total komentar yang
                    berhasil dikumpulkan.
                  </Narrative>
                </div>
              )}
            </div>
          )}

          <section
            ref={rekapSectionRef}
            id="rekap-detail"
            className="relative overflow-hidden rounded-3xl border border-indigo-200/70 bg-white/85 p-5 shadow-[0_22px_55px_-32px_rgba(99,102,241,0.35)] backdrop-blur"
          >
            <div className="pointer-events-none absolute -top-16 left-0 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-6 h-44 w-44 rounded-full bg-sky-200/45 blur-3xl" />
            <div className="relative">
              <div className="flex flex-col gap-2 border-b border-indigo-100/80 pb-4">
                <h2 className="text-xl font-semibold text-slate-900">Rekapitulasi Komentar TikTok</h2>
                <p className="text-sm text-slate-600">
                  Lihat tabel detil personel yang sudah, kurang, atau belum berkomentar sesuai periode yang Anda pilih.
                </p>
              </div>
              {activeTab === "rekap" && (
                <div className="pt-4">
                  <RekapKomentarTiktok
                    users={chartData}
                    totalTiktokPost={rekapSummary.totalTiktokPost}
                    showCopyButton={false}
                    reportContext={reportContext}
                  />
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
