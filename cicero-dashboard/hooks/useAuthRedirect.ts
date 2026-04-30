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
        !storedPath.startsWith("/login-update") &&
        !storedPath.startsWith("/claim") &&
        !storedPath.startsWith("/reposter") &&
        !storedPath.startsWith("/admin-system");

      if (storedPath?.startsWith("/admin-system")) {
        localStorage.removeItem("last_pathname");
      }
      const targetPath = shouldUseStoredPath ? storedPath : "/dashboard";
      router.replace(targetPath);
    }
  }, [router, token, isHydrating]);
}
