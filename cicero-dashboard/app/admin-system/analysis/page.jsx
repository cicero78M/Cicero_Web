"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useRequireSystemAdminAuth from "@/hooks/useRequireSystemAdminAuth";
import {
  applyAdminSystemConfigChange,
  getAdminSystemConfigAnalysis,
  getAdminSystemConfigAudit,
  previewAdminSystemConfigChange,
  rollbackAdminSystemConfigChange,
} from "@/utils/adminSystemApi";

export default function AdminSystemAnalysisPage() {
  const { token, isHydrating } = useRequireSystemAdminAuth();
  const [configData, setConfigData] = useState(null);
  const [auditData, setAuditData] = useState([]);
  const [error, setError] = useState("");
  const [previewData, setPreviewData] = useState(null);

  const [configKey, setConfigKey] = useState("ADMIN_SYSTEM_OTP_TTL_SECONDS");
  const [configValue, setConfigValue] = useState("");
  const [notes, setNotes] = useState("");

  const load = async () => {
    if (!token) return;
    const [cfg, audit] = await Promise.all([
      getAdminSystemConfigAnalysis(token),
      getAdminSystemConfigAudit(token, { page: 1, limit: 20 }),
    ]);
    setConfigData(cfg);
    setAuditData(Array.isArray(audit?.data) ? audit.data : Array.isArray(audit) ? audit : []);
  };

  useEffect(() => {
    if (!token) return;
    load().catch((err) => setError(err instanceof Error ? err.message : "Gagal load system analysis"));
  }, [token]);

  if (isHydrating) return <div className="min-h-screen bg-slate-950 text-slate-100 p-6">Loading...</div>;

  const analysis = configData?.analysis || {};
  const cfg = configData?.config || {};

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">System Analysis</h1>
          <Link href="/admin-system" className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm">Kembali</Link>
        </div>

        {error && <div className="text-rose-400 text-sm">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card label="Risk Level" value={analysis.riskLevel || "-"} />
          <Card label="Healthy" value={String(Boolean(analysis.healthy))} />
          <Card label="Admin Chat IDs" value={cfg.total_admin_chat_ids ?? 0} />
          <Card label="Role Mappings" value={cfg.total_role_mappings ?? 0} />
        </div>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <h2 className="font-semibold">Config Change (Super Admin)</h2>
          <div className="grid md:grid-cols-3 gap-2">
            <select value={configKey} onChange={(e) => setConfigKey(e.target.value)} className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm">
              <option>ADMIN_SYSTEM_OTP_TTL_SECONDS</option>
              <option>ADMIN_SYSTEM_SESSION_TTL_SECONDS</option>
              <option>ADMIN_SYSTEM_PAGINATION_DEFAULT_LIMIT</option>
              <option>ADMIN_SYSTEM_PAGINATION_MAX_LIMIT</option>
              <option>ADMIN_SYSTEM_TIMEZONE</option>
              <option>ADMIN_SYSTEM_ROLE_MAP</option>
              <option>TELEGRAM_ADMIN_CHAT_ID</option>
            </select>
            <input value={configValue} onChange={(e) => setConfigValue(e.target.value)} placeholder="Nilai baru" className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" />
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan perubahan" className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" />
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-cyan-500 text-slate-950 font-semibold" onClick={async () => {
              if (!token) return;
              try {
                const data = await previewAdminSystemConfigChange(token, { config_key: configKey, config_value: configValue });
                setPreviewData(data);
                setError("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Preview gagal");
              }
            }}>Preview Impact</button>
            <button className="px-3 py-2 rounded bg-emerald-500 text-slate-950 font-semibold" onClick={async () => {
              if (!token) return;
              try {
                await applyAdminSystemConfigChange(token, {
                  config_key: configKey,
                  config_value: configValue,
                  notes,
                  confirmation_token: previewData?.data?.confirmation_token,
                  persist_to_env: true,
                });
                await load();
                setError("");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Apply gagal");
              }
            }}>Apply + Persist</button>
          </div>
          {previewData?.data && (
            <div className="text-sm text-slate-300 border border-slate-700 rounded p-3">
              <div>Key: {previewData.data.config_key}</div>
              <div>Old: {String(previewData.data.old_value ?? "")}</div>
              <div>New: {String(previewData.data.new_value ?? "")}</div>
              <div>Would change: {String(previewData.data.would_change)}</div>
              <div>Next risk level: {previewData.data.next_analysis?.riskLevel || "-"}</div>
              <div>Critical: {String(Boolean(previewData.data.is_critical))}</div>
              {previewData.data.confirmation_token && <div>Confirmation token: {previewData.data.confirmation_token}</div>}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="font-semibold">Issues</h2>
          <ul className="mt-2 text-sm text-rose-300 list-disc pl-5">
            {(analysis.issues || []).length === 0 ? <li>Tidak ada issue kritis</li> : (analysis.issues || []).map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <h2 className="font-semibold">Warnings</h2>
          <ul className="mt-2 text-sm text-amber-300 list-disc pl-5">
            {(analysis.warnings || []).length === 0 ? <li>Tidak ada warning</li> : (analysis.warnings || []).map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Config Audit Trail</h2>
            <button
              className="px-3 py-2 rounded bg-amber-500 text-slate-950 font-semibold text-xs"
              onClick={async () => {
                if (!token) return;
                try {
                  await rollbackAdminSystemConfigChange(token, {
                    config_key: configKey,
                    notes: `Rollback from UI for ${configKey}`,
                  });
                  await load();
                  setError("");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Rollback gagal");
                }
              }}
            >
              Rollback terakhir key ini
            </button>
          </div>
          <div className="overflow-auto mt-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-2 pr-3">Waktu</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Key</th>
                  <th className="py-2 pr-3">Old</th>
                  <th className="py-2 pr-3">New</th>
                </tr>
              </thead>
              <tbody>
                {auditData.length === 0 ? (
                  <tr><td className="py-2 text-slate-500" colSpan={5}>Belum ada audit konfigurasi</td></tr>
                ) : auditData.map((row) => (
                  <tr key={row.audit_id} className="border-t border-slate-800">
                    <td className="py-2 pr-3">{new Date(row.created_at).toLocaleString("id-ID")}</td>
                    <td className="py-2 pr-3">{row.action_type}</td>
                    <td className="py-2 pr-3">{row.config_key}</td>
                    <td className="py-2 pr-3">{row.old_value || "-"}</td>
                    <td className="py-2 pr-3">{row.new_value || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}
