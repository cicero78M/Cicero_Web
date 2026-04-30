"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import useRequireSystemAdminAuth from "@/hooks/useRequireSystemAdminAuth";
import {
  createAdminSystemClient,
  deleteAdminSystemClient,
  getAdminSystemClients,
  updateAdminSystemClient,
} from "@/utils/adminSystemApi";

const emptyForm = {
  client_id: "",
  nama: "",
  client_type: "",
  client_group: "",
  regional_id: "",
  client_operator: "",
  client_super: "",
  client_insta: "",
  client_tiktok: "",
  client_status: true,
  client_insta_status: true,
  client_tiktok_status: true,
  client_amplify_status: true,
};

export default function AdminClientsPage() {
  const { token, isHydrating } = useRequireSystemAdminAuth();
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");

  const load = async () => {
    if (!token) return;
    try {
      setError("");
      const data = await getAdminSystemClients(token, { page, limit: 20, q: q || undefined });
      setRows(Array.isArray(data?.data) ? data.data : []);
      setPages(Math.max(1, Number(data?.pagination?.total_pages || 1)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal load client");
    }
  };

  useEffect(() => {
    load();
  }, [token, page]);

  if (isHydrating) return <div className="min-h-screen bg-slate-950 text-slate-100 p-6">Loading...</div>;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Client Data Management (CRUD)</h1>
          <Link href="/admin-system" className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm">Kembali</Link>
        </div>

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <h2 className="font-semibold">{editingId ? `Edit Client ${editingId}` : "Tambah Client"}</h2>
          <div className="grid md:grid-cols-5 gap-2">
            <input disabled={!!editingId} className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="client_id" value={form.client_id} onChange={(e) => setForm((s) => ({ ...s, client_id: e.target.value }))} />
            <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="nama" value={form.nama} onChange={(e) => setForm((s) => ({ ...s, nama: e.target.value }))} />
            <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="client_type" value={form.client_type} onChange={(e) => setForm((s) => ({ ...s, client_type: e.target.value }))} />
            <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="client_group" value={form.client_group} onChange={(e) => setForm((s) => ({ ...s, client_group: e.target.value }))} />
            <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="regional_id" value={form.regional_id} onChange={(e) => setForm((s) => ({ ...s, regional_id: e.target.value }))} />
            <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="client_operator" value={form.client_operator} onChange={(e) => setForm((s) => ({ ...s, client_operator: e.target.value }))} />
            <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="client_super" value={form.client_super} onChange={(e) => setForm((s) => ({ ...s, client_super: e.target.value }))} />
            <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="client_insta" value={form.client_insta} onChange={(e) => setForm((s) => ({ ...s, client_insta: e.target.value }))} />
            <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" placeholder="client_tiktok" value={form.client_tiktok} onChange={(e) => setForm((s) => ({ ...s, client_tiktok: e.target.value }))} />
          </div>
          <div className="grid md:grid-cols-4 gap-2 text-xs">
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.client_status)} onChange={(e) => setForm((s) => ({ ...s, client_status: e.target.checked }))} /> active</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.client_insta_status)} onChange={(e) => setForm((s) => ({ ...s, client_insta_status: e.target.checked }))} /> insta enabled</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.client_tiktok_status)} onChange={(e) => setForm((s) => ({ ...s, client_tiktok_status: e.target.checked }))} /> tiktok enabled</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(form.client_amplify_status)} onChange={(e) => setForm((s) => ({ ...s, client_amplify_status: e.target.checked }))} /> amplify enabled</label>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-cyan-500 text-slate-950 font-semibold text-sm" onClick={async () => {
              if (!token) return;
              if (!form.client_id && !editingId) return setError("client_id wajib diisi");
              if (!form.nama.trim()) return setError("nama wajib diisi");
              try {
                if (editingId) {
                  await updateAdminSystemClient(token, editingId, form);
                } else {
                  await createAdminSystemClient(token, form);
                }
                setForm(emptyForm);
                setEditingId("");
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Gagal simpan client");
              }
            }}>{editingId ? "Update" : "Tambah"}</button>
            {editingId && <button className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm" onClick={() => { setEditingId(""); setForm(emptyForm); }}>Batal</button>}
          </div>
        </section>

        <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <div className="flex gap-2">
            <input className="px-3 py-2 rounded bg-slate-800 border border-slate-700 text-sm w-full" placeholder="Cari client_id / nama / group" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="px-3 py-2 rounded bg-emerald-500 text-slate-950 text-sm font-semibold" onClick={() => { setPage(1); load(); }}>Cari</button>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400">
                  <th className="py-2 pr-3">ID</th><th className="py-2 pr-3">Nama</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">Group</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.client_id} className="border-t border-slate-800">
                    <td className="py-2 pr-3">{r.client_id}</td>
                    <td className="py-2 pr-3">{r.nama}</td>
                    <td className="py-2 pr-3">{r.client_type || "-"}</td>
                    <td className="py-2 pr-3">{r.client_group || "-"}</td>
                    <td className="py-2 pr-3">{String(r.client_status)}</td>
                    <td className="py-2 pr-3">
                      <div className="flex gap-2">
                        <button className="px-2 py-1 rounded bg-amber-400 text-slate-950 text-xs font-semibold" onClick={() => { setEditingId(r.client_id); setForm({ client_id: r.client_id || "", nama: r.nama || "", client_type: r.client_type || "", client_group: r.client_group || "", regional_id: r.regional_id || "", client_operator: r.client_operator || "", client_super: r.client_super || "", client_insta: r.client_insta || "", client_tiktok: r.client_tiktok || "", client_status: Boolean(r.client_status), client_insta_status: Boolean(r.client_insta_status), client_tiktok_status: Boolean(r.client_tiktok_status), client_amplify_status: Boolean(r.client_amplify_status) }); }}>Edit</button>
                        <button className="px-2 py-1 rounded bg-rose-500 text-white text-xs font-semibold" onClick={async () => {
                          if (!token) return;
                          if (!confirm(`Hapus client ${r.client_id}?`)) return;
                          try { await deleteAdminSystemClient(token, r.client_id); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Gagal hapus client"); }
                        }}>Hapus</button>
                      </div>
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
