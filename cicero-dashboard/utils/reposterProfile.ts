"use client";

type ProfileSource = Record<string, any> | null | undefined;

export type ReposterProfile = {
  nrp: string;
  name: string;
  polresName: string;
  whatsapp: string;
  email: string;
  role: string;
  jabatan: string;
  satfung: string;
  unit: string;
  rank: string;
  avatarUrl: string;
  instagramUsername: string;
  tiktokUsername: string;
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

const INSTAGRAM_USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const TIKTOK_USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

const normalizeInstagramUsername = (value: string): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    const normalized = trimmed.replace(/^@/, "");
    return INSTAGRAM_USERNAME_PATTERN.test(normalized) ? normalized : "";
  }
  try {
    const link = new URL(trimmed);
    const host = link.hostname.toLowerCase();
    if (
      host !== "instagram.com" &&
      host !== "www.instagram.com" &&
      !host.endsWith(".instagram.com")
    ) {
      return "";
    }
    const segments = link.pathname.split("/").filter(Boolean);
    const candidate = segments[0] ? segments[0].replace(/^@/, "") : "";
    return INSTAGRAM_USERNAME_PATTERN.test(candidate) ? candidate : "";
  } catch {
    return "";
  }
};

const normalizeTiktokUsername = (value: string): string => {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/^https?:\/\//i.test(trimmed)) {
    const normalized = trimmed.replace(/^@/, "");
    return TIKTOK_USERNAME_PATTERN.test(normalized) ? normalized : "";
  }
  try {
    const link = new URL(trimmed);
    const host = link.hostname.toLowerCase();
    if (
      host !== "tiktok.com" &&
      host !== "www.tiktok.com" &&
      !host.endsWith(".tiktok.com")
    ) {
      return "";
    }
    const segments = link.pathname.split("/").filter(Boolean);
    const raw = segments[0] || "";
    const candidate = raw.startsWith("@") ? raw.slice(1) : raw;
    return TIKTOK_USERNAME_PATTERN.test(candidate) ? candidate : "";
  } catch {
    return "";
  }
};

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
    polresName: pickString(normalizedSources, [
      "nama_polres",
      "polres_name",
      "polres",
      "nama_client",
      "client_name",
      "client",
      "client_id",
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
    jabatan: pickString(normalizedSources, [
      "jabatan",
      "position",
      "role",
      "user_role",
    ]),
    satfung: pickString(normalizedSources, [
      "satfung",
      "divisi",
      "division",
      "unit",
    ]),
    unit: pickString(normalizedSources, [
      "satker",
      "unit",
      "kesatuan",
      "instansi",
    ]),
    rank: pickString(normalizedSources, [
      "pangkat",
      "title",
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
    instagramUsername: normalizeInstagramUsername(
      pickString(normalizedSources, [
        "instagram",
        "instagram_username",
        "instagramUsername",
        "insta",
        "ig",
        "ig_username",
        "client_insta",
      ]),
    ),
    tiktokUsername: normalizeTiktokUsername(
      pickString(normalizedSources, [
        "tiktok",
        "tiktok_username",
        "tiktokUsername",
        "tt",
        "client_tiktok",
      ]),
    ),
    rawSources: normalizedSources,
  };

  const hasData =
    profile.nrp ||
    profile.name ||
    profile.polresName ||
    profile.whatsapp ||
    profile.email ||
    profile.role ||
    profile.jabatan ||
    profile.satfung ||
    profile.unit ||
    profile.rank ||
    profile.avatarUrl ||
    profile.instagramUsername ||
    profile.tiktokUsername;

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
