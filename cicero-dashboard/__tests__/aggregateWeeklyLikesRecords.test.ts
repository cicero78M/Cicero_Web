import { aggregateWeeklyLikesRecords } from "@/app/weekly-report/lib/dataTransforms";

describe("aggregateWeeklyLikesRecords", () => {
  it("creates separate clients for Ditbinmas satfung with different divisi", () => {
    const records = [
      {
        client_id: "DITBINMAS",
        divisi: "Satfung A",
        nama: "Person A",
        jumlah_like: 5,
        jumlah_komentar: 2,
      },
      {
        client_id: "DITBINMAS",
        divisi: "Satfung B",
        nama: "Person B",
        jumlah_like: 3,
        jumlah_komentar: 1,
      },
    ];

    const result = aggregateWeeklyLikesRecords(records);

    expect(result.clients).toHaveLength(2);
    expect(result.clients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: expect.stringContaining("DITBINMAS::SATFUNG A"),
          clientName: "Satfung A",
          divisi: "Satfung A",
          totalLikes: 5,
          totalComments: 2,
        }),
        expect.objectContaining({
          key: expect.stringContaining("DITBINMAS::SATFUNG B"),
          clientName: "Satfung B",
          divisi: "Satfung B",
          totalLikes: 3,
          totalComments: 1,
        }),
      ]),
    );

    expect(result.totals.totalClients).toBe(2);
    expect(result.topPersonnel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ clientName: "Satfung A", likes: 5 }),
        expect.objectContaining({ clientName: "Satfung B", likes: 3 }),
      ]),
    );
  });
});
