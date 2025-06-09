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

export default function ChartDivisiAbsensi({ users, title = "Absensi Likes per Divisi/Satfung" }) {
  // Grouping by divisi (satfung), tanpa POLSEK
  const divisiMap = {};
  users.forEach(u => {
    const sudahLike = Number(u.jumlah_like) > 0 || isException(u.exception);
    const key = bersihkanSatfung(u.divisi || "LAINNYA");
    if (!divisiMap[key]) divisiMap[key] = { divisi: key, sudah: 0, belum: 0 };
    if (sudahLike) divisiMap[key].sudah += 1;
    else divisiMap[key].belum += 1;
  });
  const dataChart = Object.values(divisiMap);

// Di ChartDivisiAbsensi
const minHeight = 260; // lebih kecil jika chart sedikit
const maxHeight = 420; // batasi maksimum, agar tetap muat di 1 layar
const barHeight = 34;  // tinggi per bar/divisi, makin kecil = makin padat

const chartHeight = Math.min(
  maxHeight,
  Math.max(minHeight, barHeight * dataChart.length)
);

 return (
    <div className="w-full bg-white rounded-xl shadow p-0 md:p-0 mt-8">
      <h3 className="font-bold text-lg mb-4 px-6 pt-6">{title}</h3>
      <div className="w-full px-2 pb-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={dataChart}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="divisi" type="category" angle={-30} textAnchor="end" interval={0} height={70} />
            <YAxis type="number" />
            <Tooltip
              formatter={(value, name) =>
                [value, name === "sudah" ? "Sudah Like" : "Belum Like"]
              }
              labelFormatter={label => `Divisi: ${label}`}
            />
            <Legend />
            <Bar dataKey="sudah" fill="#22c55e" name="Sudah Like" isAnimationActive>
              <LabelList dataKey="sudah" position="top" />
            </Bar>
            <Bar dataKey="belum" fill="#ef4444" name="Belum Like" isAnimationActive>
              <LabelList dataKey="belum" position="top" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
