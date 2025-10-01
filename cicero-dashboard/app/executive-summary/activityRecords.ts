import { normalizeFormattedNumber } from "@/lib/normalizeNumericInput";
import { pickNestedValue } from "./weeklyTrendUtils";

type ActivityRecord = Record<string, unknown> | null | undefined;

type FieldPath = string;

const INSTAGRAM_LIKE_FIELD_PATHS: FieldPath[] = [
  "jumlah_like",
  "jumlahLike",
  "total_like",
  "totalLike",
  "totalLikes",
  "likes",
  "like_count",
  "metrics.likes",
  "rekap.jumlah_like",
  "rekap.total_like",
];

const TIKTOK_COMMENT_FIELD_PATHS: FieldPath[] = [
  "jumlah_komentar",
  "jumlahKomentar",
  "total_komentar",
  "totalKomentar",
  "komentar",
  "comments",
  "comment_count",
  "metrics.comments",
  "rekap.jumlah_komentar",
  "rekap.total_komentar",
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
