export function normalizePremiumTier(tier?: string | null) {
  if (!tier) return "";

  return tier.toString().toLowerCase().replace(/[\s_-]+/g, "");
}

export function normalizePremiumTierKey(tier?: string | null) {
  const normalized = normalizePremiumTier(tier);
  if (!normalized) return "";

  if (normalized === "premium1") return "tier1";
  if (normalized === "premium2") return "tier2";

  return normalized;
}

export function formatPremiumTierLabel(tier?: string | null) {
  const normalized = normalizePremiumTierKey(tier);
  if (!normalized) return "";

  const tierMatch = normalized.match(/^(tier|premium)(\d+)$/);
  if (tierMatch) {
    const [, prefix, number] = tierMatch;
    const baseLabel =
      prefix === "tier" || (prefix === "premium" && (number === "1" || number === "2"))
        ? "Tier"
        : "Premium";
    return `${baseLabel} ${number}`;
  }

  return normalized;
}

export const ALLOWED_PREMIUM_ANEV_TIERS = ["tier1", "tier2"] as const;
export const ALLOWED_ENGAGEMENT_DATE_TIERS = ["tier1", "tier2"] as const;

export function isPremiumTierAllowedForAnev(tier?: string | null) {
  const normalized = normalizePremiumTierKey(tier);

  return ALLOWED_PREMIUM_ANEV_TIERS.some((allowedTier) => normalized === allowedTier);
}

export function isPremiumTierAllowedForEngagementDate(tier?: string | null) {
  const normalized = normalizePremiumTierKey(tier);

  return ALLOWED_ENGAGEMENT_DATE_TIERS.some((allowedTier) => normalized === allowedTier);
}
