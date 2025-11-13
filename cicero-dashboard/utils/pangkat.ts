import { getPersonnelPriorityIndex } from "./personnelPriority";

const EXTRA_RANKS = [
  "BHARAKA",
  "BHARATU",
  "BHARADA",
  "PEMBINA UTAMA",
  "PEMBINA UTAMA MADYA",
  "PEMBINA UTAMA MUDA",
  "PEMBINA TINGKAT I",
  "PEMBINA",
  "PENATA TINGKAT I",
  "PENATA",
  "PENATA MUDA TINGKAT I",
  "PENATA MUDA",
  "PENGATUR TINGKAT I",
  "PENGATUR",
  "PENGATUR MUDA TINGKAT I",
  "PENGATUR MUDA",
  "JURU TINGKAT I",
  "JURU",
  "JURU MUDA TINGKAT I",
  "JURU MUDA",
];

const CUSTOM_NAME_PRIORITY_LIST = [
  "KOMISARIS BESAR POLISI LAFRI PRASETYONO, S.I.K., M.H",
  "AKBP ARY MURTINI, S.I.K., M.SI.",
  "AKBP ARIEF RADINATA",
  "AKBP HENDY KURNIAWAN, S.SOS",
  "AKBP I KETUT MADIA, S.SOS.",
  "AKBP MOCHAMAD FADIL, S.T.",
  "AKBP SASWITO, S.E., M.M",
  "AKBP SOEGIJOTO, S.SI.",
  "AKBP SUTIONO S.PD",
  "KOMPOL ADY NUGROHO, S.H., S.I.K., M.SI",
  "KOMPOL KASIANI, S.E., M.M.",
  "KOMPOL SITI MUK'ANIPAH, S.H.",
  "KOMPOL BAGUS KURNIAWAN, S.H., M.H.",
] as const;

export const PANGKAT_ORDER = [
  "KOMISARIS BESAR POLISI",
  "AKBP",
  "KOMPOL",
  "AKP",
  "IPTU",
  "IPDA",
  "AIPTU",
  "AIPDA",
  "BRIPKA",
  "BRIGPOL",
  "BRIGADIR POLISI",
  "BRIGADIR",
  "BRIPTU",
  "BRIPDA",
  ...EXTRA_RANKS,
  "LAINNYA",
];

const USER_PANGKAT_FIELDS = [
  "title",
  "pangkat",
  "rank",
  "pangkat_title",
  "pangkatTitle",
  "golongan",
];

const USER_JABATAN_FIELDS = [
  "jabatan",
  "jabatan_struktural",
  "jabatanStruktural",
  "jabatan_fungsional",
  "jabatanFungsional",
  "position",
  "posisi",
  "role",
  "roleName",
];

const USER_IDENTIFIER_FIELDS = [
  "nrp",
  "nip",
  "nrp_nip",
  "nrpNip",
  "NRP",
  "NIP",
  "NRP_NIP",
];

const USER_NAME_FIELDS = [
  "nama",
  "name",
  "full_name",
  "fullName",
  "nama_lengkap",
  "namaLengkap",
];

function normalizeString(value?: unknown): string {
  return String(value || "").trim().toUpperCase();
}

function normalizeNameForPriority(value?: unknown): string {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\s+,/g, ",")
    .replace(/,\s+/g, ", ")
    .toUpperCase();
}

const CUSTOM_NAME_PRIORITY = CUSTOM_NAME_PRIORITY_LIST.reduce(
  (map, name, index) => {
    map.set(normalizeNameForPriority(name), index);
    return map;
  },
  new Map<string, number>(),
);

export function getPangkatRank(title?: string): number {
  const normalized = normalizeString(title);
  if (!normalized) {
    return PANGKAT_ORDER.length;
  }

  const index = PANGKAT_ORDER.findIndex((pangkat) =>
    normalized.includes(pangkat),
  );

  return index === -1 ? PANGKAT_ORDER.length : index;
}

export function getUserPangkatRank(user: any): number {
  const candidates = USER_PANGKAT_FIELDS.map((field) => user?.[field]);
  const uniqueValues = Array.from(new Set(candidates.filter(Boolean)));

  let bestRank = PANGKAT_ORDER.length;
  for (const value of uniqueValues) {
    const rank = getPangkatRank(String(value));
    if (rank < bestRank) {
      bestRank = rank;
    }
  }

  return bestRank;
}

export function getUserJabatanPriority(user: any): number {
  const values = USER_JABATAN_FIELDS.map((field) => user?.[field]);
  for (const value of values) {
    const jabatan = normalizeString(value);
    if (!jabatan) continue;

    if (jabatan.includes("WAKIL DIREKTUR") || jabatan.includes("WADIR")) {
      return 1;
    }
    if (
      jabatan.includes("DIREKTUR") ||
      /\bDIR\b/.test(jabatan.replace(/[^A-Z\s]/g, " "))
    ) {
      return 0;
    }
  }

  return 2;
}

function compareByName(a: any, b: any): number {
  const nameA = String(a?.nama || a?.name || "");
  const nameB = String(b?.nama || b?.name || "");
  const diff = nameA.localeCompare(nameB, "id", { sensitivity: "base" });
  if (diff !== 0) return diff;
  return 0;
}

function getUserDeterministicIdentifier(user: any): string {
  for (const field of USER_IDENTIFIER_FIELDS) {
    const rawValue = user?.[field];
    const value = String(rawValue ?? "").trim();
    if (value) {
      return value;
    }
  }

  return "";
}

function getCustomNamePriority(user: any): number {
  for (const field of USER_NAME_FIELDS) {
    const priority = CUSTOM_NAME_PRIORITY.get(
      normalizeNameForPriority(user?.[field]),
    );
    if (priority !== undefined) {
      return priority;
    }
  }

  const fallback = CUSTOM_NAME_PRIORITY.get(
    normalizeNameForPriority(user?.nama || user?.name),
  );
  if (fallback !== undefined) {
    return fallback;
  }

  return Number.POSITIVE_INFINITY;
}

export function compareUsersByPangkatOnly(a: any, b: any): number {
  const customPriorityA = getCustomNamePriority(a);
  const customPriorityB = getCustomNamePriority(b);
  if (customPriorityA !== customPriorityB) {
    return customPriorityA < customPriorityB ? -1 : 1;
  }

  const priorityDiff =
    getPersonnelPriorityIndex(a) - getPersonnelPriorityIndex(b);
  if (priorityDiff !== 0) return priorityDiff;

  const pangkatDiff = getUserPangkatRank(a) - getUserPangkatRank(b);
  if (pangkatDiff !== 0) return pangkatDiff;

  const idA = getUserDeterministicIdentifier(a);
  const idB = getUserDeterministicIdentifier(b);

  if (idA && idB) {
    const idDiff = idA.localeCompare(idB, "id", { sensitivity: "base" });
    if (idDiff !== 0) return idDiff;
  } else if (idA || idB) {
    return idA ? -1 : 1;
  }

  return compareByName(a, b);
}

export function compareUsersByPangkatAndNrp(a: any, b: any): number {
  const customPriorityA = getCustomNamePriority(a);
  const customPriorityB = getCustomNamePriority(b);
  if (customPriorityA !== customPriorityB) {
    return customPriorityA < customPriorityB ? -1 : 1;
  }

  const priorityDiff =
    getPersonnelPriorityIndex(a) - getPersonnelPriorityIndex(b);
  if (priorityDiff !== 0) return priorityDiff;

  const jabatanDiff = getUserJabatanPriority(a) - getUserJabatanPriority(b);
  if (jabatanDiff !== 0) return jabatanDiff;

  const pangkatDiff = getUserPangkatRank(a) - getUserPangkatRank(b);
  if (pangkatDiff !== 0) return pangkatDiff;

  const nameDiff = compareByName(a, b);
  if (nameDiff !== 0) return nameDiff;

  const aId =
    getUserDeterministicIdentifier(a) ||
    String(a?.user_id || a?.userId || a?.nrp || a?.nip || a?.nrp_nip || "");
  const bId =
    getUserDeterministicIdentifier(b) ||
    String(b?.user_id || b?.userId || b?.nrp || b?.nip || b?.nrp_nip || "");
  return aId.localeCompare(bId);
}
