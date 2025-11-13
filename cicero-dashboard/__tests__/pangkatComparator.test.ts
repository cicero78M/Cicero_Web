import { compareUsersByPangkatAndNrp } from "@/utils/pangkat";

describe("compareUsersByPangkatAndNrp", () => {
  const baseUser = {
    jabatan: "KABAG", // placeholder with lower priority value
    title: "KOMPOL",
    pangkat: "KOMPOL",
    nama: "",
  };

  function createUser(overrides: Record<string, unknown>) {
    return { ...baseUser, ...overrides };
  }

  it("sorts KOMPOL users by their numeric NRP when otherwise equal", () => {
    const users = [
      createUser({ nama: "User 80", user_id: "80.123", nrp: "80.123" }),
      createUser({ nama: "User 70", user_id: "70.123", nrp: "70.123" }),
    ];

    const sorted = [...users].sort(compareUsersByPangkatAndNrp);

    expect(sorted.map((user) => user.user_id)).toEqual(["70.123", "80.123"]);
  });

  it("preserves numeric ordering when filtering only DITBINMAS users", () => {
    const users = [
      createUser({
        nama: "User 80",
        user_id: "80.123",
        nrp: "80.123",
        client_id: "DITBINMAS",
      }),
      createUser({
        nama: "User 70",
        user_id: "70.123",
        nrp: "70.123",
        client_id: "DITBINMAS",
      }),
      createUser({
        nama: "User Lain",
        user_id: "90.555",
        nrp: "90.555",
        client_id: "LAINNYA",
      }),
    ];

    const sorted = [...users].sort(compareUsersByPangkatAndNrp);
    const ditbinmasOnly = sorted.filter(
      (user) => String(user.client_id || "").toUpperCase() === "DITBINMAS",
    );

    expect(ditbinmasOnly.map((user) => user.user_id)).toEqual(["70.123", "80.123"]);
  });
});
