function extractUrl(value: unknown): string {
  if (typeof value === "string") {
    const normalized = value.trim();
    if (
      normalized.startsWith("https://") ||
      normalized.startsWith("http://") ||
      normalized.startsWith("data:image/") ||
      normalized.startsWith("blob:") ||
      normalized.startsWith("/")
    ) {
      return normalized.replace(/\.heic(\?|$)/i, ".jpg$1");
    }
    return "";
  }

  if (Array.isArray(value)) {
    for (const candidate of value) {
      const url = extractUrl(candidate);
      if (url) return url;
    }
    return "";
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    return extractUrl(
      source.url ??
        source.src ??
        source.url_list ??
        source.urlList ??
        source.urls,
    );
  }

  return "";
}

export function resolvePostThumbnail(post: unknown): string {
  if (!post || typeof post !== "object") return "";
  const source = post as Record<string, unknown>;
  const video =
    source.video && typeof source.video === "object"
      ? (source.video as Record<string, unknown>)
      : {};
  const imageVersions =
    source.image_versions2 && typeof source.image_versions2 === "object"
      ? (source.image_versions2 as Record<string, unknown>)
      : {};
  const images =
    source.images && typeof source.images === "object"
      ? (source.images as Record<string, unknown>)
      : {};
  const candidates = [
    source.thumbnail_url,
    source.thumbnailUrl,
    source.cover_url,
    source.coverUrl,
    source.image_url,
    source.imageUrl,
    source.thumbnail,
    source.cover,
    video.dynamicCover,
    video.dynamic_cover,
    video.originCover,
    video.origin_cover,
    video.cover,
    video.cover_url,
    imageVersions.candidates,
    source.display_url,
    source.media_url,
    images.standard_resolution,
  ];

  for (const candidate of candidates) {
    const url = extractUrl(candidate);
    if (url) return url;
  }

  return "";
}
