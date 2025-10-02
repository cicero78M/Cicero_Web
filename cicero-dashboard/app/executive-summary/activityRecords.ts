import { normalizeFormattedNumber } from "@/lib/normalizeNumericInput";
import { pickNestedValue } from "./weeklyTrendUtils";

type ActivityRecord = Record<string, unknown> | null | undefined;

type FieldPath = string;

const INSTAGRAM_LIKE_FIELD_PATHS: FieldPath[] = [
  "likes_personil",
  "likes_personel",
  "likes_personnel",
  "total_like_personil",
  "total_like_personel",
  "total_like_personnel",
  "totalLikesPersonil",
  "totalLikesPersonel",
  "totalLikesPersonnel",
  "rekap.likes_personil",
  "rekap.likes_personel",
  "rekap.likes_personnel",
  "rekap.total_like_personil",
  "rekap.total_like_personel",
  "rekap.total_like_personnel",
  "rekap.totalLikesPersonil",
  "rekap.totalLikesPersonel",
  "rekap.totalLikesPersonnel",
  "metrics.likes_personil",
  "metrics.likes_personel",
  "metrics.likes_personnel",
  "metrics.total_like_personil",
  "metrics.total_like_personel",
  "metrics.total_like_personnel",
  "metrics.totalLikesPersonil",
  "metrics.totalLikesPersonel",
  "metrics.totalLikesPersonnel",
  "jumlah_like",
  "jumlahLike",
  "total_like",
  "totalLike",
  "totalLikes",
  "likes",
  "like_count",
  "rekap.jumlah_like",
  "rekap.total_like",
  "rekap.totalLike",
  "rekap.totalLikes",
  "rekap.likes",
  "rekap.like_count",
  "metrics.likes",
];

const TIKTOK_COMMENT_FIELD_PATHS: FieldPath[] = [
  "total_comments_personil",
  "total_comments_personel",
  "total_comments_personnel",
  "totalCommentsPersonil",
  "totalCommentsPersonel",
  "totalCommentsPersonnel",
  "komentar_personil",
  "komentar_personel",
  "komentar_personnel",
  "comments_personil",
  "comments_personel",
  "comments_personnel",
  "rekap.total_comments_personil",
  "rekap.total_comments_personel",
  "rekap.total_comments_personnel",
  "rekap.totalCommentsPersonil",
  "rekap.totalCommentsPersonel",
  "rekap.totalCommentsPersonnel",
  "rekap.komentar_personil",
  "rekap.komentar_personel",
  "rekap.komentar_personnel",
  "rekap.comments_personil",
  "rekap.comments_personel",
  "rekap.comments_personnel",
  "metrics.total_comments_personil",
  "metrics.total_comments_personel",
  "metrics.total_comments_personnel",
  "metrics.totalCommentsPersonil",
  "metrics.totalCommentsPersonel",
  "metrics.totalCommentsPersonnel",
  "jumlah_komentar",
  "jumlahKomentar",
  "total_komentar",
  "totalKomentar",
  "total_comments",
  "totalComments",
  "komentar",
  "comments",
  "comment_count",
  "commentCount",
  "rekap.jumlah_komentar",
  "rekap.total_komentar",
  "rekap.totalKomentar",
  "rekap.total_comments",
  "rekap.totalComments",
  "rekap.comments",
  "rekap.comment_count",
  "rekap.komentar",
  "rekap.total_komentar_personil",
  "rekap.total_komentar_personel",
  "rekap.total_komentar_personnel",
  "metrics.comments",
  "metrics.comment_count",
  "metrics.commentCount",
  "metrics.totalComments",
  "metrics.total_comments",
];

const extractNumericValue = (...candidates: unknown[]): number => {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) {
      continue;
    }

    if (Array.isArray(candidate)) {
      return candidate.length;
    }

    if (typeof candidate === "number") {
      if (Number.isFinite(candidate)) {
        return candidate;
      }
      continue;
    }

    if (typeof candidate === "object") {
      const valueProperty = (candidate as { value?: unknown }).value;
      if (valueProperty !== undefined) {
        const nested = Number(valueProperty);
        if (Number.isFinite(nested)) {
          return nested;
        }
      }
    }

    const normalized = normalizeFormattedNumber(candidate as any);
    const numeric = Number(normalized);
    if (Number.isFinite(numeric)) {
      return numeric;
    }
  }

  return 0;
};

const sumActivityRecords = (
  records: unknown,
  fields: FieldPath[],
): number => {
  if (!Array.isArray(records) || records.length === 0) {
    return 0;
  }

  if (!Array.isArray(fields) || fields.length === 0) {
    return 0;
  }

  const safeRecords = records as ActivityRecord[];

  return safeRecords.reduce((total, record) => {
    if (!record || typeof record !== "object") {
      return total;
    }

    const candidates = fields
      .map((path) => pickNestedValue(record, [path]))
      .filter((value) => value !== undefined && value !== null);

    if (candidates.length === 0) {
      return total;
    }

    const value = extractNumericValue(...candidates);
    if (!Number.isFinite(value)) {
      return total;
    }

    return total + Math.max(0, Number(value) || 0);
  }, 0);
};

export { INSTAGRAM_LIKE_FIELD_PATHS, TIKTOK_COMMENT_FIELD_PATHS, sumActivityRecords };
