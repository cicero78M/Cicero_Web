import {
  extractClientOptions,
  filterUsersByClientId,
} from "@/utils/directorateClientSelector";

describe("directorateClientSelector", () => {
  describe("extractClientOptions", () => {
    it("should extract unique client options from users", () => {
      const users = [
        { client_id: "CLIENT_A", nama_client: "Client A" },
        { client_id: "CLIENT_B", nama_client: "Client B" },
        { client_id: "CLIENT_A", nama_client: "Client A" }, // duplicate
      ];

      const result = extractClientOptions(users);

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([
          { client_id: "CLIENT_A", nama_client: "Client A" },
          { client_id: "CLIENT_B", nama_client: "Client B" },
        ])
      );
    });

    it("should handle different field name variations", () => {
      const users = [
        { clientId: "CLIENT_A", client_name: "Client A" },
        { clientID: "CLIENT_B", client: "Client B" },
        { client: "CLIENT_C", nama_client: "Client C" },
      ];

      const result = extractClientOptions(users);

      expect(result).toHaveLength(3);
    });

    it("should sort clients by name", () => {
      const users = [
        { client_id: "CLIENT_C", nama_client: "Zebra" },
        { client_id: "CLIENT_A", nama_client: "Alpha" },
        { client_id: "CLIENT_B", nama_client: "Beta" },
      ];

      const result = extractClientOptions(users);

      expect(result[0].nama_client).toBe("Alpha");
      expect(result[1].nama_client).toBe("Beta");
      expect(result[2].nama_client).toBe("Zebra");
    });

    it("should handle empty array", () => {
      const result = extractClientOptions([]);
      expect(result).toEqual([]);
    });

    it("should handle users with empty client_id", () => {
      const users = [
        { client_id: "", nama_client: "Empty" },
        { client_id: "CLIENT_A", nama_client: "Client A" },
      ];

      const result = extractClientOptions(users);

      expect(result).toHaveLength(1);
      expect(result[0].client_id).toBe("CLIENT_A");
    });

    it("should use client_id as name fallback", () => {
      const users = [{ client_id: "CLIENT_A" }];

      const result = extractClientOptions(users);

      expect(result).toHaveLength(1);
      expect(result[0].nama_client).toBe("CLIENT_A");
    });


    it("should fallback to unique satker identifiers when directorate labels are generic and duplicated", () => {
      const users = [
        { client_id: "POLDA_LAMPUNG", nama_client: "DIREKTORAT INTELKAM" },
        { client_id: "POLDA_JATIM", nama_client: "DIREKTORAT INTELKAM" },
        { client_id: "POLDA_JABAR", nama_client: "DIREKTORAT INTELKAM" },
      ];

      const result = extractClientOptions(users);

      expect(result).toEqual([
        { client_id: "POLDA_JABAR", nama_client: "POLDA_JABAR" },
        { client_id: "POLDA_JATIM", nama_client: "POLDA_JATIM" },
        { client_id: "POLDA_LAMPUNG", nama_client: "POLDA_LAMPUNG" },
      ]);
    });
    it("should not use client field as name when it contains role information", () => {
      const users = [
        { client_id: "POLDA_LAMPUNG", client: "DIREKTORAT INTELKAM" },
        { client_id: "POLDA_JATIM", client: "DIREKTORAT INTELKAM" },
      ];

      const result = extractClientOptions(users);

      expect(result).toHaveLength(2);
      // Should use client_id as fallback, not the client field with role info
      expect(result[0].nama_client).toBe("POLDA_JATIM");
      expect(result[1].nama_client).toBe("POLDA_LAMPUNG");
    });
  });

  describe("filterUsersByClientId", () => {
    const users = [
      { client_id: "CLIENT_A", nama: "User 1" },
      { client_id: "CLIENT_B", nama: "User 2" },
      { client_id: "CLIENT_A", nama: "User 3" },
    ];

    it("should filter users by client_id", () => {
      const result = filterUsersByClientId(users, "CLIENT_A");

      expect(result).toHaveLength(2);
      expect(result[0].nama).toBe("User 1");
      expect(result[1].nama).toBe("User 3");
    });

    it("should return all users when selectedClientId is empty", () => {
      const result = filterUsersByClientId(users, "");

      expect(result).toHaveLength(3);
    });

    it("should return empty array when no matching client_id", () => {
      const result = filterUsersByClientId(users, "CLIENT_C");

      expect(result).toHaveLength(0);
    });

    it("should handle different field name variations", () => {
      const usersVariations = [
        { clientId: "CLIENT_A", nama: "User 1" },
        { clientID: "CLIENT_A", nama: "User 2" },
        { client: "CLIENT_A", nama: "User 3" },
      ];

      const result = filterUsersByClientId(usersVariations, "CLIENT_A");

      expect(result).toHaveLength(3);
    });

    it("should trim client_id values", () => {
      const usersWithSpaces = [
        { client_id: " CLIENT_A ", nama: "User 1" },
        { client_id: "CLIENT_A", nama: "User 2" },
      ];

      const result = filterUsersByClientId(usersWithSpaces, "CLIENT_A");

      expect(result).toHaveLength(2);
    });
  });
});
