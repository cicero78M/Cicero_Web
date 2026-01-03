export function normalizePremiumTier(tier?: string | null) {
  if (!tier) return "";

  return tier.toString().toLowerCase().replace(/[\s_-]+/g, "");
}

export const ALLOWED_PREMIUM_ANEV_TIERS = ["premium1", "premium2", "premium3"] as const;

export function isPremiumTierAllowedForAnev(tier?: string | null) {
  const normalized = normalizePremiumTier(tier);

  return ALLOWED_PREMIUM_ANEV_TIERS.some((allowedTier) => normalized === allowedTier);
}
