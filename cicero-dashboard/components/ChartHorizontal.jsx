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
} from "recharts";

function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}
function bersihkanSatfung(divisi = "") {
  return divisi.replace(/polsek\s*/i, "").trim();
}

export default function ChartHorizontal({
  users,
  title = "POLSEK - Total Likes User",
}) {
  // Hanya metrik total_like untuk tiap polsek
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

  // Tinggi chart selalu proporsional
  const barHeight = 18; // bisa disesuaikan
  const chartHeight = Math.max(40, barHeight * dataChart.length);

  // Fungsi potong label
  function trimLabel(label, len = 14) {
    return label.length > len ? label.slice(0, len) + "…" : label;
  }

  return (
    <div className="w-full bg-white rounded-xl shadow p-0 md:p-0 mt-8">
      <h3 className="font-bold text-lg mb-4 px-6 pt-6">{title}</h3>
      <div className="w-full px-2 pb-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={dataChart}
            layout="vertical"
            margin={{ top: 8, right: 20, left: 12, bottom: 12 }}
            barCategoryGap="10%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={11} />
            <YAxis
              dataKey="divisi"
              type="category"
              width={110}
              tick={({ x, y, payload }) => (
                <>
                  <title>{payload.value}</title>
                  <text
                    x={x}
                    y={y + 7}
                    fontSize={11}
                    fill="#444"
                    style={{ fontWeight: 500 }}
                  >
                    {trimLabel(payload.value)}
                  </text>
                </>
              )}
            />
            <Tooltip
              formatter={(value) => [value, "Total Likes"]}
              labelFormatter={label => `Divisi: ${label}`}
            />
            <Bar
              dataKey="total_like"
              fill="#2563eb"
              name="Total Likes"
              isAnimationActive
              barSize={12}
            >
              <LabelList dataKey="total_like" position="right" fontSize={11} fill="#2563eb" fontWeight={700} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
