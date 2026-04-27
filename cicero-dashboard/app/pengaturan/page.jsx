"use client";

import useRequireAuth from "@/hooks/useRequireAuth";
import DarkModeToggle from "@/components/DarkModeToggle";

export default function PengaturanPage() {
  useRequireAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Pengaturan</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Atur preferensi tampilan dashboard Anda.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tema Tampilan</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pilih mode terang atau gelap.</p>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </div>
  );
}
