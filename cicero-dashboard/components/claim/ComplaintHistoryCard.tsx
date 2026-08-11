"use client";

import { RefreshCw, TriangleAlert } from "lucide-react";

import type { ClaimComplaintLifecycleDto } from "@/utils/api";

type Props = {
  complaints: ClaimComplaintLifecycleDto[];
  loading: boolean;
  error: string;
  onRetry: () => void | Promise<void>;
};

const STATUS_LABELS: Readonly<Record<string, string>> = {
  triaged: "Ditriase",
  escalated: "Dieskalasi",
  resolved: "Selesai",
};

const PLATFORM_LABELS: Readonly<Record<string, string>> = {
  instagram: "Instagram",
  tiktok: "TikTok",
};

function displayStatus(status: string) {
  return STATUS_LABELS[status] ?? status;
}

function formatTimestamp(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

export default function ComplaintHistoryCard({
  complaints,
  loading,
  error,
  onRetry,
}: Props) {
  return (
    <section
      aria-busy={loading}
      aria-labelledby="complaint-history-title"
      className="space-y-4 rounded-3xl border border-spirit-200/80 bg-white/90 p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="complaint-history-title" className="text-lg font-semibold text-neutral-navy">
            Riwayat Komplain
          </h2>
          <p className="mt-1 text-sm text-neutral-slate">
            Status dan hasil triase ditampilkan sesuai lifecycle dari CICERO.
          </p>
        </div>
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-spirit-200 px-3 py-2 text-sm font-semibold text-spirit-600 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Muat ulang
        </button>
      </div>

      {loading && complaints.length === 0 && (
        <p role="status" className="text-sm text-neutral-slate">Memuat riwayat komplain...</p>
      )}

      {error && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Gagal memuat riwayat komplain: {error}</span>
          </div>
          <button type="button" onClick={onRetry} className="mt-3 rounded-xl border border-red-300 px-3 py-2 font-semibold">
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !error && complaints.length === 0 && (
        <p className="rounded-2xl bg-neutral-50 p-4 text-sm text-neutral-slate">
          Belum ada riwayat komplain.
        </p>
      )}

      {complaints.length > 0 && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {complaints.map((complaint) => (
            <li key={complaint.complaint_id} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-neutral-navy">
                  {PLATFORM_LABELS[complaint.platform] ?? complaint.platform}
                </p>
                <span className="rounded-full bg-spirit-100 px-2.5 py-1 text-xs font-semibold text-spirit-700">
                  {displayStatus(complaint.status)}
                </span>
              </div>
              <dl className="mt-3 grid gap-2 text-sm text-neutral-slate sm:grid-cols-2">
                <div><dt className="text-xs font-semibold uppercase">ID konten</dt><dd className="break-all text-neutral-navy">{complaint.content_id}</dd></div>
                <div><dt className="text-xs font-semibold uppercase">ID komplain</dt><dd className="break-all text-neutral-navy">{complaint.complaint_id}</dd></div>
                <div><dt className="text-xs font-semibold uppercase">Kode triase</dt><dd className="break-words text-neutral-navy">{complaint.triage.code}</dd></div>
                <div><dt className="text-xs font-semibold uppercase">Kualitas triase</dt><dd className="text-neutral-navy">{complaint.triage.quality}</dd></div>
                <div><dt className="text-xs font-semibold uppercase">Dibuat</dt><dd className="text-neutral-navy">{formatTimestamp(complaint.created_at)}</dd></div>
                <div><dt className="text-xs font-semibold uppercase">Dieskalasi</dt><dd className="text-neutral-navy">{formatTimestamp(complaint.escalated_at)}</dd></div>
                <div><dt className="text-xs font-semibold uppercase">Selesai</dt><dd className="text-neutral-navy">{formatTimestamp(complaint.resolved_at)}</dd></div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
