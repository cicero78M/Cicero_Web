"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useRequireSystemAdminAuth from "@/hooks/useRequireSystemAdminAuth";
import {
  clearAdminSystemToken,
  getAdminSystemOverview,
} from "@/utils/adminSystemApi";

export default function AdminSystemOverviewPage() {
  const { token, isHydrating } = useRequireSystemAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    getAdminSystemOverview(token)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal load overview"));
  }, [token]);

  if (isHydrating) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 p-6">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Admin System Overview</h1>
          <button
            onClick={() => {
              clearAdminSystemToken();
              window.location.href = "/admin-system/login";
            }}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
          >
            Logout
          </button>
        </div>

        {error && <div className="text-rose-400 text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card label="Total Client" value={data?.total_clients ?? 0} />
          <Card label="Total Dashboard User" value={data?.total_dashboard_users ?? 0} />
          <Card
            label="Pending Premium Request"
            value={data?.total_pending_premium_requests ?? 0}
          />
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold">Modul Admin Khusus</h2>
          <p className="text-sm text-slate-400 mt-1">
            Entry point manajemen sistem global di luar dashboard user biasa.
          </p>
          <div className="mt-4 flex gap-2">
            <Link
              href="/admin-system/funds"
              className="inline-block px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold"
            >
              Buka Manajemen Dana
            </Link>
            <Link
              href="/admin-system/analysis"
              className="inline-block px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold"
            >
              Buka System Analysis
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
