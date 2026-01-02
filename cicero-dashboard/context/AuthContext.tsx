"use client";
import { createContext, useEffect, useState } from "react";
import { getClientProfile } from "@/utils/api";

type AuthState = {
  token: string | null;
  clientId: string | null;
  userId: string | null;
  username: string | null;
  role: string | null;
  effectiveRole: string | null;
  effectiveClientType: string | null;
  regionalId: string | null;
  premiumTier: string | null;
  premiumExpiry: string | null;
  profile: any | null;
  isHydrating: boolean;
  isProfileLoading: boolean;
  hasResolvedPremium: boolean;
  premiumResolutionError: boolean;
  setAuth: (
    token: string | null,
    clientId: string | null,
    userId: string | null,
    role: string | null,
    username?: string | null,
  ) => void;
};

export const AuthContext = createContext<AuthState | undefined>(undefined);

const DIRECTORATE_ROLE_KEYS = new Set([
  "ditbinmas",
  "ditsamapta",
  "ditlantas",
  "bidhumas",
  "direktorat",
]);

function normalizeRoleValue(value?: string | null) {
  const raw = String(value ?? "").trim();
  if (!raw) {
    return {
      raw: "",
      mapped: "",
      lower: "",
      upper: "",
    };
  }

  const normalized = raw.toLowerCase();
  const compact = normalized.replace(/[\s-_]+/g, "");
  let mapped = "";

  if (compact.includes("ditbinmas")) mapped = "DITBINMAS";
  else if (compact.includes("bidhumas")) mapped = "BIDHUMAS";
  else if (compact.includes("ditsamapta")) mapped = "DITSAMAPTA";
  else if (compact.includes("ditlantas")) mapped = "DITLANTAS";
  else if (compact.includes("operator")) mapped = "OPERATOR";
  else if (compact.includes("direktorat")) mapped = "DIREKTORAT";
  else mapped = raw;

  return {
    raw,
    mapped,
    lower: mapped.toLowerCase(),
    upper: mapped.toUpperCase(),
  };
}

function normalizeClientType(value?: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const normalized = raw.toUpperCase();
  if (normalized.includes("DIREKTORAT")) return "DIREKTORAT";
  if (normalized.includes("ORG")) return "ORG";
  return normalized;
}

function decodeJwtPayload(token: string | null): Record<string, any> | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1];
  const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  try {
    const decoded = JSON.parse(atob(padded));
    if (!decoded || typeof decoded !== "object") return null;
    return decoded;
  } catch {
    return null;
  }
}

function pickString(source: Record<string, any> | null, keys: string[]) {
  if (!source) return "";
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function extractTokenProfile(token: string | null) {
  const payload = decodeJwtPayload(token);
  const username = pickString(payload, [
    "username",
    "user_name",
    "name",
    "nama",
    "sub",
  ]);
  const userId = pickString(payload, [
    "user_id",
    "userId",
    "uuid",
    "id",
    "sub",
  ]);
  const clientId = pickString(payload, ["client_id", "clientId", "cid"]);
  const role = pickString(payload, ["role", "user_role", "roleName"]);
  return { username, userId, clientId, role };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [effectiveRole, setEffectiveRole] = useState<string | null>(null);
  const [effectiveClientType, setEffectiveClientType] = useState<string | null>(
    null,
  );
  const [regionalId, setRegionalId] = useState<string | null>(null);
  const [premiumTier, setPremiumTier] = useState<string | null>(null);
  const [premiumExpiry, setPremiumExpiry] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [hasResolvedPremium, setHasResolvedPremium] = useState(false);
  const [premiumResolutionError, setPremiumResolutionError] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("cicero_token");
    const storedClient = localStorage.getItem("client_id");
    const storedUser = localStorage.getItem("user_id");
    const storedUsername = localStorage.getItem("username");
    const storedRole = localStorage.getItem("user_role");
    const tokenProfile = extractTokenProfile(storedToken);
    setToken(storedToken);
    setClientId(storedClient || tokenProfile.clientId || null);
    setUserId(storedUser || tokenProfile.userId || null);
    setUsername(storedUsername || tokenProfile.username || null);
    setRole(storedRole || tokenProfile.role || null);
    setIsHydrating(false);
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      setHasResolvedPremium(false);
      setPremiumResolutionError(false);

      if (!token || !clientId) {
        setProfile(null);
        setRegionalId(null);
        setPremiumTier(null);
        setPremiumExpiry(null);
        setIsProfileLoading(false);
        setHasResolvedPremium(true);
        return;
      }

      setIsProfileLoading(true);
      try {
        const res = await getClientProfile(token, clientId, undefined, {
          role: role || undefined,
        });
        setProfile(res.client || res.profile || res);
        setPremiumResolutionError(false);
      } catch (err) {
        console.error(err);
        setProfile(null);
        setPremiumResolutionError(true);
      }
      setIsProfileLoading(false);
      setHasResolvedPremium(true);
    }
    fetchProfile();
  }, [token, clientId, role]);

  useEffect(() => {
    const resolvedRegionalId =
      profile?.regional_id ||
      profile?.regionalId ||
      profile?.regionalID ||
      profile?.regional;
    setRegionalId(resolvedRegionalId ? String(resolvedRegionalId) : null);
  }, [profile]);

  useEffect(() => {
    const premiumCandidates = [
      profile,
      profile?.premium,
      profile?.subscription,
      profile?.package,
      profile?.plan,
      profile?.parent,
      profile?.parent_client,
      profile?.parentClient,
      profile?.parent_profile,
    ];

    const tierKeys = [
      "premium_tier",
      "premiumTier",
      "tier",
      "level",
      "package",
      "name",
    ];

    const expiryKeys = [
      "premium_expiry",
      "premiumExpiry",
      "expires_at",
      "expiresAt",
      "expired_at",
      "expiredAt",
      "expiry",
    ];

    let resolvedTier = "";
    let resolvedExpiry = "";

    for (const candidate of premiumCandidates) {
      if (!candidate) continue;
      if (!resolvedTier) {
        for (const key of tierKeys) {
          const value = candidate[key];
          if (typeof value === "string" && value.trim()) {
            resolvedTier = value.trim();
            break;
          }
        }
      }
      if (!resolvedExpiry) {
        for (const key of expiryKeys) {
          const value = candidate[key];
          if (typeof value === "string" && value.trim()) {
            resolvedExpiry = value.trim();
            break;
          }
        }
      }
      if (resolvedTier && resolvedExpiry) break;
    }

    setPremiumTier(resolvedTier || null);
    setPremiumExpiry(resolvedExpiry || null);
  }, [profile]);

  useEffect(() => {
    const normalizedClientId = clientId?.toUpperCase();
    const normalizedRole = normalizeRoleValue(role);
    const normalizedClientType = normalizeClientType(
      profile?.client_type ||
        profile?.clientType ||
        profile?.client_type_code ||
        profile?.clientTypeName,
    );

    const isDitSamaptaBidhumas =
      normalizedClientId === "DITSAMAPTA" &&
      normalizedClientType === "DIREKTORAT" &&
      normalizedRole.upper === "BIDHUMAS";

    if (isDitSamaptaBidhumas) {
      setEffectiveRole("BIDHUMAS");
      setEffectiveClientType("ORG");
      return;
    }

    const effectiveRoleValue = normalizedRole.upper || normalizedRole.raw;
    const isOperatorRole = normalizedRole.lower === "operator";
    const isDirectorateRole = DIRECTORATE_ROLE_KEYS.has(normalizedRole.lower);
    const resolvedClientType =
      normalizedClientType === "DIREKTORAT" && !isOperatorRole && isDirectorateRole
        ? "DIREKTORAT"
        : normalizedClientType
        ? "ORG"
        : "";

    setEffectiveRole(effectiveRoleValue || null);
    setEffectiveClientType(resolvedClientType || null);
  }, [clientId, role, profile]);

  const setAuth = (
    newToken: string | null,
    newClient: string | null,
    newUser: string | null,
    newRole: string | null,
    newUsername?: string | null,
  ) => {
    const tokenProfile = extractTokenProfile(newToken);
    const resolvedClientId = newClient || tokenProfile.clientId || null;
    const resolvedUserId = newUser || tokenProfile.userId || null;
    const resolvedRole = newRole || tokenProfile.role || null;
    const resolvedUsername = newUsername || tokenProfile.username || null;

    setToken(newToken);
    setClientId(resolvedClientId);
    setUserId(resolvedUserId);
    setUsername(resolvedUsername);
    setRole(resolvedRole);
    setProfile(null);
    setRegionalId(null);
    setPremiumTier(null);
    setPremiumExpiry(null);
    if (newToken) localStorage.setItem("cicero_token", newToken);
    else localStorage.removeItem("cicero_token");
    if (resolvedClientId) localStorage.setItem("client_id", resolvedClientId);
    else localStorage.removeItem("client_id");
    if (resolvedUserId) localStorage.setItem("user_id", resolvedUserId);
    else localStorage.removeItem("user_id");
    if (resolvedUsername) localStorage.setItem("username", resolvedUsername);
    else localStorage.removeItem("username");
    if (resolvedRole) localStorage.setItem("user_role", resolvedRole);
    else localStorage.removeItem("user_role");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        clientId,
        userId,
        username,
        role,
        effectiveRole,
        effectiveClientType,
        regionalId,
        premiumTier,
        premiumExpiry,
        profile,
        isHydrating,
        isProfileLoading,
        hasResolvedPremium,
        premiumResolutionError,
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
