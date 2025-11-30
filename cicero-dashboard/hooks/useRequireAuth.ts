"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function useRequireAuth() {
  const router = useRouter();
  const { token, clientId, isHydrating } = useAuth();

  useEffect(() => {
    if (isHydrating) return;

    if (!token || !clientId) {
      router.replace("/");
    }
  }, [router, token, clientId, isHydrating]);
}
