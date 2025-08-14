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

function bersihkanSatfung(divisi = "") {
  return divisi
    .replace(/polsek\s*/i, "")
    .replace(/^[0-9.\-\s]+/, "")
    .trim();
}

export default function ChartUserFields({ users = [], orientation = "vertical" }) {
  const divisiMap = {};
  users.forEach((u) => {
    const key = bersihkanSatfung(u.divisi || "LAINNYA");
    if (!divisiMap[key]) {
      divisiMap[key] = { divisi: key, total: 0, wa: 0, instagram: 0, tiktok: 0 };
    }
    divisiMap[key].total += 1;
    if (u.whatsapp && String(u.whatsapp).trim() !== "") divisiMap[key].wa += 1;
    if (u.insta && String(u.insta).trim() !== "") divisiMap[key].instagram += 1;
    if (u.tiktok && String(u.tiktok).trim() !== "") divisiMap[key].tiktok += 1;
  });
  const dataChart = Object.values(divisiMap);

  if (orientation === "horizontal") {
    const barHeight = 32;
    const chartHeight = Math.max(50, barHeight * dataChart.length);
    return (
      <div className="w-full px-2 pb-4">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={dataChart}
            layout="vertical"
            margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
            barCategoryGap="16%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              dataKey="divisi"
              type="category"
              width={180}
              interval={0}
              tick={({ x, y, payload }) => (
                <>
                  <title>{payload.value}</title>
                  <text
                    x={x - 160}
                    y={y + 10}
                    fontSize={12}
                    fill="#444"
                    style={{ fontWeight: 500 }}
                    textAnchor="start"
                  >
                    {payload.value}
                  </text>
                </>
              )}
            />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="Jumlah User" fill="#3b82f6" barSize={10}>
              <LabelList dataKey="total" position="right" fontSize={10} />
            </Bar>
            <Bar dataKey="wa" name="No WA Terisi" fill="#10b981" barSize={10}>
              <LabelList dataKey="wa" position="right" fontSize={10} />
            </Bar>
            <Bar
              dataKey="instagram"
              name="Username IG Terisi"
              fill="#e1306c"
              barSize={10}
            >
              <LabelList dataKey="instagram" position="right" fontSize={10} />
            </Bar>
            <Bar dataKey="tiktok" name="Username TikTok Terisi" fill="#000000" barSize={10}>
              <LabelList dataKey="tiktok" position="right" fontSize={10} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  const minHeight = 220;
  const maxHeight = 420;
  const barHeight = 34;
  const chartHeight = Math.min(
    maxHeight,
    Math.max(minHeight, barHeight * dataChart.length)
  );
  return (
    <div className="w-full px-2 pb-4">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={dataChart}
          margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
          barCategoryGap="16%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="divisi"
            angle={-30}
            textAnchor="end"
            interval={0}
            height={70}
            tick={{ fontSize: 15, fontWeight: 700, fill: "#1e293b" }}
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" name="Jumlah User" fill="#3b82f6">
            <LabelList dataKey="total" position="top" fontSize={12} />
          </Bar>
          <Bar dataKey="wa" name="No WA Terisi" fill="#10b981">
            <LabelList dataKey="wa" position="top" fontSize={12} />
          </Bar>
          <Bar
            dataKey="instagram"
            name="Username IG Terisi"
            fill="#e1306c"
          >
            <LabelList dataKey="instagram" position="top" fontSize={12} />
          </Bar>
          <Bar dataKey="tiktok" name="Username TikTok Terisi" fill="#000000">
            <LabelList dataKey="tiktok" position="top" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

