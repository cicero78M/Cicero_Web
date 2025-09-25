"use client";
import { useState, useRef, useEffect } from "react";
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

export default function RekapLikesIGPage() {
  useRequireAuth();
  const [viewBy, setViewBy] = useState("today");
  const today = getLocalDateString();
  const currentMonth = getLocalMonthString();
  const [dailyDate, setDailyDate] = useState(today);
  const [monthlyDate, setMonthlyDate] = useState(currentMonth);
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today,
  });
  const [ditbinmasScope, setDitbinmasScope] = useState<"all" | "self">("all");
  const [canChooseDitbinmasScope, setCanChooseDitbinmasScope] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedRole = localStorage.getItem("user_role") || "";
    const storedClientId = localStorage.getItem("client_id") || "";
    const isDitbinmasRole = storedRole.toLowerCase() === "ditbinmas";
    const isDitbinmasClient = storedClientId.toUpperCase() === "DITBINMAS";
    if (isDitbinmasRole && isDitbinmasClient) {
      setCanChooseDitbinmasScope(true);
      setDitbinmasScope("all");
    } else {
      setDitbinmasScope("self");
    }
  }, []);

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

  const {
    chartData,
    loading,
    error,
    rekapSummary,
    igPosts,
    clientName,
  } = useInstagramLikesData({
    viewBy,
    customDate: normalizedCustomDate,
    fromDate: normalizedRange.startDate,
    toDate: normalizedRange.endDate,
    ditbinmasScope,
  });

  const rekapRef = useRef(null);

  const selectorDateValue =
    viewBy === "custom_range"
      ? dateRange
      : viewBy === "month"
        ? monthlyDate
        : dailyDate;

  const viewOptions = VIEW_OPTIONS;

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-slate-100">
        <div className="rounded-3xl border border-red-500/40 bg-slate-900/70 px-8 py-6 text-center text-red-200 shadow-[0_0_35px_rgba(248,113,113,0.25)]">
          {error}
        </div>
      </div>
    );
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_60%)]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(129,140,248,0.18)_0%,_transparent_70%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-12 md:px-10">
        <div className="flex flex-col gap-10">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-[0_0_48px_rgba(56,189,248,0.12)] backdrop-blur">
            <div className="pointer-events-none absolute -top-16 left-0 h-40 w-40 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-8 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-sky-100">
                    Rekapitulasi Engagement Instagram
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-slate-300">
                    Lihat rekap detail keterlibatan likes dan komentar dari seluruh personel.
                  </p>
                </div>
                <Link
                  href="/likes/instagram"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-400/40 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 shadow-[0_0_25px_rgba(56,189,248,0.15)] transition hover:border-sky-400/60 hover:bg-sky-500/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Link>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner backdrop-blur">
                {canChooseDitbinmasScope && (
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                      Mode Data
                    </span>
                    <div className="flex overflow-hidden rounded-xl border border-white/10 bg-white/5">
                      <button
                        type="button"
                        onClick={() => setDitbinmasScope("self")}
                        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${ditbinmasScope === "self" ? "bg-sky-500/30 text-sky-100" : "text-slate-300 hover:bg-white/10"}`}
                      >
                        Hanya Ditbinmas
                      </button>
                      <button
                        type="button"
                        onClick={() => setDitbinmasScope("all")}
                        className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${ditbinmasScope === "all" ? "bg-sky-500/30 text-sky-100" : "text-slate-300 hover:bg-white/10"}`}
                      >
                        Semua Polres Ditbinmas
                      </button>
                    </div>
                  </div>
                )}
                <ViewDataSelector
                  value={viewBy}
                  onChange={handleViewChange}
                  options={viewOptions}
                  date={selectorDateValue}
                  onDateChange={handleDateChange}
                />
              </div>
            </div>
          </div>

          <RekapLikesIG
            ref={rekapRef}
            users={chartData}
            totalIGPost={rekapSummary.totalIGPost}
            posts={igPosts}
            showRekapButton
            clientName={clientName}
          />
        </div>
      </div>
    </div>
  );
}
