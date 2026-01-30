"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientProfile,
  getUserDirectory,
} from "@/utils/api";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";
import { AuthContext } from "@/context/AuthContext";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { prioritizeUsersForClient } from "@/utils/userOrdering";
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
const COMMENT_METRIC_FIELDS = [
  "comments",
  "comment_count",
  "jumlah_komentar",
  "missingComments",
];
const SUMMARY_COUNT_FIELDS = {
  sudah: ["sudahUsersCount", "sudah_users_count"],
  kurang: ["kurangUsersCount", "kurang_users_count"],
  belum: ["belumUsersCount", "belum_users_count"],
  tanpaUsername: [
    "noUsernameUsersCount",
    "no_username_users_count",
    "tanpaUsernameUsersCount",
    "tanpa_username_users_count",
  ],
  totalPosts: [
    "totalPosts",
    "total_posts",
    "totalPost",
    "total_post",
    "total_tiktok_post",
    "total_tiktok_posts",
    "totalTiktokPost",
    "totalTiktokPosts",
  ],
} as const;

function normalizeString(value?: unknown): string {
  return String(value || "").trim().toLowerCase();
}

function normalizeRolePayload(value?: unknown): string | undefined {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized || undefined;
}

function normalizeScopePayload(value?: unknown): string | undefined {
  const normalized = String(value || "").trim().toUpperCase();
  return normalized || undefined;
}

function parseSummaryMetric(
  summary: Record<string, any>,
  keys: readonly string[],
): number | undefined {
  for (const key of keys) {
    if (summary?.[key] === undefined || summary?.[key] === null) continue;
    const value = Number(summary[key]);
    if (Number.isFinite(value)) return value;
  }
  return undefined;
}

function parseSummaryMetrics(summary: Record<string, any>) {
  const sudah = parseSummaryMetric(summary, SUMMARY_COUNT_FIELDS.sudah);
  const kurang = parseSummaryMetric(summary, SUMMARY_COUNT_FIELDS.kurang);
  const belum = parseSummaryMetric(summary, SUMMARY_COUNT_FIELDS.belum);
  const tanpaUsername = parseSummaryMetric(
    summary,
    SUMMARY_COUNT_FIELDS.tanpaUsername,
  );
  const totalPosts = parseSummaryMetric(summary, SUMMARY_COUNT_FIELDS.totalPosts);
  const values = [sudah, kurang, belum, tanpaUsername, totalPosts];
  const isComplete = values.every(
    (value) => Number.isFinite(value) && (value as number) >= 0,
  );
  const totalUser = isComplete
    ? (sudah as number) +
      (kurang as number) +
      (belum as number) +
      (tanpaUsername as number)
    : undefined;

  return {
    sudah,
    kurang,
    belum,
    tanpaUsername,
    totalPosts,
    totalUser,
    isComplete,
  };
}

function getUserIdentifier(user: any): string {
  return USER_IDENTIFIER_FIELDS.reduce((acc, field) => {
    if (acc) return acc;
    const value = normalizeString(user?.[field]);
    return value || acc;
  }, "");
}

function getMergeKey(user: any): string {
  const identifier = getUserIdentifier(user);
  const label = normalizeString(user?.label || user?.nama || user?.name);
  const title = normalizeString(user?.title);
  const clientId = normalizeString(
    user?.client_id || user?.clientId || user?.clientID || user?.client,
  );
  const key = [clientId, identifier || label || title].filter(Boolean).join("::");

  return key;
}

function hasCommentMetrics(user: any): boolean {
  return COMMENT_METRIC_FIELDS.some((field) => user?.[field] !== undefined);
}

function arrayHasCommentMetrics(users: any[]): boolean {
  return Array.isArray(users) && users.some((user) => hasCommentMetrics(user));
}

function mergeUsersByKey(
  primary: any[],
  secondary: any[],
  options: { preferPrimary?: boolean } = {},
) {
  const { preferPrimary = true } = options;
  const secondaryMap = new Map<string, any>();
  const seenKeys = new Set<string>();

  secondary.forEach((user) => {
    const key = getMergeKey(user);
    if (key) secondaryMap.set(key, user);
  });

  const merged = primary.map((user) => {
    const key = getMergeKey(user);
    const match = key ? secondaryMap.get(key) : undefined;

    if (!key || !match) return user;
    seenKeys.add(key);
    return preferPrimary ? { ...match, ...user } : { ...user, ...match };
  });

  secondary.forEach((user) => {
    const key = getMergeKey(user);
    if (key && seenKeys.has(key)) return;
    if (!hasCommentMetrics(user)) return;
    merged.push(user);
  });

  return merged;
}

function deduplicateUsers(users: any[]) {
  const seen = new Set<string>();

  return users.filter((user) => {
    const clientId = normalizeString(
      user?.client_id || user?.clientId || user?.clientID || user?.client,
    );
    const identifier = USER_IDENTIFIER_FIELDS.reduce((acc, field) => {
      if (acc) return acc;
      const value = normalizeString(user?.[field]);
      return value || acc;
    }, "");
    const username = normalizeString(user?.username);
    const name = normalizeString(user?.nama || user?.name);
    const key = [clientId, identifier || username || name]
      .filter(Boolean)
      .join("::");

    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeUserRecord(user: any) {
  const jumlahKomentarRaw =
    user?.jumlah_komentar ??
    user?.jumlahKomentar ??
    user?.comments ??
    user?.comment_count ??
    user?.commentCount ??
    user?.total_comments ??
    user?.totalComments ??
    user?.total_comment ??
    user?.totalComment ??
    0;
  const normalizedUsername =
    user?.username ??
    user?.tiktok_username ??
    user?.tiktokUsername ??
    user?.user_name ??
    user?.userName ??
    user?.handle ??
    user?.user_handle ??
    "";
  const rawName = user?.nama ?? user?.name ?? user?.full_name ?? user?.fullName;
  const rawLabel = user?.label ?? user?.Label;
  const normalizedName = String(rawName ?? "").trim() || String(rawLabel ?? "").trim();
  const normalizedTitle = user?.title ?? user?.pangkat ?? user?.rank ?? "";
  const normalizedDivisi = user?.divisi ?? user?.satfung ?? user?.unit ?? user?.division ?? "";
  const normalizedClientId =
    user?.client_id ?? user?.clientId ?? user?.clientID ?? user?.client ?? "";

  return {
    ...user,
    client_id: normalizedClientId || user?.client_id,
    nama: normalizedName || user?.nama,
    title: normalizedTitle || user?.title,
    divisi: normalizedDivisi || user?.divisi,
    username: String(normalizedUsername || user?.username || "").trim(),
    jumlah_komentar: Number(jumlahKomentarRaw) || 0,
  };
}

function extractRekapPayload(payload: any) {
  if (!payload) {
    return { users: [], summary: {} as Record<string, any> };
  }
  if (Array.isArray(payload)) {
    return { users: payload, summary: {} as Record<string, any> };
  }

  const data = Array.isArray(payload.data)
    ? payload.data
    : Array.isArray(payload.users)
      ? payload.users
      : [];
  const chartData = Array.isArray(payload.chartData) ? payload.chartData : [];
  const chartHasComments = arrayHasCommentMetrics(chartData);
  const dataHasComments = arrayHasCommentMetrics(data);

  let users: any[] = [];

  if (chartHasComments) {
    users =
      data.length > 0
        ? mergeUsersByKey(chartData, data, { preferPrimary: true })
        : chartData;
  } else if (dataHasComments) {
    users = data;
  } else if (chartData.length > 0) {
    users = chartData;
  }

  const summary = payload.summary ?? payload.rekapSummary ?? payload.resume ?? {};
  return { users, summary };
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
  totalSudahKomentar: number;
  totalKurangKomentar: number;
  totalBelumKomentar: number;
  totalTanpaUsername: number;
  totalTiktokPost: number;
}

/**
 * Ambil data komentar TikTok dengan logika direktorat yang diselaraskan
 * dengan Instagram Engagement Insight (prioritas role dan urutan personel
 * mengikuti pangkat/NRP serta client aktif).
 */
export default function useTiktokCommentsData({
  viewBy,
  customDate,
  fromDate,
  toDate,
  scope = "client",
}: Options) {
  const auth = useContext(AuthContext);
  const normalizedLoginClientId = useMemo(
    () => String(auth?.clientId || "").trim().toLowerCase(),
    [auth?.clientId],
  );
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

    const token =
      auth?.token ??
      (typeof window !== "undefined"
        ? localStorage.getItem("cicero_token") ?? ""
        : "");
    const userClientId =
      auth?.clientId ??
      (typeof window !== "undefined"
        ? localStorage.getItem("client_id") ?? ""
        : "");
    const role =
      auth?.effectiveRole ??
      auth?.role ??
      (typeof window !== "undefined"
        ? localStorage.getItem("user_role") ?? ""
        : "");
    const regionalId = auth?.regionalId ?? null;
    const requestRole = normalizeRolePayload(role);
    const effectiveClientTypeFromAuth = auth?.effectiveClientType ?? undefined;
    const requestScopeFromAuth = normalizeScopePayload(effectiveClientTypeFromAuth);
    const normalizedDirectoryRole = normalizeDirectoryRole(role);
    const directoryScope = getUserDirectoryFetchScope({
      role: normalizedDirectoryRole || undefined,
      effectiveClientType: effectiveClientTypeFromAuth ?? undefined,
    });
    const profileRequestContext = {
      role: requestRole,
      scope: requestScopeFromAuth,
      regional_id: regionalId ? String(regionalId) : undefined,
    };

    if (!token || !userClientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return () => controller.abort();
    }

    const normalizedClientId = String(userClientId || "").trim();
    const normalizedClientIdUpper = normalizedClientId.toUpperCase();
    const normalizedClientIdLower = normalizedClientId.toLowerCase();
    const isDitbinmasClient = normalizedClientIdUpper === "DITBINMAS";
    const normalizedEffectiveRoleFromAuth = String(
      auth?.effectiveRole || role || "",
    )
      .trim()
      .toLowerCase();
    const isOperatorRole = normalizedEffectiveRoleFromAuth === "operator";
    const normalizedEffectiveClientTypeFromAuth = String(
      effectiveClientTypeFromAuth || "",
    )
      .trim()
      .toUpperCase();
    const directorateRoles = new Set([
      "ditbinmas",
      "ditsamapta",
      "ditlantas",
      "bidhumas",
      "direktorat",
    ]);
    const derivedDirectorateRoleFromAuth =
      !isOperatorRole &&
      ((directorateRoles.has(normalizedEffectiveRoleFromAuth) &&
        normalizedEffectiveClientTypeFromAuth !== "ORG") ||
        normalizedEffectiveClientTypeFromAuth === "DIREKTORAT") &&
      normalizedEffectiveRoleFromAuth !== "";
    const isDirectorateClientTypeFromAuth =
      normalizedEffectiveClientTypeFromAuth === "DIREKTORAT";
    const allowedScopeClients = new Set([
      "DITBINMAS",
      "DITSAMAPTA",
      "DITLANTAS",
      "BIDHUMAS",
    ]);
    // Saat role direktorat terdeteksi (termasuk kasus role Ditbinmas yang
    // dinormalisasi menjadi ORG), paksa pengambilan metrik memakai client
    // Ditbinmas agar total postingan/engagement tidak nol pada akun ORG.
    const effectiveDirectorateClientIdFromAuth = derivedDirectorateRoleFromAuth
      ? isDirectorateClientTypeFromAuth
        ? normalizedClientId
        : isDitbinmasClient
          ? normalizedClientId
          : "DITBINMAS"
      : normalizedClientId;
    const dashboardClientId = isOperatorRole
      ? normalizedClientId
      : derivedDirectorateRoleFromAuth
      ? effectiveDirectorateClientIdFromAuth
      : normalizedClientId;

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
          {
            role: requestRole,
            scope: requestScopeFromAuth,
            regional_id: regionalId ? String(regionalId) : undefined,
          },
          controller.signal,
        );

        const statsPayload = (statsData as any)?.data || statsData;
        const profile = await getClientProfile(
          token,
          dashboardClientId,
          controller.signal,
          profileRequestContext,
        );
        const profileData =
          (profile as any)?.client || (profile as any)?.profile || profile || {};
        const resolvedRegionalId =
          regionalId ??
          (profileData as any)?.regional_id ??
          (profileData as any)?.regionalId ??
          (profileData as any)?.regionalID ??
          (profileData as any)?.regional ??
          null;
        const normalizedRegionalId = resolvedRegionalId
          ? String(resolvedRegionalId)
          : undefined;
        const effectiveRoleFromStats =
          (statsPayload as any)?.effectiveRole ||
          (statsPayload as any)?.effective_role ||
          (statsPayload as any)?.roleEffective;
        const effectiveClientTypeFromStats =
          (statsPayload as any)?.effectiveClientType ||
          (statsPayload as any)?.effective_client_type ||
          (statsPayload as any)?.clientTypeEffective;
        // Gunakan nilai effective yang telah dinormalisasi (mis. DITSAMAPTA +
        // BIDHUMAS dipaksa menjadi ORG) agar percabangan direktorat tidak
        // memakai tipe klien mentah dari profil.
        const normalizedEffectiveRole = String(
          auth?.effectiveRole ||
            effectiveRoleFromStats ||
            role ||
            (profileData as any)?.role ||
            (profileData as any)?.user_role ||
            "",
        )
          .trim()
          .toLowerCase();
        const normalizedEffectiveClientType = String(
          effectiveClientTypeFromAuth ||
            effectiveClientTypeFromStats ||
            (profileData as any)?.client_type ||
            (profileData as any)?.clientType ||
            (profileData as any)?.client_type_code ||
            (profileData as any)?.clientTypeName ||
            "",
        )
          .trim()
          .toUpperCase();
        const requestScope = normalizeScopePayload(
          normalizedEffectiveClientType || effectiveClientTypeFromAuth,
        );
        // Per 2024-09, beberapa role direktorat dikonversi menjadi ORG pada
        // `effectiveClientType` (mis. DITSAMAPTA/BIDHUMAS). Gunakan daftar
        // role direktorat yang diketahui agar jalur pengambilan data
        // direktorat tetap dipakai walaupun normalizedEffectiveClientType
        // sudah menjadi ORG.
        const derivedDirectorateRole =
          !isOperatorRole &&
          ((directorateRoles.has(normalizedEffectiveRole) &&
            normalizedEffectiveClientType !== "ORG") ||
            normalizedEffectiveClientType === "DIREKTORAT") &&
          normalizedEffectiveRole !== "";
        const isDirectorateClientType =
          normalizedEffectiveClientType === "DIREKTORAT";
        const isScopedDirectorateClient =
          derivedDirectorateRole && !isDitbinmasClient;
        const effectiveDirectorateClientId = derivedDirectorateRole
          ? isDirectorateClientType
            ? normalizedClientId
            : isDitbinmasClient
              ? normalizedClientId
              : "DITBINMAS"
          : normalizedClientId;
        const orgClient = normalizedEffectiveClientType === "ORG";
        const directorate =
          !isOperatorRole &&
          !orgClient &&
          (derivedDirectorateRole || isDirectorateClientType);
        if (controller.signal.aborted) return;
        setIsDirectorateRole(!isOperatorRole && derivedDirectorateRole);
        setIsDirectorateScopedClient(
          !isOperatorRole && isScopedDirectorateClient,
        );
        setIsDirectorate(directorate);
        setIsOrgClient(orgClient);
        setClientName(
          (profileData as any)?.nama ||
            (profileData as any)?.nama_client ||
            (profileData as any)?.client_name ||
            (profileData as any)?.client ||
            "",
        );
        setCanSelectScope(
          !isOperatorRole &&
            directorate &&
            !orgClient &&
            allowedScopeClients.has(normalizedClientIdUpper),
        );

        let users: any[] = [];
        let rekapSummaryPayload: Record<string, any> = {};
        if (directorate) {
          const rekapRes = await getRekapKomentarTiktok(
            token,
            normalizedClientId,
            periode,
            date,
            startDate,
            endDate,
            controller.signal,
            {
              role: requestRole,
              scope: requestScope,
              regional_id: normalizedRegionalId,
            },
          );
          const { users: payloadUsers, summary } = extractRekapPayload(rekapRes);
          users = payloadUsers;
          rekapSummaryPayload = summary;
        } else {
          const rekapRes = await getRekapKomentarTiktok(
            token,
            userClientId,
            periode,
            date,
            startDate,
            endDate,
            controller.signal,
            {
              role: requestRole,
              scope: requestScope,
              regional_id: normalizedRegionalId,
            },
          );
          const { users: payloadUsers, summary } = extractRekapPayload(rekapRes);
          users = payloadUsers;
          rekapSummaryPayload = summary;
        }

        let filteredUsers = users;
        const shouldFilterByClient = Boolean(normalizedClientIdLower);
        const shouldApplyScopeFilter =
          shouldFilterByClient && (!directorate || scope === "client");
        if (shouldApplyScopeFilter) {
          filteredUsers = users.filter((u: any) => {
            const userClient = normalizeString(
              u.client_id || u.clientId || u.clientID || u.client || "",
            );
            return userClient === normalizedClientIdLower;
          });
        }

        if (isOperatorRole && normalizedClientIdLower) {
          const normalizeRole = (value: unknown) =>
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
              const userClient = normalizeString(
                u.client_id || u.clientId || u.clientID || u.client || "",
              );
              return userClient === normalizedClientIdLower;
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
                  const userClient = normalizeString(
                    u.client_id || u.clientId || u.clientID || u.client || "",
                  );
                  return userClient === normalizedClientIdLower;
                })
                .map((u: any) => getUserIdentifier(u))
                .filter(Boolean),
            );
            filteredUsers = filteredUsers.filter((u: any) => {
              const userClient = normalizeString(
                u.client_id || u.clientId || u.clientID || u.client || "",
              );
              if (userClient && userClient !== normalizedClientIdLower) {
                return false;
              }
              const identifier = getUserIdentifier(u);
              return identifier ? operatorIds.has(identifier) : false;
            });
          }
        }

        const normalizedUsers = filteredUsers.map(normalizeUserRecord);
        const uniqueUsers = deduplicateUsers(normalizedUsers);

        const sortedUsers = prioritizeUsersForClient(
          [...uniqueUsers].sort(compareUsersByPangkatAndNrp),
          normalizedLoginClientId || normalizedClientIdLower,
        );
        const totalUser = sortedUsers.length;
        const summaryMetrics = parseSummaryMetrics(rekapSummaryPayload);
        const totalTiktokPostRaw =
          summaryMetrics.totalPosts !== undefined &&
          summaryMetrics.totalPosts >= 0
            ? summaryMetrics.totalPosts
            : undefined;
        const totalTiktokPostFallback =
          (statsData as any)?.ttPosts ??
          (statsData as any)?.tiktokPosts ??
          (statsData as any)?.totalTiktokPost ??
          (statsData as any)?.totalTiktokPosts ??
          (statsData as any)?.tt_posts ??
          (statsData as any)?.tiktok_posts ??
          0;
        const totalTiktokPost = Number(
          totalTiktokPostRaw ?? totalTiktokPostFallback,
        ) || 0;
        let totalSudahKomentar = 0;
        let totalKurangKomentar = 0;
        let totalBelumKomentar = 0;
        let totalTanpaUsername = 0;

        sortedUsers.forEach((u: any) => {
          const username = String(u.username || "").trim();
          if (!username) {
            totalTanpaUsername += 1;
            return;
          }
          const jumlah = Number(u.jumlah_komentar) || 0;
          const status = getEngagementStatus({
            completed: jumlah,
            totalTarget: totalTiktokPost,
          });

          if (status === "sudah") totalSudahKomentar += 1;
          else if (status === "kurang") totalKurangKomentar += 1;
          else totalBelumKomentar += 1;
        });

        if (controller.signal.aborted) return;
        const canUseSummary =
          summaryMetrics.isComplete &&
          summaryMetrics.totalUser === totalUser &&
          summaryMetrics.totalPosts === totalTiktokPost;
        setRekapSummary({
          totalUser,
          totalSudahKomentar: canUseSummary
            ? summaryMetrics.sudah || 0
            : totalSudahKomentar,
          totalKurangKomentar: canUseSummary
            ? summaryMetrics.kurang || 0
            : totalKurangKomentar,
          totalBelumKomentar: canUseSummary
            ? summaryMetrics.belum || 0
            : totalBelumKomentar,
          totalTanpaUsername: canUseSummary
            ? summaryMetrics.tanpaUsername || 0
            : totalTanpaUsername,
          totalTiktokPost,
        });
        setChartData(sortedUsers);
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
  }, [
    viewBy,
    customDate,
    fromDate,
    toDate,
    scope,
    auth?.token,
    auth?.clientId,
    auth?.effectiveRole,
    auth?.role,
    auth?.effectiveClientType,
  ]);

  return {
    chartData,
    rekapSummary,
    isDirectorate,
    isOrgClient,
    clientName,
    isDirectorateRole,
    isDirectorateScopedClient,
    canSelectScope,
    loading,
    error,
  };
}
