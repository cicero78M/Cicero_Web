/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizeNumericInput } from "@/lib/normalizeNumericInput";
import {
  pickWeeklyNestedValue,
  pickWeeklyNestedString,
  parseWeeklyDateValue,
} from "./weeklyTrendUtils";

export const WEEKLY_POST_DATE_PATHS = Object.freeze([
  "publishedAt",
  "published_at",
  "timestamp",
  "createdAt",
  "created_at",
  "activityDate",
  "activity_date",
  "date",
  "tanggal",
]);

const pickWeeklyNestedNumeric = (source: any, paths: (string | string[])[] = []) => {
  if (!source) {
    return 0;
  }

  for (const path of paths) {
    if (!path) {
      continue;
    }

    const segments = Array.isArray(path) ? path : String(path).split(".");
    let current: any = source;
    let valid = true;

    for (const segment of segments) {
      if (current == null) {
        valid = false;
        break;
      }
      current = current[segment];
    }

    if (!valid || current == null) {
      continue;
    }

    const numeric = normalizeNumericInput(current);

    if (typeof current === "number" || typeof current === "string") {
      return numeric;
    }

    if (Number.isFinite(numeric) && numeric !== 0) {
      return numeric;
    }
  }

  return 0;
};

const pickWeeklyNestedDate = (source: any, paths: (string | string[])[] = []) => {
  const value = pickWeeklyNestedValue(source, paths);
  return parseWeeklyDateValue(value);
};

const normalizeWeeklyContentType = (value: any, fallback = "Lainnya") => {
  if (!value) {
    return fallback;
  }

  const normalized = String(value)
    .replace(/[_-]+/g, " ")
    .trim()
    .toLowerCase();

  if (!normalized) {
    return fallback;
  }

  return normalized
    .split(/\s+/)
    .map((segment) => {
      if (!segment) {
        return segment;
      }
      if (segment.length <= 3) {
        return segment.toUpperCase();
      }
      return segment.charAt(0).toUpperCase() + segment.slice(1);
    })
    .join(" ");
};

export const normalizeWeeklyPlatformPost = (
  post: any,
  { platformKey = "", fallbackIndex = 0, platformLabel = "" } = {},
) => {
  if (!post || typeof post !== "object") {
    return null;
  }

  const idSource =
    pickWeeklyNestedValue(post, [
      "id",
      "pk",
      "code",
      "post_id",
      "postId",
      "media_id",
      "mediaId",
      "video_id",
      "shortcode",
    ]) ?? `${platformKey || "post"}-${fallbackIndex + 1}`;
  const title =
    pickWeeklyNestedString(post, [
      "title",
      "caption",
      "headline",
      "message",
      "text",
      "description",
    ]) ?? `${platformLabel || "Konten"} #${fallbackIndex + 1}`;
  const caption = pickWeeklyNestedString(post, [
    "caption",
    "message",
    "description",
    "summary",
  ]);
  const permalink = pickWeeklyNestedString(post, [
    "permalink",
    "url",
    "link",
    "permalink_url",
    "shortcode_url",
  ]);
  const thumbnail = pickWeeklyNestedString(post, [
    "thumbnail_url",
    "thumbnail",
    "image",
    "media_url",
    "cover",
    "cover_url",
  ]);
  const type = normalizeWeeklyContentType(
    pickWeeklyNestedString(post, [
      "media_type",
      "type",
      "content_type",
      "format",
      "__typename",
    ]),
  );
  const publishedAt =
    pickWeeklyNestedDate(post, [
      "timestamp",
      "taken_at",
      "created_time",
      "created_at",
      "publish_time",
      "published_at",
    ]) ?? null;

  const likes = Math.max(
    0,
    pickWeeklyNestedNumeric(post, [
      "like_count",
      "likes",
      "statistics.like_count",
      "metrics.like_count",
      "metrics.likes",
      "insights.likes",
    ]),
  );
  const comments = Math.max(
    0,
    pickWeeklyNestedNumeric(post, [
      "comment_count",
      "comments",
      "statistics.comment_count",
      "metrics.comment_count",
      "metrics.comments",
      "insights.comments",
    ]),
  );
  const shares = Math.max(
    0,
    pickWeeklyNestedNumeric(post, [
      "share_count",
      "shares",
      "statistics.share_count",
      "metrics.share_count",
      "metrics.shares",
    ]),
  );
  const saves = Math.max(
    0,
    pickWeeklyNestedNumeric(post, [
      "save_count",
      "saves",
      "metrics.save_count",
      "metrics.saves",
    ]),
  );

  return {
    id: idSource,
    key: idSource,
    title,
    caption,
    permalink,
    thumbnail,
    type,
    platform: platformKey,
    publishedAt,
    metrics: {
      likes,
      comments,
      shares,
      saves,
      interactions: likes + comments + shares + saves,
    },
  };
};
