"use client";

type ProfileSource = Record<string, any> | null | undefined;

export type ReposterProfile = {
  nrp: string;
  name: string;
  whatsapp: string;
  email: string;
  role: string;
  unit: string;
  rank: string;
  avatarUrl: string;
  rawSources: ProfileSource[];
};

const pickString = (sources: ProfileSource[], keys: string[]): string => {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return "";
};

const normalizeSources = (sources: ProfileSource[]): ProfileSource[] =>
  sources.filter((source) => source && typeof source === "object");

export function decodeJwtPayload(token: string): Record<string, any> | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1];
  if (!payload) return null;
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    Math.ceil(normalized.length / 4) * 4,
    "=",
  );
  try {
    const decoded = JSON.parse(atob(padded));
    if (!decoded || typeof decoded !== "object") return null;
    return decoded;
  } catch {
    return null;
  }
}

export function normalizeReposterProfile(
  sources: ProfileSource[],
): ReposterProfile | null {
  const normalizedSources = normalizeSources(sources);
  const profile: ReposterProfile = {
    nrp: pickString(normalizedSources, [
      "nrp",
      "user_id",
      "userId",
      "userID",
      "id",
      "username",
      "sub",
    ]),
    name: pickString(normalizedSources, [
      "nama",
      "name",
      "full_name",
      "fullName",
      "nama_lengkap",
      "nama_user",
      "user_name",
    ]),
    whatsapp: pickString(normalizedSources, [
      "whatsapp",
      "no_wa",
      "no_hp",
      "phone",
      "phone_number",
      "phoneNumber",
      "telp",
      "telp_hp",
      "telpHp",
    ]),
    email: pickString(normalizedSources, [
      "email",
      "email_address",
      "emailAddress",
    ]),
    role: pickString(normalizedSources, [
      "role",
      "jabatan",
      "position",
    ]),
    unit: pickString(normalizedSources, [
      "satker",
      "unit",
      "kesatuan",
      "instansi",
    ]),
    rank: pickString(normalizedSources, [
      "pangkat",
      "rank",
      "grade",
    ]),
    avatarUrl: pickString(normalizedSources, [
      "avatar",
      "avatar_url",
      "avatarUrl",
      "photo",
      "photo_url",
      "profile_picture",
      "profilePicture",
      "foto",
    ]),
    rawSources: normalizedSources,
  };

  const hasData =
    profile.nrp ||
    profile.name ||
    profile.whatsapp ||
    profile.email ||
    profile.role ||
    profile.unit ||
    profile.rank ||
    profile.avatarUrl;

  return hasData ? profile : null;
}

export function extractReposterProfileFromLoginResponse(
  response: any,
): ReposterProfile | null {
  if (!response) return null;
  const sources: ProfileSource[] = [
    response?.data?.user,
    response?.data?.profile,
    response?.user,
    response?.profile,
    response?.data,
    response,
  ];
  return normalizeReposterProfile(sources);
}

export function mergeReposterProfiles(
  sources: ProfileSource[],
): ReposterProfile | null {
  return normalizeReposterProfile(sources);
}
