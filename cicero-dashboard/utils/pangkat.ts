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
  "BRIGADIR",
  "BRIPTU",
  "BRIPDA",
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

export function getPangkatRank(title?: string): number {
  const t = String(title || "").toUpperCase();
  const index = PANGKAT_ORDER.findIndex((p) => t.includes(p));
  return index === -1 ? PANGKAT_ORDER.length : index;
}

export function compareUsersByPangkatAndNrp(a: any, b: any): number {
  const rankDiff = getPangkatRank(a.title) - getPangkatRank(b.title);
  if (rankDiff !== 0) return rankDiff;
  const aId = String(
    a.user_id || a.userId || a.nrp || a.nip || a.nrp_nip || "",
  );
  const bId = String(
    b.user_id || b.userId || b.nrp || b.nip || b.nrp_nip || "",
  );
  return aId.localeCompare(bId);
}
