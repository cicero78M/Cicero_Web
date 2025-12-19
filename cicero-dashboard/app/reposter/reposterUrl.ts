const DEFAULT_REPOSTER_URL = "http://localhost:5173";

export function getReposterBaseUrl() {
  return process.env.NEXT_PUBLIC_REPOSTER_URL ?? DEFAULT_REPOSTER_URL;
}

export function buildReposterUrl(path?: string) {
  const base = getReposterBaseUrl();
  if (!path || path === "/") return base;
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
