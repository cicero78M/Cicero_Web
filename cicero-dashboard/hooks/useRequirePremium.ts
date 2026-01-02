"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { isPremiumTierAllowedForAnev } from "@/utils/premium";
import { showToast } from "@/utils/showToast";

export default function useRequirePremium() {
  const router = useRouter();
  const hasShownError = useRef(false);
  const {
    isHydrating,
    isProfileLoading,
    premiumTier,
    hasResolvedPremium,
    premiumResolutionError,
  } = useAuth();

  useEffect(() => {
    if (isHydrating || isProfileLoading || !hasResolvedPremium) return;

    if (!premiumResolutionError && hasShownError.current) {
      hasShownError.current = false;
    }

    if (premiumResolutionError) {
      if (!hasShownError.current) {
        showToast(
          "Gagal memuat profil premium. Coba segarkan halaman atau hubungi admin.",
          "error",
        );
        hasShownError.current = true;
      }
      return;
    }

    const allowed = isPremiumTierAllowedForAnev(premiumTier);

    if (!allowed) {
      router.replace("/premium");
    }
  }, [
    hasResolvedPremium,
    isHydrating,
    isProfileLoading,
    premiumResolutionError,
    premiumTier,
    router,
  ]);
}
