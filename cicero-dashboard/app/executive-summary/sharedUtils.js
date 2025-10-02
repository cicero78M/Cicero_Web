import { normalizeNumericInput } from "@/lib/normalizeNumericInput";
import {
  pickNestedValue,
  pickNestedString,
  parseDateValue,
  groupRecordsByMonth,
} from "./weeklyTrendUtils";

export const POST_DATE_PATHS = Object.freeze([
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

export const pickNestedNumeric = (source, paths = []) => {
  if (!source) {
    return 0;
  }

  for (const path of paths) {
    if (!path) {
      continue;
    }

    const segments = Array.isArray(path) ? path : String(path).split(".");
    let current = source;
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

const pickNestedDate = (source, paths = []) => {
  const value = pickNestedValue(source, paths);
  return parseDateValue(value);
};

export const normalizeContentType = (value, fallback = "Lainnya") => {
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

export const normalizePlatformPost = (
  post,
  { platformKey = "", fallbackIndex = 0, platformLabel = "" } = {},
) => {
  if (!post || typeof post !== "object") {
    return null;
  }

  const idSource =
    pickNestedValue(post, [
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
    pickNestedString(post, [
      "title",
      "caption",
      "headline",
      "message",
      "text",
      "description",
    ]) ?? `${platformLabel || "Konten"} #${fallbackIndex + 1}`;
  const caption = pickNestedString(post, [
    "caption",
    "message",
    "description",
    "summary",
  ]);
  const permalink = pickNestedString(post, [
    "permalink",
    "url",
    "link",
    "permalink_url",
    "shortcode_url",
  ]);
  const thumbnail = pickNestedString(post, [
    "thumbnail_url",
    "thumbnail",
    "image",
    "media_url",
    "cover",
    "cover_url",
  ]);
  const type = normalizeContentType(
    pickNestedString(post, [
      "media_type",
      "type",
      "content_type",
      "format",
      "__typename",
    ]),
  );
  const publishedAt =
    pickNestedDate(post, [
      "timestamp",
      "taken_at",
      "created_time",
      "created_at",
      "publish_time",
      "published_at",
    ]) ?? null;

  const likes = Math.max(
    0,
    pickNestedNumeric(post, [
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
    pickNestedNumeric(post, [
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
    pickNestedNumeric(post, [
      "share_count",
      "shares",
      "statistics.share_count",
      "metrics.share_count",
      "metrics.shares",
    ]),
  );
  const saves = Math.max(
    0,
    pickNestedNumeric(post, [
      "save_count",
      "saves",
      "metrics.save_count",
      "metrics.saves",
    ]),
  );
  const reach = Math.max(
    0,
    pickNestedNumeric(post, [
      "reach",
      "statistics.reach",
      "insights.reach",
      "metrics.reach",
      "metrics.played",
      "metrics.views",
    ]),
  );
  const views = Math.max(
    0,
    pickNestedNumeric(post, [
      "view_count",
      "views",
      "play_count",
      "plays",
      "statistics.view_count",
      "statistics.play_count",
    ]),
  );
  const engagementRate = Math.max(
    0,
    pickNestedNumeric(post, [
      "engagement_rate",
      "engagementRate",
      "metrics.engagement_rate",
      "metrics.engagementRate",
      "statistics.engagement_rate",
    ]),
  );

  const interactions = likes + comments + shares + saves;

  return {
    id: String(idSource),
    title,
    caption,
    type,
    permalink,
    thumbnail,
    publishedAt,
    metrics: {
      likes,
      comments,
      shares,
      saves,
      reach,
      views,
      engagementRate,
      interactions,
    },
    raw: post,
  };
};

export const buildMonthlyEngagementTrend = (
  records = [],
  { platformKey = "", platformLabel = "" } = {},
) => {
  const safeRecords = Array.isArray(records)
    ? records.filter((record) => record && typeof record === "object")
    : [];

  const normalizedPosts = safeRecords
    .map((record, index) => {
      const normalized = normalizePlatformPost(record, {
        platformKey,
        platformLabel,
        fallbackIndex: index,
      });

      if (!normalized) {
        return null;
      }

      const resolvedDate = (() => {
        if (record?.activityDate instanceof Date) {
          return record.activityDate;
        }

        const parsedActivityDate = parseDateValue(record?.activityDate);
        if (parsedActivityDate) {
          return parsedActivityDate;
        }

        const parsedTanggal = parseDateValue(record?.tanggal ?? record?.date);
        if (parsedTanggal) {
          return parsedTanggal;
        }

        const parsedTimestamp = parseDateValue(
          record?.createdAt ??
            record?.created_at ??
            record?.timestamp ??
            record?.published_at ??
            null,
        );
        if (parsedTimestamp) {
          return parsedTimestamp;
        }

        if (
          normalized.publishedAt instanceof Date &&
          !Number.isNaN(normalized.publishedAt.valueOf())
        ) {
          return normalized.publishedAt;
        }

        return null;
      })();

      if (!(resolvedDate instanceof Date) || Number.isNaN(resolvedDate.valueOf())) {
        return null;
      }

      return {
        ...normalized,
        activityDate: resolvedDate,
      };
    })
    .filter(Boolean);

  if (normalizedPosts.length === 0) {
    return {
      months: [],
      latestMonth: null,
      previousMonth: null,
      delta: null,
      hasRecords: false,
      hasAnyPosts: safeRecords.length > 0,
      hasTrendSamples: false,
    };
  }

  const monthlyBuckets = groupRecordsByMonth(normalizedPosts, {
    getDate: (post) => post.activityDate ?? post.publishedAt ?? null,
  });

  if (!Array.isArray(monthlyBuckets) || monthlyBuckets.length === 0) {
    return {
      months: [],
      latestMonth: null,
      previousMonth: null,
      delta: null,
      hasRecords: false,
      hasAnyPosts: safeRecords.length > 0,
      hasTrendSamples: normalizedPosts.length > 0,
    };
  }

  const months = monthlyBuckets
    .map((bucket) => {
      const totals = bucket.records.reduce(
        (acc, post) => {
          const metrics = post?.metrics ?? {};

          const likes = Number(metrics.likes);
          const comments = Number(metrics.comments);
          const shares = Number(metrics.shares);
          const saves = Number(metrics.saves);

          const interactionsCandidate =
            metrics.interactions !== undefined
              ? Number(metrics.interactions)
              : (Number.isFinite(likes) ? Math.max(0, likes) : 0) +
                (Number.isFinite(comments) ? Math.max(0, comments) : 0) +
                (Number.isFinite(shares) ? Math.max(0, shares) : 0) +
                (Number.isFinite(saves) ? Math.max(0, saves) : 0);

          acc.interactions += Number.isFinite(interactionsCandidate)
            ? Math.max(0, interactionsCandidate)
            : 0;
          acc.likes += Number.isFinite(likes) ? Math.max(0, likes) : 0;
          acc.comments += Number.isFinite(comments) ? Math.max(0, comments) : 0;
          acc.posts += 1;

          return acc;
        },
        {
          interactions: 0,
          likes: 0,
          comments: 0,
          posts: 0,
        },
      );

      return {
        key: bucket.key,
        start: bucket.start,
        end: bucket.end,
        posts: totals.posts,
        likes: totals.likes,
        comments: totals.comments,
        interactions: totals.interactions,
      };
    })
    .sort((a, b) => {
      const aTime = a.start instanceof Date ? a.start.getTime() : 0;
      const bTime = b.start instanceof Date ? b.start.getTime() : 0;
      return aTime - bTime;
    });

  if (months.length === 0) {
    return {
      months: [],
      latestMonth: null,
      previousMonth: null,
      delta: null,
      hasRecords: false,
      hasAnyPosts: safeRecords.length > 0,
      hasTrendSamples: normalizedPosts.length > 0,
    };
  }

  const latestMonth = months[months.length - 1];
  const previousMonth = months.length > 1 ? months[months.length - 2] : null;

  const computeDelta = (latestValue, previousValue) => {
    const safeLatest = Number.isFinite(latestValue) ? latestValue : 0;
    const safePrevious = Number.isFinite(previousValue) ? previousValue : 0;
    const absolute = safeLatest - safePrevious;
    const percent = safePrevious !== 0 ? (absolute / safePrevious) * 100 : null;

    return { absolute, percent };
  };

  const delta = previousMonth
    ? {
        posts: computeDelta(latestMonth.posts, previousMonth.posts),
        interactions: computeDelta(
          latestMonth.interactions,
          previousMonth.interactions,
        ),
        likes: computeDelta(latestMonth.likes, previousMonth.likes),
        comments: computeDelta(latestMonth.comments, previousMonth.comments),
      }
    : null;

  return {
    months,
    latestMonth,
    previousMonth,
    delta,
    hasRecords: months.length > 0,
    hasAnyPosts: safeRecords.length > 0,
    hasTrendSamples: normalizedPosts.length > 0,
  };
};

