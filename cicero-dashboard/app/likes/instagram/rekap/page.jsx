"use client";
import { useMemo, useState, useRef } from "react";
import Loader from "@/components/Loader";
import RekapLikesIG from "@/components/RekapLikesIG";
import Link from "next/link";
import useRequireAuth from "@/hooks/useRequireAuth";
import useInstagramLikesData from "@/hooks/useInstagramLikesData";
import ViewDataSelector, {
  VIEW_OPTIONS,
} from "@/components/ViewDataSelector";
import { ArrowLeft } from "lucide-react";

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

export default function RekapLikesIGPage() {
  useRequireAuth();
  const [viewBy, setViewBy] = useState("today");
  const today = getLocalDateString();
  const currentMonth = getLocalMonthString();
  const [dailyDate, setDailyDate] = useState(today);
  const [monthlyDate, setMonthlyDate] = useState(currentMonth);
  const [ditbinmasScope, setDitbinmasScope] = useState("client");
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today,
  });

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
      setMonthlyDate(val || currentMonth);
      return;
    }
    setDailyDate(val || today);
  };

  const normalizedDailyDate = dailyDate || today;
  const normalizedMonthlyDate = monthlyDate || currentMonth;
  const normalizedRangeStart = dateRange.startDate || today;
  const normalizedRangeEnd = dateRange.endDate || normalizedRangeStart;
  const normalizedRange = {
    startDate: normalizedRangeStart,
    endDate: normalizedRangeEnd,
  };

  const normalizedCustomDate =
    viewBy === "month" ? normalizedMonthlyDate : normalizedDailyDate;

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

  const {
    chartData,
    loading,
    error,
    rekapSummary,
    igPosts,
    clientName,
    isDitbinmasRole,
  } = useInstagramLikesData({
    viewBy,
    customDate: normalizedCustomDate,
    fromDate: normalizedRange.startDate,
    toDate: normalizedRange.endDate,
    scope: ditbinmasScope,
  });

  const rekapRef = useRef(null);

  const selectorDateValue =
    viewBy === "custom_range"
      ? dateRange
      : viewBy === "month"
        ? monthlyDate
        : dailyDate;

  const viewOptions = VIEW_OPTIONS;
  const ditbinmasScopeOptions = [
    { value: "client", label: "Client Saya" },
    { value: "all", label: "Seluruh Client Ditbinmas" },
  ];

  const handleDitbinmasScopeChange = (event) => {
    const { value } = event.target || {};
    if (value === "client" || value === "all") {
      setDitbinmasScope(value);
    }
  };

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-blue-100 p-6 text-slate-700">
        <div className="rounded-3xl border border-red-300/60 bg-white/80 px-8 py-6 text-center text-red-600 shadow-[0_15px_35px_rgba(59,130,246,0.12)]">
          {error}
        </div>
      </div>
    );
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-blue-100 text-slate-800">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(125,211,252,0.25),_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(96,165,250,0.2)_0%,_transparent_80%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-12 md:px-10">
        <div className="flex flex-col gap-10">
          <div className="relative overflow-hidden rounded-3xl border border-sky-200/80 bg-white/70 p-6 shadow-[0_20px_50px_rgba(56,189,248,0.18)] backdrop-blur">
            <div className="pointer-events-none absolute -top-16 left-0 h-40 w-40 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-8 h-48 w-48 rounded-full bg-teal-200/50 blur-3xl" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-sky-900">
                    Rekapitulasi Engagement Instagram
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-slate-600">
                    Lihat rekap detail keterlibatan likes dan komentar dari seluruh personel.
                  </p>
                </div>
                <Link
                  href="/likes/instagram"
                  className="inline-flex items-center gap-2 rounded-2xl border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-[0_12px_30px_rgba(59,130,246,0.18)] transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Link>
              </div>
              <div className="rounded-2xl border border-sky-100 bg-white/80 p-4 shadow-inner backdrop-blur">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <ViewDataSelector
                    value={viewBy}
                    onChange={handleViewChange}
                    options={viewOptions}
                    date={selectorDateValue}
                    onDateChange={handleDateChange}
                  />
                  {isDitbinmasRole && (
                    <div className="flex w-full flex-col gap-2 md:w-64">
                      <label className="text-sm font-semibold text-slate-700">
                        Lingkup Data
                      </label>
                      <select
                        value={ditbinmasScope}
                        onChange={handleDitbinmasScopeChange}
                        className="w-full rounded-xl border border-sky-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200 hover:border-sky-300"
                      >
                        {ditbinmasScopeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <RekapLikesIG
            ref={rekapRef}
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
      </div>
    </div>
  );
}
