/* eslint-disable @typescript-eslint/no-explicit-any */
const pickWeeklyNestedValue = (source: any, paths: (string | string[])[] = []) => {
  if (!source) {
    return undefined;
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

    return current;
  }

  return undefined;
};

const pickWeeklyNestedString = (source: any, paths: (string | string[])[] = []) => {
  const value = pickWeeklyNestedValue(source, paths);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
};

const INDONESIAN_MONTHS = new Map<string, number>([
  ["januari", 0],
  ["februari", 1],
  ["maret", 2],
  ["april", 3],
  ["mei", 4],
  ["juni", 5],
  ["juli", 6],
  ["agustus", 7],
  ["september", 8],
  ["oktober", 9],
  ["november", 10],
  ["desember", 11],
]);

export const parseWeeklyDateValue = (value: any): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.valueOf())) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const dateFromNumber = new Date(value * (value > 1e12 ? 1 : 1000));
    if (!Number.isNaN(dateFromNumber.valueOf())) {
      return dateFromNumber;
    }
  }

  if (typeof value === "string") {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      const timestamp = numeric * (numeric > 1e12 ? 1 : 1000);
      const dateFromNumeric = new Date(timestamp);
      if (!Number.isNaN(dateFromNumeric.valueOf())) {
        return dateFromNumeric;
      }
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    const slashMatch = trimmed
      .replace(/[^0-9/\-\s]+/g, " ")
      .match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (slashMatch) {
      const [, dayStr, monthStr, yearStr] = slashMatch;
      const day = Number.parseInt(dayStr, 10);
      const monthIndex = Number.parseInt(monthStr, 10) - 1;
      let year = Number.parseInt(yearStr, 10);
      if (year < 100) {
        year += year >= 70 ? 1900 : 2000;
      }
      const candidate = new Date(Date.UTC(year, monthIndex, day));
      if (!Number.isNaN(candidate.valueOf())) {
        return candidate;
      }
    }

    const monthNameMatch = trimmed
      .toLowerCase()
      .match(/^(\d{1,2})?\s*([a-zA-Z]+)\s*(\d{4})$/);
    if (monthNameMatch) {
      const [, dayStr = "1", monthName, yearStr] = monthNameMatch;
      const normalizedMonth = monthName
        .normalize("NFD")
        .replace(/[^a-z]/g, "")
        .toLowerCase();
      const monthIndex = INDONESIAN_MONTHS.get(normalizedMonth);
      const year = Number.parseInt(yearStr, 10);
      const day = Number.parseInt(dayStr, 10) || 1;
      if (Number.isFinite(year) && monthIndex != null) {
        const candidate = new Date(Date.UTC(year, monthIndex, day));
        if (!Number.isNaN(candidate.valueOf())) {
          return candidate;
        }
      }
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed;
    }
  }

  return null;
};

const DEFAULT_WEEKLY_ACTIVITY_DATE_PATHS = [
  "activityDate",
  "activity_date",
  "tanggal",
  "date",
  "periode",
  "period",
  "bulan",
  "month",
  "month_label",
  "monthLabel",
  "created_at",
  "createdAt",
  "updated_at",
  "updatedAt",
  "time",
  "waktu",
  "publishedAt",
  "published_at",
  "timestamp",
  "rekap.activity_date",
  "rekap.activityDate",
  "rekap.tanggal",
  "rekap.date",
  "rekap.periode",
  "rekap.period",
  "rekap.bulan",
  "rekap.month",
  "rekap.month_label",
  "rekap.monthLabel",
  "rekap.created_at",
  "rekap.createdAt",
  "rekap.start_date",
  "rekap.startDate",
  "rekap.end_date",
  "rekap.endDate",
  "metrics.activity_date",
  "metrics.activityDate",
  "metrics.tanggal",
  "metrics.date",
  "metrics.created_at",
  "metrics.createdAt",
  "metrics.updated_at",
  "metrics.updatedAt",
  "metrics.time",
  "metrics.waktu",
  "tiktok.activity_date",
  "tiktok.activityDate",
  "tiktok_activity_date",
  "tiktokActivityDate",
  "rekap.tiktok_activity_date",
  "rekap.tiktokActivityDate",
];

export const resolveWeeklyRecordDate = (
  record: any,
  extraPaths: string[] = [],
): { raw: any; parsed: Date } | null => {
  if (!record) {
    return null;
  }

  const normalizedPaths = Array.isArray(extraPaths)
    ? extraPaths
    : typeof extraPaths === "string"
    ? [extraPaths]
    : [];
  const candidatePaths = [...normalizedPaths, ...DEFAULT_WEEKLY_ACTIVITY_DATE_PATHS];

  for (const path of candidatePaths) {
    const rawValue = pickWeeklyNestedValue(record, [path]);
    const parsed = parseWeeklyDateValue(rawValue);
    if (parsed) {
      return { raw: rawValue, parsed };
    }
  }

  return null;
};

export const formatWeeklyRangeLabel = (
  start: Date,
  end: Date,
  locale = "id-ID",
): string => {
  if (!(start instanceof Date) || Number.isNaN(start.valueOf())) {
    return "";
  }

  const resolvedEnd =
    end instanceof Date && !Number.isNaN(end.valueOf())
      ? end
      : new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);

  const formatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });

  const startLabel = formatter.format(start);
  const endLabel = formatter.format(resolvedEnd);

  if (startLabel === endLabel) {
    return startLabel;
  }

  return `${startLabel} – ${endLabel}`;
};

export { pickWeeklyNestedValue, pickWeeklyNestedString };
