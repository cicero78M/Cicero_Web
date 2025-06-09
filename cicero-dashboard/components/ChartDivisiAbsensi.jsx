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
  title = "Absensi Likes per Divisi/Satfung",
  orientation = "vertical", // default vertical
}) {
  const divisiMap = {};
  users.forEach((u) => {
    const sudahLike = Number(u.jumlah_like) > 0 || isException(u.exception);
    const key = bersihkanSatfung(u.divisi || "LAINNYA");
    if (!divisiMap[key])
      divisiMap[key] = {
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

  // Dinamis chart height & scroll
  const isHorizontal = orientation === "horizontal";
  const banyakData = dataChart.length;
  const minHeight = isHorizontal ? 400 : 260;
  const maxHeight = isHorizontal ? 900 : 420;
  const barHeight = isHorizontal ? 48 : 34;
  const chartHeight = Math.min(
    maxHeight,
    Math.max(minHeight, barHeight * banyakData)
  );

  const needsScroll = isHorizontal && banyakData > 15;

  return (
    <div className="w-full bg-white rounded-xl shadow p-0 md:p-0 mt-8">
      <h3 className="font-bold text-lg mb-4 px-6 pt-6">{title}</h3>
      <div
        className={`w-full px-2 pb-4${needsScroll ? " overflow-y-auto" : ""}`}
        style={needsScroll ? { maxHeight: maxHeight + 80 } : {}}
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={dataChart}
            layout={isHorizontal ? "vertical" : "horizontal"}
            margin={{ top: 20, right: 40, left: 40, bottom: 60 }}
            barCategoryGap="18%"
          >
            <CartesianGrid strokeDasharray="3 3" />
            {isHorizontal ? (
              <>
                <XAxis type="number" />
                <YAxis dataKey="divisi" type="category" width={200} />
              </>
            ) : (
              <>
                <XAxis
                  dataKey="divisi"
                  type="category"
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                  height={70}
                />
                <YAxis type="number" />
              </>
            )}
            <Tooltip
              formatter={(value, name) => [
                value,
                name === "user_sudah"
                  ? "User Sudah Like"
                  : name === "user_belum"
                  ? "User Belum Like"
                  : name === "total_like"
                  ? "Total Likes"
                  : name,
              ]}
              labelFormatter={(label) => `Divisi: ${label}`}
            />
            <Legend />
            <Bar dataKey="user_sudah" fill="#22c55e" name="User Sudah Like">
              <LabelList
                dataKey="user_sudah"
                position={isHorizontal ? "right" : "top"}
                fontSize={14}
              />
            </Bar>
            <Bar dataKey="total_like" fill="#2563eb" name="Total Likes">
              <LabelList
                dataKey="total_like"
                position={isHorizontal ? "right" : "top"}
                fontSize={14}
              />
            </Bar>
            <Bar dataKey="user_belum" fill="#ef4444" name="User Belum Like">
              <LabelList
                dataKey="user_belum"
                position={isHorizontal ? "right" : "top"}
                fontSize={14}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
