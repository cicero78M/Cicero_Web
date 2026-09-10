const DEFAULT_REPOSTER_URL = "http://localhost:5173";

export function getReposterBaseUrl() {
  if (typeof window !== "undefined" && /(^|\.)papiqo\.com$/i.test(window.location.hostname)) {
    return "https://reposter.papiqo.com/reposter";
  }
  return process.env.NEXT_PUBLIC_REPOSTER_URL ?? DEFAULT_REPOSTER_URL;
}

export function buildReposterUrl(path?: string) {
  const base = getReposterBaseUrl();
  if (!path || path === "/") return base;
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
