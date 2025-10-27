/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  parseWeeklyDateValue,
  resolveWeeklyRecordDate,
} from "./weeklyTrendUtils";

const toSafeNumber = (value: any): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeKeyValue = (value: any): string | null => {
  if (value == null) {
    return null;
  }

  const stringValue =
    typeof value === "string" ? value.trim() : String(value ?? "").trim();

  if (!stringValue) {
    return null;
  }

  return stringValue.toLowerCase();
};

const extractWeeklyMetricValue = (
  record: any,
  type: "likes" | "comments",
): any => {
  if (!record || typeof record !== "object") {
    return 0;
  }

  if (type === "likes") {
    return (
      record?.likes_personil ??
      record?.likes_personel ??
      record?.likes_personnel ??
      record?.total_like_personil ??
      record?.total_like_personel ??
      record?.total_like_personnel ??
      record?.totalLikesPersonil ??
      record?.totalLikesPersonel ??
      record?.totalLikesPersonnel ??
      record?.rekap?.likes_personil ??
      record?.rekap?.likes_personel ??
      record?.rekap?.likes_personnel ??
      record?.rekap?.total_like_personil ??
      record?.rekap?.total_like_personel ??
      record?.rekap?.total_like_personnel ??
      record?.rekap?.totalLikesPersonil ??
      record?.rekap?.totalLikesPersonel ??
      record?.rekap?.totalLikesPersonnel ??
      record?.metrics?.likes_personil ??
      record?.metrics?.likes_personel ??
      record?.metrics?.likes_personnel ??
      record?.metrics?.total_like_personil ??
      record?.metrics?.total_like_personel ??
      record?.metrics?.total_like_personnel ??
      record?.metrics?.totalLikesPersonil ??
      record?.metrics?.totalLikesPersonel ??
      record?.metrics?.totalLikesPersonnel ??
      record?.jumlah_like ??
      record?.jumlahLike ??
      record?.total_like ??
      record?.likes ??
      record?.totalLikes ??
      record?.like_count ??
      record?.likeCount ??
      record?.total_likes ??
      record?.rekap?.jumlah_like ??
      record?.rekap?.jumlahLike ??
      record?.rekap?.total_like ??
      record?.rekap?.likes ??
      record?.rekap?.totalLikes ??
      record?.rekap?.like_count ??
      record?.rekap?.likeCount ??
      record?.rekap?.total_likes ??
      record?.metrics?.jumlah_like ??
      record?.metrics?.jumlahLike ??
      record?.metrics?.total_like ??
      record?.metrics?.likes ??
      record?.metrics?.totalLikes ??
      record?.metrics?.like_count ??
      record?.metrics?.likeCount ??
      record?.metrics?.total_likes ??
      0
    );
  }

  return (
    record?.total_comments_personil ??
    record?.total_comments_personel ??
    record?.total_comments_personnel ??
    record?.totalCommentsPersonil ??
    record?.totalCommentsPersonel ??
    record?.totalCommentsPersonnel ??
    record?.rekap?.total_comments_personil ??
    record?.rekap?.total_comments_personel ??
    record?.rekap?.total_comments_personnel ??
    record?.rekap?.totalCommentsPersonil ??
    record?.rekap?.totalCommentsPersonel ??
    record?.rekap?.totalCommentsPersonnel ??
    record?.metrics?.total_comments_personil ??
    record?.metrics?.total_comments_personel ??
    record?.metrics?.total_comments_personnel ??
    record?.metrics?.totalCommentsPersonil ??
    record?.metrics?.totalCommentsPersonel ??
    record?.metrics?.totalCommentsPersonnel ??
    record?.jumlah_komentar ??
    record?.jumlahKomentar ??
    record?.total_komentar ??
    record?.totalKomentar ??
    record?.total_comments ??
    record?.totalComments ??
    record?.comment_count ??
    record?.commentCount ??
    record?.comments ??
    record?.rekap?.jumlah_komentar ??
    record?.rekap?.jumlahKomentar ??
    record?.rekap?.total_komentar ??
    record?.rekap?.totalKomentar ??
    record?.rekap?.total_comments ??
    record?.rekap?.totalComments ??
    record?.rekap?.comment_count ??
    record?.rekap?.commentCount ??
    record?.rekap?.comments ??
    record?.metrics?.jumlah_komentar ??
    record?.metrics?.jumlahKomentar ??
    record?.metrics?.total_komentar ??
    record?.metrics?.totalKomentar ??
    record?.metrics?.total_comments ??
    record?.metrics?.totalComments ??
    record?.metrics?.comment_count ??
    record?.metrics?.commentCount ??
    record?.metrics?.comments ??
    0
  );
};

export const createEmptyWeeklyLikesSummary = () => ({
  totals: {
    totalClients: 0,
    totalLikes: 0,
    totalComments: 0,
    totalPersonnel: 0,
    activePersonnel: 0,
    inactiveCount: 0,
    complianceRate: 0,
    averageComplianceRate: 0,
  },
  clients: [],
  topPersonnel: [],
  lastUpdated: null,
});

export const mergeWeeklyActivityRecords = (
  likesRecords: any[] = [],
  commentRecords: any[] = [],
) => {
  const records = new Map<string, any>();
  const aliasToCanonical = new Map<string, string>();

  const PERSONNEL_IDENTIFIER_FIELDS = [
    "user_id",
    "userId",
    "userID",
    "id_user",
    "idUser",
    "person_id",
    "personId",
    "personID",
    "personil_id",
    "personilId",
    "personel_id",
    "personelId",
    "personnel_id",
    "id_personil",
    "idPersonil",
    "id_personel",
    "idPersonel",
    "id_personnel",
    "idPersonnel",
    "nrp",
    "nip",
    "nik",
    "username",
    "user_name",
    "userName",
    "instagram_username",
    "instagramUsername",
    "akun",
    "akun_media_sosial",
    "akunMediaSosial",
    "akun_instagram",
    "akunInstagram",
    "nama",
    "name",
    "full_name",
    "fullName",
    "nama_personil",
    "nama_personel",
    "nama_personnel",
    "namaPersonil",
    "namaPersonel",
    "namaPersonnel",
    "namaLengkap",
    "nama_lengkap",
    "display_name",
    "displayName",
  ];

  const collectPersonnelIdentifiers = (record: any): string[] => {
    const sources = [
      record,
      record?.rekap,
      record?.metrics,
      record?.personel,
      record?.personil,
      record?.personnel,
      record?.user,
    ];

    const identifiers = new Set<string>();

    sources.forEach((source) => {
      if (!source || typeof source !== "object") {
        return;
      }

      PERSONNEL_IDENTIFIER_FIELDS.forEach((field) => {
        const value = source[field];
        if (Array.isArray(value)) {
          value.forEach((item) => {
            const normalized = normalizeKeyValue(item);
            if (normalized) {
              identifiers.add(normalized);
              const comparable = normalized.replace(/[^a-z0-9]/g, "");
              if (comparable && comparable !== normalized) {
                identifiers.add(comparable);
              }
            }
          });
        } else {
          const normalized = normalizeKeyValue(value);
          if (normalized) {
            identifiers.add(normalized);
            const comparable = normalized.replace(/[^a-z0-9]/g, "");
            if (comparable && comparable !== normalized) {
              identifiers.add(comparable);
            }
          }
        }
      });
    });

    return Array.from(identifiers.values());
  };

  const assignPersonnelDetails = (target: any, source: any) => {
    if (!source || typeof source !== "object") {
      return;
    }

    const sources = [
      source,
      source?.rekap,
      source?.metrics,
      source?.personel,
      source?.personil,
      source?.personnel,
      source?.user,
    ];

    sources.forEach((item) => {
      if (!item || typeof item !== "object") {
        return;
      }

      PERSONNEL_IDENTIFIER_FIELDS.forEach((field) => {
        if (field in item) {
          assignIfEmpty(target, field, item[field]);
        }
      });
    });
  };

  const LIKE_FIELDS = [
    "jumlah_like",
    "jumlahLike",
    "total_like",
    "totalLikes",
    "likes",
    "like_count",
    "likeCount",
    "total_likes",
  ];

  const COMMENT_FIELDS = [
    "jumlah_komentar",
    "jumlahKomentar",
    "total_komentar",
    "totalKomentar",
    "total_comments",
    "totalComments",
    "total_comments_personil",
    "total_comments_personel",
    "total_comments_personnel",
    "totalCommentsPersonil",
    "totalCommentsPersonel",
    "totalCommentsPersonnel",
    "comment_count",
    "commentCount",
    "comments",
  ];

  const ensureExistingRecord = (keys: string[], source: any) => {
    let canonicalKey: string | null = null;
    let isNew = false;

    for (const key of keys) {
      const mapped = aliasToCanonical.get(key);
      if (mapped && records.has(mapped)) {
        canonicalKey = mapped;
        break;
      }
      if (records.has(key)) {
        canonicalKey = key;
        break;
      }
    }

    if (!canonicalKey) {
      canonicalKey = keys[0];
      records.set(canonicalKey, {});
      isNew = true;
    }

    const existing = records.get(canonicalKey)!;
    if (isNew && source && typeof source === "object") {
      Object.assign(existing, source);
    }

    keys.forEach((key) => aliasToCanonical.set(key, canonicalKey!));

    return { existing, isNew };
  };

  const assignClientDetails = (
    target: any,
    clientIdCandidates: any[] = [],
    clientNameCandidates: any[] = [],
  ) => {
    const updateStringField = (field: string, value: any) => {
      if (value == null) {
        return;
      }

      const normalized = typeof value === "string" ? value.trim() : value;
      if (normalized === "" || normalized == null) {
        return;
      }

      const current = target[field];
      if (
        current == null ||
        (typeof current === "string" &&
          (current.trim() === "" ||
            current.trim().toUpperCase() === "LAINNYA") &&
          String(normalized).toUpperCase() !== "LAINNYA")
      ) {
        target[field] = value;
      }
    };

    const normalizeCandidates = (candidates: any[]) => {
      const seenObjects = new WeakSet<object>();
      const seenStrings = new Set<string>();

      const extractStrings = (value: any): string[] => {
        if (value == null) {
          return [];
        }

        if (typeof value === "string" || typeof value === "number") {
          const normalized = String(value).trim();
          return normalized ? [normalized] : [];
        }

        if (typeof value === "boolean") {
          return [];
        }

        if (Array.isArray(value)) {
          return value.flatMap((item) => extractStrings(item));
        }

        if (typeof value === "object") {
          const objectValue = value as Record<string, unknown>;
          if (seenObjects.has(objectValue)) {
            return [];
          }
          seenObjects.add(objectValue);

          const prioritizedFields = [
            "name",
            "nama",
            "client_name",
            "clientName",
            "client",
            "label",
            "title",
            "divisi",
            "satker",
            "satuan_kerja",
            "nama_satuan_kerja",
            "value",
          ];

          const prioritized = prioritizedFields.flatMap((field) =>
            extractStrings(objectValue[field]),
          );

          const nested = Object.values(objectValue).flatMap((entry) =>
            extractStrings(entry),
          );

          return [...prioritized, ...nested];
        }

        return [];
      };

      const normalized: string[] = [];

      candidates.forEach((candidate) => {
        const extracted = extractStrings(candidate);
        extracted.forEach((item) => {
          const trimmed = item.trim();
          if (!trimmed || seenStrings.has(trimmed)) {
            return;
          }

          seenStrings.add(trimmed);
          normalized.push(trimmed);
        });
      });

      return normalized;
    };

    const normalizedClientIds = normalizeCandidates(clientIdCandidates);
    const normalizedClientNames = normalizeCandidates(clientNameCandidates);

    normalizedClientIds.forEach((value) => {
      updateStringField("client_id", value);
      updateStringField("clientId", value);
      updateStringField("clientID", value);
      updateStringField("id_client", value);
      updateStringField("clientid", value);
      updateStringField("idClient", value);
    });

    normalizedClientNames.forEach((value) => {
      updateStringField("nama_client", value);
      updateStringField("client_name", value);
      updateStringField("client", value);
      updateStringField("namaClient", value);
      updateStringField("clientName", value);
    });
  };

  const assignIfEmpty = (target: any, field: string, value: any) => {
    if (value == null) {
      return;
    }

    if (
      target[field] == null ||
      (typeof target[field] === "string" && target[field].trim() === "")
    ) {
      target[field] = value;
    }
  };

  const setMetricValue = (target: any, fields: string[], value: any) => {
    const numeric = toSafeNumber(value);
    fields.forEach((field) => {
      target[field] = numeric;
    });
  };

  const addMetricValue = (target: any, fields: string[], value: any) => {
    const numeric = toSafeNumber(value);
    if (!numeric) {
      return;
    }

    fields.forEach((field) => {
      target[field] = toSafeNumber(target[field]) + numeric;
    });
  };

  const ingest = (recordsToIngest: any[], type: "likes" | "comments") => {
    if (!Array.isArray(recordsToIngest)) {
      return;
    }

    recordsToIngest.forEach((record, recordIndex) => {
      if (!record || typeof record !== "object") {
        return;
      }

      const clientIdCandidates = [
        record?.client_id,
        record?.clientId,
        record?.clientID,
        record?.id_client,
        record?.clientid,
        record?.idClient,
        record?.rekap?.client_id,
        record?.rekap?.clientId,
        record?.rekap?.clientID,
        record?.rekap?.id_client,
        record?.rekap?.clientid,
        record?.rekap?.idClient,
      ];

      const clientNameCandidates = [
        record?.nama_client,
        record?.client_name,
        record?.client,
        record?.namaClient,
        record?.clientName,
        record?.rekap?.nama_client,
        record?.rekap?.client_name,
        record?.rekap?.client,
        record?.rekap?.namaClient,
        record?.rekap?.clientName,
      ];

      const normalizedClientIdentifiers = new Set<string>();
      [...clientIdCandidates, ...clientNameCandidates].forEach((value) => {
        const normalized = normalizeKeyValue(value);
        if (normalized) {
          normalizedClientIdentifiers.add(normalized);
        }
      });

      if (normalizedClientIdentifiers.size === 0) {
        normalizedClientIdentifiers.add(`fallback-${type}-${recordIndex}`);
      }

      const personnelIdentifiers = collectPersonnelIdentifiers(record);
      let keyCandidates: string[] = [];

      if (personnelIdentifiers.length > 0) {
        normalizedClientIdentifiers.forEach((clientIdentifier) => {
          personnelIdentifiers.forEach((personIdentifier) => {
            keyCandidates.push(`${clientIdentifier}::${personIdentifier}`);
          });
        });
      }

      if (keyCandidates.length === 0) {
        keyCandidates = Array.from(normalizedClientIdentifiers.values());
      }

      if (keyCandidates.length === 0) {
        keyCandidates.push(`fallback-${type}-${recordIndex}`);
      }

      keyCandidates = Array.from(new Set(keyCandidates));

      const { existing, isNew } = ensureExistingRecord(keyCandidates, record);
      assignClientDetails(
        existing,
        clientIdCandidates,
        clientNameCandidates,
      );
      assignPersonnelDetails(existing, record);
      assignIfEmpty(existing, "rekap", record?.rekap);
      assignIfEmpty(existing, "metrics", record?.metrics);
      assignIfEmpty(existing, "activityDate", record?.activityDate);

      const metricValue = extractWeeklyMetricValue(record, type);
      if (isNew) {
        setMetricValue(
          existing,
          type === "likes" ? LIKE_FIELDS : COMMENT_FIELDS,
          metricValue,
        );
      } else {
        addMetricValue(
          existing,
          type === "likes" ? LIKE_FIELDS : COMMENT_FIELDS,
          metricValue,
        );
      }
    });
  };

  ingest(likesRecords, "likes");
  ingest(commentRecords, "comments");

  return Array.from(records.values());
};

const PERSONNEL_IDENTIFIER_FIELDS = [
  "person_id",
  "personId",
  "personID",
  "user_id",
  "userId",
  "userID",
  "id",
  "nrp",
  "nip",
  "nik",
  "username",
  "user_name",
  "userName",
  "email",
  "akun",
  "akun_media_sosial",
  "akunMediaSosial",
  "nama",
  "name",
  "full_name",
  "fullName",
];

const toUppercaseIdentifier = (value: any) => {
  if (value == null) {
    return "";
  }

  const stringValue = String(value).trim();
  if (!stringValue) {
    return "";
  }

  return stringValue.toUpperCase();
};

const buildDirectoryPersonnelIdentity = (
  source: any = {},
  fallbackIndex: string | number,
) => {
  for (const field of PERSONNEL_IDENTIFIER_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(source ?? {}, field)) {
      continue;
    }

    const candidate = source[field];
    const normalized = toUppercaseIdentifier(candidate);
    if (normalized) {
      return normalized;
    }
  }

  const fallback = `PERSON-${fallbackIndex}`;
  return fallback.toUpperCase();
};

export const countUniquePersonnelRecords = (records: any[] = []) => {
  if (!Array.isArray(records)) {
    return 0;
  }

  const uniqueIdentifiers = new Set<string>();

  records.forEach((record, index) => {
    if (!record || typeof record !== "object") {
      return;
    }

    const identifier = buildDirectoryPersonnelIdentity(record, `record-${index}`);
    if (!identifier) {
      return;
    }

    uniqueIdentifiers.add(identifier);
  });

  return uniqueIdentifiers.size;
};

export const aggregateWeeklyLikesRecords = (
  records: any[] = [],
  options: { directoryUsers?: any[] } = {},
) => {
  const safeRecords = Array.isArray(records)
    ? records.filter((item) => item && typeof item === "object")
    : [];
  const directoryUsersRaw = Array.isArray(options?.directoryUsers)
    ? options.directoryUsers.filter((item) => item && typeof item === "object")
    : [];

  if (safeRecords.length === 0 && directoryUsersRaw.length === 0) {
    return createEmptyWeeklyLikesSummary();
  }

  const toNormalizedString = (value: any) => {
    if (value == null) {
      return "";
    }
    const strValue = String(value).trim();
    return strValue;
  };

  const normalizeKeyComponent = (value: any) => {
    const normalized = toNormalizedString(value);
    return normalized ? normalized.toUpperCase() : "";
  };

  const toComparableToken = (value: any) =>
    normalizeKeyComponent(value).replace(/[^A-Z0-9]/g, "");

  const pickFirstNonEmptyString = (candidates: any[] = []) => {
    for (const candidate of candidates) {
      const normalized = toNormalizedString(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return "";
  };

  const isGenericClientIdentifier = (value: any) => {
    const comparable = toComparableToken(value);
    if (!comparable) {
      return true;
    }

    const GENERIC_TOKENS = ["LAINNYA", "DITBINMAS"];
    return GENERIC_TOKENS.some((token) => comparable.startsWith(token));
  };

  const resolveClientIdentifiers = (source: any = {}) => {
    const rawClientId =
      source?.client_id ??
      source?.clientId ??
      source?.clientID ??
      source?.client ??
      source?.id_client ??
      source?.clientid ??
      source?.idClient ??
      "";

    const clientId = toNormalizedString(rawClientId) || "LAINNYA";
    const satfung = pickFirstNonEmptyString([
      source?.satfung,
      source?.nama_satfung,
      source?.satfung_name,
      source?.satfungName,
      source?.satfung_unit,
      source?.satfungUnit,
      source?.unit_satfung,
      source?.unitSatfung,
      source?.satfung_label,
      source?.satfungLabel,
      source?.rekap?.satfung,
      source?.rekap?.nama_satfung,
      source?.rekap?.satfung_name,
      source?.rekap?.satfungName,
      source?.rekap?.satfung_label,
      source?.metrics?.satfung,
      source?.metrics?.nama_satfung,
      source?.metrics?.satfung_name,
      source?.metrics?.satfungName,
      source?.metrics?.satfung_label,
    ]);
    const divisiRaw = pickFirstNonEmptyString([
      source?.divisi,
      source?.rekap?.divisi,
      source?.metrics?.divisi,
    ]);
    const divisi = divisiRaw || satfung || "";
    const clientName =
      pickFirstNonEmptyString([
        satfung,
        source?.nama_client,
        source?.client_name,
        source?.client,
        source?.namaClient,
        source?.clientName,
        source?.divisi,
        source?.satker,
        source?.satuan_kerja,
        source?.nama_satuan_kerja,
        divisiRaw,
        divisi,
        clientId,
      ]) || "LAINNYA";

    const normalizedClientIdKey =
      normalizeKeyComponent(clientId) || "LAINNYA";
    const normalizedDivisiKey = normalizeKeyComponent(divisi);
    const normalizedSatfungKey = normalizeKeyComponent(satfung);
    const normalizedClientNameKey = normalizeKeyComponent(clientName);

    const extraSegments: string[] = [];
    const extraSegmentSet = new Set<string>();
    const pushUniqueSegment = (segment: string) => {
      if (!segment || extraSegmentSet.has(segment)) {
        return;
      }
      extraSegmentSet.add(segment);
      extraSegments.push(segment);
    };

    pushUniqueSegment(normalizedSatfungKey);
    pushUniqueSegment(normalizedDivisiKey);
    if (
      normalizedClientNameKey &&
      normalizedClientNameKey !== normalizedClientIdKey
    ) {
      pushUniqueSegment(normalizedClientNameKey);
    }

    const clientKey = isGenericClientIdentifier(normalizedClientIdKey)
      ? [normalizedClientIdKey, ...extraSegments].filter(Boolean).join("::") ||
        normalizedClientIdKey ||
        "LAINNYA"
      : normalizedClientIdKey || "LAINNYA";

    return { clientId, clientKey, clientName, divisi, satfung };
  };

  const isTraversable = (value: any) => {
    if (!value || typeof value !== "object") {
      return false;
    }
    if (Array.isArray(value)) {
      return true;
    }
    const tag = Object.prototype.toString.call(value);
    return tag === "[object Object]";
  };

  const collectFieldValues = (root: any, fieldNames: string[] = []) => {
    if (!isTraversable(root)) {
      return [] as any[];
    }

    const queue: any[] = [root];
    const seen = new Set<any>();
    const values: any[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!isTraversable(current) || seen.has(current)) {
        continue;
      }
      seen.add(current);

      fieldNames.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(current, field)) {
          const candidate = current[field];
          if (candidate != null) {
            values.push(candidate);
          }
        }
      });

      Object.values(current).forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (isTraversable(item) && !seen.has(item)) {
              queue.push(item);
            }
          });
        } else if (isTraversable(value) && !seen.has(value)) {
          queue.push(value);
        }
      });
    }

    return values;
  };

  const sanitizeHandle = (value: any) => {
    const normalized = toNormalizedString(value);
    if (!normalized) {
      return "";
    }

    let handle = normalized
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .trim();

    handle = handle.split(/[?#]/, 1)[0];

    if (handle.includes("/")) {
      const segments = handle.split("/").filter(Boolean);
      if (segments.length > 0) {
        handle = segments[segments.length - 1];
      }
    }

    handle = handle.replace(/^@+/, "").trim();

    if (!handle || /\s/.test(handle) || handle.includes("@")) {
      return "";
    }

    return handle;
  };

  const pickFirstNormalized = (candidates: any[] = []) => {
    for (const candidate of candidates) {
      const normalized = toNormalizedString(candidate);
      if (normalized) {
        return normalized;
      }
    }
    return "";
  };

  const resolvePersonnelNames = (source: any = {}) => {
    const handleFields = [
      "insta",
      "instagram",
      "instagram_username",
      "instagramUsername",
      "tiktok",
      "tiktok_username",
      "tiktokUsername",
    ];
    const genericUsernameFields = [
      "username",
      "user_name",
      "userName",
      "user",
      "email",
      "akun",
      "akun_media_sosial",
      "akunMediaSosial",
    ];
    const nameFields = [
      "nama",
      "name",
      "full_name",
      "fullName",
      "display_name",
      "displayName",
    ];
    const pangkatFields = ["title", "pangkat", "pangkat_title", "pangkatTitle", "golongan"];

    const handleCandidates = collectFieldValues(source, handleFields);
    const sanitizedHandles = handleCandidates
      .map((candidate) => sanitizeHandle(candidate))
      .filter(Boolean);

    const usernameCandidates = collectFieldValues(source, genericUsernameFields);
    const username = sanitizedHandles[0] || pickFirstNormalized(usernameCandidates) || "";

    const nama = pickFirstNormalized(collectFieldValues(source, nameFields));
    const pangkat = pickFirstNormalized(collectFieldValues(source, pangkatFields));

    return { username, nama, pangkat };
  };

  const buildPersonnelKey = (source: any = {}, clientKey: string, fallbackIndex: string | number) => {
    const candidates = [
      source?.person_id,
      source?.personId,
      source?.personID,
      source?.user_id,
      source?.userId,
      source?.userID,
      source?.id,
      source?.nrp,
      source?.nip,
      source?.nik,
      source?.username,
      source?.user_name,
      source?.userName,
      source?.email,
      source?.akun,
      source?.akun_media_sosial,
      source?.akunMediaSosial,
      source?.nama,
      source?.name,
      source?.full_name,
    ];

    for (const candidate of candidates) {
      const normalized = normalizeKeyComponent(candidate);
      if (normalized) {
        return `${clientKey}:${normalized}`;
      }
    }

    return `${clientKey}:person-${fallbackIndex}`;
  };

  const clientsMap = new Map<string, any>();
  const personnelMap = new Map<string, any>();
  const personnelIdentityMap = new Map<string, string>();
  const clientDirectoryPersonnelKeys = new Map<string, Set<string>>();
  let latestActivity: Date | null = null;

  const isPlaceholderPersonnelKey = (key: string) =>
    typeof key === "string" && /:person-(directory|record)-/i.test(key);

  const toIdentityKey = (clientKey: string, value: any) => {
    const normalized = normalizeKeyComponent(value);
    const comparable = toComparableToken(value);

    if (!normalized) {
      return [] as string[];
    }

    const keys = new Set<string>();
    keys.add(`${clientKey}:${normalized}`);

    if (comparable && comparable !== normalized) {
      keys.add(`${clientKey}:${comparable}`);
    }

    return Array.from(keys);
  };

  const syncPersonnelIdentity = (
    record: any,
    clientKey: string,
    extraSources: Array<{ username?: any; nama?: any }> = [],
  ) => {
    if (!record) {
      return;
    }

    const identityKeys = new Set<string>();

    const collect = (source: { username?: any; nama?: any } | null | undefined) => {
      if (!source) {
        return;
      }

      const keys = [
        ...toIdentityKey(clientKey, source.username),
        ...toIdentityKey(clientKey, source.nama),
      ];

      keys.forEach((key) => {
        if (key) {
          identityKeys.add(key);
        }
      });
    };

    collect(record);
    extraSources.forEach((source) => collect(source));

    identityKeys.forEach((identityKey) => {
      personnelIdentityMap.set(identityKey, record.key);
    });
  };

  const shouldReplaceIdentifierValue = (current: any, incoming: any) => {
    const incomingString = toNormalizedString(incoming);
    if (!incomingString) {
      return false;
    }

    const currentString = toNormalizedString(current);
    if (!currentString) {
      return true;
    }

    const currentComparable = toComparableToken(currentString);
    const incomingComparable = toComparableToken(incomingString);

    if (!currentComparable) {
      return true;
    }

    if (currentComparable === incomingComparable) {
      return false;
    }

    const currentIsGeneric = isGenericClientIdentifier(currentString);
    const incomingIsGeneric = isGenericClientIdentifier(incomingString);

    if (currentIsGeneric && !incomingIsGeneric) {
      return true;
    }

    if (currentIsGeneric && incomingIsGeneric) {
      return incomingComparable.length > currentComparable.length;
    }

    return false;
  };

  const ensureClientEntry = (identifiers: any) => {
    if (!clientsMap.has(identifiers.clientKey)) {
      clientsMap.set(identifiers.clientKey, {
        key: identifiers.clientKey,
        clientId: identifiers.clientId,
        clientName: identifiers.clientName,
        divisi: identifiers.divisi,
        satfung: identifiers.satfung,
        totalLikes: 0,
        totalComments: 0,
        personnel: [],
      });
    }

    const clientEntry = clientsMap.get(identifiers.clientKey)!;

    if (shouldReplaceIdentifierValue(clientEntry.clientId, identifiers.clientId)) {
      clientEntry.clientId = identifiers.clientId;
    }

    if (
      shouldReplaceIdentifierValue(clientEntry.clientName, identifiers.clientName)
    ) {
      clientEntry.clientName = identifiers.clientName;
    }

    if (shouldReplaceIdentifierValue(clientEntry.divisi, identifiers.divisi)) {
      clientEntry.divisi = identifiers.divisi;
    }

    if (shouldReplaceIdentifierValue(clientEntry.satfung, identifiers.satfung)) {
      clientEntry.satfung = identifiers.satfung;
    }

    return clientEntry;
  };

  const registerPersonnel = (
    clientEntry: any,
    personnelKey: string,
    defaults: any,
    options: { createIfMissing?: boolean; markActive?: boolean } = {},
  ) => {
    const { createIfMissing = true, markActive = false } = options;
    const identityCandidates = [
      { username: defaults?.username, nama: defaults?.nama },
    ];

    const resolveExistingKey = () => {
      for (const candidate of identityCandidates) {
        if (!candidate) {
          continue;
        }

        const keys = [
          ...toIdentityKey(clientEntry.key, candidate.username),
          ...toIdentityKey(clientEntry.key, candidate.nama),
        ];

        for (const identityKey of keys) {
          if (identityKey && personnelIdentityMap.has(identityKey)) {
            return personnelIdentityMap.get(identityKey)!;
          }
        }
      }

      if (personnelMap.has(personnelKey)) {
        return personnelKey;
      }

      return null;
    };

    const existingKey = resolveExistingKey();
    let targetKey = existingKey || personnelKey;

    if (!personnelMap.has(targetKey)) {
      if (!createIfMissing) {
        return null;
      }

      const record = {
        key: targetKey,
        likes: 0,
        comments: 0,
        active: false,
        ...defaults,
      };
      personnelMap.set(targetKey, record);
      clientEntry.personnel.push(record);
    }

    const record = personnelMap.get(targetKey)!;

    const shouldUpgradeKey =
      targetKey !== personnelKey &&
      !personnelMap.has(personnelKey) &&
      !isPlaceholderPersonnelKey(personnelKey) &&
      isPlaceholderPersonnelKey(record.key);

    if (shouldUpgradeKey) {
      personnelMap.delete(record.key);
      record.key = personnelKey;
      personnelMap.set(personnelKey, record);
      targetKey = personnelKey;
    }

    if (markActive) {
      record.active = true;
    }

    syncPersonnelIdentity(record, clientEntry.key, identityCandidates);

    return record;
  };

  const updateIfEmpty = (target: any, field: string, value: any) => {
    if (value == null) {
      return;
    }

    if (
      target[field] == null ||
      (typeof target[field] === "string" && target[field].trim() === "")
    ) {
      target[field] = value;
    }
  };

  const updateIfPreferredString = (target: any, field: string, value: any) => {
    const incoming = toNormalizedString(value);
    if (!incoming) {
      return;
    }

    const current = toNormalizedString(target?.[field]);
    if (!current || incoming.length > current.length) {
      target[field] = value;
    }
  };

  safeRecords.forEach((record, index) => {
    const identifiers = resolveClientIdentifiers(record);
    const clientEntry = ensureClientEntry(identifiers);
    const likes = toSafeNumber(
      extractWeeklyMetricValue(record, "likes"),
    );
    const comments = toSafeNumber(
      extractWeeklyMetricValue(record, "comments"),
    );
    if (likes <= 0 && comments <= 0) {
      return;
    }
    const { username, nama, pangkat } = resolvePersonnelNames(record);
    const personnelKey = buildPersonnelKey(
      record,
      identifiers.clientKey,
      `record-${index}`,
    );
    const personnelRecord = registerPersonnel(
      clientEntry,
      personnelKey,
      {
        clientId: identifiers.clientId,
        clientName: identifiers.clientName,
        divisi: identifiers.divisi,
        satfung: identifiers.satfung,
        username,
        nama,
        pangkat,
      },
      { markActive: true },
    );

    if (!personnelRecord) {
      return;
    }

    personnelRecord.likes += likes;
    personnelRecord.comments += comments;

    updateIfEmpty(personnelRecord, "clientId", identifiers.clientId);
    updateIfEmpty(personnelRecord, "clientName", identifiers.clientName);
    updateIfEmpty(personnelRecord, "divisi", identifiers.divisi);
    updateIfEmpty(personnelRecord, "satfung", identifiers.satfung);
    updateIfEmpty(personnelRecord, "username", username);
    updateIfEmpty(personnelRecord, "nama", nama);
    updateIfEmpty(personnelRecord, "pangkat", pangkat);

    syncPersonnelIdentity(personnelRecord, clientEntry.key, [
      { username, nama },
    ]);

    clientEntry.totalLikes += likes;
    clientEntry.totalComments += comments;

    const activityDate =
      parseWeeklyDateValue(record?.tanggal ?? record?.date ?? record?.activityDate) ??
      parseWeeklyDateValue(record?.updated_at ?? record?.updatedAt) ??
      parseWeeklyDateValue(record?.created_at ?? record?.createdAt) ??
      null;

    if (activityDate && (!latestActivity || activityDate > latestActivity)) {
      latestActivity = activityDate;
    }
  });

  const directoryUsers = directoryUsersRaw.map((user, index) => ({
    ...user,
    __directoryIndex: index,
  }));

  directoryUsers.forEach((user, index) => {
    if (!user) {
      return;
    }

    const identifiers = resolveClientIdentifiers(user);
    const clientEntry = ensureClientEntry(identifiers);
    const { username, nama, pangkat } = resolvePersonnelNames(user);
    const personnelKey = buildPersonnelKey(user, identifiers.clientKey, `directory-${index}`);
    const directorySet = clientDirectoryPersonnelKeys.get(clientEntry.key) || new Set<string>();
    clientDirectoryPersonnelKeys.set(clientEntry.key, directorySet);

    const personnelRecord = registerPersonnel(
      clientEntry,
      personnelKey,
      {
        clientId: identifiers.clientId,
        clientName: identifiers.clientName,
        divisi: identifiers.divisi,
        satfung: identifiers.satfung,
        username,
        nama,
        pangkat,
      },
      { createIfMissing: false },
    );

    if (personnelRecord) {
      updateIfEmpty(personnelRecord, "clientId", identifiers.clientId);
      updateIfEmpty(personnelRecord, "clientName", identifiers.clientName);
      updateIfEmpty(personnelRecord, "divisi", identifiers.divisi);
      updateIfEmpty(personnelRecord, "satfung", identifiers.satfung);
      updateIfEmpty(personnelRecord, "username", username);
      updateIfPreferredString(personnelRecord, "nama", nama);
      updateIfPreferredString(personnelRecord, "pangkat", pangkat);

      syncPersonnelIdentity(personnelRecord, clientEntry.key, [
        { username, nama },
      ]);

      directorySet.add(personnelRecord.key);
    } else {
      directorySet.add(personnelKey);
    }
  });

  const uniqueDirectoryPersonnelCount = countUniquePersonnelRecords(directoryUsers);

  const clients = Array.from(clientsMap.values()).map((client) => {
    const directorySet = clientDirectoryPersonnelKeys.get(client.key);
    const activePersonnel = client.personnel.filter((person: any) => person.active).length;
    const totalPersonnel = directorySet?.size ?? activePersonnel;
    const inactiveCount = Math.max(totalPersonnel - activePersonnel, 0);

    const complianceRate =
      totalPersonnel > 0 ? (activePersonnel / totalPersonnel) * 100 : 0;
    const averageLikesPerUser =
      totalPersonnel > 0 ? client.totalLikes / totalPersonnel : 0;
    const averageCommentsPerUser =
      totalPersonnel > 0 ? client.totalComments / totalPersonnel : 0;

    return {
      ...client,
      totalPersonnel,
      activePersonnel,
      inactiveCount,
      complianceRate,
      averageLikesPerUser,
      averageCommentsPerUser,
    };
  });

  const totals = clients.reduce(
    (accumulator, client) => {
      accumulator.totalLikes += client.totalLikes;
      accumulator.totalComments += client.totalComments;
      accumulator.totalPersonnel += client.totalPersonnel;
      accumulator.activePersonnel += client.activePersonnel;
      accumulator.inactiveCount += client.inactiveCount;
      return accumulator;
    },
    {
      totalLikes: 0,
      totalComments: 0,
      totalPersonnel: 0,
      activePersonnel: 0,
      inactiveCount: 0,
    },
  );

  const averageComplianceRate =
    clients.length > 0
      ?
          clients.reduce(
            (sum, client) =>
              sum + (Number.isFinite(client.complianceRate) ? client.complianceRate : 0),
            0,
          ) / clients.length
      : 0;

  const topPersonnel = Array.from(personnelMap.values())
    .filter((person: any) => person.username || person.nama)
    .map((person: any) => ({
      ...person,
      interactions: (person.likes ?? 0) + (person.comments ?? 0),
    }))
    .sort((a, b) => {
      if (b.likes !== a.likes) {
        return b.likes - a.likes;
      }
      if (b.comments !== a.comments) {
        return b.comments - a.comments;
      }
      return (b.active ? 1 : 0) - (a.active ? 1 : 0);
    })
    .slice(0, 10);

  const resolvedTotalPersonnel =
    uniqueDirectoryPersonnelCount > 0
      ? uniqueDirectoryPersonnelCount
      : totals.totalPersonnel;

  const resolvedInactiveCount =
    uniqueDirectoryPersonnelCount > 0
      ? Math.max(resolvedTotalPersonnel - totals.activePersonnel, 0)
      : totals.inactiveCount;

  const resolvedComplianceRate =
    resolvedTotalPersonnel > 0
      ? (totals.activePersonnel / resolvedTotalPersonnel) * 100
      : 0;

  return {
    totals: {
      totalClients: clients.length,
      totalLikes: totals.totalLikes,
      totalComments: totals.totalComments,
      totalPersonnel: resolvedTotalPersonnel,
      activePersonnel: totals.activePersonnel,
      inactiveCount: resolvedInactiveCount,
      complianceRate: resolvedComplianceRate,
      averageComplianceRate,
    },
    clients: clients.sort((a, b) => {
      if (b.totalLikes !== a.totalLikes) {
        return b.totalLikes - a.totalLikes;
      }
      return b.activePersonnel - a.activePersonnel;
    }),
    topPersonnel,
    lastUpdated: latestActivity,
  };
};

const ensureRecordsHaveActivityDate = (
  records: any[],
  options: { extraPaths?: string[] } = {},
) => {
  if (!Array.isArray(records)) {
    return [] as any[];
  }

  return records
    .map((record) => {
      if (!record) {
        return null;
      }

      const resolved = resolveWeeklyRecordDate(record, options.extraPaths);
      if (!resolved) {
        return null;
      }

      const isoString = resolved.parsed.toISOString();
      const dateOnly = isoString.slice(0, 10);
      const parsedExistingActivityDate = parseWeeklyDateValue(record?.activityDate);
      const shouldOverwriteActivityDate =
        !(record?.activityDate instanceof Date) &&
        (!record?.activityDate || !parsedExistingActivityDate);

      return {
        ...record,
        activityDate:
          record?.activityDate instanceof Date
            ? record.activityDate
            : shouldOverwriteActivityDate
            ? isoString
            : record.activityDate,
        tanggal: record?.tanggal ?? dateOnly,
      };
    })
    .filter(Boolean) as any[];
};

const parseJsonMaybe = (value: any) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  const firstChar = trimmed[0];
  if (firstChar !== "{" && firstChar !== "[") {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    console.warn("Gagal mengurai JSON pada field aktivitas", error);
    return value;
  }
};

export const prepareWeeklyTrendActivityRecords = (
  records: any,
  options: { extraPaths?: string[] | string; fallbackDate?: any } = {},
) => {
  if (!Array.isArray(records)) {
    return [] as any[];
  }

  const extraPaths = Array.isArray(options.extraPaths)
    ? options.extraPaths
    : typeof options.extraPaths === "string"
    ? [options.extraPaths]
    : [];

  const fallbackCandidate = options.fallbackDate;
  let fallbackDate: Date | null = null;

  if (fallbackCandidate instanceof Date) {
    fallbackDate = Number.isNaN(fallbackCandidate.valueOf())
      ? null
      : fallbackCandidate;
  } else if (fallbackCandidate) {
    fallbackDate = parseWeeklyDateValue(fallbackCandidate);
  }

  const fallbackIso = fallbackDate ? fallbackDate.toISOString() : null;
  const fallbackDateOnly = fallbackIso ? fallbackIso.slice(0, 10) : null;

  const clonedRecords = records.map((record: any) => {
    if (!record || typeof record !== "object") {
      return record;
    }

    const clone: any = { ...record };
    if (typeof clone.rekap === "string") {
      const parsedRekap = parseJsonMaybe(clone.rekap);
      if (parsedRekap && typeof parsedRekap === "object") {
        clone.rekap = parsedRekap;
      }
    }

    if (typeof clone.metrics === "string") {
      const parsedMetrics = parseJsonMaybe(clone.metrics);
      if (parsedMetrics && typeof parsedMetrics === "object") {
        clone.metrics = parsedMetrics;
      }
    }

    const hasResolvableDate = resolveWeeklyRecordDate(clone, extraPaths);

    if (!hasResolvableDate && fallbackIso) {
      clone.activityDate = fallbackIso;
      if (!clone.tanggal) {
        clone.tanggal = fallbackDateOnly;
      }
    }

    return clone;
  });

  return ensureRecordsHaveActivityDate(clonedRecords, { extraPaths });
};
