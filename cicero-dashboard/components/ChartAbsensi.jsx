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

export default function ChartAbsensi({ data }) {
  // data: [{ nama, username, jumlah_like }]
  // Pilih label utama: nama || username || user_id
  const chartData = (data || []).map((u) => ({
    label: u.nama || u.username || u.user_id,
    jumlah_like: Number(u.jumlah_like || 0),
  }));

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h3 className="text-lg font-bold mb-3">Visualisasi Absensi Likes Instagram</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 5, bottom: 20 }}
          barSize={30}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            angle={-25}
            textAnchor="end"
            height={70}
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="jumlah_like" radius={[8, 8, 0, 0]}>
            <LabelList dataKey="jumlah_like" position="top" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

