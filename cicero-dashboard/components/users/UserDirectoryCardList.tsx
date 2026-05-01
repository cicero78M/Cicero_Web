import { Check, Pencil, X } from "lucide-react";
import UserIdentityDisplay from "@/components/users/UserIdentityDisplay";

type Props = {
  currentRows: Array<Record<string, any>>;
  page: number;
  pageSize: number;
  editingRowId: string | null;
  editPangkat: string;
  editNama: string;
  editNrpNip: string;
  editSatfung: string;
  updateLoading: boolean;
  updateError: string;
  showKesatuanColumn: boolean;
  columnLabel: string;
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

export default function UserDirectoryCardList(props: Props) {
  const {
    currentRows,
    page,
    pageSize,
    editingRowId,
    editPangkat,
    editNama,
    editNrpNip,
    editSatfung,
    updateLoading,
    updateError,
    showKesatuanColumn,
    columnLabel,
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
    <div className="mt-6 space-y-3 md:hidden">
      {currentRows.map((u, idx) => (
        <div
          key={u.user_id || idx}
          className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${editingRowId === u.user_id ? "ring-2 ring-sky-200" : ""}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">No. {(page - 1) * pageSize + idx + 1}</p>
              <p className="text-sm font-semibold text-slate-900">
                {editingRowId === u.user_id ? (
                  <span className="space-y-2">
                    <input value={editPangkat} onChange={(e) => setEditPangkat(e.target.value)} placeholder="Pangkat" className="block w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700" />
                    <input value={editNama} onChange={(e) => setEditNama(e.target.value)} placeholder="Nama" className="block w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700" />
                  </span>
                ) : (
                  <UserIdentityDisplay user={u} showDirectorateMeta={isOriginalDirectorateRole} metaClassName="mt-1 block text-[11px] font-normal text-slate-500" />
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {editingRowId === u.user_id ? (
                <>
                  <button onClick={() => handleUpdateRow(u.user_id)} disabled={updateLoading} className="rounded-lg border border-emerald-200 bg-emerald-100 p-2 text-emerald-600" type="button" aria-label="Simpan perubahan"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingRowId(null)} className="rounded-lg border border-rose-200 bg-rose-100 p-2 text-rose-600" type="button" aria-label="Batalkan perubahan"><X className="h-4 w-4" /></button>
                </>
              ) : (
                <>
                  <button onClick={() => handleEditClick(u)} className="rounded-lg border border-sky-200 bg-sky-100 p-2 text-sky-600" type="button" aria-label={`Edit data ${u.nama || "user"}`}><Pencil className="h-4 w-4" /></button>
                  {isUserActive(u) ? (
                    <button onClick={() => openDeactivateModal(u)} className="rounded-lg border border-rose-200 bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600" type="button">Nonaktifkan</button>
                  ) : (
                    <button onClick={() => handleActivateUser(u)} className="rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-600 disabled:opacity-60" type="button" disabled={toggleStatusLoadingId === u.user_id}>
                      {toggleStatusLoadingId === u.user_id ? "Mengaktifkan..." : "Aktifkan"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-slate-500">NRP/NIP</p>
              {editingRowId === u.user_id ? (
                <input value={editNrpNip} onChange={(e) => setEditNrpNip(e.target.value.replace(/\D/g, ""))} placeholder="NRP/NIP" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-700" />
              ) : (
                <p className="font-mono text-slate-800">{u.user_id || "-"}</p>
              )}
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-slate-500">{columnLabel}</p>
              {showKesatuanColumn ? (
                <p className="text-slate-800">{u.client_id || u.clientId || u.clientID || u.client || "-"}</p>
              ) : editingRowId === u.user_id ? (
                <input value={editSatfung} onChange={(e) => setEditSatfung(e.target.value)} placeholder={columnLabel} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700" />
              ) : (
                <p className="text-slate-800">{u.divisi || "-"}</p>
              )}
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-slate-500">Instagram</p><p className="font-mono text-sky-600 break-all">{u.insta ? `@${u.insta}` : "-"}</p></div>
            <div className="rounded-lg bg-slate-50 px-3 py-2"><p className="text-slate-500">TikTok</p><p className="font-mono text-purple-600 break-all">{u.tiktok || "-"}</p></div>
          </div>
        </div>
      ))}
      {editingRowId && updateError && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-500" role="alert">{updateError}</div>}
      {currentRows.length === 0 && <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-slate-500">Tidak ada pengguna</div>}
    </div>
  );
}

