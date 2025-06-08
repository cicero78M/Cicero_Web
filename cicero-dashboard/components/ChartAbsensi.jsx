// components/ChartAbsensi.jsx
"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function ChartAbsensi({ data }) {
  // data: [{ nama_user: "Asep", jumlah_like: 10 }, ...]
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="nama_user" />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="jumlah_like" />
      </BarChart>
    </ResponsiveContainer>
  );
}
