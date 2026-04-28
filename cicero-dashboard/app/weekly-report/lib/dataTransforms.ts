type WeeklyRecord = Record<string, any>;

function ensureNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeIdentifier(value?: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, "")
    .replace(/[.,]/g, "");
}

function pickFirstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function resolveClientId(record: WeeklyRecord): string {
  return (
    pickFirstString(
      record.client_id,
      record.clientId,
      record.clientID,
      record.id_client,
      record.idClient,
      record.rekap?.client_id,
      record.rekap?.clientId,
      record.rekap?.clientID,
    ) || "LAINNYA"
  );
}

function resolveSatfung(record: WeeklyRecord): string {
  const satfung = pickFirstString(record.satfung, record.subsatker, record.sub_satker);
  const divisi = pickFirstString(record.divisi, record.division);
  if (satfung) return satfung;
  if (divisi) return divisi;
  return "";
}

function resolveClientName(record: WeeklyRecord): string {
  const clientObjectName =
    record.client && typeof record.client === "object"
      ? pickFirstString(record.client.name, record.client.client_name)
      : "";

  const satfung = resolveSatfung(record);
  return (
    pickFirstString(
      record.nama_client,
      record.client_name,
      record.clientName,
      clientObjectName,
      satfung,
      record.rekap?.client_name,
      record.rekap?.clientName,
    ) || "Lainnya"
  );
}

function resolvePersonnelIdentity(record: WeeklyRecord): string {
  const explicitIdentity =
    normalizeIdentifier(record.user_id) ||
    normalizeIdentifier(record.nrp) ||
    normalizeIdentifier(record.nip) ||
    normalizeIdentifier(record.email) ||
    normalizeIdentifier(record.nama) ||
    normalizeIdentifier(record.name) ||
    normalizeIdentifier(record.full_name) ||
    normalizeIdentifier(record.fullName) ||
    normalizeIdentifier(record.username) ||
    normalizeIdentifier(record.instagram_username);

  if (explicitIdentity) return explicitIdentity;

  const fallbackIdentity =
    normalizeIdentifier(record.rekap?.client_name) ||
    normalizeIdentifier(record.client_name) ||
    normalizeIdentifier(record.divisi) ||
    normalizeIdentifier(record.satfung) ||
    normalizeIdentifier(record.subsatker) ||
    "unknown";

  return fallbackIdentity;
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
  target.comments = Math.max(ensureNumber(target.comments, 0), extractComments(source));
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
      satfung: resolveSatfung(record),
      divisi: record.divisi || record.satfung || record.subsatker,
      subsatker: record.subsatker || record.sub_satker,
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

type ClientEntry = {
  key: string;
  clientId: string;
  clientName: string;
  satfung?: string;
  subsatker?: string;
  divisi?: string;
  personnel: WeeklyRecord[];
  personnelMap: Map<string, WeeklyRecord>;
  totalLikes: number;
  totalComments: number;
  totalPersonnel: number;
  activePersonnel: number;
  personnelWithLikes: number;
};

export function aggregateWeeklyLikesRecords(
  records: WeeklyRecord[] = [],
  options: { directoryUsers?: WeeklyRecord[] } = {},
) {
  const clientMap = new Map<string, ClientEntry>();

  const ensureClientEntry = (
    clientKey: string,
    payload: { clientId: string; clientName: string; satfung?: string; subsatker?: string; divisi?: string },
  ) => {
    let entry = clientMap.get(clientKey);
    if (!entry) {
      entry = {
        key: clientKey,
        clientId: payload.clientId,
        clientName: payload.clientName,
        satfung: payload.satfung,
        subsatker: payload.subsatker,
        divisi: payload.divisi,
        personnel: [],
        personnelMap: new Map(),
        totalLikes: 0,
        totalComments: 0,
        totalPersonnel: 0,
        activePersonnel: 0,
        personnelWithLikes: 0,
      };
      clientMap.set(clientKey, entry);
    }
    return entry;
  };

  const upsertPersonnel = (
    clientEntry: ClientEntry,
    personKey: string,
    payload: {
      nama: string;
      username?: string;
      likes: number;
      comments: number;
      clientName: string;
      satfung?: string;
      subsatker?: string;
    },
  ) => {
    const fallbackIdentity = normalizeIdentifier(payload.nama) || normalizeIdentifier(payload.username);

    const existing =
      clientEntry.personnelMap.get(personKey) ||
      Array.from(clientEntry.personnelMap.values()).find((person) => {
        if (!fallbackIdentity) return false;
        const candidates = [
          normalizeIdentifier(person.identity),
          normalizeIdentifier(person.nama),
          normalizeIdentifier(person.username),
        ].filter(Boolean);
        return candidates.includes(fallbackIdentity);
      });

    if (existing) {
      existing.likes = ensureNumber(existing.likes, 0) + payload.likes;
      existing.comments = ensureNumber(existing.comments, 0) + payload.comments;
      existing.interactions = ensureNumber(existing.likes, 0) + ensureNumber(existing.comments, 0);
      existing.active = existing.interactions > 0;
      if (!existing.nama && payload.nama) existing.nama = payload.nama;
      if (!existing.username && payload.username) existing.username = payload.username;
      if (!existing.clientName && payload.clientName) existing.clientName = payload.clientName;
      if (!existing.satfung && payload.satfung) existing.satfung = payload.satfung;
      if (!existing.subsatker && payload.subsatker) existing.subsatker = payload.subsatker;
      if (!existing.identity) {
        existing.identity = fallbackIdentity || String(personKey).split("::").pop();
      }
      return existing;
    }

    const person = {
      key: personKey,
      identity: String(personKey).split("::").pop(),
      nama: payload.nama,
      username: payload.username,
      likes: payload.likes,
      comments: payload.comments,
      interactions: payload.likes + payload.comments,
      active: payload.likes + payload.comments > 0,
      clientName: payload.clientName,
      satfung: payload.satfung,
      subsatker: payload.subsatker,
    };
    clientEntry.personnelMap.set(personKey, person);
    return person;
  };

  const activityClientIds = new Set(records.map((record) => resolveClientId(record)));
  const shouldFilterDirectoryByActivity = activityClientIds.size > 0;

  const directoryUsers = options.directoryUsers || [];
  directoryUsers.forEach((user) => {
    const clientId = resolveClientId(user);
    if (shouldFilterDirectoryByActivity && !activityClientIds.has(clientId)) return;

    const clientName = resolveClientName(user);
    const satfung = resolveSatfung(user);
    const divisi = pickFirstString(user.divisi, user.division);
    const subsatker = pickFirstString(user.subsatker, user.sub_satker);
    const keyLabel = String(satfung || clientName || clientId)
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
    const clientKey = `${clientId}::${keyLabel}`;
    const identity = resolvePersonnelIdentity(user);
    const personKey = `${clientKey}::${identity}`;
    const entry = ensureClientEntry(clientKey, {
      clientId,
      clientName: satfung || clientName,
      satfung: satfung || undefined,
      subsatker: subsatker || undefined,
      divisi: divisi || undefined,
    });
    upsertPersonnel(entry, personKey, {
      nama: resolvePersonnelName(user) || user.username || "",
      username: user.username || user.instagram_username,
      likes: 0,
      comments: 0,
      clientName: satfung || clientName,
      satfung: satfung || undefined,
      subsatker: subsatker || undefined,
    });
  });

  records.forEach((record) => {
    const clientId = resolveClientId(record);
    const satfung = resolveSatfung(record);
    const divisi = pickFirstString(record.divisi, record.division);
    const subsatker = pickFirstString(record.subsatker, record.sub_satker);
    const clientName = satfung || resolveClientName(record);
    const keyLabel = String(clientName || clientId)
      .trim()
      .replace(/\s+/g, " ")
      .toUpperCase();
    const clientKey = `${clientId}::${keyLabel}`;
    const identity = resolvePersonnelIdentity(record);
    const personKey = `${clientKey}::${identity}`;

    const likes = extractLikes(record);
    const comments = extractComments(record);

    const entry = ensureClientEntry(clientKey, {
      clientId,
      clientName,
      satfung: satfung || undefined,
      subsatker: subsatker || undefined,
      divisi: divisi || undefined,
    });

    upsertPersonnel(entry, personKey, {
      nama: resolvePersonnelName(record),
      username: record.username || record.instagram_username || record.handle,
      likes,
      comments,
      clientName,
      satfung: satfung || undefined,
      subsatker: subsatker || undefined,
    });
  });

  const clients = Array.from(clientMap.values()).map((entry) => {
    const personnel = Array.from(entry.personnelMap.values());
    const totalLikes = personnel.reduce((acc, person) => acc + ensureNumber(person.likes, 0), 0);
    const totalComments = personnel.reduce((acc, person) => acc + ensureNumber(person.comments, 0), 0);
    const activePersonnel = personnel.filter((person) => ensureNumber(person.interactions, 0) > 0).length;
    const totalPersonnel = personnel.length;

    return {
      key: entry.key,
      clientId: entry.clientId,
      clientName: entry.clientName,
      satfung: entry.satfung,
      subsatker: entry.subsatker,
      divisi: entry.divisi,
      personnel,
      totalLikes,
      totalComments,
      totalPersonnel,
      activePersonnel,
      personnelWithLikes: activePersonnel,
    };
  });

  const topPersonnel = clients.flatMap((client) =>
    client.personnel.map((person) => ({
      ...person,
      clientId: client.clientId,
      clientName: person.clientName || client.clientName,
      satfung: person.satfung || client.satfung,
      subsatker: person.subsatker || client.subsatker,
      divisi: client.divisi,
    })),
  );

  const uniqueAll = new Set<string>();
  const uniqueActive = new Set<string>();

  topPersonnel.forEach((person) => {
    const item = person as any;
    const key =
      normalizeIdentifier(item.identity) ||
      normalizeIdentifier(String(item.key || "").split("::").pop()) ||
      normalizeIdentifier(item.nama) ||
      normalizeIdentifier(item.username);
    if (!key) return;
    uniqueAll.add(key);
    if (ensureNumber(item.interactions, 0) > 0) uniqueActive.add(key);
  });

  const totals = {
    totalLikes: clients.reduce((acc, client) => acc + client.totalLikes, 0),
    totalComments: clients.reduce((acc, client) => acc + client.totalComments, 0),
    totalPersonnel: uniqueAll.size,
    activePersonnel: uniqueActive.size,
    personnelWithLikes: uniqueActive.size,
    inactiveCount: Math.max(0, uniqueAll.size - uniqueActive.size),
    totalClients: clients.length,
  };

  return { clients, totals, topPersonnel };
}
