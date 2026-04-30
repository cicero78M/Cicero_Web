"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useRequireSystemAdminAuth from "@/hooks/useRequireSystemAdminAuth";
import {
  clearAdminSystemToken,
  getAdminSystemClients,
  getAdminSystemClientsSummary,
  getAdminSystemFullAudit,
  getAdminSystemOverview,
} from "@/utils/adminSystemApi";

export default function AdminSystemOverviewPage() {
  const { token, isHydrating } = useRequireSystemAdminAuth();
  const [overview, setOverview] = useState(null);
  const [clients, setClients] = useState(null);
  const [clientRows, setClientRows] = useState([]);
  const [audit, setAudit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    Promise.all([
      getAdminSystemOverview(token),
      getAdminSystemClientsSummary(token),
      getAdminSystemClients(token, { page: 1, limit: 8 }),
      getAdminSystemFullAudit(token),
    ])
      .then(([ov, cl, clientList, au]) => {
        setOverview(ov);
        setClients(cl);
        setClientRows(Array.isArray(clientList?.data) ? clientList.data : []);
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
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Daftar Klien</h2>
            <Link href="/admin-system/clients" className="text-xs px-3 py-2 rounded bg-slate-800 border border-slate-700">Lihat Semua</Link>
          </div>

          <div className="grid gap-2 md:hidden">
            {clientRows.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada data klien.</p>
            ) : (
              clientRows.map((c) => (
                <div key={c.client_id} className="rounded-lg border border-slate-700 bg-slate-950 p-3">
                  <div className="font-semibold text-sm">{c.nama || c.client_id}</div>
                  <div className="text-xs text-slate-400 mt-1">ID: {c.client_id}</div>
                  <div className="text-xs text-slate-400">Type: {c.client_type || "-"} • Group: {c.client_group || "-"}</div>
                  <div className="text-xs mt-2">
                    <span className={`px-2 py-1 rounded border ${c.client_status ? "border-emerald-600/40 text-emerald-300" : "border-rose-600/40 text-rose-300"}`}>
                      {c.client_status ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Nama</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Group</th>
                  <th className="py-2 pr-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {clientRows.map((c) => (
                  <tr key={c.client_id} className="border-t border-slate-800">
                    <td className="py-2 pr-3">{c.client_id}</td>
                    <td className="py-2 pr-3">{c.nama || "-"}</td>
                    <td className="py-2 pr-3">{c.client_type || "-"}</td>
                    <td className="py-2 pr-3">{c.client_group || "-"}</td>
                    <td className="py-2 pr-3">{c.client_status ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          <div className="flex gap-2 pt-2 flex-wrap">
            <Link href="/admin-system/analysis" className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-sm">System Analysis</Link>
            <Link href="/admin-system/funds" className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-sm">Funds Management</Link>
            <Link href="/admin-system/clients" className="px-4 py-2 rounded-lg bg-amber-400 text-slate-950 font-semibold text-sm">Client CRUD</Link>
            <Link href="/admin-system/payments" className="px-4 py-2 rounded-lg bg-fuchsia-400 text-slate-950 font-semibold text-sm">Payment Workflow</Link>
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
