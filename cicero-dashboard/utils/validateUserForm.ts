export const PANGKAT_OPTIONS = [
  "BHARADA",
  "BHARATU",
  "BHARAKA",
  "BRIPDA",
  "BRIPTU",
  "BRIGADIR",
  "BRIPKA",
  "AIPDA",
  "AIPTU",
  "IPDA",
  "IPTU",
  "AKP",
  "KOMPOL",
  "AKBP",
  "KOMISARIS BESAR POLISI",
  "JURU MUDA",
  "JURU MUDA TINGKAT I",
  "JURU",
  "JURU TINGKAT I",
  "PENGATUR MUDA",
  "PENGATUR MUDA TINGKAT I",
  "PENGATUR",
  "PENGATUR TINGKAT I",
  "PENATA MUDA",
  "PENATA MUDA TINGKAT I",
  "PENATA",
  "PENATA TINGKAT I",
  "PEMBINA",
  "PEMBINA TINGKAT I",
  "PEMBINA UTAMA MUDA",
  "PEMBINA UTAMA MADYA",
  "PEMBINA UTAMA",
];

export const SATFUNG_OPTIONS = [
  "BAG LOG",
  "BAG SDM",
  "BAG REN",
  "BAG OPS",
  "SAT SAMAPTA",
  "SAT RESKRIM",
  "SAT INTEL",
  "SAT NARKOBA",
  "SAT BINMAS",
  "SAT LANTAS",
  "SI UM",
  "SI TIK",
  "SI WAS",
  "SI PROPAM",
  "SI DOKES",
  "SPKT",
  "SAT TAHTI",
  "DITBINMAS",
  "SUBBAGRENMIN",
  "BAGBINOPSNAL",
  "SUBDIT BINPOLMAS",
  "SUBDIT SATPAMPOLSUS",
  "SUBDIT BHABINKAMTIBMAS",
  "SUBDIT BINTIBSOS",
  "POLSEK",
];

interface NewUserData {
  nama: string;
  pangkat: string;
  nrpNip: string;
  satfung: string;
  polsekName: string;
}

interface ValidationResult {
  error?: string;
  nrpNip?: string;
  satfungValue?: string;
}

export function validateNewUser({ nama, pangkat, nrpNip, satfung, polsekName }: NewUserData): ValidationResult {
  const sanitizedNrpNip = nrpNip.replace(/\D/g, "");
  if (!sanitizedNrpNip) {
    return { error: "NRP/NIP wajib diisi" };
  }
  if (/[A-Za-z]/.test(nrpNip)) {
    return { error: "NRP hanya boleh angka" };
  }
  if (!PANGKAT_OPTIONS.includes(pangkat)) {
    return { error: "Pangkat tidak valid" };
  }
  const trimmedPolsek = polsekName.trim();
  const satfungValue =
    satfung === "POLSEK"
      ? trimmedPolsek
        ? `POLSEK ${trimmedPolsek}`
        : ""
      : satfung;
  if (satfung === "POLSEK" && !trimmedPolsek) {
    return { error: "Nama Polsek wajib diisi" };
  }
  if (satfung !== "POLSEK" && !SATFUNG_OPTIONS.includes(satfung)) {
    return { error: "Satfung tidak valid" };
  }
  return { nrpNip: sanitizedNrpNip, satfungValue };
}

