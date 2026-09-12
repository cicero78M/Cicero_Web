"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AdminNav from "@/components/admin-system/AdminNav";
import useRequireSystemAdminAuth from "@/hooks/useRequireSystemAdminAuth";
import {
  logoutAdminSystem,
  getAdminSystemClients,
  getAdminSystemClientsSummary,
  getAdminSystemFullAudit,
  getAdminSystemHealth,
  getAdminSystemOverview,
  getAdminSystemTopology,
  getAdminSystemDuplicateMonitoring,
} from "@/utils/adminSystemApi";

export default function AdminSystemOverviewPage() {
  const { token, isHydrating } = useRequireSystemAdminAuth();
  const [overview, setOverview] = useState(null);
  const [clients, setClients] = useState(null);
  const [clientRows, setClientRows] = useState([]);
  const [audit, setAudit] = useState(null);
  const [health, setHealth] = useState(null);
  const [topology, setTopology] = useState(null);
  const [duplicateMonitoring, setDuplicateMonitoring] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [panelState, setPanelState] = useState({
    overview: "idle",
    health: "idle",
    topology: "idle",
    clients: "idle",
    clientList: "idle",
    audit: "idle",
    duplicates: "idle",
  });
  const [panelErrors, setPanelErrors] = useState({});
  const [panelUpdatedAt, setPanelUpdatedAt] = useState({});
  const [panelDurations, setPanelDurations] = useState({});
  const [monitorEvents, setMonitorEvents] = useState([]);
  const loadInFlight = useRef(false);

  const loadPanel = async (key, request, apply) => {
    if (!token) return;
    const startedAt = performance.now();
    setPanelState((current) => ({ ...current, [key]: "loading" }));
    setPanelErrors((current) => ({ ...current, [key]: "" }));
    try {
      const result = await withTimeout(request(), 15000);
      const duration = Math.round(performance.now() - startedAt);
      apply(result);
      setPanelState((current) => ({ ...current, [key]: "ready" }));
      setPanelUpdatedAt((current) => ({ ...current, [key]: new Date().toISOString() }));
      setPanelDurations((current) => ({ ...current, [key]: duration }));
      setMonitorEvents((current) => [{ key, status: "ready", duration, at: new Date().toISOString() }, ...current].slice(0, 18));
    } catch (err) {
      const duration = Math.round(performance.now() - startedAt);
      const message = err instanceof Error ? err.message : "Gagal memuat panel";
      setPanelState((current) => ({ ...current, [key]: "error" }));
      setPanelErrors((current) => ({ ...current, [key]: message }));
      setPanelDurations((current) => ({ ...current, [key]: duration }));
      setMonitorEvents((current) => [{ key, status: "error", duration, at: new Date().toISOString(), message }, ...current].slice(0, 18));
    }
  };

  const load = async () => {
    if (!token || loadInFlight.current) return;
    loadInFlight.current = true;
    setLoading(true);
    setError("");
    try {
      await Promise.all([
        loadPanel("overview", () => getAdminSystemOverview(token), setOverview),
        loadPanel("health", () => getAdminSystemHealth(token), setHealth),
        loadPanel("topology", () => getAdminSystemTopology(token), setTopology),
        loadPanel("duplicates", () => getAdminSystemDuplicateMonitoring(token), setDuplicateMonitoring),
        loadPanel("clients", () => getAdminSystemClientsSummary(token), setClients),
        loadPanel(
          "clientList",
          () => getAdminSystemClients(token, { page: 1, limit: 8 }),
          (result) => setClientRows(Array.isArray(result?.data) ? result.data : []),
        ),
        loadPanel("audit", () => getAdminSystemFullAudit(token), setAudit),
      ]);
    } finally {
      loadInFlight.current = false;
      setLoading(false);
    }
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
    <main className="admin-console min-h-screen overflow-hidden bg-[#050914] p-4 text-slate-100 sm:p-6">
      <div className="pointer-events-none fixed inset-0 opacity-30 [background-image:linear-gradient(rgba(56,189,248,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.07)_1px,transparent_1px)] [background-size:42px_42px]" />
      <div className="pointer-events-none fixed -left-32 top-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none fixed -right-32 bottom-10 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1500px] space-y-5">
        <AdminNav />
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

        <LiveMonitoring
          panelState={panelState}
          panelErrors={panelErrors}
          panelUpdatedAt={panelUpdatedAt}
          panelDurations={panelDurations}
          events={monitorEvents}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card label="Total Client" value={overview?.total_clients} state={panelState.overview} accent="cyan" />
          <Card label="Dashboard User" value={overview?.total_dashboard_users} state={panelState.overview} accent="violet" />
          <Card label="Pending Premium" value={overview?.total_pending_premium_requests} state={panelState.overview} accent="amber" />
          <Card label="Pending Fund Req" value={overview?.total_pending_fund_requests} state={panelState.overview} accent="rose" />
        </div>

        <section className="rounded-xl border border-cyan-400/20 bg-slate-900/90 p-5 shadow-lg shadow-cyan-950/10">
          <div className="mb-3">
            <h2 className="text-lg font-semibold">User Login per Kanal</h2>
            <p className="mt-1 text-xs text-slate-400">Jumlah user unik yang tercatat pernah login.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Info label="Dashboard" value={overview?.login_users?.dashboard ?? 0} />
            <Info label="Claim" value={overview?.login_users?.claim ?? 0} />
            <Info label="Reposter" value={overview?.login_users?.reposter ?? 0} />
          </div>
        </section>

        <section className="rounded-xl border border-cyan-400/20 bg-slate-900/90 p-5 space-y-4 shadow-lg shadow-cyan-950/10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-lg font-semibold">Cicero Ecosystem Topology</h2><p className="mt-1 text-xs text-slate-400">Peta read-only service, pipeline data, dan cakupan client.</p></div>
            <PanelMeta state={panelState.topology} updatedAt={panelUpdatedAt.topology} onRetry={() => loadPanel("topology", () => getAdminSystemTopology(token), setTopology)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(topology?.topology || []).map((item) => <div key={item.id} className="rounded-lg border border-slate-700 bg-slate-950 p-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{item.label}</span><HealthBadge status={item.status} /></div><div className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">{item.kind}</div></div>)}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {(topology?.pipelines || []).map((item) => <div key={item.name} className="rounded-lg border border-slate-800 bg-slate-950/80 p-3"><div className="text-xs font-semibold text-slate-200">{item.name}</div><div className="mt-2 text-lg font-bold text-cyan-300">{item.total_records.toLocaleString("id-ID")}</div><div className="text-[10px] text-slate-500">data · {item.latest_at ? new Date(item.latest_at).toLocaleString("id-ID") : "belum tersedia"}</div></div>)}
          </div>
          {topology?.clients && <div className="overflow-auto rounded-lg border border-slate-800"><table className="w-full min-w-[640px] text-xs"><thead><tr className="text-left text-slate-500"><th className="p-3">Client</th><th className="p-3">Group</th><th className="p-3">Instagram</th><th className="p-3">TikTok</th><th className="p-3">Amplify</th></tr></thead><tbody>{topology.clients.matrix.slice(0, 12).map((item) => <tr key={item.client_id} className="border-t border-slate-800"><td className="p-3 font-semibold">{item.name}</td><td className="p-3 text-slate-400">{item.group || "-"}</td><td className="p-3"><HealthBadge status={item.platforms.instagram === "enabled" ? "ok" : "unknown"} /></td><td className="p-3"><HealthBadge status={item.platforms.tiktok === "enabled" ? "ok" : "unknown"} /></td><td className="p-3"><HealthBadge status={item.platforms.amplify === "enabled" ? "ok" : "unknown"} /></td></tr>)}</tbody></table></div>}
        </section>

        <DuplicateMonitoring
          data={duplicateMonitoring}
          state={panelState.duplicates}
          updatedAt={panelUpdatedAt.duplicates}
          onRetry={() => loadPanel("duplicates", () => getAdminSystemDuplicateMonitoring(token), setDuplicateMonitoring)}
        />

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

function DuplicateMonitoring({ data, state, updatedAt, onRetry }) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const summary = data?.summary || {};
  const groups = data?.groups || [];
  const classificationLabels = {
    same_user_format_or_duplicate: "User sama / format ganda",
    same_client_multi_user: "Antar-user satu client",
    cross_client: "Lintas client",
  };
  const groupLabels = { nrp: "NRP", instagram: "Instagram", tiktok: "TikTok" };
  const displayDuplicateValue = (group) => group.platform === "nrp" ? group.username : `@${group.username}`;
  const buildWhatsappMessage = (group) => {
    const records = group?.records || [];
    const source = records[0]?.client_name || records[0]?.client_id || "Tidak diketahui";
    const detail = records.map((record, index) => [
      `DATA USER ${index + 1}`,
      `• Nama: ${record.name || "-"}`,
      `• Pangkat/Jabatan: ${record.title || record.jabatan || "-"}`,
      `• NRP/User ID: ${record.user_id || "-"}`,
      `• Polres/Client: ${record.client_name || record.client_id || "-"}`,
      `• Platform: ${String(group.platform || "").toUpperCase()}`,
      `• Username: @${record.username || group.username}`,
      `• Sumber akun: ${record.source === "additional" ? `akun tambahan${record.account_order != null ? ` #${record.account_order}` : ""}` : "field utama"}`,
    ].join("\n")).join("\n\n");
    const reason = group.platform === "tiktok"
      ? "Data TikTok diusulkan untuk dihapus karena username tidak sesuai dengan identitas atau ketentuan akun yang berlaku."
      : "Data Instagram terindikasi duplikat berdasarkan username yang sama setelah normalisasi dan menunggu verifikasi.";
    return [
      "⚠️ PEMBERITAHUAN DATA DUPLIKASI",
      "",
      "Data berikut belum dihapus dan diusulkan untuk ditindaklanjuti setelah verifikasi.",
      "",
      "📍 SUMBER DATA",
      `• Polres/Client: ${source}`,
      `• Platform: ${String(group.platform || "").toUpperCase()}`,
      `• Username terdeteksi: @${group.username}`,
      `• Klasifikasi: ${classificationLabels[group.classification] || group.classification}`,
      `• Kemunculan: ${group.occurrences || records.length}`,
      "",
      detail,
      "",
      "🗑️ DATA YANG DIUSULKAN UNTUK DIHAPUS",
      reason,
      "",
      "✅ TINDAKAN YANG DIMINTA",
      "Mohon verifikasi data yang benar untuk dipertahankan dan data yang dapat dihapus.",
      "",
      "⚠️ Tidak ada data yang dihapus pada tahap pemberitahuan ini. Penghapusan hanya dilakukan setelah konfirmasi administrator.",
      `Waktu pemeriksaan: ${data?.checked_at ? new Date(data.checked_at).toLocaleString("id-ID") : "-"}`,
      "",
      "Admin System Console",
    ].join("\n");
  };
  return (
    <section className="rounded-xl border border-amber-400/20 bg-slate-900/90 p-5 shadow-lg shadow-amber-950/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_10px_#fcd34d]" />
            <h2 className="text-lg font-semibold">Duplicate Data Monitoring</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">Monitoring read-only dengan tiga kelompok terpisah: NRP dashboard yang sama, username Instagram yang sama, dan username TikTok yang sama. Username sosial dinormalisasi dari URL, @, dan huruf besar-kecil.</p>
        </div>
        <PanelMeta state={state} updatedAt={updatedAt} onRetry={onRetry} />
      </div>
      {state === "ready" && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <MonitoringStat label="Grup duplikat" value={summary.total_groups ?? 0} tone={summary.total_groups ? "rose" : "emerald"} />
            <MonitoringStat label="NRP" value={summary.nrp?.groups ?? 0} tone="cyan" />
            <MonitoringStat label="Instagram" value={summary.instagram?.groups ?? 0} tone="cyan" />
            <MonitoringStat label="TikTok" value={summary.tiktok?.groups ?? 0} tone="cyan" />
            <MonitoringStat label="Kemunculan" value={summary.total_occurrences ?? 0} tone="amber" />
          </div>
          <div className="mt-4 overflow-auto rounded-lg border border-slate-800">
            {groups.length === 0 ? <p className="p-4 text-sm text-emerald-300">Tidak ditemukan duplikasi aktif.</p> : (
              <table className="w-full min-w-[760px] text-xs">
                <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="p-3">Kelompok</th><th className="p-3">Nilai duplikat</th><th className="p-3">Klasifikasi</th><th className="p-3">User</th><th className="p-3">Client</th></tr></thead>
                <tbody>{groups.slice(0, 20).map((group) => <tr key={`${group.platform}:${group.username}`} onClick={() => { setSelectedGroup(group); setWhatsappMessage(""); setCopied(false); }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedGroup(group); setWhatsappMessage(""); setCopied(false); } }} tabIndex={0} role="button" aria-label={`Lihat grup duplikat ${groupLabels[group.platform] || group.platform} ${group.username}`} className={`cursor-pointer border-b border-slate-900 last:border-0 transition hover:bg-cyan-400/10 focus:bg-cyan-400/10 focus:outline-none ${selectedGroup?.platform === group.platform && selectedGroup?.username === group.username ? "bg-cyan-400/10" : ""}`}><td className="p-3 uppercase text-cyan-300">{groupLabels[group.platform] || group.platform}</td><td className="p-3 font-semibold text-slate-200">{displayDuplicateValue(group)}</td><td className="p-3 text-amber-200">{classificationLabels[group.classification] || group.classification}</td><td className="p-3 text-slate-300">{group.unique_users}</td><td className="p-3 text-slate-400">{group.unique_clients}</td></tr>)}</tbody>
              </table>
            )}
          </div>
          {selectedGroup && (
            <div className="rounded-lg border border-cyan-400/30 bg-cyan-400/5 p-4" aria-live="polite">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Detail user duplikat</div>
                  <h3 className="mt-1 text-base font-semibold text-slate-100">{groupLabels[selectedGroup.platform] || selectedGroup.platform.toUpperCase()} · {displayDuplicateValue(selectedGroup)}</h3>
                  <p className="mt-1 text-xs text-slate-400">{classificationLabels[selectedGroup.classification] || selectedGroup.classification} · {selectedGroup.occurrences} kemunculan</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setWhatsappMessage(buildWhatsappMessage(selectedGroup)); setCopied(false); }} className="rounded-md border border-emerald-400/40 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/20">Buat pesan WhatsApp</button>
                  <button type="button" onClick={() => { setSelectedGroup(null); setWhatsappMessage(""); setCopied(false); }} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-cyan-400/50 hover:text-cyan-200">Tutup detail</button>
                </div>
              </div>
              <div className="mt-3 overflow-auto rounded-md border border-slate-800">
                <table className="w-full min-w-[680px] text-xs">
                  <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="p-3">User ID</th><th className="p-3">Nama</th><th className="p-3">Client</th><th className="p-3">Sumber</th><th className="p-3">Nilai normal</th></tr></thead>
                  <tbody>{(selectedGroup.records || []).map((record, index) => <tr key={`${record.user_id}:${record.source}:${index}`} className="border-b border-slate-900 last:border-0"><td className="p-3 font-mono text-cyan-200">{record.user_id}</td><td className="p-3 text-slate-200">{record.name || "-"}</td><td className="p-3 text-slate-300">{record.client_name || record.client_id || "-"}</td><td className="p-3 text-slate-400">{record.source === "additional" ? `akun tambahan${record.account_order != null ? ` #${record.account_order}` : ""}` : record.source === "dashboard" ? "dashboard" : "field utama"}</td><td className="p-3 text-amber-200">{selectedGroup.platform === "nrp" ? record.username : `@${record.username}`}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {(selectedGroup.records || []).map((record, index) => (
                  <article key={`full:${record.user_id}:${record.source}:${index}`} className="rounded-md border border-slate-800 bg-slate-950/60 p-3 text-xs">
                    <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-semibold text-cyan-200">Data user lengkap #{index + 1}</span>
                      <span className="text-amber-200">{selectedGroup.platform === "nrp" ? record.username : `@${record.username}`}</span>
                    </div>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-slate-300">
                      <dt className="text-slate-500">NRP</dt><dd>{record.nrp || record.user_id || "-"}</dd>
                      <dt className="text-slate-500">Username login</dt><dd>{record.login_username || "-"}</dd>
                      <dt className="text-slate-500">Nama personel</dt><dd>{record.name || "-"}</dd>
                      <dt className="text-slate-500">Pangkat</dt><dd>{record.title || "-"}</dd>
                      <dt className="text-slate-500">Jabatan</dt><dd>{record.jabatan || "-"}</dd>
                      <dt className="text-slate-500">Satfung</dt><dd>{record.divisi || "-"}</dd>
                      <dt className="text-slate-500">Desa binaan</dt><dd>{record.desa || "-"}</dd>
                      <dt className="text-slate-500">Role</dt><dd>{record.roles || "-"}</dd>
                      <dt className="text-slate-500">Email</dt><dd className="break-all">{record.email || "-"}</dd>
                      <dt className="text-slate-500">WhatsApp</dt><dd>{record.whatsapp || "-"}</dd>
                      <dt className="text-slate-500">Satker/Client</dt><dd>{record.client_name || record.client_id || "-"}</dd>
                      <dt className="text-slate-500">Sumber</dt><dd>{record.source === "additional" ? `akun tambahan${record.account_order != null ? ` #${record.account_order}` : ""}` : record.source === "dashboard" ? "dashboard" : "field utama"}</dd>
                    </dl>
                  </article>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-500">Klik baris lain untuk membandingkan grup duplikasi berikutnya. Monitoring tidak melakukan perubahan data.</p>
              {whatsappMessage && (
                <div className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div><div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">Pratinjau pesan WhatsApp</div><p className="mt-1 text-xs text-slate-400">Pesan hanya dibuat untuk ditinjau atau disalin. Tidak ada pengiriman otomatis.</p></div>
                    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(whatsappMessage); setCopied(true); } catch { setCopied(false); } }} className="rounded-md border border-emerald-400/40 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-400/20">{copied ? "Tersalin" : "Salin pesan"}</button>
                  </div>
                  <textarea readOnly value={whatsappMessage} className="mt-3 min-h-[320px] w-full rounded-md border border-slate-700 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-200 outline-none" aria-label="Pratinjau pesan WhatsApp" />
                </div>
              )}
            </div>
          )}
          {data?.truncated && <p className="mt-2 text-[10px] text-amber-300">Detail dibatasi 100 grup. Gunakan audit lanjutan untuk pemeriksaan penuh.</p>}
          <p className="mt-2 text-[10px] text-slate-500">Sumber: {data?.source?.active_users ?? 0} user aktif · probe {data?.latency_ms ?? "-"} ms · {data?.checked_at ? new Date(data.checked_at).toLocaleString("id-ID") : "-"}</p>
        </>
      )}
    </section>
  );
}

function LiveMonitoring({ panelState, panelErrors, panelUpdatedAt, panelDurations, events }) {
  const labels = {
    overview: "Ringkasan sistem",
    health: "Health & integrasi",
    topology: "Topology & pipeline",
    clients: "Ringkasan client",
    clientList: "Daftar client",
    audit: "Audit konfigurasi",
    duplicates: "Duplikasi data",
  };
  const entries = Object.entries(labels);
  const ready = entries.filter(([key]) => panelState[key] === "ready").length;
  const errors = entries.filter(([key]) => panelState[key] === "error").length;
  const latest = Object.values(panelUpdatedAt).filter(Boolean).sort().at(-1);

  return (
    <section className="rounded-xl border border-cyan-400/20 bg-slate-900/90 p-5 shadow-lg shadow-cyan-950/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_#67e8f9]" />
            <h2 className="text-lg font-semibold">Live Monitoring & Data Detail</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-slate-400">
            Ringkasan pemeriksaan read-only untuk mengetahui sumber data yang sehat, gagal, terlambat, dan waktu data terakhir diperbarui.
          </p>
        </div>
        <div className="text-right text-[10px] uppercase tracking-wide text-slate-500">
          <div>{latest ? `pemeriksaan terakhir ${new Date(latest).toLocaleTimeString("id-ID")}` : "belum ada pemeriksaan"}</div>
          <div className="mt-1 text-cyan-300">{ready}/{entries.length} panel siap</div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <MonitoringStat label="Panel siap" value={ready} tone="emerald" />
        <MonitoringStat label="Panel bermasalah" value={errors} tone={errors ? "rose" : "slate"} />
        <MonitoringStat label="Event tercatat" value={events.length} tone="cyan" />
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {entries.map(([key, label]) => (
          <div key={key} className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-200">{label}</span>
              <HealthBadge status={panelState[key] === "ready" ? "ok" : panelState[key] === "error" ? "degraded" : panelState[key] === "loading" ? "warning" : "unknown"} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>{panelDurations[key] != null ? `${panelDurations[key]} ms` : "-"}</span>
              <span>{panelUpdatedAt[key] ? new Date(panelUpdatedAt[key]).toLocaleTimeString("id-ID") : "belum tersedia"}</span>
            </div>
            {panelState[key] === "error" && <p className="mt-2 truncate text-[10px] text-rose-300" title={panelErrors[key]}>{panelErrors[key] || "Sumber data gagal"}</p>}
          </div>
        ))}
      </div>

      <details className="mt-4 rounded-lg border border-slate-800 bg-slate-950/60">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-cyan-300">Buka riwayat pemeriksaan terakhir</summary>
        <div className="max-h-56 overflow-auto border-t border-slate-800">
          {events.length === 0 ? <p className="p-3 text-xs text-slate-500">Belum ada event monitoring.</p> : events.map((event, index) => (
            <div key={`${event.at}-${event.key}-${index}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 px-3 py-2 text-[10px] last:border-0">
              <span className={event.status === "ready" ? "text-emerald-300" : "text-rose-300"}>{event.status === "ready" ? "OK" : "ERROR"} · {labels[event.key] || event.key}</span>
              <span className="text-slate-500">{event.duration} ms · {new Date(event.at).toLocaleTimeString("id-ID")}</span>
            </div>
          ))}
        </div>
      </details>
    </section>
  );
}

function MonitoringStat({ label, value, tone }) {
  const tones = {
    emerald: "text-emerald-300 border-emerald-400/20 bg-emerald-400/5",
    rose: "text-rose-300 border-rose-400/20 bg-rose-400/5",
    cyan: "text-cyan-300 border-cyan-400/20 bg-cyan-400/5",
    slate: "text-slate-300 border-slate-700 bg-slate-950/50",
  };
  return <div className={`rounded-lg border p-3 ${tones[tone] || tones.slate}`}><div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div><div className="mt-1 text-2xl font-bold">{value}</div></div>;
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
