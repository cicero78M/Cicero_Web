"use client";
import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";
import { isPremiumTierAllowedForAnev } from "@/utils/premium";
import { showToast } from "@/utils/showToast";

export type PremiumGuardStatus = "loading" | "premium" | "standard" | "error";

export type UseRequirePremiumOptions = {
  redirectOnStandard?: boolean;
};

export default function useRequirePremium({
  redirectOnStandard = true,
}: UseRequirePremiumOptions = {}): PremiumGuardStatus {
  const router = useRouter();
  const hasShownError = useRef(false);
  const {
    isHydrating,
    isProfileLoading,
    premiumTier,
    premiumTierReady,
    hasResolvedPremium,
    premiumResolutionError,
  } = useAuth();

  const status = useMemo<PremiumGuardStatus>(() => {
    const hasEvaluatedTier = premiumTierReady || premiumTier !== null;
    const readyToGuard =
      hasResolvedPremium && (hasEvaluatedTier || premiumResolutionError);

    if (isHydrating || isProfileLoading || !readyToGuard) return "loading";
    if (premiumResolutionError) return "error";

    const allowed = isPremiumTierAllowedForAnev(premiumTier);
    return allowed ? "premium" : "standard";
  }, [
    hasResolvedPremium,
    isHydrating,
    isProfileLoading,
    premiumResolutionError,
    premiumTier,
    premiumTierReady,
  ]);

  useEffect(() => {
    if (status === "error") {
      if (!hasShownError.current) {
        showToast(
          "Gagal memuat profil premium. Coba segarkan halaman atau hubungi admin.",
          "error",
        );
        hasShownError.current = true;
      }
      return;
    }

    if (hasShownError.current) {
      hasShownError.current = false;
    }

    if (status === "standard" && redirectOnStandard) {
      router.replace("/premium/anev");
    }
  }, [redirectOnStandard, router, status]);

  return status;
}
