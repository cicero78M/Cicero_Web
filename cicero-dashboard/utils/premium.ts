export function normalizePremiumTier(tier?: string | null) {
  if (!tier) return "";

  return tier.toString().toLowerCase().replace(/[\s_-]+/g, "");
}

export function isPremiumTierAllowedForAnev(tier?: string | null) {
  const normalized = normalizePremiumTier(tier);

  return normalized === "premium1" || normalized === "premium2";
}
