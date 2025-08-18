"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import useRequireAuth from "@/hooks/useRequireAuth";
import { useAuth } from "@/context/AuthContext";
import { getRekapAmplify, getClientProfile, getClientNames } from "@/utils/api";
import Loader from "@/components/Loader";
import RekapAmplifikasi from "@/components/RekapAmplifikasi";
import ViewDataSelector, {
  getPeriodeDateForView,
  VIEW_OPTIONS,
} from "@/components/ViewDataSelector";

export default function RekapAmplifikasiPage() {
  useRequireAuth();
  const { token, clientId } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const viewOptions = VIEW_OPTIONS;

  useEffect(() => {
    setLoading(true);
    setError("");
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
        let users = Array.isArray(rekapRes.data) ? rekapRes.data : [];

        const profileRes = await getClientProfile(token, clientId);
        const profile =
          profileRes.client || profileRes.profile || profileRes || {};
        const dir =
          (profile.client_type || "").toUpperCase() === "DIREKTORAT";
        if (dir) {
          const nameMap = await getClientNames(
            token,
            users.map((u) =>
              String(
                u.client_id ||
                  u.clientId ||
                  u.clientID ||
                  u.id ||
                  u.client ||
                  "",
              ),
            ),
          );
          users = users.map((u) => ({
            ...u,
            nama_client:
              nameMap[
                String(
                  u.client_id ||
                    u.clientId ||
                    u.clientID ||
                    u.id ||
                    u.client ||
                    "",
                ),
              ] ||
              u.nama_client ||
              u.client_name ||
              u.client,
          }));
        }
        setUsers(users);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token, clientId, viewBy, customDate, fromDate, toDate]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white rounded-lg shadow-md p-6 text-center text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl md:text-3xl font-bold text-blue-700">
              Rekapitulasi Amplifikasi Link
            </h1>
            <Link
              href="/amplify"
              className="inline-block bg-gray-100 hover:bg-indigo-50 text-indigo-700 border border-indigo-300 font-semibold px-4 py-2 rounded-lg transition-all duration-150 shadow flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
          <div className="flex items-center justify-end gap-3 mb-2">
            <ViewDataSelector
              value={viewBy}
              onChange={setViewBy}
              options={viewOptions}
              date={
                viewBy === "custom_range"
                  ? { startDate: fromDate, endDate: toDate }
                  : customDate
              }
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

          <RekapAmplifikasi users={users} />
        </div>
      </div>
    </div>
  );
}

