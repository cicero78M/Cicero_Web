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

function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}
function bersihkanSatfung(divisi = "") {
  return divisi.replace(/polsek\s*/i, "").trim();
}

export default function ChartHorizontal({
  users,
  title = "POLSEK - Absensi",
  totalPost = 1,
  fieldJumlah = "jumlah_like",
  labelJumlah = "Like",
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

  // Matrix 3 metrik per polsek
  const divisiMap = {};
  users.forEach(u => {
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
    } else {
      divisiMap[key].user_belum += 1;
    }
  });
  const dataChart = Object.values(divisiMap);

  // Tinggi chart proporsional
  const barHeight = 32;
  const chartHeight = Math.max(50, barHeight * dataChart.length);

  return (
    <div className="w-full bg-white rounded-xl shadow p-0 md:p-0 mt-8">
      <h3 className="font-bold text-lg mb-2 px-6 pt-6">{title}</h3>
      <div className="w-full px-2 pb-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={dataChart}
            layout="vertical"
            margin={{ top: 4, right: 20, left: 4, bottom: 4 }} // left besar!
            barCategoryGap="16%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={12} />
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
                    fill="#444"
                    style={{ fontWeight: 500 }}
                    textAnchor="start"
                  >
                    {payload.value}
                  </text>
                </>
              )}
            />
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
              labelFormatter={label => `Divisi: ${label}`}
            />
            <Legend />
            <Bar dataKey="user_sudah" fill="#22c55e" name={`User Sudah ${labelJumlah}`} barSize={10}>
              <LabelList dataKey="user_sudah" position="right" fontSize={10} />
            </Bar>
            <Bar dataKey="total_count" fill="#2563eb" name={`Total ${labelJumlah}`} barSize={10}>
              <LabelList dataKey="total_count" position="right" fontSize={10} />
            </Bar>
            <Bar dataKey="user_belum" fill="#ef4444" name={`User Belum ${labelJumlah}`} barSize={10}>
              <LabelList dataKey="user_belum" position="right" fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
