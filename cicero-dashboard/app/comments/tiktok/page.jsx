"use client";
import { useMemo, useState } from "react";
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
} from "lucide-react";
import useTiktokCommentsData from "@/hooks/useTiktokCommentsData";
import { buildTiktokRekap } from "@/utils/buildTiktokRekap";
import RekapKomentarTiktok from "@/components/RekapKomentarTiktok";

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
  const viewOptions = VIEW_OPTIONS;
  const today = getLocalDateString();
  const currentMonth = getLocalMonthString();

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
    { value: "client", label: "Client Saya" },
    { value: "all", label: "Seluruh Client Ditbinmas" },
  ];

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
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              TikTok Engagement Insight
            </h1>
            <p className="max-w-3xl text-sm text-slate-600 md:text-base">
              Pantau performa enggagement personel TikTok untuk{" "}
              <span className="font-semibold text-sky-700">
                {clientName || "satuan Anda"}
              </span>
              . Gunakan panel ini untuk melihat kepatuhan komentar, memantau
              Satker yang aktif / kurang aktif / belum aktif dan mengambil tindakan cepat ketika komentar
              belum terpenuhi.
            </p>
          </div>

          <div className="flex flex-col gap-6 rounded-3xl border border-sky-200/70 bg-white/80 p-4 shadow-[0_22px_50px_-28px_rgba(14,116,144,0.35)] backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
              {isDitbinmasRole && (
                <div className="flex w-full flex-col gap-2 md:w-64">
                  <label className="text-sm font-semibold text-slate-800">Lingkup Data</label>
                  <select
                    value={ditbinmasScope}
                    onChange={handleDitbinmasScopeChange}
                    className="w-full rounded-xl border border-sky-200/70 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-inner outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200/60 hover:border-indigo-200"
                  >
                    {ditbinmasScopeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Atur apakah rekap menampilkan seluruh client Ditbinmas atau hanya client aktif Anda.
                  </p>
                </div>
              )}
            </div>

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
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600">
                      {insight.title}
                    </p>
                    <p className="text-sm text-slate-700">{insight.detail}</p>
                  </div>
                </div>
              ))}
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

          <div className="flex flex-col gap-4 rounded-3xl border border-indigo-200/70 bg-white/85 p-5 shadow-[0_22px_55px_-32px_rgba(99,102,241,0.35)] backdrop-blur">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Rekapitulasi Komentar TikTok
                </h2>
                <p className="text-sm text-slate-600">
                  Lihat tabel detil personel yang sudah, kurang, atau belum berkomentar sesuai periode yang Anda pilih.
                </p>
              </div>
              <button
                onClick={handleCopyRekap}
                className="group flex items-center gap-2 rounded-2xl border border-indigo-300/70 bg-indigo-500/20 px-6 py-3 text-sm font-semibold uppercase tracking-widest text-indigo-700 shadow-[0_18px_45px_-28px_rgba(129,140,248,0.45)] transition hover:border-indigo-400/80 hover:bg-indigo-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
              >
                <Copy className="h-4 w-4" />
                Rekap Komentar
              </button>
            </div>
            <RekapKomentarTiktok
              users={chartData}
              totalTiktokPost={rekapSummary.totalTiktokPost}
              showCopyButton={false}
              reportContext={reportContext}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
