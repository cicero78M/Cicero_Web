"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { COOKIE_SESSION_TOKEN, getAuthSession } from "@/utils/api";

export const REPOSTER_TOKEN_STORAGE_KEY = "reposter_token";
export const REPOSTER_PROFILE_STORAGE_KEY = "reposter_profile";

type ReposterAuthState = {
  token: string | null;
  profile: Record<string, any> | null;
  isHydrating: boolean;
  setAuth: (token: string | null, profile?: Record<string, any> | null) => void;
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
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    localStorage.removeItem(REPOSTER_TOKEN_STORAGE_KEY);
    localStorage.removeItem(REPOSTER_PROFILE_STORAGE_KEY);
    getAuthSession()
      .then((session) => {
        setToken(COOKIE_SESSION_TOKEN);
        setProfile(session);
      })
      .catch(() => setToken(null))
      .finally(() => setIsHydrating(false));
  }, []);

  const setAuth = useCallback(
    (
      newToken: string | null,
      newProfile: Record<string, any> | null = null,
    ) => {
      setToken(newToken);
      localStorage.removeItem(REPOSTER_TOKEN_STORAGE_KEY);

      setProfile(newProfile);
      localStorage.removeItem(REPOSTER_PROFILE_STORAGE_KEY);
    },
    [],
  );

  const contextValue = useMemo(
    () => ({ token, profile, isHydrating, setAuth }),
    [token, profile, isHydrating, setAuth],
  );

  return (
    <ReposterAuthContext.Provider value={contextValue}>
      {children}
    </ReposterAuthContext.Provider>
  );
}
