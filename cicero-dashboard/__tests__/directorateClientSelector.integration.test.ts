import {
  extractClientOptions,
  normalizeClientId,
  normalizeUsersWithClientLabel,
} from "@/utils/directorateClientSelector";

describe("directorate selector parity across pages", () => {
  const payload = [
    { client_id: "POLDA_JABAR", nama_client: "DIREKTORAT BINMAS" },
    { client_id: "POLDA_JABAR", client_name: "Polres Bandung" },
    { client_id: "POLDA_JATIM", nama_client: "DIREKTORAT BINMAS" },
    { client_id: "POLDA_BALI", client_name: "Polresta Denpasar" },
    { client_id: "POLDA_JATIM", nama_client: "DIREKTORAT BINMAS" },
  ];

  function usersPagePipeline(users: Array<Record<string, unknown>>) {
    const fallbackNameByClientId = {
      POLDA_JABAR: "Polres Bandung",
      POLDA_JATIM: "Polres Surabaya",
      POLDA_BALI: "Polresta Denpasar",
    };
    const normalizedUsers = normalizeUsersWithClientLabel(users, {
      fallbackNameByClientId,
    });
    const options = extractClientOptions(normalizedUsers, {
      fallbackNameByClientId,
    });
    return { normalizedUsers, options };
  }

  function userInsightPipeline(users: Array<Record<string, unknown>>) {
    const fallbackNameByClientId = {
      [normalizeClientId(users[0])]: "Polres Bandung",
      POLDA_JATIM: "Polres Surabaya",
      POLDA_BALI: "Polresta Denpasar",
    };
    const normalizedUsers = normalizeUsersWithClientLabel(users, {
      fallbackNameByClientId,
    });
    const options = extractClientOptions(normalizedUsers, {
      fallbackNameByClientId,
    });
    return { normalizedUsers, options };
  }

  it("returns the same selector options for identical payloads", () => {
    const usersResult = usersPagePipeline(payload);
    const insightResult = userInsightPipeline(payload);

    expect(usersResult.options).toEqual(insightResult.options);
    expect(usersResult.options).toEqual([
      { client_id: "POLDA_JABAR", nama_client: "Polres Bandung" },
      { client_id: "POLDA_JATIM", nama_client: "Polres Surabaya" },
      { client_id: "POLDA_BALI", nama_client: "Polresta Denpasar" },
    ]);
  });
});
