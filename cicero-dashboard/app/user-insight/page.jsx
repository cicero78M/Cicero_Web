"use client";
import { useEffect, useState, useId } from "react";
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
import { showToast } from "@/utils/showToast";
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

  const getHighestFillRatio = (entry) => {
    if (!entry || !entry.total) {
      return 0;
    }
    const instagramFilled = entry.instagramFilled || 0;
    const tiktokFilled = entry.tiktokFilled || 0;
    return Math.max(instagramFilled, tiktokFilled) / entry.total;
  };

  const compareByFillRatio = (a, b) => {
    const ratioDiff = getHighestFillRatio(b) - getHighestFillRatio(a);
    if (ratioDiff !== 0) {
      return ratioDiff;
    }
    const totalDiff = (b.total || 0) - (a.total || 0);
    if (totalDiff !== 0) {
      return totalDiff;
    }
    const nameA = (a.divisi || a.nama_client || "").toString();
    const nameB = (b.divisi || b.nama_client || "").toString();
    return nameA.localeCompare(nameB);
  };

  const getDirectoratePriority = (entry) => {
    const name = (
      entry.divisi || entry.nama_client || ""
    )
      .toString()
      .trim()
      .toUpperCase();
    if (name.includes("DIREKTORAT BINMAS")) {
      return 0;
    }
    const total = Number(entry.total) || 0;
    if (total > 250) {
      return 1;
    }
    if (total >= 200) {
      return 2;
    }
    if (total >= 150) {
      return 3;
    }
    if (total >= 100) {
      return 4;
    }
    if (total >= 50) {
      return 5;
    }
    return 6;
  };

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
          return result.sort(compareByFillRatio);
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
          const sortedClients = Object.values(clientMap).sort((a, b) => {
            const priorityDiff =
              getDirectoratePriority(a) - getDirectoratePriority(b);
            if (priorityDiff !== 0) {
              return priorityDiff;
            }
            return compareByFillRatio(a, b);
          });
          setChartPolres(sortedClients);
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
      navigator.clipboard
        .writeText(message)
        .then(() => {
          showToast("Rekap disalin ke clipboard", "success");
        })
        .catch(() => {
          showToast("Gagal menyalin rekap ke clipboard", "error");
        });
    } else {
      showToast(message, "info");
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
  const titleId = useId();
  const hasData = Array.isArray(data) && data.length > 0;
  const totalUsers = hasData
    ? data.reduce((acc, item) => acc + Number(item?.total ?? 0), 0)
    : 0;

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex flex-col items-center gap-1 mb-2">
        <h3 id={titleId} className="font-bold text-blue-700 text-center">
          {title}
        </h3>
        {hasData && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-0.5 text-xs font-semibold text-blue-700">
            Total {totalUsers.toLocaleString("id-ID")}
          </span>
        )}
      </div>
      {hasData ? (
        <>
          <ContactChart
            data={data}
            orientation={orientation}
            minHeight={minHeight}
            thicknessMultiplier={thicknessMultiplier}
          />
          <div className="mt-4 overflow-x-auto">
            <table
              aria-labelledby={titleId}
              tabIndex={0}
              className="min-w-full text-sm text-left text-gray-700 border border-gray-200 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <caption className="sr-only">{title}</caption>
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Divisi
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Total User
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Instagram Terisi
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    Instagram Belum Diisi
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    TikTok Terisi
                  </th>
                  <th scope="col" className="px-3 py-2 font-semibold">
                    TikTok Belum Diisi
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => {
                  const divisionName =
                    (item?.divisi || item?.nama_client || "").toString() ||
                    `Baris ${index + 1}`;
                  const key = `${divisionName}-${index}`;
                  return (
                    <tr
                      key={key}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <th
                        scope="row"
                        className="px-3 py-2 font-medium text-gray-900"
                      >
                        {divisionName}
                      </th>
                      <td className="px-3 py-2">
                        {Number(item?.total ?? 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-3 py-2">
                        {Number(item?.instagramFilled ?? 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {Number(item?.instagramEmpty ?? 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {Number(item?.tiktokFilled ?? 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {Number(item?.tiktokEmpty ?? 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
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
  const longestLabelLength = data.reduce(
    (max, item) => Math.max(max, (item?.divisi || "").length),
    0,
  );
  const estimatedCharWidth = 7;
  const horizontalLabelWidth = isHorizontal
    ? Math.max(140, Math.min(320, longestLabelLength * estimatedCharWidth + 32))
    : undefined;
  const chartMargin = isHorizontal
    ? { top: 4, right: 20, left: 4, bottom: 8 }
    : { top: 4, right: 20, left: 4, bottom: 52 };

  const tooltipFormatter = (value, name) => [
    Number(value ?? 0).toLocaleString("id-ID"),
    name,
  ];

  const tooltipLabelFormatter = (label) =>
    (label ?? "").toString().trim() || "Tidak diketahui";

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={chartMargin}
          barCategoryGap="16%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          {isHorizontal ? (
            <XAxis type="number" />
          ) : (
            <XAxis
              dataKey="divisi"
              interval={0}
              height={90}
              tickMargin={12}
              tick={<CustomAxisTick orientation="vertical" />}
            />
          )}
          {isHorizontal ? (
            <YAxis
              dataKey="divisi"
              type="category"
              width={horizontalLabelWidth}
              interval={0}
              tick={
                <CustomAxisTick
                  orientation="horizontal"
                  maxWidth={horizontalLabelWidth - 24}
                />
              }
            />
          ) : (
            <YAxis allowDecimals={false} />
          )}
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
            cursor={{ fill: "rgba(148, 163, 184, 0.12)" }}
          />
          <Legend />
          <Bar
            dataKey="instagramFilled"
            name="Instagram Terisi"
            fill="#e1306c"
            stackId="instagram"
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
            stackId="instagram"
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
            stackId="tiktok"
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
            stackId="tiktok"
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

function CustomAxisTick({
  x = 0,
  y = 0,
  payload = {},
  orientation = "vertical",
  maxWidth = 160,
}) {
  const value = (payload?.value ?? "").toString();
  const words = value.split(/\s+/).filter(Boolean);

  if (orientation === "vertical") {
    return (
      <g transform={`translate(${x},${y})`}>
        <title>{value}</title>
        <text
          transform="rotate(-40)"
          textAnchor="end"
          fill="#1e293b"
          fontSize={12}
          fontWeight={600}
        >
          {(words.length > 0 ? words : [value]).map((word, index) => (
            <tspan x={0} dy={index === 0 ? 0 : 14} key={`${word}-${index}`}>
              {word}
            </tspan>
          ))}
        </text>
      </g>
    );
  }

  const estimatedCharWidth = 7;
  const maxCharsPerLine = Math.max(4, Math.floor(maxWidth / estimatedCharWidth));
  const lines = [];
  let currentLine = "";

  (words.length > 0 ? words : [value]).forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }

  const textStartX = x - maxWidth + 8;

  return (
    <g transform={`translate(${textStartX},${y})`}>
      <title>{value}</title>
      <text textAnchor="start" fill="#1e293b" fontSize={12} fontWeight={600}>
        {lines.map((line, index) => (
          <tspan key={`${line}-${index}`} x={0} dy={index === 0 ? 4 : 14}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
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

