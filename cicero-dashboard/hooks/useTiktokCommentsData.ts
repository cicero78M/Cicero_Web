"use client";
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientProfile,
  getClientNames,
  getUserDirectory,
} from "@/utils/api";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";

interface Options {
  viewBy: string;
  customDate: string;
  fromDate: string;
  toDate: string;
}

interface RekapSummary {
  totalUser: number;
  totalSudahKomentar: number;
  totalKurangKomentar: number;
  totalBelumKomentar: number;
  totalTanpaUsername: number;
  totalTiktokPost: number;
}

export default function useTiktokCommentsData({
  viewBy,
  customDate,
  fromDate,
  toDate,
}: Options) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [rekapSummary, setRekapSummary] = useState<RekapSummary>({
    totalUser: 0,
    totalSudahKomentar: 0,
    totalKurangKomentar: 0,
    totalBelumKomentar: 0,
    totalTanpaUsername: 0,
    totalTiktokPost: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDirectorate, setIsDirectorate] = useState(false);
  const [clientName, setClientName] = useState("");
  const [isDitbinmasScopedClient, setIsDitbinmasScopedClient] =
    useState(false);
  const [isDitbinmasRole, setIsDitbinmasRole] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("cicero_token") ?? ""
        : "";
    const userClientId =
      typeof window !== "undefined"
        ? localStorage.getItem("client_id") ?? ""
        : "";
    const role =
      typeof window !== "undefined"
        ? localStorage.getItem("user_role") ?? ""
        : "";

    if (!token || !userClientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return () => controller.abort();
    }

    const roleLower = String(role).trim().toLowerCase();
    const isDitbinmasRoleValue = roleLower === "ditbinmas";
    setIsDitbinmasRole(isDitbinmasRoleValue);
    const normalizedClientId = String(userClientId || "").trim();
    const normalizedClientIdUpper = normalizedClientId.toUpperCase();
    const normalizedClientIdLower = normalizedClientId.toLowerCase();
    const isDitbinmasClient = normalizedClientIdUpper === "DITBINMAS";
    const isScopedDirectorateClient = isDitbinmasRoleValue && !isDitbinmasClient;
    setIsDitbinmasScopedClient(isScopedDirectorateClient);
    const dashboardClientId = isDitbinmasRoleValue
      ? "DITBINMAS"
      : userClientId;

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

        const statsData = await getDashboardStats(
          token,
          periode,
          date,
          startDate,
          endDate,
          dashboardClientId,
          controller.signal,
        );

        const profile = await getClientProfile(
          token,
          userClientId,
          controller.signal,
        );

        const directorate =
          isDitbinmasRoleValue ||
          String(profile.client_type || "").toUpperCase() === "DIREKTORAT";
        if (controller.signal.aborted) return;
        setIsDirectorate(directorate);
        setClientName(
          profile.nama ||
            profile.nama_client ||
            profile.client_name ||
            profile.client ||
            "",
        );

        let users: any[] = [];
        if (directorate) {
          const directoryRes = await getUserDirectory(
            token,
            userClientId,
            controller.signal,
          );
          const dirData =
            directoryRes.data || directoryRes.users || directoryRes || [];
          let clientIds: string[] = [];
          const expectedRole = String(userClientId).toLowerCase();
          clientIds = Array.from(
            new Set(
              (dirData as any[])
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
                .filter(Boolean) as string[],
            ),
          ) as string[];

          const fallbackClientId = userClientId;
          if (!clientIds.includes(String(fallbackClientId))) {
            clientIds.push(String(fallbackClientId));
          }

          const rekapAll = await Promise.all(
            clientIds.map((cid: string) =>
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

          users = rekapAll.flatMap((res: any) =>
            Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res)
              ? res
              : [],
          );

          if (users.length) {
            const nameMap = await getClientNames(
              token,
              users.map((u: any) =>
                String(
                  u.client_id ||
                    u.clientId ||
                    u.clientID ||
                    u.client ||
                    "",
                ),
              ),
              controller.signal,
            );
            users = users.map((u: any) => {
              const key = String(
                u.client_id || u.clientId || u.clientID || u.client || "",
              );
              const mappedName = nameMap[key];
              return mappedName
                ? {
                    ...u,
                    nama_client: mappedName,
                    client_name: mappedName,
                  }
                : u;
            });
          }
        } else {
          const rekapRes = await getRekapKomentarTiktok(
            token,
            userClientId,
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
        const normalizeValue = (value: unknown) =>
          String(value || "").trim().toLowerCase();
        const hasClientIdentifiers = users.some((u: any) =>
          Boolean(
            normalizeValue(
              u.client_id || u.clientId || u.clientID || u.client || "",
            ),
          ),
        );
        const shouldFilterByClient =
          Boolean(normalizedClientIdLower) &&
          hasClientIdentifiers &&
          (isDitbinmasRoleValue || !directorate || isScopedDirectorateClient);
        if (shouldFilterByClient) {
          filteredUsers = users.filter((u: any) => {
            const userClient = normalizeValue(
              u.client_id || u.clientId || u.clientID || u.client || "",
            );
            return userClient === normalizedClientIdLower;
          });
        }

        const totalUser = filteredUsers.length;
        const totalTiktokPostRaw =
          (statsData as any)?.ttPosts ??
          (statsData as any)?.tiktokPosts ??
          (statsData as any)?.totalTiktokPost ??
          (statsData as any)?.totalTiktokPosts ??
          (statsData as any)?.tt_posts ??
          (statsData as any)?.tiktok_posts ??
          0;
        const totalTiktokPost = Number(totalTiktokPostRaw) || 0;
        const isZeroPost = totalTiktokPost === 0;
        let totalSudahKomentar = 0;
        let totalKurangKomentar = 0;
        let totalBelumKomentar = 0;
        let totalTanpaUsername = 0;

        filteredUsers.forEach((u: any) => {
          const username = String(u.username || "").trim();
          if (!username) {
            totalTanpaUsername += 1;
            return;
          }
          const jumlah = Number(u.jumlah_komentar) || 0;
          if (isZeroPost) {
            totalBelumKomentar += 1;
            return;
          }
          if (jumlah >= totalTiktokPost * 0.5) {
            totalSudahKomentar += 1;
          } else if (jumlah > 0) {
            totalKurangKomentar += 1;
          } else {
            totalBelumKomentar += 1;
          }
        });

        if (controller.signal.aborted) return;
        setRekapSummary({
          totalUser,
          totalSudahKomentar,
          totalKurangKomentar,
          totalBelumKomentar,
          totalTanpaUsername,
          totalTiktokPost,
        });
        setChartData(filteredUsers);
      } catch (err: any) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError("Gagal mengambil data: " + (err?.message || err));
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => controller.abort();
  }, [viewBy, customDate, fromDate, toDate]);

  return {
    chartData,
    rekapSummary,
    isDirectorate,
    clientName,
    isDitbinmasRole,
    isDitbinmasScopedClient,
    loading,
    error,
  };
}
