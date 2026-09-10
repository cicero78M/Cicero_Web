"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { COOKIE_SESSION_TOKEN, getAuthSession } from "@/utils/api";

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
  const sessionIdentityRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const refreshSession = async (reloadOnIdentityChange = false) => {
      try {
        const session = await getAuthSession("reposter");
        if (cancelled) return;
        const identity = JSON.stringify({
          userId: session.user_id || null,
          clientId: session.client_id || null,
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
        setProfile(session);
      } catch {
        if (!cancelled) {
          sessionIdentityRef.current = null;
          setToken(null);
          setProfile(null);
        }
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

  const setAuth = useCallback(
    (
      newToken: string | null,
      newProfile: Record<string, any> | null = null,
    ) => {
      setToken(newToken);
      setProfile(newProfile);
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
