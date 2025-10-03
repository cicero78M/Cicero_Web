import { parseDateValue, resolveRecordDate } from "./weeklyTrendUtils";

const toSafeNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const createEmptyLikesSummary = () => ({
  totals: {
    totalClients: 0,
    totalLikes: 0,
    totalComments: 0,
    totalPersonnel: 0,
    activePersonnel: 0,
    complianceRate: 0,
    averageComplianceRate: 0,
  },
  clients: [],
  topPersonnel: [],
  lastUpdated: null,
});

const mergeActivityRecords = (likesRecords = [], commentRecords = []) => {
  const records = new Map();
  const aliasToCanonical = new Map();
  let fallbackCounter = 0;

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

  const ensureExistingRecord = (keys, source) => {
    let canonicalKey = null;
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

    const existing = records.get(canonicalKey);
    if (isNew && source && typeof source === "object") {
      Object.assign(existing, source);
    }

    keys.forEach((key) => aliasToCanonical.set(key, canonicalKey));

    return { existing, isNew };
  };

  const assignClientDetails = (target, clientIdValue, clientNameValue) => {
    const updateStringField = (field, value) => {
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
          normalized.toUpperCase() !== "LAINNYA")
      ) {
        target[field] = value;
      }
    };

    if (clientIdValue != null && clientIdValue !== "") {
      updateStringField("client_id", clientIdValue);
      updateStringField("clientId", clientIdValue);
      updateStringField("clientID", clientIdValue);
      updateStringField("id_client", clientIdValue);
      updateStringField("clientid", clientIdValue);
    }

    if (clientNameValue != null && clientNameValue !== "") {
      updateStringField("nama_client", clientNameValue);
      updateStringField("client_name", clientNameValue);
      updateStringField("client", clientNameValue);
      updateStringField("namaClient", clientNameValue);
    }
  };

  const assignIfEmpty = (target, field, value) => {
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

  const setMetricValue = (target, fields, value) => {
    const numeric = toSafeNumber(value);
    fields.forEach((field) => {
      target[field] = numeric;
    });
  };

  const addMetricValue = (target, fields, value) => {
    const numeric = toSafeNumber(value);
    if (!numeric) {
      return;
    }

    fields.forEach((field) => {
      target[field] = toSafeNumber(target[field]) + numeric;
    });
  };

  const extractMetricValue = (record, type) => {
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
        record?.metrics?.likes ??
        record?.metrics?.totalLikes ??
        record?.metrics?.like_count ??
        record?.metrics?.likeCount ??
        record?.metrics?.total_likes ??
        0
      );
    }

    return (
      record?.komentar_personil ??
      record?.komentar_personel ??
      record?.komentar_personnel ??
      record?.comments_personil ??
      record?.comments_personel ??
      record?.comments_personnel ??
      record?.total_comments_personil ??
      record?.total_comments_personel ??
      record?.total_comments_personnel ??
      record?.totalCommentsPersonil ??
      record?.totalCommentsPersonel ??
      record?.totalCommentsPersonnel ??
      record?.rekap?.komentar_personil ??
      record?.rekap?.komentar_personel ??
      record?.rekap?.komentar_personnel ??
      record?.rekap?.comments_personil ??
      record?.rekap?.comments_personel ??
      record?.rekap?.comments_personnel ??
      record?.rekap?.total_comments_personil ??
      record?.rekap?.total_comments_personel ??
      record?.rekap?.total_comments_personnel ??
      record?.rekap?.totalCommentsPersonil ??
      record?.rekap?.totalCommentsPersonel ??
      record?.rekap?.totalCommentsPersonnel ??
      record?.metrics?.komentar_personil ??
      record?.metrics?.komentar_personel ??
      record?.metrics?.komentar_personnel ??
      record?.metrics?.comments_personil ??
      record?.metrics?.comments_personel ??
      record?.metrics?.comments_personnel ??
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
      record?.rekap?.komentar ??
      record?.metrics?.comments ??
      record?.metrics?.comment_count ??
      record?.metrics?.commentCount ??
      record?.metrics?.totalComments ??
      record?.metrics?.total_comments ??
      0
    );
  };

  const ingest = (recordsInput, type) => {
    if (!Array.isArray(recordsInput)) {
      return;
    }

    recordsInput.forEach((item) => {
      if (!item || typeof item !== "object") {
        return;
      }

      const record = { ...item };
      const rawClientId =
        record?.client_id ??
        record?.clientId ??
        record?.clientID ??
        record?.id_client ??
        record?.clientid ??
        record?.client ??
        "";
      const rawClientName =
        record?.nama_client ??
        record?.client_name ??
        record?.client ??
        record?.namaClient ??
        record?.nama ??
        "";
      const normalizedClientId = String(rawClientId ?? "").trim();
      const normalizedClientName =
        String(rawClientName || normalizedClientId || "LAINNYA").trim() ||
        "LAINNYA";

      const clientKeyCandidates = [];
      if (normalizedClientId) {
        clientKeyCandidates.push(normalizedClientId.toUpperCase());
      }
      if (normalizedClientName) {
        clientKeyCandidates.push(normalizedClientName.toUpperCase());
      }
      if (clientKeyCandidates.length === 0) {
        clientKeyCandidates.push("LAINNYA");
      }

      const identityCandidates = [
        record?.username,
        record?.user_name,
        record?.userId,
        record?.user_id,
        record?.personnel_id,
        record?.personnelId,
        record?.nrp,
        record?.nip,
        record?.nama,
        record?.name,
        record?.full_name,
        record?.id,
        record?.record_id,
      ];

      let identity = identityCandidates.find((candidate) => {
        if (typeof candidate === "string") {
          return candidate.trim() !== "";
        }
        if (typeof candidate === "number") {
          return Number.isFinite(candidate);
        }
        return false;
      });

      if (identity == null) {
        identity = `IDX-${fallbackCounter++}`;
      }

      const identityKey = String(identity).trim().toUpperCase();
      const compositeKeys = clientKeyCandidates.map(
        (clientKey) => `${clientKey}::${identityKey}`,
      );

      const { existing, isNew } = ensureExistingRecord(compositeKeys, record);

      assignClientDetails(
        existing,
        normalizedClientId || normalizedClientName,
        normalizedClientName,
      );

      assignIfEmpty(
        existing,
        "username",
        record?.username ?? record?.user_name,
      );
      assignIfEmpty(
        existing,
        "user_name",
        record?.user_name ?? record?.username,
      );
      assignIfEmpty(
        existing,
        "nama",
        record?.nama ?? record?.name ?? record?.full_name,
      );
      assignIfEmpty(existing, "name", record?.name ?? record?.nama);
      assignIfEmpty(
        existing,
        "full_name",
        record?.full_name ?? record?.nama,
      );
      assignIfEmpty(existing, "userId", record?.userId ?? record?.user_id);
      assignIfEmpty(existing, "user_id", record?.user_id ?? record?.userId);
      assignIfEmpty(existing, "nrp", record?.nrp);
      assignIfEmpty(existing, "nip", record?.nip);
      assignIfEmpty(existing, "divisi", record?.divisi);
      assignIfEmpty(existing, "satker", record?.satker);

      assignIfEmpty(existing, "activityDate", record?.activityDate);
      assignIfEmpty(existing, "tanggal", record?.tanggal);
      assignIfEmpty(existing, "date", record?.date);
      assignIfEmpty(existing, "created_at", record?.created_at);
      assignIfEmpty(existing, "createdAt", record?.createdAt);
      assignIfEmpty(existing, "updated_at", record?.updated_at);
      assignIfEmpty(existing, "updatedAt", record?.updatedAt);

      const metricValue = extractMetricValue(record, type);
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

const aggregateLikesRecords = (records = [], options = {}) => {
  const safeRecords = Array.isArray(records)
    ? records.filter((item) => item && typeof item === "object")
    : [];
  const directoryUsersRaw = Array.isArray(options?.directoryUsers)
    ? options.directoryUsers.filter((item) => item && typeof item === "object")
    : [];

  if (safeRecords.length === 0 && directoryUsersRaw.length === 0) {
    return createEmptyLikesSummary();
  }

  const toNormalizedString = (value) => {
    if (value == null) {
      return "";
    }
    const strValue = String(value).trim();
    return strValue;
  };

  const normalizeKeyComponent = (value) => {
    const normalized = toNormalizedString(value);
    return normalized ? normalized.toUpperCase() : "";
  };

  const resolveClientIdentifiers = (source = {}) => {
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
    const clientKey = normalizeKeyComponent(clientId) || "LAINNYA";
    const clientName =
      toNormalizedString(
        source?.nama_client ??
          source?.client_name ??
          source?.client ??
          source?.namaClient ??
          source?.clientName ??
          source?.satker ??
          source?.satuan_kerja ??
          source?.nama_satuan_kerja ??
          clientId,
      ) || "LAINNYA";

    return { clientId, clientKey, clientName };
  };

  const resolvePersonnelNames = (source = {}) => {
    const username =
      toNormalizedString(
        source?.username ??
          source?.user_name ??
          source?.userName ??
          source?.user ??
          source?.email ??
          source?.akun ??
          source?.akun_media_sosial ??
          source?.akunMediaSosial,
      ) || "";
    const nama =
      toNormalizedString(
        source?.nama ??
          source?.name ??
          source?.full_name ??
          source?.fullName ??
          source?.display_name ??
          source?.displayName,
      ) || "";
    return { username, nama };
  };

  const buildPersonnelKey = (source = {}, clientKey, fallbackIndex) => {
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

    return `${clientKey}:AUTO:${fallbackIndex}`;
  };

  const updateIfEmpty = (target, field, value) => {
    const normalized = toNormalizedString(value);
    if (!normalized) {
      return;
    }

    if (!toNormalizedString(target[field]) || target[field] === "LAINNYA") {
      target[field] = normalized;
    }
  };

  const clientsMap = new Map();
  const personnelList = [];
  const personnelMap = new Map();
  let latestActivity = null;

  const ensureClientEntry = ({ clientId, clientKey, clientName }) => {
    if (!clientsMap.has(clientKey)) {
      clientsMap.set(clientKey, {
        key: clientKey,
        clientId: clientId || "LAINNYA",
        clientName: clientName || "LAINNYA",
        totalLikes: 0,
        totalComments: 0,
        personnel: [],
      });
    }

    const clientEntry = clientsMap.get(clientKey);
    updateIfEmpty(clientEntry, "clientId", clientId);
    updateIfEmpty(clientEntry, "clientName", clientName);
    return clientEntry;
  };

  const registerPersonnel = (clientEntry, key, defaults) => {
    if (!personnelMap.has(key)) {
      const record = {
        key,
        clientId: clientEntry.clientId,
        clientName: clientEntry.clientName,
        username: "",
        nama: "",
        likes: 0,
        comments: 0,
        active: false,
        ...defaults,
      };

      clientEntry.personnel.push(record);
      personnelList.push(record);
      personnelMap.set(key, record);
    }

    return personnelMap.get(key);
  };

  directoryUsersRaw.forEach((user, index) => {
    const identifiers = resolveClientIdentifiers(user);
    const clientEntry = ensureClientEntry(identifiers);
    const { username, nama } = resolvePersonnelNames(user);
    const personnelKey = buildPersonnelKey(user, identifiers.clientKey, index);
    const personnelRecord = registerPersonnel(clientEntry, personnelKey, {
      clientId: identifiers.clientId,
      clientName: identifiers.clientName,
      username,
      nama,
    });

    updateIfEmpty(personnelRecord, "clientId", identifiers.clientId);
    updateIfEmpty(personnelRecord, "clientName", identifiers.clientName);
    updateIfEmpty(personnelRecord, "username", username);
    updateIfEmpty(personnelRecord, "nama", nama);
  });

  safeRecords.forEach((record, index) => {
    const identifiers = resolveClientIdentifiers(record);
    const clientEntry = ensureClientEntry(identifiers);
    const likes = toSafeNumber(
      record?.jumlah_like ??
        record?.jumlahLike ??
        record?.total_like ??
        record?.likes ??
        record?.totalLikes,
    );
    const comments = toSafeNumber(
      record?.jumlah_komentar ??
        record?.jumlahKomentar ??
        record?.total_komentar ??
        record?.totalKomentar ??
        record?.total_comments ??
        record?.totalComments ??
        record?.total_comments_personil ??
        record?.total_comments_personel ??
        record?.total_comments_personnel ??
        record?.totalCommentsPersonil ??
        record?.totalCommentsPersonel ??
        record?.totalCommentsPersonnel ??
        record?.comment_count ??
        record?.commentCount ??
        record?.comments ??
        record?.metrics?.comments ??
        record?.metrics?.comment_count ??
        record?.metrics?.commentCount ??
        record?.metrics?.totalComments ??
        record?.metrics?.total_comments,
    );
    const { username, nama } = resolvePersonnelNames(record);
    const personnelKey = buildPersonnelKey(
      record,
      identifiers.clientKey,
      `record-${index}`,
    );
    const personnelRecord = registerPersonnel(clientEntry, personnelKey, {
      clientId: identifiers.clientId,
      clientName: identifiers.clientName,
      username,
      nama,
    });

    personnelRecord.likes += likes;
    personnelRecord.comments += comments;
    if (likes > 0 || comments > 0) {
      personnelRecord.active = true;
    }

    updateIfEmpty(personnelRecord, "clientId", identifiers.clientId);
    updateIfEmpty(personnelRecord, "clientName", identifiers.clientName);
    updateIfEmpty(personnelRecord, "username", username);
    updateIfEmpty(personnelRecord, "nama", nama);

    clientEntry.totalLikes += likes;
    clientEntry.totalComments += comments;

    const activityDate =
      parseDateValue(record?.tanggal ?? record?.date ?? record?.activityDate) ??
      parseDateValue(record?.updated_at ?? record?.updatedAt) ??
      parseDateValue(record?.created_at ?? record?.createdAt) ??
      null;

    if (activityDate && (!latestActivity || activityDate > latestActivity)) {
      latestActivity = activityDate;
    }
  });

  const clients = Array.from(clientsMap.values()).map((client) => {
    const totalPersonnel = client.personnel.length;
    const activePersonnel = client.personnel.filter((person) => person.active).length;

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
      return accumulator;
    },
    {
      totalLikes: 0,
      totalComments: 0,
      totalPersonnel: 0,
      activePersonnel: 0,
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

  const topPersonnel = personnelList
    .filter((person) => person.username || person.nama)
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

  return {
    totals: {
      totalClients: clients.length,
      totalLikes: totals.totalLikes,
      totalComments: totals.totalComments,
      totalPersonnel: totals.totalPersonnel,
      activePersonnel: totals.activePersonnel,
      complianceRate:
        totals.totalPersonnel > 0
          ? (totals.activePersonnel / totals.totalPersonnel) * 100
          : 0,
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

const ensureRecordsHaveActivityDate = (records, options = {}) => {
  if (!Array.isArray(records)) {
    return [];
  }

  return records
    .map((record) => {
      if (!record) {
        return null;
      }

      const resolved = resolveRecordDate(record, options.extraPaths);
      if (!resolved) {
        return null;
      }

      const isoString = resolved.parsed.toISOString();
      const dateOnly = isoString.slice(0, 10);
      const parsedExistingActivityDate = parseDateValue(record?.activityDate);
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
    .filter(Boolean);
};

const parseJsonMaybe = (value) => {
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

const prepareTrendActivityRecords = (records, options = {}) => {
  if (!Array.isArray(records)) {
    return [];
  }

  const extraPaths = Array.isArray(options.extraPaths)
    ? options.extraPaths
    : typeof options.extraPaths === "string"
    ? [options.extraPaths]
    : [];

  const fallbackCandidate = options.fallbackDate;
  let fallbackDate = null;

  if (fallbackCandidate instanceof Date) {
    fallbackDate = Number.isNaN(fallbackCandidate.valueOf())
      ? null
      : fallbackCandidate;
  } else if (fallbackCandidate) {
    fallbackDate = parseDateValue(fallbackCandidate);
  }

  const fallbackIso = fallbackDate ? fallbackDate.toISOString() : null;
  const fallbackDateOnly = fallbackIso ? fallbackIso.slice(0, 10) : null;

  const clonedRecords = records.map((record) => {
    if (!record || typeof record !== "object") {
      return record;
    }

    const clone = { ...record };
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

    const hasResolvableDate = resolveRecordDate(clone, extraPaths);

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

export {
  createEmptyLikesSummary,
  mergeActivityRecords,
  aggregateLikesRecords,
  ensureRecordsHaveActivityDate,
  prepareTrendActivityRecords,
};
