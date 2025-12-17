import { clampEngagementCompleted, getEngagementStatus } from "@/utils/engagementStatus";

describe("engagementStatus helpers", () => {
  it("caps completed actions so they never exceed the available target", () => {
    expect(clampEngagementCompleted({ completed: 7, totalTarget: 5 })).toBe(5);
    expect(clampEngagementCompleted({ completed: 3, totalTarget: 0 })).toBe(0);
    expect(clampEngagementCompleted({ completed: -2, totalTarget: 4 })).toBe(0);
  });

  it("still reports selesai even when the raw count is above the target", () => {
    expect(getEngagementStatus({ completed: 10, totalTarget: 3 })).toBe("sudah");
  });
});
