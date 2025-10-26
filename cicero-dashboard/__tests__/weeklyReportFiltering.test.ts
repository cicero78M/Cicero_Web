import { filterDitbinmasRecords } from "@/app/weekly-report/WeeklyReportPageClient";

describe("filterDitbinmasRecords", () => {
  it("keeps records that match Ditbinmas across multiple property names", () => {
    const records = [
      { clientID: "Ditbinmas" },
      { clientid: " ditbinmas  " },
      { id_client: "DITBINMAS" },
      { idClient: "ditbinmas" },
      { client_code: "ditbinmas" },
      { name: "  DitBinMas  " },
      { client: { name: "ditbinmas" } },
      { client_id: "Other" },
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
      { client_id: "other" },
      { name: "not ditbinmas" },
      { unrelated: "value" },
    ];

    const result = filterDitbinmasRecords(records);

    expect(result).toHaveLength(0);
  });

  it("accepts Ditbinmas aliases with whitespace, dashes, and underscores", () => {
    const records = [
      { client_name: "Dit Binmas" },
      { clientName: "DIT-BINMAS" },
      { clientCode: "dit_binmas" },
      { client_id: "dit bin mas" },
    ];

    const result = filterDitbinmasRecords(records);

    expect(result).toHaveLength(4);
  });
});
