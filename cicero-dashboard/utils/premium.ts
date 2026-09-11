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

// Values here are compared after normalizePremiumTierKey(), which removes
// separators from premium_unified.
export const ALLOWED_PREMIUM_ANEV_TIERS = ["tier1", "tier2", "premiumunified"] as const;
export const ALLOWED_ENGAGEMENT_DATE_TIERS = ["tier1", "tier2", "premiumunified"] as const;

export function isOrgOperator(effectiveClientType?: string | null, effectiveRole?: string | null) {
  const normalizedRole = effectiveRole?.toLowerCase();
  return normalizedRole === "operator";
}

export function isDitbinmasPremiumAudience(clientId?: string | null, effectiveRole?: string | null) {
  return (
    String(clientId || "").trim().toLowerCase() === "ditbinmas" &&
    String(effectiveRole || "").trim().toLowerCase() === "ditbinmas"
  );
}

export function isDitbinmasRole(effectiveRole?: string | null) {
  return String(effectiveRole || "").trim().toLowerCase() === "ditbinmas";
}

export function hasAutomaticPremiumAccess(clientId?: string | null, effectiveRole?: string | null) {
  const normalizedRole = String(effectiveRole || "").trim().toLowerCase();
  return normalizedRole === "operator" || isDitbinmasPremiumAudience(clientId, effectiveRole);
}

export function isPremiumTierAllowedForAnev(tier?: string | null, effectiveClientType?: string | null, effectiveRole?: string | null) {
  if (isOrgOperator(effectiveClientType, effectiveRole)) {
    return true;
  }

  const normalized = normalizePremiumTierKey(tier);

  return ALLOWED_PREMIUM_ANEV_TIERS.some((allowedTier) => normalized === allowedTier);
}

export function isPremiumTierAllowedForEngagementDate(tier?: string | null) {
  const normalized = normalizePremiumTierKey(tier);

  return ALLOWED_ENGAGEMENT_DATE_TIERS.some((allowedTier) => normalized === allowedTier);
}

export function hasActivePremiumSubscription(
  tier?: string | null,
  expiry?: string | null,
  premiumStatus?: boolean | null,
) {
  const normalizedTier = normalizePremiumTierKey(tier);
  const tierLooksPremium =
    normalizedTier.startsWith("tier") || normalizedTier.startsWith("premium");

  const explicitStatus = typeof premiumStatus === "boolean" ? premiumStatus : null;

  if (explicitStatus === false && !tierLooksPremium) return false;
  if (explicitStatus !== true && !tierLooksPremium) return false;

  if (!expiry) return true;

  const expiryTime = Date.parse(expiry);
  if (Number.isNaN(expiryTime)) return true;

  return expiryTime > Date.now();
}
