import { normalizeNumericInput } from "@/app/executive-summary/page";

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
