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
