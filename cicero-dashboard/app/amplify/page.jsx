"use client";
import { useEffect, useState } from "react";
import { getRekapAmplify } from "@/utils/api";
import ViewDataSelector, {
  getPeriodeDateForView,
} from "@/components/ViewDataSelector";
import Loader from "@/components/Loader";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";
import ChartHorizontal from "@/components/ChartHorizontal";
import { groupUsersByKelompok } from "@/utils/grouping";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function AmplifyPage() {
  useRequireAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  useEffect(() => {
    setLoading(true);
    setError("");
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const clientId =
      typeof window !== "undefined" ? localStorage.getItem("client_id") : null;
    if (!token || !clientId) {
      setError("Token atau Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    const selectedDate =
      viewBy === "custom_range"
        ? { startDate: fromDate, endDate: toDate }
        : customDate;
    const { periode, date, startDate, endDate } = getPeriodeDateForView(
      viewBy,
      selectedDate,
    );

    async function fetchData() {
      try {
        const rekapRes = await getRekapAmplify(
          token,
          clientId,
          periode,
          date,
          startDate,
          endDate,
        );
        setChartData(Array.isArray(rekapRes.data) ? rekapRes.data : []);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [viewBy, customDate, fromDate, toDate]);

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
              <ViewDataSelector
                value={viewBy}
                onChange={setViewBy}
                date=
                  {viewBy === "custom_range"
                    ? { startDate: fromDate, endDate: toDate }
                    : customDate}
                onDateChange={(val) => {
                  if (viewBy === "custom_range") {
                    setFromDate(val.startDate || "");
                    setToDate(val.endDate || "");
                  } else {
                    setCustomDate(val);
                  }
                }}
              />
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
