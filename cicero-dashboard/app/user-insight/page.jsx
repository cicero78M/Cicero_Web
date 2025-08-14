"use client";
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { getUserDirectory } from "@/utils/api";
import { groupUsersByKelompok } from "@/utils/grouping";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import { useAuth } from "@/context/AuthContext";
import { User, Phone, Instagram, Music } from "lucide-react";

export default function UserInsightPage() {
  useRequireAuth();
  const { token, clientId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [summary, setSummary] = useState({
    total: 0,
    wa: 0,
    instagram: 0,
    tiktok: 0,
  });

  const [chartKelompok, setChartKelompok] = useState({
    BAG: [],
    SAT: [],
    "SI & SPKT": [],
    POLSEK: [],
  });

  useEffect(() => {
    async function fetchData() {
      if (!token || !clientId) {
        setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }
      try {
        const res = await getUserDirectory(token, clientId);
        const raw = res.data || res.users || res;
        const users = Array.isArray(raw) ? raw : [];

        const total = users.length;
        const wa = users.filter(
          (u) => u.whatsapp && String(u.whatsapp).trim() !== "",
        ).length;
        const instagram = users.filter(
          (u) => u.insta && String(u.insta).trim() !== "",
        ).length;
        const tiktok = users.filter(
          (u) => u.tiktok && String(u.tiktok).trim() !== "",
        ).length;
        setSummary({ total, wa, instagram, tiktok });

        const grouped = groupUsersByKelompok(users);

        const generateChartData = (arr) => {
          const map = {};
          arr.forEach((u) => {
            const div = (u.divisi || "LAINNYA").toUpperCase();
            const key = div.replace(/POLSEK\s*/i, "").trim();
            if (!map[key]) {
              map[key] = {
                divisi: key,
                total: 0,
                wa: 0,
                instagram: 0,
                tiktok: 0,
              };
            }
            map[key].total += 1;
            if (u.whatsapp && String(u.whatsapp).trim() !== "") map[key].wa += 1;
            if (u.insta && String(u.insta).trim() !== "")
              map[key].instagram += 1;
            if (u.tiktok && String(u.tiktok).trim() !== "")
              map[key].tiktok += 1;
          });
          return Object.values(map);
        };

        setChartKelompok({
          BAG: generateChartData(grouped.BAG),
          SAT: generateChartData(grouped.SAT),
          "SI & SPKT": generateChartData(grouped["SI & SPKT"]),
          POLSEK: generateChartData(grouped.POLSEK),
        });
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, clientId]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6 text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-5xl px-2 md:px-8 py-8">
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
              User Insight
            </h1>

            <div className="bg-gradient-to-tr from-blue-50 to-white rounded-2xl shadow flex flex-col md:flex-row items-stretch justify-between p-3 md:p-5 gap-2 md:gap-4 border">
              <SummaryItem
                label="Total User"
                value={summary.total}
                color="blue"
                icon={<User className="text-blue-400" />}
              />
              <Divider />
              <SummaryItem
                label="No WA Terisi"
                value={summary.wa}
                color="green"
                icon={<Phone className="text-green-500" />}
              />
              <Divider />
              <SummaryItem
                label="Username IG Terisi"
                value={summary.instagram}
                color="red"
                icon={<Instagram className="text-red-500" />}
              />
              <Divider />
              <SummaryItem
                label="Username TikTok Terisi"
                value={summary.tiktok}
                color="gray"
                icon={<Music className="text-gray-500" />}
              />
            </div>

            <div className="flex flex-col gap-6">
              <ChartBox title="BAG" data={chartKelompok.BAG} />
              <ChartBox title="SAT" data={chartKelompok.SAT} />
              <ChartBox title="SI & SPKT" data={chartKelompok["SI & SPKT"]} />
              <ChartBox
                title="POLSEK"
                data={chartKelompok.POLSEK}
                orientation="horizontal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartBox({ title, data, orientation = "vertical" }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-bold text-blue-700 mb-2 text-center">{title}</div>
      {data && data.length > 0 ? (
        <ContactChart data={data} orientation={orientation} />
      ) : (
        <div className="text-center text-gray-400 text-sm">Tidak ada data</div>
      )}
    </div>
  );
}

function ContactChart({ data, orientation }) {
  const isHorizontal = orientation === "horizontal";
  const barPosition = isHorizontal ? "right" : "top";
  const height = isHorizontal
    ? Math.max(50, 35 * data.length)
    : 300;

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          layout={isHorizontal ? "vertical" : "horizontal"}
          margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
          barCategoryGap="16%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          {isHorizontal ? (
            <XAxis type="number" />
          ) : (
            <XAxis dataKey="divisi" interval={0} />
          )}
          {isHorizontal ? (
            <YAxis dataKey="divisi" type="category" width={160} />
          ) : (
            <YAxis allowDecimals={false} />
          )}
          <Tooltip />
          <Legend />
          <Bar dataKey="total" name="Jumlah User" fill="#3b82f6">
            <LabelList dataKey="total" position={barPosition} fontSize={12} />
          </Bar>
          <Bar dataKey="wa" name="No WA Terisi" fill="#10b981">
            <LabelList dataKey="wa" position={barPosition} fontSize={12} />
          </Bar>
          <Bar dataKey="instagram" name="Username IG Terisi" fill="#e1306c">
            <LabelList dataKey="instagram" position={barPosition} fontSize={12} />
          </Bar>
          <Bar dataKey="tiktok" name="Username TikTok Terisi" fill="#000000">
            <LabelList dataKey="tiktok" position={barPosition} fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SummaryItem({ label, value, color = "gray", icon }) {
  const colorMap = {
    blue: "text-blue-700",
    green: "text-green-600",
    red: "text-red-500",
    gray: "text-gray-700",
  };
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-2">
      <div className="mb-1">{icon}</div>
      <div className={`text-3xl md:text-4xl font-bold ${colorMap[color]}`}>
        {value}
      </div>
      <div className="text-xs md:text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wide text-center">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="hidden md:block w-px bg-gray-200 mx-2 my-2" />;
}

