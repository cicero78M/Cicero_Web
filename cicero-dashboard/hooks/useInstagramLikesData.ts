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

type DitbinmasScope = "all" | "self";

interface Options {
  viewBy: string;
  customDate: string;
  fromDate: string;
  toDate: string;
  ditbinmasScope?: DitbinmasScope;
}

function normalizeClientId(value: any) {
  return String(value || "").toUpperCase();
}

function normalizeUsers(value: any): any[] {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  const maybeArray = Object.values(value);
  return Array.isArray(maybeArray) ? maybeArray : [];
}

function calculateSummary(users: any[], totalIGPost: number): RekapSummary {
  const normalizedUsers = Array.isArray(users) ? users : [];
  const normalizedTotal = Number(totalIGPost) || 0;
  const isZeroPost = normalizedTotal === 0;
  let totalSudahLike = 0;
  let totalKurangLike = 0;
  let totalBelumLike = 0;
  let totalTanpaUsername = 0;

  normalizedUsers.forEach((u: any) => {
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
    if (jumlah >= normalizedTotal * 0.5) {
      totalSudahLike += 1;
    } else if (jumlah > 0) {
      totalKurangLike += 1;
    } else {
      totalBelumLike += 1;
    }
  });

  return {
    totalUser: normalizedUsers.length,
    totalSudahLike,
    totalKurangLike,
    totalBelumLike,
    totalTanpaUsername,
    totalIGPost: normalizedTotal,
  };
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
  ditbinmasScope,
}: Options) {
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
  const [clientName, setClientName] = useState("");

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

    const isDitbinmasRole = String(role).toLowerCase() === "ditbinmas";
    const normalizedClientId = normalizeClientId(userClientId);
    const isDitbinmasClient = normalizedClientId === "DITBINMAS";
    const taskClientId = isDitbinmasRole && isDitbinmasClient
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
        if (isDitbinmasRole && isDitbinmasClient) {
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
            );
          if (controller.signal.aborted) return;
          const normalizedUsers = normalizeUsers(users);
          const filteredUsers =
            ditbinmasScope === "self"
              ? normalizedUsers.filter((u: any) =>
                  normalizeClientId(
                    u.client_id ||
                      u.clientId ||
                      u.clientID ||
                      u.client ||
                      "",
                  ) === normalizedClientId,
                )
              : normalizedUsers;
          const totalIGPost =
            Number(summary?.totalIGPost ?? 0) ||
            (Array.isArray(posts) ? posts.length : 0);
          const computedSummary = calculateSummary(
            filteredUsers,
            totalIGPost,
          );
          setChartData(filteredUsers);
          setRekapSummary(computedSummary);
          setIgPosts(Array.isArray(posts) ? posts : []);
          setClientName(clientName || "");
          setIsDirectorate(ditbinmasScope !== "self");
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
        const posts = Array.isArray((statsData as any).ig_posts)
          ? (statsData as any).ig_posts
          : Array.isArray((statsData as any).igPosts)
          ? (statsData as any).igPosts
          : Array.isArray((statsData as any).instagram_posts)
          ? (statsData as any).instagram_posts
          : [];
        setIgPosts(posts);

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
                .filter(Boolean) as string[],
            ),
          ) as string[];
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

        const normalizedUsers = normalizeUsers(users);
        const totalIGPost = Number((statsData as any).instagramPosts) || 0;
        if (controller.signal.aborted) return;
        const computedSummary = calculateSummary(normalizedUsers, totalIGPost);
        setRekapSummary(computedSummary);
        setChartData(normalizedUsers);
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
  }, [viewBy, customDate, fromDate, toDate, ditbinmasScope]);

  return {
    chartData,
    igPosts,
    rekapSummary,
    isDirectorate,
    clientName,
    loading,
    error,
  };
}
