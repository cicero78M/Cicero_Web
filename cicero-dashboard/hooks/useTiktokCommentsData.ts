"use client";
import { useContext, useEffect, useMemo, useState } from "react";
import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientProfile,
  getClientNames,
  getUserDirectory,
} from "@/utils/api";
import { getPeriodeDateForView } from "@/components/ViewDataSelector";
import { AuthContext } from "@/context/AuthContext";
import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";
import { prioritizeUsersForClient } from "@/utils/userOrdering";
import { getEngagementStatus } from "@/utils/engagementStatus";

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

function normalizeString(value?: unknown): string {
  return String(value || "").trim().toLowerCase();
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
    const effectiveClientTypeFromAuth = auth?.effectiveClientType;

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
    const isDitbinmasRoleFromAuth =
      normalizedEffectiveRoleFromAuth === "ditbinmas";
    const derivedDirectorateRoleFromAuth =
      !isOperatorRole &&
      ((directorateRoles.has(normalizedEffectiveRoleFromAuth) &&
        (normalizedEffectiveClientTypeFromAuth !== "ORG" ||
          isDitbinmasRoleFromAuth)) ||
        normalizedEffectiveClientTypeFromAuth === "DIREKTORAT") &&
      normalizedEffectiveRoleFromAuth !== "";
    const isDirectorateClientTypeFromAuth =
      normalizedEffectiveClientTypeFromAuth === "DIREKTORAT";
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
          controller.signal,
        );

        const statsPayload = (statsData as any)?.data || statsData;
        const profile = await getClientProfile(
          token,
          dashboardClientId,
          controller.signal,
        );
        const profileData =
          (profile as any)?.client || (profile as any)?.profile || profile || {};
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
        // Per 2024-09, beberapa role direktorat dikonversi menjadi ORG pada
        // `effectiveClientType` (mis. DITSAMAPTA/BIDHUMAS). Gunakan daftar
        // role direktorat yang diketahui agar jalur pengambilan data
        // direktorat tetap dipakai walaupun normalizedEffectiveClientType
        // sudah menjadi ORG.
        const isDitbinmasRole = normalizedEffectiveRole === "ditbinmas";
        const derivedDirectorateRole =
          !isOperatorRole &&
          ((directorateRoles.has(normalizedEffectiveRole) &&
            (normalizedEffectiveClientType !== "ORG" || isDitbinmasRole)) ||
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
        const directorate =
          !isOperatorRole && (derivedDirectorateRole || isDirectorateClientType);
        const orgClient = normalizedEffectiveClientType === "ORG";
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
        const allowedScopeClients = new Set([
          "DITBINMAS",
          "DITSAMAPTA",
          "DITLANTAS",
          "BIDHUMAS",
        ]);
        setCanSelectScope(
          !isOperatorRole &&
            directorate &&
            !orgClient &&
            allowedScopeClients.has(normalizedClientIdUpper),
        );

        let users: any[] = [];
        if (directorate) {
          const directoryClientId = isDirectorateClientType
            ? normalizedClientId
            : effectiveDirectorateClientId;
          const directoryRes = await getUserDirectory(
            token,
            directoryClientId,
            controller.signal,
          );
          const dirData =
            directoryRes.data || directoryRes.users || directoryRes || [];
          let clientIds: string[] = [];
          const expectedRole = normalizedEffectiveRole || normalizedClientIdLower;
          const normalizeClientId = (value: unknown) =>
            String(value || "").trim().toLowerCase();
          if (isDirectorateClientType) {
            const lockToClient = scope !== "all" && Boolean(normalizedClientId);
            const scopedClientId = lockToClient
              ? normalizeClientId(normalizedClientId)
              : "";
            clientIds = Array.from(
              new Set(
                (dirData as any[])
                  .filter((u: any) => {
                    if (!lockToClient) return true;
                    return (
                      scopedClientId ===
                      normalizeClientId(
                        u.client_id ||
                          u.clientId ||
                          u.clientID ||
                          u.client ||
                          "",
                      )
                    );
                  })
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
          } else {
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
          }

          const fallbackClientId = directoryClientId;
          [fallbackClientId, effectiveDirectorateClientId].forEach((cid) => {
            const normalizedCid = String(cid || "");
            if (normalizedCid && !clientIds.includes(normalizedCid)) {
              clientIds.push(normalizedCid);
            }
          });

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
        const shouldFilterByClient =
          scope !== "all" && Boolean(normalizedClientIdLower);
        if (shouldFilterByClient) {
          filteredUsers = users.filter((u: any) => {
            const userClient = normalizeString(
              u.client_id || u.clientId || u.clientID || u.client || "",
            );
            return userClient === normalizedClientIdLower;
          });
        }

        const uniqueUsers = deduplicateUsers(filteredUsers);

        const sortedUsers = prioritizeUsersForClient(
          [...uniqueUsers].sort(compareUsersByPangkatAndNrp),
          normalizedLoginClientId || normalizedClientIdLower,
        );
        const totalUser = sortedUsers.length;
        const totalTiktokPostRaw =
          (statsData as any)?.ttPosts ??
          (statsData as any)?.tiktokPosts ??
          (statsData as any)?.totalTiktokPost ??
          (statsData as any)?.totalTiktokPosts ??
          (statsData as any)?.tt_posts ??
          (statsData as any)?.tiktok_posts ??
          0;
        const totalTiktokPost = Number(totalTiktokPostRaw) || 0;
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
        setRekapSummary({
          totalUser,
          totalSudahKomentar,
          totalKurangKomentar,
          totalBelumKomentar,
          totalTanpaUsername,
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
    auth?.token,
    auth?.clientId,
    auth?.effectiveRole,
    auth?.role,
    auth?.effectiveClientType,
    scope,
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
