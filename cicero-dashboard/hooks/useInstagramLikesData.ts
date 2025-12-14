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
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { prioritizeUsersForClient } from "@/utils/userOrdering";
import useAuth from "@/hooks/useAuth";

interface Options {
  viewBy: string;
  customDate: string;
  fromDate: string;
  toDate: string;
  scope?: "client" | "all";
}

interface RekapSummary {
  totalUser: number;
  totalSudahLike: number;
  totalKurangLike: number;
  totalBelumLike: number;
  totalTanpaUsername: number;
  totalIGPost: number;
}

export default function useInstagramLikesData({
  viewBy,
  customDate,
  fromDate,
  toDate,
  scope = "client",
}: Options) {
  const {
    token: authToken,
    clientId: authClientId,
    role: authRole,
    effectiveRole,
    effectiveClientType,
  } = useAuth();
  const [chartData, setChartData] = useState<any[]>([]);
  const [igPosts, setIgPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rekapSummary, setRekapSummary] = useState<RekapSummary>({
    totalUser: 0,
    totalSudahLike: 0,
    totalKurangLike: 0,
    totalBelumLike: 0,
    totalTanpaUsername: 0,
    totalIGPost: 0,
  });
  const [isDirectorate, setIsDirectorate] = useState(false);
  const [isOrgClient, setIsOrgClient] = useState(false);
  const [clientName, setClientName] = useState("");
  const [isDirectorateScopedClient, setIsDirectorateScopedClient] =
    useState(false);
  const [isDirectorateRole, setIsDirectorateRole] = useState(false);
  const [canSelectScope, setCanSelectScope] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const fallbackToken =
      typeof window !== "undefined"
        ? localStorage.getItem("cicero_token") ?? ""
        : "";
    const fallbackClientId =
      typeof window !== "undefined"
        ? localStorage.getItem("client_id") ?? ""
        : "";
    const fallbackRole =
      typeof window !== "undefined"
        ? localStorage.getItem("user_role") ?? ""
        : "";
    const token = authToken ?? fallbackToken;
    const userClientId = authClientId ?? fallbackClientId;
    const role = authRole ?? fallbackRole;
    if (!token || !userClientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return () => controller.abort();
    }

    const roleLower = String(effectiveRole ?? role ?? "").toLowerCase();
    const normalizedEffectiveRoleUpper = String(
      effectiveRole ?? role ?? "",
    )
      .trim()
      .toUpperCase();
    const isDirectorateRoleValue = normalizedEffectiveRoleUpper === "DIREKTORAT";
    setIsDirectorateRole(isDirectorateRoleValue);
    const normalizedClientId = String(userClientId || "").trim();
    const normalizedClientIdUpper = normalizedClientId.toUpperCase();
    const isDitbinmasClient = normalizedClientIdUpper === "DITBINMAS";
    const isDitSamaptaBidhumas =
      normalizedClientIdUpper === "DITSAMAPTA" && roleLower === "bidhumas";
    const ditbinmasClientId = isDitSamaptaBidhumas
      ? "BIDHUMAS"
      : "DITBINMAS";
    const directorateScopedClient =
      isDirectorateRoleValue && !isDitbinmasClient;
    setIsDirectorateScopedClient(directorateScopedClient);
    const shouldUseDirectorateFetcher =
      isDirectorateRoleValue || isDitSamaptaBidhumas;
    const dashboardClientId = isDirectorateRoleValue
      ? ditbinmasClientId
      : userClientId;
    const normalizedLoginClientId = String(userClientId || "")
      .trim()
      .toLowerCase();

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
        if (shouldUseDirectorateFetcher) {
          const { users, summary, posts, clientName } =
            await fetchDitbinmasAbsensiLikes(
              token,
              {
                periode,
                date,
                startDate,
                endDate,
              },
              controller.signal,
              userClientId,
              scope,
              ditbinmasClientId,
            );
          if (controller.signal.aborted) return;
          const sortedUsers = prioritizeUsersForClient(
            [...users].sort(compareUsersByPangkatAndNrp),
            userClientId,
          );
          setChartData(sortedUsers);
          setRekapSummary(summary);
          setIgPosts(posts || []);
          setClientName(clientName || "");
          setIsDirectorate(true);
          return;
        }

        const statsData = await getDashboardStats(
          token,
          periode,
          date,
          startDate,
          endDate,
          dashboardClientId,
          controller.signal,
        );
        const posts = Array.isArray((statsData as any).ig_posts)
          ? (statsData as any).ig_posts
          : Array.isArray((statsData as any).igPosts)
          ? (statsData as any).igPosts
          : Array.isArray((statsData as any).instagram_posts)
          ? (statsData as any).instagram_posts
          : [];
        setIgPosts(posts);

        const client_id = userClientId;

        const profileClientId = client_id;
        const profileRes = await getClientProfile(
          token,
          profileClientId,
          controller.signal,
        );
        const profile = profileRes.client || profileRes.profile || profileRes || {};
        const normalizedEffectiveClientType = String(
          effectiveClientType ??
            profile.client_type ??
            profile.clientType ??
            profile.client_type_code ??
            profile.clientTypeName ??
            "",
        ).toUpperCase();
        const dir = normalizedEffectiveClientType === "DIREKTORAT";
        const isOrg = normalizedEffectiveClientType === "ORG";
        if (controller.signal.aborted) return;
        setIsDirectorate(dir);
        setIsOrgClient(isOrg);
        setClientName(
          profile.nama ||
            profile.nama_client ||
            profile.client_name ||
            profile.client ||
            "",
        );
        const allowedScopeClients = new Set([
          "DITBINMAS",
          "DITSAMAPTA",
          "DITLANTAS",
          "BIDHUMAS",
        ]);
        setCanSelectScope(
          dir && !isOrg && allowedScopeClients.has(normalizedClientIdUpper),
        );

        const hasDifferentRoleClient =
          dir && normalizedEffectiveRoleUpper !== normalizedClientIdUpper;
        setIsDirectorateScopedClient(hasDifferentRoleClient);
        setIsDirectorateRole(dir || isDirectorateRoleValue);

        let users: any[] = [];
        if (dir) {
          const directoryClientId = client_id;
          const directoryRes = await getUserDirectory(
            token,
            directoryClientId,
            controller.signal,
          );
          const dirData =
            directoryRes.data || directoryRes.users || directoryRes || [];
          let clientIds: string[] = [];

          const expectedRole = String(directoryClientId).toLowerCase();
          clientIds = Array.from(
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
                .filter(Boolean) as string[],
            ),
          ) as string[];

          const fallbackClientId = directoryClientId;
          if (!clientIds.includes(String(fallbackClientId))) {
            clientIds.push(String(fallbackClientId));
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
          if (scope === "client" && normalizedLoginClientId) {
            const normalizeValue = (value: unknown) =>
              String(value || "")
                .trim()
                .toLowerCase();
            users = users.filter((u: any) => {
              const userClientId = normalizeValue(
                u.client_id || u.clientId || u.clientID || u.client || "",
              );
              return userClientId === normalizedLoginClientId;
            });
          }
          const nameMap = await getClientNames(
            token,
            users.map((u: any) =>
              String(u.client_id || u.clientId || u.clientID || u.client || ""),
            ),
            controller.signal,
          );
          users = users.map((u: any) => ({
            ...u,
            nama_client:
              nameMap[
                String(
                  u.client_id ||
                    u.clientId ||
                    u.clientID ||
                    u.client ||
                    "",
                )
              ] || u.nama_client,
          }));
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

        let filteredUsers = users;
        if (!dir) {
          const normalizedClientId = String(client_id || "")
            .trim()
            .toLowerCase();
          if (normalizedClientId) {
            const normalizeValue = (value: unknown) =>
              String(value || "")
                .trim()
                .toLowerCase();
            filteredUsers = users.filter((u: any) => {
              const userClientId = normalizeValue(
                u.client_id ??
                  u.clientId ??
                  u.clientID ??
                  u.client ??
                  "",
              );
              return userClientId === normalizedClientId;
            });
          }
        }

        const sortedUsers = prioritizeUsersForClient(
          [...filteredUsers].sort(compareUsersByPangkatAndNrp),
          client_id,
        );
        const totalUser = sortedUsers.length;
        const totalIGPost = Number((statsData as any).instagramPosts) || 0;
        const isZeroPost = (totalIGPost || 0) === 0;
        let totalSudahLike = 0;
        let totalKurangLike = 0;
        let totalBelumLike = 0;
        let totalTanpaUsername = 0;
        sortedUsers.forEach((u: any) => {
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
          if (jumlah >= totalIGPost) {
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
        setChartData(sortedUsers);
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
  }, [
    viewBy,
    customDate,
    fromDate,
    toDate,
    scope,
    authToken,
    authClientId,
    authRole,
    effectiveRole,
    effectiveClientType,
  ]);

  return {
    chartData,
    igPosts,
    rekapSummary,
    isDirectorate,
    isOrgClient,
    isDirectorateScopedClient,
    isDirectorateRole,
    clientName,
    canSelectScope,
    loading,
    error,
  };
}
