import { ExternalLink, Instagram, RefreshCw, TriangleAlert } from "lucide-react";

import type {
  ClaimPendingContentResponse,
  ClaimPendingContentItem,
  ClaimPendingPlatformContent,
} from "@/utils/api";

type Props = {
  data: ClaimPendingContentResponse["data"] | null;
  loading: boolean;
  error: string;
  onRefresh: () => void;
};

const platformDetails = {
  instagram: { label: "Instagram", action: "Like", icon: Instagram },
  tiktok: { label: "TikTok", action: "Comment", icon: ExternalLink },
} as const;

function safeContentUrl(value: string | null, platform: keyof typeof platformDetails) {
  if (!value) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:") return null;
    const hostname = parsed.hostname.toLowerCase();
    const allowedHosts =
      platform === "instagram"
        ? ["instagram.com", "www.instagram.com"]
        : ["tiktok.com", "www.tiktok.com", "m.tiktok.com"];
    return allowedHosts.includes(hostname) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function formatContentDate(value: string | null) {
  if (!value) return "Tanggal tidak tersedia";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Tanggal tidak tersedia";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function ContentItem({
  item,
  platform,
}: {
  item: ClaimPendingContentItem;
  platform: keyof typeof platformDetails;
}) {
  const url = safeContentUrl(item.url, platform);
  return (
    <li className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <p className="line-clamp-2 text-sm font-medium text-neutral-navy">
        {item.caption?.trim() || "Caption tidak tersedia"}
      </p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-slate">
        <div className="space-y-1">
          <p>{formatContentDate(item.content_time)}</p>
          <p className="font-semibold text-amber-600">Belum tercatat</p>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-spirit-200 px-3 py-2 font-semibold text-spirit-600 transition hover:bg-spirit-50"
          >
            Buka Konten <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </li>
  );
}

function PlatformGroup({
  platform,
  content,
}: {
  platform: keyof typeof platformDetails;
  content: ClaimPendingPlatformContent;
}) {
  const details = platformDetails[platform];
  const Icon = details.icon;
  return (
    <section aria-label={`${details.label} - ${details.action}`} className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-spirit-500" />
        <h3 className="font-semibold text-neutral-navy">{details.label}</h3>
        <span className="rounded-full bg-spirit-100 px-2 py-1 text-xs font-semibold text-spirit-700">
          {details.action}
        </span>
      </div>
      {!content.username_available ? (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-700">
          Username {details.label} belum terdaftar. Tambahkan username platform pada profil untuk memantau aktivitas.
        </p>
      ) : content.items.length === 0 ? (
        <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
          Tidak ada konten tertunda untuk {details.label}.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {content.items.map((item, index) => (
            <ContentItem
              key={item.shortcode || item.video_id || `${platform}-${index}`}
              item={item}
              platform={platform}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function PendingContentCard({ data, loading, error, onRefresh }: Props) {
  return (
    <section className="space-y-5 rounded-3xl border border-spirit-200/80 bg-white/90 p-5 shadow-sm" aria-busy={loading}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-navy">Aktivitas Konten Tertunda</h2>
          <p className="mt-1 max-w-2xl text-sm text-neutral-slate">
            Data berdasarkan hasil sinkronisasi CICERO dan mungkin membutuhkan waktu untuk diperbarui.
          </p>
        </div>
        <button type="button" onClick={onRefresh} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-spirit-200 px-3 py-2 text-sm font-semibold text-spirit-600 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading && !data && <p role="status" className="text-sm text-neutral-slate">Memuat konten tertunda...</p>}
      {error && (
        <div role="alert" className="flex gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-600">
          <TriangleAlert className="h-4 w-4 shrink-0" /> Gagal memuat konten tertunda: {error}
        </div>
      )}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-fuchsia-50 to-orange-50 p-4">
              <p className="text-xs text-neutral-slate">Instagram tertunda</p>
              <p className="text-2xl font-bold text-neutral-navy">{data.instagram.pending_content}</p>
            </div>
            <div className="rounded-2xl bg-neutral-100 p-4">
              <p className="text-xs text-neutral-slate">TikTok tertunda</p>
              <p className="text-2xl font-bold text-neutral-navy">{data.tiktok.pending_content}</p>
            </div>
          </div>
          <PlatformGroup platform="instagram" content={data.instagram} />
          <PlatformGroup platform="tiktok" content={data.tiktok} />
        </>
      )}
    </section>
  );
}
