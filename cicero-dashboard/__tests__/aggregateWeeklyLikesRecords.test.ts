import {
  aggregateWeeklyLikesRecords,
  mergeWeeklyActivityRecords,
} from "@/app/weekly-report/lib/dataTransforms";
import { filterDitbinmasRecords } from "@/app/weekly-report/WeeklyReportPageClient";

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

  it("retains metrics for records whose client details exist only inside rekap", () => {
    const likesRecords = [
      {
        rekap: {
          client_id: "DITBINMAS",
          client_name: "Satfung C",
          total_like: 7,
        },
      },
    ];

    const commentRecords = [
      {
        rekap: {
          client_id: "DITBINMAS",
          client_name: "Satfung C",
          total_komentar: 3,
        },
      },
    ];

    const mergedRecords = mergeWeeklyActivityRecords(likesRecords, commentRecords);
    expect(mergedRecords).toHaveLength(1);
    expect(mergedRecords[0]).toEqual(
      expect.objectContaining({
        client_id: "DITBINMAS",
        client_name: "Satfung C",
        total_like: 7,
        total_komentar: 3,
      }),
    );

    const filteredRecords = filterDitbinmasRecords(mergedRecords);
    expect(filteredRecords).toHaveLength(1);

    const summary = aggregateWeeklyLikesRecords(filteredRecords);

    expect(summary.totals.totalLikes).toBe(7);
    expect(summary.totals.totalComments).toBe(3);
    expect(summary.clients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientId: "DITBINMAS",
          clientName: "Satfung C",
          totalLikes: 7,
          totalComments: 3,
        }),
      ]),
    );
  });
});
