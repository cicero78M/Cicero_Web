import { X } from "lucide-react";

type Props = {
  isOpen: boolean;
  deactivateTarget: Record<string, any> | null;
  confirmNrpInput: string;
  deactivateError: string;
  deactivateLoading: boolean;
  setConfirmNrpInput: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeactivateUserModal({
  isOpen,
  deactivateTarget,
  confirmNrpInput,
  deactivateError,
  deactivateLoading,
  setConfirmNrpInput,
  onClose,
  onConfirm,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivate-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="deactivate-title" className="text-lg font-semibold text-slate-900">
              Konfirmasi Nonaktifkan User
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Masukkan NRP/NIP <span className="font-semibold text-slate-900">{deactivateTarget?.user_id || "-"}</span>{" "}
              untuk menonaktifkan {deactivateTarget?.nama || "user"}.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-100" aria-label="Tutup konfirmasi">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">NRP/NIP</label>
          <input
            type="text"
            value={confirmNrpInput}
            onChange={(e) => setConfirmNrpInput(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            pattern="[0-9]*"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200"
            placeholder="Masukkan NRP/NIP"
          />
          {deactivateError && (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-600">{deactivateError}</p>
          )}
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50" disabled={deactivateLoading}>
            Batal
          </button>
          <button type="button" onClick={onConfirm} className="rounded-xl bg-gradient-to-r from-rose-400 via-rose-500 to-red-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:from-rose-500 hover:via-rose-600 hover:to-red-600 disabled:cursor-not-allowed disabled:opacity-70" disabled={deactivateLoading}>
            {deactivateLoading ? "Memproses..." : "Nonaktifkan"}
          </button>
        </div>
      </div>
    </div>
  );
}

