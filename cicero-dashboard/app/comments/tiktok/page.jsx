"use client";
import { useEffect, useState } from "react";
import {
  getDashboardStats,
  getRekapKomentarTiktok,
  getClientProfile,
  getClientNames,
  getUserDirectory,
} from "@/utils/api";
import Loader from "@/components/Loader";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";
import ChartHorizontal from "@/components/ChartHorizontal";
import { groupUsersByKelompok } from "@/utils/grouping";
import Link from "next/link";
import Narrative from "@/components/Narrative";
import useRequireAuth from "@/hooks/useRequireAuth";
import ViewDataSelector, {
  getPeriodeDateForView,
  VIEW_OPTIONS,
} from "@/components/ViewDataSelector";
import {
  Music,
  User,
  MessageCircle,
  X,
  ArrowRight,
  UserX,
  Copy,
} from "lucide-react";

export default function TiktokEngagementInsightPage() {
  useRequireAuth();
  const [stats, setStats] = useState(null);
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
    totalSudahKomentar: 0,
    totalKurangKomentar: 0,
    totalBelumKomentar: 0,
    totalTanpaUsername: 0,
    totalTiktokPost: 0,
  });
  const [isDirectorate, setIsDirectorate] = useState(false);
  const [clientName, setClientName] = useState("");

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

        const statsData = await getDashboardStats(
          token,
          periode,
          date,
          startDate,
          endDate,
          taskClientId,
        );
        setStats(statsData);

        const client_id = userClientId;

        const profileRes = await getClientProfile(token, client_id);
        const profile =
          profileRes.client || profileRes.profile || profileRes || {};
        const dir =
          (profile.client_type || "").toUpperCase() === "DIREKTORAT";
        setIsDirectorate(dir || isDitbinmas);
        setClientName(
          profile.nama ||
            profile.nama_client ||
            profile.client_name ||
            profile.client ||
            "",
        );

        let users = [];
        if (dir || isDitbinmas) {
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
              getRekapKomentarTiktok(
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
        } else {
          const rekapRes = await getRekapKomentarTiktok(
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

        let enrichedUsers = users;
        if (dir || isDitbinmas) {
          const nameMap = await getClientNames(
            token,
            users.map((u) =>
              String(
                u.client_id || u.clientId || u.clientID || u.client || "",
              ),
            ),
          );
          enrichedUsers = users.map((u) => {
            const cName =
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
              nama_client: cName,
              client_name: cName,
            };
          });
        }

        const totalUser = enrichedUsers.length;
        const totalTiktokPost =
          statsData?.ttPosts ||
          statsData?.tiktokPosts ||
          statsData.ttPosts ||
          statsData.tiktokPosts ||
          0;
        const isZeroPost = (totalTiktokPost || 0) === 0;
        let totalSudahKomentar = 0;
        let totalKurangKomentar = 0;
        let totalBelumKomentar = 0;
        let totalTanpaUsername = 0;
        enrichedUsers.forEach((u) => {
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

        setRekapSummary({
          totalUser,
          totalSudahKomentar,
          totalKurangKomentar,
          totalBelumKomentar,
          totalTanpaUsername,
          totalTiktokPost,
        });
        setChartData(enrichedUsers);
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

  const kelompok = isDirectorate ? null : groupUsersByKelompok(chartData);

  function handleCopyRekap() {
    const now = new Date();
    const hour = now.getHours();
    let greeting = "Selamat Pagi";
    if (hour >= 18) greeting = "Selamat Malam";
    else if (hour >= 12) greeting = "Selamat Siang";

    const hari = now.toLocaleDateString("id-ID", { weekday: "long" });
    const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const jam = now.toLocaleTimeString("id-ID", { hour12: false });

    const {
      totalTiktokPost,
      totalUser,
      totalSudahKomentar,
      totalKurangKomentar,
      totalBelumKomentar,
      totalTanpaUsername,
    } = rekapSummary;

    const groups = chartData.reduce((acc, u) => {
      const name =
        u.nama_client ||
        u.client_name ||
        u.client ||
        clientName ||
        "LAINNYA";
      const key = String(name).toUpperCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(u);
      return acc;
    }, {});

    const groupLines = Object.entries(groups)
      .map(([name, users]) => {
        const counts = users.reduce(
          (acc, u) => {
            const username = String(u.username || "").trim();
            const jumlah = Number(u.jumlah_komentar) || 0;
            if (!username) {
              acc.tanpaUsername++;
            } else if (totalTiktokPost === 0) {
              acc.belum++;
            } else if (jumlah >= totalTiktokPost * 0.5) {
              acc.sudah++;
            } else if (jumlah > 0) {
              acc.kurang++;
            } else {
              acc.belum++;
            }
            return acc;
          },
          { total: users.length, sudah: 0, kurang: 0, belum: 0, tanpaUsername: 0 },
        );
        return `${name}: ${counts.total} user (✅ ${counts.sudah}, ⚠️ ${counts.kurang}, ❌ ${counts.belum}, ⁉️ ${counts.tanpaUsername})`;
      })
      .join("\n");

    const message = `${greeting},\n\nRekap Akumulasi Komentar TikTok:\n${hari}, ${tanggal}\nJam: ${jam}\n\nJumlah TikTok Post: ${totalTiktokPost}\nJumlah User: ${totalUser}\n✅ Sudah Komentar: ${totalSudahKomentar} user\n⚠️ Kurang Komentar: ${totalKurangKomentar} user\n❌ Belum Komentar: ${totalBelumKomentar} user\n⁉️ Tanpa Username TikTok: ${totalTanpaUsername} user\n\nRekap per Client:\n${groupLines}`;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        alert("Rekap disalin ke clipboard");
      });
    } else {
      alert(message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-5xl px-2 md:px-8 py-8">
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl md:text-3xl font-bold text-pink-700 mb-2">
              TikTok Engagement Insight
            </h1>

            <div className="bg-gradient-to-tr from-fuchsia-50 to-white rounded-2xl shadow flex flex-col md:flex-row items-stretch justify-between p-3 md:p-5 gap-2 md:gap-4 border">
              <SummaryItem
                label="Jumlah TikTok Post"
                value={rekapSummary.totalTiktokPost}
                color="fuchsia"
                icon={<Music className="text-fuchsia-400" />}
              />
              <Divider />
              <SummaryItem
                label="Total User"
                value={rekapSummary.totalUser}
                color="gray"
                icon={<User className="text-gray-400" />}
              />
              <Divider />
              <SummaryItem
                label="Sudah Komentar"
                value={rekapSummary.totalSudahKomentar}
                color="green"
                icon={<MessageCircle className="text-green-500" />}
              />
              <Divider />
              <SummaryItem
                label="Kurang Komentar"
                value={rekapSummary.totalKurangKomentar}
                color="orange"
                icon={<MessageCircle className="text-orange-500" />}
              />
              <Divider />
              <SummaryItem
                label="Belum Komentar"
                value={rekapSummary.totalBelumKomentar}
                color="red"
                icon={<X className="text-red-500" />}
              />
              <Divider />
              <SummaryItem
                label="Tanpa Username"
                value={rekapSummary.totalTanpaUsername}
                color="gray"
                icon={<UserX className="text-gray-400" />}
              />
            </div>

            <div className="flex items-center justify-end gap-3 mb-2">
              <ViewDataSelector
                value={viewBy}
                onChange={setViewBy}
                options={viewOptions}
                date={
                  viewBy === "custom_range"
                    ? { startDate: fromDate, endDate: toDate }
                    : customDate
                }
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

            {isDirectorate ? (
              <ChartBox
                title="POLRES JAJARAN"
                users={chartData}
                totalPost={rekapSummary.totalTiktokPost}
                groupBy="client_id"
                orientation="horizontal"
                sortBy="percentage"
              />
            ) : (
              <div className="flex flex-col gap-6">
                <ChartBox
                  title="BAG"
                  users={kelompok.BAG}
                  totalPost={rekapSummary.totalTiktokPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi BAG."
                  sortBy="percentage"
                />
                <ChartBox
                  title="SAT"
                  users={kelompok.SAT}
                  totalPost={rekapSummary.totalTiktokPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi SAT."
                  sortBy="percentage"
                />
                <ChartBox
                  title="SI & SPKT"
                  users={kelompok["SI & SPKT"]}
                  totalPost={rekapSummary.totalTiktokPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi SI & SPKT."
                  sortBy="percentage"
                />
                <ChartBox
                  title="LAINNYA"
                  users={kelompok.LAINNYA}
                  totalPost={rekapSummary.totalTiktokPost}
                  narrative="Grafik ini menampilkan perbandingan jumlah komentar TikTok dari user di divisi lainnya."
                  sortBy="percentage"
                />
                <ChartHorizontal
                  title="POLSEK"
                  users={kelompok.POLSEK}
                  totalPost={rekapSummary.totalTiktokPost}
                  fieldJumlah="jumlah_komentar"
                  labelSudah="User Sudah Komentar"
                  labelBelum="User Belum Komentar"
                  labelTotal="Total Komentar"
                  showTotalUser
                  sortBy="percentage"
                />
                <Narrative>
                  Grafik POLSEK menggambarkan distribusi komentar antar user dari
                  setiap polsek serta total komentar yang berhasil dikumpulkan.
                </Narrative>
              </div>
            )}

            <div className="flex justify-end gap-2 my-2">
              <button
                onClick={handleCopyRekap}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-3 rounded-xl shadow transition-all duration-150 text-lg flex items-center gap-2"
              >
                <Copy className="w-5 h-5" />
                Rekap Komentar
              </button>
              <Link
                href="/comments/tiktok/rekap"
                className="bg-pink-700 hover:bg-pink-800 text-white font-bold px-6 py-3 rounded-xl shadow transition-all duration-150 text-lg flex items-center gap-2"
              >
                <ArrowRight className="w-5 h-5 inline" />
                Lihat Rekap Detail
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartBox({
  title,
  users,
  orientation = "vertical",
  totalPost,
  narrative,
  groupBy,
  sortBy,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-bold text-pink-700 mb-2 text-center">{title}</div>
      {users && users.length > 0 ? (
        <ChartDivisiAbsensi
          users={users}
          title={title}
          orientation={orientation}
          totalPost={totalPost}
          fieldJumlah="jumlah_komentar"
          labelSudah="User Sudah Komentar"
          labelKurang="User Kurang Komentar"
          labelBelum="User Belum Komentar"
          labelTotal="Total Komentar"
          groupBy={groupBy}
          showTotalUser
          labelTotalUser="Jumlah User"
          sortBy={sortBy}
        />
      ) : (
        <div className="text-center text-gray-400 text-sm">Tidak ada data</div>
      )}
      {narrative && <Narrative>{narrative}</Narrative>}
    </div>
  );
}

function SummaryItem({ label, value, color = "gray", icon }) {
  const colorMap = {
    fuchsia: "text-fuchsia-700",
    green: "text-green-600",
    red: "text-red-500",
    gray: "text-gray-700",
    orange: "text-orange-500",
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-2">
      <div className="mb-1">{icon}</div>
      <div className={`text-3xl md:text-4xl font-bold ${colorMap[color]}`}>
        {value}
      </div>
      <div className="text-xs md:text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wide text-center">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="hidden md:block w-px bg-gray-200 mx-2 my-2"></div>;
}

