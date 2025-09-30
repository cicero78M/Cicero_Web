import { mergeAvailableMonthOptions } from "../app/executive-summary/page";

describe("mergeAvailableMonthOptions", () => {
  it("keeps earlier months of the current year selectable when the actual year exceeds the resolved year", () => {
    const availableYears = [2023, 2024];
    const options = mergeAvailableMonthOptions({
      availableYears,
      locale: "id-ID",
      now: new Date("2025-03-18T00:00:00Z"),
    });

    const optionKeys = options.map((option) => option.key);

    expect(optionKeys[0]).toBe("2025-03");
    expect(optionKeys).toContain("2025-02");
    expect(optionKeys).toContain("2025-01");
    expect(new Set(optionKeys).size).toBe(optionKeys.length);
    expect(optionKeys[optionKeys.length - 1]).toBe("2023-01");
  });
});
