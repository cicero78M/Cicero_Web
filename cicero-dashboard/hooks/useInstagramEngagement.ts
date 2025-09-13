"use client";
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getRekapLikesIG,
  getClientProfile,
  getClientNames,
  getUserDirectory,
} from "@/utils/api";
import { fetchDitbinmasAbsensiLikes } from "@/utils/absensiLikes";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";

interface RekapSummary {
  totalUser: number;
  totalSudahLike: number;
  totalKurangLike: number;
  totalBelumLike: number;
  totalTanpaUsername: number;
  totalIGPost: number;
}

export default function useInstagramEngagement() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [rekapSummary, setRekapSummary] = useState<RekapSummary>({
    totalUser: 0,
    totalSudahLike: 0,
    totalKurangLike: 0,
    totalBelumLike: 0,
    totalTanpaUsername: 0,
    totalIGPost: 0,
  });
  const [isDirectorate, setIsDirectorate] = useState(false);
  const [clientName, setClientName] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const userClientId =
      typeof window !== "undefined" ? localStorage.getItem("client_id") : null;
    const role =
      typeof window !== "undefined" ? localStorage.getItem("user_role") : null;
    if (!token || !userClientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return () => controller.abort();
    }

    const isDitbinmas = String(role).toLowerCase() === "ditbinmas";
    const taskClientId = isDitbinmas ? "DITBINMAS" : userClientId;

    async function fetchData() {
      try {
        const selectedDate =
          viewBy === "custom_range"
            ? { startDate: fromDate, endDate: toDate }
            : customDate;
        const { periode, date, startDate, endDate } = getPeriodeDateForView(
          viewBy,
          selectedDate,
        );
        if (isDitbinmas) {
          const { users, summary } = await fetchDitbinmasAbsensiLikes(
            token,
            {
              periode,
              date,
              startDate,
              endDate,
            },
            controller.signal,
          );
          if (controller.signal.aborted) return;
          setRekapSummary(summary);
          setChartData(users);
          setIsDirectorate(true);
          return;
        }

        const statsData = await getDashboardStats(
          token,
          periode,
          date,
          startDate,
          endDate,
          taskClientId,
          controller.signal,
        );

        const client_id = userClientId;

        const profileRes = await getClientProfile(
          token,
          client_id,
          controller.signal,
        );
        const profile = profileRes.client || profileRes.profile || profileRes || {};
        const dir = (profile.client_type || "").toUpperCase() === "DIREKTORAT";
        if (controller.signal.aborted) return;
        setIsDirectorate(dir);
        setClientName(
          profile.nama ||
            profile.nama_client ||
            profile.client_name ||
            profile.client ||
            "",
        );

        let users: any[] = [];
        if (dir) {
          const directoryRes = await getUserDirectory(
            token,
            client_id,
            controller.signal,
          );
          const dirData =
            directoryRes.data || directoryRes.users || directoryRes || [];
          const expectedRole = String(client_id).toLowerCase();
          const clientIds = Array.from(
            new Set(
              dirData
                .filter(
                  (u: any) =>
                    String(
                      u.role ||
                        u.user_role ||
                        u.userRole ||
                        u.roleName ||
                        "",
                    ).toLowerCase() === expectedRole,
                )
                .map((u: any) =>
                  String(
                    u.client_id ||
                      u.clientId ||
                      u.clientID ||
                      u.client ||
                      "",
                  ),
                )
                .filter(Boolean),
            ),
          );
          if (!clientIds.includes(String(client_id))) {
            clientIds.push(String(client_id));
          }
          const rekapAll = await Promise.all(
            clientIds.map((cid: string) =>
              getRekapLikesIG(
                token,
                cid,
                periode,
                date,
                startDate,
                endDate,
                controller.signal,
              ).catch(() => ({
                data: [],
              })),
            ),
          );
          users = rekapAll.flatMap((res: any) =>
            Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res)
              ? res
              : [],
          );
        } else {
          const rekapRes = await getRekapLikesIG(
            token,
            client_id,
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

        let enrichedUsers = users;
        if (dir) {
          const nameMap = await getClientNames(
            token,
            users.map((u: any) =>
              String(u.client_id || u.clientId || u.clientID || u.client || ""),
            ),
            controller.signal,
          );
          enrichedUsers = users.map((u: any) => {
            const clientName =
              nameMap[
                String(
                  u.client_id || u.clientId || u.clientID || u.client || "",
                )
              ] ||
              u.nama_client ||
              u.client_name ||
              u.client;
            return {
              ...u,
              nama_client: clientName,
              client_name: clientName,
            };
          });
        }

        const totalUser = enrichedUsers.length;
        const totalIGPost = Number(statsData.instagramPosts) || 0;
        const isZeroPost = (totalIGPost || 0) === 0;
        let totalSudahLike = 0;
        let totalKurangLike = 0;
        let totalBelumLike = 0;
        let totalTanpaUsername = 0;
        enrichedUsers.forEach((u: any) => {
          const username = String(u.username || "").trim();
          if (!username) {
            totalTanpaUsername += 1;
            return;
          }
          const jumlah = Number(u.jumlah_like) || 0;
          if (isZeroPost) {
            totalBelumLike += 1;
            return;
          }
          if (jumlah >= totalIGPost * 0.5) {
            totalSudahLike += 1;
          } else if (jumlah > 0) {
            totalKurangLike += 1;
          } else {
            totalBelumLike += 1;
          }
        });

        if (controller.signal.aborted) return;
        setRekapSummary({
          totalUser,
          totalSudahLike,
          totalKurangLike,
          totalBelumLike,
          totalTanpaUsername,
          totalIGPost,
        });
        setChartData(enrichedUsers);
      } catch (err: any) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError("Gagal mengambil data: " + (err.message || err));
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchData();

    return () => controller.abort();
  }, [viewBy, customDate, fromDate, toDate]);

  return {
    chartData,
    loading,
    error,
    viewBy,
    setViewBy,
    customDate,
    setCustomDate,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    rekapSummary,
    isDirectorate,
    clientName,
  };
}
