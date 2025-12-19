"use client";

import { createContext, useEffect, useState } from "react";

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
    const storedToken = localStorage.getItem(REPOSTER_TOKEN_STORAGE_KEY);
    setToken(storedToken);
    const storedProfile = localStorage.getItem(REPOSTER_PROFILE_STORAGE_KEY);
    if (storedProfile) {
      try {
        setProfile(JSON.parse(storedProfile));
      } catch {
        setProfile(null);
      }
    }
    setIsHydrating(false);
  }, []);

  const setAuth = (
    newToken: string | null,
    newProfile: Record<string, any> | null = null,
  ) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem(REPOSTER_TOKEN_STORAGE_KEY, newToken);
    } else {
      localStorage.removeItem(REPOSTER_TOKEN_STORAGE_KEY);
    }

    setProfile(newProfile);
    if (newProfile) {
      localStorage.setItem(
        REPOSTER_PROFILE_STORAGE_KEY,
        JSON.stringify(newProfile),
      );
    } else {
      localStorage.removeItem(REPOSTER_PROFILE_STORAGE_KEY);
    }
  };

  return (
    <ReposterAuthContext.Provider
      value={{ token, profile, isHydrating, setAuth }}
    >
      {children}
    </ReposterAuthContext.Provider>
  );
}
