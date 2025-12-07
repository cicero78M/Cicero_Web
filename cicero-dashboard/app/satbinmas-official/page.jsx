"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, CheckCircle2, ShieldCheck, TrendingUp } from "lucide-react";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import ViewDataSelector from "@/components/ViewDataSelector";
import DashboardStats from "@/components/DashboardStats";
import HeatmapTable from "@/components/HeatmapTable";
import Loader from "@/components/Loader";

const OFFICIAL_ACCOUNTS = [
  {
    polres: "Polres Surabaya",
    displayName: "Ditbinmas Surabaya",
    platform: "instagram",
    handle: "@ditbinmas_sby",
    status: "Aktif",
    verified: true,
    followers: 12800,
    lastActive: "2024-11-05",
  },
  {
    polres: "Polres Surabaya",
    displayName: "Ditbinmas Surabaya TikTok",
    platform: "tiktok",
    handle: "@ditbinmas_sby_tiktok",
    status: "Aktif",
    verified: true,
    followers: 18400,
    lastActive: "2024-11-04",
  },
  {
    polres: "Polres Malang",
    displayName: "Humas Polres Malang",
    platform: "instagram",
    handle: "@polres_malang",
    status: "Aktif",
    verified: true,
    followers: 9600,
    lastActive: "2024-11-05",
  },
  {
    polres: "Polres Malang",
    displayName: "Polres Malang Official",
    platform: "tiktok",
    handle: "@polres_malang_official",
    status: "Dormant",
    verified: false,
    followers: 4200,
    lastActive: "2024-10-30",
  },
  {
    polres: "Polres Sidoarjo",
    displayName: "Polres Sidoarjo",
    platform: "instagram",
    handle: "@polres_sda",
    status: "Aktif",
    verified: true,
    followers: 8100,
    lastActive: "2024-11-03",
  },
  {
    polres: "Polres Sidoarjo",
    displayName: "Polres Sidoarjo TikTok",
    platform: "tiktok",
    handle: "@polres_sda_official",
    status: "Aktif",
    verified: false,
    followers: 11200,
    lastActive: "2024-11-02",
  },
  {
    polres: "Polres Gresik",
    displayName: "Polres Gresik",
    platform: "instagram",
    handle: "@polres_gresik",
    status: "Aktif",
    verified: true,
    followers: 7200,
    lastActive: "2024-11-04",
  },
  {
    polres: "Polres Gresik",
    displayName: "Satbinmas Gresik",
    platform: "tiktok",
    handle: "@gresik_satbinmas",
    status: "Aktif",
    verified: false,
    followers: 9300,
    lastActive: "2024-11-05",
  },
  {
    polres: "Polres Kediri",
    displayName: "Polres Kediri",
    platform: "instagram",
    handle: "@polres_kediri",
    status: "Aktif",
    verified: true,
    followers: 6400,
    lastActive: "2024-11-04",
  },
  {
    polres: "Polres Kediri",
    displayName: "Polres Kediri Official",
    platform: "tiktok",
    handle: "@polres_kediri_official",
    status: "Dormant",
    verified: false,
    followers: 5100,
    lastActive: "2024-10-28",
  },
];

const CONTENT_PERFORMANCE = [
  {
    id: "IG-001",
    polres: "Polres Surabaya",
    platform: "instagram",
    date: "2024-11-04",
    hour: 9,
    title: "Patroli dialogis di kawasan wisata",
    likes: 320,
    comments: 44,
    reach: 12800,
    hashtags: ["#patrolihumanis", "#ditbinmas"],
    mentions: ["@ditbinmas_poldajatim", "@satlantassby"],
  },
  {
    id: "IG-002",
    polres: "Polres Surabaya",
    platform: "instagram",
    date: "2024-11-05",
    hour: 17,
    title: "Edukasi keamanan lingkungan",
    likes: 410,
    comments: 52,
    reach: 14900,
    hashtags: ["#bhabinkamtibmas", "#ciceroditbinmas"],
    mentions: ["@ditbinmas_poldajatim"],
  },
  {
    id: "TT-003",
    polres: "Polres Surabaya",
    platform: "tiktok",
    date: "2024-11-02",
    hour: 20,
    title: "Sosialisasi tertib lalu lintas",
    likes: 980,
    comments: 150,
    reach: 34200,
    hashtags: ["#tertibberlalu", "#satbinmas"],
    mentions: ["@ditbinmas_poldajatim", "@humaspoldajatim"],
  },
  {
    id: "IG-004",
    polres: "Polres Malang",
    platform: "instagram",
    date: "2024-11-01",
    hour: 11,
    title: "Binluh kamtibmas di sekolah",
    likes: 280,
    comments: 25,
    reach: 9900,
    hashtags: ["#binluh", "#satbinmas"],
    mentions: ["@ditbinmas_poldajatim"],
  },
  {
    id: "TT-005",
    polres: "Polres Malang",
    platform: "tiktok",
    date: "2024-11-03",
    hour: 19,
    title: "Liputan patroli malam",
    likes: 720,
    comments: 80,
    reach: 26500,
    hashtags: ["#patroli", "#polisimalang"],
    mentions: ["@ditbinmas_poldajatim"],
  },
  {
    id: "IG-006",
    polres: "Polres Sidoarjo",
    platform: "instagram",
    date: "2024-11-05",
    hour: 8,
    title: "Sosialisasi saber pungli",
    likes: 360,
    comments: 38,
    reach: 11300,
    hashtags: ["#saberpungli", "#satbinmas"],
    mentions: ["@ditbinmas_poldajatim"],
  },
  {
    id: "TT-007",
    polres: "Polres Sidoarjo",
    platform: "tiktok",
    date: "2024-11-04",
    hour: 15,
    title: "Giat strong point pagi",
    likes: 640,
    comments: 62,
    reach: 20100,
    hashtags: ["#strongpoint", "#satbinmas"],
    mentions: ["@ditbinmas_poldajatim", "@dishubsda"],
  },
  {
    id: "IG-008",
    polres: "Polres Gresik",
    platform: "instagram",
    date: "2024-11-03",
    hour: 10,
    title: "Pembinaan remaja masjid",
    likes: 250,
    comments: 20,
    reach: 8700,
    hashtags: ["#binmasgresik", "#remas"],
    mentions: ["@ditbinmas_poldajatim"],
  },
  {
    id: "TT-009",
    polres: "Polres Gresik",
    platform: "tiktok",
    date: "2024-11-05",
    hour: 18,
    title: "Door to door system",
    likes: 530,
    comments: 46,
    reach: 17800,
    hashtags: ["#dtds", "#bhabinkamtibmas"],
    mentions: ["@ditbinmas_poldajatim"],
  },
  {
    id: "IG-010",
    polres: "Polres Kediri",
    platform: "instagram",
    date: "2024-11-02",
    hour: 9,
    title: "Operasi bina kusuma",
    likes: 205,
    comments: 22,
    reach: 7600,
    hashtags: ["#binakusuma", "#satbinmas"],
    mentions: ["@ditbinmas_poldajatim"],
  },
  {
    id: "TT-011",
    polres: "Polres Kediri",
    platform: "tiktok",
    date: "2024-11-04",
    hour: 21,
    title: "Imbauan kamtibmas di alun-alun",
    likes: 420,
    comments: 55,
    reach: 15200,
    hashtags: ["#kamtibmaskediri", "#ditbinmas"],
    mentions: ["@ditbinmas_poldajatim"],
  },
  {
    id: "IG-012",
    polres: "Polres Surabaya",
    platform: "instagram",
    date: "2024-11-01",
    hour: 7,
    title: "Apel pagi Bhabinkamtibmas",
    likes: 275,
    comments: 18,
    reach: 9400,
    hashtags: ["#apelpagi", "#satbinmas"],
    mentions: ["@ditbinmas_poldajatim"],
  },
  {
    id: "IG-013",
    polres: "Polres Sidoarjo",
    platform: "instagram",
    date: "2024-11-02",
    hour: 13,
    title: "Edukasi pemilih pemula",
    likes: 310,
    comments: 27,
    reach: 10100,
    hashtags: ["#pemilihpemula", "#satbinmas"],
    mentions: ["@ditbinmas_poldajatim"],
  },
  {
    id: "TT-014",
    polres: "Polres Gresik",
    platform: "tiktok",
    date: "2024-11-01",
    hour: 16,
    title: "Cek kesiapan pos kamling",
    likes: 470,
    comments: 44,
    reach: 16200,
    hashtags: ["#poskamling", "#satbinmas"],
    mentions: ["@ditbinmas_poldajatim"],
  },
];

const VIEW_OPTIONS = [
  { value: "today", label: "Harian (hari ini)", periode: "harian", custom: true },
  { value: "week", label: "Mingguan (7 hari)", periode: "mingguan" },
  { value: "month", label: "Bulanan", periode: "bulanan", month: true },
  { value: "custom_range", label: "Rentang Tanggal", periode: "custom", range: true },
];

const TIME_BUCKETS = [
  { label: "06-10", start: 6, end: 10 },
  { label: "10-14", start: 10, end: 14 },
  { label: "14-18", start: 14, end: 18 },
  { label: "18-22", start: 18, end: 22 },
];

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function parseDateOnly(value) {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatNumber(value) {
  return new Intl.NumberFormat("id-ID").format(Math.round(value));
}

export default function SatbinmasOfficialPage() {
  useRequireAuth();
  const router = useRouter();
  const { clientId, role, isHydrating } = useAuth();
  const today = new Date().toISOString().split("T")[0];
  const [viewBy, setViewBy] = useState("week");
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedMonth, setSelectedMonth] = useState(today.slice(0, 7));
  const [customRange, setCustomRange] = useState({ startDate: today, endDate: today });
  const [platformFilter, setPlatformFilter] = useState("all");
  const [polresFilter, setPolresFilter] = useState("all");
  const [accounts, setAccounts] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [accessChecked, setAccessChecked] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (isHydrating) return;
    const normalizedClient = (clientId || "").trim().toLowerCase();
    const normalizedRole = (role || "").trim().toLowerCase();
    const isDitbinmas = normalizedClient === "ditbinmas" && normalizedRole === "ditbinmas";
    setForbidden(!isDitbinmas);
    setAccessChecked(true);
    if (!isDitbinmas) {
      setError("403 | Akses khusus Ditbinmas diperlukan.");
      setLoading(false);
      const redirectTimer = setTimeout(() => router.replace("/"), 1200);
      return () => clearTimeout(redirectTimer);
    }
    setLoading(true);
    setError("");
    setAccounts([]);
    setContent([]);
    const timer = setTimeout(() => {
      setAccounts(OFFICIAL_ACCOUNTS);
      setContent(CONTENT_PERFORMANCE);
      setLoading(false);
    }, 320);
    return () => clearTimeout(timer);
  }, [clientId, role, isHydrating, router]);

  const polresOptions = useMemo(() => {
    const set = new Set(accounts.map((item) => item.polres));
    return ["all", ...Array.from(set)];
  }, [accounts]);

  const dateRange = useMemo(() => {
    if (viewBy === "today") {
      const date = parseDateOnly(selectedDate);
      return { start: date, end: date };
    }
    if (viewBy === "week") {
      const end = parseDateOnly(selectedDate);
      const start = new Date(end);
      start.setDate(end.getDate() - 6);
      return { start, end };
    }
    if (viewBy === "month") {
      const [year, month] = selectedMonth.split("-").map(Number);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return { start, end };
    }
    return {
      start: parseDateOnly(customRange.startDate || today),
      end: parseDateOnly(customRange.endDate || customRange.startDate || today),
    };
  }, [viewBy, selectedDate, selectedMonth, customRange, today]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const matchesPlatform = platformFilter === "all" || account.platform === platformFilter;
      const matchesPolres = polresFilter === "all" || account.polres === polresFilter;
      const activeDate = parseDateOnly(account.lastActive);
      const matchesDate = activeDate >= dateRange.start && activeDate <= dateRange.end;
      return matchesPlatform && matchesPolres && matchesDate;
    });
  }, [accounts, platformFilter, polresFilter, dateRange]);

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      const matchesPlatform = platformFilter === "all" || item.platform === platformFilter;
      const matchesPolres = polresFilter === "all" || item.polres === polresFilter;
      const contentDate = parseDateOnly(item.date);
      const matchesDate = contentDate >= dateRange.start && contentDate <= dateRange.end;
      return matchesPlatform && matchesPolres && matchesDate;
    });
  }, [content, platformFilter, polresFilter, dateRange]);

  const accountSummaries = useMemo(() => {
    const summaryMap = new Map();

    filteredContent.forEach((item) => {
      const key = `${item.polres}-${item.platform}`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          polres: item.polres,
          platform: item.platform,
          posts: 0,
          likes: 0,
          comments: 0,
        });
      }
      const current = summaryMap.get(key);
      current.posts += 1;
      current.likes += item.likes;
      current.comments += item.comments;
    });

    filteredAccounts.forEach((account) => {
      const key = `${account.polres}-${account.platform}`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          polres: account.polres,
          platform: account.platform,
          posts: 0,
          likes: 0,
          comments: 0,
        });
      }
    });

    return Array.from(summaryMap.values())
      .map((entry) => {
        const accountMeta = filteredAccounts.find(
          (acc) => acc.polres === entry.polres && acc.platform === entry.platform,
        );
        const engagementTotal = entry.likes + entry.comments;
        return {
          ...entry,
          displayName: accountMeta?.displayName || entry.polres,
          handle: accountMeta?.handle || "-",
          verified: accountMeta?.verified ?? false,
          status: accountMeta?.status || "Tidak diketahui",
          followers: accountMeta?.followers ?? 0,
          totalEngagement: engagementTotal,
          avgEngagement: entry.posts ? engagementTotal / entry.posts : 0,
        };
      })
      .sort((a, b) => {
        if (b.totalEngagement !== a.totalEngagement) return b.totalEngagement - a.totalEngagement;
        if (b.posts !== a.posts) return b.posts - a.posts;
        return a.displayName.localeCompare(b.displayName);
      });
  }, [filteredAccounts, filteredContent]);

  const coverageStats = useMemo(() => {
    const polresCovered = new Set(filteredAccounts.map((item) => item.polres)).size;
    const activeHandles = filteredAccounts.filter((a) => a.status === "Aktif").length;
    const dormantHandles = filteredAccounts.filter((a) => a.status !== "Aktif").length;
    const followerTotal = filteredAccounts.reduce((sum, item) => sum + item.followers, 0);
    return [
      {
        key: "polres",
        title: "Polres Tercover",
        value: polresCovered,
        subtitle: "Memiliki akun resmi dalam periode",
        icon: <ShieldCheck className="h-5 w-5 text-sky-500" />,
      },
      {
        key: "aktif",
        title: "Akun Aktif",
        value: activeHandles,
        subtitle: "Terpantau posting dalam periode",
        icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      },
      {
        key: "dormant",
        title: "Perlu Aktivasi",
        value: dormantHandles,
        subtitle: "Belum update >= 7 hari",
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
      },
      {
        key: "followers",
        title: "Total Followers",
        value: followerTotal,
        subtitle: "Akumulasi akun resmi",
        icon: <TrendingUp className="h-5 w-5 text-indigo-500" />,
      },
    ];
  }, [filteredAccounts]);

  const coverageTable = useMemo(() => {
    const map = new Map();
    filteredAccounts.forEach((item) => {
      if (!map.has(item.polres)) {
        map.set(item.polres, { polres: item.polres, active: 0, dormant: 0, followers: 0 });
      }
      const current = map.get(item.polres);
      if (item.status === "Aktif") current.active += 1;
      else current.dormant += 1;
      current.followers += item.followers;
    });
    return Array.from(map.values()).sort((a, b) => b.followers - a.followers);
  }, [filteredAccounts]);

  const activityByDate = useMemo(() => {
    const map = new Map();
    filteredContent.forEach((item) => {
      const label = item.date;
      if (!map.has(label)) {
        map.set(label, { date: label, instagram: 0, tiktok: 0 });
      }
      const current = map.get(label);
      if (item.platform === "instagram") current.instagram += 1;
      if (item.platform === "tiktok") current.tiktok += 1;
    });
    return Array.from(map.values()).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [filteredContent]);

  const heatmapData = useMemo(() => {
    const buckets = {};
    TIME_BUCKETS.forEach((b) => {
      DAY_NAMES.forEach((day) => {
        if (!buckets[day]) buckets[day] = {};
        buckets[day][b.label] = 0;
      });
    });

    const topTen = [...filteredContent]
      .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
      .slice(0, 10);

    topTen.forEach((item) => {
      const day = DAY_NAMES[new Date(item.date).getDay()];
      const bucket = TIME_BUCKETS.find((b) => item.hour >= b.start && item.hour < b.end);
      if (!bucket) return;
      const value = item.likes + item.comments;
      buckets[day][bucket.label] = (buckets[day][bucket.label] || 0) + value / 100;
    });

    return { data: buckets, days: DAY_NAMES.slice(1).concat(DAY_NAMES[0]), buckets: TIME_BUCKETS.map((b) => b.label) };
  }, [filteredContent]);

  const engagementStats = useMemo(() => {
    const totalLikes = filteredContent.reduce((sum, item) => sum + item.likes, 0);
    const totalComments = filteredContent.reduce((sum, item) => sum + item.comments, 0);
    const avgLikes = filteredContent.length ? totalLikes / filteredContent.length : 0;
    const avgComments = filteredContent.length ? totalComments / filteredContent.length : 0;
    return {
      totalLikes,
      totalComments,
      avgLikes,
      avgComments,
    };
  }, [filteredContent]);

  const topPolresEngagement = useMemo(() => {
    const map = new Map();
    filteredContent.forEach((item) => {
      if (!map.has(item.polres)) {
        map.set(item.polres, { polres: item.polres, likes: 0, comments: 0, posts: 0 });
      }
      const current = map.get(item.polres);
      current.likes += item.likes;
      current.comments += item.comments;
      current.posts += 1;
    });
    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        engagement: entry.likes + entry.comments,
        avgEngagement: entry.posts ? (entry.likes + entry.comments) / entry.posts : 0,
      }))
      .sort((a, b) => b.engagement - a.engagement)
      .slice(0, 10);
  }, [filteredContent]);

  const topContent = useMemo(() => {
    return [...filteredContent]
      .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
      .slice(0, 5);
  }, [filteredContent]);

  const leaderboard = useMemo(() => {
    const hashtagMap = new Map();
    const mentionMap = new Map();
    filteredContent.forEach((item) => {
      item.hashtags.forEach((tag) => {
        const key = tag.toLowerCase();
        hashtagMap.set(key, (hashtagMap.get(key) || 0) + 1);
      });
      item.mentions.forEach((mention) => {
        const key = mention.toLowerCase();
        mentionMap.set(key, (mentionMap.get(key) || 0) + 1);
      });
    });
    const topHashtags = Array.from(hashtagMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const topMentions = Array.from(mentionMap.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { topHashtags, topMentions };
  }, [filteredContent]);

  if (loading || !accessChecked) {
    return <Loader />;
  }

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow">
          <p className="text-sm font-semibold text-red-500">403 | Forbidden</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-800">Akses Ditbinmas diperlukan</h1>
          <p className="mt-2 text-sm text-slate-600">
            Halaman Satbinmas Official hanya dapat dibuka oleh akun dengan role dan client Ditbinmas. Anda akan dialihkan ke
            beranda.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/")}
            className="mt-4 rounded-xl bg-sky-600 px-4 py-2 text-white shadow hover:bg-sky-700"
          >
            Kembali ke dashboard
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow">
          <p className="text-sm font-semibold text-red-500">Terjadi Kesalahan</p>
          <p className="mt-2 text-slate-700">{error}</p>
        </div>
      </div>
    );
  }

  const isEmpty = !filteredAccounts.length && !filteredContent.length;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pt-10">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">Ditbinmas</p>
          <h1 className="text-3xl font-bold text-slate-900">Satbinmas Official</h1>
          <p className="text-sm text-slate-600">
            Monitoring kinerja akun resmi Ditbinmas beserta Polres jajaran, lengkap dengan aktivitas konten dan pola engagement
            lintas platform.
          </p>
        </header>

        <section className="rounded-2xl border border-indigo-100 bg-white/70 p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <ViewDataSelector
              value={viewBy}
              onChange={setViewBy}
              options={VIEW_OPTIONS}
              date={
                viewBy === "custom_range"
                  ? customRange
                  : viewBy === "month"
                    ? selectedMonth
                    : selectedDate
              }
              onDateChange={(val) => {
                if (viewBy === "custom_range") setCustomRange(val);
                else if (viewBy === "month") setSelectedMonth(val);
                else setSelectedDate(val);
              }}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Platform</label>
                <select
                  className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                >
                  <option value="all">All Platform</option>
                  <option value="instagram">Instagram</option>
                  <option value="tiktok">TikTok</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Polres</label>
                <select
                  className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-inner focus:border-sky-200 focus:outline-none focus:ring-2 focus:ring-sky-200/60"
                  value={polresFilter}
                  onChange={(e) => setPolresFilter(e.target.value)}
                >
                  <option value="all">Semua Polres</option>
                  {polresOptions.map((polres) => (
                    <option key={polres} value={polres}>
                      {polres}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700">Periode</label>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-inner">
                  {`${dateRange.start.toLocaleDateString("id-ID")} - ${dateRange.end.toLocaleDateString("id-ID")}`}
                </div>
              </div>
            </div>
          </div>
        </section>

        {isEmpty ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
            Tidak ada data yang cocok dengan filter yang dipilih.
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Ringkasan cepat akun</h2>
                  <p className="text-sm text-slate-600">
                    Akumulasi posting dan engagement per kombinasi Polres serta platform berikut status verifikasi akun.
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Performa akun per periode</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 text-left">Akun</th>
                        <th className="px-4 py-2 text-left">Platform</th>
                        <th className="px-4 py-2 text-left">Verifikasi</th>
                        <th className="px-4 py-2 text-left">Total Posting</th>
                        <th className="px-4 py-2 text-left">Total Likes & Komentar</th>
                        <th className="px-4 py-2 text-left">Rata-rata/Posting</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {accountSummaries.map((summary) => (
                        <tr key={`${summary.polres}-${summary.platform}`} className="hover:bg-slate-50">
                          <td className="px-4 py-2">
                            <p className="font-semibold text-slate-800">{summary.displayName}</p>
                            <p className="text-xs text-slate-500">{summary.handle}</p>
                          </td>
                          <td className="px-4 py-2 capitalize text-slate-700">{summary.platform}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              {summary.verified ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                              )}
                              <span className={summary.verified ? "text-emerald-600" : "text-amber-600"}>
                                {summary.verified ? "Terverifikasi" : "Belum Verifikasi"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">Status akun: {summary.status}</p>
                          </td>
                          <td className="px-4 py-2 font-semibold text-slate-800">{summary.posts}</td>
                          <td className="px-4 py-2 font-semibold text-slate-800">{formatNumber(summary.totalEngagement)}</td>
                          <td className="px-4 py-2 text-slate-700">{summary.avgEngagement.toFixed(1)}</td>
                        </tr>
                      ))}
                      {!accountSummaries.length && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                            Belum ada ringkasan akun untuk filter yang dipilih.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Ringkasan Coverage Akun Resmi</h2>
                  <p className="text-sm text-slate-600">Status akun Ditbinmas dan Polres beserta total jangkauan followers.</p>
                </div>
              </div>
              <DashboardStats highlights={coverageStats} />
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">Distribusi Polres</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-2 text-left">Polres</th>
                        <th className="px-4 py-2 text-left">Akun Aktif</th>
                        <th className="px-4 py-2 text-left">Akun Dormant</th>
                        <th className="px-4 py-2 text-left">Followers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {coverageTable.map((row) => (
                        <tr key={row.polres} className="hover:bg-slate-50">
                          <td className="px-4 py-2 font-semibold text-slate-800">{row.polres}</td>
                          <td className="px-4 py-2">{row.active}</td>
                          <td className="px-4 py-2 text-amber-600">{row.dormant}</td>
                          <td className="px-4 py-2 font-medium text-slate-900">{formatNumber(row.followers)}</td>
                        </tr>
                      ))}
                      {!coverageTable.length && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                            Belum ada akun resmi pada periode ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Aktivitas Konten</h2>
                  <p className="text-sm text-slate-600">Perbandingan volume posting harian per platform dan waktu tayang top konten.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700">Bar Chart IG vs TikTok</p>
                  <div className="h-72">
                    {activityByDate.length ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activityByDate}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="instagram" name="Instagram" fill="#2563eb" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="tiktok" name="TikTok" fill="#111827" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-500">Belum ada aktivitas.</div>
                    )}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700">Heatmap Kalender (Top 10 Konten)</p>
                  <div className="overflow-x-auto">
                    <HeatmapTable data={heatmapData.data} days={heatmapData.days} buckets={heatmapData.buckets} />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Kualitas & Engagement</h2>
                  <p className="text-sm text-slate-600">Ringkasan likes, komentar, serta Polres dan konten dengan performa terbaik.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Total Likes</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(engagementStats.totalLikes)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Total Komentar</p>
                  <p className="text-2xl font-bold text-slate-900">{formatNumber(engagementStats.totalComments)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Rata-rata Likes</p>
                  <p className="text-2xl font-bold text-slate-900">{engagementStats.avgLikes.toFixed(1)}</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">Rata-rata Komentar</p>
                  <p className="text-2xl font-bold text-slate-900">{engagementStats.avgComments.toFixed(1)}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700">Top 10 Polres</p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-slate-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Polres</th>
                          <th className="px-3 py-2 text-left">Likes</th>
                          <th className="px-3 py-2 text-left">Komentar</th>
                          <th className="px-3 py-2 text-left">Avg/Posting</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {topPolresEngagement.map((row) => (
                          <tr key={row.polres} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-semibold text-slate-800">{row.polres}</td>
                            <td className="px-3 py-2">{formatNumber(row.likes)}</td>
                            <td className="px-3 py-2">{formatNumber(row.comments)}</td>
                            <td className="px-3 py-2">{row.avgEngagement.toFixed(1)}</td>
                          </tr>
                        ))}
                        {!topPolresEngagement.length && (
                          <tr>
                            <td colSpan={4} className="px-3 py-4 text-center text-slate-500">
                              Belum ada aktivitas untuk polres terpilih.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700">Top Konten</p>
                  <ul className="mt-3 space-y-3">
                    {topContent.map((item) => (
                      <li key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                            <p className="text-xs text-slate-500">
                              {item.polres} • {item.platform.toUpperCase()} • {item.date}
                            </p>
                          </div>
                          <div className="text-right text-xs text-slate-600">
                            <p>👍 {formatNumber(item.likes)}</p>
                            <p>💬 {formatNumber(item.comments)}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                    {!topContent.length && (
                      <li className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-slate-500">
                        Belum ada konten yang memenuhi filter.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Pola Konten</h2>
                  <p className="text-sm text-slate-600">Hashtag dan mention terpopuler untuk memperkuat koordinasi publikasi.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700">Leaderboard Hashtag</p>
                  <ul className="mt-3 space-y-2">
                    {leaderboard.topHashtags.map((tag) => (
                      <li key={tag.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="font-semibold text-slate-800">{tag.label}</span>
                        <span className="text-sm text-slate-600">{tag.count}x dipakai</span>
                      </li>
                    ))}
                    {!leaderboard.topHashtags.length && (
                      <li className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-slate-500">
                        Belum ada hashtag tercatat.
                      </li>
                    )}
                  </ul>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700">Leaderboard Mention</p>
                  <ul className="mt-3 space-y-2">
                    {leaderboard.topMentions.map((mention) => (
                      <li key={mention.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <span className="font-semibold text-slate-800">{mention.label}</span>
                        <span className="text-sm text-slate-600">{mention.count}x disebut</span>
                      </li>
                    ))}
                    {!leaderboard.topMentions.length && (
                      <li className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-slate-500">
                        Belum ada mention tercatat.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
