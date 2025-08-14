"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getUserDirectory } from "@/utils/api";
import { groupUsersByKelompok } from "@/utils/grouping";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import { useAuth } from "@/context/AuthContext";

export default function UserInsightPage() {
  useRequireAuth();
  const { token, clientId } = useAuth();
  const [dataChart, setDataChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const grouped = groupUsersByKelompok(users);
        const chart = Object.entries(grouped).map(([kelompok, arr]) => ({
          kelompok,
          total: arr.length,
          wa: arr.filter((u) => u.whatsapp && String(u.whatsapp).trim() !== "").length,
          instagram: arr.filter((u) => u.insta && String(u.insta).trim() !== "").length,
          tiktok: arr.filter((u) => u.tiktok && String(u.tiktok).trim() !== "").length,
        }));
        setDataChart(chart);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, clientId]);

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6 text-red-500 font-bold">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">User Insight</h1>
        <div className="w-full h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kelompok" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Jumlah User" fill="#3b82f6" />
              <Bar dataKey="wa" name="No WA Terisi" fill="#10b981" />
              <Bar dataKey="instagram" name="Username IG Terisi" fill="#e1306c" />
              <Bar dataKey="tiktok" name="Username TikTok Terisi" fill="#000000" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

