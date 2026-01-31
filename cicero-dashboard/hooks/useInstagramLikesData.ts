"use client";
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getRekapLikesIG,
  getClientProfile,
  getUserDirectory,
} from "@/utils/api";
import { fetchDitbinmasAbsensiLikes } from "@/utils/absensiLikes";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { prioritizeUsersForClient } from "@/utils/userOrdering";
import useAuth from "@/hooks/useAuth";
import { getEngagementStatus } from "@/utils/engagementStatus";
import {
  getUserDirectoryFetchScope,
  normalizeDirectoryRole,
} from "@/utils/userDirectoryScope";

const USER_IDENTIFIER_FIELDS = [
  "nrp",
  "nip",
  "nrp_nip",
  "nrpNip",
  "user_id",
  "userId",
  "userID",
  "NRP",
  "NIP",
  "NRP_NIP",
];
const REKAP_TOTAL_POST_FIELDS = [
  "totalPosts",
  "totalIGPost",
  "total_ig_post",
];

function normalizeString(value?: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function normalizeNumber(value?: unknown): number | undefined {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

function extractRekapUsers(payload: any): any[] {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload)) return payload;
  return [];
}

function extractRekapClients(payload: any): any[] {
  if (Array.isArray(payload?.clients)) return payload.clients;
  if (Array.isArray(payload?.directory)) return payload.directory;
  if (Array.isArray(payload?.client_directory)) return payload.client_directory;
  if (Array.isArray(payload?.clientDirectory)) return payload.clientDirectory;
  if (Array.isArray(payload?.meta?.clients)) return payload.meta.clients;
  if (Array.isArray(payload?.metadata?.clients)) return payload.metadata.clients;
  if (Array.isArray(payload?.summary?.clients)) return payload.summary.clients;
  return [];
}

function buildClientNameMap(
  clients: any[],
  users: any[],
): Record<string, string> {
  const entries = new Map<string, string>();
  clients.forEach((entry) => {
    const id = String(
      entry?.client_id ||
        entry?.clientId ||
        entry?.clientID ||
        entry?.client ||
        entry?.id ||
        "",
    );
    if (!id) return;
    const name =
      entry?.nama_client ||
      entry?.client_name ||
      entry?.client ||
      entry?.nama ||
      entry?.name;
    if (name) entries.set(id, name);
  });
  users.forEach((entry) => {
    const id = String(
      entry?.client_id ||
        entry?.clientId ||
        entry?.clientID ||
        entry?.client ||
        "",
    );
    if (!id || entries.has(id)) return;
    const name =
      entry?.nama_client ||
      entry?.client_name ||
      entry?.client ||
      entry?.nama ||
      entry?.name;
    if (name) entries.set(id, name);
  });
  return Object.fromEntries(entries);
}

function getTotalPostsFromRekap(payload: any, posts: any[]): number | undefined {
  const summary = payload?.summary ?? {};
  const summaryValue = REKAP_TOTAL_POST_FIELDS.reduce((acc, key) => {
    if (acc !== undefined) return acc;
    return normalizeNumber(summary?.[key]);
  }, undefined as number | undefined);
  const rootValue = REKAP_TOTAL_POST_FIELDS.reduce((acc, key) => {
    if (acc !== undefined) return acc;
    return normalizeNumber(payload?.[key]);
  }, undefined as number | undefined);
  if (summaryValue !== undefined) return summaryValue;
  if (rootValue !== undefined) return rootValue;
  return Array.isArray(posts) ? posts.length : undefined;
}

function normalizeRolePayload(value?: unknown): string | undefined {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || undefined;
}

function normalizeScopePayload(value?: unknown): string | undefined {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized || undefined;
}

function getUserIdentifier(user: any): string {
  return USER_IDENTIFIER_FIELDS.reduce((acc, field) => {
    if (acc) return acc;
    const value = normalizeString(user?.[field]);
    return value || acc;
  }, "");
}

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
    regionalId: authRegionalId,
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
  const [isDirectorateData, setIsDirectorateData] = useState(false);
  const [isDirectorateLayout, setIsDirectorateLayout] = useState(false);
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
    const role = effectiveRole ?? authRole ?? fallbackRole;
    const requestRole = normalizeRolePayload(role);
    const requestScopeFromAuth = normalizeScopePayload(effectiveClientType);
    const requestRoleForContext =
      requestScopeFromAuth === "DIREKTORAT"
        ? normalizeRolePayload(effectiveRole ?? authRole ?? role)
        : requestRole;
    const normalizedRegionalIdFromAuth = authRegionalId
      ? String(authRegionalId)
      : undefined;
    const profileRequestContext = {
      role: requestRole,
      scope: requestScopeFromAuth,
      regional_id: normalizedRegionalIdFromAuth,
    };
    if (!token || !userClientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return () => controller.abort();
    }

    const roleLower = String(effectiveRole ?? role ?? "").toLowerCase();
    const normalizedEffectiveRoleLower = String(
      effectiveRole ?? role ?? "",
    )
      .trim()
      .toLowerCase();
    const normalizedDirectoryRole = normalizeDirectoryRole(
      requestRoleForContext ?? effectiveRole ?? role ?? "",
    );
    const directoryScope = getUserDirectoryFetchScope({
      role: normalizedDirectoryRole || undefined,
      effectiveClientType: effectiveClientType ?? undefined,
    });
    const normalizedEffectiveRoleUpper = normalizedEffectiveRoleLower.toUpperCase();
    const isOperatorRole = normalizedEffectiveRoleLower === "operator";
    const isDirectorateRoleValue = normalizedEffectiveRoleUpper === "DIREKTORAT";
    const isDitbinmasRole = normalizedEffectiveRoleLower === "ditbinmas";
    const isOrgScope = requestScopeFromAuth === "ORG";
    const isDirectorateScope = requestScopeFromAuth === "DIREKTORAT";
    const derivedDirectorateRole =
      !isOperatorRole &&
      !isOrgScope &&
      (isDirectorateRoleValue || isDitbinmasRole);
    setIsDirectorateRole(derivedDirectorateRole || isDirectorateRoleValue);
    const normalizedClientId = String(userClientId || "").trim();
    const normalizedClientIdUpper = normalizedClientId.toUpperCase();
    const isDitbinmasClient = normalizedClientIdUpper === "DITBINMAS";
    const isDitSamaptaBidhumas =
      normalizedClientIdUpper === "DITSAMAPTA" && roleLower === "bidhumas";
    const ditbinmasClientId = isDitSamaptaBidhumas
      ? "BIDHUMAS"
      : "DITBINMAS";
    const directorateScopedClient =
      !isOperatorRole && isDirectorateRoleValue && !isDitbinmasClient;
    setIsDirectorateScopedClient(directorateScopedClient);
    const shouldUseDirectorateFetcher =
      !isOperatorRole &&
      (derivedDirectorateRole || (isDitSamaptaBidhumas && !isOrgScope));
    const shouldMapToDitbinmas =
      !isOperatorRole &&
      (isDitbinmasRole ||
        (isDitSamaptaBidhumas && !isDirectorateScope));
    const dashboardClientId = shouldMapToDitbinmas
      ? ditbinmasClientId
      : userClientId;
    const normalizedLoginClientId = String(userClientId || "")
      .trim()
      .toLowerCase();

    const allowedScopeClients = new Set([
      "DITBINMAS",
      "DITSAMAPTA",
      "DITLANTAS",
      "BIDHUMAS",
    ]);

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
          const requestContext = {
            role: requestRoleForContext,
            scope: requestScopeFromAuth,
            ...(normalizedRegionalIdFromAuth
              ? { regional_id: normalizedRegionalIdFromAuth }
              : {}),
          };
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
              requestContext,
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
          setIsDirectorateData(true);
          setIsDirectorateLayout(true);
          setIsDirectorateRole(true);
          setCanSelectScope(
            !isOrgClient && allowedScopeClients.has(normalizedClientIdUpper),
          );
          return;
        }

        let totalIGPostFromStats: number | undefined;
        let postsFromRekap: any[] = [];

        const client_id = shouldMapToDitbinmas ? ditbinmasClientId : userClientId;

        const profileClientId = client_id;
        const profileRes = await getClientProfile(
          token,
          profileClientId,
          controller.signal,
          profileRequestContext,
        );
        const profile = profileRes.client || profileRes.profile || profileRes || {};
        const resolvedRegionalId =
          normalizedRegionalIdFromAuth ??
          profile?.regional_id ??
          profile?.regionalId ??
          profile?.regionalID ??
          profile?.regional;
        const normalizedRegionalId = resolvedRegionalId
          ? String(resolvedRegionalId)
          : undefined;
        const normalizedEffectiveClientType = String(
          effectiveClientType ??
            profile.client_type ??
            profile.clientType ??
            profile.client_type_code ??
            profile.clientTypeName ??
            "",
        ).toUpperCase();
        const requestScope =
          normalizeScopePayload(normalizedEffectiveClientType) ??
          requestScopeFromAuth;
        const isOrg = normalizedEffectiveClientType === "ORG";
        const dir = normalizedEffectiveClientType === "DIREKTORAT";
        const directorateData =
          isDitSamaptaBidhumas ||
          (!isOrg && (dir || (!isOperatorRole && derivedDirectorateRole)));
        const shouldUseDirectorateLayout =
          normalizedEffectiveRoleLower === "operator" &&
          normalizedEffectiveClientType === "ORG";
        const directorateLayout = directorateData || shouldUseDirectorateLayout;
        if (controller.signal.aborted) return;
        setIsDirectorateData(directorateData);
        setIsDirectorateLayout(directorateLayout);
        setIsOrgClient(isOrg);
        setClientName(
          profile.nama ||
            profile.nama_client ||
            profile.client_name ||
            profile.client ||
            "",
        );
        setCanSelectScope(
          !isOperatorRole &&
            directorateData &&
            !isOrg &&
            allowedScopeClients.has(normalizedClientIdUpper),
        );

        const hasDifferentRoleClient =
          !isOperatorRole &&
          directorateData &&
          normalizedEffectiveRoleUpper !== normalizedClientIdUpper;
        setIsDirectorateScopedClient(hasDifferentRoleClient);
        setIsDirectorateRole(
          !isOperatorRole && (directorateData || isDirectorateRoleValue),
        );

        const requestContext = {
          role: requestRoleForContext,
          scope: requestScope,
          ...(normalizedRegionalId ? { regional_id: normalizedRegionalId } : {}),
        };
        let users: any[] = [];
        let rekapMeta: {
          totalIGPost?: number;
          totalUser?: number;
          totalSudahLike?: number;
          totalKurangLike?: number;
          totalBelumLike?: number;
          totalTanpaUsername?: number;
        } = {};
        if (directorateData) {
          const rekapRes = await getRekapLikesIG(
            token,
            client_id,
            periode,
            date,
            startDate,
            endDate,
            controller.signal,
            requestContext,
          );
          users = extractRekapUsers(rekapRes);
          const rekapClients = extractRekapClients(rekapRes);
          const directoryNameMap = buildClientNameMap(rekapClients, users);
          const posts =
            rekapRes?.posts ||
            rekapRes?.ig_posts ||
            rekapRes?.igPosts ||
            rekapRes?.instagram_posts ||
            [];
          postsFromRekap = Array.isArray(posts) ? posts : [];
          setIgPosts(postsFromRekap);
          rekapMeta = {
            totalIGPost: getTotalPostsFromRekap(rekapRes, postsFromRekap),
            totalUser:
              normalizeNumber(
                rekapRes?.usersCount ??
                  rekapRes?.summary?.totalUsers ??
                  rekapRes?.summary?.totalUser ??
                  rekapRes?.summary?.total_users,
              ) ?? undefined,
            totalSudahLike: normalizeNumber(
              rekapRes?.sudahUsersCount ??
                rekapRes?.summary?.totalSudahLike ??
                rekapRes?.summary?.total_sudah_like ??
                rekapRes?.summary?.total_sudah,
            ),
            totalKurangLike: normalizeNumber(
              rekapRes?.kurangUsersCount ??
                rekapRes?.summary?.totalKurangLike ??
                rekapRes?.summary?.total_kurang_like ??
                rekapRes?.summary?.total_kurang,
            ),
            totalBelumLike: normalizeNumber(
              rekapRes?.belumUsersCount ??
                rekapRes?.summary?.totalBelumLike ??
                rekapRes?.summary?.total_belum_like ??
                rekapRes?.summary?.total_belum,
            ),
            totalTanpaUsername: normalizeNumber(
              rekapRes?.noUsernameUsersCount ??
                rekapRes?.summary?.totalTanpaUsername ??
                rekapRes?.summary?.total_tanpa_username ??
                rekapRes?.summary?.total_tanpa,
            ),
          };
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
          users = users.map((u: any) => {
            const key = String(
              u.client_id || u.clientId || u.clientID || u.client || "",
            );
            const mappedName = directoryNameMap[key];
            return mappedName
              ? {
                  ...u,
                  nama_client: mappedName,
                  client_name: mappedName,
                }
              : u;
          });
        } else {
          const statsData = await getDashboardStats(
            token,
            periode,
            date,
            startDate,
            endDate,
            dashboardClientId,
            {
              role: requestRoleForContext,
              scope: requestScopeFromAuth,
              regional_id: normalizedRegionalIdFromAuth,
            },
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
          totalIGPostFromStats =
            Number((statsData as any).instagramPosts) || 0;
          const rekapRes = await getRekapLikesIG(
            token,
            client_id,
            periode,
            date,
            startDate,
            endDate,
            controller.signal,
            requestContext,
          );
          users = extractRekapUsers(rekapRes);
          rekapMeta = {
            totalIGPost:
              normalizeNumber(
                rekapRes?.totalPosts ??
                  rekapRes?.summary?.totalPosts ??
                  rekapRes?.summary?.totalIGPost ??
                  rekapRes?.summary?.total_ig_post,
              ) ?? undefined,
            totalUser:
              normalizeNumber(
                rekapRes?.usersCount ??
                  rekapRes?.summary?.totalUsers ??
                  rekapRes?.summary?.totalUser ??
                  rekapRes?.summary?.total_users,
              ) ?? undefined,
            totalSudahLike: normalizeNumber(
              rekapRes?.sudahUsersCount ??
                rekapRes?.summary?.totalSudahLike ??
                rekapRes?.summary?.total_sudah_like ??
                rekapRes?.summary?.total_sudah,
            ),
            totalKurangLike: normalizeNumber(
              rekapRes?.kurangUsersCount ??
                rekapRes?.summary?.totalKurangLike ??
                rekapRes?.summary?.total_kurang_like ??
                rekapRes?.summary?.total_kurang,
            ),
            totalBelumLike: normalizeNumber(
              rekapRes?.belumUsersCount ??
                rekapRes?.summary?.totalBelumLike ??
                rekapRes?.summary?.total_belum_like ??
                rekapRes?.summary?.total_belum,
            ),
            totalTanpaUsername: normalizeNumber(
              rekapRes?.noUsernameUsersCount ??
                rekapRes?.summary?.totalTanpaUsername ??
                rekapRes?.summary?.total_tanpa_username ??
                rekapRes?.summary?.total_tanpa,
            ),
          };
        }

        let filteredUsers = users;
        if (!dir && !directorateData) {
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

        if (
          isOperatorRole &&
          normalizedLoginClientId &&
          normalizedEffectiveClientType !== "ORG"
        ) {
          const normalizeRole = (value: unknown) =>
            String(value || "").trim().toLowerCase();
          const normalizeClientId = (value: unknown) =>
            String(value || "").trim().toLowerCase();
          const hasRoleField = filteredUsers.some((u: any) =>
            Boolean(
              normalizeRole(
                u.role || u.user_role || u.userRole || u.roleName || "",
              ),
            ),
          );

          if (hasRoleField) {
            filteredUsers = filteredUsers.filter((u: any) => {
              const roleValue = normalizeRole(
                u.role || u.user_role || u.userRole || u.roleName || "",
              );
              if (roleValue !== "operator") return false;
              const userClientId = normalizeClientId(
                u.client_id ?? u.clientId ?? u.clientID ?? u.client ?? "",
              );
              return userClientId === normalizedLoginClientId;
            });
          } else {
            const directoryRes = await getUserDirectory(
              token,
              userClientId,
              {
                role: normalizedDirectoryRole || undefined,
                scope: directoryScope,
                regional_id: normalizedRegionalId,
              },
              controller.signal,
            );
            const dirData =
              directoryRes.data || directoryRes.users || directoryRes || [];
            const operatorIds = new Set(
              (dirData as any[])
                .filter((u: any) => {
                  const roleValue = normalizeRole(
                    u.role || u.user_role || u.userRole || u.roleName || "",
                  );
                  if (roleValue !== "operator") return false;
                  const userClientId = normalizeClientId(
                    u.client_id ?? u.clientId ?? u.clientID ?? u.client ?? "",
                  );
                  return userClientId === normalizedLoginClientId;
                })
                .map((u: any) => getUserIdentifier(u))
                .filter(Boolean),
            );
            if (operatorIds.size > 0) {
              filteredUsers = filteredUsers.filter((u: any) => {
                const userClientId = normalizeClientId(
                  u.client_id ?? u.clientId ?? u.clientID ?? u.client ?? "",
                );
                if (userClientId && userClientId !== normalizedLoginClientId) {
                  return false;
                }
                const identifier = getUserIdentifier(u);
                return identifier ? operatorIds.has(identifier) : false;
              });
            }
          }
        }

        const sortedUsers = prioritizeUsersForClient(
          [...filteredUsers].sort(compareUsersByPangkatAndNrp),
          client_id,
        );
        const totalIGPost =
          normalizeNumber(rekapMeta.totalIGPost) ??
          (directorateData
            ? postsFromRekap.length
            : totalIGPostFromStats ?? 0);
        const computedTotals = {
          totalUser: sortedUsers.length,
          totalSudahLike: 0,
          totalKurangLike: 0,
          totalBelumLike: 0,
          totalTanpaUsername: 0,
        };
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
          const status = getEngagementStatus({
            completed: jumlah,
            totalTarget: totalIGPost,
          });
          if (status === "sudah") totalSudahLike += 1;
          else if (status === "kurang") totalKurangLike += 1;
          else totalBelumLike += 1;
        });
        computedTotals.totalSudahLike = totalSudahLike;
        computedTotals.totalKurangLike = totalKurangLike;
        computedTotals.totalBelumLike = totalBelumLike;
        computedTotals.totalTanpaUsername = totalTanpaUsername;

        if (controller.signal.aborted) return;
        setRekapSummary({
          totalUser: rekapMeta.totalUser ?? computedTotals.totalUser,
          totalSudahLike:
            rekapMeta.totalSudahLike ?? computedTotals.totalSudahLike,
          totalKurangLike:
            rekapMeta.totalKurangLike ?? computedTotals.totalKurangLike,
          totalBelumLike:
            rekapMeta.totalBelumLike ?? computedTotals.totalBelumLike,
          totalTanpaUsername:
            rekapMeta.totalTanpaUsername ??
            computedTotals.totalTanpaUsername,
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
    isDirectorateData,
    isDirectorateLayout,
    isOrgClient,
    isDirectorateScopedClient,
    isDirectorateRole,
    clientName,
    canSelectScope,
    loading,
    error,
  };
}
