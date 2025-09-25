"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download } from "lucide-react";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getUserDirectory } from "@/utils/api";

const formatNumber = (value, options = {}) => {
  const formatter = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: options.maximumFractionDigits ?? 1,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  });
  return formatter.format(value ?? 0);
};

const formatPercent = (value) => {
  const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;
  const fractionDigits = safeValue < 10 && safeValue > 0 ? 1 : 0;
  return `${formatNumber(safeValue, {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  })}%`;
};

const beautifyDivisionName = (rawName) => {
  const cleaned = (rawName || "").toString().replace(/[_]+/g, " ").trim();
  if (!cleaned) {
    return "Unit Lainnya";
  }
  return cleaned
    .split(/\s+/)
    .map((segment) => {
      if (!segment) return segment;
      if (segment.length <= 3) {
        return segment.toUpperCase();
      }
      return segment.charAt(0) + segment.slice(1).toLowerCase();
    })
    .join(" ");
};

const shortenDivisionName = (name) => {
  const formatted = beautifyDivisionName(name);
  return formatted.length > 20 ? `${formatted.slice(0, 19)}…` : formatted;
};

const extractUserGroupInfo = (user) => {
  const candidateFields = [
    user?.client_id,
  ];

  for (const field of candidateFields) {
    if (typeof field === "string" && field.trim() !== "") {
      const label = field.trim();
      return {
        key: label.toUpperCase(),
        label,
      };
    }
  }

  const clientIdentifier =
    user?.client_id ?? user?.clientId ?? user?.clientID ?? user?.id;
  if (clientIdentifier) {
    const label = String(clientIdentifier).trim();
    return {
      key: label.toUpperCase(),
      label,
    };
  }

  return {
    key: "LAINNYA",
    label: "LAINNYA",
  };
};

const buildUserNarrative = ({
  totalUsers,
  bothCount,
  bothPercent,
  instagramPercent,
  tiktokPercent,
  onlyInstagramPercent,
  onlyTikTokPercent,
  nonePercent,
  bestDivision,
  lowestDivision,
}) => {
  if (!totalUsers) {
    return "Belum ada data pengguna yang dapat dianalisis. Minta pada satker untuk memperbarui direktori terlebih dahulu.";
  }

  const sentences = [];
  sentences.push(
    `Direktori saat ini memuat ${formatNumber(totalUsers, { maximumFractionDigits: 0 })} personil aktif.`,
  );

  if (bothCount > 0) {
    sentences.push(
      `${formatNumber(bothCount, { maximumFractionDigits: 0 })} personil (${formatPercent(
        bothPercent,
      )}) telah melengkapi data Instagram dan TikTok sekaligus sehingga absensi pada platform Instagram dan Tiktok berjalan mulus.`,
    );
  } else {
    sentences.push(
      `Belum ada personil yang melengkapi kedua akun sosial media sekaligus, sehingga perlu kampanye internal untuk melakukan update username pada Instagram dan Tiktok.`,
    );
  }

  const igVsTtGap = Math.abs(instagramPercent - tiktokPercent);
  if (igVsTtGap < 5) {
    sentences.push(
      `Kelengkapan akun Instagram (${formatPercent(instagramPercent)}) dan TikTok (${formatPercent(
        tiktokPercent,
      )}) sudah relatif seimbang, menandakan prosedur input berjalan konsisten.`,
    );
  } else if (instagramPercent > tiktokPercent) {
    sentences.push(
      `Instagram masih unggul dengan kelengkapan ${formatPercent(
        instagramPercent,
      )}, sementara TikTok berada di ${formatPercent(
        tiktokPercent,
      )}; dorong satker agar mengejar ketertinggalan dengan melakukan update username.`,
    );
  } else {
    sentences.push(
      `TikTok justru lebih siap (${formatPercent(
        tiktokPercent,
      )}) dibanding Instagram (${formatPercent(
        instagramPercent,
      )}); perlu penguatan dorongan update username.`,
    );
  }

  if (bestDivision) {
    sentences.push(
      `${beautifyDivisionName(
        bestDivision.displayName ?? bestDivision.division,
      )} menjadi unit paling siap dengan kelengkapan rata-rata ${formatPercent(
        bestDivision.completionPercent,
      )} dan basis ${formatNumber(bestDivision.total, { maximumFractionDigits: 0 })} personil aktif.`,
    );
  }

  if (lowestDivision && lowestDivision.division !== bestDivision?.division) {
    sentences.push(
      `Pendampingan perlu difokuskan pada ${beautifyDivisionName(
        lowestDivision.displayName ?? lowestDivision.division,
      )} yang baru mencapai ${formatPercent(
        lowestDivision.completionPercent,
      )} rata-rata kelengkapan data username.`,
    );
  }

  if (nonePercent > 0) {
    sentences.push(
      `${formatPercent(nonePercent)} personil belum mengisi data sama sekali; jadwalkan klinik onboarding agar mereka segera produktif.`,
    );
  } else if (onlyInstagramPercent > 0 || onlyTikTokPercent > 0) {
    sentences.push(
      `Sisanya tersebar pada personil yang baru melengkapi satu username (${formatPercent(
        onlyInstagramPercent + onlyTikTokPercent,
      )}); targetkan follow-up ringan agar profil mereka seratus persen siap.`,
    );
  }

  return sentences.join(" ");
};

const computeUserInsight = (users = []) => {
  const totalUsers = users.length;
  let instagramFilled = 0;
  let tiktokFilled = 0;
  let bothCount = 0;
  let onlyInstagram = 0;
  let onlyTikTok = 0;
  let none = 0;

  const divisionMap = new Map();

  users.forEach((user) => {
    const hasInstagram = Boolean(user?.insta && String(user.insta).trim() !== "");
    const hasTikTok = Boolean(user?.tiktok && String(user.tiktok).trim() !== "");

    if (hasInstagram) instagramFilled += 1;
    if (hasTikTok) tiktokFilled += 1;
    if (hasInstagram && hasTikTok) {
      bothCount += 1;
    } else if (hasInstagram) {
      onlyInstagram += 1;
    } else if (hasTikTok) {
      onlyTikTok += 1;
    } else {
      none += 1;
    }

    const { key: divisionKey, label: divisionLabel } = extractUserGroupInfo(user);

    if (!divisionMap.has(divisionKey)) {
      divisionMap.set(divisionKey, {
        division: divisionKey,
        displayName: divisionLabel,
        total: 0,
        igFilled: 0,
        ttFilled: 0,
      });
    }

    const record = divisionMap.get(divisionKey);
    record.total += 1;
    if (hasInstagram) record.igFilled += 1;
    if (hasTikTok) record.ttFilled += 1;
  });

  const instagramPercent = totalUsers ? (instagramFilled / totalUsers) * 100 : 0;
  const tiktokPercent = totalUsers ? (tiktokFilled / totalUsers) * 100 : 0;
  const bothPercent = totalUsers ? (bothCount / totalUsers) * 100 : 0;
  const onlyInstagramPercent = totalUsers ? (onlyInstagram / totalUsers) * 100 : 0;
  const onlyTikTokPercent = totalUsers ? (onlyTikTok / totalUsers) * 100 : 0;
  const nonePercent = totalUsers ? (none / totalUsers) * 100 : 0;

  const divisionArray = Array.from(divisionMap.values()).map((item) => {
    const igPercent = item.total ? (item.igFilled / item.total) * 100 : 0;
    const tiktokPercentDivision = item.total ? (item.ttFilled / item.total) * 100 : 0;
    const completionPercent = item.total
      ? ((item.igFilled + item.ttFilled) / (item.total * 2)) * 100
      : 0;
    return {
      ...item,
      displayName: item.displayName ?? item.division,
      igPercent,
      tiktokPercent: tiktokPercentDivision,
      completionPercent,
    };
  });

  const sortedByTotal = [...divisionArray].sort((a, b) => {
    if (b.total !== a.total) {
      return b.total - a.total;
    }
    return b.completionPercent - a.completionPercent;
  });

  const barData = sortedByTotal.slice(0, 5).map((item) => ({
    division: shortenDivisionName(item.displayName ?? item.division),
    fullDivision: beautifyDivisionName(item.displayName ?? item.division),
    instagram: Number(item.igPercent.toFixed(1)),
    tiktok: Number(item.tiktokPercent.toFixed(1)),
    total: item.total,
  }));

  const bestDivision = [...divisionArray]
    .sort((a, b) => {
      if (b.completionPercent !== a.completionPercent) {
        return b.completionPercent - a.completionPercent;
      }
      return b.total - a.total;
    })
    .find((item) => item.total > 0);

  const lowestDivision = [...divisionArray]
    .sort((a, b) => {
      if (a.completionPercent !== b.completionPercent) {
        return a.completionPercent - b.completionPercent;
      }
      return b.total - a.total;
    })
    .find((item) => item.total > 0);

  const pieData = [
    { name: "IG & TikTok Lengkap", value: bothCount },
    { name: "Hanya IG", value: onlyInstagram },
    { name: "Hanya TikTok", value: onlyTikTok },
    { name: "Belum Diisi", value: none },
  ];

  const pieTotal = pieData.reduce((acc, curr) => acc + curr.value, 0);

  const narrative = buildUserNarrative({
    totalUsers,
    bothCount,
    bothPercent,
    instagramPercent,
    tiktokPercent,
    onlyInstagramPercent,
    onlyTikTokPercent,
    nonePercent,
    bestDivision,
    lowestDivision,
  });

  return {
    summary: {
      totalUsers,
      instagramFilled,
      instagramPercent,
      tiktokFilled,
      tiktokPercent,
      bothCount,
      bothPercent,
    },
    barData,
    pieData,
    pieTotal,
    narrative,
  };
};

const monthlyData = {
  "2024-11": {
    monthLabel: "November 2024",
    summaryMetrics: [
      { label: "Total Reach", value: 184320, change: "+8,4%" },
      { label: "Engagement Rate", value: 6.2, suffix: "%", change: "+0,9 pts" },
      { label: "Konten Dipublikasikan", value: 76, change: "-4 konten" },
      { label: "Sentimen Positif", value: 62, suffix: "%", change: "+5 pts" },
    ],
    overviewNarrative:
      "Momentum kampanye pengamanan Nataru menghasilkan peningkatan reach dan engagement lintas kanal, sementara sentimen publik tetap dikelola secara positif.",
    dashboardNarrative:
      "Traffic dashboard menunjukkan lonjakan impresi sebesar 8% dibanding bulan sebelumnya, dipicu oleh konten sinergi pengamanan libur panjang dan quick response terhadap isu lalu lintas.",
    userInsightNarrative:
      "83% personil  aktif melakukan monitoring harian dan 61% di antaranya memanfaatkan fitur alert. Divisi Humas tetap menjadi kontributor utama percakapan dengan pertumbuhan partisipasi 6%.",
    instagramNarrative:
      "Instagram fokus pada storytelling humanis. Konten carousel edukasi keselamatan meraih reach tertinggi dengan 7,4% engagement rate dan menyumbang 31% dari total interaksi.",
    tiktokNarrative:
      "Tiktok menonjolkan konten video cepat seputar himbauan lalu lintas. Format duet dengan influencer lokal menaikkan completion rate hingga 68% dan memperluas jangkauan Gen-Z.",
    engagementByChannel: [
      { channel: "Instagram", reach: 112300, engagementRate: 7.4 },
      { channel: "TikTok", reach: 54020, engagementRate: 6.1 },
      { channel: "Facebook", reach: 17900, engagementRate: 3.8 },
    ],
    audienceComposition: [
      { name: "Masyarakat Umum", value: 52 },
      { name: "Komunitas Lokal", value: 23 },
      { name: "Media", value: 15 },
      { name: "Internal", value: 10 },
    ],
    highlights: [
      "Kampanye #OperasiLilin2024 mendominasi percakapan positif selama 10 hari berturut-turut.",
      "Respons cepat terhadap isu kemacetan arus balik menjaga sentimen negatif di bawah 12%.",
      "Pemanfaatan fitur Q&A Instagram Live meningkatkan partisipasi komunitas hingga 18%.",
    ],
    userInsightMetrics: [
      { label: "Personil Aktif Harian", value: 1230, change: "+6%" },
      { label: "Alert Ditindaklanjuti", value: 214, change: "+12%" },
      { label: "Respons Rata-rata", value: 37, suffix: "mnt", change: "-9 mnt" },
    ],
    contentTable: [
      {
        platform: "Instagram",
        title: "Carousel Edukasi Keselamatan Nataru",
        format: "Carousel",
        reach: 48760,
        engagement: 7.4,
        takeaway: "Sorotan humanis keluarga petugas meningkatkan share",
      },
      {
        platform: "Instagram",
        title: "Reel Patroli Gabungan",
        format: "Reel",
        reach: 39210,
        engagement: 6.8,
        takeaway: "Cut-to-action cepat menjaga retention di atas 65%",
      },
      {
        platform: "TikTok",
        title: "Duet Influencer Himbauan Mudik",
        format: "Video",
        reach: 28940,
        engagement: 6.1,
        takeaway: "Kolaborasi lokal memperluas jangkauan Gen-Z",
      },
      {
        platform: "TikTok",
        title: "Tips Cek Kendaraan Sebelum Perjalanan",
        format: "Video",
        reach: 25110,
        engagement: 5.6,
        takeaway: "Format checklist visual memudahkan pemahaman",
      },
    ],
  },
  "2024-10": {
    monthLabel: "Oktober 2024",
    summaryMetrics: [
      { label: "Total Reach", value: 169520, change: "+3,1%" },
      { label: "Engagement Rate", value: 5.3, suffix: "%", change: "-0,4 pts" },
      { label: "Konten Dipublikasikan", value: 82, change: "+7 konten" },
      { label: "Sentimen Positif", value: 57, suffix: "%", change: "+2 pts" },
    ],
    overviewNarrative:
      "Penetrasi program Bulan Tertib Berlalu Lintas memperluas awareness, namun engagement sedikit menurun karena penurunan interaksi video panjang.",
    dashboardNarrative:
      "Panel dashboard memperlihatkan pertumbuhan reach 3% dan dominasi trafik mobile sebesar 92%, menandakan konsumsi konten mayoritas terjadi di perjalanan.",
    userInsightNarrative:
      "Adopsi fitur scheduling meningkat 14% seiring koordinasi antar divisi. Sebanyak 76% personil konsisten menutup laporan harian tepat waktu.",
    instagramNarrative:
      "Instagram fokus pada edukasi visual. Postingan infografik rawan kecelakaan menjadi konten dengan save tertinggi dan menjaga engagement stabil.",
    tiktokNarrative:
      "TikTok mengeksplorasi format behind-the-scene operasi lapangan. Walau watch time stabil, call-to-action belum maksimal sehingga engagement turun tipis.",
    engagementByChannel: [
      { channel: "Instagram", reach: 102400, engagementRate: 6.1 },
      { channel: "TikTok", reach: 46300, engagementRate: 5.2 },
      { channel: "Facebook", reach: 20820, engagementRate: 3.5 },
    ],
    audienceComposition: [
      { name: "Masyarakat Umum", value: 49 },
      { name: "Komunitas Lokal", value: 25 },
      { name: "Media", value: 14 },
      { name: "Internal", value: 12 },
    ],
    highlights: [
      "Program live report pengaturan lalu lintas mendapat 3,4 ribu komentar positif.",
      "Penguatan cross-posting IG Stories ke TikTok meningkatkan traffic silang 11%.",
      "Kolaborasi dengan Dishub memperbanyak mention organik.",
    ],
    userInsightMetrics: [
      { label: "Personil Aktif Harian", value: 1160, change: "+4%" },
      { label: "Alert Ditindaklanjuti", value: 191, change: "+5%" },
      { label: "Respons Rata-rata", value: 42, suffix: "mnt", change: "-4 mnt" },
    ],
    contentTable: [
      {
        platform: "Instagram",
        title: "Infografik Rawan Kecelakaan",
        format: "Infografik",
        reach: 42110,
        engagement: 6.3,
        takeaway: "CTA simpan peta meningkatkan saves 23%",
      },
      {
        platform: "Instagram",
        title: "Reel Testimoni Pemudik",
        format: "Reel",
        reach: 34780,
        engagement: 5.9,
        takeaway: "Kutipan nyata menjaga komentar positif",
      },
      {
        platform: "TikTok",
        title: "Behind the Scene Operasi Zebra",
        format: "Video",
        reach: 26140,
        engagement: 5.1,
        takeaway: "Butuh CTA jelas untuk arahkan traffic lanjutan",
      },
      {
        platform: "TikTok",
        title: "Tips Aman Berkendara Malam",
        format: "Video",
        reach: 23810,
        engagement: 4.8,
        takeaway: "Durasi 45 detik sedikit menurunkan completion",
      },
    ],
  },
  "2024-09": {
    monthLabel: "September 2024",
    summaryMetrics: [
      { label: "Total Reach", value: 164420, change: "-5,2%" },
      { label: "Engagement Rate", value: 5.7, suffix: "%", change: "+0,3 pts" },
      { label: "Konten Dipublikasikan", value: 68, change: "-6 konten" },
      { label: "Sentimen Positif", value: 54, suffix: "%", change: "-1 pt" },
    ],
    overviewNarrative:
      "Transisi menuju fokus akhir tahun membuat volume konten lebih selektif, namun kualitas engagement tetap terjaga oleh kampanye keselamatan komunitas.",
    dashboardNarrative:
      "Dashboard menunjukkan trafik menurun 5%, didominasi jam sibuk pagi. Pengguna mengkonsumsi konten ringkas sehingga bounce rate turun ke 28%.",
    userInsightNarrative:
      "Pemanfaatan fitur knowledge base meningkat 21% dengan 312 pencarian internal. Hal ini membantu standar jawaban konsisten antar admin.",
    instagramNarrative:
      "Instagram mengedepankan konten komunitas. Live IG bersama relawan lalu lintas memicu lonjakan komentar dan pertanyaan relevan.",
    tiktokNarrative:
      "TikTok menerapkan format challenge #AmanBerkendara yang diikuti 480 user-generated content, menambah 4,6 ribu pengikut baru.",
    engagementByChannel: [
      { channel: "Instagram", reach: 96410, engagementRate: 5.9 },
      { channel: "TikTok", reach: 41120, engagementRate: 5.4 },
      { channel: "Facebook", reach: 26900, engagementRate: 3.1 },
    ],
    audienceComposition: [
      { name: "Masyarakat Umum", value: 47 },
      { name: "Komunitas Lokal", value: 27 },
      { name: "Media", value: 13 },
      { name: "Internal", value: 13 },
    ],
    highlights: [
      "UGC challenge #AmanBerkendara menghasilkan 8,7 ribu mention organik.",
      "Program literasi lalu lintas sekolah menumbuhkan follower baru 6%.",
      "Sentimen negatif muncul dari isu kemacetan lokal dan telah tertangani.",
    ],
    userInsightMetrics: [
      { label: "Personil Aktif Harian", value: 1085, change: "+3%" },
      { label: "Alert Ditindaklanjuti", value: 176, change: "+8%" },
      { label: "Respons Rata-rata", value: 48, suffix: "mnt", change: "-2 mnt" },
    ],
    contentTable: [
      {
        platform: "Instagram",
        title: "Live Relawan Lalu Lintas",
        format: "Live",
        reach: 38240,
        engagement: 6.1,
        takeaway: "Kolaborasi komunitas meningkatkan pertanyaan edukatif",
      },
      {
        platform: "Instagram",
        title: "Carousel Tips Aman Konvoi",
        format: "Carousel",
        reach: 33110,
        engagement: 5.7,
        takeaway: "Checklist visual memicu simpan konten",
      },
      {
        platform: "TikTok",
        title: "Challenge #AmanBerkendara",
        format: "Video",
        reach: 28490,
        engagement: 5.4,
        takeaway: "UGC memperluas jangkauan komunitas",
      },
      {
        platform: "TikTok",
        title: "Quick Tips Lampu Hazard",
        format: "Video",
        reach: 23980,
        engagement: 4.9,
        takeaway: "Format 30 detik ideal untuk edukasi singkat",
      },
    ],
  },
};

const PIE_COLORS = ["#22d3ee", "#6366f1", "#fbbf24", "#f43f5e"];
const PPTX_SCRIPT_URL =
  "https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js";
const SOCIAL_INSIGHT_CARDS = [
  {
    title: "Instagram Insight",
    subtitle: "Ringkasan performa utama kanal Instagram",
  },
  {
    title: "TikTok Insight",
    subtitle: "Gambaran kinerja kanal TikTok selama periode ini",
  },
];

export default function ExecutiveSummaryPage() {
  useRequireAuth();
  const { token, clientId } = useAuth();
  const monthKeys = Object.keys(monthlyData);
  const [selectedMonth, setSelectedMonth] = useState(monthKeys[0]);
  const [pptxFactory, setPptxFactory] = useState(null);
  const [userInsightState, setUserInsightState] = useState({
    loading: true,
    error: "",
    summary: null,
    barData: [],
    pieData: [],
    pieTotal: 0,
    narrative: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    let isMounted = true;

    const assignFactory = () => {
      if (!isMounted) {
        return;
      }

      const globalFactory = window.PptxGenJS;
      if (globalFactory) {
        setPptxFactory(() => globalFactory);
      }
    };

    const handleError = (event) => {
      if (!isMounted) {
        return;
      }

      console.error("Gagal memuat pustaka PptxGenJS", event);
      setPptxFactory(null);
    };

    if (window.PptxGenJS) {
      assignFactory();
      return () => {
        isMounted = false;
      };
    }

    const scriptId = "pptxgenjs-cdn-script";
    let scriptElement = document.getElementById(scriptId);

    if (!(scriptElement instanceof HTMLScriptElement)) {
      scriptElement = document.createElement("script");
      scriptElement.id = scriptId;
      scriptElement.src = PPTX_SCRIPT_URL;
      scriptElement.async = true;
      document.body.appendChild(scriptElement);
    }

    scriptElement.addEventListener("load", assignFactory);
    scriptElement.addEventListener("error", handleError);

    return () => {
      isMounted = false;
      scriptElement?.removeEventListener("load", assignFactory);
      scriptElement?.removeEventListener("error", handleError);
    };
  }, []);

  const data = monthlyData[selectedMonth];

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const loadUserInsight = async () => {
      if (!token || !clientId) {
        setUserInsightState((prev) => ({
          ...prev,
          loading: true,
        }));
        return;
      }

      setUserInsightState((prev) => ({
        ...prev,
        loading: true,
        error: "",
      }));

      try {
        const response = await getUserDirectory(token, clientId, controller.signal);
        if (cancelled) {
          return;
        }
        const raw = response?.data || response?.users || response;
        const users = Array.isArray(raw) ? raw : [];
        const insight = computeUserInsight(users);
        if (cancelled) {
          return;
        }
        setUserInsightState({
          loading: false,
          error: "",
          ...insight,
        });
      } catch (error) {
        if (cancelled || error?.name === "AbortError") {
          return;
        }
        setUserInsightState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Gagal memuat insight pengguna.",
        }));
      }
    };

    loadUserInsight();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [token, clientId]);

  const summaryMetricMap = useMemo(() => {
    return data.summaryMetrics.reduce((accumulator, metric) => {
      accumulator[metric.label] = metric;
      return accumulator;
    }, {});
  }, [data.summaryMetrics]);

  const insightMetrics = useMemo(() => {
    const orderedLabels = [
      "Total Reach",
      "Engagement Rate",
      "Konten Dipublikasikan",
      "Sentimen Positif",
    ];

    return orderedLabels
      .map((label) => summaryMetricMap[label])
      .filter((metric) => Boolean(metric));
  }, [summaryMetricMap]);

  const pptSummary = useMemo(() => {
    return [
      data.dashboardNarrative,
      data.userInsightNarrative,
      data.instagramNarrative,
      data.tiktokNarrative,
    ];
  }, [data]);

  const handleDownload = () => {
    if (!pptxFactory) {
      console.error("PptxGenJS belum siap digunakan.");
      return;
    }

    const pptx = new pptxFactory();
    pptx.layout = "LAYOUT_16x9";

    const titleSlide = pptx.addSlide();
    titleSlide.addText(`Executive Summary ${data.monthLabel}`, {
      x: 0.5,
      y: 1,
      w: 9,
      fontSize: 34,
      bold: true,
      color: "1F2937",
    });
    titleSlide.addText(data.overviewNarrative, {
      x: 0.5,
      y: 2.1,
      w: 9,
      fontSize: 18,
      color: "334155",
    });

    const metricSlide = pptx.addSlide();
    metricSlide.addText("Sorotan Kinerja", {
      x: 0.5,
      y: 0.4,
      fontSize: 26,
      bold: true,
      color: "0f172a",
    });
    data.summaryMetrics.forEach((metric, index) => {
      metricSlide.addText(metric.label, {
        x: 0.5,
        y: 1.2 + index * 1.1,
        fontSize: 18,
        color: "0369a1",
      });
      metricSlide.addText(
        `${formatNumber(metric.value, { maximumFractionDigits: 1 })}${
          metric.suffix ? metric.suffix : ""
        }`,
        {
          x: 4.4,
          y: 1.2 + index * 1.1,
          fontSize: 20,
          bold: true,
          color: "0f172a",
        },
      );
      metricSlide.addText(metric.change, {
        x: 6.6,
        y: 1.2 + index * 1.1,
        fontSize: 16,
        color: "059669",
      });
    });

    const narrativeSlide = pptx.addSlide();
    narrativeSlide.addText("Insight Naratif", {
      x: 0.5,
      y: 0.4,
      fontSize: 26,
      bold: true,
      color: "0f172a",
    });
    pptSummary.forEach((item, idx) => {
      narrativeSlide.addText(`• ${item}`, {
        x: 0.5,
        y: 1.1 + idx * 0.8,
        w: 9,
        fontSize: 18,
        color: "1e293b",
      });
    });

    const tableSlide = pptx.addSlide();
    tableSlide.addText("Konten Terbaik", {
      x: 0.5,
      y: 0.4,
      fontSize: 26,
      bold: true,
      color: "0f172a",
    });
    const tableData = [
      ["Platform", "Judul", "Format", "Reach", "Engagement", "Takeaway"],
      ...data.contentTable.map((row) => [
        row.platform,
        row.title,
        row.format,
        formatNumber(row.reach, { maximumFractionDigits: 0 }),
        `${row.engagement}%`,
        row.takeaway,
      ]),
    ];
    tableSlide.addTable(tableData, {
      x: 0.3,
      y: 1.0,
      w: 9.4,
      fontSize: 14,
      colW: [1.1, 2.6, 1.0, 1.1, 1.3, 2.3],
      border: { pt: 1, color: "cbd5f5" },
      fill: "f8fafc",
      color: "0f172a",
      valign: "middle",
    });

    pptx.writeFile({
      fileName: `Executive-Summary-${data.monthLabel.replace(/\s+/g, "-")}.pptx`,
    });
  };

  const { summary: userSummary, barData, pieData, pieTotal, narrative } =
    userInsightState;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-slate-800/60 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 shadow-[0_0_35px_rgba(15,23,42,0.4)]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-slate-100">Executive Summary</h1>
            <p className="max-w-2xl text-sm text-slate-300">
              Rangkuman performa dashboard, insight pengguna, serta kinerja Instagram dan TikTok
              selama satu bulan penuh. Pilih periode untuk melihat insight dan unduh presentasi PPT.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-end lg:justify-end">
            <div className="w-full sm:w-64">
              <label className="flex flex-col text-sm font-medium text-slate-200">
                Pilih Bulan
                <select
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-cyan-500/40 bg-slate-900/80 px-4 py-2 text-slate-100 shadow-[0_0_20px_rgba(56,189,248,0.2)] focus:border-cyan-400 focus:outline-none"
                >
                  {monthKeys.map((key) => (
                    <option key={key} value={key}>
                      {monthlyData[key].monthLabel}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button
              onClick={handleDownload}
              disabled={!pptxFactory}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-5 py-2 text-white shadow-[0_10px_30px_rgba(6,182,212,0.25)] transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-cyan-500/60 disabled:shadow-none sm:w-auto"
            >
              <Download className="h-4 w-4" /> Unduh PPT
            </Button>
          </div>
        </div>
      </header>

            <section
        aria-label="Insight Pengguna Aktual"
        className="space-y-6 rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)]"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Insight Pengguna Aktual
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Data ini ditarik langsung dari Database User.
            </p>
          </div>
        </div>

        {userInsightState.loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-slate-400">
            Memuat insight pengguna…
          </div>
        ) : userInsightState.error ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {userInsightState.error}
          </div>
        ) : (
          <div className="space-y-6">
            {userSummary && (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                    Total Personil
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-slate-100">
                    {formatNumber(userSummary.totalUsers, { maximumFractionDigits: 0 })}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                    Instagram Lengkap
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-100">
                    {formatNumber(userSummary.instagramFilled, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatPercent(userSummary.instagramPercent)} dari total Personil
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-200/80">
                    TikTok Lengkap
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-100">
                    {formatNumber(userSummary.tiktokFilled, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatPercent(userSummary.tiktokPercent)} dari total Personil
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 sm:col-span-2 xl:col-span-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">
                    Personil dengan data Username Sosial Media lengkap
                  </p>
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                    <p className="text-2xl font-semibold text-slate-100">
                      {formatNumber(userSummary.bothCount, { maximumFractionDigits: 0 })} Personil
                    </p>
                    <p className="text-sm text-emerald-300">
                      {formatPercent(userSummary.bothPercent)} dari keseluruhan data Personil
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
              <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                      Rasio Kelengkapan per Satker / Polres
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Menampilkan lima satker atau polres dengan jumlah Personil terbesar.
                    </p>
                  </div>
                </div>
                {barData.length > 0 ? (
                  <div className="mt-6 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                        <XAxis
                          dataKey="division"
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
                        />
                        <YAxis
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: "#94a3b8", fontSize: 11 }}
                          domain={[0, 100]}
                          axisLine={{ stroke: "rgba(148,163,184,0.4)" }}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                          contentStyle={{
                            backgroundColor: "rgba(15,23,42,0.92)",
                            borderRadius: 16,
                            borderColor: "rgba(148,163,184,0.4)",
                            color: "#e2e8f0",
                          }}
                          formatter={(value, name) => [
                            `${value}%`,
                            name === "instagram"
                              ? "Instagram Lengkap"
                              : "TikTok Lengkap",
                          ]}
                          labelFormatter={(_, payload) =>
                            payload?.[0]?.payload?.fullDivision ?? "Divisi"
                          }
                        />
                        <Legend
                          wrapperStyle={{ color: "#e2e8f0" }}
                          formatter={(value) =>
                            value === "instagram"
                              ? "Instagram Lengkap"
                              : "TikTok Lengkap"
                          }
                        />
                        <Bar dataKey="instagram" fill="#38bdf8" radius={[6, 6, 0, 0]}>
                          <LabelList
                            dataKey="instagram"
                            position="top"
                            formatter={(value) => `${value}%`}
                            fill="#e2e8f0"
                            fontSize={11}
                          />
                        </Bar>
                        <Bar dataKey="tiktok" fill="#a855f7" radius={[6, 6, 0, 0]}>
                          <LabelList
                            dataKey="tiktok"
                            position="top"
                            formatter={(value) => `${value}%`}
                            fill="#e2e8f0"
                            fontSize={11}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-6 flex h-60 items-center justify-center text-sm text-slate-400">
                    Belum ada data divisi yang bisa ditampilkan.
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/60 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                      Komposisi Kelengkapan Data Username
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      Distribusi personil berdasarkan status pengisian akun.
                    </p>
                  </div>
                </div>
                {pieData.length > 0 && pieTotal > 0 ? (
                  <div className="mt-6 h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={100}
                          paddingAngle={4}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                          <LabelList
                            dataKey="value"
                            position="outside"
                            formatter={(value) =>
                              pieTotal
                                ? `${formatPercent((value / pieTotal) * 100)}`
                                : "0%"
                            }
                            fill="#e2e8f0"
                            fontSize={11}
                          />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15,23,42,0.92)",
                            borderRadius: 16,
                            borderColor: "rgba(148,163,184,0.4)",
                            color: "#e2e8f0",
                          }}
                          formatter={(value) => [
                            `${formatNumber(value, { maximumFractionDigits: 0 })} admin`,
                            "Jumlah",
                          ]}
                        />
                        <Legend verticalAlign="bottom" wrapperStyle={{ color: "#e2e8f0" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-6 flex h-60 items-center justify-center text-sm text-slate-400">
                    Belum ada distribusi data yang bisa divisualisasikan.
                  </div>
                )}
              </div>
            </div>

            <article className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200/80">
                Catatan Insight Otomatis
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-200">{narrative}</p>
            </article>
          </div>
        )}
      </section>

      <section
        aria-label="Insight Kanal Sosial"
        className="grid gap-6 lg:grid-cols-2"
      >
        {SOCIAL_INSIGHT_CARDS.map((card) => (
          <article
            key={card.title}
            className="rounded-3xl border border-cyan-500/25 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)]"
          >
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              {card.title}
            </h2>
            <p className="mt-3 text-sm text-slate-300">{card.subtitle}</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {insightMetrics.map((metric) => {
                const isNegativeChange = metric.change?.trim().startsWith("-");
                const changeColor = isNegativeChange ? "text-rose-400" : "text-emerald-400";

                return (
                  <div
                    key={`${card.title}-${metric.label}`}
                    className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/70">
                      {metric.label}
                    </dt>
                    <dd className="mt-3">
                      <p className="text-2xl font-semibold text-slate-100">
                        {formatNumber(metric.value, {
                          maximumFractionDigits: metric.suffix ? 1 : 0,
                        })}
                        {metric.suffix ? metric.suffix : ""}
                      </p>
                      {metric.change ? (
                        <p className={`mt-1 text-xs ${changeColor}`}>{metric.change}</p>
                      ) : null}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.4)] lg:col-span-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
            Narasi Utama Bulanan
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-200">
            {data.overviewNarrative}
          </p>
          <ul className="mt-4 space-y-3 text-sm text-slate-300">
            {data.highlights.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)] lg:col-span-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
            Aktivitas Personil
          </h2>
          <div className="mt-5 space-y-5">
            {data.userInsightMetrics.map((metric) => (
              <div key={metric.label} className="flex items-center justify-between rounded-2xl bg-slate-900/60 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">{metric.label}</p>
                  <p className="text-xs text-slate-400">Perbandingan bulan sebelumnya</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold text-white">
                    {formatNumber(metric.value, { maximumFractionDigits: metric.suffix ? 1 : 0 })}
                    {metric.suffix ? metric.suffix : ""}
                  </p>
                  <p className="text-xs text-emerald-400">{metric.change}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-7" aria-label="Visualisasi Kinerja">
        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.4)] lg:col-span-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
            Sebaran Reach & Engagement per Kanal
          </h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.engagementByChannel}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="channel" stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: "#cbd5f5", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "rgba(15,23,42,0.3)" }}
                  contentStyle={{
                    backgroundColor: "rgba(15,23,42,0.92)",
                    borderRadius: 16,
                    borderColor: "rgba(148,163,184,0.4)",
                    boxShadow: "0 20px 45px rgba(14,116,144,0.3)",
                    color: "#e2e8f0",
                  }}
                  formatter={(value, name) => {
                    if (name === "reach") {
                      return [formatNumber(value, { maximumFractionDigits: 0 }), "Reach"];
                    }
                    return [`${formatNumber(value, { maximumFractionDigits: 1 })}%`, "Engagement Rate"];
                  }}
                />
                <Legend wrapperStyle={{ color: "#e2e8f0" }} />
                <Bar dataKey="reach" name="Reach" fill="#38bdf8" radius={[8, 8, 0, 0]}>
                  <LabelList
                    dataKey="reach"
                    position="top"
                    formatter={(value) => formatNumber(value, { maximumFractionDigits: 0 })}
                    fill="#e2e8f0"
                    fontSize={11}
                  />
                </Bar>
                <Bar dataKey="engagementRate" name="Engagement Rate" fill="#a855f7" radius={[8, 8, 0, 0]}>
                  <LabelList
                    dataKey="engagementRate"
                    position="top"
                    formatter={(value) => `${formatNumber(value, { maximumFractionDigits: 1 })}%`}
                    fill="#f5f3ff"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)] lg:col-span-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
            Komposisi Audiens
          </h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.audienceComposition}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                >
                  {data.audienceComposition.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15,23,42,0.92)",
                    borderRadius: 16,
                    borderColor: "rgba(148,163,184,0.4)",
                    color: "#e2e8f0",
                  }}
                  formatter={(value) => [`${value}%`, "Kontribusi"]}
                />
                <Legend verticalAlign="bottom" wrapperStyle={{ color: "#e2e8f0" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="space-y-6" aria-label="Analisis Mendalam">
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.4)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Dashboard & Monitoring
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              {data.dashboardNarrative}
            </p>
          </article>
          <article className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.4)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Insight Pengguna Internal
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              {data.userInsightNarrative}
            </p>
          </article>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Rekap Instagram
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              {data.instagramNarrative}
            </p>
          </article>
          <article className="rounded-3xl border border-cyan-500/20 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(56,189,248,0.18)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
              Rekap TikTok
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              {data.tiktokNarrative}
            </p>
          </article>
        </div>
      </section>

      <section
        aria-label="Daftar Konten Berperforma"
        className="rounded-3xl border border-slate-800/60 bg-slate-950/70 p-6 shadow-[0_20px_45px_rgba(15,23,42,0.4)]"
      >
        <h2 className="text-sm font-semibold uppercase tracking-[0.35em] text-cyan-200/80">
          Konten dengan Performa Tertinggi
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-left">
            <thead className="bg-slate-900/70 text-xs uppercase tracking-wider text-slate-300">
              <tr>
                <th scope="col" className="px-4 py-3">Platform</th>
                <th scope="col" className="px-4 py-3">Judul Konten</th>
                <th scope="col" className="px-4 py-3">Format</th>
                <th scope="col" className="px-4 py-3 text-right">Reach</th>
                <th scope="col" className="px-4 py-3 text-right">Engagement</th>
                <th scope="col" className="px-4 py-3">Insight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
              {data.contentTable.map((row) => (
                <tr key={`${row.platform}-${row.title}`} className="hover:bg-slate-900/40">
                  <td className="px-4 py-3 font-medium text-cyan-200">{row.platform}</td>
                  <td className="px-4 py-3">{row.title}</td>
                  <td className="px-4 py-3">{row.format}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(row.reach, { maximumFractionDigits: 0 })}</td>
                  <td className="px-4 py-3 text-right">{row.engagement}%</td>
                  <td className="px-4 py-3 text-slate-300">{row.takeaway}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
