import {
  aggregateWeeklyLikesRecords,
  mergeWeeklyActivityRecords,
} from "@/app/weekly-report/lib/dataTransforms";
import {
  filterDitbinmasRecords,
  resolveDitbinmasDirectoryUsers,
} from "@/app/weekly-report/WeeklyReportPageClient";

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

  it("merges directory placeholders with activity records for the same personnel", () => {
    const directoryUsers = [
      {
        client_id: "DITBINMAS",
        divisi: "Subbagrenmin",
        nama: "Aipda Fatkur Rohman, S.E.",
      },
    ];

    const records = [
      {
        client_id: "DITBINMAS",
        divisi: "Subbagrenmin",
        nama: "Aipda Fatkur Rohman, S.E.",
        instagram_username: "fatkurrohmanse",
        jumlah_like: 10,
        jumlah_komentar: 5,
      },
    ];

    const summary = aggregateWeeklyLikesRecords(records, { directoryUsers });

    expect(summary.totals.totalPersonnel).toBe(1);
    expect(summary.totals.activePersonnel).toBe(1);
    expect(summary.clients).toHaveLength(1);
    expect(summary.clients[0].personnel).toHaveLength(1);
    expect(summary.clients[0].personnel[0]).toEqual(
      expect.objectContaining({
        nama: "Aipda Fatkur Rohman, S.E.",
        username: "fatkurrohmanse",
        likes: 10,
        comments: 5,
        active: true,
      }),
    );
  });

  it("merges personnel identities that differ only by punctuation", () => {
    const directoryUsers = [
      {
        client_id: "DITBINMAS",
        divisi: "Subbagrenmin",
        nama: "Aipda Fatkur Rohman, S.E.",
      },
    ];

    const records = [
      {
        client_id: "DITBINMAS",
        divisi: "Subbagrenmin",
        nama: "Aipda Fatkur Rohman, S.E",
        instagram_username: "fatkurrohmanse",
        jumlah_like: 8,
        jumlah_komentar: 3,
      },
    ];

    const summary = aggregateWeeklyLikesRecords(records, { directoryUsers });

    expect(summary.totals.totalPersonnel).toBe(1);
    expect(summary.clients).toHaveLength(1);
    expect(summary.clients[0].personnel).toHaveLength(1);
    expect(summary.clients[0].personnel[0]).toEqual(
      expect.objectContaining({
        nama: "Aipda Fatkur Rohman, S.E.",
        username: "fatkurrohmanse",
        likes: 8,
        comments: 3,
      }),
    );
    expect(summary.totals.totalLikes).toBe(8);
    expect(summary.totals.totalComments).toBe(3);
  });

  it("deduplicates Ditbinmas personnel when directory entries lack client identifiers", () => {
    const rawDirectoryUsers = [
      {
        divisi: "Subbagrenmin",
        nama: "Aipda Fatkur Rohman, S.E.",
        nrp: "66030339",
      },
    ];

    const weeklyRecords = [
      {
        client_id: "DITBINMAS",
        divisi: "Subbagrenmin",
        nama: "Aipda Fatkur Rohman, S.E.",
        instagram_username: "fatkurrohmanse",
        jumlah_like: 6,
        jumlah_komentar: 1,
      },
      {
        client_id: "DITBINMAS",
        divisi: "Subbagrenmin",
        nama: "Aipda Fatkur Rohman, S.E.",
        instagram_username: "fatkurrohmanse",
        jumlah_like: 4,
        jumlah_komentar: 2,
      },
    ];

    const normalizedDirectoryUsers = resolveDitbinmasDirectoryUsers(rawDirectoryUsers);

    expect(normalizedDirectoryUsers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          client_id: "DITBINMAS",
          clientId: "DITBINMAS",
          client: "DITBINMAS",
        }),
      ]),
    );

    const summary = aggregateWeeklyLikesRecords(weeklyRecords, {
      directoryUsers: normalizedDirectoryUsers,
    });

    expect(summary.clients).toHaveLength(1);
    expect(summary.clients[0]).toEqual(
      expect.objectContaining({
        clientId: "DITBINMAS",
        divisi: "Subbagrenmin",
        totalLikes: 10,
        totalComments: 3,
      }),
    );

    expect(summary.clients[0].personnel).toHaveLength(1);
    expect(summary.clients[0].personnel[0]).toEqual(
      expect.objectContaining({
        nama: "Aipda Fatkur Rohman, S.E.",
        likes: 10,
        comments: 3,
        active: true,
      }),
    );
  });

  it("retains Ditbinmas personnel across mixed client identifiers", () => {
    const rawDirectoryUsers = [
      {
        user_id: "user-1",
        client_id: "DITBINMAS",
        divisi: "Satfung Alfa",
        role: "admin ditbinmas",
        nama: "Person Alfa",
      },
      {
        user_id: "user-2",
        client_id: "CLIENT_X",
        divisi: "Satfung Bravo",
        role: "Operator Ditbinmas",
        nama: "Person Bravo",
      },
      {
        user_id: "user-3",
        client_id: "CLIENT_Y",
        divisi: "Satfung Charlie",
        target_clients: ["DITBINMAS"],
        nama: "Person Charlie",
      },
    ];

    const weeklyRecords = [
      {
        client_id: "DITBINMAS",
        divisi: "Satfung Alfa",
        nama: "Person Alfa",
        jumlah_like: 6,
        jumlah_komentar: 1,
      },
      {
        client_id: "CLIENT_X",
        divisi: "Satfung Bravo",
        nama: "Person Bravo",
        jumlah_like: 4,
        jumlah_komentar: 2,
      },
    ];

    const normalizedDirectoryUsers = resolveDitbinmasDirectoryUsers(rawDirectoryUsers);

    expect(normalizedDirectoryUsers).toHaveLength(3);
    expect(normalizedDirectoryUsers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ user_id: "user-1", client_id: "DITBINMAS" }),
        expect.objectContaining({ user_id: "user-2", client_id: "CLIENT_X" }),
        expect.objectContaining({ user_id: "user-3", client_id: "CLIENT_Y" }),
      ]),
    );

    const summary = aggregateWeeklyLikesRecords(weeklyRecords, {
      directoryUsers: normalizedDirectoryUsers,
    });

    expect(summary.totals.totalPersonnel).toBe(3);
    expect(summary.totals.activePersonnel).toBe(2);
    expect(summary.totals.complianceRate).toBeCloseTo((2 / 3) * 100, 5);
    expect(summary.clients).toHaveLength(3);
    expect(summary.clients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientId: "DITBINMAS",
          clientName: "Satfung Alfa",
          totalLikes: 6,
          totalComments: 1,
          totalPersonnel: 1,
          activePersonnel: 1,
        }),
        expect.objectContaining({
          clientId: "CLIENT_X",
          clientName: "Satfung Bravo",
          totalLikes: 4,
          totalComments: 2,
          totalPersonnel: 1,
          activePersonnel: 1,
        }),
        expect.objectContaining({
          clientId: "CLIENT_Y",
          clientName: "Satfung Charlie",
          totalLikes: 0,
          totalComments: 0,
          totalPersonnel: 1,
          activePersonnel: 0,
        }),
      ]),
    );
  });
});
