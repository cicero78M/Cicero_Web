"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useRequireSystemAdminAuth from "@/hooks/useRequireSystemAdminAuth";
import { decideAdminSystemPaymentRequest, getAdminSystemPaymentRequests } from "@/utils/adminSystemApi";

export default function AdminPaymentsPage() {
  const { token, isHydrating } = useRequireSystemAdminAuth();
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState({});
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");

  const load = async () => {
    if (!token) return;
    try {
      setError("");
      const data = await getAdminSystemPaymentRequests(token, { page, limit: 20, status: status || undefined });
      setRows(Array.isArray(data?.data) ? data.data : []);
      setSummary(data?.summary || {});
      setPages(Math.max(1, Number(data?.pagination?.total_pages || 1)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal load payment requests");
    }
  };

  useEffect(() => {
    load();
  }, [token, page, status]);

  if (isHydrating) return <div className="min-h-screen bg-slate-950 text-slate-100 p-6">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Payment Workflow (User ↔ Admin)</h1>
          <Link href="/admin-system" className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm">Kembali</Link>
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 grid md:grid-cols-5 gap-3 text-sm">
          <Metric label="Pending" value={summary?.pending ?? 0} />
          <Metric label="Confirmed" value={summary?.confirmed ?? 0} />
          <Metric label="Approved" value={summary?.approved ?? 0} />
          <Metric label="Rejected" value={summary?.rejected ?? 0} />
          <Metric label="Pending Amount" value={`Rp ${Number(summary?.pending_amount || 0).toLocaleString("id-ID")}`} />
        </div>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <select className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">all</option>
            <option value="pending">pending</option>
            <option value="confirmed">confirmed</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="expired">expired</option>
          </select>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-slate-400"><th className="py-2 pr-3">User</th><th className="py-2 pr-3">Client</th><th className="py-2 pr-3">Tier</th><th className="py-2 pr-3">Amount</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Aksi</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.request_id} className="border-t border-slate-800">
                    <td className="py-2 pr-3">{r.username}</td>
                    <td className="py-2 pr-3">{r.client_id || "-"}</td>
                    <td className="py-2 pr-3">{r.premium_tier || "-"}</td>
                    <td className="py-2 pr-3">Rp {Number(r.transfer_amount || 0).toLocaleString("id-ID")}</td>
                    <td className="py-2 pr-3">{r.status}</td>
                    <td className="py-2 pr-3">
                      {(r.status === "pending" || r.status === "confirmed") ? (
                        <div className="flex gap-2">
                          <button className="px-2 py-1 rounded bg-emerald-500 text-slate-950 text-xs font-semibold" onClick={async () => { if (!token) return; try { await decideAdminSystemPaymentRequest(token, String(r.request_id), { status: "approved" }); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal approve"); } }}>Approve</button>
                          <button className="px-2 py-1 rounded bg-rose-500 text-white text-xs font-semibold" onClick={async () => { if (!token) return; const note = prompt("Alasan reject (opsional):") || ""; try { await decideAdminSystemPaymentRequest(token, String(r.request_id), { status: "rejected", note }); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal reject"); } }}>Reject</button>
                        </div>
                      ) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 rounded bg-slate-800 border border-slate-700 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <span className="text-xs text-slate-400">Page {page}/{pages}</span>
            <button className="px-3 py-1 rounded bg-slate-800 border border-slate-700 disabled:opacity-40" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-lg border border-slate-700 bg-slate-950 p-3"><div className="text-xs text-slate-400">{label}</div><div className="font-semibold mt-1">{value}</div></div>;
}
