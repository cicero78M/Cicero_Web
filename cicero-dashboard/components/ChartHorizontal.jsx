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
  title = "POLSEK - Absensi Likes",
}) {
  // Matrix 3 metrik per polsek
  const divisiMap = {};
  users.forEach(u => {
    const sudahLike = Number(u.jumlah_like) > 0 || isException(u.exception);
    const key = bersihkanSatfung(u.divisi || "LAINNYA");
    if (!divisiMap[key])
      divisiMap[key] = {
        divisi: key,
        user_sudah: 0,
        user_belum: 0,
        total_like: 0,
      };
    if (sudahLike) {
      divisiMap[key].user_sudah += 1;
      divisiMap[key].total_like += Number(u.jumlah_like || 0);
    } else {
      divisiMap[key].user_belum += 1;
    }
  });
  const dataChart = Object.values(divisiMap);

  // Tinggi chart selalu proporsional
  const barHeight = 22; // cukup padat, bisa dinaikkan/dikurangi
  const chartHeight = Math.max(60, barHeight * dataChart.length);

  // Fungsi potong label jika panjang
  function trimLabel(label, len = 18) {
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
            margin={{ top: 8, right: 30, left: 16, bottom: 12 }}
            barCategoryGap="12%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" fontSize={12} />
            <YAxis
              dataKey="divisi"
              type="category"
              width={140}
              interval={0} // <-- SEMUA LABEL DITAMPILKAN
              tick={({ x, y, payload }) => (
                <>
                  <title>{payload.value}</title>
                  <text
                    x={x}
                    y={y + 10}
                    fontSize={12}
                    fill="#444"
                    style={{ fontWeight: 500 }}
                  >
                    {trimLabel(payload.value)}
                  </text>
                </>
              )}
            />
            <Tooltip
              formatter={(value, name) =>
                [
                  value,
                  name === "user_sudah" ? "User Sudah Like"
                  : name === "user_belum" ? "User Belum Like"
                  : name === "total_like" ? "Total Likes" : name,
                ]
              }
              labelFormatter={label => `Divisi: ${label}`}
            />
            <Legend />
            <Bar dataKey="user_sudah" fill="#22c55e" name="User Sudah Like" barSize={14}>
              <LabelList dataKey="user_sudah" position="right" fontSize={12} />
            </Bar>
            <Bar dataKey="total_like" fill="#2563eb" name="Total Likes" barSize={14}>
              <LabelList dataKey="total_like" position="right" fontSize={12} />
            </Bar>
            <Bar dataKey="user_belum" fill="#ef4444" name="User Belum Like" barSize={14}>
              <LabelList dataKey="user_belum" position="right" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
