"use client";

import { createContext, useEffect, useState } from "react";

export const REPOSTER_TOKEN_STORAGE_KEY = "reposter_token";

type ReposterAuthState = {
  token: string | null;
  isHydrating: boolean;
  setAuth: (token: string | null) => void;
};

export const ReposterAuthContext = createContext<
  ReposterAuthState | undefined
>(undefined);

export function ReposterAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(REPOSTER_TOKEN_STORAGE_KEY);
    setToken(storedToken);
    setIsHydrating(false);
  }, []);

  const setAuth = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem(REPOSTER_TOKEN_STORAGE_KEY, newToken);
    } else {
      localStorage.removeItem(REPOSTER_TOKEN_STORAGE_KEY);
    }
  };

  return (
    <ReposterAuthContext.Provider value={{ token, isHydrating, setAuth }}>
      {children}
    </ReposterAuthContext.Provider>
  );
}
