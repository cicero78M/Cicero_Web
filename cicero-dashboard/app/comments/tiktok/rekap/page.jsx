"use client";
import { useEffect, useMemo, useState } from "react";
import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientNames,
  getClientProfile,
  getUserDirectory,
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
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { prioritizeUsersForClient } from "@/utils/userOrdering";

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
  const [isDitbinmasUser, setIsDitbinmasUser] = useState(false);
  const [ditbinmasScope, setDitbinmasScope] = useState("client");
  const [directorateReportInfo, setDirectorateReportInfo] = useState({
    shortName: "Ditbinmas",
    officialName: "Direktorat Binmas",
  });

  const viewOptions = VIEW_OPTIONS;
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
    const roleLower = String(role || "").trim().toLowerCase();
        const normalizedClientId = String(userClientId || "").trim();
        const clientIdUpper = normalizedClientId.toUpperCase();
        const clientIdLower = normalizedClientId.toLowerCase();
        const isDitbinmasRole = roleLower === "ditbinmas";
        const ditbinmasClientId = "DITBINMAS";
    const isDitbinmasClient = clientIdUpper === ditbinmasClientId;
    const isScopedDirectorateClient = isDitbinmasRole && !isDitbinmasClient;
    const taskClientId = isDitbinmasRole ? ditbinmasClientId : normalizedClientId;

    setIsDitbinmasUser(isDitbinmasRole);

    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    if (!normalizedClientId) {
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
        const profileRes = await getClientProfile(
          token,
          normalizedClientId,
          controller.signal,
        );
        const profileData =
          profileRes?.client || profileRes?.profile || profileRes || {};
        const profileType = String(
          profileData?.client_type ||
            profileRes?.client_type ||
            profileData?.type ||
            profileRes?.type ||
            "",
        ).toUpperCase();
        const isDirectorate = isDitbinmasRole || profileType === "DIREKTORAT";

        let users = [];
        if (isDirectorate) {
          const directoryRes = await getUserDirectory(
            token,
            normalizedClientId,
            controller.signal,
          );
          const directoryData =
            directoryRes?.data || directoryRes?.users || directoryRes || [];
          const expectedRole = clientIdLower;
          const clientIds = Array.from(
            new Set(
              (Array.isArray(directoryData) ? directoryData : [])
                .filter((entry) => {
                  const roleValue = String(
                    entry?.role ||
                      entry?.user_role ||
                      entry?.userRole ||
                      entry?.roleName ||
                      "",
                  ).toLowerCase();
                  return roleValue === expectedRole;
                })
                .map((entry) =>
                  String(
                    entry?.client_id ||
                      entry?.clientId ||
                      entry?.clientID ||
                      entry?.client ||
                      "",
                  ).trim(),
                )
                .filter(Boolean),
            ),
          );

          if (!clientIds.includes(normalizedClientId)) {
            clientIds.push(normalizedClientId);
          }

          const rekapResponses = await Promise.all(
            clientIds.map((cid) =>
              getRekapKomentarTiktok(
                token,
                cid,
                periode,
                date,
                startDate,
                endDate,
                controller.signal,
              ).catch(() => ({ data: [] })),
            ),
          );

          users = rekapResponses.flatMap((res) => {
            if (Array.isArray(res?.data)) return res.data;
            if (Array.isArray(res)) return res;
            return [];
          });
        } else {
          const rekapRes = await getRekapKomentarTiktok(
            token,
            normalizedClientId,
            periode,
            date,
            startDate,
            endDate,
            controller.signal,
          );
          users = Array.isArray(rekapRes?.data)
            ? rekapRes.data
            : Array.isArray(rekapRes)
              ? rekapRes
              : [];
        }

        let filteredUsers = users;
        const shouldFilterByClient =
          Boolean(clientIdLower) &&
          (isDitbinmasRole
            ? ditbinmasScope !== "all"
            : !isDirectorate || isScopedDirectorateClient);
        if (shouldFilterByClient) {
          const normalizeValue = (value) =>
            String(value || "").trim().toLowerCase();
          filteredUsers = users.filter((u) => {
            const userClient = normalizeValue(
              u.client_id || u.clientId || u.client || u.clientID || "",
            );
            return userClient === clientIdLower;
          });

        }

        const clientIdsForNames = Array.from(
          new Set(
            [
              ...filteredUsers
                .map((u) =>
                  String(
                    u.client_id || u.clientId || u.client || u.clientID || "",
                  ),
                )
                .filter(Boolean),
              taskClientId,
            ].filter(Boolean),
          ),
        );

        let nameMap = {};
        if (clientIdsForNames.length > 0) {
          nameMap = await getClientNames(
            token,
            clientIdsForNames,
            controller.signal,
          );
        }

        const defaultDisplayName =
          profileData?.client_name ||
          profileData?.clientName ||
          profileData?.name ||
          taskClientId;
        const directorateDisplayName =
          nameMap[taskClientId] || defaultDisplayName || taskClientId;
        setDirectorateReportInfo({
          shortName: taskClientId || defaultDisplayName || "Ditbinmas",
          officialName: directorateDisplayName,
        });
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

        const sortedUsers = prioritizeUsersForClient(
          [...enrichedUsers].sort(compareUsersByPangkatAndNrp),
          normalizedClientId,
        );

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

        if (controller.signal.aborted) {
          return;
        }

        setRekapSummary({
          totalUser,
          totalSudahKomentar,
          totalBelumKomentar,
          totalTiktokPost,
        });
        setChartData(sortedUsers);
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
  }, [
    viewBy,
    normalizedCustomDate,
    normalizedRangeStart,
    normalizedRangeEnd,
    ditbinmasScope,
  ]);

  const selectorDateValue =
    viewBy === "custom_range"
      ? dateRange
      : viewBy === "month"
        ? monthlyDate
        : dailyDate;

  const handleDitbinmasScopeChange = (event) => {
    const { value } = event.target || {};
    if (value === "client" || value === "all") {
      setDitbinmasScope(value);
    }
  };

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 text-slate-700">
        <div className="pointer-events-none absolute inset-x-0 -top-16 h-72 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_65%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.2),_transparent_70%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(45,212,191,0.18)_0%,_transparent_75%)]" />
        <div className="relative rounded-3xl border border-red-300/60 bg-white/95 px-8 py-6 text-center text-red-600 shadow-[0_20px_46px_rgba(129,140,248,0.2)] backdrop-blur">
          {error}
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-violet-50 text-blue-950">
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-72 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.25),_transparent_65%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-80 bg-[radial-gradient(circle_at_bottom,_rgba(129,140,248,0.2),_transparent_70%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(45,212,191,0.18)_0%,_transparent_75%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-12 md:px-10">
        <div className="flex flex-col gap-10">
          <div className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 p-6 shadow-[0_24px_60px_rgba(59,130,246,0.15)] backdrop-blur">
            <div className="pointer-events-none absolute -top-16 left-0 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 right-8 h-48 w-48 rounded-full bg-emerald-200/45 blur-3xl" />
            <div className="pointer-events-none absolute inset-x-12 top-0 h-1 rounded-full bg-gradient-to-r from-blue-200/70 via-indigo-200/60 to-violet-200/70" />
            <div className="pointer-events-none absolute inset-y-6 left-0 w-1 rounded-full bg-gradient-to-b from-blue-200/60 via-transparent to-emerald-200/50" />
            <div className="relative flex flex-col gap-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-blue-900">
                    Rekapitulasi Komentar TikTok
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-blue-700/80">
                    Lihat rekap detail keterlibatan komentar TikTok dari seluruh personel.
                    Pantau kepatuhan dan tindak lanjuti satker yang belum aktif berinteraksi.
                  </p>
                </div>
                <Link
                  href="/comments/tiktok"
                  className="inline-flex items-center gap-2 rounded-2xl border border-blue-200/80 bg-white px-4 py-2 text-sm font-semibold text-blue-900 shadow-[0_12px_32px_rgba(129,140,248,0.18)] transition hover:border-violet-200 hover:bg-blue-50 hover:shadow-[0_18px_46px_rgba(129,140,248,0.28)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200/70"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Kembali
                </Link>
              </div>
              <div className="rounded-2xl border border-blue-100/80 bg-white/90 p-4 shadow-inner backdrop-blur">
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <ViewDataSelector
                    value={viewBy}
                    onChange={handleViewChange}
                    options={viewOptions}
                    date={selectorDateValue}
                    onDateChange={handleDateChange}
                  />
                  {isDitbinmasUser && (
                    <div className="flex w-full flex-col gap-2 md:w-64">
                      <label className="text-sm font-semibold text-blue-900">
                        Lingkup Data
                      </label>
                      <select
                        value={ditbinmasScope}
                        onChange={handleDitbinmasScopeChange}
                        className="w-full rounded-xl border border-blue-200/70 bg-white/90 px-3 py-2 text-sm text-slate-700 shadow-inner outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-200/60 hover:border-violet-200"
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

          <RekapKomentarTiktok
            users={chartData}
            totalTiktokPost={rekapSummary.totalTiktokPost}
            showCopyButton={false}
            reportContext={{
              periodeLabel: reportPeriodeLabel,
              viewLabel:
                viewOptions.find((option) => option.value === viewBy)?.label,
              directorateName: directorateReportInfo.shortName,
              directorateOfficialName: directorateReportInfo.officialName,
            }}
          />
        </div>
      </div>
    </div>
  );
}
