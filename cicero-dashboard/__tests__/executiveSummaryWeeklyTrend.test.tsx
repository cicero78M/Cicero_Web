import "@testing-library/jest-dom";

import { render, screen, within } from "@testing-library/react";

import {
  groupRecordsByMonth,
  resolveRecordDate,
  shouldShowWeeklyTrendCard,
} from "@/app/executive-summary/weeklyTrendUtils";
import {
  POST_DATE_PATHS,
  buildMonthlyEngagementTrend,
} from "@/app/executive-summary/sharedUtils";
import {
  INSTAGRAM_LIKE_FIELD_PATHS,
  TIKTOK_COMMENT_FIELD_PATHS,
  sumActivityRecords,
} from "@/app/executive-summary/activityRecords";
import {
  aggregateLikesRecords,
  mergeActivityRecords,
  prepareTrendActivityRecords,
  resolveDirectoryIsActive,
} from "@/app/executive-summary/dataTransforms";
import { computeUserInsight } from "@/app/executive-summary/userInsight";
import MonthlyTrendCard from "@/components/executive-summary/MonthlyTrendCard";
import PlatformLikesSummary from "@/components/executive-summary/PlatformLikesSummary";

beforeAll(() => {
  const ResizeObserverMock = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  (global as any).ResizeObserver = ResizeObserverMock;
});

describe("groupRecordsByMonth monthly trend integration", () => {
  it("retains instagram posts when only tanggal is provided", () => {
    const records = [
      { id: 1, tanggal: "2024-05-03" },
      { id: 2, tanggal: "2024-05-22" },
      { id: 3, tanggal: "2024-06-01" },
    ];

    const filtered = records.filter((record) =>
      Boolean(resolveRecordDate(record, POST_DATE_PATHS)),
    );

    const buckets = groupRecordsByMonth(filtered, {
      datePaths: POST_DATE_PATHS,
    });

    expect(filtered).toHaveLength(3);
    expect(buckets).toHaveLength(2);
    expect(buckets[0].key).toBe("2024-05");
    expect(buckets[0].records).toHaveLength(2);
    expect(buckets[1].key).toBe("2024-06");
    expect(buckets[1].records).toHaveLength(1);
  });

  it("groups instagram activity into monthly buckets and shows the trend card", () => {
    const records = [
      { tanggal: "2024-05-01", jumlah_like: 5 },
      { tanggal: "2024-05-21", jumlah_like: 3 },
      { tanggal: "2024-06-08", jumlah_like: 2 },
    ];

    const buckets = groupRecordsByMonth(records);

    expect(buckets).toHaveLength(2);
    expect(buckets[0].key).toBe("2024-05");
    expect(buckets[0].records).toHaveLength(2);
    expect(buckets[1].key).toBe("2024-06");
    expect(buckets[1].records).toHaveLength(1);

    const shouldShow = shouldShowWeeklyTrendCard({
      showPlatformLoading: false,
      platformError: "",
      hasMonthlyPlatforms: true,
      cardHasRecords: buckets.length > 0,
    });

    expect(shouldShow).toBe(true);
  });

  it("groups tiktok activity into monthly buckets and shows the trend card", () => {
    const records = [
      { created_at: "2024-06-10T07:00:00Z", komentar: 4 },
      { created_at: "2024-06-12T07:00:00Z", komentar: 6 },
      { created_at: "2024-07-19T07:00:00Z", komentar: 1 },
    ];

    const buckets = groupRecordsByMonth(records);

    expect(buckets).toHaveLength(2);
    expect(buckets[0].key).toBe("2024-06");
    expect(buckets[0].records).toHaveLength(2);
    expect(buckets[1].key).toBe("2024-07");
    expect(buckets[1].records).toHaveLength(1);

    const shouldShow = shouldShowWeeklyTrendCard({
      showPlatformLoading: false,
      platformError: "",
      hasMonthlyPlatforms: true,
      cardHasRecords: buckets.length > 0,
    });

    expect(shouldShow).toBe(true);
  });

  it("aggregates instagram likes from daily activity records", () => {
    const records = [
      { tanggal: "2024-05-01", jumlah_like: 5 },
      { tanggal: "2024-05-02", rekap: { total_like: "7" } },
      { tanggal: "2024-05-03", total_like: "invalid" },
    ];

    const totalLikes = sumActivityRecords(records, INSTAGRAM_LIKE_FIELD_PATHS);

    expect(totalLikes).toBe(12);
  });

  it("aggregates instagram likes from nested personnel fields", () => {
    const records = [
      { tanggal: "2024-07-01", likes_personil: "4" },
      { tanggal: "2024-07-02", rekap: { totalLikesPersonnel: "5" } },
    ];

    const totalLikes = sumActivityRecords(records, INSTAGRAM_LIKE_FIELD_PATHS);

    expect(totalLikes).toBe(9);
  });

  it("prioritizes instagram personnel likes when general totals also exist", () => {
    const records = [
      { tanggal: "2024-07-04", likes_personil: 5, total_like: 20 },
    ];

    const totalLikes = sumActivityRecords(records, INSTAGRAM_LIKE_FIELD_PATHS);

    expect(totalLikes).toBe(5);
  });

  it("uses activityDate ISO values when grouping instagram likes by month", () => {
    const records = [
      {
        tanggal: "31/05/2024",
        activityDate: "2024-05-31T00:00:00.000Z",
        jumlah_like: 5,
      },
      {
        tanggal: "01/06/2024",
        activityDate: "2024-06-01T00:00:00.000Z",
        rekap: { total_like: "7" },
      },
    ];

    const monthlyLikes = groupRecordsByMonth(records, {
      datePaths: [
        "activityDate",
        "tanggal",
        "date",
        "created_at",
        "createdAt",
        "updated_at",
        "updatedAt",
        "time",
        "waktu",
        "rekap.tanggal",
        "rekap.date",
        "rekap.created_at",
        "rekap.createdAt",
      ],
    });

    expect(monthlyLikes).toHaveLength(2);
    expect(monthlyLikes[0].key).toBe("2024-05");
    expect(monthlyLikes[1].key).toBe("2024-06");

    const totalLikes = monthlyLikes.reduce(
      (sum, bucket) =>
        sum + sumActivityRecords(bucket.records, INSTAGRAM_LIKE_FIELD_PATHS),
      0,
    );

    expect(totalLikes).toBe(12);
  });

  it("aggregates tiktok comments from daily activity records", () => {
    const records = [
      { created_at: "2024-06-10T07:00:00Z", komentar: 4 },
      { created_at: "2024-06-11T07:00:00Z", rekap: { total_komentar: "3" } },
      { created_at: "2024-06-12T07:00:00Z", komentar: null },
    ];

    const totalComments = sumActivityRecords(records, TIKTOK_COMMENT_FIELD_PATHS);

    expect(totalComments).toBe(7);
  });

  it("aggregates tiktok comments from nested personnel fields", () => {
    const records = [
      { created_at: "2024-07-01T07:00:00Z", komentar_personil: 2 },
      { created_at: "2024-07-03T07:00:00Z", rekap: { totalCommentsPersonnel: "6" } },
    ];

    const totalComments = sumActivityRecords(records, TIKTOK_COMMENT_FIELD_PATHS);

    expect(totalComments).toBe(8);
  });

  it("prioritizes tiktok personnel comments when general totals also exist", () => {
    const records = [
      {
        created_at: "2024-07-05T07:00:00Z",
        komentar_personil: 3,
        total_comments: 12,
      },
    ];

    const totalComments = sumActivityRecords(records, TIKTOK_COMMENT_FIELD_PATHS);

    expect(totalComments).toBe(3);
  });

  it("preserves instagram likes totals for records without timestamps", () => {
    const rawLikes = [
      {
        client_id: "CLI-01",
        nama_client: "Client A",
        username: "alpha",
        jumlah_like: 5,
      },
      {
        client_id: "CLI-01",
        nama_client: "Client A",
        username: "bravo",
        jumlah_like: "7",
      },
    ];

    const summary = aggregateLikesRecords(rawLikes);

    expect(summary.totals.totalLikes).toBe(12);
    expect(summary.totals.totalPersonnel).toBe(2);
    expect(summary.clients[0].totalLikes).toBe(12);
  });

  it("menggunakan direktori pengguna sebagai baseline ketika tidak ada aktivitas", () => {
    const directoryUsers = [
      { client_id: "CLI-01", nama_client: "Client A", username: "alpha" },
      { client_id: "CLI-01", nama_client: "Client A", username: "bravo" },
      { client_id: "CLI-02", nama_client: "Client B", username: "charlie" },
    ];

    const summary = aggregateLikesRecords([], { directoryUsers });

    expect(summary.totals.totalLikes).toBe(0);
    expect(summary.totals.totalComments).toBe(0);
    expect(summary.totals.totalPersonnel).toBe(3);
    expect(summary.totals.activePersonnel).toBe(3);
    expect(summary.totals.complianceRate).toBe(0);
    expect(summary.clients).toHaveLength(2);

    const clientA = summary.clients.find((client) => client.clientId === "CLI-01");
    const clientB = summary.clients.find((client) => client.clientId === "CLI-02");

    expect(clientA?.totalPersonnel).toBe(2);
    expect(clientA?.activePersonnel).toBe(2);
    expect(clientA?.totalLikes).toBe(0);
    expect(clientA?.totalComments).toBe(0);
    expect(clientA?.complianceRate).toBe(0);

    expect(clientB?.totalPersonnel).toBe(1);
    expect(clientB?.activePersonnel).toBe(1);
    expect(clientB?.totalLikes).toBe(0);
    expect(clientB?.totalComments).toBe(0);
    expect(clientB?.complianceRate).toBe(0);
  });

  it("menggunakan total & aktif dari insight user saat tersedia", () => {
    const directoryUsers = [
      {
        client_id: "CLI-22",
        nama_client: "Client Z",
        nama: "Officer Jane Doe",
        status: "Aktif",
      },
      {
        client_id: "CLI-22",
        nama_client: "Client Z",
        nama: "Officer John Smith",
        status: "Tidak Aktif",
      },
      {
        client_id: "CLI-33",
        nama_client: "Client Y",
        nama: "Officer Alex",
        status: "Aktif",
      },
    ];

    const insight = computeUserInsight(directoryUsers);
    const summary = aggregateLikesRecords([], {
      directoryUsers,
      insightPersonnelByClient: insight.personnelByClient,
    });

    expect(insight.summary.totalUsers).toBe(directoryUsers.length);
    expect(summary.totals.totalPersonnel).toBe(insight.summary.totalUsers);
    expect(summary.totals.activePersonnel).toBe(
      insight.summary.explicitActiveUsers,
    );

    const clientZ = summary.clients.find((client) => client.clientId === "CLI-22");
    const clientY = summary.clients.find((client) => client.clientId === "CLI-33");

    expect(clientZ?.totalPersonnel).toBe(2);
    expect(clientZ?.activePersonnel).toBe(1);
    expect(clientY?.totalPersonnel).toBe(1);
    expect(clientY?.activePersonnel).toBe(1);
  });

  it(
    "tidak menampilkan kartu kepatuhan personil dan tetap menampilkan kepatuhan platform",
    () => {
      const directoryUsers = [
        {
          client_id: "CLI-11",
          nama_client: "Client Q",
          nama: "Aiptu Andi",
        status: "Aktif",
      },
      {
        client_id: "CLI-11",
        nama_client: "Client Q",
        nama: "Aiptu Andi",
        status: "Aktif",
        pangkat: "Aiptu",
      },
      {
        client_id: "CLI-11",
        nama_client: "Client Q",
        nama: "Bripka Sari",
        status: "Aktif",
      },
    ];

      const insight = computeUserInsight(directoryUsers);
      const likesSummary = aggregateLikesRecords([], {
        directoryUsers,
        insightPersonnelByClient: insight.personnelByClient,
      });
      const formatNumber = (value: number) => String(Math.round(Number(value) || 0));
      const formatPercent = (value: number) => `${Math.round(Number(value) || 0)}%`;

      expect(likesSummary.totals.totalPersonnel).toBe(
        insight.summary.totalUsers,
      );
      expect(likesSummary.totals.activePersonnel).toBe(
        insight.summary.explicitActiveUsers,
      );

      render(
        <div style={{ width: 1024, height: 768 }}>
          <PlatformLikesSummary
            data={likesSummary}
            formatNumber={formatNumber}
          formatPercent={formatPercent}
          personnelActivity={null}
          postTotals={{ instagram: 0, tiktok: 0 }}
          summaryCards={null}
          labelOverrides={null}
          personnelDistribution={null}
          personnelDistributionMeta={null}
          hiddenSections={{
            topCompliance: true,
            topCommentPersonnel: true,
            topLikesPersonnel: true,
          }}
        />
        <div data-testid="total-personil-card">
          Total Personil Insight: {formatNumber(insight.summary.totalUsers)}
        </div>
      </div>,
    );
      expect(screen.queryByText("Kepatuhan Personil")).not.toBeInTheDocument();
      expect(screen.getByText("Kepatuhan Instagram")).toBeInTheDocument();
      expect(screen.getByText("Kepatuhan TikTok")).toBeInTheDocument();
      expect(screen.getByText(/personil memberi likes/i)).toBeInTheDocument();
      expect(screen.getByText(/personil berkomentar/i)).toBeInTheDocument();
    },
  );

  it("menampilkan nilai kepatuhan platform pada kartu ringkasan", () => {
    const directoryUsers = [
      { client_id: "CLI-21", nama_client: "Client AA", username: "alpha" },
      { client_id: "CLI-21", nama_client: "Client AA", username: "bravo" },
      { client_id: "CLI-21", nama_client: "Client AA", username: "charlie" },
    ];

    const rawLikes = [
      {
        client_id: "CLI-21",
        nama_client: "Client AA",
        username: "alpha",
        jumlah_like: 5,
      },
      {
        client_id: "CLI-21",
        nama_client: "Client AA",
        username: "bravo",
        jumlah_komentar: 3,
      },
    ];

    const likesSummary = aggregateLikesRecords(rawLikes, { directoryUsers });

    const formatNumber = (value: number) => String(Math.round(Number(value) || 0));
    const formatPercent = (value: number) => `${Math.round(Number(value) || 0)}%`;

    render(
      <div style={{ width: 1024, height: 768 }}>
        <PlatformLikesSummary
          data={likesSummary}
          formatNumber={formatNumber}
          formatPercent={formatPercent}
          personnelActivity={null}
          postTotals={{ instagram: 2, tiktok: 1 }}
          summaryCards={null}
          labelOverrides={null}
          personnelDistribution={null}
          personnelDistributionMeta={null}
          hiddenSections={{
            topCompliance: true,
            topCommentPersonnel: true,
            topLikesPersonnel: true,
          }}
        />
      </div>,
    );

    expect(screen.queryByText("Kepatuhan Personil")).not.toBeInTheDocument();
    const instagramCard = screen.getByText("Kepatuhan Instagram").closest("div");
    expect(instagramCard).toBeTruthy();
    if (instagramCard) {
      expect(instagramCard).toHaveTextContent("33%");
      expect(instagramCard).toHaveTextContent(/memberi likes/i);
    }

    const tiktokCard = screen.getByText("Kepatuhan TikTok").closest("div");
    expect(tiktokCard).toBeTruthy();
    if (tiktokCard) {
      expect(tiktokCard).toHaveTextContent("33%");
      expect(tiktokCard).toHaveTextContent(/berkomentar/i);
    }
  });

  it("menampilkan total post sesuai bulan terpilih", () => {
    const filterPostsForMonth = (records: any[], monthKey: string) => {
      if (!Array.isArray(records) || typeof monthKey !== "string") {
        return [];
      }

      const [yearStr, monthStr] = monthKey.split("-");
      const year = Number.parseInt(yearStr, 10);
      const monthIndex = Number.parseInt(monthStr, 10) - 1;

      if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) {
        return [];
      }

      const startTime = Date.UTC(year, monthIndex, 1, 0, 0, 0, 0);
      const endTime = Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999);

      return records.filter((record) => {
        const resolved = resolveRecordDate(record, POST_DATE_PATHS);
        if (!resolved?.parsed) {
          return false;
        }

        const timestamp = resolved.parsed.getTime();
        return timestamp >= startTime && timestamp <= endTime;
      });
    };

    const instagramRecords = [
      { id: "ig-1", tanggal: "2024-05-05" },
      { id: "ig-2", tanggal: "2024-05-18" },
      { id: "ig-3", tanggal: "2024-06-02" },
      { id: "ig-4", caption: "Tanpa tanggal" },
    ];
    const tiktokRecords = [
      { id: "tt-1", created_at: "2024-05-07T08:00:00Z" },
      { id: "tt-2", created_at: "2024-06-01T08:00:00Z" },
      { id: "tt-3", created_at: "2024-06-12T11:30:00Z" },
      { id: "tt-4", created_at: "2024-06-28T15:45:00Z" },
    ];

    const instagramMay = filterPostsForMonth(instagramRecords, "2024-05");
    const instagramJune = filterPostsForMonth(instagramRecords, "2024-06");
    const tiktokMay = filterPostsForMonth(tiktokRecords, "2024-05");
    const tiktokJune = filterPostsForMonth(tiktokRecords, "2024-06");

    const summaryData: any = {
      totals: {
        totalClients: 1,
        totalLikes: 0,
        totalComments: 0,
        totalPersonnel: 0,
        activePersonnel: 0,
        personnelWithLikes: 0,
        personnelWithComments: 0,
        complianceRate: 0,
        instagramCompliance: 0,
        tiktokCompliance: 0,
        averageComplianceRate: 0,
      },
      clients: [
        {
          key: "client-1",
          clientId: "CLI-42",
          clientName: "Client Simulasi",
          satfung: null,
          totalLikes: 0,
          totalComments: 0,
          activePersonnel: 0,
          totalPersonnel: 0,
          personnelWithLikes: 0,
          personnelWithComments: 0,
          complianceRate: 0,
        },
      ],
      topPersonnel: [],
      lastUpdated: null,
    };

    const formatNumber = (value: number) => `${Math.round(Number(value) || 0)}`;
    const formatPercent = (value: number) => `${Math.round(Number(value) || 0)}%`;

    const baseProps = {
      data: summaryData,
      formatNumber,
      formatPercent,
      personnelActivity: null,
      summaryCards: null,
      labelOverrides: null,
      personnelDistribution: null,
      personnelDistributionMeta: null,
      hiddenSections: null,
    };

    const { rerender } = render(
      <PlatformLikesSummary
        {...baseProps}
        postTotals={{
          instagram: instagramMay.length,
          tiktok: tiktokMay.length,
        }}
      />,
    );

    const totalPostCardInitial = screen.getByText("Total Post").closest("div");
    expect(totalPostCardInitial).not.toBeNull();
    const initialCard = totalPostCardInitial as HTMLElement;
    expect(within(initialCard).getByText("3")).toBeInTheDocument();
    expect(
      within(initialCard).getByText("Post Instagram: 2 · Post TikTok: 1"),
    ).toBeInTheDocument();

    rerender(
      <PlatformLikesSummary
        {...baseProps}
        postTotals={{
          instagram: instagramJune.length,
          tiktok: tiktokJune.length,
        }}
      />,
    );

    const totalPostCardJune = screen.getByText("Total Post").closest("div");
    expect(totalPostCardJune).not.toBeNull();
    const juneCard = totalPostCardJune as HTMLElement;
    expect(within(juneCard).getByText("4")).toBeInTheDocument();
    expect(
      within(juneCard).getByText("Post Instagram: 1 · Post TikTok: 3"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Post Instagram: 2 · Post TikTok: 1"),
    ).not.toBeInTheDocument();
  });

  it("mengabaikan entri direktori yang ditandai tidak aktif ketika menghitung total personil", () => {
    const directoryUsers = [
      {
        client_id: "CLI-05",
        nama_client: "Client E",
        username: "alpha",
        status: "Aktif",
      },
      {
        client_id: "CLI-05",
        nama_client: "Client E",
        username: "bravo",
        status_keaktifan: "nonaktif",
      },
      {
        client_id: "CLI-06",
        nama_client: "Client F",
        username: "charlie",
        is_active: true,
      },
      {
        client_id: "CLI-06",
        nama_client: "Client F",
        username: "delta",
        is_active: 0,
      },
    ];

    const summary = aggregateLikesRecords([], { directoryUsers });

    expect(summary.totals.totalPersonnel).toBe(2);

    const clientE = summary.clients.find((client) => client.clientId === "CLI-05");
    const clientF = summary.clients.find((client) => client.clientId === "CLI-06");

    expect(clientE?.totalPersonnel).toBe(1);
    expect(clientF?.totalPersonnel).toBe(1);
  });

  it("menandai personel direktori dengan status non aktif sebagai tidak aktif", () => {
    expect(resolveDirectoryIsActive({ status: "Non Aktif" })).toBe(false);
    expect(resolveDirectoryIsActive({ status_keaktifan: "tidak-aktif" })).toBe(
      false,
    );
    expect(resolveDirectoryIsActive({ status: "non aktif" })).toBe(false);
  });

  it("menggabungkan likes dan komentar untuk klien dengan nama sama tetapi ID berbeda", () => {
    const directoryUsers = [
      { client_id: "IG-01", nama_client: "Client X", username: "alpha" },
      { client_id: "TT-02", nama_client: "Client X", username: "bravo" },
    ];

    const rawLikes = [
      {
        client_id: "IG-01",
        nama_client: "Client X",
        jumlah_like: 5,
        jumlah_komentar: 2,
        username: "alpha",
      },
      {
        client_id: "TT-02",
        nama_client: "Client X",
        total_like: 3,
        total_komentar: 4,
        username: "bravo",
      },
    ];

    const summary = aggregateLikesRecords(rawLikes, { directoryUsers });

    expect(summary.totals.totalClients).toBe(1);
    expect(summary.totals.totalLikes).toBe(8);
    expect(summary.totals.totalComments).toBe(6);
    expect(summary.totals.totalPersonnel).toBe(2);
    expect(summary.totals.activePersonnel).toBe(2);

    expect(summary.clients).toHaveLength(1);
    const client = summary.clients[0];

    expect(client.key).toBe("CLIENT X");
    expect(client.clientName).toBe("Client X");
    expect(client.totalLikes).toBe(8);
    expect(client.totalComments).toBe(6);
    expect(client.totalPersonnel).toBe(2);
    expect(client.activePersonnel).toBe(2);

    const personnelUsernames = client.personnel.map((person) => person.username);
    expect(personnelUsernames).toEqual(expect.arrayContaining(["alpha", "bravo"]));
  });

  it("menghitung kepatuhan instagram dan tiktok secara terpisah", () => {
    const directoryUsers = [
      { client_id: "CLI-12", nama_client: "Client R", username: "alpha" },
      { client_id: "CLI-12", nama_client: "Client R", username: "bravo" },
      { client_id: "CLI-12", nama_client: "Client R", username: "charlie" },
    ];

    const rawLikes = [
      {
        client_id: "CLI-12",
        nama_client: "Client R",
        username: "alpha",
        jumlah_like: 6,
        jumlah_komentar: 0,
      },
      {
        client_id: "CLI-12",
        nama_client: "Client R",
        username: "bravo",
        jumlah_like: 0,
        jumlah_komentar: 4,
      },
    ];

    const summary = aggregateLikesRecords(rawLikes, { directoryUsers });

    expect(summary.clients).toHaveLength(1);
    const client = summary.clients[0];

    expect(client.personnelWithLikes).toBe(1);
    expect(client.personnelWithComments).toBe(1);
    expect(client.personnelWithActivity).toBe(2);
    expect(client.instagramCompliance).toBeCloseTo((1 / 3) * 100, 5);
    expect(client.tiktokCompliance).toBeCloseTo((1 / 3) * 100, 5);
    expect(client.complianceRate).toBeCloseTo((2 / 3) * 100, 5);

    expect(summary.totals.personnelWithLikes).toBe(1);
    expect(summary.totals.personnelWithComments).toBe(1);
    expect(summary.totals.personnelWithActivity).toBe(2);
    expect(summary.totals.instagramCompliance).toBeCloseTo((1 / 3) * 100, 5);
    expect(summary.totals.tiktokCompliance).toBeCloseTo((1 / 3) * 100, 5);
    expect(summary.totals.complianceRate).toBeCloseTo((2 / 3) * 100, 5);
  });

  it("mengurutkan Personil dengan Komentar Tertinggi berdasarkan data bulan berjalan", () => {
    const rawLikes = [
      {
        client_id: "CLI-20",
        nama_client: "Client U",
        username: "likesHero",
        jumlah_like: 40,
        jumlah_komentar: 2,
      },
      {
        client_id: "CLI-20",
        nama_client: "Client U",
        username: "commentsHero",
        jumlah_like: 1,
        jumlah_komentar: 25,
      },
    ];

    const summary = aggregateLikesRecords(rawLikes);

    expect(summary.topPersonnel[0].username).toBe("likesHero");
    expect(summary.topCommentPersonnel[0].username).toBe("commentsHero");
    expect(summary.topCommentPersonnel.map((person) => person.username)).toEqual(
      expect.arrayContaining(["likesHero", "commentsHero"]),
    );
  });

  it("menghitung personil unik berdasarkan handle yang sudah dinormalisasi", () => {
    const directoryUsers = [
      {
        client_id: "CLI-03",
        nama_client: "Client C",
        akun_media_sosial: "https://instagram.com/alpha",
      },
    ];

    const rawLikes = [
      {
        client_id: "CLI-03",
        nama_client: "Client C",
        username: "@alpha",
        jumlah_like: 5,
      },
      {
        client_id: "CLI-03",
        nama_client: "Client C",
        akun_media_sosial: "https://instagram.com/alpha",
        jumlah_like: 3,
      },
    ];

    const summary = aggregateLikesRecords(rawLikes, { directoryUsers });

    expect(summary.totals.totalPersonnel).toBe(1);
    expect(summary.totals.activePersonnel).toBe(1);

    const client = summary.clients.find((entry) => entry.clientId === "CLI-03");
    expect(client).toBeTruthy();
    expect(client?.totalPersonnel).toBe(1);
    expect(client?.activePersonnel).toBe(1);
  });

  it(
    "tidak menambah total personel untuk alias aktivitas yang tidak cocok dengan direktori, namun menghitung personel aktif dari direktori",
    () => {
      const directoryUsers = [
        { client_id: "CLI-04", nama_client: "Client D", username: "alpha" },
    ];

    const rawLikes = [
      {
        client_id: "CLI-04",
        nama_client: "Client D",
        username: "beta",
        jumlah_like: 5,
      },
    ];

    const summary = aggregateLikesRecords(rawLikes, { directoryUsers });

    expect(summary.totals.totalPersonnel).toBe(1);
    expect(summary.totals.activePersonnel).toBe(1);

    const client = summary.clients.find((entry) => entry.clientId === "CLI-04");
    expect(client).toBeTruthy();
    expect(client?.totalPersonnel).toBe(1);
    expect(client?.activePersonnel).toBe(1);
  });

  it("menggunakan jumlah personel aktif direktori saat tidak ada aktivitas", () => {
    const directoryUsers = [
      { client_id: "CLI-05", nama_client: "Client E", username: "alpha" },
      { client_id: "CLI-05", nama_client: "Client E", username: "bravo" },
    ];

    const summary = aggregateLikesRecords([], { directoryUsers });

    expect(summary.totals.totalPersonnel).toBe(2);
    expect(summary.totals.activePersonnel).toBe(2);

    const client = summary.clients.find((entry) => entry.clientId === "CLI-05");
    expect(client).toBeTruthy();
    expect(client?.totalPersonnel).toBe(2);
    expect(client?.activePersonnel).toBe(2);
  });

  it("prefers personnel likes when merging records with general totals", () => {
    const merged = mergeActivityRecords(
      [
        {
          client_id: "CLI-02",
          nama_client: "Client B",
          likes_personil: 4,
          total_like: 10,
        },
      ],
      [],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].total_like).toBe(4);
    expect(merged[0].likes).toBe(4);
  });

  it("aggregates totals from records that only expose snake_case activity dates", () => {
    const instagramRecords = [
      { activity_date: "2024-07-01T00:00:00Z", rekap: { total_like: "5" } },
      { rekap: { activity_date: "2024-07-03T00:00:00Z", total_like: "7" } },
    ];
    const tiktokRecords = [
      { activity_date: "2024-07-02T07:00:00Z", rekap: { total_komentar: "2" } },
      { rekap: { activity_date: "2024-07-04T07:00:00Z", total_komentar: "5" } },
    ];

    const instagramBuckets = groupRecordsByMonth(instagramRecords);
    const tiktokBuckets = groupRecordsByMonth(tiktokRecords);

    expect(instagramBuckets).toHaveLength(1);
    expect(tiktokBuckets).toHaveLength(1);

    const instagramTotal = sumActivityRecords(
      instagramBuckets[0].records,
      INSTAGRAM_LIKE_FIELD_PATHS,
    );
    const tiktokTotal = sumActivityRecords(
      tiktokBuckets[0].records,
      TIKTOK_COMMENT_FIELD_PATHS,
    );

    expect(instagramTotal).toBe(12);
    expect(tiktokTotal).toBe(7);
  });

  it("assigns fallback dates so instagram trend buckets remain populated", () => {
    const rawLikes = [
      { jumlah_like: 4, username: "alpha" },
      { jumlah_like: 6, username: "bravo" },
    ];

    const sanitized = prepareTrendActivityRecords(rawLikes, {
      fallbackDate: "2024-07-01T00:00:00.000Z",
    });
    const buckets = groupRecordsByMonth(sanitized);

    expect(buckets).toHaveLength(1);
    const totalLikes = sumActivityRecords(
      buckets[0].records,
      INSTAGRAM_LIKE_FIELD_PATHS,
    );
    expect(totalLikes).toBe(10);
  });

  it("groups posts with only date/tanggal fields and shows the trend card", () => {
    const posts = [
      { tanggal: "2024-07-01", likes: 2 },
      { date: "2024-07-22", likes: 1 },
      { tanggal: "2024-08-09", likes: 5 },
    ];

    const buckets = groupRecordsByMonth(posts, {
      getDate: (post) => {
        const resolved = resolveRecordDate(post, [
          "publishedAt",
          "published_at",
          "timestamp",
          "createdAt",
          "created_at",
        ]);

        return resolved?.parsed ?? null;
      },
    });

    expect(buckets).toHaveLength(2);
    expect(buckets[0].key).toBe("2024-07");
    expect(buckets[0].records).toHaveLength(2);
    expect(buckets[1].key).toBe("2024-08");
    expect(buckets[1].records).toHaveLength(1);

    const shouldShow = shouldShowWeeklyTrendCard({
      showPlatformLoading: false,
      platformError: "",
      hasMonthlyPlatforms: true,
      cardHasRecords: buckets.length > 0,
    });

    expect(shouldShow).toBe(true);
  });

  it("renders trend metrics when sanitized activity supplies fallback dates", () => {
    const rawComments = [
      { komentar: 3, username: "alpha" },
      { komentar: 5, username: "bravo" },
    ];

    const sanitized = prepareTrendActivityRecords(rawComments, {
      fallbackDate: "2024-07-01T00:00:00.000Z",
    });
    const buckets = groupRecordsByMonth(sanitized);
    const currentTotal = sumActivityRecords(
      buckets[0].records,
      TIKTOK_COMMENT_FIELD_PATHS,
    );

    render(
      <MonthlyTrendCard
        title="TikTok Comments"
        currentMetrics={[
          { key: "comments", label: "Komentar", value: currentTotal },
        ]}
        series={buckets.map((bucket) => ({
          key: bucket.key,
          start: bucket.start,
          end: bucket.end,
          comments: sumActivityRecords(
            bucket.records,
            TIKTOK_COMMENT_FIELD_PATHS,
          ),
        }))}
      />,
    );

    expect(
      screen.queryByText("Belum ada data bulanan yang dapat ditampilkan."),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Komentar")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("mengurai field rekap string saat menyiapkan tren likes", () => {
    const rawLikes = [
      {
        rekap: JSON.stringify({
          tanggal: "2024-07-01",
          total_like_personil: "5",
        }),
      },
      {
        metrics: JSON.stringify({
          tanggal: "2024-07-15",
          total_like_personil: 3,
        }),
      },
    ];

    const sanitized = prepareTrendActivityRecords(rawLikes);
    const buckets = groupRecordsByMonth(sanitized);

    expect(buckets).toHaveLength(1);
    expect(
      sumActivityRecords(buckets[0].records, INSTAGRAM_LIKE_FIELD_PATHS),
    ).toBe(8);
  });

  it("mengurai field rekap string saat menyiapkan tren komentar", () => {
    const rawComments = [
      {
        rekap: JSON.stringify({
          tanggal: "2024-07-02",
          total_comments_personil: "4",
        }),
      },
      {
        metrics: JSON.stringify({
          tanggal: "2024-07-20",
          total_comments_personil: 6,
        }),
      },
    ];

    const sanitized = prepareTrendActivityRecords(rawComments);
    const buckets = groupRecordsByMonth(sanitized);

    expect(buckets).toHaveLength(1);
    expect(
      sumActivityRecords(buckets[0].records, TIKTOK_COMMENT_FIELD_PATHS),
    ).toBe(10);
  });

  it("prefers personnel comments when merging records with general totals", () => {
    const merged = mergeActivityRecords(
      [],
      [
        {
          client_id: "CLI-03",
          nama_client: "Client C",
          komentar_personil: 6,
          total_comments: 18,
        },
      ],
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].total_comments).toBe(6);
    expect(merged[0].comments).toBe(6);
  });
});

describe("buildMonthlyEngagementTrend", () => {
  it("aggregates instagram monthly metrics directly from post content", () => {
    const instagramPosts = [
      {
        id: "ig-1",
        timestamp: "2024-05-02T10:00:00Z",
        like_count: 5,
        comment_count: 2,
        share_count: 1,
      },
      {
        id: "ig-2",
        created_at: "2024-05-20T12:00:00Z",
        metrics: { likes: 3, comments: 4 },
      },
      {
        id: "ig-3",
        created_at: "2024-06-01T08:00:00Z",
        like_count: 6,
        comment_count: 1,
      },
    ];

    const trend = buildMonthlyEngagementTrend(instagramPosts, {
      platformKey: "instagram",
      platformLabel: "Instagram",
    });

    expect(trend.months).toHaveLength(2);
    expect(trend.hasAnyPosts).toBe(true);

    const may = trend.months.find((month) => month.key === "2024-05");
    expect(may).toBeDefined();
    expect(may).toMatchObject({
      posts: 2,
      likes: 8,
      comments: 6,
      interactions: 15,
    });

    const june = trend.months.find((month) => month.key === "2024-06");
    expect(june).toBeDefined();
    expect(june).toMatchObject({
      posts: 1,
      likes: 6,
      comments: 1,
      interactions: 7,
    });
  });

  it("derives tiktok monthly totals from the same content posts used for the weekly trend", () => {
    const tiktokPosts = [
      {
        id: "tt-1",
        created_at: "2024-06-10T07:00:00Z",
        like_count: 1,
        comment_count: 5,
      },
      {
        id: "tt-2",
        timestamp: "2024-06-18T07:00:00Z",
        metrics: { likes: 2, comments: 3, shares: 1 },
      },
      {
        id: "tt-3",
        created_at: "2024-07-05T07:00:00Z",
        like_count: 0,
        comment_count: 4,
      },
    ];

    const trend = buildMonthlyEngagementTrend(tiktokPosts, {
      platformKey: "tiktok",
      platformLabel: "TikTok",
    });

    expect(trend.months).toHaveLength(2);
    expect(trend.hasAnyPosts).toBe(true);

    const june = trend.months.find((month) => month.key === "2024-06");
    expect(june).toBeDefined();
    expect(june).toMatchObject({
      posts: 2,
      comments: 8,
      interactions: 12,
    });

    const totalPosts = trend.months.reduce((sum, month) => sum + month.posts, 0);
    expect(totalPosts).toBe(3);
  });
});

describe("Monthly trend card metric emphasis", () => {
  it("prioritizes personnel interactions as the primary monthly metric", () => {
    render(
      <MonthlyTrendCard
        title="Instagram"
        currentMetrics={[
          { key: "likes", label: "Likes Personil", value: 24 },
        ]}
        previousMetrics={[
          { key: "likes", label: "Likes Personil", value: 18 },
        ]}
        primaryMetricLabel="Likes Personil"
        series={[
          {
            key: "2024-07",
            label: "Juli 2024",
            primary: 24,
          },
        ]}
      />,
    );

    const detail = screen.getByText(/Likes Personil: 24/);
    expect(detail).toBeInTheDocument();
  });

  it("supports custom interaction labels with optional secondary metrics", () => {
    render(
      <MonthlyTrendCard
        title="TikTok"
        currentMetrics={[
          { key: "comments", label: "Komentar Personil", value: 18 },
        ]}
        previousMetrics={[
          { key: "comments", label: "Komentar Personil", value: 12 },
        ]}
        primaryMetricLabel="Komentar Personil"
        secondaryMetricLabel="Post"
        series={[
          {
            key: "2024-07",
            label: "Juli 2024",
            primary: 18,
            secondary: 4,
          },
        ]}
      />,
    );

    expect(
      screen.getByText(/Komentar Personil: 18 • Post: 4/),
    ).toBeInTheDocument();
  });

  it("groups activity records that only provide Indonesian month labels", () => {
    const records = [
      { periode: "Mei 2024", jumlah_like: "5" },
      { periode: "Juni 2024", jumlah_like: 7 },
      { periode: "15 Juli 2024", jumlah_like: 3 },
    ];

    const buckets = groupRecordsByMonth(records);

    expect(buckets).toHaveLength(3);
    expect(buckets.map((bucket) => bucket.key)).toEqual([
      "2024-05",
      "2024-06",
      "2024-07",
    ]);

    const totals = buckets.map((bucket) =>
      sumActivityRecords(bucket.records, INSTAGRAM_LIKE_FIELD_PATHS),
    );

    expect(totals).toEqual([5, 7, 3]);
  });
});
