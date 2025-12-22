"use client";
import { createContext, useEffect, useState } from "react";
import { getClientProfile } from "@/utils/api";

type AuthState = {
  token: string | null;
  clientId: string | null;
  userId: string | null;
  role: string | null;
  effectiveRole: string | null;
  effectiveClientType: string | null;
  profile: any | null;
  isHydrating: boolean;
  setAuth: (
    token: string | null,
    clientId: string | null,
    userId: string | null,
    role: string | null,
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

function normalizeRoleValue(value?: string) {
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [effectiveRole, setEffectiveRole] = useState<string | null>(null);
  const [effectiveClientType, setEffectiveClientType] = useState<string | null>(
    null,
  );
  const [profile, setProfile] = useState<any | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("cicero_token");
    const storedClient = localStorage.getItem("client_id");
    const storedUser = localStorage.getItem("user_id");
    const storedRole = localStorage.getItem("user_role");
    setToken(storedToken);
    setClientId(storedClient);
    setUserId(storedUser);
    setRole(storedRole);
    setIsHydrating(false);
  }, []);

  useEffect(() => {
    async function fetchProfile() {
      if (!token || !clientId) return;
      try {
        const res = await getClientProfile(token, clientId);
        setProfile(res.client || res.profile || res);
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, [token, clientId]);

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
  ) => {
    setToken(newToken);
    setClientId(newClient);
    setUserId(newUser);
    setRole(newRole);
    if (newToken) localStorage.setItem("cicero_token", newToken);
    else localStorage.removeItem("cicero_token");
    if (newClient) localStorage.setItem("client_id", newClient);
    else localStorage.removeItem("client_id");
    if (newUser) localStorage.setItem("user_id", newUser);
    else localStorage.removeItem("user_id");
    if (newRole) localStorage.setItem("user_role", newRole);
    else localStorage.removeItem("user_role");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        clientId,
        userId,
        role,
        effectiveRole,
        effectiveClientType,
        profile,
        isHydrating,
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
