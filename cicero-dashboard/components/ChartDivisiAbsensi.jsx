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

function isException(val) {
  return val === true || val === "true" || val === 1 || val === "1";
}

function bersihkanSatfung(divisi = "") {
  return divisi.replace(/polsek\s*/i, "").trim();
}

function YAxisTickFrame({ x, y, payload }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        x={-5}
        y={-12}
        width={110}
        height={24}
        rx={8}
        fill="#f1f5f9"
      />
      <text
        x={50}
        y={5}
        textAnchor="middle"
        fontSize={13}
        fontWeight={600}
        fill="#222"
        style={{ pointerEvents: "none" }}
      >
        {payload.value}
      </text>
    </g>
  );
}

export default function ChartDivisiAbsensi({ users }) {
  const divisiMap = {};
  users.forEach(u => {
    const sudahLike = Number(u.jumlah_like) > 0 || isException(u.exception);
    const key = bersihkanSatfung(u.divisi || "LAINNYA");
    if (!divisiMap[key]) divisiMap[key] = { divisi: key, sudah: 0, belum: 0 };
    if (sudahLike) divisiMap[key].sudah += 1;
    else divisiMap[key].belum += 1;
  });
  const dataChart = Object.values(divisiMap);

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8">
      <h3 className="font-bold text-lg mb-4">Absensi Likes per Divisi/Satfung</h3>
      <ResponsiveContainer width="100%" height={Math.max(300, dataChart.length * 38)}>
        <BarChart
          data={dataChart}
          layout="vertical"
          margin={{ top: 16, right: 40, left: 0, bottom: 16 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" allowDecimals={false} />
          <YAxis
            dataKey="divisi"
            type="category"
            width={130}
            tick={<YAxisTickFrame />}
          />
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
