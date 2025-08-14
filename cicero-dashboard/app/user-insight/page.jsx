"use client";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import { useAuth } from "@/context/AuthContext";
import { getUserDirectory } from "@/utils/api";
import { groupUsersByKelompok } from "@/utils/grouping";
import ChartUserFields from "@/components/ChartUserFields";

export default function UserInsightPage() {
  useRequireAuth();
  const { token, clientId } = useAuth();
  const [kelompok, setKelompok] = useState({
    BAG: [],
    SAT: [],
    "SI & SPKT": [],
    POLSEK: [],
  });
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
        setKelompok(groupUsersByKelompok(users));
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
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-5xl px-2 md:px-8 py-8">
          <div className="flex flex-col gap-6">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
              User Insight
            </h1>
            <ChartBox title="BAG" users={kelompok.BAG} />
            <ChartBox title="SAT" users={kelompok.SAT} />
            <ChartBox title="SI & SPKT" users={kelompok["SI & SPKT"]} />
            <ChartBox title="POLSEK" users={kelompok.POLSEK} orientation="horizontal" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartBox({ title, users, orientation = "vertical" }) {
  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="font-bold text-blue-700 mb-2 text-center">{title}</div>
      {users && users.length > 0 ? (
        <ChartUserFields users={users} orientation={orientation} />
      ) : (
        <div className="text-center text-gray-400 text-sm">Tidak ada data</div>
      )}
    </div>
  );
}

