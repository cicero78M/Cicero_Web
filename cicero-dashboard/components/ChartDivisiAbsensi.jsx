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
  title = "Absensi per Divisi/Satfung",
  orientation = "vertical",
  totalPost = 1,
  fieldJumlah = "jumlah_like",
  labelJumlah = "Like",
  // backwards compatibility
  totalIGPost,
  totalTiktokPost,
}) {
  const actualTotal =
    totalPost !== undefined
      ? totalPost
      : totalIGPost !== undefined
      ? totalIGPost
      : totalTiktokPost !== undefined
      ? totalTiktokPost
      : 1;
  const isZeroPost = (actualTotal || 0) === 0;

  // Grouping by divisi (satfung), tanpa POLSEK
  const divisiMap = {};
  users.forEach((u) => {
    const key = bersihkanSatfung(u.divisi || "LAINNYA");
    const jumlah = Number(u[fieldJumlah] || 0);
    const sudah = !isZeroPost && (jumlah > 0 || isException(u.exception));
    if (!divisiMap[key])
      divisiMap[key] = {
        divisi: key,
        user_sudah: 0,
        user_belum: 0,
        total_count: 0,
      };
    if (sudah) {
      divisiMap[key].user_sudah += 1;
      divisiMap[key].total_count += jumlah;
    } else divisiMap[key].user_belum += 1;
  });

  const dataChart = Object.values(divisiMap);

  // Dynamic height
  const minHeight = 220;
  const maxHeight = 420;
  const barHeight = orientation === "horizontal" ? 22 : 34;
  const chartHeight = Math.min(
    maxHeight,
    Math.max(minHeight, barHeight * dataChart.length)
  );

  const isHorizontal = orientation === "horizontal";

  return (
    <div className="w-full bg-white rounded-xl shadow p-0 md:p-0 mt-8">
      <div className="w-full px-2 pb-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={dataChart}
            layout={isHorizontal ? "vertical" : "horizontal"}
            margin={{
              top: 4,
              right: 4,
              left: 4, // left besar untuk horizontal
              bottom: 4,
            }}
            barCategoryGap="16%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            {isHorizontal ? (
              <>
                <XAxis type="number" fontSize={12} />
                <YAxis
                  dataKey="divisi"
                  type="category"
                  width={180}
                  interval={0}
                  tick={({ x, y, payload }) => (
                    <text
                      x={x - 8}
                      y={y + 10}
                      fontSize={13}
                      fill="#444"
                      style={{ fontWeight: 500 }}
                      textAnchor="start"
                    >
                      {payload.value}
                    </text>
                  )}
                />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="divisi"
                  type="category"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={70}
                />
                <YAxis type="number" fontSize={12} />
              </>
            )}
            <Tooltip
              formatter={(value, name) => [
                value,
                name === "user_sudah"
                  ? `User Sudah ${labelJumlah}`
                  : name === "user_belum"
                  ? `User Belum ${labelJumlah}`
                  : name === "total_count"
                  ? `Total ${labelJumlah}`
                  : name,
              ]}
              labelFormatter={(label) => `Divisi: ${label}`}
            />
            <Legend />
            <Bar dataKey="user_sudah" fill="#22c55e" name={`User Sudah ${labelJumlah}`}>
              <LabelList
                dataKey="user_sudah"
                position={isHorizontal ? "right" : "top"}
                fontSize={12}
              />
            </Bar>
            <Bar dataKey="total_count" fill="#2563eb" name={`Total ${labelJumlah}`}>
              <LabelList
                dataKey="total_count"
                position={isHorizontal ? "right" : "top"}
                fontSize={12}
              />
            </Bar>
            <Bar dataKey="user_belum" fill="#ef4444" name={`User Belum ${labelJumlah}`}>
              <LabelList
                dataKey="user_belum"
                position={isHorizontal ? "right" : "top"}
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
