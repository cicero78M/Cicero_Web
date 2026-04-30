"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useRequireSystemAdminAuth from "@/hooks/useRequireSystemAdminAuth";
import {
  clearAdminSystemToken,
  getAdminSystemClientsSummary,
  getAdminSystemFullAudit,
  getAdminSystemOverview,
} from "@/utils/adminSystemApi";

export default function AdminSystemOverviewPage() {
  const { token, isHydrating } = useRequireSystemAdminAuth();
  const [overview, setOverview] = useState(null);
  const [clients, setClients] = useState(null);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getAdminSystemOverview(token),
      getAdminSystemClientsSummary(token),
      getAdminSystemFullAudit(token),
    ])
      .then(([ov, cl, au]) => {
        setOverview(ov);
        setClients(cl);
        setAudit(au);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Gagal load admin overview"));
  }, [token]);

  if (isHydrating) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 p-6">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Admin System Console</h1>
            <p className="text-sm text-slate-400">Ruang admin terpisah dari dashboard operasional utama.</p>
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card label="Total Client" value={overview?.total_clients ?? 0} />
          <Card label="Dashboard User" value={overview?.total_dashboard_users ?? 0} />
          <Card label="Pending Premium" value={overview?.total_pending_premium_requests ?? 0} />
          <Card label="Pending Fund Req" value={overview?.total_pending_fund_requests ?? 0} />
        </div>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3">
          <h2 className="text-lg font-semibold">Client Data Summary</h2>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <Info label="Active Clients" value={clients?.status?.active_clients ?? 0} />
            <Info label="Inactive Clients" value={clients?.status?.inactive_clients ?? 0} />
            <Info label="Insta Enabled" value={clients?.status?.insta_enabled ?? 0} />
            <Info label="Tiktok Enabled" value={clients?.status?.tiktok_enabled ?? 0} />
            <Info label="Amplify Enabled" value={clients?.status?.amplify_enabled ?? 0} />
            <Info label="Top Group" value={clients?.top_groups?.[0]?.client_group || "-"} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3">
          <h2 className="text-lg font-semibold">System Configuration Snapshot</h2>
          <div className="grid md:grid-cols-3 gap-3 text-sm">
            <Info label="Risk Level" value={audit?.config_analysis?.riskLevel || "-"} />
            <Info label="Timezone" value={audit?.config_snapshot?.timezone || "-"} />
            <Info label="OTP TTL" value={`${audit?.config_snapshot?.otp_ttl_seconds || 0} sec`} />
            <Info label="Session TTL" value={`${audit?.config_snapshot?.session_ttl_seconds || 0} sec`} />
            <Info label="Admin IDs" value={audit?.config_snapshot?.total_admin_chat_ids || 0} />
            <Info label="Role Mappings" value={audit?.config_snapshot?.total_role_mappings || 0} />
          </div>
          <div className="flex gap-2 pt-2">
            <Link href="/admin-system/analysis" className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm">System Analysis</Link>
            <Link href="/admin-system/funds" className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-sm">Funds Management</Link>
          </div>
        </section>
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

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}
