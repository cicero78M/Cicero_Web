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

  const clientAliasMap = new Map();

  const resolveClientIdentifiers = (source = {}) => {
    const clientIdCandidates = [
      source?.client_id,
      source?.clientId,
      source?.clientID,
      source?.client,
      source?.id_client,
      source?.clientid,
      source?.idClient,
    ];

    const nameCandidates = [
      source?.nama_client,
      source?.client_name,
      source?.client,
      source?.namaClient,
      source?.clientName,
      source?.divisi,
      source?.satker,
      source?.satuan_kerja,
      source?.nama_satuan_kerja,
    ];

    const normalizedIds = clientIdCandidates
      .map((candidate) => normalizeKeyComponent(candidate))
      .filter(Boolean);
    const normalizedNames = nameCandidates
      .map((candidate) => normalizeKeyComponent(candidate))
      .filter(Boolean);

    const aliasKeys = Array.from(
      new Set([...normalizedIds, ...normalizedNames].filter(Boolean)),
    );

    let canonicalFromAlias = null;
    for (const alias of aliasKeys) {
      const mapped = clientAliasMap.get(alias);
      if (mapped) {
        canonicalFromAlias = mapped;
        break;
      }
    }

    const preferredNameKey = normalizedNames[0] || "";
    const fallbackAlias = aliasKeys[0] || "";

    let clientKey =
      preferredNameKey || canonicalFromAlias || fallbackAlias || "LAINNYA";

    if (!clientKey) {
      clientKey = "LAINNYA";
    }

    const legacyKeys = [];
    if (canonicalFromAlias && canonicalFromAlias !== clientKey) {
      legacyKeys.push(canonicalFromAlias);
    }

    const allAliases = new Set([clientKey, ...aliasKeys, ...legacyKeys]);
    allAliases.forEach((alias) => {
      if (!alias) {
        return;
      }
      clientAliasMap.set(alias, clientKey);
    });

    const resolvedClientId =
      toNormalizedString(
        clientIdCandidates.find((candidate) => toNormalizedString(candidate)),
      ) || "LAINNYA";

    const resolvedClientName =
      toNormalizedString(
        nameCandidates.find((candidate) => toNormalizedString(candidate)),
      ) || resolvedClientId || "LAINNYA";

    const divisi = toNormalizedString(source?.divisi) || "";

    return {
      clientId: resolvedClientId,
      clientKey,
      clientName: resolvedClientName,
      divisi,
      legacyKeys,
    };
  };

  const isTraversable = (value) => {
    if (!value || typeof value !== "object") {
      return false;
    }
    if (Array.isArray(value)) {
      return true;
    }
    const tag = Object.prototype.toString.call(value);
    return tag === "[object Object]";
  };

  const collectFieldValues = (root, fieldNames = []) => {
    if (!isTraversable(root)) {
      return [];
    }

    const queue = [root];
    const seen = new Set();
    const values = [];

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

  const sanitizeHandle = (value) => {
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

  const pickFirstNormalized = (candidates = []) => {
    for (const candidate of candidates) {
      const normalized = toNormalizedString(candidate);
      if (normalized) {
        return normalized;
      }
    }
    return "";
  };

  const resolvePersonnelNames = (source = {}) => {
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

  const buildPersonnelKey = (source = {}, clientKey, fallbackIndex) => {
    const { username: resolvedUsername, nama: resolvedNama } =
      resolvePersonnelNames(source);

    const candidates = [
      resolvedUsername,
      resolvedNama,
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
  const clientDirectoryPersonnelKeys = new Map();
  let latestActivity = null;

  const ensureClientEntry = ({
    clientId,
    clientKey,
    clientName,
    divisi,
    legacyKeys = [],
  }) => {
    if (!clientsMap.has(clientKey)) {
      clientsMap.set(clientKey, {
        key: clientKey,
        clientId: clientId || "LAINNYA",
        clientName: clientName || "LAINNYA",
        divisi: divisi || "",
        totalLikes: 0,
        totalComments: 0,
        personnel: [],
      });
    }

    const clientEntry = clientsMap.get(clientKey);
    if (!clientDirectoryPersonnelKeys.has(clientKey)) {
      clientDirectoryPersonnelKeys.set(clientKey, new Set());
    }
    updateIfEmpty(clientEntry, "clientId", clientId);
    updateIfEmpty(clientEntry, "clientName", clientName);
    updateIfEmpty(clientEntry, "divisi", divisi);

    if (Array.isArray(legacyKeys)) {
      legacyKeys.forEach((legacyKey) => {
        if (!legacyKey || legacyKey === clientKey) {
          return;
        }

        const legacyEntry = clientsMap.get(legacyKey);
        if (!legacyEntry) {
          return;
        }

        clientsMap.delete(legacyKey);

        updateIfEmpty(clientEntry, "clientId", legacyEntry.clientId);
        updateIfEmpty(clientEntry, "clientName", legacyEntry.clientName);
        updateIfEmpty(clientEntry, "divisi", legacyEntry.divisi);

        clientEntry.totalLikes += legacyEntry.totalLikes;
        clientEntry.totalComments += legacyEntry.totalComments;

        const targetDirectorySet = clientDirectoryPersonnelKeys.get(clientKey);
        const legacyDirectorySet = clientDirectoryPersonnelKeys.get(legacyKey);

        legacyEntry.personnel.forEach((person) => {
          const previousKey = person.key;
          if (previousKey) {
            personnelMap.delete(previousKey);
          }

          const prefix = `${legacyKey}`;
          const fallbackAlias =
            normalizeKeyComponent(person.username) ||
            normalizeKeyComponent(person.nama) ||
            `AUTO:${personnelList.length}`;
          const suffix = previousKey?.startsWith(prefix)
            ? previousKey.slice(prefix.length)
            : `:${fallbackAlias}`;
          const normalizedSuffix = suffix.startsWith(":") ? suffix : `:${suffix}`;
          const nextKey = `${clientKey}${normalizedSuffix}`;

          const mergedRecord = registerPersonnel(clientEntry, nextKey, {
            clientId: person.clientId,
            clientName: person.clientName,
            divisi: person.divisi,
            username: person.username,
            nama: person.nama,
            pangkat: person.pangkat,
          });

          mergedRecord.likes += person.likes;
          mergedRecord.comments += person.comments;
          mergedRecord.active = mergedRecord.active || person.active;

          updateIfEmpty(mergedRecord, "clientId", person.clientId);
          updateIfEmpty(mergedRecord, "clientName", person.clientName);
          updateIfEmpty(mergedRecord, "divisi", person.divisi);
          updateIfEmpty(mergedRecord, "username", person.username);
          updateIfEmpty(mergedRecord, "nama", person.nama);
          updateIfEmpty(mergedRecord, "pangkat", person.pangkat);

          if (targetDirectorySet) {
            targetDirectorySet.add(nextKey);
          }

          const index = personnelList.indexOf(person);
          if (index >= 0) {
            personnelList.splice(index, 1);
          }
        });

        if (legacyDirectorySet) {
          clientDirectoryPersonnelKeys.delete(legacyKey);
        }
      });
    }

    return clientEntry;
  };

  const registerPersonnel = (clientEntry, key, defaults) => {
    if (!personnelMap.has(key)) {
      const record = {
        key,
        clientId: clientEntry.clientId,
        clientName: clientEntry.clientName,
        divisi: clientEntry.divisi || "",
        username: "",
        nama: "",
        pangkat: "",
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
    const { username, nama, pangkat } = resolvePersonnelNames(user);
    const personnelKey = buildPersonnelKey(user, identifiers.clientKey, index);
    const personnelRecord = registerPersonnel(clientEntry, personnelKey, {
      clientId: identifiers.clientId,
      clientName: identifiers.clientName,
      divisi: identifiers.divisi,
      username,
      nama,
      pangkat,
    });

    updateIfEmpty(personnelRecord, "clientId", identifiers.clientId);
    updateIfEmpty(personnelRecord, "clientName", identifiers.clientName);
    updateIfEmpty(personnelRecord, "divisi", identifiers.divisi);
    updateIfEmpty(personnelRecord, "username", username);
    updateIfEmpty(personnelRecord, "nama", nama);
    updateIfEmpty(personnelRecord, "pangkat", pangkat);

    const directorySet = clientDirectoryPersonnelKeys.get(clientEntry.key);
    if (directorySet && personnelRecord?.key) {
      directorySet.add(personnelRecord.key);
    }
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
    const { username, nama, pangkat } = resolvePersonnelNames(record);
    const personnelKey = buildPersonnelKey(
      record,
      identifiers.clientKey,
      `record-${index}`,
    );
    const personnelRecord = registerPersonnel(clientEntry, personnelKey, {
      clientId: identifiers.clientId,
      clientName: identifiers.clientName,
      divisi: identifiers.divisi,
      username,
      nama,
      pangkat,
    });

    personnelRecord.likes += likes;
    personnelRecord.comments += comments;
    if (likes > 0 || comments > 0) {
      personnelRecord.active = true;
    }

    updateIfEmpty(personnelRecord, "clientId", identifiers.clientId);
    updateIfEmpty(personnelRecord, "clientName", identifiers.clientName);
    updateIfEmpty(personnelRecord, "divisi", identifiers.divisi);
    updateIfEmpty(personnelRecord, "username", username);
    updateIfEmpty(personnelRecord, "nama", nama);
    updateIfEmpty(personnelRecord, "pangkat", pangkat);

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
    const directorySet = clientDirectoryPersonnelKeys.get(client.key);
    const directoryKeys = Array.isArray(directorySet)
      ? directorySet
      : directorySet instanceof Set
      ? Array.from(directorySet)
      : [];

    const allPersonnelKeys = client.personnel
      .map((person) => person?.key)
      .filter((key) => typeof key === "string" && key.length > 0);
    const uniquePersonnelKeys = new Set(allPersonnelKeys);
    const fallbackPrefix = `${client.key}:AUTO:`;
    const nonFallbackPersonnelKeys = new Set(
      Array.from(uniquePersonnelKeys).filter(
        (key) => !key.startsWith(fallbackPrefix),
      ),
    );

    const hasDirectoryData = directoryKeys.length > 0;
    const shouldUseFallbackKeys =
      !hasDirectoryData && nonFallbackPersonnelKeys.size === 0;

    const effectivePersonnelKeySet = hasDirectoryData
      ? new Set(directoryKeys)
      : shouldUseFallbackKeys
      ? uniquePersonnelKeys
      : nonFallbackPersonnelKeys;

    const totalPersonnel = effectivePersonnelKeySet.size;
    let activePersonnel = 0;

    if (hasDirectoryData) {
      directoryKeys.forEach((personnelKey) => {
        if (!personnelKey) {
          return;
        }

        const record = personnelMap.get(personnelKey);
        if (record?.active) {
          activePersonnel += 1;
        }
      });
    } else {
      const activePersonnelKeys = new Set(
        client.personnel
          .filter((person) => person.active && person?.key)
          .map((person) => person.key),
      );
      const effectiveActiveKeys = shouldUseFallbackKeys
        ? activePersonnelKeys
        : new Set(
            Array.from(activePersonnelKeys).filter(
              (key) => !key.startsWith(fallbackPrefix),
            ),
          );
      activePersonnel = effectiveActiveKeys.size;
    }

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
