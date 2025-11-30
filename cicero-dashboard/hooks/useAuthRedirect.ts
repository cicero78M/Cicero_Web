// hooks/useAuthRedirect.js
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function useAuthRedirect() {
  const router = useRouter();
  const { token, isHydrating } = useAuth();

  useEffect(() => {
    if (isHydrating) return;

    if (token) {
      const storedPath = localStorage.getItem("last_pathname");
      const shouldUseStoredPath =
        storedPath &&
        storedPath !== "/" &&
        !storedPath.startsWith("/login") &&
        !storedPath.startsWith("/claim");
      const targetPath = shouldUseStoredPath ? storedPath : "/dashboard";
      router.replace(targetPath);
    }
  }, [router, token, isHydrating]);
}
