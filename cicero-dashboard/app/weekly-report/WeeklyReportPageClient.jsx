"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import PlatformEngagementTrendChart from "@/components/executive-summary/PlatformEngagementTrendChart";
import PlatformLikesSummary from "@/components/executive-summary/PlatformLikesSummary";
import useAuth from "@/hooks/useAuth";
import useRequireAuth from "@/hooks/useRequireAuth";
import { getUserDirectory } from "@/utils/api";

const RANK_ORDER = [
  "komisaris besar polisi",
  "akbp",
  "kompol",
  "akp",
  "iptu",
  "ipda",
  "aiptu",
  "aipda",
  "bripka",
  "brigadir",
  "brigpol",
  "briptu",
  "bripda",
];

const RANK_PRIORITY = new Map(RANK_ORDER.map((rank, index) => [rank, index]));

const SATFUNG_DEFINITIONS = [
  {
    key: "bagbinops",
    name: "Bagbinops Ditbinmas",
    likeWeight: 1.18,
    commentWeight: 1.12,
    activeWeight: 1.16,
    totalWeight: 1.15,
    basePersonnel: 22,
  },
  {
    key: "bhabinkamtibmas",
    name: "Subdit Bhabinkamtibmas",
    likeWeight: 1.22,
    commentWeight: 1.25,
    activeWeight: 1.2,
    totalWeight: 1.25,
    basePersonnel: 28,
  },
  {
    key: "binpolmas",
    name: "Subdit Binpolmas",
    likeWeight: 1.05,
    commentWeight: 1.08,
    activeWeight: 1.04,
    totalWeight: 1.05,
    basePersonnel: 20,
  },
  {
    key: "kerma",
    name: "Subdit Kerma Ditbinmas",
    likeWeight: 0.95,
    commentWeight: 0.9,
    activeWeight: 0.92,
    totalWeight: 0.94,
    basePersonnel: 16,
  },
  {
    key: "renbin",
    name: "Subbag Renbin Ditbinmas",
    likeWeight: 0.88,
    commentWeight: 0.9,
    activeWeight: 0.86,
    totalWeight: 0.9,
    basePersonnel: 14,
  },
  {
    key: "program",
    name: "Subbag Program Ditbinmas",
    likeWeight: 0.84,
    commentWeight: 0.85,
    activeWeight: 0.82,
    totalWeight: 0.85,
    basePersonnel: 12,
  },
];

const PERSONNEL_DEFINITIONS = [
  {
    key: "kombes-yudi",
    pangkat: "Komisaris Besar Polisi",
    nama: "Yudi Pratama",
    satfungKey: "bagbinops",
    likeWeight: 1.2,
    commentWeight: 1.05,
    baseContent: 5,
  },
  {
    key: "akbp-ratna",
    pangkat: "AKBP",
    nama: "Ratna Dewi",
    satfungKey: "bhabinkamtibmas",
    likeWeight: 1.15,
    commentWeight: 1.12,
    baseContent: 5,
  },
  {
    key: "kompol-satria",
    pangkat: "Kompol",
    nama: "Satria Nugraha",
    satfungKey: "binpolmas",
    likeWeight: 1.08,
    commentWeight: 1.02,
    baseContent: 4,
  },
  {
    key: "akp-laras",
    pangkat: "AKP",
    nama: "Laras Widodo",
    satfungKey: "kerma",
    likeWeight: 1,
    commentWeight: 1.05,
    baseContent: 4,
  },
  {
    key: "iptu-andika",
    pangkat: "Iptu",
    nama: "Andika Mahesa",
    satfungKey: "renbin",
    likeWeight: 0.95,
    commentWeight: 1,
    baseContent: 4,
  },
  {
    key: "ipda-rika",
    pangkat: "Ipda",
    nama: "Rika Anjani",
    satfungKey: "program",
    likeWeight: 0.92,
    commentWeight: 0.98,
    baseContent: 3,
  },
  {
    key: "aiptu-seno",
    pangkat: "Aiptu",
    nama: "Seno Prabowo",
    satfungKey: "bagbinops",
    likeWeight: 0.88,
    commentWeight: 0.9,
    baseContent: 3,
  },
  {
    key: "aipda-dita",
    pangkat: "Aipda",
    nama: "Dita Kurniasih",
    satfungKey: "bhabinkamtibmas",
    likeWeight: 0.86,
    commentWeight: 0.92,
    baseContent: 3,
  },
  {
    key: "bripka-adi",
    pangkat: "Bripka",
    nama: "Adi Saputra",
    satfungKey: "binpolmas",
    likeWeight: 0.82,
    commentWeight: 0.88,
    baseContent: 3,
  },
  {
    key: "brigadir-nanda",
    pangkat: "Brigadir",
    nama: "Nanda Putra",
    satfungKey: "kerma",
    likeWeight: 0.78,
    commentWeight: 0.85,
    baseContent: 2,
  },
  {
    key: "brigpol-gita",
    pangkat: "Brigpol",
    nama: "Gita Pertiwi",
    satfungKey: "renbin",
    likeWeight: 0.75,
    commentWeight: 0.82,
    baseContent: 2,
  },
  {
    key: "briptu-rizky",
    pangkat: "Briptu",
    nama: "Rizky Ramadhan",
    satfungKey: "program",
    likeWeight: 0.72,
    commentWeight: 0.78,
    baseContent: 2,
  },
  {
    key: "bripda-salsa",
    pangkat: "Bripda",
    nama: "Salsa Damayanti",
    satfungKey: "bhabinkamtibmas",
    likeWeight: 0.7,
    commentWeight: 0.76,
    baseContent: 2,
  },
];

const distributeByWeights = (totalValue, weights) => {
  const safeTotal = Number.isFinite(totalValue) ? Math.round(totalValue) : 0;
  const normalizedWeights = weights.map((weight) =>
    Number.isFinite(weight) && weight > 0 ? weight : 0,
  );
  const sumWeights = normalizedWeights.reduce((acc, weight) => acc + weight, 0);
  if (sumWeights <= 0 || safeTotal === 0) {
    return normalizedWeights.map(() => 0);
  }

  const provisional = normalizedWeights.map((weight) =>
    Math.round((safeTotal * weight) / sumWeights),
  );
  let difference = safeTotal - provisional.reduce((acc, value) => acc + value, 0);

  const order = normalizedWeights
    .map((weight, index) => ({ index, weight }))
    .sort((a, b) => b.weight - a.weight)
    .map((item) => item.index);

  let pointer = 0;
  while (difference !== 0 && order.length > 0) {
    const targetIndex = order[pointer % order.length];
    const nextValue = provisional[targetIndex] + (difference > 0 ? 1 : -1);
    if (nextValue >= 0) {
      provisional[targetIndex] = nextValue;
      difference += difference > 0 ? -1 : 1;
    }
    pointer += 1;
  }

  return provisional;
};

const getRankPriority = (pangkat) => {
  const normalized = typeof pangkat === "string" ? pangkat.trim().toLowerCase() : "";
  return RANK_PRIORITY.get(normalized) ?? RANK_ORDER.length;
};

const resolveActiveLabel = (options, value) =>
  options.find((option) => option.value === value)?.label ?? "";

const resolveWeekDateRange = (weekValue, monthValue, yearValue) => {
  const weekNumber = Number(weekValue);
  const monthNumber = Number(monthValue);
  const yearNumber = Number(yearValue);

  if (!Number.isFinite(weekNumber) || !Number.isFinite(monthNumber) || !Number.isFinite(yearNumber)) {
    return "";
  }

  const normalizedWeek = Math.min(Math.max(Math.floor(weekNumber), 1), 4);
  const normalizedMonth = Math.min(Math.max(Math.floor(monthNumber), 1), 12);
  const startDay = 1 + (normalizedWeek - 1) * 7;
  const daysInMonth = new Date(yearNumber, normalizedMonth, 0).getDate();
  const endDay = Math.min(startDay + 6, daysInMonth);

  const formatDay = (day) => String(day).padStart(2, "0");
  return `${formatDay(startDay)}-${formatDay(endDay)}`;
};

const WEEK_OPTIONS = [
  { label: "Minggu 1", value: "1" },
  { label: "Minggu 2", value: "2" },
  { label: "Minggu 3", value: "3" },
  { label: "Minggu 4", value: "4" },
];

const MONTH_OPTIONS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
].map((label, index) => ({ label, value: String(index + 1) }));

const YEAR_OPTIONS = Array.from({ length: 11 }, (_, index) => {
  const year = 2025 + index;
  return { label: String(year), value: String(year) };
});

const getCurrentSelections = () => {
  const now = new Date();
  const weekOfMonth = Math.min(4, Math.max(1, Math.ceil(now.getDate() / 7)));
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  return {
    week: WEEK_OPTIONS.find((option) => option.value === String(weekOfMonth))?.value ?? WEEK_OPTIONS[0].value,
    month:
      MONTH_OPTIONS.find((option) => option.value === String(month))?.value ?? MONTH_OPTIONS[0].value,
    year:
      YEAR_OPTIONS.find((option) => option.value === String(year))?.value ?? YEAR_OPTIONS[0].value,
  };
};

export default function WeeklyReportPageClient() {
  useRequireAuth();
  const { token, role, clientId } = useAuth();
  const [{ week: defaultWeek, month: defaultMonth, year: defaultYear }] = useState(() => getCurrentSelections());
  const [selectedWeek, setSelectedWeek] = useState(defaultWeek);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(defaultYear);

  const normalizedRole = useMemo(() => {
    if (role) return String(role).trim().toLowerCase();
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("user_role") || "").trim().toLowerCase();
  }, [role]);

  const normalizedClientId = useMemo(() => {
    if (clientId) return String(clientId).trim().toUpperCase();
    if (typeof window === "undefined") return "";
    return String(window.localStorage.getItem("client_id") || "").trim().toUpperCase();
  }, [clientId]);

  const isDitbinmasAuthorized =
    normalizedRole === "ditbinmas" && normalizedClientId === "DITBINMAS";

  const formatNumber = useMemo(
    () =>
      (value, options) => {
        const numericValue = Number.isFinite(value) ? Number(value) : 0;
        const formatter = new Intl.NumberFormat("id-ID", {
          maximumFractionDigits: 0,
          minimumFractionDigits: 0,
          ...(options ?? {}),
        });
        return formatter.format(Math.max(0, numericValue));
      },
    [],
  );

  const formatPercentValue = useMemo(
    () =>
      (value) => {
        const numericValue = Number.isFinite(value) ? Math.max(0, Number(value)) : 0;
        const fractionDigits = numericValue > 0 && numericValue < 10 ? 1 : 0;
        const formatter = new Intl.NumberFormat("id-ID", {
          maximumFractionDigits: fractionDigits,
          minimumFractionDigits: fractionDigits,
        });
        return `${formatter.format(numericValue)}%`;
      },
    [],
  );

  const { data: ditbinmasDirectory } = useSWR(
    token && isDitbinmasAuthorized ? ["ditbinmas-directory", token] : null,
    ([, tk]) => getUserDirectory(tk, "DITBINMAS"),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  );

  const ditbinmasPersonnelCount = useMemo(() => {
    const raw = ditbinmasDirectory?.data ?? ditbinmasDirectory?.users ?? ditbinmasDirectory;
    if (!Array.isArray(raw)) {
      return null;
    }

    const normalizedRoleValue = "ditbinmas";
    const normalizedClientValue = "DITBINMAS";

    return raw.filter((entry) => {
      const entryRole = String(
        entry?.role ||
          entry?.user_role ||
          entry?.userRole ||
          entry?.roleName ||
          "",
      )
        .trim()
        .toLowerCase();

      const entryClientId = String(
        entry?.client_id ||
          entry?.clientId ||
          entry?.clientID ||
          entry?.client ||
          "",
      )
        .trim()
        .toUpperCase();

      return entryRole === normalizedRoleValue && entryClientId === normalizedClientValue;
    }).length;
  }, [ditbinmasDirectory]);

  const ditbinmasPersonnelDescriptor = useMemo(() => {
    const resolvedLabel = "Personil Ditbinmas";
    if (ditbinmasPersonnelCount === null || ditbinmasPersonnelCount === undefined) {
      return resolvedLabel;
    }

    return `${formatNumber(ditbinmasPersonnelCount, { maximumFractionDigits: 0 })} ${resolvedLabel}`;
  }, [ditbinmasPersonnelCount, formatNumber]);

  const mockWeeklySeries = useMemo(() => {
    const base = Number(selectedWeek);
    const monthLabel = MONTH_OPTIONS.find((option) => option.value === selectedMonth)?.label ?? "";

    return [
      {
        key: `${selectedYear}-W${Math.max(base - 2, 1)}`,
        label: `Minggu ${Math.max(base - 2, 1)} ${monthLabel}`,
        interactions: Math.max(0, 1200 - base * 45),
        posts: Math.max(0, 18 - base),
        likes: Math.max(0, 780 - base * 28),
        comments: Math.max(0, 420 - base * 9),
      },
      {
        key: `${selectedYear}-W${Math.max(base - 1, 1)}`,
        label: `Minggu ${Math.max(base - 1, 1)} ${monthLabel}`,
        interactions: Math.max(0, 1340 - base * 30),
        posts: Math.max(0, 19 - base),
        likes: Math.max(0, 860 - base * 24),
        comments: Math.max(0, 470 - base * 7),
      },
      {
        key: `${selectedYear}-W${base}`,
        label: `Minggu ${base} ${monthLabel}`,
        interactions: Math.max(0, 1460 - base * 18),
        posts: Math.max(0, 20 - base),
        likes: Math.max(0, 930 - base * 18),
        comments: Math.max(0, 520 - base * 5),
      },
    ];
  }, [selectedWeek, selectedMonth, selectedYear]);

  const instagramLatest = mockWeeklySeries[mockWeeklySeries.length - 1] ?? null;
  const instagramPrevious = mockWeeklySeries[mockWeeklySeries.length - 2] ?? null;

  const tiktokSeries = useMemo(
    () =>
      mockWeeklySeries.map((point, index) => ({
        ...point,
        key: `${point.key}-tt`,
        label: point.label?.replace("Minggu", "TikTok Minggu"),
        interactions: Math.max(0, (point.interactions ?? 0) - 120 + index * 18),
        likes: Math.max(0, (point.likes ?? 0) - 160 + index * 14),
        comments: Math.max(0, (point.comments ?? 0) - 70 + index * 10),
      })),
    [mockWeeklySeries],
  );

  const tiktokLatest = tiktokSeries[tiktokSeries.length - 1] ?? null;
  const tiktokPrevious = tiktokSeries[tiktokSeries.length - 2] ?? null;

  const weeklyPlatformSnapshot = useMemo(() => {
    const weekNumber = Number(selectedWeek) || 1;
    const weekOptionLabel = resolveActiveLabel(WEEK_OPTIONS, selectedWeek);
    const monthLabel = resolveActiveLabel(MONTH_OPTIONS, selectedMonth);
    const weekRange = resolveWeekDateRange(selectedWeek, selectedMonth, selectedYear);
    const weekDescriptor = `Minggu ${weekNumber} ${monthLabel} ${selectedYear}`;

    const instagramPosts = Math.max(0, Number(instagramLatest?.posts) || 0);
    const tiktokPosts = Math.max(0, Number(tiktokLatest?.posts) || 0);
    const totalPosts = instagramPosts + tiktokPosts;

    const prevInstagramPosts = Math.max(0, Number(instagramPrevious?.posts) || instagramPosts);
    const prevTiktokPosts = Math.max(0, Number(tiktokPrevious?.posts) || tiktokPosts);
    const previousPosts = prevInstagramPosts + prevTiktokPosts;

    const instagramLikes = Math.max(0, Number(instagramLatest?.likes) || 0);
    const tiktokLikes = Math.max(0, Number(tiktokLatest?.likes) || 0);
    const totalLikes = instagramLikes + tiktokLikes;

    const prevInstagramLikes = Math.max(0, Number(instagramPrevious?.likes) || instagramLikes);
    const prevTiktokLikes = Math.max(0, Number(tiktokPrevious?.likes) || tiktokLikes);
    const previousLikes = prevInstagramLikes + prevTiktokLikes;

    const instagramComments = Math.max(0, Number(instagramLatest?.comments) || 0);
    const tiktokComments = Math.max(0, Number(tiktokLatest?.comments) || 0);
    const totalComments = instagramComments + tiktokComments;

    const prevInstagramComments = Math.max(0, Number(instagramPrevious?.comments) || instagramComments);
    const prevTiktokComments = Math.max(0, Number(tiktokPrevious?.comments) || tiktokComments);
    const previousComments = prevInstagramComments + prevTiktokComments;

    const defaultTotalPersonnel = SATFUNG_DEFINITIONS.reduce(
      (sum, definition) => sum + (definition.basePersonnel || 0),
      0,
    );
    const providedPersonnel = Number(ditbinmasPersonnelCount);
    const resolvedTotalPersonnel = Number.isFinite(providedPersonnel)
      ? Math.max(0, Math.round(providedPersonnel))
      : Math.max(0, defaultTotalPersonnel);

    const complianceForWeek = (value) => {
      const normalized = Math.max(1, Number(value) || 1);
      return Math.min(0.93, 0.62 + (normalized - 1) * 0.045);
    };

    const currentComplianceRatio = complianceForWeek(weekNumber);
    const previousComplianceRatio =
      weekNumber > 1 ? complianceForWeek(weekNumber - 1) : Math.max(0.5, currentComplianceRatio - 0.04);

    const activePersonnelTarget = Math.min(
      resolvedTotalPersonnel,
      Math.max(0, Math.round(resolvedTotalPersonnel * currentComplianceRatio)),
    );
    const previousActivePersonnel = Math.min(
      resolvedTotalPersonnel,
      Math.max(0, Math.round(resolvedTotalPersonnel * previousComplianceRatio)),
    );

    const likeWeights = SATFUNG_DEFINITIONS.map(
      (definition, index) => definition.likeWeight * (1 + (weekNumber - 1) * 0.04 + index * 0.015),
    );
    const commentWeights = SATFUNG_DEFINITIONS.map(
      (definition, index) => definition.commentWeight * (1 + (weekNumber - 1) * 0.035 + index * 0.012),
    );
    const activeWeights = SATFUNG_DEFINITIONS.map(
      (definition, index) => definition.activeWeight * (1 + (weekNumber - 1) * 0.028 + index * 0.01),
    );
    const totalWeights = SATFUNG_DEFINITIONS.map((definition) => definition.totalWeight);

    const distributedLikes = distributeByWeights(totalLikes, likeWeights);
    const distributedComments = distributeByWeights(totalComments, commentWeights);
    const distributedActive = distributeByWeights(activePersonnelTarget, activeWeights);
    const distributedTotalBase = distributeByWeights(resolvedTotalPersonnel, totalWeights);

    const adjustedTotal = distributedTotalBase.map((value, index) =>
      Math.max(value, distributedActive[index] ?? 0),
    );
    let totalDiff = Math.round(resolvedTotalPersonnel) - adjustedTotal.reduce((sum, value) => sum + value, 0);
    if (adjustedTotal.length > 0 && totalDiff !== 0) {
      const order = SATFUNG_DEFINITIONS.map((definition, index) => ({ index, weight: definition.totalWeight }))
        .sort((a, b) => b.weight - a.weight)
        .map((item) => item.index);
      let pointer = 0;
      while (totalDiff !== 0 && order.length > 0) {
        const idx = order[pointer % order.length];
        const candidate = adjustedTotal[idx] + (totalDiff > 0 ? 1 : -1);
        if (candidate >= (distributedActive[idx] ?? 0)) {
          adjustedTotal[idx] = candidate;
          totalDiff += totalDiff > 0 ? -1 : 1;
        }
        pointer += 1;
      }
    }

    const satfungData = SATFUNG_DEFINITIONS.map((definition, index) => {
      const totalPersonnel = Math.max(0, adjustedTotal[index] ?? 0);
      const activePersonnel = Math.min(totalPersonnel, distributedActive[index] ?? 0);
      const likes = distributedLikes[index] ?? 0;
      const comments = distributedComments[index] ?? 0;
      const averageLikesPerUser = activePersonnel > 0 ? likes / activePersonnel : 0;
      const averageCommentsPerUser = activePersonnel > 0 ? comments / activePersonnel : 0;

      return {
        key: definition.key,
        name: definition.name,
        likes,
        comments,
        active: activePersonnel,
        total: totalPersonnel,
        averageLikesPerUser,
        averageCommentsPerUser,
        complianceRate: totalPersonnel > 0 ? (activePersonnel / totalPersonnel) * 100 : 0,
      };
    });

    const totalActive = satfungData.reduce((sum, entry) => sum + entry.active, 0);
    const complianceRate =
      resolvedTotalPersonnel > 0 ? (totalActive / resolvedTotalPersonnel) * 100 : 0;
    const previousComplianceRate =
      resolvedTotalPersonnel > 0 ? (previousActivePersonnel / resolvedTotalPersonnel) * 100 : 0;

    const weeklyClients = satfungData.map((entry) => ({
      key: entry.key,
      clientName: entry.name,
      totalLikes: entry.likes,
      totalComments: entry.comments,
      activePersonnel: entry.active,
      totalPersonnel: entry.total,
      complianceRate: entry.complianceRate,
      averageLikesPerUser: entry.averageLikesPerUser,
      averageCommentsPerUser: entry.averageCommentsPerUser,
    }));

    const totalLikeAllocation = Math.round(totalLikes * 0.65);
    const totalCommentAllocation = Math.round(totalComments * 0.7);
    const personnelLikeWeights = PERSONNEL_DEFINITIONS.map(
      (definition, index) => definition.likeWeight * (1 + (weekNumber - 1) * 0.03 + index * 0.008),
    );
    const personnelCommentWeights = PERSONNEL_DEFINITIONS.map(
      (definition, index) => definition.commentWeight * (1 + (weekNumber - 1) * 0.028 + index * 0.006),
    );

    const distributedPersonnelLikes = distributeByWeights(totalLikeAllocation, personnelLikeWeights);
    const distributedPersonnelComments = distributeByWeights(
      totalCommentAllocation,
      personnelCommentWeights,
    );

    const personnelRowsRaw = PERSONNEL_DEFINITIONS.map((person, index) => {
      const satfungName =
        SATFUNG_DEFINITIONS.find((definition) => definition.key === person.satfungKey)?.name || "Ditbinmas";
      const likes = distributedPersonnelLikes[index] ?? 0;
      const comments = distributedPersonnelComments[index] ?? 0;
      const offset = ((weekNumber + index) % 3) - 1;
      const contentCount = Math.max(1, person.baseContent + offset);
      const avgLikes = contentCount > 0 ? likes / contentCount : 0;
      const avgComments = contentCount > 0 ? comments / contentCount : 0;

      return {
        key: person.key,
        pangkat: person.pangkat,
        nama: person.nama,
        satfung: satfungName,
        likes,
        comments,
        avgLikes,
        avgComments,
        contentCount,
      };
    });

    const sortedPersonnelRows = [...personnelRowsRaw].sort((a, b) => {
      const rankDelta = getRankPriority(a.pangkat) - getRankPriority(b.pangkat);
      if (rankDelta !== 0) {
        return rankDelta;
      }

      if ((b.likes ?? 0) !== (a.likes ?? 0)) {
        return (b.likes ?? 0) - (a.likes ?? 0);
      }

      if ((b.comments ?? 0) !== (a.comments ?? 0)) {
        return (b.comments ?? 0) - (a.comments ?? 0);
      }

      return (a.nama || "").localeCompare(b.nama || "", "id-ID", { sensitivity: "base" });
    });

    const totalContentCount = sortedPersonnelRows.reduce(
      (sum, row) => sum + (row.contentCount ?? 0),
      0,
    );

    const topPersonnelEntries = [...personnelRowsRaw]
      .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
      .map((row) => ({
        key: row.key,
        clientName: row.satfung,
        username: row.nama,
        nama: row.nama,
        pangkat: row.pangkat,
        likes: row.likes,
        comments: row.comments,
        active: (row.likes ?? 0) + (row.comments ?? 0) > 0,
      }));

    const personnelDistribution = sortedPersonnelRows.map((row) => ({
      key: row.key,
      pangkat: row.pangkat,
      nama: row.nama,
      satfung: row.satfung,
      likes: row.likes,
      averageLikes: row.avgLikes,
      comments: row.comments,
      averageComments: row.avgComments,
    }));

    const distributionNote = weekRange
      ? `Minggu ${weekNumber} (${weekRange} ${monthLabel} ${selectedYear}) · ${formatNumber(totalContentCount, {
          maximumFractionDigits: 0,
        })} konten dipantau`
      : `${weekDescriptor} · ${formatNumber(totalContentCount, { maximumFractionDigits: 0 })} konten dipantau`;

    const labelOverrides = {
      likesContributorsDescription: "Satfung dengan kontribusi likes tertinggi pada minggu ini.",
      commentContributorsDescription: "Satfung dengan jumlah komentar terbanyak selama minggu ini.",
      topComplianceDescription:
        "Satfung dengan rasio kepatuhan personil tertinggi berdasarkan evaluasi mingguan.",
      commentPersonnelDescription: "Personil Ditbinmas dengan komentar terbanyak beserta satfung asal.",
      likesPersonnelDescription: "Personil Ditbinmas dengan likes terbanyak beserta satfung asal.",
      tableTitle: "Distribusi Engagement Per User / Personil",
      tableSubtitle: "Urutan sesuai jenjang kepangkatan personil Ditbinmas.",
      tableEmptyLabel: "Belum ada data engagement personil untuk minggu ini.",
    };

    const buildComparison = (currentValue, previousValue, formatter) => {
      const currentNumeric = Number.isFinite(currentValue) ? Number(currentValue) : 0;
      const previousNumeric = Number.isFinite(previousValue) ? Number(previousValue) : 0;
      const delta = currentNumeric - previousNumeric;

      if (Math.abs(delta) < 0.0001) {
        return {
          label: "Setara dengan minggu sebelumnya",
          direction: "flat",
        };
      }

      const direction = delta > 0 ? "up" : "down";
      const formattedDelta = formatter(Math.abs(delta));
      const sign = delta > 0 ? "+" : "-";

      return {
        label: `${sign}${formattedDelta} dibanding minggu sebelumnya`,
        direction,
      };
    };

    const postsComparison = buildComparison(totalPosts, previousPosts, (value) =>
      formatNumber(value, { maximumFractionDigits: 0 }),
    );
    const likesComparison = buildComparison(totalLikes, previousLikes, (value) =>
      formatNumber(value, { maximumFractionDigits: 0 }),
    );
    const commentsComparison = buildComparison(totalComments, previousComments, (value) =>
      formatNumber(value, { maximumFractionDigits: 0 }),
    );

    const complianceComparison = (() => {
      if (!Number.isFinite(complianceRate) || !Number.isFinite(previousComplianceRate)) {
        return null;
      }

      const delta = complianceRate - previousComplianceRate;
      if (Math.abs(delta) < 0.01) {
        return {
          label: "Setara dengan minggu sebelumnya",
          direction: "flat",
        };
      }

      const direction = delta > 0 ? "up" : "down";
      const formatter = new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: Math.abs(delta) < 10 ? 1 : 0,
        minimumFractionDigits: Math.abs(delta) < 10 ? 1 : 0,
      });
      const label = `${delta > 0 ? "+" : "-"}${formatter.format(Math.abs(delta))} poin dibanding minggu sebelumnya`;

      return { label, direction };
    })();

    const summaryCards = [
      {
        key: "personnel-total",
        label: "Jumlah Personil",
        value: formatNumber(resolvedTotalPersonnel, { maximumFractionDigits: 0 }),
        description: "Total personil Ditbinmas terdaftar.",
      },
      {
        key: "total-posts",
        label: "Total Post",
        value: formatNumber(totalPosts, { maximumFractionDigits: 0 }),
        description: `Post Instagram: ${formatNumber(instagramPosts, { maximumFractionDigits: 0 })} · Post TikTok: ${formatNumber(tiktokPosts, { maximumFractionDigits: 0 })}`,
        comparison: postsComparison,
      },
      {
        key: "total-likes",
        label: "Total Likes",
        value: formatNumber(totalLikes, { maximumFractionDigits: 0 }),
        description: "Seluruh likes personil selama minggu terpilih.",
        comparison: likesComparison,
      },
      {
        key: "total-comments",
        label: "Total Komentar",
        value: formatNumber(totalComments, { maximumFractionDigits: 0 }),
        description: "Kumulatif komentar personil pada minggu ini.",
        comparison: commentsComparison,
      },
      {
        key: "overall-compliance",
        label: "Kepatuhan Personil",
        value: formatPercentValue(complianceRate),
        description: `${formatNumber(totalActive, { maximumFractionDigits: 0 })} aktif dari ${formatNumber(resolvedTotalPersonnel, { maximumFractionDigits: 0 })} personil.`,
        comparison: complianceComparison,
      },
    ];

    const lastUpdated = (() => {
      if (weekRange && weekRange.includes("-")) {
        const [, endDayString] = weekRange.split("-");
        const endDay = Number(endDayString);
        const monthNumber = Number(selectedMonth);
        const yearNumber = Number(selectedYear);
        if (
          Number.isFinite(endDay) &&
          Number.isFinite(monthNumber) &&
          Number.isFinite(yearNumber)
        ) {
          return new Date(yearNumber, monthNumber - 1, endDay);
        }
      }

      const monthNumber = Number(selectedMonth);
      const yearNumber = Number(selectedYear);
      if (Number.isFinite(monthNumber) && Number.isFinite(yearNumber)) {
        return new Date(yearNumber, monthNumber - 1, 1);
      }

      return new Date();
    })();

    const likesSummaryData = {
      totals: {
        totalClients: weeklyClients.length,
        totalLikes,
        totalComments,
        totalPersonnel: resolvedTotalPersonnel,
        activePersonnel: totalActive,
        complianceRate,
        averageComplianceRate: complianceRate,
      },
      clients: weeklyClients,
      topPersonnel: topPersonnelEntries,
      lastUpdated,
    };

    const periodLabel = `${weekOptionLabel} • ${weekRange ? `${weekRange} ${monthLabel}` : monthLabel} ${selectedYear}`;

    return {
      likesSummaryData,
      summaryCards,
      labelOverrides,
      personnelDistribution,
      distributionMeta: { note: distributionNote },
      postTotals: {
        instagram: instagramPosts,
        tiktok: tiktokPosts,
      },
      periodLabel,
      weekDescriptor,
    };
  }, [
    selectedWeek,
    selectedMonth,
    selectedYear,
    instagramLatest,
    instagramPrevious,
    tiktokLatest,
    tiktokPrevious,
    ditbinmasPersonnelCount,
    formatNumber,
    formatPercentValue,
  ]);

  const {
    likesSummaryData,
    summaryCards: weeklySummaryCards,
    labelOverrides: weeklyLabelOverrides,
    personnelDistribution: weeklyPersonnelDistribution,
    distributionMeta: weeklyDistributionMeta,
    postTotals: weeklyPostTotals,
    periodLabel: weeklyPeriodLabel,
    weekDescriptor,
  } = weeklyPlatformSnapshot;

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50 text-slate-800">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
        <div className="absolute -right-12 bottom-12 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute inset-x-16 bottom-10 h-64 rounded-full bg-[radial-gradient(circle_at_center,_rgba(224,242,254,0.45),_rgba(255,255,255,0))] blur-2xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <section className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white/80 p-8 shadow-xl backdrop-blur">
          <div className="pointer-events-none absolute -top-16 right-12 h-40 w-40 rounded-full bg-sky-100/70 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 left-14 h-44 w-44 rounded-full bg-emerald-100/70 blur-3xl" />

          <div className="relative flex flex-col gap-6">
            <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                  Ditbinmas Insight
                </span>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  Laporan Mingguan Engagement Ditbinmas
                </h1>
                <p className="max-w-2xl text-sm text-slate-600">
                  Halaman ini merangkum analisis mingguan atas pelaksanaan likes dan komentar oleh Personil Ditbinmas, sehingga Anda dapat langsung melihat perkembangan interaksi dari pekan ke pekan berdasarkan pilihan periode di bawah.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:items-end">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                  Show Data By
                </span>
                <div className="grid w-full gap-2 sm:auto-cols-max sm:grid-flow-col sm:justify-end">
                  <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Minggu
                    <select
                      className="w-full min-w-[140px] rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={selectedWeek}
                      onChange={(event) => setSelectedWeek(event.target.value)}
                    >
                      {WEEK_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Bulan
                    <select
                      className="w-full min-w-[160px] rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={selectedMonth}
                      onChange={(event) => setSelectedMonth(event.target.value)}
                    >
                      {MONTH_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                    Tahun
                    <select
                      className="w-full min-w-[130px] rounded-full border border-sky-100 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      value={selectedYear}
                      onChange={(event) => setSelectedYear(event.target.value)}
                    >
                      {YEAR_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            </header>
          </div>
        </section>

        {isDitbinmasAuthorized ? (
          <>
            <section className="space-y-6 rounded-3xl border border-emerald-100/70 bg-gradient-to-br from-white via-emerald-50/80 to-sky-50/80 p-6 shadow-[0_20px_45px_rgba(45,212,191,0.15)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-600">
                    Tren Interaksi Mingguan
                  </h2>
                  <p className="text-sm text-slate-600">
                    Perbandingan performa konten mingguan berdasarkan total interaksi pada Instagram dan TikTok oleh {ditbinmasPersonnelDescriptor}.
                  </p>
                </div>
                <div className="rounded-full border border-emerald-100 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-500">
                  {weeklyPeriodLabel || `${resolveActiveLabel(WEEK_OPTIONS, selectedWeek)} • ${resolveWeekDateRange(selectedWeek, selectedMonth, selectedYear)} ${resolveActiveLabel(MONTH_OPTIONS, selectedMonth)} ${resolveActiveLabel(YEAR_OPTIONS, selectedYear)}`}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <PlatformEngagementTrendChart
                  platformKey="instagram"
                  platformLabel="Instagram"
                  series={mockWeeklySeries}
                  latest={instagramLatest}
                  previous={instagramPrevious}
                  loading={false}
                  error=""
                  formatNumber={formatNumber}
                  personnelCount={ditbinmasPersonnelCount ?? undefined}
                />

                <PlatformEngagementTrendChart
                  platformKey="tiktok"
                  platformLabel="TikTok"
                  series={tiktokSeries}
                  latest={tiktokLatest}
                  previous={tiktokPrevious}
                  loading={false}
                  error=""
                  formatNumber={formatNumber}
                  personnelCount={ditbinmasPersonnelCount ?? undefined}
                />
              </div>
            </section>

            <section
              className="relative overflow-hidden rounded-[36px] border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 via-white to-sky-50/90 p-8 shadow-[0_28px_60px_rgba(52,211,153,0.2)]"
              aria-label="Rincian Kinerja Platform"
            >
              <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-emerald-200/50 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

              <div className="relative space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-700 shadow-sm ring-1 ring-white/70">
                      Rincian Kinerja Platform
                    </span>
                    <h2 className="text-2xl font-semibold text-emerald-900">
                      Detail Kinerja Kanal Mingguan
                    </h2>
                    <p className="max-w-2xl text-sm leading-relaxed text-emerald-800/80">
                      Menampilkan distribusi likes dan komentar per satfung Ditbinmas selama {weekDescriptor || "periode terpilih"}, sehingga perkembangan kontribusi personil mudah dipantau.
                    </p>
                    <p className="text-xs text-emerald-700/70">
                      Data diringkas otomatis mengikuti pilihan minggu, bulan, dan tahun pada bagian atas halaman.
                    </p>
                  </div>

                  <div className="rounded-full border border-emerald-200 bg-white/85 px-5 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600 shadow-sm">
                    {weeklyPeriodLabel}
                  </div>
                </div>

                <div className="rounded-3xl border border-white/80 bg-white/85 p-6 shadow-[0_24px_50px_rgba(16,185,129,0.18)] backdrop-blur">
                  <PlatformLikesSummary
                    data={likesSummaryData}
                    formatNumber={formatNumber}
                    formatPercent={formatPercentValue}
                    personnelActivity={null}
                    postTotals={weeklyPostTotals}
                    summaryCards={weeklySummaryCards}
                    labelOverrides={weeklyLabelOverrides}
                    personnelDistribution={weeklyPersonnelDistribution}
                    personnelDistributionMeta={weeklyDistributionMeta}
                  />
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-3xl border border-rose-100 bg-white/70 p-8 text-center text-slate-600 shadow-lg backdrop-blur">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-2xl">⚠️</div>
            <h2 className="mt-4 text-xl font-semibold text-slate-900">
              Akses Terbatas
            </h2>
            <p className="mt-2 text-sm">
              Laporan mingguan Ditbinmas hanya dapat diakses oleh pengguna dengan peran dan client ID Ditbinmas. Silakan hubungi admin untuk meminta akses.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
