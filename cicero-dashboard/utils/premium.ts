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
const DIREKTORAT_ROLE_KEYS = ["ditbinmas", "ditlantas", "bidhumas", "ditsamapta", "ditintelkam", "direktorat"] as const;

function normalizeRoleValue(value?: string | null) {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw || "";
}

function resolveDirektoratBindingFromProfile(profile?: any | null) {
  if (!profile || typeof profile !== "object") return "";

  const parentCandidates = [
    profile.parent_client_id,
    profile.parentClientId,
    profile.parent?.client_id,
    profile.parent_client?.client_id,
    profile.parentClient?.client_id,
  ]
    .map((value) => normalizeRoleValue(value))
    .filter(Boolean);

  for (const parent of parentCandidates) {
    if (DIREKTORAT_ROLE_KEYS.some((role) => parent.includes(role))) return parent;
  }

  const groupCandidates = [
    profile.client_group,
    profile.clientGroup,
    profile.group,
    profile.parent?.client_group,
    profile.parent_client?.client_group,
    profile.parentClient?.client_group,
  ]
    .map((value) => normalizeRoleValue(value).replace(/[\s_-]+/g, ""))
    .filter(Boolean);

  for (const group of groupCandidates) {
    if (DIREKTORAT_ROLE_KEYS.some((role) => group.includes(role))) return group;
  }

  return "";
}

export function isOrgOperator(effectiveClientType?: string | null, effectiveRole?: string | null) {
  const normalizedClientType = effectiveClientType?.toLowerCase();
  const normalizedRole = effectiveRole?.toLowerCase();
  return normalizedClientType === "org" && normalizedRole === "operator";
}

export function isMandiriPolresOperator(
  effectiveClientType?: string | null,
  effectiveRole?: string | null,
  profile?: any | null,
) {
  if (!isOrgOperator(effectiveClientType, effectiveRole)) return false;

  const tiedDirektorat = resolveDirektoratBindingFromProfile(profile);
  return !tiedDirektorat;
}

export function isPremiumTierAllowedForAnev(
  tier?: string | null,
  effectiveClientType?: string | null,
  effectiveRole?: string | null,
  profile?: any | null,
) {
  if (isMandiriPolresOperator(effectiveClientType, effectiveRole, profile)) {
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
