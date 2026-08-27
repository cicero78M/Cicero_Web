"use client";

import dynamic from "next/dynamic";

const ExecutiveSummaryContent = dynamic(
  () => import("./ExecutiveSummaryContent"),
  {
    ssr: false,
    loading: () => (
      <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
        <div className="mx-auto max-w-7xl space-y-5" role="status" aria-label="Memuat Executive Summary">
          <div className="h-44 animate-pulse rounded-3xl bg-gradient-to-r from-slate-200 via-white to-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl bg-white shadow-sm" />
            ))}
          </div>
          <p className="text-center text-sm text-slate-500">Menyiapkan ringkasan pimpinan…</p>
        </div>
      </main>
    ),
  },
);

export default function ExecutiveSummaryPage() {
  return <ExecutiveSummaryContent />;
}
