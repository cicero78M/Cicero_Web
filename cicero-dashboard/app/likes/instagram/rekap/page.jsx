"use client";
import { useState, useRef } from "react";
import Loader from "@/components/Loader";
import RekapLikesIG from "@/components/RekapLikesIG";
import Link from "next/link";
import useRequireAuth from "@/hooks/useRequireAuth";
import useInstagramLikesData from "@/hooks/useInstagramLikesData";
import ViewDataSelector, { VIEW_OPTIONS } from "@/components/ViewDataSelector";
import { ArrowLeft } from "lucide-react";

export default function RekapLikesIGPage() {
  useRequireAuth();
  const [viewBy, setViewBy] = useState("today");
  const today = new Date().toISOString().split("T")[0];
  const [customDate, setCustomDate] = useState(today);
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const {
    chartData,
    loading,
    error,
    rekapSummary,
    igPosts,
    clientName,
  } = useInstagramLikesData({ viewBy, customDate, fromDate, toDate });

  const rekapRef = useRef(null);

  const viewOptions = VIEW_OPTIONS;

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
              Rekapitulasi Likes Instagram
            </h1>
            <Link
              href="/likes/instagram"
              className="inline-block bg-gray-100 hover:bg-blue-50 text-blue-700 border border-blue-300 font-semibold px-4 py-2 rounded-lg transition-all duration-150 shadow flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 mb-2">
            <button
              onClick={() => rekapRef.current?.copyRekap()}
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
            >
              Rekap Likes
            </button>
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

          {/* Kirim data dari fetch ke komponen rekap likes */}
            <RekapLikesIG
              ref={rekapRef}
              users={chartData}
              totalIGPost={rekapSummary.totalIGPost}
              posts={igPosts}
              showRekapButton
              clientName={clientName}
            />
          </div>
        </div>
      </div>
    );
  }
