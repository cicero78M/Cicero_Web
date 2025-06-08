"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";

// Helper: Format angka dengan satuan K
function formatK(val) {
  if (val == null) return "";
  return `${Math.abs(val) / 1000}k`;
}

// Tooltip formatter
function tooltipFormatter(value) {
  return value.toLocaleString();
}

// Fungsi untuk bersihkan label satfung
function bersihkanSatfung(divisi = "") {
  return divisi.replace(/polsek\s*/i, "").trim();
}

// Helper: handle boolean/string/number for exception
function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

/**
 * @param {Array} users - Array user [{divisi, jumlah_like, exception, prev_jumlah_like}]
 *   Gunakan prev_jumlah_like untuk nilai kemarin (atau mapping dari data Anda)
 */
export default function ChartDivisiAbsensi({
  users = [],
  leftLabel = "Sudah Like Hari Ini",
  rightLabel = "Sudah Like Kemarin",
  title = "Analisis Absensi Likes IG per Satfung"
}) {
  // Mapping: Gabungkan data per divisi untuk hari ini dan kemarin (previous)
  // Asumsi: users = [{ divisi, jumlah_like, prev_jumlah_like, exception }]
  //        prev_jumlah_like = jumlah yang sudah like kemarin

  const divisiMap = {};
  users.forEach(u => {
    const key = bersihkanSatfung(u.divisi || "LAINNYA");
    if (!divisiMap[key]) {
      divisiMap[key] = {
        divisi: key,
        current: 0,
        previous: 0,
      };
    }
    // Hari ini: Sudah Like (jumlah_like>0 atau exception)
    if (Number(u.jumlah_like) > 0 || isException(u.exception)) {
      divisiMap[key].current += 1;
    }
    // Kemarin (harus ada field prev_jumlah_like di users atau mapping lain)
    // Jika tidak ada, diisi 0 saja
    if (u.prev_jumlah_like !== undefined && (Number(u.prev_jumlah_like) > 0 || isException(u.prev_exception))) {
      divisiMap[key].previous += 1;
    }
  });

  // Jika tidak ada data previous, chart hanya tampil satu sisi (current)
  const dataChart = Object.values(divisiMap);

  // Mirrored: current (left) dibalik minus agar ke kiri
  const formatted = dataChart.map(d => ({
    ...d,
    left: -Math.abs(d.current),
    right: d.previous,
  }));

  // Cari max abs value untuk X domain
  const maxVal = Math.max(
    ...formatted.map(d => Math.abs(d.left)),
    ...formatted.map(d => Math.abs(d.right)),
    2
  );

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8">
      <h3 className="font-bold text-lg mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height={Math.max(300, formatted.length * 48)}>
        <BarChart
          data={formatted}
          layout="vertical"
          margin={{ top: 24, right: 48, left: 48, bottom: 24 }}
          barCategoryGap="25%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[-maxVal * 1.1, maxVal * 1.1]}
            tickFormatter={formatK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            dataKey="divisi"
            type="category"
            width={170}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 15, fontWeight: 700, fill: "#222" }}
          />
          <Tooltip
            formatter={tooltipFormatter}
            labelFormatter={label => `Divisi: ${label}`}
          />
          {/* Bar Kiri (current) */}
          <Bar
            dataKey="left"
            name={leftLabel}
            fill="#3498db"
            radius={[0, 8, 8, 0]}
            isAnimationActive
          >
            <LabelList
              dataKey="left"
              position="insideLeft"
              formatter={v => formatK(v)}
              style={{ fill: "#fff", fontWeight: "bold" }}
            />
          </Bar>
          {/* Bar Kanan (previous) */}
          <Bar
            dataKey="right"
            name={rightLabel}
            fill="#fd7e14"
            radius={[8, 0, 0, 8]}
            isAnimationActive
          >
            <LabelList
              dataKey="right"
              position="insideRight"
              formatter={v => formatK(v)}
              style={{ fill: "#fff", fontWeight: "bold" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-between mt-3 text-sm font-semibold">
        <span className="text-blue-700">{leftLabel}</span>
        <span className="text-orange-600">{rightLabel}</span>
      </div>
    </div>
  );
}
