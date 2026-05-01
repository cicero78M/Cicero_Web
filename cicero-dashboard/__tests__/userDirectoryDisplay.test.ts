import { getUserJabatan, getUserPolres } from "@/utils/userDirectoryDisplay";

describe("userDirectoryDisplay", () => {
  it("reads polres from primary field", () => {
    expect(getUserPolres({ nama_polres: "Polres A" })).toBe("Polres A");
  });

  it("falls back polres to client label fields", () => {
    expect(getUserPolres({ client_name: "Polres B" })).toBe("Polres B");
    expect(getUserPolres({ nama_client: "Polres C" })).toBe("Polres C");
    expect(getUserPolres({ client_label: "Polres D" })).toBe("Polres D");
  });

  it("reads jabatan from variants", () => {
    expect(getUserJabatan({ jabatan: "Kanit" })).toBe("Kanit");
    expect(getUserJabatan({ nama_jabatan: "Kasat" })).toBe("Kasat");
    expect(getUserJabatan({ job_title: "Operator" })).toBe("Operator");
  });

  it("returns empty string when missing", () => {
    expect(getUserPolres({})).toBe("");
    expect(getUserJabatan({})).toBe("");
  });
});
