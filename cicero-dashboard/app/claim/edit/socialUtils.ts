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
    const username = segments[0]?.replace(/^@/, "") || "";
    return INSTAGRAM_USERNAME_PATTERN.test(username) ? username : "";
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
      return TIKTOK_USERNAME_PATTERN.test(normalized) ? `@${normalized}` : "";
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
    const username = segments[0].replace(/^@/, "");
    return TIKTOK_USERNAME_PATTERN.test(username) ? `@${username}` : "";
  } catch {
    return "";
  }
}

export type SocialPlatform = "instagram" | "tiktok";

export type SocialAccountListResult =
  | { ok: true; accounts: string[] }
  | { ok: false; index: number; message: string };

/** Normalize editable rows to the exact arrays accepted and returned by claim API. */
export function normalizeSocialAccountList(
  values: string[],
  platform: SocialPlatform,
): SocialAccountListResult {
  const extractor =
    platform === "instagram" ? extractInstagramUsername : extractTiktokUsername;
  const platformLabel = platform === "instagram" ? "Instagram" : "TikTok";
  const lastNonEmptyIndex = values.findLastIndex(
    (value) => value.trim() !== "",
  );
  const accounts: string[] = [];
  const seen = new Set<string>();

  for (let index = 0; index <= lastNonEmptyIndex; index += 1) {
    const value = values[index]?.trim() || "";
    if (!value) {
      return {
        ok: false,
        index,
        message: `Akun ${platformLabel} tidak boleh kosong di tengah daftar.`,
      };
    }

    const normalized = extractor(value);
    if (!normalized) {
      return {
        ok: false,
        index,
        message: `Format akun ${platformLabel} tidak valid. Masukkan username, @username, atau URL profil.`,
      };
    }

    const dedupeKey = normalized.replace(/^@/, "").toLowerCase();
    if (dedupeKey === "cicero_devs") {
      return {
        ok: false,
        index,
        message: "Username cicero_devs tidak diperbolehkan.",
      };
    }
    if (seen.has(dedupeKey)) {
      return {
        ok: false,
        index,
        message: `Username ${platformLabel} terduplikasi. Gunakan username yang berbeda.`,
      };
    }
    seen.add(dedupeKey);
    accounts.push(normalized);
  }

  return { ok: true, accounts };
}

export function isValidInstagram(url?: string | null): boolean {
  if (!url) return true;
  return !!extractInstagramUsername(url);
}

export function isValidTiktok(url?: string | null): boolean {
  if (!url) return true;
  return !!extractTiktokUsername(url);
}
