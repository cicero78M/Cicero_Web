"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function useRequirePremium() {
  const router = useRouter();
  const { isHydrating, isProfileLoading, premiumTier } = useAuth();

  useEffect(() => {
    if (isHydrating || isProfileLoading) return;

    const normalizedTier = premiumTier?.toLowerCase();
    const allowed =
      normalizedTier === "premium_1" || normalizedTier === "premium_3";

    if (!allowed) {
      router.replace("/premium");
    }
  }, [isHydrating, isProfileLoading, premiumTier, router]);
}
