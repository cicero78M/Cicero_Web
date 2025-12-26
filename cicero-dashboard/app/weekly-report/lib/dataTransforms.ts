type WeeklyRecord = Record<string, any>;

function ensureNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeIdentifier(value?: unknown): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[\\s._-]+/g, "")
    .replace(/[.,]/g, "");
}

function resolveClientId(record: WeeklyRecord): string {
  return (
    record.client_id ||
    record.clientId ||
    record.clientID ||
    record.rekap?.client_id ||
    record.rekap?.clientId ||
    record.rekap?.clientID ||
    "LAINNYA"
  );
}

function resolveClientName(record: WeeklyRecord): string {
  return (
    record.nama_client ||
    record.client_name ||
    record.client ||
    record.divisi ||
    record.satfung ||
    record.subsatker ||
    record.rekap?.client_name ||
    record.rekap?.client_name ||
    "Lainnya"
  );
}

function resolvePersonnelIdentity(record: WeeklyRecord): string {
  const identifier =
    normalizeIdentifier(record.user_id) ||
    normalizeIdentifier(record.nrp) ||
    normalizeIdentifier(record.nip) ||
    normalizeIdentifier(record.email) ||
    normalizeIdentifier(record.username) ||
    normalizeIdentifier(record.instagram_username) ||
    normalizeIdentifier(record.nama);
  return identifier || Math.random().toString(36).slice(2);
}

function resolvePersonnelName(record: WeeklyRecord): string {
  return (
    record.nama ||
    record.name ||
    record.full_name ||
    record.fullName ||
    record.user_name ||
    record.username ||
    ""
  );
}

function extractLikes(record: WeeklyRecord): number {
  const rekap = record.rekap || {};
  return ensureNumber(
    record.total_like ??
      record.jumlah_like ??
      record.likes ??
      rekap.total_like ??
      rekap.total_like_personil ??
      rekap.totalLikes ??
      rekap.total_like_personnel,
    0,
  );
}

function extractComments(record: WeeklyRecord): number {
  const rekap = record.rekap || {};
  return ensureNumber(
    record.total_komentar ??
      record.jumlah_komentar ??
      record.comments ??
      rekap.total_komentar ??
      rekap.total_komentar_personil ??
      rekap.total_comments_personil ??
      rekap.totalComments ??
      rekap.total_comments_personnel,
    0,
  );
}

function mergeMetrics(target: WeeklyRecord, source: WeeklyRecord) {
  target.likes = Math.max(ensureNumber(target.likes, 0), extractLikes(source));
  target.comments = Math.max(
    ensureNumber(target.comments, 0),
    extractComments(source),
  );
  target.total_like = target.likes;
  target.total_komentar = target.comments;
  target.jumlah_like = target.likes;
  target.jumlah_komentar = target.comments;
}

export function mergeWeeklyActivityRecords(
  likesRecords: WeeklyRecord[] = [],
  commentRecords: WeeklyRecord[] = [],
): WeeklyRecord[] {
  const merged = new Map<string, WeeklyRecord>();

  const upsert = (record: WeeklyRecord) => {
    const clientId = resolveClientId(record);
    const identity = resolvePersonnelIdentity(record);
    const key = `${clientId}::${identity}`;
    const existing = merged.get(key) || {
      client_id: clientId,
      client_name: resolveClientName(record),
      nama: resolvePersonnelName(record),
      username: record.username || record.instagram_username || record.handle,
      nrp: record.nrp || record.nip || record.user_id,
      satfung: record.satfung || record.divisi || record.subsatker,
      divisi: record.divisi || record.satfung || record.subsatker,
      rekap: record.rekap || {},
      likes: 0,
      comments: 0,
    };

    mergeMetrics(existing, record);
    merged.set(key, existing);
  };

  likesRecords.forEach(upsert);
  commentRecords.forEach(upsert);

  return Array.from(merged.values());
}

export function countUniquePersonnelRecords(records: WeeklyRecord[] = []): number {
  const seen = new Set<string>();
  records.forEach((record) => {
    const key =
      normalizeIdentifier(record.user_id) ||
      normalizeIdentifier(record.email) ||
      normalizeIdentifier(record.nrp) ||
      normalizeIdentifier(record.nip);
    if (key) seen.add(key);
  });
  return seen.size;
}

export function aggregateWeeklyLikesRecords(
  records: WeeklyRecord[] = [],
  options: { directoryUsers?: WeeklyRecord[] } = {},
) {
  const clientMap = new Map<
    string,
    {
      key: string;
      clientId: string;
      clientName: string;
      satfung?: string;
      divisi?: string;
      personnel: WeeklyRecord[];
      totalLikes: number;
      totalComments: number;
      totalPersonnel: number;
      activePersonnel: number;
      personnelWithLikes: number;
    }
  >();

  const addPersonnelToClient = (
    clientKey: string,
    clientId: string,
    clientName: string,
    satfung: string | undefined,
    divisi: string | undefined,
    personnel: WeeklyRecord,
  ) => {
    const entry =
      clientMap.get(clientKey) ||
      {
        key: clientKey,
        clientId,
        clientName,
        satfung,
        divisi,
        personnel: [],
        totalLikes: 0,
        totalComments: 0,
        totalPersonnel: 0,
        activePersonnel: 0,
        personnelWithLikes: 0,
      };
    entry.personnel.push(personnel);
    entry.totalLikes += ensureNumber(personnel.likes, 0);
    entry.totalComments += ensureNumber(personnel.comments, 0);
    entry.totalPersonnel += 1;
    if (personnel.active) entry.activePersonnel += 1;
    if (ensureNumber(personnel.likes, 0) > 0 || ensureNumber(personnel.comments, 0) > 0) {
      entry.personnelWithLikes += 1;
    }
    clientMap.set(clientKey, entry);
  };

  const directoryUsers = options.directoryUsers || [];
  const directoryByClient = new Map<string, WeeklyRecord[]>();
  directoryUsers.forEach((user) => {
    const clientId = resolveClientId(user);
    const name = resolveClientName(user);
    const satfung = user.divisi || user.satfung || user.subsatker;
    const key = `${clientId}::${(satfung || name).toUpperCase()}`;
    if (!directoryByClient.has(key)) directoryByClient.set(key, []);
    directoryByClient.get(key)!.push(user);
  });

  // Prefill directory placeholders
  directoryByClient.forEach((users, key) => {
    const [clientId] = key.split("::");
    const clientName = users[0]?.divisi || users[0]?.satfung || resolveClientName(users[0]);
    users.forEach((user) => {
      const personnel = {
        key: `${key}-${resolvePersonnelIdentity(user)}`,
        nama: resolvePersonnelName(user),
        username: user.username || user.instagram_username,
        likes: 0,
        comments: 0,
        active: false,
      };
      addPersonnelToClient(key, clientId, clientName, user.satfung, user.divisi, personnel);
    });
  });

  const personnelIndex = new Map<string, WeeklyRecord>();

  records.forEach((record) => {
    const clientId = resolveClientId(record);
    const clientName = resolveClientName(record);
    const satfung = record.divisi || record.satfung || record.subsatker;
    const clientKey = `${clientId}::${(satfung || clientName).toUpperCase()}`;
    const identity = resolvePersonnelIdentity(record);
    const personnelKey = `${clientKey}::${identity}`;

    const likes = extractLikes(record);
    const comments = extractComments(record);

    const existing = personnelIndex.get(personnelKey);
    const mergedLikes = existing ? Math.max(existing.likes || 0, likes) : likes;
    const mergedComments = existing ? Math.max(existing.comments || 0, comments) : comments;

    const personnel = {
      key: personnelKey,
      nama: resolvePersonnelName(record),
      username: record.username || record.instagram_username || record.handle,
      likes: mergedLikes,
      comments: mergedComments,
      interactions: mergedLikes + mergedComments,
      active: mergedLikes > 0 || mergedComments > 0,
    };

    personnelIndex.set(personnelKey, personnel);
    addPersonnelToClient(clientKey, clientId, clientName, satfung, record.divisi, personnel);
  });

  const clients = Array.from(clientMap.values());
  const totals = clients.reduce(
    (acc, client) => {
      acc.totalLikes += client.totalLikes;
      acc.totalComments += client.totalComments;
      acc.totalPersonnel += client.totalPersonnel;
      acc.activePersonnel += client.activePersonnel;
      acc.personnelWithLikes += client.personnelWithLikes;
      acc.totalClients += 1;
      return acc;
    },
    {
      totalLikes: 0,
      totalComments: 0,
      totalPersonnel: 0,
      activePersonnel: 0,
      personnelWithLikes: 0,
      inactiveCount: 0,
      totalClients: 0,
    },
  );

  totals.inactiveCount = totals.totalPersonnel - totals.activePersonnel;

  return { clients, totals, topPersonnel: clients.flatMap((c) => c.personnel) };
}

