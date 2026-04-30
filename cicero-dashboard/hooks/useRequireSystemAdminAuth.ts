"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAdminSystemToken, getAdminSystemAuthMe, getAdminSystemToken } from "@/utils/adminSystemApi";

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

    getAdminSystemAuthMe(current)
      .then(() => {
        setToken(current);
      })
      .catch(() => {
        clearAdminSystemToken();
        router.replace("/admin-system/login");
      })
      .finally(() => setIsHydrating(false));
  }, [router]);

  return { token, isHydrating };
}
