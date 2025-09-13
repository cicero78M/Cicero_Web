"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import {
  getUserDirectory,
  getClientProfile,
  getClientNames,
} from "@/utils/api";
import { groupUsersByKelompok } from "@/utils/grouping";
import { accumulateContactStats } from "@/utils/contactStats";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { User, Instagram, Music, RefreshCw } from "lucide-react";

export default function UserInsightPage() {
  useRequireAuth();
  const { token, clientId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    total: 0,
    instagramFilled: 0,
    instagramEmpty: 0,
    tiktokFilled: 0,
    tiktokEmpty: 0,
  });

  const [chartKelompok, setChartKelompok] = useState({
    BAG: [],
    SAT: [],
    "SI & SPKT": [],
    POLSEK: [],
    LAINNYA: [],
  });
  const [isDirectorate, setIsDirectorate] = useState(false);
  const [chartPolres, setChartPolres] = useState([]);

  useEffect(() => {
    fetchData();
  }, [token, clientId]);

  async function fetchData() {
      if (!token || !clientId) {
        setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }
      try {
        const [usersRes, profileRes] = await Promise.all([
          getUserDirectory(token, clientId),
          getClientProfile(token, clientId),
        ]);
        const raw = usersRes.data || usersRes.users || usersRes;
        const users = Array.isArray(raw) ? raw : [];

        // helper untuk membuat data chart per divisi
        const generateChartData = (arr) => {
          const map = {};
          arr.forEach((u) => {
            const div = (u.divisi || "LAINNYA").toUpperCase();
            const key = div.replace(/POLSEK\s*/i, "").trim();
            if (!map[key]) {
              map[key] = {
                divisi: key,
                total: 0,
                instagramFilled: 0,
                instagramEmpty: 0,
                tiktokFilled: 0,
                tiktokEmpty: 0,
              };
            }
            map[key].total += 1;
            const hasIG = u.insta && String(u.insta).trim() !== "";
            const hasTT = u.tiktok && String(u.tiktok).trim() !== "";
            accumulateContactStats(map[key], hasIG, hasTT);
          });
          const result = Object.values(map);
          const score = (o) => o.total + o.instagramFilled + o.tiktokFilled;
          return result.sort((a, b) => score(b) - score(a));
        };
        // Cek tipe client
        const profile =
          profileRes.client || profileRes.profile || profileRes || {};
        const dir =
          (profile.client_type || "").toUpperCase() === "DIREKTORAT";
        setIsDirectorate(dir);

        let processedUsers = users;
        if (dir) {
          const nameMap = await getClientNames(
            token,
            users.map((u) =>
              String(
                u.client_id || u.clientId || u.clientID || u.id || "",
              ),
            ),
          );
          processedUsers = users.map((u) => ({
            ...u,
            nama_client:
              nameMap[
                String(
                  u.client_id || u.clientId || u.clientID || u.id || "",
                )
              ] ||
              u.nama_client ||
              u.client_name ||
              u.client,
          }));
        }

        const summaryCounts = processedUsers.reduce(
          (acc, u) => {
            const hasIG = u.insta && String(u.insta).trim() !== "";
            const hasTT = u.tiktok && String(u.tiktok).trim() !== "";
            acc.total += 1;
            hasIG ? acc.instagramFilled++ : acc.instagramEmpty++;
            hasTT ? acc.tiktokFilled++ : acc.tiktokEmpty++;
            return acc;
          },
          {
            total: 0,
            instagramFilled: 0,
            instagramEmpty: 0,
            tiktokFilled: 0,
            tiktokEmpty: 0,
          },
        );
        setSummary(summaryCounts);

        if (dir) {
          const clientMap = {};
          processedUsers.forEach((u) => {
            const id = String(
              u.client_id || u.clientId || u.clientID || u.id || "LAINNYA",
            );
            const name = (
              u.nama_client ||
              u.client_name ||
              u.client ||
              id
            ).toUpperCase();
            if (!clientMap[id]) {
              clientMap[id] = {
                divisi: name,
                total: 0,
                instagramFilled: 0,
                instagramEmpty: 0,
                tiktokFilled: 0,
                tiktokEmpty: 0,
              };
            }
            clientMap[id].total += 1;
            const hasIG = u.insta && String(u.insta).trim() !== "";
            const hasTT = u.tiktok && String(u.tiktok).trim() !== "";
            accumulateContactStats(clientMap[id], hasIG, hasTT);
          });
          const score = (o) => o.total + o.instagramFilled + o.tiktokFilled;
          setChartPolres(
            Object.values(clientMap).sort((a, b) => score(b) - score(a)),
          );
        } else {
          const grouped = groupUsersByKelompok(processedUsers);
          setChartKelompok({
            BAG: generateChartData(grouped.BAG),
            SAT: generateChartData(grouped.SAT),
            "SI & SPKT": generateChartData(grouped["SI & SPKT"]),
            POLSEK: generateChartData(grouped.POLSEK),
            LAINNYA: generateChartData(grouped.LAINNYA),
          });
        }
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

  function handleCopyRekap() {
    const now = new Date();
    const tanggal = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const lines = [
      `Rekap User Insight (${tanggal})`,
      `Total User: ${summary.total}`,
      `Instagram Terisi: ${summary.instagramFilled}`,
      `Instagram Belum Diisi: ${summary.instagramEmpty}`,
      `TikTok Terisi: ${summary.tiktokFilled}`,
      `TikTok Belum Diisi: ${summary.tiktokEmpty}`,
      "",
    ];
    if (isDirectorate) {
      lines.push("POLRES JAJARAN:");
      chartPolres.forEach((c) => {
        lines.push(
          `${c.divisi} (${c.total}): IG ${c.instagramFilled}/${c.instagramEmpty}, TikTok ${c.tiktokFilled}/${c.tiktokEmpty}`,
        );
      });
    } else {
      Object.entries(chartKelompok).forEach(([key, arr]) => {
        if (arr && arr.length > 0) {
          lines.push(`${key}:`);
          arr.forEach((c) => {
            lines.push(
              `- ${c.divisi} (${c.total}): IG ${c.instagramFilled}/${c.instagramEmpty}, TikTok ${c.tiktokFilled}/${c.tiktokEmpty}`,
            );
          });
          lines.push("");
        }
      });
    }
    const message = lines.join("\n");
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        alert("Rekap disalin ke clipboard");
      });
    } else {
      alert(message);
    }
  }

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6 text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-5xl px-2 md:px-8 py-8">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-blue-700">
                User Insight
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyRekap}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
                >
                  Salin Rekap
                </button>
                <button
                  onClick={fetchData}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isDirectorate && (
              <div className="self-start">
                <span
                  className="inline-block bg-blue-100 text-blue-800 text-xs md:text-sm font-medium px-3 py-1 rounded border border-blue-200"
                >
                  Polres Jajaran dapat mengajukan request sistem untuk diterapkan di kesatuan masing-masing, sekaligus melakukan absensi personil guna meningkatkan engagement media sosial resmi kesatuannya.
                </span>
              </div>
            )}

            <div className="bg-gradient-to-tr from-blue-50 to-white rounded-2xl shadow flex flex-col md:flex-row items-stretch justify-between p-3 md:p-5 gap-2 md:gap-4 border">
              <SummaryItem
                label="Total User"
                value={summary.total}
                color="blue"
                icon={<User className="text-blue-400" />}
              />
              <Divider />
              <SummaryItem
                label="Instagram Terisi"
                value={summary.instagramFilled}
                color="red"
                icon={<Instagram className="text-red-500" />}
              />
              <Divider />
              <SummaryItem
                label="Instagram Belum Diisi"
                value={summary.instagramEmpty}
                color="gray"
                icon={<Instagram className="text-gray-500" />}
              />
              <Divider />
              <SummaryItem
                label="TikTok Terisi"
                value={summary.tiktokFilled}
                color="green"
                icon={<Music className="text-green-500" />}
              />
              <Divider />
              <SummaryItem
                label="TikTok Belum Diisi"
                value={summary.tiktokEmpty}
                color="gray"
                icon={<Music className="text-gray-500" />}
              />
            </div>

            {isDirectorate ? (
              <ChartBox
                title="POLRES JAJARAN"
                data={chartPolres}
                orientation="horizontal"
                minHeight={420}
                thicknessMultiplier={3}
              />
            ) : (
              <div className="flex flex-col gap-6">
                <ChartBox title="BAG" data={chartKelompok.BAG} />
                <ChartBox title="SAT" data={chartKelompok.SAT} />
                <ChartBox title="SI & SPKT" data={chartKelompok["SI & SPKT"]} />
                <ChartBox title="LAINNYA" data={chartKelompok.LAINNYA} />
                <ChartBox
                  title="POLSEK"
                  data={chartKelompok.POLSEK}
                  orientation="horizontal"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartBox({
  title,
  data,
  orientation = "vertical",
  minHeight,
  thicknessMultiplier = 1,
}) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-bold text-blue-700 mb-2 text-center">{title}</div>
      {data && data.length > 0 ? (
        <ContactChart
          data={data}
          orientation={orientation}
          minHeight={minHeight}
          thicknessMultiplier={thicknessMultiplier}
        />
      ) : (
        <div className="text-center text-gray-400 text-sm">Tidak ada data</div>
      )}
    </div>
  );
}

function ContactChart({ data, orientation, minHeight = 50, thicknessMultiplier = 1 }) {
  const isHorizontal = orientation === "horizontal";
  const barPosition = isHorizontal ? "right" : "top";
  const perItem = 35 * thicknessMultiplier;
  const height = isHorizontal ? Math.max(minHeight, perItem * data.length) : 300;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
          barCategoryGap="16%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          {isHorizontal ? (
            <XAxis type="number" />
          ) : (
            <XAxis dataKey="divisi" interval={0} />
          )}
          {isHorizontal ? (
            <YAxis
              dataKey="divisi"
              type="category"
              width={220}
              interval={0}
              tick={({ x, y, payload }) => (
                <>
                  <title>{payload.value}</title>
                  <text
                    x={x - 200}
                    y={y + 10}
                    fontSize={12}
                    fontWeight={700}
                    fill="#1e293b"
                    textAnchor="start"
                  >
                    {payload.value}
                  </text>
                </>
              )}
            />
          ) : (
            <YAxis allowDecimals={false} />
          )}
          <Tooltip />
          <Legend />
          <Bar dataKey="total" name="Jumlah User" fill="#3b82f6">
            <LabelList dataKey="total" position={barPosition} fontSize={12} />
          </Bar>
          <Bar
            dataKey="instagramFilled"
            name="Instagram Terisi"
            fill="#e1306c"
          >
            <LabelList
              dataKey="instagramFilled"
              position={barPosition}
              fontSize={12}
            />
          </Bar>
          <Bar
            dataKey="instagramEmpty"
            name="Instagram Belum Diisi"
            fill="#fca5a5"
          >
            <LabelList
              dataKey="instagramEmpty"
              position={barPosition}
              fontSize={12}
            />
          </Bar>
          <Bar
            dataKey="tiktokFilled"
            name="TikTok Terisi"
            fill="#000000"
          >
            <LabelList
              dataKey="tiktokFilled"
              position={barPosition}
              fontSize={12}
            />
          </Bar>
          <Bar
            dataKey="tiktokEmpty"
            name="TikTok Belum Diisi"
            fill="#6b7280"
          >
            <LabelList
              dataKey="tiktokEmpty"
              position={barPosition}
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SummaryItem({ label, value, color = "gray", icon }) {
  const colorMap = {
    blue: "text-blue-700",
    green: "text-green-600",
    red: "text-red-500",
    gray: "text-gray-700",
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
  return <div className="hidden md:block w-px bg-gray-200 mx-2 my-2" />;
}

