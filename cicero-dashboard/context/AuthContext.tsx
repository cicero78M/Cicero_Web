"use client";
import { createContext, useEffect, useState } from "react";
import { getClientProfile } from "@/utils/api";

type AuthState = {
  token: string | null;
  clientId: string | null;
  userId: string | null;
  role: string | null;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
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
      value={{ token, clientId, userId, role, profile, isHydrating, setAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
}

