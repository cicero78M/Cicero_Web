import {
  ALLOWED_PREMIUM_ANEV_TIERS,
  ALLOWED_ENGAGEMENT_DATE_TIERS,
  isPremiumTierAllowedForAnev,
  isPremiumTierAllowedForEngagementDate,
  normalizePremiumTier,
} from "@/utils/premium";

describe("premium utils", () => {
  it("normalizes tier strings by lowering case and removing separators", () => {
    expect(normalizePremiumTier("Premium 1")).toBe("premium1");
    expect(normalizePremiumTier("PREMIUM_2")).toBe("premium2");
    expect(normalizePremiumTier("premium-3")).toBe("premium3");
  });

  it("allows premium tiers 1, 2, and 3 after normalization", () => {
    const allowed = ["premium 1", "Premium_2", "PREMIUM-3"];
    const results = allowed.map((tier) => isPremiumTierAllowedForAnev(tier));

    expect(results).toEqual([true, true, true]);
    expect(ALLOWED_PREMIUM_ANEV_TIERS).toEqual(["premium1", "premium2", "premium3"]);
  });

  it("allows only premium 1 and 2 for engagement date selector", () => {
    ["premium1", "PREMIUM 2", "premium-2"].forEach((tier) => {
      expect(isPremiumTierAllowedForEngagementDate(tier)).toBe(true);
    });
    ["premium3", "basic", "standard"].forEach((tier) => {
      expect(isPremiumTierAllowedForEngagementDate(tier)).toBe(false);
    });
    expect(ALLOWED_ENGAGEMENT_DATE_TIERS).toEqual(["premium1", "premium2"]);
  });

  it("rejects non-premium tiers", () => {
    expect(isPremiumTierAllowedForAnev("free")).toBe(false);
    expect(isPremiumTierAllowedForAnev("premium4")).toBe(false);
  });
});
