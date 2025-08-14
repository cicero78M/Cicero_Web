"use client";
import { useEffect, useState } from "react";
import { getRekapAmplify, getClientProfile } from "@/utils/api";
import ViewDataSelector, {
  getPeriodeDateForView,
  VIEW_OPTIONS,
} from "@/components/ViewDataSelector";
import Loader from "@/components/Loader";
import ChartDivisiAbsensi from "@/components/ChartDivisiAbsensi";
import ChartHorizontal from "@/components/ChartHorizontal";
import { groupUsersByKelompok } from "@/utils/grouping";
import useRequireAuth from "@/hooks/useRequireAuth";
import { Link as LinkIcon, User, Check, X } from "lucide-react";

export default function DiseminasiInsightPage() {
  useRequireAuth();
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [rekapSummary, setRekapSummary] = useState({
    totalUser: 0,
    totalSudahPost: 0,
    totalBelumPost: 0,
    totalLink: 0,
  });
  const [isDirectorate, setIsDirectorate] = useState(false);

  const viewOptions = VIEW_OPTIONS;

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
        const users = Array.isArray(rekapRes.data) ? rekapRes.data : [];

        const profileRes = await getClientProfile(token, clientId);
        const profile =
          profileRes.client || profileRes.profile || profileRes || {};
        const dir =
          (profile.client_type || "").toUpperCase() === "DIREKTORAT";
        setIsDirectorate(dir);
        const totalUser = users.length;
        const totalSudahPost = users.filter(
          (u) => Number(u.jumlah_link) > 0,
        ).length;
        const totalBelumPost = totalUser - totalSudahPost;
        const totalLink = users.reduce(
          (sum, u) => sum + Number(u.jumlah_link || 0),
          0,
        );
        setRekapSummary({
          totalUser,
          totalSudahPost,
          totalBelumPost,
          totalLink,
        });

        const processed = users.map((u) => ({
          ...u,
          divisi: dir
            ? u.nama_client || u.client_name || u.client || u.divisi
            : u.divisi,
        }));
        setChartData(processed);
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

  const kelompok = isDirectorate ? null : groupUsersByKelompok(chartData);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-6xl px-2 md:px-8 py-8">
          <div className="flex flex-col gap-8">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700 mb-2">
              Diseminasi Insight Report
            </h1>

            <div className="bg-gradient-to-tr from-indigo-50 to-white rounded-2xl shadow flex flex-col md:flex-row items-stretch justify-between p-3 md:p-5 gap-2 md:gap-4 border">
              <SummaryItem
                label="Total Link"
                value={rekapSummary.totalLink}
                color="indigo"
                icon={<LinkIcon className="text-indigo-400" />}
              />
              <Divider />
              <SummaryItem
                label="Total User"
                value={rekapSummary.totalUser}
                color="gray"
                icon={<User className="text-gray-400" />}
              />
              <Divider />
              <SummaryItem
                label="Sudah Post"
                value={rekapSummary.totalSudahPost}
                color="green"
                icon={<Check className="text-green-500" />}
              />
              <Divider />
              <SummaryItem
                label="Belum Post"
                value={rekapSummary.totalBelumPost}
                color="red"
                icon={<X className="text-red-500" />}
              />
            </div>

            <div className="flex items-center justify-end gap-3 mb-2">
              <ViewDataSelector
                value={viewBy}
                onChange={setViewBy}
                options={viewOptions}
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
            {isDirectorate ? (
              <ChartBox title="POLRES" users={chartData} groupBy="client_id" />
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartBox({ title, users, groupBy }) {
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
          groupBy={groupBy}
        />
      ) : (
        <div className="text-center text-gray-400 text-sm">Tidak ada data</div>
      )}
    </div>
  );
}

function SummaryItem({ label, value, color = "gray", icon }) {
  const colorMap = {
    indigo: "text-indigo-700",
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
