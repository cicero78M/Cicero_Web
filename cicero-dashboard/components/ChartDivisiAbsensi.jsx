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
  title = "Absensi Komentar TikTok per Divisi/Satfung",
  totalPost, // jumlah post untuk perbandingan, generic
  totalIGPost,   // fallback untuk instagram (kompatibilitas lama)
  totalTiktokPost, // fallback untuk tiktok (kompatibilitas lama)
  fieldJumlah = "jumlah_like", // bisa "jumlah_komentar" untuk tiktok
  labelSudah = "User Sudah Komentar",
  labelBelum = "User Belum Komentar",
  labelTotal = "Total Komentar",
}) {
  // Fallback backward compatibility
  const effectiveTotal =
    typeof totalPost !== "undefined"
      ? totalPost
      : typeof totalTiktokPost !== "undefined"
      ? totalTiktokPost
      : totalIGPost;

  // Jika tidak ada post, semua user dianggap belum
  const isZeroPost = (effectiveTotal || 0) === 0;

  // Cari nilai jumlah_like tertinggi dari user non-exception
  const maxJumlahLike = Math.max(
    0,
    ...users
      .filter((u) => !isException(u.exception))
      .map((u) => Number(u[fieldJumlah] || 0))
  );

  // Group by divisi
  const divisiMap = {};
  users.forEach((u) => {
    const key = bersihkanSatfung(u.divisi || "LAINNYA");
    const jumlah = Number(u[fieldJumlah] || 0);
    const sudah =
      !isZeroPost && (jumlah >= effectiveTotal*0.5 || isException(u.exception));
    const nilai = isException(u.exception) ? maxJumlahLike : jumlah;
    if (!divisiMap[key])
      divisiMap[key] = {
        divisi: key,
        user_sudah: 0,
        user_belum: 0,
        total_value: 0,
      };
    divisiMap[key].total_value += nilai;
    if (sudah) {
      divisiMap[key].user_sudah += 1;
    } else {
      divisiMap[key].user_belum += 1;
    }
  });

  const dataChart = Object.values(divisiMap);

  // Dynamic height
  const minHeight = 220;
  const maxHeight = 420;
  const barHeight = 34;
  const chartHeight = Math.min(
    maxHeight,
    Math.max(minHeight, barHeight * dataChart.length)
  );

  return (
    <div className="w-full bg-white rounded-xl shadow p-0 md:p-0 mt-8">
      <div className="w-full px-2 pb-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={dataChart}
            layout="horizontal" // Hanya vertical
            margin={{
              top: 4,
              right: 4,
              left: 4,
              bottom: 4,
            }}
            barCategoryGap="16%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="divisi"
              type="category"
              angle={-30}
              textAnchor="end"
              interval={0}
              height={70}
              tick={{ fontSize: 15, fontWeight: 700, fill: "#1e293b" }}
            />
            <YAxis type="number" fontSize={12} />
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
              <LabelList dataKey="user_sudah" position="top" fontSize={12} />
            </Bar>
            <Bar dataKey="total_value" fill="#2563eb" name={labelTotal}>
              <LabelList dataKey="total_value" position="top" fontSize={12} />
            </Bar>
            <Bar dataKey="user_belum" fill="#ef4444" name={labelBelum}>
              <LabelList dataKey="user_belum" position="top" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
