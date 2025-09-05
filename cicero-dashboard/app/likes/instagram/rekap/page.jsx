"use client";
import { useEffect, useState, useRef } from "react";
import {
  getDashboardStats,
  getRekapLikesIG,
  getClientProfile,
  getClientNames,
  getUserDirectory,
} from "@/utils/api";
import { fetchDitbinmasAbsensiLikes } from "@/utils/absensiLikes";
import Loader from "@/components/Loader";
import RekapLikesIG from "@/components/RekapLikesIG";
import Link from "next/link";
import useRequireAuth from "@/hooks/useRequireAuth";
import ViewDataSelector, {
  getPeriodeDateForView,
  VIEW_OPTIONS,
} from "@/components/ViewDataSelector";
import { ArrowLeft } from "lucide-react";

export default function RekapLikesIGPage() {
  useRequireAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [rekapSummary, setRekapSummary] = useState({
    totalUser: 0,
    totalSudahLike: 0,
    totalKurangLike: 0,
    totalBelumLike: 0,
    totalTanpaUsername: 0,
    totalIGPost: 0,
  });

  const [igPosts, setIgPosts] = useState([]);
  const [clientName, setClientName] = useState("");
  const rekapRef = useRef(null);

  const viewOptions = VIEW_OPTIONS;


  useEffect(() => {
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
    if (!token || !userClientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    const isDitbinmas = String(role).toLowerCase() === "ditbinmas";
    const taskClientId = isDitbinmas ? "DITBINMAS" : userClientId;

    async function fetchData() {
      try {
        const selectedDate =
          viewBy === "custom_range"
            ? { startDate: fromDate, endDate: toDate }
            : customDate;
        const { periode, date, startDate, endDate } =
          getPeriodeDateForView(viewBy, selectedDate);
        if (isDitbinmas) {
          const { users, summary, posts, clientName } =
            await fetchDitbinmasAbsensiLikes(token, {
              periode,
              date,
              startDate,
              endDate,
            });
          setRekapSummary(summary);
          setChartData(users);
          setIgPosts(posts);
          setClientName(clientName);
          return;
        }

        const statsData = await getDashboardStats(
          token,
          periode,
          date,
          startDate,
          endDate,
          taskClientId,
        );
        const posts = Array.isArray(statsData.ig_posts)
          ? statsData.ig_posts
          : Array.isArray(statsData.igPosts)
          ? statsData.igPosts
          : Array.isArray(statsData.instagram_posts)
          ? statsData.instagram_posts
          : [];
        setIgPosts(posts);
        const client_id = userClientId;

        const profileRes = await getClientProfile(token, client_id);
        const profile =
          profileRes.client || profileRes.profile || profileRes || {};
        const dir =
          (profile.client_type || "").toUpperCase() === "DIREKTORAT";
        setClientName(
          profile.nama ||
            profile.nama_client ||
            profile.client_name ||
            profile.client ||
            "",
        );

        let users = [];
        if (dir) {
          const directoryRes = await getUserDirectory(token, client_id);
          const dirData =
            directoryRes.data || directoryRes.users || directoryRes || [];
          const expectedRole = String(client_id).toLowerCase();
          const clientIds = Array.from(
            new Set(
              dirData
                .filter(
                  (u) =>
                    String(
                      u.role ||
                        u.user_role ||
                        u.userRole ||
                        u.roleName ||
                        "",
                    ).toLowerCase() === expectedRole,
                )
                .map((u) =>
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
            clientIds.map((cid) =>
              getRekapLikesIG(
                token,
                cid,
                periode,
                date,
                startDate,
                endDate,
              ).catch(() => ({ data: [] })),
            ),
          );
          users = rekapAll.flatMap((res) =>
            Array.isArray(res?.data)
              ? res.data
              : Array.isArray(res)
              ? res
              : [],
          );
          const nameMap = await getClientNames(
            token,
            users.map((u) =>
              String(
                u.client_id || u.clientId || u.clientID || u.client || "",
              ),
            ),
          );
          users = users.map((u) => ({
            ...u,
            nama_client:
              nameMap[
                String(
                  u.client_id || u.clientId || u.clientID || u.client || "",
                )
              ] ||
              u.nama_client ||
              u.client_name ||
              u.client,
          }));
        } else {
          const rekapRes = await getRekapLikesIG(
            token,
            client_id,
            periode,
            date,
            startDate,
            endDate,
          );
          users = Array.isArray(rekapRes?.data)
            ? rekapRes.data
            : Array.isArray(rekapRes)
            ? rekapRes
            : [];
        }

        // Hitung jumlah IG post dari stats dan klasifikasi user
        const totalIGPost = Number(statsData.instagramPosts) || 0;
        const isZeroPost = (totalIGPost || 0) === 0;
        const totalUser = users.length;
        let totalSudahLike = 0;
        let totalKurangLike = 0;
        let totalBelumLike = 0;
        let totalTanpaUsername = 0;
        users.forEach((u) => {
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

        setRekapSummary({
          totalUser,
          totalSudahLike,
          totalKurangLike,
          totalBelumLike,
          totalTanpaUsername,
          totalIGPost,
        });
        setChartData(users);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [viewBy, customDate, fromDate, toDate]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700">
              Rekapitulasi Likes Instagram
            </h1>
            <Link
              href="/likes/instagram"
              className="inline-block bg-gray-100 hover:bg-blue-50 text-blue-700 border border-blue-300 font-semibold px-4 py-2 rounded-lg transition-all duration-150 shadow flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 mb-2">
            <button
              onClick={() => rekapRef.current?.copyRekap()}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
            >
              Rekap Likes
            </button>
            <ViewDataSelector
              value={viewBy}
              onChange={setViewBy}
              options={viewOptions}
              date=
                {viewBy === "custom_range"
                  ? { startDate: fromDate, endDate: toDate }
                  : customDate}
              onDateChange={(val) => {
                if (viewBy === "custom_range") {
                  setFromDate(val.startDate || "");
                  setToDate(val.endDate || "");
                } else {
                  setCustomDate(val);
                }
              }}
            />
          </div>

          {/* Kirim data dari fetch ke komponen rekap likes */}
            <RekapLikesIG
              ref={rekapRef}
              users={chartData}
              totalIGPost={rekapSummary.totalIGPost}
              posts={igPosts}
              showRekapButton
              clientName={clientName}
            />
          </div>
        </div>
      </div>
    );
  }
