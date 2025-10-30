import {
  aggregateWeeklyLikesRecords,
  countUniquePersonnelRecords,
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
        expect.objectContaining({
          clientName: "Satfung A",
          likes: 5,
        }),
        expect.objectContaining({
          clientName: "Satfung B",
          likes: 3,
        }),
      ]),
    );
  });

  it("prefers satfung identifiers when divisi is generic", () => {
    const records = [
      {
        client_id: "DITBINMAS",
        divisi: "Direktorat Binmas",
        satfung: "Satfung Pelayanan Masyarakat",
        nama: "Person A",
        jumlah_like: 12,
        jumlah_komentar: 4,
      },
      {
        client_id: "DITBINMAS",
        divisi: "Direktorat Binmas",
        satfung: "Satfung Pengawasan",
        nama: "Person B",
        jumlah_like: 8,
        jumlah_komentar: 1,
      },
    ];

    const result = aggregateWeeklyLikesRecords(records);

    expect(result.clients).toHaveLength(2);
    expect(result.clients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientId: "DITBINMAS",
          clientName: "Satfung Pelayanan Masyarakat",
          satfung: "Satfung Pelayanan Masyarakat",
          divisi: "Direktorat Binmas",
          totalLikes: 12,
          totalComments: 4,
        }),
        expect.objectContaining({
          clientId: "DITBINMAS",
          clientName: "Satfung Pengawasan",
          satfung: "Satfung Pengawasan",
          divisi: "Direktorat Binmas",
          totalLikes: 8,
          totalComments: 1,
        }),
      ]),
    );

    expect(result.topPersonnel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientName: "Satfung Pelayanan Masyarakat",
          satfung: "Satfung Pelayanan Masyarakat",
          likes: 12,
          comments: 4,
        }),
        expect.objectContaining({
          clientName: "Satfung Pengawasan",
          satfung: "Satfung Pengawasan",
          likes: 8,
          comments: 1,
        }),
      ]),
    );

    expect(result.totals.totalClients).toBe(2);
  });

  it("uses subsatker fields when satfung data is missing", () => {
    const records = [
      {
        client_id: "DITBINMAS",
        subsatker: "Subsatker A",
        nama: "Person Subsatker",
        jumlah_like: 4,
        jumlah_komentar: 1,
      },
    ];

    const result = aggregateWeeklyLikesRecords(records);

    expect(result.clients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientId: "DITBINMAS",
          clientName: "Subsatker A",
          satfung: "Subsatker A",
          subsatker: "Subsatker A",
          totalLikes: 4,
          totalComments: 1,
        }),
      ]),
    );

    expect(result.topPersonnel).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientName: "Subsatker A",
          satfung: "Subsatker A",
          subsatker: "Subsatker A",
          likes: 4,
          comments: 1,
        }),
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
          role: "Ditbinmas",
        },
        role: "Ditbinmas",
      },
    ];

    const commentRecords = [
      {
        rekap: {
          client_id: "DITBINMAS",
          client_name: "Satfung C",
          total_komentar: 3,
          role: "Ditbinmas",
        },
        role: "Ditbinmas",
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
    expect(summary.totals.inactiveCount).toBe(0);
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
    expect(summary.totals.inactiveCount).toBe(0);
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

  it("keeps separate personnel entries for different identities within the same client", () => {
    const likesRecords = [
      {
        client_id: "DITBINMAS",
        nama_client: "Satfung D",
        username: "person_a",
        nama: "Person A",
        jumlah_like: 7,
      },
      {
        client_id: "DITBINMAS",
        nama_client: "Satfung D",
        nrp: "12345678",
        nama: "Person B",
        jumlah_like: 5,
      },
    ];

    const commentRecords = [
      {
        client_id: "DITBINMAS",
        nama_client: "Satfung D",
        nama: "Person A",
        jumlah_komentar: 2,
      },
      {
        client_id: "DITBINMAS",
        nama_client: "Satfung D",
        nrp: "12345678",
        jumlah_komentar: 4,
      },
    ];

    const merged = mergeWeeklyActivityRecords(likesRecords, commentRecords);

    expect(merged).toHaveLength(2);

    const summary = aggregateWeeklyLikesRecords(merged);

    expect(summary.clients).toHaveLength(1);
    const clientEntry = summary.clients[0];
    expect(clientEntry.personnel).toHaveLength(2);

    const firstPersonnel = clientEntry.personnel.find(
      (person: any) => person.username === "person_a" || person.nama === "Person A",
    );
    const secondPersonnel = clientEntry.personnel.find(
      (person: any) => person.nama === "Person B",
    );

    expect(firstPersonnel).toEqual(
      expect.objectContaining({
        username: "person_a",
        nama: "Person A",
        likes: 7,
        comments: 2,
      }),
    );

    expect(secondPersonnel).toEqual(
      expect.objectContaining({
        nama: "Person B",
        likes: 5,
        comments: 4,
      }),
    );
  });

  it("counts likes and comments stored inside nested rekap structures", () => {
    const likesRecords = [
      {
        client_id: "DITBINMAS",
        divisi: "Satfung Rekap",
        rekap: {
          total_like_personil: "6",
        },
      },
    ];

    const commentRecords = [
      {
        client_id: "DITBINMAS",
        divisi: "Satfung Rekap",
        rekap: {
          total_comments_personil: "5",
        },
      },
    ];

    const merged = mergeWeeklyActivityRecords(likesRecords, commentRecords);

    expect(merged).toHaveLength(1);

    const summary = aggregateWeeklyLikesRecords(merged);

    expect(summary.totals.totalLikes).toBe(6);
    expect(summary.totals.totalComments).toBe(5);
    expect(summary.clients).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          clientName: "Satfung Rekap",
          totalLikes: 6,
          totalComments: 5,
        }),
      ]),
    );
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
    expect(summary.totals.personnelWithLikes).toBe(2);
    expect(summary.totals.inactiveCount).toBe(1);
    expect(summary.totals.complianceRate).toBeCloseTo(100, 5);
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
          inactiveCount: 1,
        }),
      ]),
    );

    const clientY = summary.clients.find((client) => client.clientId === "CLIENT_Y");
    expect(clientY?.personnel).toHaveLength(0);
  });

  it("filters out inactive personnel from the Ditbinmas directory", () => {
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
        client_id: "DITBINMAS",
        divisi: "Satfung Alfa",
        role: "operator ditbinmas",
        nama: "Person Bravo",
        status: "inactive",
      },
      {
        user_id: "user-3",
        client_id: "DITBINMAS",
        divisi: "Satfung Alfa",
        role: "operator ditbinmas",
        nama: "Person Charlie",
        is_active: false,
      },
      {
        user_id: "user-4",
        client_id: "DITBINMAS",
        divisi: "Satfung Alfa",
        role: "operator ditbinmas",
        nama: "Person Delta",
        aktif: "aktif",
      },
    ];

    const normalizedDirectoryUsers = resolveDitbinmasDirectoryUsers(rawDirectoryUsers);

    expect(normalizedDirectoryUsers).toHaveLength(2);
    expect(normalizedDirectoryUsers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ user_id: "user-1" }),
        expect.objectContaining({ user_id: "user-4" }),
      ]),
    );
    expect(normalizedDirectoryUsers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ user_id: "user-2" }),
        expect.objectContaining({ user_id: "user-3" }),
      ]),
    );
  });

  it("counts unique personnel across multiple satfung entries", () => {
    const directoryEntries = [
      { user_id: "user-1", client_id: "CLIENT_A" },
      { user_id: "user-1", client_id: "CLIENT_B" },
      { user_id: "user-2", client_id: "CLIENT_A" },
      { email: "alpha@example.com", client_id: "CLIENT_C" },
      { email: "ALPHA@example.com", client_id: "CLIENT_D" },
    ];

    expect(countUniquePersonnelRecords(directoryEntries)).toBe(3);
  });

  it("deduplicates directory personnel across satfung when summarizing totals", () => {
    const directoryUsers = [
      { user_id: "user-1", client_id: "CLIENT_A", divisi: "Satfung A" },
      { user_id: "user-1", client_id: "CLIENT_B", divisi: "Satfung B" },
      { user_id: "user-2", client_id: "CLIENT_C", divisi: "Satfung C" },
    ];

    const summary = aggregateWeeklyLikesRecords([], { directoryUsers });

    expect(summary.totals.totalPersonnel).toBe(2);
    expect(summary.totals.activePersonnel).toBe(0);
    expect(summary.totals.inactiveCount).toBe(2);

    const clientA = summary.clients.find((client) => client.clientId === "CLIENT_A");
    const clientB = summary.clients.find((client) => client.clientId === "CLIENT_B");

    expect(clientA).toEqual(
      expect.objectContaining({ clientId: "CLIENT_A", totalPersonnel: 1 }),
    );
    expect(clientB).toEqual(
      expect.objectContaining({ clientId: "CLIENT_B", totalPersonnel: 1 }),
    );
  });
});
