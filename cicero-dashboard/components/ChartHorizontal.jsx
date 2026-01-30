"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
  Legend,
} from "recharts";
import ChartDataTable from "@/components/ChartDataTable";
function bersihkanSatfung(divisi = "") {
  return divisi
    .replace(/polsek\s*/i, "")
    .replace(/^[0-9.\-\s]+/, "")
    .trim();
}

export default function ChartHorizontal({
  users = [],
  summaryData,
  title = "POLSEK - Absensi Likes",
  totalPost = 1,
  totalIGPost,
  fieldJumlah = "jumlah_like",
  labelSudah = "User Sudah Like",
  labelKurang = "User Kurang Like",
  labelBelum = "User Belum Like",
  labelTotal = "Total Likes",
  showTotalUser = false,
  labelTotalUser = "Jumlah User",
  sortBy = "total_value",
}) {
  const effectiveTotal =
    typeof totalPost !== "undefined" ? totalPost : totalIGPost;

  // Jika tidak ada post, semua user masuk belum (termasuk exception)
  const isZeroPost = (effectiveTotal || 0) === 0;
  const hasSummaryData = Array.isArray(summaryData) && summaryData.length > 0;

  const normalizeSummaryEntry = (entry, index) => {
    const distribution =
      entry?.distribution ?? entry?.distribusi ?? entry?.statusDistribution ?? {};
    const totalUser =
      Number(
        entry?.total_user ??
          entry?.totalUser ??
          entry?.totalUsers ??
          entry?.userTotal ??
          entry?.total ??
          distribution?.totalUsers ??
          0,
      ) || 0;
    const userSudah =
      Number(entry?.user_sudah ?? entry?.sudah ?? distribution?.sudah ?? 0) || 0;
    const userKurang =
      Number(entry?.user_kurang ?? entry?.kurang ?? distribution?.kurang ?? 0) || 0;
    const userBelum =
      (Number(entry?.user_belum ?? entry?.belum ?? distribution?.belum ?? 0) || 0) +
      (Number(
        entry?.noPosts ??
          entry?.no_posts ??
          distribution?.noPosts ??
          distribution?.no_posts ??
          0,
      ) || 0);
    const totalValue =
      Number(
        entry?.total_value ??
          entry?.totalValue ??
          entry?.totalKomentar ??
          entry?.totalComments ??
          0,
      ) || 0;
    const divisiLabel =
      entry?.divisi ??
      entry?.name ??
      entry?.label ??
      entry?.satfung ??
      entry?.unit ??
      entry?.client_name ??
      entry?.nama_client ??
      entry?.clientName ??
      entry?.client ??
      entry?.client_id ??
      `Item ${index + 1}`;

    return {
      divisi: bersihkanSatfung(String(divisiLabel || "LAINNYA")),
      total_user: totalUser,
      user_sudah: userSudah,
      user_kurang: userKurang,
      user_belum: userBelum,
      total_value: totalValue,
    };
  };

  // Matrix 3 metrik per polsek
  const divisiMap = {};
  if (hasSummaryData) {
    summaryData.forEach((entry, index) => {
      const normalized = normalizeSummaryEntry(entry, index);
      const key = normalized.divisi || "LAINNYA";
      if (!divisiMap[key]) {
        divisiMap[key] = {
          divisi: key,
          total_user: 0,
          user_sudah: 0,
          user_kurang: 0,
          user_belum: 0,
          total_value: 0,
        };
      }
      divisiMap[key].total_user += normalized.total_user || 0;
      divisiMap[key].user_sudah += normalized.user_sudah || 0;
      divisiMap[key].user_kurang += normalized.user_kurang || 0;
      divisiMap[key].user_belum += normalized.user_belum || 0;
      divisiMap[key].total_value += normalized.total_value || 0;
    });
  } else {
    users.forEach((u) => {
      const key = bersihkanSatfung(u.divisi || "LAINNYA");
      // Logic: sudahLike hanya berlaku kalau ada post
      const jumlah = Number(u[fieldJumlah] || 0);
      const sudah = !isZeroPost && jumlah >= effectiveTotal;
      const kurang = !sudah && !isZeroPost && jumlah > 0;
      const nilai = jumlah;
      if (!divisiMap[key])
        divisiMap[key] = {
          divisi: key,
          total_user: 0,
          user_sudah: 0,
          user_kurang: 0,
          user_belum: 0,
          total_value: 0,
        };
      divisiMap[key].total_user += 1;
      divisiMap[key].total_value += nilai;
      if (sudah) {
        divisiMap[key].user_sudah += 1;
      } else if (kurang) {
        divisiMap[key].user_kurang += 1;
      } else {
        divisiMap[key].user_belum += 1;
      }
    });
  }
  const dataChart = Object.values(divisiMap).sort((a, b) => {
    if (sortBy === "percentage") {
      const percA = a.total_user ? a.user_sudah / a.total_user : 0;
      const percB = b.total_user ? b.user_sudah / b.total_user : 0;
      return percB - percA;
    }
    return b.total_value - a.total_value;
  });

  // Tinggi chart proporsional
  const barHeight = 34;
  const chartHeight = Math.max(50, barHeight * dataChart.length);

  const numberFormatter = new Intl.NumberFormat("id-ID");
  const percentFormatter = new Intl.NumberFormat("id-ID", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const tableColumns = [
    { key: "divisi", header: "Divisi/Client", isRowHeader: true },
    { key: "total_user", header: labelTotalUser, align: "right" },
    { key: "user_sudah", header: labelSudah, align: "right" },
    {
      key: "user_sudah_pct",
      header: `${labelSudah} (%)`,
      align: "right",
    },
    { key: "user_kurang", header: labelKurang, align: "right" },
    {
      key: "user_kurang_pct",
      header: `${labelKurang} (%)`,
      align: "right",
    },
    { key: "user_belum", header: labelBelum, align: "right" },
    {
      key: "user_belum_pct",
      header: `${labelBelum} (%)`,
      align: "right",
    },
    { key: "total_value", header: labelTotal, align: "right" },
  ];
  const tableRows = dataChart.map((entry) => {
    const totalUser = entry.total_user ?? 0;
    const safeRatio = (value) =>
      totalUser ? Number(value || 0) / totalUser : 0;
    return {
      id: entry.divisi,
      divisi: entry.divisi || "-",
      total_user: numberFormatter.format(entry.total_user ?? 0),
      user_sudah: numberFormatter.format(entry.user_sudah ?? 0),
      user_sudah_pct: percentFormatter.format(safeRatio(entry.user_sudah)),
      user_kurang: numberFormatter.format(entry.user_kurang ?? 0),
      user_kurang_pct: percentFormatter.format(safeRatio(entry.user_kurang)),
      user_belum: numberFormatter.format(entry.user_belum ?? 0),
      user_belum_pct: percentFormatter.format(safeRatio(entry.user_belum)),
      total_value: numberFormatter.format(entry.total_value ?? 0),
    };
  });

  return (
    <div className="relative mt-8 w-full overflow-hidden rounded-3xl border border-sky-100/60 bg-white/70 p-6 shadow-[0_25px_55px_-30px_rgba(56,189,248,0.45)] backdrop-blur">
      <div className="pointer-events-none absolute -right-16 top-8 h-40 w-40 rounded-full bg-sky-200/50 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-12 top-0 h-16 bg-gradient-to-b from-white/60 to-transparent blur-2xl" />
      <div className="relative flex flex-col gap-6">
        <h3 className="text-center text-sm font-semibold uppercase tracking-[0.4em] text-sky-600">
          {title}
        </h3>
        <div className="w-full">
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart
              data={dataChart}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 0, bottom: 8 }}
              barCategoryGap="16%"
            >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.35)" />
            <XAxis
              type="number"
              tick={{ fill: "#1e293b", fontSize: 12 }}
              axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
              tickLine={{ stroke: "rgba(148,163,184,0.4)" }}
            />
            <YAxis
              dataKey="divisi"
              type="category"
              width={180}    // cukup besar untuk label panjang
              interval={0}
              tick={({ x, y, payload }) => (
                <>
                  <title>{payload.value}</title>
                  <text
                    x={x - 160} // mundur sedikit agar makin lepas dari bar
                    y={y + 10}
                    fontSize={12}
                    fill="#1f2937"
                    style={{ fontWeight: 500 }}
                    textAnchor="start"
                  >
                    {payload.value}
                  </text>
                </>
              )}
            />
            <Tooltip
              formatter={(value, name) =>
                [
                  value,
                  name === "total_user"
                    ? labelTotalUser
                    : name === "user_sudah"
                    ? labelSudah
                    : name === "user_kurang"
                    ? labelKurang
                    : name === "user_belum"
                    ? labelBelum
                    : name === "total_value"
                    ? labelTotal
                    : name,
                ]
              }
              labelFormatter={(label) => `Divisi: ${label}`}
              wrapperStyle={{ outline: "none" }}
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.95)",
                borderRadius: 16,
                borderColor: "rgba(56,189,248,0.35)",
                boxShadow: "0 20px 45px rgba(56,189,248,0.25)",
                color: "#0f172a",
              }}
            />
            <Legend
              wrapperStyle={{
                color: "#1d4ed8",
                paddingTop: 8,
              }}
            />
            {showTotalUser && (
              <Bar
                dataKey="total_user"
                fill="#0ea5e9"
                name={labelTotalUser}
                barSize={10}
              >
                <LabelList
                  dataKey="total_user"
                  position="right"
                  fontSize={10}
                />
              </Bar>
            )}
            <Bar dataKey="user_sudah" fill="#14b8a6" name={labelSudah} barSize={10}>
              <LabelList dataKey="user_sudah" position="right" fontSize={10} />
            </Bar>
            <Bar
              dataKey="user_kurang"
              fill="#38bdf8"
              name={labelKurang}
              barSize={10}
            >
              <LabelList dataKey="user_kurang" position="right" fontSize={10} />
            </Bar>
            <Bar dataKey="total_value" fill="#6366f1" name={labelTotal} barSize={10}>
              <LabelList dataKey="total_value" position="right" fontSize={10} />
            </Bar>
            <Bar dataKey="user_belum" fill="#94a3b8" name={labelBelum} barSize={10}>
              <LabelList dataKey="user_belum" position="right" fontSize={10} />
            </Bar>
          </BarChart>
          </ResponsiveContainer>
        </div>
        <ChartDataTable
          title={title}
          columns={tableColumns}
          rows={tableRows}
        />
      </div>
    </div>
  );
}
