"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ArrowUpRight, CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import Loader from "@/components/Loader";

const POLRES_DIRECTORY: Record<
  string,
  {
    name: string;
    wilayah: string;
    polda: string;
    accountStatus: "lengkap" | "kurang" | "belum";
    instagram?: string;
    tiktok?: string;
    profileNote: string;
  }
> = {
  "polres-surabaya": {
    name: "Polrestabes Surabaya",
    wilayah: "Kota Surabaya",
    polda: "Polda Jatim",
    accountStatus: "lengkap",
    instagram: "https://www.instagram.com/ditbinmas_sby",
    tiktok: "https://www.tiktok.com/@ditbinmas_sby_tiktok",
    profileNote: "Fokus pada patroli dialogis, edukasi lingkungan aman, dan kolaborasi komunitas.",
  },
  "polres-malang": {
    name: "Polres Malang",
    wilayah: "Kabupaten Malang",
    polda: "Polda Jatim",
    accountStatus: "kurang",
    instagram: "https://www.instagram.com/polres_malang",
    tiktok: "https://www.tiktok.com/@polres_malang_official",
    profileNote: "Distribusi konten edukatif rutin, namun kolom komentar masih jarang dibalas.",
  },
  "polres-sidoarjo": {
    name: "Polresta Sidoarjo",
    wilayah: "Kabupaten Sidoarjo",
    polda: "Polda Jatim",
    accountStatus: "belum",
    instagram: "https://www.instagram.com/polres_sda",
    tiktok: undefined,
    profileNote: "Perlu aktivasi kanal video pendek dan penjadwalan ulang konten dinas mingguan.",
  },
};

const CLIENT_CONTENT: Record<
  string,
  Array<{
    id: string;
    platform: "instagram" | "tiktok";
    date: string;
    caption: string;
    hashtags: string[];
    likes: number;
    comments: number;
    externalLink: string;
  }>
> = {
  "polres-surabaya": [
    {
      id: "IG-01",
      platform: "instagram",
      date: "2024-11-05",
      caption: "Patroli dialogis di kawasan wisata untuk libur panjang.",
      hashtags: ["#patrolihumanis", "#ditbinmas", "#surabayaaman"],
      likes: 410,
      comments: 52,
      externalLink: "https://www.instagram.com/p/CzPatroli01",
    },
    {
      id: "TT-02",
      platform: "tiktok",
      date: "2024-11-04",
      caption: "Strong point pagi bersama pengelola pasar tradisional.",
      hashtags: ["#strongpoint", "#bhabinkamtibmas"],
      likes: 710,
      comments: 88,
      externalLink: "https://www.tiktok.com/@ditbinmas_sby_tiktok/video/8844",
    },
    {
      id: "IG-03",
      platform: "instagram",
      date: "2024-11-03",
      caption: "Edukasi keamanan lingkungan di RW binaan.",
      hashtags: ["#edukasikeamanan", "#ditbinmas"],
      likes: 320,
      comments: 39,
      externalLink: "https://www.instagram.com/p/CzEdukasi03",
    },
    {
      id: "TT-04",
      platform: "tiktok",
      date: "2024-11-02",
      caption: "Liputan giat patroli malam dan pesan kamtibmas.",
      hashtags: ["#patroli", "#kamtibmas"],
      likes: 640,
      comments: 72,
      externalLink: "https://www.tiktok.com/@ditbinmas_sby_tiktok/video/8841",
    },
    {
      id: "IG-05",
      platform: "instagram",
      date: "2024-11-01",
      caption: "Sosialisasi saber pungli di sekolah menengah.",
      hashtags: ["#saberpungli", "#sekolah"],
      likes: 295,
      comments: 28,
      externalLink: "https://www.instagram.com/p/CzSaber05",
    },
  ],
  "polres-malang": [
    {
      id: "IG-11",
      platform: "instagram",
      date: "2024-11-05",
      caption: "Binluh kamtibmas di sekolah kejuruan.",
      hashtags: ["#binluh", "#polresmalang"],
      likes: 260,
      comments: 22,
      externalLink: "https://www.instagram.com/p/CzBinluh11",
    },
    {
      id: "TT-12",
      platform: "tiktok",
      date: "2024-11-03",
      caption: "Patroli malam di jalur wisata Batu.",
      hashtags: ["#patroli", "#malang"],
      likes: 480,
      comments: 55,
      externalLink: "https://www.tiktok.com/@polres_malang_official/video/1122",
    },
    {
      id: "IG-13",
      platform: "instagram",
      date: "2024-10-31",
      caption: "Silaturahmi ke tokoh masyarakat dan FKPM.",
      hashtags: ["#silaturahmi", "#fkpm"],
      likes: 190,
      comments: 16,
      externalLink: "https://www.instagram.com/p/CySilaturahmi13",
    },
  ],
  "polres-sidoarjo": [
    {
      id: "IG-21",
      platform: "instagram",
      date: "2024-10-28",
      caption: "Pengaturan lalu lintas saat arus mudik lokal.",
      hashtags: ["#lalin", "#mudik"],
      likes: 140,
      comments: 14,
      externalLink: "https://www.instagram.com/p/CyLalin21",
    },
  ],
};

const POLDA_AVERAGE_ENGAGEMENT = 420;

function formatNumber(value: number) {
  return new Intl.NumberFormat("id-ID").format(Math.round(value));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

function calculatePeriodDays(dates: string[]) {
  if (!dates.length) return 0;
  const sorted = [...dates].sort();
  const start = new Date(sorted[0]);
  const end = new Date(sorted[sorted.length - 1]);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff + 1;
}

type SatbinmasClientDashboardProps = {
  params: { client_id?: string };
};

function resolveClientId(params?: { client_id?: string }) {
  return params?.client_id || "";
}

export default function SatbinmasClientDashboard({ params }: SatbinmasClientDashboardProps) {
  useRequireAuth();
  const router = useRouter();
  const { clientId, role, isHydrating } = useAuth();
  const [forbidden, setForbidden] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

  const clientKey = resolveClientId(params).toLowerCase();
  const profile = POLRES_DIRECTORY[clientKey];
  const content = CLIENT_CONTENT[clientKey] || [];

  useEffect(() => {
    if (isHydrating) return;
    const normalizedClient = (clientId || "").toLowerCase();
    const normalizedRole = (role || "").toLowerCase();
    const isDitbinmas = normalizedClient === "ditbinmas" && normalizedRole === "ditbinmas";
    setForbidden(!isDitbinmas);
    setAccessChecked(true);
    if (!isDitbinmas) {
      const timer = setTimeout(() => router.replace("/"), 1200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [clientId, role, isHydrating, router]);

  const latestContent = useMemo(
    () => [...content].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [content],
  );

  const dailyPosting = useMemo(() => {
    const dateMap = new Map<string, { instagram: number; tiktok: number }>();
    content.forEach((item) => {
      const current = dateMap.get(item.date) || { instagram: 0, tiktok: 0 };
      const key = item.platform === "instagram" ? "instagram" : "tiktok";
      current[key] += 1;
      dateMap.set(item.date, current);
    });
    return Array.from(dateMap.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [content]);

  const stats = useMemo(() => {
    const totalEngagement = content.reduce((sum, item) => sum + item.likes + item.comments, 0);
    const totalPosts = content.length;
    const instagramPosts = content.filter((item) => item.platform === "instagram").length;
    const tiktokPosts = content.filter((item) => item.platform === "tiktok").length;
    const avgEngagement = totalPosts ? totalEngagement / totalPosts : 0;
    const lastPosting = latestContent[0]?.date;

    return {
      totalEngagement,
      avgEngagement,
      instagramPosts,
      tiktokPosts,
      lastPosting,
    };
  }, [content, latestContent]);

  const activityInsight = useMemo(() => {
    if (!content.length) {
      return {
        message: "Belum ada aktivitas tercatat untuk Polres ini.",
        label: "Di bawah rata-rata Polda",
        isAbove: false,
      };
    }
    const uniqueDates = new Set(content.map((item) => item.date));
    const periodDays = calculatePeriodDays([...uniqueDates]);
    const activeRatio = periodDays ? Math.round((uniqueDates.size / periodDays) * 100) : 0;
    const isAbove = stats.avgEngagement >= POLDA_AVERAGE_ENGAGEMENT;
    const label = isAbove ? "Di atas rata-rata Polda" : "Di bawah rata-rata Polda";
    const message = `Aktif ${uniqueDates.size} dari ${periodDays} hari terakhir (${activeRatio}% hari aktif).`;
    return { message, label, isAbove };
  }, [content, stats.avgEngagement]);

  if (!accessChecked || isHydrating) {
    return (
      <div className="p-6">
        <Loader />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <ShieldAlert className="h-10 w-10 text-amber-500" />
        <p className="text-lg font-semibold text-slate-900">Akses Ditbinmas diperlukan</p>
        <p className="max-w-xl text-sm text-slate-600">
          Halaman ini hanya dapat dibuka oleh akun dengan role dan client Ditbinmas. Anda akan diarahkan kembali ke
          dashboard utama.
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="text-lg font-semibold text-slate-900">Client tidak ditemukan</p>
        <p className="max-w-xl text-sm text-slate-600">
          Pastikan Anda membuka halaman Satbinmas Official melalui tautan yang benar atau pilih Polres dari daftar resmi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white shadow-md">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">Satbinmas Official</p>
            <h1 className="text-2xl font-bold md:text-3xl">{profile.name}</h1>
            <p className="text-sm text-slate-200">{`${profile.wilayah} • ${profile.polda}`}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                profile.accountStatus === "lengkap"
                  ? "bg-emerald-100 text-emerald-800"
                  : profile.accountStatus === "kurang"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
              }`}
            >
              Status {profile.accountStatus}
            </span>
            {activityInsight.isAbove ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> {activityInsight.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                <ShieldAlert className="h-4 w-4" /> {activityInsight.label}
              </span>
            )}
          </div>
        </div>
        <p className="max-w-3xl text-sm text-slate-100">{profile.profileNote}</p>
        <div className="flex flex-wrap gap-3 text-sm text-sky-100">
          {profile.instagram && (
            <a
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 font-semibold backdrop-blur hover:bg-white/20"
              href={profile.instagram}
              target="_blank"
              rel="noreferrer"
            >
              Instagram <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
          {profile.tiktok && (
            <a
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 font-semibold backdrop-blur hover:bg-white/20"
              href={profile.tiktok}
              target="_blank"
              rel="noreferrer"
            >
              TikTok <ArrowUpRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Total Post Instagram</p>
          <p className="text-2xl font-bold text-slate-900">{stats.instagramPosts}</p>
          <p className="text-xs text-slate-500">Dalam periode data terbaru</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Total Post TikTok</p>
          <p className="text-2xl font-bold text-slate-900">{stats.tiktokPosts}</p>
          <p className="text-xs text-slate-500">Dalam periode data terbaru</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Engagement Total</p>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(stats.totalEngagement)}</p>
          <p className="text-xs text-slate-500">Likes + komentar</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-700">Rata-rata Engagement</p>
          <p className="text-2xl font-bold text-slate-900">{formatNumber(stats.avgEngagement)}</p>
          <p className="text-xs text-slate-500">Per konten</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:col-span-2 lg:col-span-4">
          <p className="text-sm font-semibold text-slate-700">Insight Aktivitas</p>
          <div className="mt-2 flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <ShieldCheck className="mt-0.5 h-4 w-4 text-sky-500" />
            <div>
              <p className="font-semibold text-slate-900">{activityInsight.message}</p>
              <p className="text-xs text-slate-600">
                Perbandingan terhadap rata-rata Polda: {activityInsight.label} (patokan {formatNumber(POLDA_AVERAGE_ENGAGEMENT)}
                /konten).
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:col-span-4">
          <p className="text-sm font-semibold text-slate-700">Posting Terakhir</p>
          <p className="text-xl font-bold text-slate-900">
            {stats.lastPosting ? formatDate(stats.lastPosting) : "Belum ada data"}
          </p>
          <p className="text-xs text-slate-500">Tanggal unggahan terbaru</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <div>
              <p className="text-sm font-semibold text-slate-700">Grafik Posting Harian</p>
              <p className="text-xs text-slate-500">Perbandingan volume Instagram vs TikTok</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyPosting}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => [`${value} post`, "Volume"]}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Legend />
                <Bar dataKey="instagram" fill="#4338ca" radius={[6, 6, 0, 0]} name="Instagram" />
                <Bar dataKey="tiktok" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="TikTok" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2">
            <div>
              <p className="text-sm font-semibold text-slate-700">Konten Terbaru</p>
              <p className="text-xs text-slate-500">Urut berdasarkan tanggal posting</p>
            </div>
          </div>
          <div className="space-y-3">
            {latestContent.length ? (
              latestContent.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-700 hover:border-sky-100 hover:bg-sky-50"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-slate-800">{formatDate(item.date)}</span>
                    <span
                      className={`rounded-full px-2 py-1 font-semibold uppercase tracking-wide ${
                        item.platform === "instagram"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-sky-100 text-sky-800"
                      }`}
                    >
                      {item.platform}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 font-semibold text-slate-900">{item.caption}</p>
                  <p className="text-xs text-slate-500">{item.hashtags.join(" ")}</p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>👍 {formatNumber(item.likes)} • 💬 {formatNumber(item.comments)}</span>
                    <a
                      className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-900"
                      href={item.externalLink}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Lihat konten <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-500">
                Belum ada konten yang tercatat.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-700">Catatan akses Ditbinmas</p>
        <p className="mt-1 text-sm text-slate-600">
          Data ini dirancang sebagai ringkasan cepat untuk Ditbinmas memantau kesiapan akun resmi Polres. Gunakan tautan profil
          untuk membuka dashboard publik atau meminta perbaikan jika status akun masih kurang/belum lengkap.
        </p>
      </div>
    </div>
  );
}
