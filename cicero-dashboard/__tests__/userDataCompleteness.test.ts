import {
  isUserDataComplete,
  isUserDataIncomplete,
  shouldExcludeUser,
  filterExcludedUsers,
  categorizeUsers,
  getUserDataStats,
} from "@/utils/userDataCompleteness";

describe("userDataCompleteness", () => {
  const completeUser = {
    id: "1",
    nama: "User Complete",
    nrp_nip: "12345",
    instagram_username: "user_ig",
    tiktok_username: "user_tk",
    satfung: "BAG SUMDA",
    client_id: "DITLANTAS",
  };

  const incompleteUser = {
    id: "2",
    nama: "User Incomplete",
    nrp_nip: "67890",
    instagram_username: "user2_ig",
    tiktok_username: "",
    satfung: "SAT RESKRIM",
    client_id: "DITLANTAS",
  };

  const excludedUser = {
    id: "3",
    nama: "User Excluded",
    nrp_nip: "11111",
    instagram_username: "user3_ig",
    tiktok_username: "user3_tk",
    satfung: "SAT INTELKAM",
    client_id: "DIREKTORAT",
  };

  describe("isUserDataComplete", () => {
    it("returns true for user with both usernames", () => {
      expect(isUserDataComplete(completeUser)).toBe(true);
    });

    it("returns false for user missing TikTok username", () => {
      expect(isUserDataComplete(incompleteUser)).toBe(false);
    });

    it("returns false for user missing Instagram username", () => {
      const user = { ...completeUser, instagram_username: "" };
      expect(isUserDataComplete(user)).toBe(false);
    });

    it("returns false for user missing both usernames", () => {
      const user = { ...completeUser, instagram_username: "", tiktok_username: "" };
      expect(isUserDataComplete(user)).toBe(false);
    });
  });

  describe("isUserDataIncomplete", () => {
    it("returns false for user with both usernames", () => {
      expect(isUserDataIncomplete(completeUser)).toBe(false);
    });

    it("returns true for user missing TikTok username", () => {
      expect(isUserDataIncomplete(incompleteUser)).toBe(true);
    });

    it("returns true for user missing Instagram username", () => {
      const user = { ...completeUser, instagram_username: "" };
      expect(isUserDataIncomplete(user)).toBe(true);
    });

    it("returns true for user missing both usernames", () => {
      const user = { ...completeUser, instagram_username: "", tiktok_username: "" };
      expect(isUserDataIncomplete(user)).toBe(true);
    });
  });

  describe("shouldExcludeUser", () => {
    it("returns true for SAT INTELKAM + DIREKTORAT user", () => {
      expect(shouldExcludeUser(excludedUser)).toBe(true);
    });

    it("returns false for SAT INTELKAM + non-DIREKTORAT user", () => {
      const user = { ...excludedUser, client_id: "DITLANTAS" };
      expect(shouldExcludeUser(user)).toBe(false);
    });

    it("returns false for non-SAT INTELKAM + DIREKTORAT user", () => {
      const user = { ...excludedUser, satfung: "BAG SUMDA" };
      expect(shouldExcludeUser(user)).toBe(false);
    });

    it("returns false for regular user", () => {
      expect(shouldExcludeUser(completeUser)).toBe(false);
    });

    it("handles case insensitive matching", () => {
      const user = { ...excludedUser, satfung: "sat intelkam", client_id: "direktorat" };
      expect(shouldExcludeUser(user)).toBe(true);
    });
  });

  describe("filterExcludedUsers", () => {
    it("removes SAT INTELKAM + DIREKTORAT users", () => {
      const users = [completeUser, incompleteUser, excludedUser];
      const filtered = filterExcludedUsers(users);
      expect(filtered).toHaveLength(2);
      expect(filtered).toContain(completeUser);
      expect(filtered).toContain(incompleteUser);
      expect(filtered).not.toContain(excludedUser);
    });

    it("returns all users if none are excluded", () => {
      const users = [completeUser, incompleteUser];
      const filtered = filterExcludedUsers(users);
      expect(filtered).toHaveLength(2);
    });

    it("returns empty array for empty input", () => {
      const filtered = filterExcludedUsers([]);
      expect(filtered).toHaveLength(0);
    });
  });

  describe("categorizeUsers", () => {
    it("categorizes users correctly", () => {
      const users = [completeUser, incompleteUser, excludedUser];
      const categories = categorizeUsers(users);
      
      expect(categories.semua).toHaveLength(2);
      expect(categories.lengkap).toHaveLength(1);
      expect(categories.kurang).toHaveLength(1);
      
      expect(categories.lengkap[0]).toEqual(completeUser);
      expect(categories.kurang[0]).toEqual(incompleteUser);
    });

    it("excludes SAT INTELKAM + DIREKTORAT users from all categories", () => {
      const users = [excludedUser];
      const categories = categorizeUsers(users);
      
      expect(categories.semua).toHaveLength(0);
      expect(categories.lengkap).toHaveLength(0);
      expect(categories.kurang).toHaveLength(0);
    });
  });

  describe("getUserDataStats", () => {
    it("calculates statistics correctly", () => {
      const users = [completeUser, incompleteUser, excludedUser];
      const stats = getUserDataStats(users);
      
      expect(stats.total).toBe(2); // excludedUser not counted
      expect(stats.lengkap).toBe(1);
      expect(stats.kurang).toBe(1);
      expect(stats.lengkapPercent).toBe(50);
      expect(stats.kurangPercent).toBe(50);
    });

    it("handles empty user list", () => {
      const stats = getUserDataStats([]);
      
      expect(stats.total).toBe(0);
      expect(stats.lengkap).toBe(0);
      expect(stats.kurang).toBe(0);
      expect(stats.lengkapPercent).toBe(0);
      expect(stats.kurangPercent).toBe(0);
    });

    it("handles all complete users", () => {
      const users = [completeUser, { ...completeUser, id: "4" }];
      const stats = getUserDataStats(users);
      
      expect(stats.total).toBe(2);
      expect(stats.lengkap).toBe(2);
      expect(stats.kurang).toBe(0);
      expect(stats.lengkapPercent).toBe(100);
      expect(stats.kurangPercent).toBe(0);
    });

    it("handles all incomplete users", () => {
      const users = [incompleteUser, { ...incompleteUser, id: "5" }];
      const stats = getUserDataStats(users);
      
      expect(stats.total).toBe(2);
      expect(stats.lengkap).toBe(0);
      expect(stats.kurang).toBe(2);
      expect(stats.lengkapPercent).toBe(0);
      expect(stats.kurangPercent).toBe(100);
    });
  });
});
