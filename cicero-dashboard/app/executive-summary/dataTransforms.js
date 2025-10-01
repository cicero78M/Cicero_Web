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

const aggregateLikesRecords = (records = []) => {
  const safeRecords = Array.isArray(records)
    ? records.filter((item) => item && typeof item === "object")
    : [];

  if (safeRecords.length === 0) {
    return createEmptyLikesSummary();
  }

  const clientsMap = new Map();
  const personnelList = [];
  let latestActivity = null;

  safeRecords.forEach((record, index) => {
    const rawClientId =
      record?.client_id ??
      record?.clientId ??
      record?.clientID ??
      record?.client ??
      record?.id_client ??
      record?.clientid ??
      "LAINNYA";
    const clientId = String(rawClientId || "LAINNYA").trim();
    const clientKey = clientId ? clientId.toUpperCase() : "LAINNYA";
    const clientName =
      String(
        record?.nama_client ??
          record?.client_name ??
          record?.client ??
          record?.namaClient ??
          record?.nama ??
          (clientId || "LAINNYA"),
      ).trim() || "LAINNYA";

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
        record?.comments ??
        record?.totalComments,
    );
    const username = String(record?.username ?? record?.user_name ?? "").trim();
    const nama = String(record?.nama ?? record?.name ?? record?.full_name ?? "").trim();
    const isActive = likes > 0 || comments > 0;

    if (!clientsMap.has(clientKey)) {
      clientsMap.set(clientKey, {
        key: clientKey,
        clientId,
        clientName,
        totalLikes: 0,
        totalComments: 0,
        totalPersonnel: 0,
        activePersonnel: 0,
        personnel: [],
      });
    }

    const clientEntry = clientsMap.get(clientKey);
    clientEntry.totalLikes += likes;
    clientEntry.totalComments += comments;
    clientEntry.totalPersonnel += 1;
    if (isActive) {
      clientEntry.activePersonnel += 1;
    }

    const personnelKey = `${clientKey}:${username || nama || index}`;
    const personnelRecord = {
      key: personnelKey,
      clientId,
      clientName,
      username,
      nama,
      likes,
      comments,
      active: isActive,
    };

    clientEntry.personnel.push(personnelRecord);
    personnelList.push(personnelRecord);

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
    const complianceRate =
      client.totalPersonnel > 0
        ? (client.activePersonnel / client.totalPersonnel) * 100
        : 0;
    const averageLikesPerUser =
      client.totalPersonnel > 0 ? client.totalLikes / client.totalPersonnel : 0;
    const averageCommentsPerUser =
      client.totalPersonnel > 0 ? client.totalComments / client.totalPersonnel : 0;

    return {
      ...client,
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
  aggregateLikesRecords,
  ensureRecordsHaveActivityDate,
  prepareTrendActivityRecords,
};
