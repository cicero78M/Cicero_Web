"use client";
import { createContext, useContext, useEffect, useState } from "react";

type AuthState = {
  token: string | null;
  clientId: string | null;
  userId: string | null;
  role: string | null;
  setAuth: (
    token: string | null,
    clientId: string | null,
    userId: string | null,
    role: string | null,
  ) => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("cicero_token");
    const storedClient = localStorage.getItem("client_id");
    const storedUser = localStorage.getItem("user_id");
    const storedRole = localStorage.getItem("role");
    setToken(storedToken);
    setClientId(storedClient);
    setUserId(storedUser);
    setRole(storedRole);
  }, []);

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
    if (newRole) localStorage.setItem("role", newRole);
    else localStorage.removeItem("role");
  };

  return (
    <AuthContext.Provider value={{ token, clientId, userId, role, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
