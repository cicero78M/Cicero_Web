"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function useRequireAuth() {
  const router = useRouter();
  const { token, clientId, role } = useAuth();

  useEffect(() => {
    const specialRoles = ["ditbinmas", "ditlantas", "bidhumas"];
    const hasAccess =
      token && (clientId || (role && specialRoles.includes(role.toLowerCase())));
    if (!hasAccess) {
      router.replace("/");
    }
  }, [router, token, clientId, role]);
}
