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
  title = "Absensi Likes per Divisi/Satfung",  totalIGPost = 0, orientation = "vertical", // default vertical

}) {
  // Grouping by divisi (satfung), tanpa POLSEK
// Sebelumnya dapatkan totalIGPost dari stats/API
const isZeroPost = (totalIGPost || 0) === 0;

const divisiMap = {};
users.forEach(u => {
  const key = bersihkanSatfung(u.divisi || "LAINNYA");
  // Jika IG POST 0, tidak ada yang sudahLike!
  const sudahLike = !isZeroPost && (Number(u.jumlah_like) > 0 || isException(u.exception));
  if (!divisiMap[key]) divisiMap[key] = {
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

  // Di ChartDivisiAbsensi
  const minHeight = 260; // lebih kecil jika chart sedikit
  const maxHeight = 420; // batasi maksimum, agar tetap muat di 1 layar
  const barHeight = 34; // tinggi per bar/divisi, makin kecil = makin padat

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
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            {isHorizontal ? (
              <>
                <XAxis type="number" />
                <YAxis dataKey="divisi" type="category" width={140} />
              </>
            ) : (
              <>
                <XAxis dataKey="divisi" type="category" angle={-30} textAnchor="end" interval={0} height={70} />
                <YAxis type="number" />
              </>
            )}
            <Tooltip
              formatter={(value, name) =>
                [value,
                  name === "user_sudah" ? "User Sudah Like"
                  : name === "user_belum" ? "User Belum Like"
                  : name === "total_like" ? "Total Likes" : name
                ]
              }
              labelFormatter={label => `Divisi: ${label}`}
            />
            <Legend />
            <Bar dataKey="user_sudah" fill="#22c55e" name="User Sudah Like">
              <LabelList dataKey="user_sudah" position={isHorizontal ? "right" : "top"} />
            </Bar>
            <Bar dataKey="total_like" fill="#2563eb" name="Total Likes">
              <LabelList dataKey="total_like" position={isHorizontal ? "right" : "top"} />
            </Bar>
            <Bar dataKey="user_belum" fill="#ef4444" name="User Belum Like">
              <LabelList dataKey="user_belum" position={isHorizontal ? "right" : "top"} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
