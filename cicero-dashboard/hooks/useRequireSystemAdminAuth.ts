"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAdminSystemToken } from "@/utils/adminSystemApi";

export default function useRequireSystemAdminAuth() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    const current = getAdminSystemToken();
    if (!current) {
      router.replace("/admin-system/login");
      setIsHydrating(false);
      return;
    }

    setToken(current);
    setIsHydrating(false);
  }, [router]);

  return { token, isHydrating };
}
