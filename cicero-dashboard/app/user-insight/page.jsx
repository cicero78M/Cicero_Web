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
  extractUserDirectoryUsers,
} from "@/utils/api";
import { groupUsersByKelompok } from "@/utils/instagramEngagement";
import { accumulateContactStats } from "@/utils/contactStats";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { showToast } from "@/utils/showToast";
import { User, Instagram, Music, RefreshCw } from "lucide-react";
import {
  filterUserDirectoryByScope,
  getUserDirectoryFetchScope,
  normalizeDirectoryRole,
} from "@/utils/userDirectoryScope";

export default function UserInsightPage() {
  useRequireAuth();
  const { token, clientId, effectiveClientType, role, effectiveRole } =
    useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    total: 0,
    instagramFilled: 0,
    instagramEmpty: 0,
    tiktokFilled: 0,
    tiktokEmpty: 0,
    instagramFilledPercent: 0,
    instagramEmptyPercent: 0,
    tiktokFilledPercent: 0,
    tiktokEmptyPercent: 0,
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
  }, [token, clientId, effectiveClientType]);

  async function fetchData() {
      if (!token || !clientId) {
        setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }
      try {
        const normalizedRole = normalizeDirectoryRole(effectiveRole || role);
        const scope = getUserDirectoryFetchScope({
          role: normalizedRole || undefined,
          effectiveClientType,
        });
        const [usersRes, profileRes] = await Promise.all([
          getUserDirectory(token, clientId, {
            role: normalizedRole || undefined,
            scope,
          }),
          getClientProfile(token, clientId),
        ]);
        const users = extractUserDirectoryUsers(usersRes);

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
        const rawClientType = (profile.client_type || "").toUpperCase();
        const normalizedEffectiveClientType = String(
          effectiveClientType || rawClientType,
        ).toUpperCase();
        const { users: scopedUsers, scope: resolvedScope } =
          filterUserDirectoryByScope(users, {
            clientId,
            role: normalizedRole,
            effectiveClientType: normalizedEffectiveClientType,
          });
        const dir = resolvedScope === "DIREKTORAT";
        setIsDirectorate(dir);

        let processedUsers = scopedUsers;
        if (dir) {
          const activeClientName =
            profile.nama_client ||
            profile.client_name ||
            profile.client ||
            "";
          processedUsers = users.map((u) => {
            const userClientId = String(
              u.client_id || u.clientId || u.clientID || u.id || "",
            );
            const isActiveClient =
              String(clientId) !== "" && String(clientId) === userClientId;
            return {
              ...u,
              nama_client:
                u.nama_client ||
                u.client_name ||
                (isActiveClient ? activeClientName : "") ||
                u.client,
            };
          });
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
        const totalUsers = summaryCounts.total || 0;
        const safeRatio = (count) =>
          totalUsers > 0 ? Math.min(100, Math.max(0, (count / totalUsers) * 100)) : 0;
        setSummary({
          ...summaryCounts,
          instagramFilledPercent: safeRatio(summaryCounts.instagramFilled),
          instagramEmptyPercent: safeRatio(summaryCounts.instagramEmpty),
          tiktokFilledPercent: safeRatio(summaryCounts.tiktokFilled),
          tiktokEmptyPercent: safeRatio(summaryCounts.tiktokEmpty),
        });

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
      lines.push("SATKER :");
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-purple-50">
        <div className="rounded-3xl border border-red-200 bg-red-100/80 px-6 py-5 text-sm font-semibold text-red-600 shadow-lg">
          {error}
        </div>
      </div>
    );

    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-purple-50 text-slate-700">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />
          <div className="absolute -right-10 top-72 h-64 w-64 rounded-full bg-violet-200/60 blur-3xl" />
          <div className="absolute left-1/2 top-0 h-96 w-[34rem] -translate-x-1/2 bg-pink-200/50 blur-3xl" />
        </div>
        <div className="relative flex min-h-screen flex-col">
          <div className="flex-1">
            <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12">
              <div className="flex flex-col gap-10">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-semibold tracking-[0.2em] text-slate-900 md:text-4xl">
                      USER INSIGHT
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                      Pantau Update Data User secara real-time.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCopyRekap}
                      className="relative overflow-hidden rounded-full border border-sky-300/70 bg-white/80 px-5 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-sky-600 shadow-[0_12px_30px_rgba(14,165,233,0.18)] transition duration-300 hover:-translate-y-0.5 hover:border-sky-400 hover:bg-white"
                    >
                      <span className="relative">Salin Rekap</span>
                    </button>
                    <button
                      onClick={fetchData}
                      className="rounded-full border border-slate-200 bg-white/80 p-2 text-slate-500 transition duration-300 hover:border-sky-300 hover:text-sky-500"
                      aria-label="Refresh"
                    >
                      <RefreshCw className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {!isDirectorate && (
                  <div className="self-start">
                    <span className="inline-flex max-w-xl items-center rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-600">
                      Polres Jajaran dapat mengajukan request sistem untuk diterapkan di kesatuan masing-masing, sekaligus melakukan absensi personil guna meningkatkan engagement media sosial resmi kesatuannya.
                    </span>
                  </div>
                )}

                <div className="flex flex-col items-stretch justify-between gap-3 rounded-3xl border border-sky-100 bg-white/80 p-4 shadow-lg backdrop-blur-sm md:flex-row md:gap-4 md:p-6">
                  <SummaryItem
                    label="Total User"
                    value={summary.total}
                    color="blue"
                    icon={<User className="h-7 w-7 text-sky-500" />}
                  />
                  <Divider />
                  <SummaryItem
                    label="Instagram Terisi"
                    value={summary.instagramFilled}
                    color="red"
                    icon={<Instagram className="h-7 w-7 text-indigo-500" />}
                    percentage={summary.instagramFilledPercent}
                    showProgress
                  />
                  <Divider />
                  <SummaryItem
                    label="Instagram Belum Diisi"
                    value={summary.instagramEmpty}
                    color="gray"
                    icon={<Instagram className="h-7 w-7 text-sky-400" />}
                    percentage={summary.instagramEmptyPercent}
                  />
                  <Divider />
                  <SummaryItem
                    label="TikTok Terisi"
                    value={summary.tiktokFilled}
                    color="green"
                    icon={<Music className="h-7 w-7 text-teal-500" />}
                    percentage={summary.tiktokFilledPercent}
                    showProgress
                  />
                  <Divider />
                  <SummaryItem
                    label="TikTok Belum Diisi"
                    value={summary.tiktokEmpty}
                    color="gray"
                    icon={<Music className="h-7 w-7 text-indigo-400" />}
                    percentage={summary.tiktokEmptyPercent}
                  />
                </div>

                {isDirectorate ? (
                  <ChartBox
                    title="SATKER"
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
    <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-lg">
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-white/40" />
      <div className="relative flex flex-col items-center gap-2 pb-2 text-center">
        <h3
          id={titleId}
          className="text-lg font-semibold uppercase tracking-[0.3em] text-slate-900"
        >
          {title}
        </h3>
        {hasData && (
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold tracking-[0.15em] text-slate-600">
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
          <div className="mt-6 overflow-x-auto">
            <table
              aria-labelledby={titleId}
              tabIndex={0}
              className="min-w-full overflow-hidden rounded-2xl border border-sky-100 bg-white text-left text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:ring-offset-0"
            >
              <caption className="sr-only">{title}</caption>
              <thead className="bg-sky-50 text-[13px] uppercase tracking-[0.2em] text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Satker
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Total User
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Instagram Terisi
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Instagram Belum Diisi
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    TikTok Terisi
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
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
                      className="border-t border-sky-100 bg-white transition hover:bg-sky-50"
                    >
                      <th
                        scope="row"
                        className="px-4 py-3 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-600"
                      >
                        {divisionName}
                      </th>
                      <td className="px-4 py-3 text-slate-700">
                        {Number(item?.total ?? 0).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-sky-600">
                        {Number(item?.instagramFilled ?? 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-4 py-3 text-teal-600">
                        {Number(item?.instagramEmpty ?? 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-4 py-3 text-indigo-600">
                        {Number(item?.tiktokFilled ?? 0).toLocaleString(
                          "id-ID",
                        )}
                      </td>
                      <td className="px-4 py-3 text-rose-500">
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
        <div className="py-6 text-center text-sm text-slate-400">Tidak ada data</div>
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
          <CartesianGrid stroke="rgba(148, 163, 184, 0.25)" strokeDasharray="3 3" />
          {isHorizontal ? (
            <XAxis
              type="number"
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
              tickLine={false}
            />
          ) : (
            <XAxis
              dataKey="divisi"
              interval={0}
              height={90}
              tickMargin={12}
              tick={<CustomAxisTick orientation="vertical" />}
              axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
              tickLine={false}
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
              axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
              tickLine={false}
            />
          ) : (
            <YAxis
              allowDecimals={false}
              tick={{ fill: "#475569", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
              tickLine={false}
            />
          )}
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={tooltipLabelFormatter}
            cursor={{ fill: "rgba(125, 211, 252, 0.15)" }}
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              border: "1px solid rgba(148,163,184,0.35)",
              color: "#1f2937",
              padding: 12,
            }}
            itemStyle={{ color: "#1f2937" }}
          />
          <Legend
            iconType="circle"
            wrapperStyle={{ color: "#475569", fontSize: 12, paddingTop: 12 }}
          />
          <Bar
            dataKey="instagramFilled"
            name="Instagram Terisi"
            fill="#38bdf8"
            stackId="instagram"
          >
            <LabelList
              dataKey="instagramFilled"
              position={barPosition}
              fontSize={12}
              fill="#0f172a"
            />
          </Bar>
          <Bar
            dataKey="instagramEmpty"
            name="Instagram Belum Diisi"
            fill="#5eead4"
            stackId="instagram"
          >
            <LabelList
              dataKey="instagramEmpty"
              position={barPosition}
              fontSize={12}
              fill="#0f172a"
            />
          </Bar>
          <Bar
            dataKey="tiktokFilled"
            name="TikTok Terisi"
            fill="#818cf8"
            stackId="tiktok"
          >
            <LabelList
              dataKey="tiktokFilled"
              position={barPosition}
              fontSize={12}
              fill="#0f172a"
            />
          </Bar>
          <Bar
            dataKey="tiktokEmpty"
            name="TikTok Belum Diisi"
            fill="#f9a8d4"
            stackId="tiktok"
          >
            <LabelList
              dataKey="tiktokEmpty"
              position={barPosition}
              fontSize={12}
              fill="#0f172a"
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
          fill="#475569"
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
      <text textAnchor="start" fill="#475569" fontSize={12} fontWeight={600}>
        {lines.map((line, index) => (
          <tspan key={`${line}-${index}`} x={0} dy={index === 0 ? 4 : 14}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function SummaryItem({
  label,
  value,
  color = "gray",
  icon,
  percentage,
  showProgress = false,
}) {
  const colorMap = {
    blue: {
      text: "text-sky-600",
      bar: "bg-sky-300",
      accent: "from-sky-100 via-white to-white",
      glow: "shadow-[0_18px_40px_rgba(56,189,248,0.2)]",
      iconBg: "bg-sky-50",
      iconBorder: "border-sky-100",
    },
    green: {
      text: "text-teal-600",
      bar: "bg-teal-300",
      accent: "from-teal-100 via-white to-white",
      glow: "shadow-[0_18px_40px_rgba(45,212,191,0.22)]",
      iconBg: "bg-teal-50",
      iconBorder: "border-teal-100",
    },
    red: {
      text: "text-indigo-600",
      bar: "bg-indigo-300",
      accent: "from-indigo-100 via-white to-white",
      glow: "shadow-[0_18px_40px_rgba(129,140,248,0.22)]",
      iconBg: "bg-indigo-50",
      iconBorder: "border-indigo-100",
    },
    gray: {
      text: "text-slate-600",
      bar: "bg-slate-300",
      accent: "from-slate-100 via-white to-white",
      glow: "shadow-[0_18px_36px_rgba(148,163,184,0.18)]",
      iconBg: "bg-slate-50",
      iconBorder: "border-slate-100",
    },
  };
  const displayColor = colorMap[color] || colorMap.gray;
  const formattedPercentage =
    typeof percentage === "number"
      ? `${percentage.toFixed(1).replace(".0", "")} %`
      : null;
  const progressWidth =
    typeof percentage === "number" ? `${Math.min(100, Math.max(0, percentage))}%` : "0%";

  return (
    <div
      className={`group relative flex w-full flex-1 flex-col items-center justify-center overflow-hidden rounded-2xl border border-sky-200 bg-white/80 px-4 py-6 text-center backdrop-blur-sm transition duration-300 hover:border-sky-300 ${displayColor.glow}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${displayColor.accent}`}
      />
      <div className="pointer-events-none absolute inset-x-6 top-2 h-12 rounded-full bg-white/70 blur-2xl" />
      <div className="relative flex w-full flex-col items-center gap-3">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-full border ${
            displayColor.iconBorder
          } ${displayColor.iconBg} text-xl`}
        >
          {icon}
        </div>
        <div className={`text-3xl font-semibold md:text-4xl ${displayColor.text}`}>
          {value}
        </div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
          {label}
        </div>
        {formattedPercentage && (
          <div className="mt-1 flex w-full flex-col items-center gap-1">
            <span className="text-[11px] font-medium text-slate-500">
              {formattedPercentage}
            </span>
            {showProgress && (
              <div className="h-2 w-full max-w-[180px] rounded-full bg-sky-50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${displayColor.bar}`}
                  style={{ width: progressWidth }}
                  role="progressbar"
                  aria-valuenow={Math.round(Number(percentage) || 0)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${label} ${formattedPercentage}`}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="hidden h-full w-px self-stretch bg-sky-100 md:block" />;
}
