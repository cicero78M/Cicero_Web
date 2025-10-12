const INSTAGRAM_USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const TIKTOK_USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export function extractInstagramUsername(url?: string | null): string {
  if (!url) return "";
  try {
    const link = url.trim();
    if (!link) return "";
    if (!/^https?:\/\//i.test(link)) {
      const normalized = link.replace(/^@/, "");
      const lower = normalized.toLowerCase();
      if (
        !normalized ||
        /[\s/\\]/.test(normalized) ||
        lower.includes("instagram.com") ||
        lower.includes("tiktok.com") ||
        lower.startsWith("http")
      ) {
        return "";
      }
      return INSTAGRAM_USERNAME_PATTERN.test(normalized) ? normalized : "";
    }
    const u = new URL(link);
    const host = u.hostname.toLowerCase();
    if (
      host !== "instagram.com" &&
      host !== "www.instagram.com" &&
      !host.endsWith(".instagram.com")
    ) {
      return "";
    }
    const segments = u.pathname.split("/").filter(Boolean);
    return segments[0] ? segments[0].replace(/^@/, "") : "";
  } catch {
    return "";
  }
}

export function extractTiktokUsername(url?: string | null): string {
  if (!url) return "";
  try {
    const link = url.trim();
    if (!link) return "";
    if (!/^https?:\/\//i.test(link)) {
      const normalized = link.replace(/^@/, "");
      const lower = normalized.toLowerCase();
      if (
        !normalized ||
        /[\s/\\]/.test(normalized) ||
        lower.includes("instagram.com") ||
        lower.includes("tiktok.com") ||
        lower.startsWith("http")
      ) {
        return "";
      }
      return TIKTOK_USERNAME_PATTERN.test(normalized) ? normalized : "";
    }
    const u = new URL(link);
    const host = u.hostname.toLowerCase();
    if (
      host !== "tiktok.com" &&
      host !== "www.tiktok.com" &&
      !host.endsWith(".tiktok.com")
    ) {
      return "";
    }
    const segments = u.pathname.split("/").filter(Boolean);
    if (!segments[0]) return "";
    return segments[0].startsWith("@") ? segments[0].slice(1) : segments[0];
  } catch {
    return "";
  }
}

export function isValidInstagram(url?: string | null): boolean {
  if (!url) return true;
  return !!extractInstagramUsername(url);
}

export function isValidTiktok(url?: string | null): boolean {
  if (!url) return true;
  return !!extractTiktokUsername(url);
}
