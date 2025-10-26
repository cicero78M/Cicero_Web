import { filterDitbinmasRecords } from "@/app/weekly-report/WeeklyReportPageClient";

describe("filterDitbinmasRecords", () => {
  it("keeps records that match Ditbinmas across multiple property names", () => {
    const baseRole = { role: "Ditbinmas" };
    const records = [
      { clientID: "Ditbinmas", ...baseRole },
      { clientid: " ditbinmas  ", ...baseRole },
      { id_client: "DITBINMAS", ...baseRole },
      { idClient: "ditbinmas", ...baseRole },
      { client_code: "ditbinmas", ...baseRole },
      { name: "  DitBinMas  ", ...baseRole },
      { client: { name: "ditbinmas" }, ...baseRole },
      { client_id: "Other", ...baseRole },
    ];

    const result = filterDitbinmasRecords(records);

    expect(result).toHaveLength(7);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clientID: "Ditbinmas" }),
        expect.objectContaining({ clientid: " ditbinmas  " }),
        expect.objectContaining({ id_client: "DITBINMAS" }),
        expect.objectContaining({ idClient: "ditbinmas" }),
        expect.objectContaining({ client_code: "ditbinmas" }),
        expect.objectContaining({ name: "  DitBinMas  " }),
        expect.objectContaining({ client: { name: "ditbinmas" } }),
      ]),
    );
  });

  it("filters out records that do not match Ditbinmas", () => {
    const records = [
      { client_id: "other", role: "Ditbinmas" },
      { name: "not ditbinmas", role: "Ditbinmas" },
      { unrelated: "value", role: "ditbinmas" },
    ];

    const result = filterDitbinmasRecords(records);

    expect(result).toHaveLength(0);
  });

  it("accepts Ditbinmas aliases with whitespace, dashes, and underscores", () => {
    const records = [
      { client_name: "Dit Binmas", user_role: "Ditbinmas" },
      { clientName: "DIT-BINMAS", userRole: "dit bin mas" },
      { clientCode: "dit_binmas", roles: ["DITBINMAS"] },
      { client_id: "dit bin mas", roleName: "dit-binmas" },
    ];

    const result = filterDitbinmasRecords(records);

    expect(result).toHaveLength(4);
  });

  it("filters out records whose role does not include Ditbinmas", () => {
    const records = [
      { client_id: "DITBINMAS", role: "Operator Ditbinmas" },
      { client_id: "DITBINMAS", role: "Admin" },
      { client_id: "DITBINMAS", role_name: "Ditbinmas" },
      { client_id: "DITBINMAS", user_role: "Non Ditbinmas" },
    ];

    const result = filterDitbinmasRecords(records);

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "Operator Ditbinmas" }),
        expect.objectContaining({ role_name: "Ditbinmas" }),
      ]),
    );
  });
});
