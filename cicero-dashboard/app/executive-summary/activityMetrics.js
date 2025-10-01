import { normalizeFormattedNumber } from "@/lib/normalizeNumericInput";
import { pickNestedValue } from "./weeklyTrendUtils";

export const ensureArray = (...candidates) => {
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    if (Array.isArray(candidate)) {
      return candidate;
    }

    if (Array.isArray(candidate?.data)) {
      return candidate.data;
    }

    if (Array.isArray(candidate?.items)) {
      return candidate.items;
    }

    if (Array.isArray(candidate?.results)) {
      return candidate.results;
    }

    if (Array.isArray(candidate?.records)) {
      return candidate.records;
    }
  }

  return [];
};

export const extractNumericValue = (...candidates) => {
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

    const normalized = normalizeFormattedNumber(candidate);
    const numeric = Number(normalized);
    if (Number.isFinite(numeric)) {
      return numeric;
    }

    if (
      typeof candidate === "object" &&
      candidate !== null &&
      "value" in candidate
    ) {
      const nested = Number(candidate.value);
      if (Number.isFinite(nested)) {
        return nested;
      }
    }
  }

  return 0;
};

export const LIKE_RECORD_LIKE_FIELDS = [
  "jumlah_like",
  "jumlahLike",
  "total_like",
  "totalLike",
  "totalLikes",
  "likes",
  "like_count",
  "rekap.jumlah_like",
  "rekap.total_like",
];

export const LIKE_RECORD_COMMENT_FIELDS = [
  "jumlah_komentar",
  "jumlahKomentar",
  "total_komentar",
  "totalKomentar",
  "komentar",
  "comments",
  "comment_count",
  "rekap.jumlah_komentar",
  "rekap.total_komentar",
];

export const INSTAGRAM_LIKE_FIELD_PATHS = [...LIKE_RECORD_LIKE_FIELDS];
export const TIKTOK_COMMENT_FIELD_PATHS = [...LIKE_RECORD_COMMENT_FIELDS];

export const LIKE_RECORD_ACTIVE_FIELDS = [
  "jumlah_personil_aktif",
  "jumlahPersonilAktif",
  "total_personil_aktif",
  "personil_aktif",
  "total_personil_like",
  "jumlah_personil_like",
  "personilAktif",
];

export const LIKE_RECORD_TOTAL_PERSONNEL_FIELDS = [
  "jumlah_personil",
  "total_personil",
  "target_personil",
  "jumlah_target",
  "target",
  "personil",
  "total_user",
  "totalUsers",
];

export const LIKE_RECORD_COMPLIANCE_FIELDS = [
  "persentase_kepatuhan",
  "persentase",
  "presentase",
  "percentage",
  "compliance_rate",
  "rate_kepatuhan",
  "kepatuhan",
  "rekap.persentase_kepatuhan",
];

export const LIKE_RECORD_USERNAME_FIELDS = [
  "username",
  "user_name",
  "nama_pengguna",
  "nama",
  "name",
  "nrp",
  "nip",
  "user_id",
  "personil_id",
];

export const LIKE_RECORD_CLIENT_ID_FIELDS = [
  "client_id",
  "clientId",
  "clientID",
  "id_client",
  "idClient",
];

export const LIKE_RECORD_CLIENT_NAME_FIELDS = [
  "nama_client",
  "client_name",
  "client",
  "nama_satker",
  "satker",
];

export const LIKE_RECORD_DATE_PATHS = [
  "tanggal",
  "date",
  "created_at",
  "createdAt",
  "updated_at",
  "updatedAt",
  "rekap.tanggal",
  "rekap.date",
  "rekap.created_at",
  "rekap.updated_at",
];

export const readNumericField = (record, paths = []) => {
  if (!record || typeof record !== "object" || !Array.isArray(paths)) {
    return 0;
  }

  const candidates = paths
    .map((path) => pickNestedValue(record, [path]))
    .filter((value) => value !== undefined && value !== null);

  if (candidates.length === 0) {
    return 0;
  }

  const numeric = extractNumericValue(...candidates);
  return Number.isFinite(numeric) ? Math.max(0, Number(numeric) || 0) : 0;
};

export const sumActivityRecords = (records, fieldPaths) => {
  if (!Array.isArray(records) || !Array.isArray(fieldPaths)) {
    return 0;
  }

  return records.reduce(
    (total, record) => total + readNumericField(record, fieldPaths),
    0,
  );
};

export const normalizeClientIdentifiers = (record = {}) => {
  let clientIdValue = null;
  for (const field of LIKE_RECORD_CLIENT_ID_FIELDS) {
    const value = pickNestedValue(record, [field]);
    if (value === undefined || value === null) {
      continue;
    }
    const text = String(value).trim();
    if (!text) {
      continue;
    }
    clientIdValue = text;
    break;
  }

  let clientNameValue = null;
  for (const field of LIKE_RECORD_CLIENT_NAME_FIELDS) {
    const value = pickNestedValue(record, [field]);
    if (typeof value !== "string") {
      continue;
    }
    const text = value.trim();
    if (!text) {
      continue;
    }
    clientNameValue = text;
    break;
  }

  const fallbackName = clientNameValue || clientIdValue || "Lainnya";
  const keySource = clientIdValue || fallbackName;
  const normalizedKey = String(keySource).trim().toLowerCase() || "lainnya";

  return {
    key: normalizedKey,
    clientId: clientIdValue,
    clientName: clientNameValue || fallbackName,
  };
};

export const normalizeUserKeyFromRecord = (record = {}) => {
  for (const field of LIKE_RECORD_USERNAME_FIELDS) {
    const value = pickNestedValue(record, [field]);
    if (value === undefined || value === null) {
      continue;
    }
    const text = String(value).trim().toLowerCase();
    if (text) {
      return text;
    }
  }
  return null;
};

export const computeActivityBuckets = ({
  users,
  likes,
  comments,
  totalIGPosts,
  totalTikTokPosts,
} = {}) => {
  const safeUsers = ensureArray(users).filter(Boolean);
  const directoryKeys = new Set();
  safeUsers.forEach((user) => {
    const key = normalizeUserKeyFromRecord(user);
    if (key) {
      directoryKeys.add(key);
    }
  });

  const likesRecords = ensureArray(likes).filter(Boolean);
  const instagramActiveKeys = new Set();
  likesRecords.forEach((record) => {
    const key = normalizeUserKeyFromRecord(record);
    if (key) {
      instagramActiveKeys.add(key);
    }
  });

  const commentsRecords = ensureArray(comments).filter(Boolean);
  const tiktokActiveKeys = new Set();
  commentsRecords.forEach((record) => {
    const key = normalizeUserKeyFromRecord(record);
    if (key) {
      tiktokActiveKeys.add(key);
    }
  });

  const evaluatedUsers = directoryKeys.size;

  const igPosts = extractNumericValue(totalIGPosts);
  const ttPosts = extractNumericValue(totalTikTokPosts);
  const safeNumber = (value) => (Number.isFinite(value) ? value : 0);
  const totalContent = Math.max(0, safeNumber(igPosts) + safeNumber(ttPosts));

  const instagramActiveCount = Array.from(instagramActiveKeys).filter((key) =>
    directoryKeys.has(key),
  ).length;
  const tiktokActiveCount = Array.from(tiktokActiveKeys).filter((key) =>
    directoryKeys.has(key),
  ).length;

  const knownActiveKeys = new Set();
  instagramActiveKeys.forEach((key) => {
    if (directoryKeys.has(key)) {
      knownActiveKeys.add(key);
    }
  });
  tiktokActiveKeys.forEach((key) => {
    if (directoryKeys.has(key)) {
      knownActiveKeys.add(key);
    }
  });

  const passiveCount = Math.max(evaluatedUsers - knownActiveKeys.size, 0);

  return {
    evaluatedUsers,
    totalContent,
    categories: [
      {
        key: "instagram-active",
        label: "Aktif memberi likes Instagram",
        description:
          "Personil yang memberikan likes pada konten Instagram selama periode ini.",
        count: instagramActiveCount,
      },
      {
        key: "tiktok-active",
        label: "Aktif berkomentar di TikTok",
        description:
          "Personil yang aktif memberikan komentar pada konten TikTok selama periode ini.",
        count: tiktokActiveCount,
      },
      {
        key: "passive",
        label: "Belum berinteraksi",
        description:
          "Personil dalam direktori yang belum menunjukkan aktivitas pada Instagram atau TikTok.",
        count: passiveCount,
      },
    ],
  };
};

