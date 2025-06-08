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

// Utility: handle boolean/string/number for exception
function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

export default function ChartDivisiAbsensi({ users }) {
  // Grouping by divisi
  const divisiMap = {};
  users.forEach(u => {
    const sudahLike = Number(u.jumlah_like) > 0 || isException(u.exception);
    const key = u.divisi || "LAINNYA";
    if (!divisiMap[key]) divisiMap[key] = { divisi: key, sudah: 0, belum: 0 };
    if (sudahLike) divisiMap[key].sudah += 1;
    else divisiMap[key].belum += 1;
  });
  const dataChart = Object.values(divisiMap);

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8">
      <h3 className="font-bold text-lg mb-4">Absensi Likes per Divisi/Satfung</h3>
      <ResponsiveContainer width="100%" height={Math.max(300, dataChart.length * 36)}>
        <BarChart
          data={dataChart}
          layout="vertical"
          margin={{ top: 16, right: 40, left: 0, bottom: 16 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis dataKey="divisi" type="category" width={110} />
          <Tooltip />
          <Legend />
          <Bar dataKey="sudah" fill="#22c55e" name="Sudah Like" isAnimationActive>
            <LabelList dataKey="sudah" position="right" />
          </Bar>
          <Bar dataKey="belum" fill="#ef4444" name="Belum Like" isAnimationActive>
            <LabelList dataKey="belum" position="right" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
