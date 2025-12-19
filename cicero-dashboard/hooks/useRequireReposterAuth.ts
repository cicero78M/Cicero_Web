"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useReposterAuth from "@/hooks/useReposterAuth";

export default function useRequireReposterAuth() {
  const router = useRouter();
  const { token, isHydrating } = useReposterAuth();

  useEffect(() => {
    if (isHydrating) return;

    if (!token) {
      router.replace("/reposter/login");
    }
  }, [router, token, isHydrating]);
}
