import { Check, Pencil, X } from "lucide-react";
import UserIdentityDisplay from "@/components/users/UserIdentityDisplay";

type Props = {
  currentRows: Array<Record<string, any>>;
  page: number;
  pageSize: number;
  columnLabel: string;
  showKesatuanColumn: boolean;
  editingRowId: string | null;
  editPangkat: string;
  editNama: string;
  editNrpNip: string;
  editSatfung: string;
  updateLoading: boolean;
  updateError: string;
  isOriginalDirectorateRole: boolean;
  toggleStatusLoadingId: string | null;
  isUserActive: (u: Record<string, any>) => boolean;
  setEditPangkat: (v: string) => void;
  setEditNama: (v: string) => void;
  setEditNrpNip: (v: string) => void;
  setEditSatfung: (v: string) => void;
  setEditingRowId: (v: string | null) => void;
  handleUpdateRow: (userId: string) => void;
  handleEditClick: (u: Record<string, any>) => void;
  openDeactivateModal: (u: Record<string, any>) => void;
  handleActivateUser: (u: Record<string, any>) => void;
};

export default function UserDirectoryTable(props: Props) {
  const {
    currentRows,
    page,
    pageSize,
    columnLabel,
    showKesatuanColumn,
    editingRowId,
    editPangkat,
    editNama,
    editNrpNip,
    editSatfung,
    updateLoading,
    updateError,
    isOriginalDirectorateRole,
    toggleStatusLoadingId,
    isUserActive,
    setEditPangkat,
    setEditNama,
    setEditNrpNip,
    setEditSatfung,
    setEditingRowId,
    handleUpdateRow,
    handleEditClick,
    openDeactivateModal,
    handleActivateUser,
  } = props;

  return (
    <div className="relative mt-6 hidden overflow-x-auto overflow-y-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl backdrop-blur md:block">
      <table className="w-full table-fixed text-sm text-slate-700">
        <thead className="bg-sky-50 text-slate-600">
          <tr className="text-left text-xs uppercase tracking-wider">
            <th className="w-16 px-4 py-3 font-medium whitespace-normal break-words">No</th>
            <th className="w-48 px-4 py-3 font-medium whitespace-normal break-words">Nama</th>
            <th className="w-36 px-4 py-3 font-medium whitespace-normal break-words">NRP/NIP</th>
            <th className="w-48 px-4 py-3 font-medium whitespace-normal break-words">{columnLabel}</th>
            <th className="w-32 px-4 py-3 font-medium whitespace-normal break-words">Aksi</th>
            <th className="w-40 px-4 py-3 font-medium whitespace-normal break-words">Instagram</th>
            <th className="w-40 px-4 py-3 font-medium whitespace-normal break-words">TikTok</th>
          </tr>
        </thead>
        <tbody>
          {currentRows.map((u, idx) => (
            <tr key={u.user_id || idx} className={`border-t border-slate-200 transition hover:bg-sky-50 ${editingRowId === u.user_id ? "bg-sky-100/60" : "bg-transparent"}`}>
              <td className="px-4 py-3 text-slate-600 whitespace-normal break-words">{(page - 1) * pageSize + idx + 1}</td>
              <td className="px-4 py-3 text-slate-700 whitespace-normal break-words">
                {editingRowId === u.user_id ? (
                  <div className="flex gap-2">
                    <input value={editPangkat} onChange={(e) => setEditPangkat(e.target.value)} placeholder="Pangkat" className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none" />
                    <input value={editNama} onChange={(e) => setEditNama(e.target.value)} placeholder="Nama" className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none" />
                  </div>
                ) : (
                  <UserIdentityDisplay user={u} showDirectorateMeta={isOriginalDirectorateRole} metaClassName="mt-1 block text-xs text-slate-500" />
                )}
              </td>
              <td className="px-4 py-3 font-mono text-slate-600 whitespace-normal break-words">
                {editingRowId === u.user_id ? (
                  <input value={editNrpNip} onChange={(e) => setEditNrpNip(e.target.value.replace(/\D/g, ""))} placeholder="NRP/NIP" className="w-32 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none" />
                ) : (u.user_id || "-")}
              </td>
              <td className="px-4 py-3 text-slate-600 whitespace-normal break-words">
                {showKesatuanColumn ? (
                  u.client_id || u.clientId || u.clientID || u.client || "-"
                ) : editingRowId === u.user_id ? (
                  <input value={editSatfung} onChange={(e) => setEditSatfung(e.target.value)} placeholder={columnLabel} className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none" />
                ) : (u.divisi || "-")}
              </td>
              <td className="px-4 py-3 font-mono text-sky-500 whitespace-normal break-words">
                {editingRowId === u.user_id ? (
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdateRow(u.user_id)} disabled={updateLoading} className="rounded-lg border border-emerald-200 bg-emerald-100 p-2 text-emerald-600 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60" type="button" aria-label="Simpan perubahan"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingRowId(null)} className="rounded-lg border border-rose-200 bg-rose-100 p-2 text-rose-600 transition hover:bg-rose-200" type="button" aria-label="Batalkan perubahan"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleEditClick(u)} className="rounded-lg border border-sky-200 bg-sky-100 p-2 text-sky-600 transition hover:bg-sky-200" type="button" aria-label={`Edit data ${u.nama || "user"}`}><Pencil className="h-4 w-4" /></button>
                    {isUserActive(u) ? (
                      <button onClick={() => openDeactivateModal(u)} className="rounded-lg border border-rose-200 bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-200" type="button">Nonaktifkan</button>
                    ) : (
                      <button onClick={() => handleActivateUser(u)} className="rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60" type="button" disabled={toggleStatusLoadingId === u.user_id}>
                        {toggleStatusLoadingId === u.user_id ? "Mengaktifkan..." : "Aktifkan kembali"}
                      </button>
                    )}
                  </div>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-sky-500 whitespace-normal break-words">{u.insta ? `@${u.insta}` : "-"}</td>
              <td className="px-4 py-3 font-mono text-purple-500 whitespace-normal break-words">{u.tiktok || "-"}</td>
            </tr>
          ))}
          {editingRowId && updateError && (
            <tr><td colSpan={7} className="px-4 py-3 text-sm text-rose-500" role="alert">{updateError}</td></tr>
          )}
          {currentRows.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Tidak ada pengguna</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

