export type TaskLinksToday = {
  platform: string;
  links: string[];
};

function normalizeLinkValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueLinks(links: string[]): string[] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = link.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function extractTaskLinksToday(payload: any, fallbackPlatform: string): TaskLinksToday {
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

  const links = uniqueLinks(
    linksRaw
      .map((entry: any) => {
        if (typeof entry === "string") return normalizeLinkValue(entry);
        return (
          normalizeLinkValue(entry?.url) ||
          normalizeLinkValue(entry?.link) ||
          normalizeLinkValue(entry?.post_url) ||
          normalizeLinkValue(entry?.permalink)
        );
      })
      .filter(Boolean),
  );

  return {
    platform:
      normalizeLinkValue(source?.platform) ||
      normalizeLinkValue(source?.name) ||
      fallbackPlatform,
    links,
  };
}

function formatWibDateTime() {
  const now = new Date();
  const tanggal = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "full",
  }).format(now);
  const jam = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
  return { tanggal, jam };
}

function buildPlatformSection(title: string, links: string[]): string[] {
  const normalized = uniqueLinks(links.map((link) => normalizeLinkValue(link)).filter(Boolean));
  if (!normalized.length) {
    return [`${title}:`, "- Tidak ada link tugas hari ini."];
  }
  return [title + ":", ...normalized.map((link, index) => `${index + 1}. ${link}`)];
}

export function buildWhatsappTaskRecapMessage({
  clientName,
  instagramLinks,
  tiktokLinks,
}: {
  clientName?: string;
  instagramLinks: string[];
  tiktokLinks: string[];
}): string {
  const { tanggal, jam } = formatWibDateTime();
  const lines = [
    "📋 *REKAP TUGAS HARI INI*",
    clientName ? `🏢 Client: *${clientName}*` : "",
    `🗓️ Tanggal: ${tanggal}`,
    `🕒 Jam: ${jam} WIB`,
    "",
    ...buildPlatformSection("📸 Tugas Instagram", instagramLinks),
    "",
    ...buildPlatformSection("🎵 Tugas TikTok", tiktokLinks),
    "",
    "Mohon ditindaklanjuti dan laporkan hasilnya pada channel monitoring.",
  ];

  return lines.filter((line, index, arr) => {
    if (line !== "") return true;
    return arr[index - 1] !== "";
  }).join("\n");
}
