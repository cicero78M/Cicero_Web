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

// Bersihkan "POLSEK" dan awalan angka pada nama divisi/satfung
function bersihkanSatfung(divisi = "") {
  return divisi
    .replace(/polsek\s*/i, "") // hapus kata "POLSEK"
    .replace(/^[0-9.\-\s]+/, "") // hapus awalan angka/strip/titik
    .trim();
}

export default function ChartDivisiAbsensi({
  users,
  title = "Absensi Likes per Divisi/Satfung",
  orientation = "vertical", // default vertical
  totalPost = 1, // generic total post count so component can be reused
  totalIGPost, // backward compatibility
  fieldJumlah = "jumlah_like",
  labelSudah = "User Sudah Like",
  labelBelum = "User Belum Like",
  labelTotal = "Total Likes",
}) {
  const effectiveTotal =
    typeof totalPost !== "undefined" ? totalPost : totalIGPost;

  // Jika tidak ada post, semua user (termasuk exception) dianggap belum
  const isZeroPost = (effectiveTotal || 0) === 0;

  // Grouping by divisi (satfung), tanpa POLSEK
  const divisiMap = {};
  users.forEach((u) => {
    const key = bersihkanSatfung(u.divisi || "LAINNYA");
    // user dianggap sudah komentar/like hanya jika ada post
    const sudah =
      !isZeroPost && (Number(u[fieldJumlah]) > 0 || isException(u.exception));
    if (!divisiMap[key])
      divisiMap[key] = {
        divisi: key,
        user_sudah: 0,
        user_belum: 0,
        total_value: 0,
      };
    if (sudah) {
      divisiMap[key].user_sudah += 1;
      divisiMap[key].total_value += Number(u[fieldJumlah] || 0);
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
              formatter={(value, name) =>
                [
                  value,
                  name === "user_sudah"
                    ? labelSudah
                    : name === "user_belum"
                    ? labelBelum
                    : name === "total_value"
                    ? labelTotal
                    : name,
                ]
              }
              labelFormatter={(label) => `Divisi: ${label}`}
            />
            <Legend />
            <Bar dataKey="user_sudah" fill="#22c55e" name={labelSudah}>
              <LabelList
                dataKey="user_sudah"
                position={isHorizontal ? "right" : "top"}
                fontSize={12}
              />
            </Bar>
            <Bar dataKey="total_value" fill="#2563eb" name={labelTotal}>
              <LabelList
                dataKey="total_value"
                position={isHorizontal ? "right" : "top"}
                fontSize={12}
              />
            </Bar>
            <Bar dataKey="user_belum" fill="#ef4444" name={labelBelum}>
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
