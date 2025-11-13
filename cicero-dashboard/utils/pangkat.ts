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

function normalizeString(value?: unknown): string {
  return String(value || "").trim().toUpperCase();
}

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

export function compareUsersByPangkatOnly(a: any, b: any): number {
  const pangkatDiff = getUserPangkatRank(a) - getUserPangkatRank(b);
  if (pangkatDiff !== 0) return pangkatDiff;

  const nameDiff = compareByName(a, b);
  if (nameDiff !== 0) return nameDiff;

  const idA = getUserDeterministicIdentifier(a);
  const idB = getUserDeterministicIdentifier(b);

  if (idA && idB) {
    const idDiff = idA.localeCompare(idB, "id", { sensitivity: "base" });
    if (idDiff !== 0) return idDiff;
  } else if (idA || idB) {
    return idA ? -1 : 1;
  }

  return 0;
}

export function compareUsersByPangkatAndNrp(a: any, b: any): number {
  const jabatanDiff = getUserJabatanPriority(a) - getUserJabatanPriority(b);
  if (jabatanDiff !== 0) return jabatanDiff;

  const pangkatDiff = getUserPangkatRank(a) - getUserPangkatRank(b);
  if (pangkatDiff !== 0) return pangkatDiff;

  const aId =
    getUserDeterministicIdentifier(a) ||
    String(a?.user_id || a?.userId || a?.nrp || a?.nip || a?.nrp_nip || "");
  const bId =
    getUserDeterministicIdentifier(b) ||
    String(b?.user_id || b?.userId || b?.nrp || b?.nip || b?.nrp_nip || "");

  const aNumeric = aId.replace(/\D/g, "");
  const bNumeric = bId.replace(/\D/g, "");

  if (aNumeric && bNumeric && aNumeric !== bNumeric) {
    const aValue = BigInt(aNumeric);
    const bValue = BigInt(bNumeric);
    if (aValue < bValue) return -1;
    if (aValue > bValue) return 1;
  } else if (aNumeric || bNumeric) {
    if (!aNumeric) return 1;
    if (!bNumeric) return -1;
  }

  if (aId && bId) {
    const idDiff = aId.localeCompare(bId, "id", { sensitivity: "base" });
    if (idDiff !== 0) return idDiff;
  } else if (aId || bId) {
    return aId ? -1 : 1;
  }

  const nameDiff = compareByName(a, b);
  if (nameDiff !== 0) return nameDiff;

  return 0;
}
