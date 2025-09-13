"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function useRequireAuth() {
  const router = useRouter();
  const { token, clientId } = useAuth();

  useEffect(() => {
    if (!token || !clientId) {
      router.replace("/");
    }
  }, [router, token, clientId]);
}
