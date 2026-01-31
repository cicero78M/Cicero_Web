"use client";
import { useEffect, useState } from "react";
import { getRekapLikesIG } from "@/utils/api";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { prioritizeUsersForClient } from "@/utils/userOrdering";
import useAuth from "@/hooks/useAuth";
const REKAP_TOTAL_POST_FIELDS = [
  "totalPosts",
  "totalIGPost",
  "total_ig_post",
];

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

function applyUsernameFallback(users: any[]): any[] {
  return users.map((user) => {
    if (!user || typeof user !== "object") return user;
    const existingUsername = String(user.username || "").trim();
    if (existingUsername) return user;
    const fallbackUsername =
      user.ig_username ||
      user.igUsername ||
      user.instagram_username ||
      user.instagramUsername ||
      user.user_ig ||
      user.userIg ||
      "";
    const normalizedFallback = String(fallbackUsername || "").trim();
    if (!normalizedFallback) return user;
    return { ...user, username: normalizedFallback };
  });
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

function extractRekapPosts(payload: any): any[] {
  const posts =
    payload?.posts ||
    payload?.ig_posts ||
    payload?.igPosts ||
    payload?.instagram_posts ||
    [];
  return Array.isArray(posts) ? posts : [];
}

function extractRekapClientName(payload: any, clientId?: string): string {
  const directName =
    payload?.client_name ||
    payload?.clientName ||
    payload?.nama_client ||
    payload?.client ||
    payload?.name ||
    payload?.meta?.client_name ||
    payload?.meta?.clientName ||
    payload?.meta?.nama_client ||
    payload?.metadata?.client_name ||
    payload?.metadata?.clientName ||
    payload?.metadata?.nama_client;
  if (directName) return String(directName);
  if (!clientId) return "";
  const clients = extractRekapClients(payload);
  const match = clients.find((entry: any) => {
    const id = String(
      entry?.client_id ||
        entry?.clientId ||
        entry?.clientID ||
        entry?.client ||
        entry?.id ||
        "",
    ).trim();
    return id && id.toLowerCase() === String(clientId).trim().toLowerCase();
  });
  return (
    match?.nama_client ||
    match?.client_name ||
    match?.client ||
    match?.nama ||
    match?.name ||
    ""
  );
}

function extractRekapScope(payload: any): string | undefined {
  return normalizeScopePayload(
    payload?.scope ||
      payload?.meta?.scope ||
      payload?.meta?.client_type ||
      payload?.meta?.clientType ||
      payload?.metadata?.scope ||
      payload?.metadata?.client_type ||
      payload?.metadata?.clientType ||
      payload?.summary?.scope ||
      payload?.summary?.client_type ||
      payload?.summary?.clientType,
  );
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
    isProfileLoading,
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
    const profileLoading = Boolean(isProfileLoading);
    if (profileLoading && (!effectiveClientType || !authRegionalId)) {
      setLoading(true);
      return () => controller.abort();
    }
    const requestRole = normalizeRolePayload(role);
    const requestScopeFromAuth = normalizeScopePayload(effectiveClientType);
    const requestRoleForContext =
      requestScopeFromAuth === "DIREKTORAT"
        ? normalizeRolePayload(effectiveRole ?? authRole ?? role)
        : requestRole;
    const normalizedRegionalIdFromAuth = authRegionalId
      ? String(authRegionalId)
      : undefined;
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
    const normalizedEffectiveRoleUpper = normalizedEffectiveRoleLower.toUpperCase();
    const isOperatorRole = normalizedEffectiveRoleLower === "operator";
    const isDirectorateRoleValue = normalizedEffectiveRoleUpper === "DIREKTORAT";
    const isDitbinmasRole = normalizedEffectiveRoleLower === "ditbinmas";
    const normalizedEffectiveClientType = String(effectiveClientType || "")
      .trim()
      .toUpperCase();
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
    const shouldMapToDitbinmas =
      !isOperatorRole &&
      (isDitbinmasRole ||
        (isDitSamaptaBidhumas && !isDirectorateScope));
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
        let postsFromRekap: any[] = [];

        const client_id = shouldMapToDitbinmas ? ditbinmasClientId : userClientId;
        const requestContext = {
          role: requestRoleForContext,
          scope: requestScopeFromAuth,
          ...(normalizedRegionalIdFromAuth
            ? { regional_id: normalizedRegionalIdFromAuth }
            : {}),
        };
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
        let users = applyUsernameFallback(extractRekapUsers(rekapRes));
        const rekapClients = extractRekapClients(rekapRes);
        const directoryNameMap = buildClientNameMap(rekapClients, users);
        postsFromRekap = extractRekapPosts(rekapRes);
        setIgPosts(postsFromRekap);

        const resolvedScope = requestScopeFromAuth ?? extractRekapScope(rekapRes);
        const isOrg = resolvedScope === "ORG";
        const dir = resolvedScope === "DIREKTORAT";
        const directorateData =
          !isOrg &&
          (dir ||
            derivedDirectorateRole ||
            isDitSamaptaBidhumas ||
            isDirectorateRoleValue);
        const shouldUseDirectorateLayout =
          normalizedEffectiveRoleLower === "operator" && isOrg;
        const directorateLayout = directorateData || shouldUseDirectorateLayout;

        const resolvedClientName = extractRekapClientName(rekapRes, client_id);
        const isDirectorateScopedValue =
          !isOperatorRole &&
          directorateData &&
          normalizedEffectiveRoleUpper !== normalizedClientIdUpper;

        if (controller.signal.aborted) return;
        setIsDirectorateData(directorateData);
        setIsDirectorateLayout(directorateLayout);
        setIsOrgClient(isOrg);
        setClientName(resolvedClientName || "Unknown Client");
        setCanSelectScope(
          !isOperatorRole &&
            directorateData &&
            !isOrg &&
            allowedScopeClients.has(normalizedClientIdUpper),
        );
        setIsDirectorateScopedClient(isDirectorateScopedValue);
        setIsDirectorateRole(
          !isOperatorRole && (directorateData || isDirectorateRoleValue),
        );

        let rekapMeta: {
          totalIGPost?: number;
          totalUser?: number;
          totalSudahLike?: number;
          totalKurangLike?: number;
          totalBelumLike?: number;
          totalTanpaUsername?: number;
        } = {
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

        if (directorateData) {
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
          }
        }

        const normalizedUsers = applyUsernameFallback(filteredUsers);
        const sortedUsers = prioritizeUsersForClient(
          [...normalizedUsers].sort(compareUsersByPangkatAndNrp),
          client_id,
        );
        const totalIGPost =
          normalizeNumber(rekapMeta.totalIGPost) ?? postsFromRekap.length;

        if (controller.signal.aborted) return;
        setRekapSummary({
          totalUser: rekapMeta.totalUser ?? 0,
          totalSudahLike: rekapMeta.totalSudahLike ?? 0,
          totalKurangLike: rekapMeta.totalKurangLike ?? 0,
          totalBelumLike: rekapMeta.totalBelumLike ?? 0,
          totalTanpaUsername: rekapMeta.totalTanpaUsername ?? 0,
          totalIGPost,
        });
        const chartPayload = Array.isArray(rekapRes?.chartData)
          ? applyUsernameFallback(rekapRes.chartData)
          : applyUsernameFallback(sortedUsers);
        setChartData(chartPayload);
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
    authRegionalId,
    isProfileLoading,
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
