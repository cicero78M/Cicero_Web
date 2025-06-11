"use client";
import { useEffect, useState } from "react";
import { getTikTokComments } from "@/utils/api";
import Loader from "@/components/Loader";
import TikTokCommentsTable from "@/components/TikTokCommentsTable";

export default function TikTokCommentsTrackingPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState("harian");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchComments() {
      try {
        const res = await getTikTokComments(token);
        const data = res.data || res.comments || res;
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, []);

  const filteredComments = comments.filter((c) => {
    if (!c.timestamp) return true;
    const d = new Date(c.timestamp);
    const now = new Date();
    if (periode === "harian") {
      return d.toDateString() === now.toDateString();
    }
    return (
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
  });

  const totalComments = filteredComments.length;
  const uniqueUsers = new Set(filteredComments.map((c) => c.username)).size;
  const avgPerUser = uniqueUsers
    ? (totalComments / uniqueUsers).toFixed(1)
    : 0;

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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12">
      <div className="w-full max-w-4xl px-2 md:px-8">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">TikTok Comments Tracking</h1>
        <div className="bg-gradient-to-tr from-blue-50 to-white rounded-2xl shadow flex flex-col md:flex-row items-stretch justify-between p-3 md:p-5 gap-2 md:gap-4 border mb-4">
          <SummaryItem
            label="Total Comments"
            value={totalComments}
            color="blue"
            icon={<span className="inline-block text-blue-400 text-2xl">💬</span>}
          />
          <Divider />
          <SummaryItem
            label="Unique Users"
            value={uniqueUsers}
            color="green"
            icon={<span className="inline-block text-green-500 text-2xl">👥</span>}
          />
          <Divider />
          <SummaryItem
            label="Avg per User"
            value={avgPerUser}
            color="gray"
            icon={<span className="inline-block text-gray-400 text-2xl">📈</span>}
          />
        </div>
        <div className="flex items-center justify-end gap-3 mb-4">
          <span
            className={
              periode === "harian" ? "font-semibold text-blue-700" : "text-gray-400"
            }
          >
            Hari Ini
          </span>
          <button
            className={`w-12 h-6 rounded-full relative transition-colors duration-200 ${
              periode === "bulanan" ? "bg-blue-500" : "bg-gray-300"
            }`}
            onClick={() => setPeriode(periode === "harian" ? "bulanan" : "harian")}
            aria-label="Switch periode"
            type="button"
          >
            <span
              className={`block w-6 h-6 bg-white rounded-full shadow absolute top-0 transition-all duration-200 ${
                periode === "bulanan" ? "left-6" : "left-0"
              }`}
            />
          </button>
          <span
            className={
              periode === "bulanan" ? "font-semibold text-blue-700" : "text-gray-400"
            }
          >
            Bulan Ini
          </span>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-8">
          <p className="text-gray-600 mb-4">
            Monitor TikTok comments activity, track engagement, and review comment compliance from your team.
          </p>
          <TikTokCommentsTable comments={filteredComments} />
        </div>
      </div>
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
      <div className={`text-3xl md:text-4xl font-bold ${colorMap[color]}`}>{value}</div>
      <div className="text-xs md:text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wide text-center">
        {label}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="hidden md:block w-px bg-gray-200 mx-2 my-2"></div>;
}
