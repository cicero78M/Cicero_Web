"use client";
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientNames,
} from "@/utils/api";
import Loader from "@/components/Loader";
import RekapKomentarTiktok from "@/components/RekapKomentarTiktok";
import Link from "next/link";
import useRequireAuth from "@/hooks/useRequireAuth";
import ViewDataSelector, {
  getPeriodeDateForView,
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

export default function RekapKomentarTiktokPage() {
  useRequireAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBy, setViewBy] = useState("today");
  const today = getLocalDateString();
  const currentMonth = getLocalMonthString();
  const [dailyDate, setDailyDate] = useState(today);
  const [monthlyDate, setMonthlyDate] = useState(currentMonth);
  const [dateRange, setDateRange] = useState({
    startDate: today,
    endDate: today,
  });
  const [rekapSummary, setRekapSummary] = useState({
    totalUser: 0,
    totalSudahKomentar: 0,
    totalBelumKomentar: 0,
    totalTiktokPost: 0,
  });

  const viewOptions = VIEW_OPTIONS;

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
        return nextRange;
      });
      return;
    }
    if (viewBy === "month") {
      const nextMonth =
        typeof val === "string" && val
          ? val.slice(0, 7)
          : currentMonth;
      setMonthlyDate(nextMonth || currentMonth);
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

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("cicero_token")
        : null;
    const userClientId =
      typeof window !== "undefined"
        ? localStorage.getItem("client_id")
        : null;
    const role =
      typeof window !== "undefined"
        ? localStorage.getItem("user_role")
        : null;
    const roleLower = String(role || "").toLowerCase();
    const clientIdUpper = String(userClientId || "").toUpperCase();
    const isDitbinmasRole = roleLower === "ditbinmas";
    const isRootDitbinmas = isDitbinmasRole && clientIdUpper === "DITBINMAS";
    const taskClientId = isRootDitbinmas ? "DITBINMAS" : userClientId;
    const rekapClientId = userClientId;

    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    if (!rekapClientId) {
      setError("Client ID pengguna tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const selectedDate =
          viewBy === "custom_range" ? normalizedRange : normalizedCustomDate;
        const { periode, date, startDate, endDate } =
          getPeriodeDateForView(viewBy, selectedDate);
        const statsRes = await getDashboardStats(
          token,
          periode,
          date,
          startDate,
          endDate,
          taskClientId,
          controller.signal,
        );
        const statsData = statsRes.data || statsRes;

        const rekapRes = await getRekapKomentarTiktok(
          token,
          rekapClientId,
          periode,
          date,
          startDate,
          endDate,
          controller.signal,
        );
        const users = Array.isArray(rekapRes.data) ? rekapRes.data : [];

        const normalizedRekapClientId = String(rekapClientId || "")
          .trim()
          .toUpperCase();
        const filteredUsers = normalizedRekapClientId
          ? users.filter((u) => {
              const possibleIds = [
                u.client_id,
                u.clientId,
                u.client,
                u.clientID,
                u.clientid,
              ];
              return possibleIds.some((cid) =>
                String(cid || "").trim().toUpperCase() ===
                normalizedRekapClientId,
              );
            })
          : users;

        // map client_id to client name for satker column
        const nameMap = await getClientNames(
          token,
          filteredUsers.map((u) =>
            String(
              u.client_id || u.clientId || u.client || u.clientID || "",
            ),
          ),
          controller.signal,
        );
        const enrichedUsers = filteredUsers.map((u) => {
          const cid = String(
            u.client_id || u.clientId || u.client || u.clientID || "",
          );
          const cName =
            nameMap[cid] ||
            u.nama_client ||
            u.client_name ||
            u.client ||
            cid;
          return { ...u, nama_client: cName, client_name: cName, client: cName };
        });

        // Sumber utama TikTok Post Hari Ini dari statsRes
        const totalTiktokPost =
          statsData?.ttPosts ||
          statsData?.tiktokPosts ||
          statsData.ttPosts ||
          statsData.tiktokPosts ||
          0;
        const isZeroPost = (totalTiktokPost || 0) === 0;
        const totalUser = filteredUsers.length;
        const totalSudahKomentar = isZeroPost
          ? 0
          : filteredUsers.filter(
              (u) => Number(u.jumlah_komentar) > 0 || u.exception
            ).length;
        const totalBelumKomentar = totalUser - totalSudahKomentar;

        setRekapSummary({
          totalUser,
          totalSudahKomentar,
          totalBelumKomentar,
          totalTiktokPost,
        });
        setChartData(enrichedUsers);
      } catch (err) {
        if (err?.name === "AbortError") {
          return;
        }
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      controller.abort();
    };
  }, [viewBy, normalizedCustomDate, normalizedRangeStart, normalizedRangeEnd]);

  const selectorDateValue =
    viewBy === "custom_range"
      ? normalizedRange
      : viewBy === "month"
        ? normalizedMonthlyDate
        : normalizedDailyDate;

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-rose-500/40 bg-slate-900/80 p-8 text-center shadow-[0_0_40px_rgba(244,63,94,0.25)]">
          <div className="absolute inset-x-12 -top-8 h-24 rounded-full bg-gradient-to-b from-rose-500/30 to-transparent blur-2xl" />
          <div className="relative space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-rose-200/80">
              System Alert
            </p>
            <p className="text-lg font-semibold text-rose-100">{error}</p>
            <p className="text-sm text-slate-300">
              Coba muat ulang halaman atau periksa kembali koneksi data Anda.
            </p>
          </div>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-[-100px] h-[360px] w-[360px] rounded-full bg-fuchsia-500/20 blur-[150px]" />
        <div className="absolute right-[-120px] top-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-[160px]" />
        <div className="absolute inset-x-0 bottom-[-200px] h-[320px] bg-gradient-to-t from-slate-900 via-slate-950/60 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-16 pt-10 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-fuchsia-200">
              Rekap Komentar
            </span>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold leading-tight text-slate-50 md:text-4xl">
                  Rekapitulasi Komentar TikTok
                </h1>
                <p className="max-w-3xl text-sm text-slate-300 md:text-base">
                  Pantau laporan engagement Tiktok harian / rentang tanggal tertentu.
                  Panel rekap memberikan ringkasan kepatuhan serta detail pengguna
                  sehingga Anda bisa menindaklanjuti satker dan personil yang belum / kurang aktif.
                </p>
              </div>
              <Link
                href="/comments/tiktok"
                className="group inline-flex items-center gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 transition hover:border-fuchsia-400/60 hover:bg-fuchsia-500/10"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Kembali
              </Link>
            </div>
          </div>

          <ViewDataSelector
            value={viewBy}
            onChange={handleViewChange}
            options={viewOptions}
            date={selectorDateValue}
            onDateChange={handleDateChange}
            className="justify-start gap-3 rounded-3xl border border-slate-800/70 bg-slate-900/70 px-4 py-4 backdrop-blur"
            labelClassName="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400/90"
            controlClassName="border-slate-700/60 bg-slate-900/70 text-slate-100 focus:border-fuchsia-400 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/30"
          />
        </div>

        <RekapKomentarTiktok
          users={chartData}
          totalTiktokPost={rekapSummary.totalTiktokPost}
        />
      </div>
    </div>
  );
}
