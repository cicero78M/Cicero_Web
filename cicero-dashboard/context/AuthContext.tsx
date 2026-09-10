"use client";
import { createContext, useEffect, useRef, useState } from "react";
import {
  COOKIE_SESSION_TOKEN,
  getAuthSession,
  getClientProfile,
} from "@/utils/api";

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
  premiumTierReady: boolean;
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
  "ditintelkam",
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
  else if (compact.includes("ditintelkam")) mapped = "DITINTELKAM";
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
  const [hasResolvedProfile, setHasResolvedProfile] = useState(false);
  const [premiumTierReady, setPremiumTierReady] = useState(false);
  const [hasResolvedPremium, setHasResolvedPremium] = useState(false);
  const [premiumResolutionError, setPremiumResolutionError] = useState(false);
  const sessionIdentityRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const clearSessionState = () => {
      sessionIdentityRef.current = null;
      setToken(null);
      setClientId(null);
      setUserId(null);
      setUsername(null);
      setRole(null);
      setProfile(null);
      setRegionalId(null);
    };
    const refreshSession = async (reloadOnIdentityChange = false) => {
      try {
        const session = await getAuthSession("dashboard");
        if (cancelled) return;
        const identity = JSON.stringify({
          userId: session.dashboard_user_id || session.user_id || null,
          clientIds: session.client_ids || (session.client_id ? [session.client_id] : []),
          role: session.role || null,
        });
        if (
          reloadOnIdentityChange &&
          sessionIdentityRef.current &&
          sessionIdentityRef.current !== identity
        ) {
          window.location.reload();
          return;
        }
        sessionIdentityRef.current = identity;
        setToken(COOKIE_SESSION_TOKEN);
        setClientId(session.client_id || session.client_ids?.[0] || null);
        setUserId(session.dashboard_user_id || session.user_id || null);
        setUsername(session.username || session.nama || null);
        setRole(session.role || null);
      } catch {
        if (!cancelled) clearSessionState();
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    };
    const handleFocus = () => refreshSession(true);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refreshSession(true);
    };
    refreshSession();
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function fetchProfile() {
      setHasResolvedProfile(false);
      setHasResolvedPremium(false);
      setPremiumResolutionError(false);
      setPremiumTierReady(false);
      setPremiumTier(null);
      setPremiumExpiry(null);

      if (!token || !clientId) {
        setProfile(null);
        setRegionalId(null);
        setIsProfileLoading(false);
        setPremiumTierReady(true);
        setHasResolvedProfile(true);
        return;
      }

      setIsProfileLoading(true);
      try {
        const res = await getClientProfile(token, clientId, undefined, {
          role: role || undefined,
        });
        if (!cancelled) {
          setProfile(res.client || res.profile || res);
          setPremiumResolutionError(false);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setProfile(null);
          setPremiumResolutionError(true);
          setPremiumTierReady(false);
        }
      }
      if (!cancelled) {
        setIsProfileLoading(false);
        setHasResolvedProfile(true);
      }
    }
    fetchProfile();
    return () => {
      cancelled = true;
    };
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
    if (!hasResolvedProfile) return;

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
      "premium_expires_at",
      "premiumExpiresAt",
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
    setPremiumTierReady(true);
  }, [hasResolvedProfile, profile]);

  useEffect(() => {
    if (!hasResolvedProfile) {
      setHasResolvedPremium(false);
      return;
    }

    setHasResolvedPremium(premiumTierReady || premiumResolutionError);
  }, [hasResolvedProfile, premiumResolutionError, premiumTierReady]);

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
    const isDirectorateClientType = normalizedClientType === "DIREKTORAT";
    const isDitintelkamDirectorate =
      isDirectorateClientType && normalizedRole.upper === "DITINTELKAM";
    const resolvedClientType =
      (isDirectorateClientType && !isOperatorRole && isDirectorateRole) ||
      isDitintelkamDirectorate
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
        premiumTierReady,
        hasResolvedPremium,
        premiumResolutionError,
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
