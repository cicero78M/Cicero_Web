"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";

// Helper: handle boolean/string/number for exception
function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

// Bersihkan "POLSEK" pada nama divisi/satfung
function bersihkanSatfung(divisi = "") {
  return divisi.replace(/polsek\s*/i, "").trim();
}

export default function ChartDivisiAbsensi({
  users,
  title = "Absensi Likes per Divisi/Satfung",
  orientation = "vertical",
}) {
  // Grouping logic
  const divisiMap = {};
  users.forEach(u => {
    const sudahLike = Number(u.jumlah_like) > 0 || isException(u.exception);
    const key = bersihkanSatfung(u.divisi || "LAINNYA");
    if (!divisiMap[key]) divisiMap[key] = {
      divisi: key,
      total_like: 0
    };
    if (sudahLike) {
      divisiMap[key].total_like += Number(u.jumlah_like || 0);
    }
  });
  const dataChart = Object.values(divisiMap);

  const isHorizontal = orientation === "horizontal";
  // Untuk horizontal POLSEK:
  const minHeight = 380;
  const maxHeight = 580;
  const barHeight = 26;
  const chartHeight = Math.min(
    maxHeight,
    Math.max(minHeight, barHeight * dataChart.length)
  );

  const needsScroll = isHorizontal && dataChart.length > 12;

  // Potong label jika panjang
  function trimLabel(label, len = 16) {
    return label.length > len ? label.slice(0, len) + "…" : label;
  }

  return (
    <div className="w-full bg-white rounded-xl shadow p-0 md:p-0 mt-8">
      <h3 className="font-bold text-lg mb-4 px-6 pt-6">{title}</h3>
      <div
        className={`w-full px-2 pb-4${needsScroll ? " overflow-y-auto" : ""}`}
        style={needsScroll ? { maxHeight: maxHeight + 80 } : {}}
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={dataChart}
            layout={isHorizontal ? "vertical" : "horizontal"}
            margin={{ top: 16, right: 32, left: 16, bottom: 16 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            {isHorizontal ? (
              <>
                <XAxis type="number" />
                <YAxis
                  dataKey="divisi"
                  type="category"
                  width={180}
                  tick={({ x, y, payload }) => (
                    <title>
                      {payload.value}
                    </title>,
                    <text
                      x={x}
                      y={y + 8}
                      width={120}
                      fontSize={13}
                      fill="#444"
                      style={{ fontWeight: 500 }}
                    >
                      {trimLabel(payload.value)}
                    </text>
                  )}
                />
              </>
            ) : (
              <>
                <XAxis dataKey="divisi" type="category" angle={-30} textAnchor="end" interval={0} height={70} />
                <YAxis type="number" />
              </>
            )}
            <Tooltip
              formatter={(value) => [value, "Total Likes"]}
              labelFormatter={label => `Divisi: ${label}`}
            />
            <Legend />
            <Bar
              dataKey="total_like"
              fill="#2563eb"
              name="Total Likes"
              isAnimationActive
              barSize={18}
            >
              <LabelList dataKey="total_like" position={isHorizontal ? "right" : "top"} fontSize={13} fill="#2563eb" fontWeight={700} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

