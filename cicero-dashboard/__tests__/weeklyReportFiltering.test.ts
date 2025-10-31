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

  it("retains records with matching client_id regardless of role value", () => {
    const records = [
      { client_id: "DITBINMAS", role: "Operator Ditbinmas" },
      { client_id: "DITBINMAS", role: "Admin" },
      { client_id: "DITBINMAS", role_name: "Ditbinmas" },
      { client_id: "DITBINMAS", user_role: "Non Ditbinmas" },
    ];

    const result = filterDitbinmasRecords(records);

    expect(result).toHaveLength(4);
  });

  it("excludes records whose client_id does not match the requested scope", () => {
    const records = [
      { client_id: "DITBINMAS", role: "Ditbinmas" },
      { client_id: "CLIENT_X", role: "Operator Ditbinmas" },
      { client_id: "CLIENT_Y", role_name: "Ditbinmas" },
    ];

    const result = filterDitbinmasRecords(records);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ client_id: "DITBINMAS" }));
  });

  it("limits matches to the provided client scope when specified", () => {
    const records = [
      { client_id: "DITBINMAS", role: "Ditbinmas" },
      { client_id: "POLDA_JATIM", role: "Operator Ditbinmas" },
      { client_id: "POLDA JATIM", role_name: "Ditbinmas" },
      { client_id: "POLDA_JABAR", role: "Ditbinmas" },
    ];

    const result = filterDitbinmasRecords(records, { clientScope: "polda_jatim" });

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ client_id: "POLDA_JATIM" }),
        expect.objectContaining({ client_id: "POLDA JATIM" }),
      ]),
    );
  });

  it("treats generic Ditbinmas scope as a parent that keeps descendant satker records", () => {
    const records = [
      {
        client_id: "NGAWI",
        client_name: "Sat Binmas Ngawi",
        parent_client_id: "DITBINMAS",
        target_clients: ["Ditbinmas"],
      },
      {
        client_id: "LAMONGAN",
        client_name: "Sat Binmas Lamongan",
        parent_client: "DITBINMAS",
      },
      { client_id: "POLDA_JABAR", client_name: "Sat Binmas Jabar" },
    ];

    const result = filterDitbinmasRecords(records, { clientScope: "DITBINMAS" });

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ client_id: "NGAWI" }),
        expect.objectContaining({ client_id: "LAMONGAN" }),
      ]),
    );
  });

  it("matches specific client scopes through client name aliases", () => {
    const records = [
      {
        client_id: "POLDA_JATIM",
        client_name: "Polda Jatim",
        role: "Operator Ditbinmas",
      },
      {
        client_id: "POLDA_JATIM",
        clientName: "Sat Binmas Jawa Timur",
        role: "Admin Ditbinmas",
      },
      {
        client_id: "POLDA_JABAR",
        client_name: "Polda Jabar",
        role: "Operator Ditbinmas",
      },
    ];

    const result = filterDitbinmasRecords(records, {
      clientScope: "Sat Binmas Jawa Timur",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({ client_id: "POLDA_JATIM", clientName: "Sat Binmas Jawa Timur" }),
    );
  });
});
