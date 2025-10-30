import {
  aggregateWeeklyLikesRecords,
  mergeWeeklyActivityRecords,
} from "../lib/dataTransforms";

describe("weekly report data transforms", () => {
  it("aggregates komentar and comments personil metrics", () => {
    const commentRecords = [
      {
        client_id: "CL-1",
        nama_client: "Client One",
        personil: { user_id: "user-1", nama: "Officer One" },
        rekap: {
          komentar_personil: 4,
        },
      },
      {
        client_id: "CL-1",
        nama_client: "Client One",
        personil: { user_id: "user-1", nama: "Officer One" },
        metrics: {
          comments_personil: 3,
        },
      },
    ];

    const mergedRecords = mergeWeeklyActivityRecords([], commentRecords);
    const summary = aggregateWeeklyLikesRecords(mergedRecords);

    expect(summary.totals.totalComments).toBe(7);
    expect(summary.clients).toHaveLength(1);
    expect(summary.clients[0].totalComments).toBe(7);
    expect(summary.topPersonnel[0].comments).toBe(7);
  });
});
