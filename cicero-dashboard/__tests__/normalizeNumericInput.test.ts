import {
  normalizeNumericInput,
  calculateRatePerDay,
} from "@/lib/normalizeNumericInput";

describe("normalizeNumericInput", () => {
  it("parses dot thousand separators", () => {
    expect(normalizeNumericInput("1.234")).toBe(1234);
  });

  it("parses European formatted decimals", () => {
    expect(normalizeNumericInput("1.234,56")).toBeCloseTo(1234.56);
  });

  it("parses US formatted decimals", () => {
    expect(normalizeNumericInput("1,234.56")).toBeCloseTo(1234.56);
  });
});

describe("calculateRatePerDay", () => {
  it("returns zero when days is zero", () => {
    expect(calculateRatePerDay(120, 0)).toBe(0);
  });

  it("computes average rate per day", () => {
    expect(calculateRatePerDay(210, 7)).toBe(30);
  });

  it("accepts formatted inputs and precision", () => {
    expect(calculateRatePerDay("1.200", "10", { precision: 2 })).toBe(120);
  });
});
