export type TaskLinksToday = {
  platform: string;
  links: string[];
};

export type TaskPostDetail = {
  url: string;
  caption: string;
  createdAt?: string | null;
  likeCount: number;
  commentCount: number;
};

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveWibDateKey(value: unknown): string {
  const normalized = normalizeText(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;

  const parsed =
    value instanceof Date
      ? value
      : normalized
        ? new Date(normalized)
        : new Date(Number(value));

  if (Number.isNaN(parsed.getTime())) return "";

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
}

function extractEntryDateKey(entry: any): string {
  return (
    resolveWibDateKey(entry?.date) ||
    resolveWibDateKey(entry?.tanggal) ||
    resolveWibDateKey(entry?.task_date) ||
    resolveWibDateKey(entry?.created_at) ||
    resolveWibDateKey(entry?.published_at) ||
    resolveWibDateKey(entry?.timestamp)
  );
}

export function extractTaskLinksToday(payload: any, fallbackPlatform: string): TaskLinksToday {
  const todayWib = getTodayWibDateKey();
  const candidates = [
    payload?.taskLinksToday,
    payload?.task_links_today,
    payload?.data?.taskLinksToday,
    payload?.data?.task_links_today,
    payload?.summary?.taskLinksToday,
    payload?.summary?.task_links_today,
    payload?.metadata?.taskLinksToday,
    payload?.metadata?.task_links_today,
  ];

  const source = candidates.find((entry) => entry && typeof entry === "object") || {};
  const linksRaw = Array.isArray(source?.links)
    ? source.links
    : Array.isArray(source?.data)
      ? source.data
      : [];

  const hasDateMetadata = linksRaw.some((entry: any) => Boolean(extractEntryDateKey(entry)));
  const linksForToday = hasDateMetadata
    ? linksRaw.filter((entry: any) => {
        const entryDate = extractEntryDateKey(entry);
        return !entryDate || entryDate === todayWib;
      })
    : linksRaw;

  const links = uniqueStrings(
    linksForToday
      .map((entry: any) => {
        if (typeof entry === "string") return normalizeText(entry);
        return (
          normalizeText(entry?.url) ||
          normalizeText(entry?.link) ||
          normalizeText(entry?.post_url) ||
          normalizeText(entry?.permalink)
        );
      })
      .filter(Boolean),
  );

  return {
    platform:
      normalizeText(source?.platform) ||
      normalizeText(source?.name) ||
      fallbackPlatform,
    links,
  };
}

function getWibNowDate() {
  const now = new Date();
  const dateKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return { now, dateKey };
}

export function getTodayWibDateKey(): string {
  return getWibNowDate().dateKey;
}

function formatSnapshotWib(date: Date): string {
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);

  const jam = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(":", ".");

  return `${tanggal} pukul ${jam} WIB`;
}

function formatUploadWib(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";

  const tanggal = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);

  const jam = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(parsed)
    .replace(":", ".");

  return `${tanggal}, ${jam} WIB`;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("id-ID").format(normalizeNumber(value));
}

function normalizeCaption(value: unknown): string {
  const raw = normalizeText(value);
  if (!raw) return "(Tidak ada deskripsi)";
  const compact = raw.replace(/\s+/g, " ");
  if (compact.length <= 70) return compact;
  return `${compact.slice(0, 67)}...`;
}

function resolveInstagramUrl(post: any): string {
  const direct =
    normalizeText(post?.source_url) ||
    normalizeText(post?.post_url) ||
    normalizeText(post?.permalink) ||
    normalizeText(post?.url) ||
    normalizeText(post?.link);
  if (direct) return direct;
  const shortcode = normalizeText(post?.shortcode) || normalizeText(post?.code);
  if (shortcode) return `https://www.instagram.com/p/${shortcode}/`;
  return "";
}

function resolveTiktokUrl(post: any): string {
  const direct =
    normalizeText(post?.source_url) ||
    normalizeText(post?.share_url) ||
    normalizeText(post?.permalink) ||
    normalizeText(post?.post_url) ||
    normalizeText(post?.url) ||
    normalizeText(post?.link);
  if (direct) return direct;
  const videoId =
    normalizeText(post?.video_id) ||
    normalizeText(post?.aweme_id) ||
    normalizeText(post?.id);
  if (videoId) return `https://www.tiktok.com/video/${videoId}`;
  return "";
}

function mergePostsWithFallbackLinks(posts: TaskPostDetail[], links: string[]): TaskPostDetail[] {
  const normalizedPosts = posts.filter((post) => normalizeText(post.url));
  const used = new Set(normalizedPosts.map((post) => normalizeText(post.url).toLowerCase()));
  const missing = uniqueStrings(links)
    .filter((link) => !used.has(link.toLowerCase()))
    .map((url) => ({
      url,
      caption: "(Tidak ada deskripsi)",
      createdAt: null,
      likeCount: 0,
      commentCount: 0,
    }));
  return [...normalizedPosts, ...missing];
}

export function normalizeInstagramTaskPosts(rawPosts: any[]): TaskPostDetail[] {
  const todayWib = getTodayWibDateKey();
  return (Array.isArray(rawPosts) ? rawPosts : [])
    .map((post) => ({
      url: resolveInstagramUrl(post),
      caption: normalizeCaption(post?.caption ?? post?.title ?? post?.text),
      createdAt:
        normalizeText(post?.created_at) ||
        normalizeText(post?.published_at) ||
        normalizeText(post?.timestamp) ||
        null,
      likeCount: normalizeNumber(post?.like_count ?? post?.likes ?? post?.metrics?.like_count),
      commentCount: normalizeNumber(post?.comment_count ?? post?.comments ?? post?.metrics?.comment_count),
    }))
    .filter((post) => {
      const dateKey = resolveWibDateKey(post.createdAt);
      return !dateKey || dateKey === todayWib;
    });
}

export function normalizeTiktokTaskPosts(rawPosts: any[]): TaskPostDetail[] {
  const todayWib = getTodayWibDateKey();
  return (Array.isArray(rawPosts) ? rawPosts : [])
    .map((post) => ({
      url: resolveTiktokUrl(post),
      caption: normalizeCaption(post?.caption ?? post?.desc ?? post?.title),
      createdAt:
        normalizeText(post?.created_at) ||
        normalizeText(post?.published_at) ||
        normalizeText(post?.timestamp) ||
        null,
      likeCount: normalizeNumber(post?.like_count ?? post?.digg_count ?? post?.stats?.diggCount),
      commentCount: normalizeNumber(post?.comment_count ?? post?.stats?.commentCount),
    }))
    .filter((post) => {
      const dateKey = resolveWibDateKey(post.createdAt);
      return !dateKey || dateKey === todayWib;
    });
}

export function buildWhatsappDetailedTaskRecapMessage({
  clientName,
  instagramPosts,
  tiktokPosts,
  instagramFallbackLinks = [],
  tiktokFallbackLinks = [],
  snapshotAt = new Date(),
}: {
  clientName?: string;
  instagramPosts: TaskPostDetail[];
  tiktokPosts: TaskPostDetail[];
  instagramFallbackLinks?: string[];
  tiktokFallbackLinks?: string[];
  snapshotAt?: Date;
}): string {
  const igList = mergePostsWithFallbackLinks(instagramPosts, instagramFallbackLinks);
  const ttList = mergePostsWithFallbackLinks(tiktokPosts, tiktokFallbackLinks);
  const headerClient = normalizeText(clientName || "CICERO").toUpperCase();

  const lines: string[] = [
    `📋 *Daftar Tugas - ${headerClient}*`,
    `🕒 Pengambilan data: ${formatSnapshotWib(snapshotAt)}`,
    "",
    "Status tugas saat ini:",
    `📸 Instagram: *${igList.length}* konten`,
    `🎵 TikTok: *${ttList.length}* konten`,
    "",
    "📝 *Detail Tugas:*",
    "",
    `📸 *Tugas Instagram (${igList.length} konten):*`,
    "",
  ];

  if (!igList.length) {
    lines.push("- Tidak ada tugas Instagram hari ini.");
  } else {
    igList.forEach((post, index) => {
      lines.push(`${index + 1}. ${post.url}`);
      lines.push(`   _${normalizeCaption(post.caption)}_`);
      lines.push(`   Upload: ${formatUploadWib(post.createdAt)}`);
      lines.push(`   Likes: ${formatCount(post.likeCount)} | Komentar: ${formatCount(post.commentCount)}`);
    });
  }

  lines.push("", `🎵 *Tugas TikTok (${ttList.length} konten):*`, "");

  if (!ttList.length) {
    lines.push("- Tidak ada tugas TikTok hari ini.");
  } else {
    ttList.forEach((post, index) => {
      lines.push(`${index + 1}. ${post.url}`);
      lines.push(`   _${normalizeCaption(post.caption)}_`);
      lines.push(`   Upload: ${formatUploadWib(post.createdAt)}`);
      lines.push(`   Likes: ${formatCount(post.likeCount)} | Komentar: ${formatCount(post.commentCount)}`);
    });
  }

  lines.push("", "_Pastikan semua tugas telah dikerjakan dengan baik._");

  return lines.join("\n");
}
