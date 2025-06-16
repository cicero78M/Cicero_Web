"use client";
import { createContext, useContext, useEffect, useState } from "react";

type AuthState = {
  token: string | null;
  clientId: string | null;
  setAuth: (token: string | null, clientId: string | null) => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem("cicero_token");
    const storedClient = localStorage.getItem("client_id");
    setToken(storedToken);
    setClientId(storedClient);
  }, []);

  const setAuth = (newToken: string | null, newClient: string | null) => {
    setToken(newToken);
    setClientId(newClient);
    if (newToken) localStorage.setItem("cicero_token", newToken);
    else localStorage.removeItem("cicero_token");
    if (newClient) localStorage.setItem("client_id", newClient);
    else localStorage.removeItem("client_id");
  };

  return (
    <AuthContext.Provider value={{ token, clientId, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
