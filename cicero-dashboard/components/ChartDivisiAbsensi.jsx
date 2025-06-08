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

export default function ChartDivisiAbsensi({ users }) {
  // users: array [{ divisi, jumlah_like, exception }]
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
    <div className="bg-white rounded-xl shadow p-4 mt-8">
      <h3 className="font-bold text-lg mb-3">Visualisasi Absensi Likes per Divisi</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={dataChart} margin={{ top: 20, right: 40, left: 0, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="divisi" angle={-20} textAnchor="end" interval={0} height={60} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="sudah" fill="#22c55e" name="Sudah Like">
            <LabelList dataKey="sudah" position="top" />
          </Bar>
          <Bar dataKey="belum" fill="#ef4444" name="Belum Like">
            <LabelList dataKey="belum" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}
