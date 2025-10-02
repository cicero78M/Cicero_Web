const pickNestedValue = (source, paths = []) => {
  if (!source) {
    return undefined;
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

    return current;
  }

  return undefined;
};

const pickNestedString = (source, paths = []) => {
  const value = pickNestedValue(source, paths);
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
};

const INDONESIAN_MONTHS = new Map([
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

const parseDateValue = (value) => {
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

const DEFAULT_ACTIVITY_DATE_PATHS = [
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

const resolveRecordDate = (record, extraPaths = []) => {
  if (!record) {
    return null;
  }

  const normalizedPaths = Array.isArray(extraPaths)
    ? extraPaths
    : typeof extraPaths === "string"
    ? [extraPaths]
    : [];
  const candidatePaths = [...normalizedPaths, ...DEFAULT_ACTIVITY_DATE_PATHS];

  for (const path of candidatePaths) {
    const rawValue = pickNestedValue(record, [path]);
    const parsed = parseDateValue(rawValue);
    if (parsed) {
      return { raw: rawValue, parsed };
    }
  }

  return null;
};

const groupRecordsByWeek = (records, { getDate, datePaths } = {}) => {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const extractor =
    typeof getDate === "function"
      ? getDate
      : (record) => {
          const resolved = resolveRecordDate(record, datePaths);
          if (resolved) {
            return resolved.parsed;
          }
          return null;
        };

  const buckets = new Map();

  records.forEach((record) => {
    if (!record) {
      return;
    }

    const rawDate = extractor(record);
    const parsedDate = parseDateValue(rawDate);

    if (!parsedDate) {
      return;
    }

    const startOfDayUtc = new Date(
      Date.UTC(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
      ),
    );
    const weekday = startOfDayUtc.getUTCDay();
    const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
    startOfDayUtc.setUTCDate(startOfDayUtc.getUTCDate() + diffToMonday);
    startOfDayUtc.setUTCHours(0, 0, 0, 0);

    const key = startOfDayUtc.toISOString().slice(0, 10);
    let bucket = buckets.get(key);
    if (!bucket) {
      const endDate = new Date(startOfDayUtc);
      endDate.setUTCDate(endDate.getUTCDate() + 6);
      bucket = {
        key,
        start: startOfDayUtc,
        end: endDate,
        records: [],
      };
      buckets.set(key, bucket);
    }

    bucket.records.push(record);
  });

  return Array.from(buckets.values()).sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
};

const groupRecordsByMonth = (records, { getDate, datePaths } = {}) => {
  if (!Array.isArray(records) || records.length === 0) {
    return [];
  }

  const extractor =
    typeof getDate === "function"
      ? getDate
      : (record) => {
          const resolved = resolveRecordDate(record, datePaths);
          if (resolved) {
            return resolved.parsed;
          }
          return null;
        };

  const buckets = new Map();

  records.forEach((record) => {
    if (!record) {
      return;
    }

    const rawDate = extractor(record);
    const parsedDate = parseDateValue(rawDate);

    if (!parsedDate) {
      return;
    }

    const year = parsedDate.getUTCFullYear();
    const monthIndex = parsedDate.getUTCMonth();
    const startOfMonth = new Date(Date.UTC(year, monthIndex, 1));
    const endOfMonth = new Date(Date.UTC(year, monthIndex + 1, 0));
    endOfMonth.setUTCHours(23, 59, 59, 999);
    const key = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        key,
        start: startOfMonth,
        end: endOfMonth,
        records: [],
      };
      buckets.set(key, bucket);
    }

    bucket.records.push(record);
  });

  return Array.from(buckets.values()).sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
};

const shouldShowWeeklyTrendCard = ({
  showPlatformLoading,
  platformError,
  hasMonthlyPlatforms,
  cardHasRecords,
}) => {
  if (showPlatformLoading) {
    return true;
  }

  if (platformError && !hasMonthlyPlatforms) {
    return true;
  }

  return Boolean(cardHasRecords);
};

const formatWeekRangeLabel = (start, end, locale = "id-ID") => {
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

const formatMonthRangeLabel = (start, end, locale = "id-ID") => {
  if (!(start instanceof Date) || Number.isNaN(start.valueOf())) {
    return "";
  }

  const formatter = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  });

  return formatter.format(start);
};

export {
  pickNestedValue,
  pickNestedString,
  parseDateValue,
  resolveRecordDate,
  groupRecordsByWeek,
  groupRecordsByMonth,
  shouldShowWeeklyTrendCard,
  formatWeekRangeLabel,
  formatMonthRangeLabel,
};
