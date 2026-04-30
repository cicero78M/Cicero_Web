"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useRequireSystemAdminAuth from "@/hooks/useRequireSystemAdminAuth";
import {
  approveFundRequest,
  createFundRequest,
  createFundTransaction,
  exportFundAuditCsv,
  getAdminSystemFunds,
  getFundAuditLogs,
  getFundPeriodSummary,
  getFundRequests,
  getFundTransactions,
  rejectFundRequest,
} from "@/utils/adminSystemApi";

export default function AdminSystemFundsPage() {
  const { token, isHydrating } = useRequireSystemAdminAuth();
  const [summary, setSummary] = useState(null);
  const [periodSummary, setPeriodSummary] = useState([]);
  const [period, setPeriod] = useState("daily");
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [error, setError] = useState("");

  const [reqStatus, setReqStatus] = useState("");
  const [txDirection, setTxDirection] = useState("");
  const [auditAction, setAuditAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [reqPage, setReqPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const [auditPage, setAuditPage] = useState(1);

  const [reqPagination, setReqPagination] = useState({ total_pages: 1 });
  const [txPagination, setTxPagination] = useState({ total_pages: 1 });
  const [auditPagination, setAuditPagination] = useState({ total_pages: 1 });

  const [txForm, setTxForm] = useState({ category: "", amount: "", direction: "outflow", description: "" });
  const [reqForm, setReqForm] = useState({ title: "", requested_amount: "", note: "" });

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRequestId, setRejectRequestId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const loadAll = async () => {
    if (!token) return;
    setError("");
    try {
      const commonDate = { start_date: startDate || undefined, end_date: endDate || undefined };
      const [fundSummary, tx, reqs, audits, periodRows] = await Promise.all([
        getAdminSystemFunds(token),
        getFundTransactions(token, { page: txPage, limit: 20, direction: txDirection || undefined, ...commonDate }),
        getFundRequests(token, { page: reqPage, limit: 20, status: reqStatus || undefined, ...commonDate }),
        getFundAuditLogs(token, { page: auditPage, limit: 20, action_type: auditAction || undefined, ...commonDate }),
        getFundPeriodSummary(token, period),
      ]);

      setSummary(fundSummary);
      setTransactions(Array.isArray(tx?.data) ? tx.data : []);
      setTxPagination(tx?.pagination || { total_pages: 1 });
      setRequests(Array.isArray(reqs?.data) ? reqs.data : []);
      setReqPagination(reqs?.pagination || { total_pages: 1 });
      setAuditLogs(Array.isArray(audits?.data) ? audits.data : []);
      setAuditPagination(audits?.pagination || { total_pages: 1 });
      setPeriodSummary(Array.isArray(periodRows) ? periodRows : Array.isArray(periodRows?.data) ? periodRows.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat data dana");
    }
  };

  useEffect(() => {
    loadAll();
  }, [token, reqStatus, txDirection, auditAction, reqPage, txPage, auditPage, startDate, endDate, period]);

  if (isHydrating) return <div className="min-h-screen bg-slate-950 text-slate-100 p-6">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Manajemen Dana Sistem</h1>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-emerald-500 text-slate-950 text-sm font-semibold" onClick={async () => { if (!token) return; try { const blob = await exportFundAuditCsv(token); const href = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = href; a.download = "fund-audit-log.csv"; a.click(); URL.revokeObjectURL(href); } catch (err) { setError(err instanceof Error ? err.message : "Gagal export CSV"); } }}>Export CSV</button>
            <Link href="/admin-system" className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm">Kembali</Link>
          </div>
        </div>

        {error && <div className="text-rose-400 text-sm">{error}</div>}

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card label="Transaksi" value={summary?.stats?.total_transactions ?? 0} />
          <Card label="Pending" value={summary?.stats?.total_pending_requests ?? 0} />
          <Card label="Inflow" value={`Rp ${fmt(summary?.stats?.total_inflow)}`} />
          <Card label="Outflow" value={`Rp ${fmt(summary?.stats?.total_outflow)}`} />
          <Card label="Saldo" value={`Rp ${fmt(summary?.stats?.current_balance)}`} />
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <DateField label="Start" value={startDate} onChange={(v) => { setStartDate(v); setReqPage(1); setTxPage(1); setAuditPage(1); }} />
            <DateField label="End" value={endDate} onChange={(v) => { setEndDate(v); setReqPage(1); setTxPage(1); setAuditPage(1); }} />
            <button className="px-3 py-2 rounded bg-slate-800 border border-slate-700" onClick={() => { setStartDate(""); setEndDate(""); }}>Reset tanggal</button>
            <select className="px-3 py-2 rounded bg-slate-800 border border-slate-700" value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="daily">Ringkasan Harian</option><option value="weekly">Ringkasan Mingguan</option><option value="monthly">Ringkasan Bulanan</option>
            </select>
          </div>

          <SimpleTable
            title="Ringkasan Periode"
            headers={["Bucket", "Inflow", "Outflow", "Net"]}
            rows={periodSummary.map((r) => [r.bucket, money(r.inflow), money(r.outflow), money(r.net)])}
          />
        </div>

        <section className="grid lg:grid-cols-2 gap-4">
          <Panel title="Tambah Transaksi">
            <form className="grid gap-2" onSubmit={async (e) => { e.preventDefault(); if (!token) return; try { await createFundTransaction(token, { category: txForm.category, amount: Number(txForm.amount), direction: txForm.direction, description: txForm.description || undefined }); setTxForm({ category: "", amount: "", direction: "outflow", description: "" }); await loadAll(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal tambah transaksi"); } }}>
              <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="Kategori" value={txForm.category} onChange={(e) => setTxForm((s) => ({ ...s, category: e.target.value }))} required />
              <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="Amount" type="number" value={txForm.amount} onChange={(e) => setTxForm((s) => ({ ...s, amount: e.target.value }))} required />
              <select className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" value={txForm.direction} onChange={(e) => setTxForm((s) => ({ ...s, direction: e.target.value }))}><option value="outflow">outflow</option><option value="inflow">inflow</option></select>
              <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="Deskripsi" value={txForm.description} onChange={(e) => setTxForm((s) => ({ ...s, description: e.target.value }))} />
              <button className="px-3 py-2 rounded bg-cyan-500 text-slate-950 font-semibold">Simpan</button>
            </form>
          </Panel>

          <Panel title="Buat Request Dana">
            <form className="grid gap-2" onSubmit={async (e) => { e.preventDefault(); if (!token) return; try { await createFundRequest(token, { title: reqForm.title, requested_amount: Number(reqForm.requested_amount), note: reqForm.note || undefined }); setReqForm({ title: "", requested_amount: "", note: "" }); await loadAll(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal buat request"); } }}>
              <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="Judul" value={reqForm.title} onChange={(e) => setReqForm((s) => ({ ...s, title: e.target.value }))} required />
              <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="Nominal" type="number" value={reqForm.requested_amount} onChange={(e) => setReqForm((s) => ({ ...s, requested_amount: e.target.value }))} required />
              <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="Catatan" value={reqForm.note} onChange={(e) => setReqForm((s) => ({ ...s, note: e.target.value }))} />
              <button className="px-3 py-2 rounded bg-emerald-500 text-slate-950 font-semibold">Kirim</button>
            </form>
          </Panel>
        </section>

        <SimpleTable
          title="Request Dana"
          controls={<select className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" value={reqStatus} onChange={(e) => { setReqStatus(e.target.value); setReqPage(1); }}><option value="">all</option><option value="pending">pending</option><option value="approved">approved</option><option value="rejected">rejected</option></select>}
          headers={["Title", "Nominal", "Status", "Catatan", "Aksi"]}
          rows={requests.map((r) => [
            r.title,
            money(r.requested_amount),
            <Badge key={`b-${r.request_id}`} status={r.status} />,
            r.note || '-',
            r.status === 'pending' ? <div key={`a-${r.request_id}`} className="flex gap-2"><button className="px-2 py-1 rounded bg-amber-400 text-slate-950 text-xs font-semibold" onClick={async () => { if (!token) return; try { await approveFundRequest(token, r.request_id); await loadAll(); } catch (err) { setError(err instanceof Error ? err.message : 'Gagal approve'); } }}>Approve</button><button className="px-2 py-1 rounded bg-rose-500 text-white text-xs font-semibold" onClick={() => { setRejectRequestId(r.request_id); setRejectReason(''); setRejectModalOpen(true); }}>Reject</button></div> : '-'
          ])}
          footer={<Pagination page={reqPage} totalPages={reqPagination.total_pages || 1} onPrev={() => setReqPage((p) => Math.max(1, p - 1))} onNext={() => setReqPage((p) => Math.min(reqPagination.total_pages || 1, p + 1))} />}
        />

        <SimpleTable
          title="Transaksi"
          controls={<select className="i" value={txDirection} onChange={(e) => { setTxDirection(e.target.value); setTxPage(1); }}><option value="">all</option><option value="inflow">inflow</option><option value="outflow">outflow</option></select>}
          headers={["Kategori", "Direction", "Amount", "Created"]}
          rows={transactions.map((t) => [t.category, t.direction, money(t.amount), new Date(t.created_at).toLocaleString("id-ID")])}
          footer={<Pagination page={txPage} totalPages={txPagination.total_pages || 1} onPrev={() => setTxPage((p) => Math.max(1, p - 1))} onNext={() => setTxPage((p) => Math.min(txPagination.total_pages || 1, p + 1))} />}
        />

        <SimpleTable
          title="Audit"
          controls={<input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="action_type" value={auditAction} onChange={(e) => { setAuditAction(e.target.value); setAuditPage(1); }} />}
          headers={["Action", "Role", "Waktu", "Notes"]}
          rows={auditLogs.map((a) => [a.action_type, a.actor_admin_role, new Date(a.created_at).toLocaleString("id-ID"), a.notes || '-'])}
          footer={<Pagination page={auditPage} totalPages={auditPagination.total_pages || 1} onPrev={() => setAuditPage((p) => Math.max(1, p - 1))} onNext={() => setAuditPage((p) => Math.min(auditPagination.total_pages || 1, p + 1))} />}
        />
      </div>

      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
            <h3 className="font-semibold">Tolak Request Dana</h3>
            <textarea className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm min-h-24 w-full" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Alasan penolakan" />
            <div className="flex justify-end gap-2"><button className="px-3 py-2 rounded bg-slate-800 border border-slate-700" onClick={() => setRejectModalOpen(false)}>Batal</button><button className="px-3 py-2 rounded bg-rose-500 text-white text-xs font-semibold" onClick={async () => { if (!token || !rejectRequestId) return; if (!rejectReason.trim()) return setError("Alasan wajib diisi"); try { await rejectFundRequest(token, rejectRequestId, rejectReason.trim()); setRejectModalOpen(false); await loadAll(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal reject"); } }}>Konfirmasi</button></div>
          </div>
        </div>
      )}

    </main>
  );
}

function fmt(v) { return Number(v || 0).toLocaleString("id-ID"); }
function money(v) { return `Rp ${fmt(v)}`; }

function Card({ label, value }) {
  return <div className="rounded-lg border border-slate-700 bg-slate-950 p-3"><div className="text-xs text-slate-400">{label}</div><div className="font-semibold mt-1">{value}</div></div>;
}

function DateField({ label, value, onChange }) {
  return <div><label className="text-xs text-slate-400 block">{label}</label><input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" /></div>;
}

function Panel({ title, children }) {
  return <section className="rounded-xl border border-slate-700 bg-slate-900 p-4"><h2 className="font-semibold mb-3">{title}</h2>{children}</section>;
}

function Badge({ status }) {
  const map = { pending: 'bg-amber-400/20 text-amber-300 border-amber-600/40', approved: 'bg-emerald-400/20 text-emerald-300 border-emerald-600/40', rejected: 'bg-rose-400/20 text-rose-300 border-rose-600/40' };
  return <span className={`px-2 py-1 rounded border text-xs ${map[status] || 'bg-slate-700 text-slate-200 border-slate-600'}`}>{status}</span>;
}

function SimpleTable({ title, headers, rows, controls, footer }) {
  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <div className="flex justify-between items-center mb-3"><h2 className="font-semibold">{title}</h2>{controls}</div>
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-slate-400">{headers.map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}</tr></thead>
          <tbody>{rows.map((row, i) => <tr key={i} className="border-t border-slate-800">{row.map((cell, j) => <td key={j} className="py-2 pr-3">{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {footer}
    </section>
  );
}

function Pagination({ page, totalPages, onPrev, onNext }) {
  return <div className="flex items-center gap-2 pt-2"><button onClick={onPrev} disabled={page <= 1} className="px-3 py-1 rounded bg-slate-800 border border-slate-700 disabled:opacity-40">Prev</button><span className="text-xs text-slate-400">Page {page}/{Math.max(1, totalPages)}</span><button onClick={onNext} disabled={page >= Math.max(1, totalPages)} className="px-3 py-1 rounded bg-slate-800 border border-slate-700 disabled:opacity-40">Next</button></div>;
}
