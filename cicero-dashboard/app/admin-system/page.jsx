"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useRequireSystemAdminAuth from "@/hooks/useRequireSystemAdminAuth";
import {
  logoutAdminSystem,
  getAdminSystemClients,
  getAdminSystemClientsSummary,
  getAdminSystemFullAudit,
  getAdminSystemHealth,
  getAdminSystemOverview,
} from "@/utils/adminSystemApi";

export default function AdminSystemOverviewPage() {
  const { token, isHydrating } = useRequireSystemAdminAuth();
  const [overview, setOverview] = useState(null);
  const [clients, setClients] = useState(null);
  const [clientRows, setClientRows] = useState([]);
  const [audit, setAudit] = useState(null);
  const [health, setHealth] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [panelState, setPanelState] = useState({
    overview: "idle",
    health: "idle",
    clients: "idle",
    clientList: "idle",
    audit: "idle",
  });
  const [panelErrors, setPanelErrors] = useState({});
  const [panelUpdatedAt, setPanelUpdatedAt] = useState({});

  const loadPanel = async (key, request, apply) => {
    if (!token) return;
    setPanelState((current) => ({ ...current, [key]: "loading" }));
    setPanelErrors((current) => ({ ...current, [key]: "" }));
    try {
      const result = await withTimeout(request(), 15000);
      apply(result);
      setPanelState((current) => ({ ...current, [key]: "ready" }));
      setPanelUpdatedAt((current) => ({ ...current, [key]: new Date().toISOString() }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat panel";
      setPanelState((current) => ({ ...current, [key]: "error" }));
      setPanelErrors((current) => ({ ...current, [key]: message }));
    }
  };

  const load = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    await Promise.all([
      loadPanel("overview", () => getAdminSystemOverview(token), setOverview),
      loadPanel("health", () => getAdminSystemHealth(token), setHealth),
      loadPanel("clients", () => getAdminSystemClientsSummary(token), setClients),
      loadPanel(
        "clientList",
        () => getAdminSystemClients(token, { page: 1, limit: 8 }),
        (result) => setClientRows(Array.isArray(result?.data) ? result.data : []),
      ),
      loadPanel("audit", () => getAdminSystemFullAudit(token), setAudit),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    if (!autoRefresh || !token) return undefined;
    const timer = window.setInterval(() => load(), 30000);
    return () => window.clearInterval(timer);
  }, [autoRefresh, token]);

  if (isHydrating) {
    return <div className="min-h-screen bg-slate-950 text-slate-100 p-6">Loading...</div>;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050914] p-4 text-slate-100 sm:p-6">
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(rgba(56,189,248,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.07)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none fixed -left-32 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 bottom-10 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1500px] space-y-5">
        <div className="flex flex-col justify-between gap-4 rounded-2xl border border-cyan-400/20 bg-slate-900/75 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300"><span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" /> CICERO / COMMAND CONTROL</div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Admin System Console</h1>
            <p className="mt-1 text-sm text-slate-400">Control room orkestrasi sistem, client, integrasi, dan keputusan administrator.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAutoRefresh((value) => !value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${autoRefresh ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300" : "border-slate-700 bg-slate-800 text-slate-300"}`}>
              {autoRefresh ? "Auto-monitor ON" : "Auto-monitor OFF"}
            </button>
            <button onClick={load} disabled={loading} className="px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-sm disabled:opacity-50">
              {loading ? "Memeriksa..." : "Refresh status"}
            </button>
            <button
              onClick={async () => {
                await logoutAdminSystem().catch(() => undefined);
                window.location.href = "/admin-system/login";
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm"
            >
              Logout
            </button>
          </div>
        </div>

        {error && <div className="text-rose-400 text-sm">{error}</div>}

        <PanelNotice
          state={overallPanelState(panelState)}
          error={overallPanelError(panelErrors)}
          updatedAt={latestPanelUpdate(panelUpdatedAt)}
          onRetry={load}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card label="Total Client" value={overview?.total_clients} state={panelState.overview} accent="cyan" />
          <Card label="Dashboard User" value={overview?.total_dashboard_users} state={panelState.overview} accent="violet" />
          <Card label="Pending Premium" value={overview?.total_pending_premium_requests} state={panelState.overview} accent="amber" />
          <Card label="Pending Fund Req" value={overview?.total_pending_fund_requests} state={panelState.overview} accent="rose" />
        </div>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">System Health & Integrations</h2>
              <p className="text-xs text-slate-400 mt-1">
                Pemeriksaan read-only; terakhir: {health?.checked_at ? new Date(health.checked_at).toLocaleString("id-ID") : "belum tersedia"}
              </p>
            </div>
            <div className="flex items-center gap-2"><PanelMeta state={panelState.health} updatedAt={panelUpdatedAt.health} onRetry={() => loadPanel("health", () => getAdminSystemHealth(token), setHealth)} /><HealthBadge status={health?.status || "unknown"} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(health?.components || []).map((item) => (
              <button type="button" key={item.name} onClick={() => setSelectedComponent(item)} className={`rounded-lg border p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/60 ${selectedComponent?.name === item.name ? "border-cyan-400/70 bg-cyan-400/10" : "border-slate-700 bg-slate-950"}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold capitalize">{item.name.replaceAll("_", " ")}</span>
                  <HealthBadge status={item.status} />
                </div>
                <p className="mt-2 text-xs text-slate-400">{item.latency_ms ?? "-"} ms</p>
                {item.name === "clients" && (
                  <p className="mt-1 text-xs text-slate-300">{item.details?.active ?? 0} aktif / {item.details?.total ?? 0} total</p>
                )}
                {item.name === "whatsapp_admin" && (
                  <p className="mt-1 text-xs text-slate-300">{item.details?.reachable ? "Service dapat dijangkau" : "Perlu pemeriksaan"}</p>
                )}
              </button>
            ))}
          </div>
          {selectedComponent && (
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 text-xs text-slate-300">
              <div className="mb-1 font-semibold uppercase tracking-wider text-cyan-300">Telemetry / {selectedComponent.name.replaceAll("_", " ")}</div>
              <pre className="overflow-auto whitespace-pre-wrap text-slate-400">{JSON.stringify(selectedComponent.details || {}, null, 2)}</pre>
            </div>
          )}
          {health?.process && (
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400 border-t border-slate-800 pt-3">
              <span>Backend uptime: {formatUptime(health.process.uptime_seconds)}</span>
              <span>Node: {health.process.node_version}</span>
              <span>Env: {health.process.environment}</span>
              <span>Probe: {health.total_latency_ms ?? "-"} ms</span>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Client Data Summary</h2><PanelMeta state={panelState.clients} updatedAt={panelUpdatedAt.clients} onRetry={() => loadPanel("clients", () => getAdminSystemClientsSummary(token), setClients)} /></div>
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
            <div><h2 className="text-lg font-semibold">Daftar Klien</h2><PanelMeta state={panelState.clientList} updatedAt={panelUpdatedAt.clientList} onRetry={() => loadPanel("clientList", () => getAdminSystemClients(token, { page: 1, limit: 8 }), (result) => setClientRows(Array.isArray(result?.data) ? result.data : []))} /></div>
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
          <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">System Configuration Snapshot</h2><PanelMeta state={panelState.audit} updatedAt={panelUpdatedAt.audit} onRetry={() => loadPanel("audit", () => getAdminSystemFullAudit(token), setAudit)} /></div>
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

function Card({ label, value, state }) {
  return (
    <div className="group rounded-xl border border-slate-700/80 bg-slate-900/80 p-4 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-cyan-400/40">
      <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</p><span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" /></div>
      <p className="text-3xl font-bold tracking-tight text-slate-100">{state === "loading" ? <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-700" /> : value ?? "—"}</p>
    </div>
  );
}

function PanelMeta({ state, updatedAt, onRetry }) {
  if (state === "loading") return <span className="text-[10px] uppercase tracking-wide text-cyan-300">memuat…</span>;
  if (state === "error") return <button type="button" onClick={onRetry} className="text-[10px] uppercase tracking-wide text-rose-300 hover:text-rose-200">gagal · coba lagi</button>;
  if (state === "ready") return <span className="text-[10px] uppercase tracking-wide text-emerald-300">{updatedAt ? `ok ${new Date(updatedAt).toLocaleTimeString("id-ID")}` : "ok"}</span>;
  return <span className="text-[10px] uppercase tracking-wide text-slate-500">belum dimuat</span>;
}

function PanelNotice({ state, error, updatedAt, onRetry }) {
  if (state === "ready" && !error) return null;
  return <div className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs ${state === "error" ? "border-rose-400/30 bg-rose-400/10 text-rose-200" : "border-cyan-400/20 bg-cyan-400/5 text-slate-300"}`}><span>{state === "loading" ? "Memuat telemetry console…" : error || "Sebagian panel belum tersedia."}{updatedAt ? ` Data terakhir: ${new Date(updatedAt).toLocaleTimeString("id-ID")}` : ""}</span>{state === "error" && <button type="button" onClick={onRetry} className="font-semibold underline">Coba lagi</button>}</div>;
}

function overallPanelState(states) {
  const values = Object.values(states);
  if (values.some((value) => value === "loading")) return "loading";
  if (values.some((value) => value === "error")) return "error";
  if (values.every((value) => value === "ready")) return "ready";
  return "idle";
}

function overallPanelError(errors) {
  return Object.values(errors).find(Boolean) || "";
}

function latestPanelUpdate(updates) {
  return Object.values(updates).filter(Boolean).sort().at(-1);
}

function withTimeout(promise, milliseconds) {
  return Promise.race([
    promise,
    new Promise((_, reject) => window.setTimeout(() => reject(new Error("Permintaan timeout setelah 15 detik")), milliseconds)),
  ]);
}

function Info({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="font-semibold mt-1">{value}</div>
    </div>
  );
}

function HealthBadge({ status }) {
  const styles = {
    ok: "border-emerald-600/50 text-emerald-300 bg-emerald-500/10",
    warning: "border-amber-600/50 text-amber-300 bg-amber-500/10",
    degraded: "border-rose-600/50 text-rose-300 bg-rose-500/10",
    down: "border-rose-600/50 text-rose-300 bg-rose-500/10",
    unknown: "border-slate-600 text-slate-400 bg-slate-800",
  };
  return <span className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wide ${styles[status] || styles.unknown}`}>{status}</span>;
}

function formatUptime(seconds) {
  const value = Number(seconds || 0);
  if (!value) return "-";
  const days = Math.floor(value / 86400);
  const hours = Math.floor((value % 86400) / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  return `${days ? `${days}h ` : ""}${hours}j ${minutes}m`;
}
