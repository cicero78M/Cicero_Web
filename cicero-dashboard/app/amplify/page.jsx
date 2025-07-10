"use client";
import { useEffect, useState } from "react";
import {
  getRekapAmplify,
  getDashboardStats,
  getInstagramPostsViaBackend,
} from "@/utils/api";
import Loader from "@/components/Loader";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";
import ChartHorizontal from "@/components/ChartHorizontal";
import InstagramPostsGrid from "@/components/InstagramPostsGrid";
import { groupUsersByKelompok } from "@/utils/grouping";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function AmplifyPage() {
  useRequireAuth();
  const [chartData, setChartData] = useState([]);
  const [igPosts, setIgPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [periode, setPeriode] = useState("harian");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const clientId =
      typeof window !== "undefined" ? localStorage.getItem("client_id") : null;
    if (!token || !clientId) {
      setError("Token atau Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const rekapRes = await getRekapAmplify(token, clientId, periode);
        setChartData(Array.isArray(rekapRes.data) ? rekapRes.data : []);

        const statsRes = await getDashboardStats(token);
        const username =
          statsRes.data?.instagram_username || statsRes.instagram_username;
        if (username) {
          const postsRes = await getInstagramPostsViaBackend(token, username, 6);
          const posts = postsRes.data || postsRes.posts || postsRes;
          setIgPosts(Array.isArray(posts) ? posts : []);
        }
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [periode]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  const kelompok = groupUsersByKelompok(chartData);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-6xl px-2 md:px-8 py-8">
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
              Link Amplification Report
            </h1>
            <div className="flex items-center justify-end gap-3 mb-2">
              {[
                ["harian", "Harian"],
                ["mingguan", "Mingguan"],
                ["bulanan", "Bulanan"],
              ].map(([val, label]) => (
                <button
                  key={val}
                  className={`px-3 py-1 rounded-lg text-sm font-semibold border ${
                    periode === val
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-blue-700"
                  }`}
                  onClick={() => setPeriode(val)}
                >
                  {label}
                </button>
              ))}
            </div>
            <ChartBox title="BAG" users={kelompok.BAG} />
            <ChartBox title="SAT" users={kelompok.SAT} />
            <ChartBox title="SI & SPKT" users={kelompok["SI & SPKT"]} />
            <ChartHorizontal
              title="POLSEK"
              users={kelompok.POLSEK}
              fieldJumlah="jumlah_link"
              labelSudah="Sudah Post"
              labelBelum="Belum Post"
              labelTotal="Total Link"
            />
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-blue-700">Instagram Posts</h2>
              <InstagramPostsGrid posts={igPosts} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartBox({ title, users }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-bold text-blue-700 mb-2 text-center">{title}</div>
      {users && users.length > 0 ? (
        <ChartDivisiAbsensi
          users={users}
          title={title}
          totalPost={1}
          fieldJumlah="jumlah_link"
          labelSudah="Sudah Post"
          labelBelum="Belum Post"
          labelTotal="Total Link"
        />
      ) : (
        <div className="text-center text-gray-400 text-sm">Tidak ada data</div>
      )}
    </div>
  );
}
