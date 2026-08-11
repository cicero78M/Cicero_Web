"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { ExternalLink, Instagram, RefreshCw, TriangleAlert, X } from "lucide-react";

import {
  escalateClaimComplaint,
  getClaimComplaint,
  triageClaimComplaint,
  ClaimComplaintLifecycleError,
  type ClaimComplaintTriage,
  type ClaimPendingContentResponse,
  type ClaimPendingContentItem,
  type ClaimPendingPlatformContent,
} from "@/utils/api";

type Platform = "instagram" | "tiktok";
type Props = {
  data: ClaimPendingContentResponse["data"] | null;
  loading: boolean;
  error: string;
  onRefresh: () => void | Promise<void>;
  claimToken?: string;
  onOpenProfile?: () => void;
};

type Selection = { item: ClaimPendingContentItem; platform: Platform; username: string };
const platformDetails = {
  instagram: { label: "Instagram", action: "Like", icon: Instagram },
  tiktok: { label: "TikTok", action: "Comment", icon: ExternalLink },
} as const;

function safeContentUrl(value: string | null, platform: Platform) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    const allowedHosts = platform === "instagram"
      ? ["instagram.com", "www.instagram.com"]
      : ["tiktok.com", "www.tiktok.com", "m.tiktok.com"];
    return allowedHosts.includes(parsed.hostname.toLowerCase()) ? parsed.toString() : null;
  } catch { return null; }
}

function formatContentDate(value: string | null) {
  if (!value) return "Tanggal tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" }).format(date);
}

function ContentItem({ item, platform, username, onComplaint }: {
  item: ClaimPendingContentItem; platform: Platform; username: string; onComplaint: (selection: Selection) => void;
}) {
  const url = safeContentUrl(item.url, platform);
  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="line-clamp-2 text-sm font-medium text-neutral-navy">{item.caption?.trim() || "Caption tidak tersedia"}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-slate">
        <div className="space-y-1"><p>{formatContentDate(item.content_time)}</p><p className="font-semibold text-amber-600">Belum tercatat</p></div>
        <div className="flex gap-2">
          {url && <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-spirit-200 px-3 py-2 font-semibold text-spirit-600">Buka Konten <ExternalLink className="h-3.5 w-3.5" /></a>}
          <button type="button" onClick={() => onComplaint({ item, platform, username })} className="rounded-xl bg-amber-500 px-3 py-2 font-semibold text-white hover:bg-amber-600">Komplain</button>
        </div>
      </div>
    </li>
  );
}

function PlatformGroup({ platform, content, onComplaint }: { platform: Platform; content: ClaimPendingPlatformContent; onComplaint: (selection: Selection) => void }) {
  const details = platformDetails[platform]; const Icon = details.icon;
  return <section aria-label={`${details.label} - ${details.action}`} className="space-y-3">
    <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-spirit-500" /><h3 className="font-semibold text-neutral-navy">{details.label}</h3><span className="rounded-full bg-spirit-100 px-2 py-1 text-xs font-semibold text-spirit-700">{details.action}</span></div>
    {!content.username_available ? <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">Username {details.label} belum terdaftar. Tambahkan username platform pada profil untuk memantau aktivitas.</p>
      : content.items.length === 0 ? <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">Tidak ada konten tertunda untuk {details.label}.</p>
      : <ul className="grid gap-3 sm:grid-cols-2">{content.items.map((item, index) => <ContentItem key={item.shortcode || item.video_id || `${platform}-${index}`} item={item} platform={platform} username={content.usernames[0] || ""} onComplaint={onComplaint} />)}</ul>}
  </section>;
}

function ComplaintDialog({ selection, token, filters, onClose, onRefresh, onOpenProfile }: {
  selection: Selection; token: string; filters: ClaimPendingContentResponse["data"]["filters"];
  onClose: () => void; onRefresh: () => void | Promise<void>; onOpenProfile?: () => void;
}) {
  const [performedAt, setPerformedAt] = useState("");
  const [result, setResult] = useState<ClaimComplaintTriage | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const identifier = selection.platform === "instagram" ? selection.item.shortcode : selection.item.video_id;
  const retryAt = result?.retry_after ? Date.parse(result.retry_after) : 0;
  const retryReady = !retryAt || now >= retryAt;

  useEffect(() => {
    if (!retryAt || retryReady) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retryAt, retryReady]);

  async function submit() {
    if (!identifier || submitting) return;
    setSubmitting(true); setError("");
    try {
      const triage = await triageClaimComplaint(token, {
        platform: selection.platform,
        issue_type: "activity_not_recorded",
        ...(selection.platform === "instagram" ? { shortcode: identifier } : { video_id: identifier }),
        ...(performedAt ? { performed_at: new Date(performedAt).toISOString() } : {}),
        periode: filters.periode,
        ...(filters.tanggal ? { tanggal: filters.tanggal } : {}),
        ...(filters.start_date ? { start_date: filters.start_date } : {}),
        ...(filters.end_date ? { end_date: filters.end_date } : {}),
      });
      setResult(triage);
      if (triage.triage_code === "ACTIVITY_ALREADY_RECORDED") await onRefresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal memeriksa kendala aktivitas"); }
    finally { setSubmitting(false); }
  }

  async function escalate() {
    if (!result?.complaint_id || !result.complaint_status || escalating) return;
    setEscalating(true); setError("");
    try {
      await escalateClaimComplaint(token, result.complaint_id, result.complaint_status);
      onClose();
    } catch (err) {
      if (err instanceof ClaimComplaintLifecycleError && err.status === 409 && err.errorCode === "CLAIM_COMPLAINT_STATUS_CONFLICT") {
        try {
          const latest = await getClaimComplaint(token, result.complaint_id);
          setResult((current) => current ? { ...current, complaint_status: latest.status } : current);
          setError(`${err.message} Status terbaru telah dimuat; silakan coba eskalasi kembali.`);
        } catch (refreshError) {
          setError(refreshError instanceof Error ? refreshError.message : "Gagal memuat status komplain terbaru");
        }
      } else {
        setError(err instanceof Error ? err.message : "Gagal mengeskalasi komplain");
      }
    }
    finally { setEscalating(false); }
  }

  const needsProfileUpdate = result && ["SOCIAL_USERNAME_MISSING", "SOCIAL_USERNAME_MISMATCH"].includes(result.triage_code);
  return <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
    <Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
      <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white p-6 shadow-xl">
        <Dialog.Title className="text-xl font-semibold text-neutral-navy">Konfirmasi Komplain Aktivitas</Dialog.Title>
        <Dialog.Description className="mt-1 text-sm text-neutral-slate">Tipe kendala tetap: aktivitas sudah dilakukan tetapi belum tercatat.</Dialog.Description>
        <Dialog.Close aria-label="Tutup" className="absolute right-5 top-5"><X className="h-5 w-5" /></Dialog.Close>
        <dl className="mt-5 grid gap-2 rounded-2xl bg-neutral-50 p-4 text-sm">
          <div><dt className="font-semibold">Platform</dt><dd>{platformDetails[selection.platform].label}</dd></div>
          <div><dt className="font-semibold">Konten</dt><dd>{selection.item.caption?.trim() || identifier}</dd></div>
          <div><dt className="font-semibold">Username tersimpan</dt><dd>{selection.username ? `@${selection.username.replace(/^@/, "")}` : "Belum tersedia"}</dd></div>
        </dl>
        {!result && <label className="mt-4 block text-sm font-semibold">Perkiraan waktu pelaksanaan (opsional)<input aria-label="Perkiraan waktu pelaksanaan" type="datetime-local" value={performedAt} onChange={(event) => setPerformedAt(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-300 px-3 py-2 font-normal" /></label>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        {result && <section className="mt-5 space-y-4" aria-label="Hasil triase">
          <div><h3 className="text-lg font-bold text-neutral-navy">{result.title}</h3><p className="text-sm text-neutral-slate">{result.summary}</p><p className="mt-2 text-xs font-semibold uppercase">Kualitas triase: {result.triage_quality}</p></div>
          {result.complaint_id && <div className="rounded-xl bg-spirit-50 p-3 text-sm text-spirit-800"><p>{result.complaint_created ? "Complaint baru dibuat." : "Complaint aktif yang sudah ada digunakan kembali."}</p><p className="mt-1 font-semibold">Status lifecycle terakhir: {result.complaint_status ?? "Tidak tersedia"}</p></div>}
          <div><h4 className="font-semibold">Bukti</h4><dl className="mt-2 space-y-2">{result.evidence.map((entry, index) => <div key={`${entry.label}-${index}`} className="rounded-xl bg-neutral-50 p-3 text-sm"><dt className="font-semibold">{entry.label}</dt><dd>{entry.value ?? "Tidak tersedia"} <span className="text-neutral-slate">({entry.status})</span></dd></div>)}</dl></div>
          <div><h4 className="font-semibold">Langkah solusi</h4><ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{[...result.solutions].sort((a, b) => a.order - b.order).map((step) => <li key={`${step.order}-${step.label}`}>{step.label}</li>)}</ol></div>
          {result.last_collected_at && <p className="text-xs text-neutral-slate">Sinkronisasi terakhir: {new Date(result.last_collected_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</p>}
        </section>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {result?.triage_code === "ACTIVITY_ALREADY_RECORDED" && <button type="button" onClick={onRefresh} className="rounded-xl border px-4 py-2 text-sm font-semibold">Refresh pending content</button>}
          {needsProfileUpdate && <button type="button" onClick={() => { onClose(); onOpenProfile?.(); }} className="rounded-xl border px-4 py-2 text-sm font-semibold">Buka Update Data Personil</button>}
          {result?.can_retry && <button type="button" disabled={!retryReady || submitting} onClick={submit} className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50">{retryReady ? "Periksa ulang" : `Periksa setelah ${new Date(retryAt).toLocaleString("id-ID")}`}</button>}
          {result?.can_escalate && result.complaint_id && result.complaint_status && <button type="button" disabled={escalating} onClick={escalate} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{escalating ? "Mengeskalasi..." : "Eskalasi"}</button>}
          {!result && <button type="button" disabled={submitting || !identifier || !token} onClick={submit} className="rounded-xl bg-spirit-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? "Memeriksa..." : "Kirim Komplain"}</button>}
        </div>
      </Dialog.Content></Dialog.Portal>
  </Dialog.Root>;
}

export default function PendingContentCard({ data, loading, error, onRefresh, claimToken = "", onOpenProfile }: Props) {
  const [selection, setSelection] = useState<Selection | null>(null);
  return <section className="space-y-5 rounded-3xl border border-spirit-200/80 bg-white/90 p-5 shadow-sm" aria-busy={loading}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-neutral-navy">Aktivitas Konten Tertunda</h2><p className="mt-1 max-w-2xl text-sm text-neutral-slate">Data berdasarkan hasil sinkronisasi CICERO dan mungkin membutuhkan waktu untuk diperbarui.</p></div><button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-spirit-200 px-3 py-2 text-sm font-semibold text-spirit-600 disabled:opacity-60"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
    {loading && !data && <p role="status" className="text-sm text-neutral-slate">Memuat konten tertunda...</p>}
    {error && <div role="alert" className="flex gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-600"><TriangleAlert className="h-4 w-4 shrink-0" /> Gagal memuat konten tertunda: {error}</div>}
    {data && <><div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-gradient-to-br from-fuchsia-50 to-orange-50 p-4"><p className="text-xs text-neutral-slate">Instagram tertunda</p><p className="text-2xl font-bold text-neutral-navy">{data.instagram.pending_content}</p></div><div className="rounded-2xl bg-neutral-100 p-4"><p className="text-xs text-neutral-slate">TikTok tertunda</p><p className="text-2xl font-bold text-neutral-navy">{data.tiktok.pending_content}</p></div></div><PlatformGroup platform="instagram" content={data.instagram} onComplaint={setSelection} /><PlatformGroup platform="tiktok" content={data.tiktok} onComplaint={setSelection} /></>}
    {selection && data && <ComplaintDialog selection={selection} token={claimToken} filters={data.filters} onClose={() => setSelection(null)} onRefresh={onRefresh} onOpenProfile={onOpenProfile} />}
  </section>;
}
