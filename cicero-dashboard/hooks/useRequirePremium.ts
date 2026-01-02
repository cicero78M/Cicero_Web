"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { isPremiumTierAllowedForAnev } from "@/utils/premium";

export default function useRequirePremium() {
  const router = useRouter();
  const { isHydrating, isProfileLoading, premiumTier } = useAuth();

  useEffect(() => {
    if (isHydrating || isProfileLoading) return;

    const allowed = isPremiumTierAllowedForAnev(premiumTier);

    if (!allowed) {
      router.replace("/premium");
    }
  }, [isHydrating, isProfileLoading, premiumTier, router]);
}
