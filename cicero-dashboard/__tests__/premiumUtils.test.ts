import {
  ALLOWED_PREMIUM_ANEV_TIERS,
  ALLOWED_ENGAGEMENT_DATE_TIERS,
  formatPremiumTierLabel,
  isPremiumTierAllowedForAnev,
  isPremiumTierAllowedForEngagementDate,
  normalizePremiumTier,
  normalizePremiumTierKey,
} from "@/utils/premium";

describe("premium utils", () => {
  it("normalizes tier strings by lowering case and removing separators", () => {
    expect(normalizePremiumTier("Premium 1")).toBe("premium1");
    expect(normalizePremiumTier("PREMIUM_2")).toBe("premium2");
    expect(normalizePremiumTier("tier-1")).toBe("tier1");
  });

  it("maps aliases to normalized tier keys", () => {
    expect(normalizePremiumTierKey("premium_1")).toBe("tier1");
    expect(normalizePremiumTierKey("Premium-2")).toBe("tier2");
    expect(normalizePremiumTierKey("TIER 2")).toBe("tier2");
  });

  it("formats tier labels for display", () => {
    expect(formatPremiumTierLabel("premium_1")).toBe("Tier 1");
    expect(formatPremiumTierLabel("tier2")).toBe("Tier 2");
    expect(formatPremiumTierLabel("premium_3")).toBe("Premium 3");
  });

  it("allows backend tiers for ANEV guard after normalization", () => {
    const allowed = ["tier1", "Tier 2", "premium_1"];
    const results = allowed.map((tier) => isPremiumTierAllowedForAnev(tier));

    expect(results).toEqual([true, true, true]);
    expect(ALLOWED_PREMIUM_ANEV_TIERS).toEqual(["tier1", "tier2"]);
  });

  it("allows tier 1 and 2 for engagement date selector", () => {
    ["tier1", "PREMIUM 2", "premium-2"].forEach((tier) => {
      expect(isPremiumTierAllowedForEngagementDate(tier)).toBe(true);
    });
    ["premium3", "basic", "standard"].forEach((tier) => {
      expect(isPremiumTierAllowedForEngagementDate(tier)).toBe(false);
    });
    expect(ALLOWED_ENGAGEMENT_DATE_TIERS).toEqual(["tier1", "tier2"]);
  });

  it("rejects non-premium tiers", () => {
    expect(isPremiumTierAllowedForAnev("free")).toBe(false);
    expect(isPremiumTierAllowedForAnev("premium4")).toBe(false);
  });
});
