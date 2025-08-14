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
  totalIGPost, // fallback untuk instagram (kompatibilitas lama)
  totalTiktokPost, // fallback untuk tiktok (kompatibilitas lama)
  fieldJumlah = "jumlah_like", // bisa "jumlah_komentar" untuk tiktok
  labelSudah = "User Sudah Komentar",
  labelBelum = "User Belum Komentar",
  labelTotal = "Total Komentar",
  groupBy = "divisi",
  orientation = "vertical",
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

  // Group by divisi atau client_id jika diminta
  const divisiMap = {};
  const labelKey = groupBy === "client_id" ? "client_name" : "divisi";
  users.forEach((u) => {
    const idKey = String(
      u.client_id ?? u.clientId ?? u.clientID ?? u.client ?? "LAINNYA",
    );
    const key =
      groupBy === "client_id"
        ? idKey
        : bersihkanSatfung(u.divisi || "LAINNYA");
    const display =
      groupBy === "client_id"
        ? bersihkanSatfung(
            u.divisi ||
              u.nama_client ||
              u.client_name ||
              u.client ||
              "LAINNYA",
          )
        : key;
    const jumlah = Number(u[fieldJumlah] || 0);
    const sudah =
      !isZeroPost && (jumlah >= effectiveTotal * 0.5 || isException(u.exception));
    const nilai = isException(u.exception) ? maxJumlahLike : jumlah;
    if (!divisiMap[key])
      divisiMap[key] = {
        [labelKey]: display,
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

  const dataChart = Object.values(divisiMap).sort(
    (a, b) => b.total_value - a.total_value
  );

  // Dynamic height
  const isHorizontal = orientation === "horizontal";
  const barHeight = isHorizontal ? 40 : 34;
  // Ensure horizontal charts (used in direktorat views) remain legible
  // by providing a larger minimum height and capping extreme values.
  const minHeight = isHorizontal ? 300 : 220;
  const maxHeight = isHorizontal ? 900 : 420;
  const chartHeight = Math.min(
    maxHeight,
    Math.max(minHeight, barHeight * dataChart.length),
  );

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
              left: 4,
              bottom: 4,
            }}
            barCategoryGap={isHorizontal ? "30%" : "16%"}
          >
            <CartesianGrid strokeDasharray="3 3" />
            {isHorizontal ? (
              <XAxis type="number" fontSize={12} />
            ) : (
              <XAxis
                dataKey={labelKey}
                type="category"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={70}
                tick={{ fontSize: 15, fontWeight: 700, fill: "#1e293b" }}
              />
            )}
            {isHorizontal ? (
              <YAxis
                dataKey={labelKey}
                type="category"
                width={200}
                interval={0}
                tick={({ x, y, payload }) => (
                  <>
                    <title>{payload.value}</title>
                    <text
                      x={x - 180}
                      y={y + 10}
                      fontSize={12}
                      fontWeight={700}
                      fill="#1e293b"
                      textAnchor="start"
                    >
                      {payload.value}
                    </text>
                  </>
                )}
              />
            ) : (
              <YAxis type="number" fontSize={12} />
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
              labelFormatter={(label) =>
                `${labelKey === "client_name" ? "Client" : "Divisi"}: ${label}`
              }
            />
            <Legend />
            <Bar
              dataKey="user_sudah"
              fill="#22c55e"
              name={labelSudah}
              barSize={isHorizontal ? 20 : undefined}
            >
              <LabelList
                dataKey="user_sudah"
                position={isHorizontal ? "right" : "top"}
                fontSize={isHorizontal ? 10 : 12}
              />
            </Bar>
            <Bar
              dataKey="total_value"
              fill="#2563eb"
              name={labelTotal}
              barSize={isHorizontal ? 20 : undefined}
            >
              <LabelList
                dataKey="total_value"
                position={isHorizontal ? "right" : "top"}
                fontSize={isHorizontal ? 10 : 12}
              />
            </Bar>
            <Bar
              dataKey="user_belum"
              fill="#ef4444"
              name={labelBelum}
              barSize={isHorizontal ? 20 : undefined}
            >
              <LabelList
                dataKey="user_belum"
                position={isHorizontal ? "right" : "top"}
                fontSize={isHorizontal ? 10 : 12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
