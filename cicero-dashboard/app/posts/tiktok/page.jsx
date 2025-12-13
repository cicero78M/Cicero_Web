"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import EngagementLineChart from "@/components/EngagementLineChart";
import EngagementByTypeChart from "@/components/EngagementByTypeChart";
import HeatmapTable from "@/components/HeatmapTable";
import PostMetricsChart from "@/components/PostMetricsChart";
import TiktokPostsGrid from "@/components/TiktokPostsGrid";
import FilterBar from "@/components/FilterBar";
import WordCloudChart from "@/components/WordCloudChart";
import Loader from "@/components/Loader";
import Narrative from "@/components/Narrative";
import PostCompareChart from "@/components/PostCompareChart";
import useRequireAuth from "@/hooks/useRequireAuth";
import { Activity, Copy, Eye, Heart, PlayCircle, RefreshCw, Users } from "lucide-react";
import {
  getTiktokProfileViaBackend,
  getTiktokPostsViaBackend,
  getTiktokInfoViaBackend,
  getTiktokPostsByUsernameViaBackend,
  getClientProfile,
} from "@/utils/api";
import InsightLayout from "@/components/InsightLayout";
import InsightSectionCard from "@/components/insight/InsightSectionCard";
import InsightSummaryCard from "@/components/insight/InsightSummaryCard";
import { DEFAULT_INSIGHT_TABS } from "@/components/insight/tabs";
import RekapTiktokPosts from "@/components/likes/tiktok/Rekap/RekapTiktokPosts";
import { buildTiktokPostRekap } from "@/utils/tiktokPostRekap";
import { showToast } from "@/utils/showToast";

export default function TiktokPostAnalysisPage() {
  useRequireAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compareLink, setCompareLink] = useState("");
  const [compareStats, setCompareStats] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [activeTab, setActiveTab] = useState("insight");
  const rekapSectionRef = useRef(null);
  const [clientName, setClientName] = useState("");
  const [canSelectScope, setCanSelectScope] = useState(false);
  const [ditbinmasScope, setDitbinmasScope] = useState("client");
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [search, setSearch] = useState("");
  const reportPeriodeLabel = useMemo(() => {
    if (!startDate || !endDate) return `${startDate || "-"} - ${endDate || "-"}`;
    if (startDate === endDate) return startDate;
    return `${startDate} - ${endDate}`;
  }, [startDate, endDate]);

  const fetchData = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const clientId =
      typeof window !== "undefined" ? localStorage.getItem("client_id") : null;
    const role =
      typeof window !== "undefined" ? localStorage.getItem("user_role") || "" : "";

    if (!token || !clientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const clientProfile = await getClientProfile(token, clientId);
      setClientName(
        clientProfile?.client?.client_name ||
          clientProfile?.client_name ||
          clientProfile?.nama_client ||
          "",
      );
      const normalizedClientId = String(clientId || "").trim().toUpperCase();
      const normalizedRole = String(role || "").trim().toLowerCase();
      const normalizedClientType = String(
        clientProfile?.client?.client_type || clientProfile?.client_type || "",
      )
        .trim()
        .toUpperCase();
      const allowedScopeClients = new Set(["DITBINMAS", "DITSAMAPTA", "DITLANTAS", "BIDHUMAS"]);
      const isDirectorate =
        normalizedClientType === "DIREKTORAT" || normalizedRole === "ditbinmas";
      setCanSelectScope(isDirectorate && allowedScopeClients.has(normalizedClientId));
      const username =
        clientProfile.client?.client_tiktok?.replace(/^@/, "") ||
        clientProfile.client_tiktok?.replace(/^@/, "") ||
        process.env.NEXT_PUBLIC_TIKTOK_USER ||
        "tiktok";

      const profileRes = await getTiktokProfileViaBackend(token, username);
      setProfile(profileRes);

      const infoRes = await getTiktokInfoViaBackend(token, username);
      const infoData = infoRes.data || infoRes.info || infoRes;
      setInfo(infoData);

      const postRes = await getTiktokPostsViaBackend(
        token,
        clientId,
        50,
        startDate,
        endDate,
      );
      const postData = postRes.data || postRes.posts || postRes;
      setPosts(Array.isArray(postData) ? postData : []);
    } catch (err) {
      setError("Gagal mengambil data: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, ditbinmasScope]);

  function extractUsername(url) {
    if (!url) return "";
    return url
      .replace(/https?:\/\/(www\.)?tiktok.com\/@/i, "")
      .split(/[/?]/)[0]
      .replace(/^@/, "")
      .trim();
  }

  async function handleCompare(e) {
    e.preventDefault();
    const username = extractUsername(compareLink);
    if (!username) {
      setCompareError("Link tidak valid");
      return;
    }
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    if (!token) {
      setCompareError("Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    setCompareLoading(true);
    setCompareError("");
    try {
      const profileRes = await getTiktokProfileViaBackend(token, username);
      const postsRes = await getTiktokPostsByUsernameViaBackend(token, username, 12);
      const postData = postsRes.data || postsRes.posts || postsRes;
      const sorted = Array.isArray(postData)
        ? [...postData].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        : [];
      const subset = sorted.slice(-12);
      const first = subset.length ? new Date(subset[0].created_at) : new Date();
      const last = subset.length
        ? new Date(subset[subset.length - 1].created_at)
        : new Date();
      const diff = (last - first) / (1000 * 60 * 60 * 24) || 1;
      const postRate = (subset.length / diff).toFixed(2);

      const avgLikes =
        subset.reduce((s, p) => s + (p.like_count || 0), 0) /
        (subset.length || 1);
      const avgComments =
        subset.reduce((s, p) => s + (p.comment_count || 0), 0) /
        (subset.length || 1);
      const avgShares =
        subset.reduce((s, p) => s + (p.share_count || 0), 0) /
        (subset.length || 1);
      const avgViews =
        subset.reduce((s, p) => s + (p.view_count || 0), 0) /
        (subset.length || 1);
      const followerRatio = profileRes.followers
        ? (profileRes.followers / profileRes.following).toFixed(2)
        : "0";
      setCompareStats({
        username: profileRes.username,
        followers: profileRes.followers,
        following: profileRes.following,
        followerRatio: parseFloat(followerRatio),
        postRate: parseFloat(postRate),
        avgLikes,
        avgComments,
        avgShares,
        avgViews,
      });
    } catch (err) {
      setCompareStats(null);
      setCompareError("Gagal mengambil akun pembanding: " + (err.message || err));
    } finally {
      setCompareLoading(false);
    }
  }

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "rekap" && rekapSectionRef.current) {
      rekapSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleDitbinmasScopeChange = (event) => {
    const { value } = event.target || {};
    if (value === "client" || value === "all") {
      setDitbinmasScope(value);
    }
  };

  const ditbinmasScopeOptions = [
    { value: "client", label: clientName || "Client Aktif" },
    { value: "all", label: `Satker Jajaran ${clientName || "Ditbinmas"}` },
  ];

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-6 text-slate-700">
        <div className="rounded-3xl border border-rose-300/60 bg-white/80 px-8 py-6 text-center text-rose-600 shadow-[0_0_35px_rgba(248,113,113,0.18)] backdrop-blur">
          {error}
        </div>
      </div>
    );
  if (!profile) return null;

  const filteredPosts = posts.filter((p) => {
    const d = new Date(p.created_at);
    if (startDate && d < new Date(startDate)) return false;
    if (endDate && d > new Date(endDate + "T23:59:59")) return false;
    if (search && !(p.caption || "").toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const sortedPosts = [...filteredPosts].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  const firstDate = sortedPosts.length
    ? new Date(sortedPosts[0].created_at)
    : new Date();
  const lastDate = sortedPosts.length
    ? new Date(sortedPosts[sortedPosts.length - 1].created_at)
    : new Date();
  const diffDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24) || 1;
  const postingFreq = (sortedPosts.length / diffDays).toFixed(2);
  const followerRatio = profile.followers
    ? (profile.followers / profile.following).toFixed(2)
    : "0";

  const latestPosts = sortedPosts.slice(-12);
  const firstLatest = latestPosts.length
    ? new Date(latestPosts[0].created_at)
    : new Date();
  const lastLatest = latestPosts.length
    ? new Date(latestPosts[latestPosts.length - 1].created_at)
    : new Date();
  const diffLatest = (lastLatest - firstLatest) / (1000 * 60 * 60 * 24) || 1;
  const latestPostRate = (latestPosts.length / diffLatest).toFixed(2);
  const avgLikesClient =
    latestPosts.reduce((s, p) => s + (p.like_count || 0), 0) /
    (latestPosts.length || 1);
  const avgCommentsClient =
    latestPosts.reduce((s, p) => s + (p.comment_count || 0), 0) /
    (latestPosts.length || 1);
  const avgSharesClient =
    latestPosts.reduce((s, p) => s + (p.share_count || 0), 0) /
    (latestPosts.length || 1);
  const avgViewsClient =
    latestPosts.reduce((s, p) => s + (p.view_count || 0), 0) /
    (latestPosts.length || 1);

  const avgLikesAll =
    sortedPosts.reduce((s, p) => s + (p.like_count || 0), 0) /
    (sortedPosts.length || 1);
  const avgCommentsAll =
    sortedPosts.reduce((s, p) => s + (p.comment_count || 0), 0) /
    (sortedPosts.length || 1);
  const avgSharesAll =
    sortedPosts.reduce((s, p) => s + (p.share_count || 0), 0) /
    (sortedPosts.length || 1);
  const avgViewsAll =
    sortedPosts.reduce((s, p) => s + (p.view_count || 0), 0) /
    (sortedPosts.length || 1);
  const engagementRateValue = profile.followers
    ? ((avgLikesAll + avgCommentsAll) / profile.followers) * 100
    : 0;
  const engagementRate = engagementRateValue.toFixed(2);

  const totalPosts = info?.video_count ?? info?.post_count ?? info?.media_count;
  const totalLikes = info?.heart_count ?? info?.total_likes;

  const biography = profile.bio || info?.biography || "";
  const bioLink =
    (info?.bio_links && (info.bio_links[0]?.link || info.bio_links[0]?.url)) ||
    info?.external_url ||
    "";

  const accountType =
    info?.is_business || info?.is_professional ? "Bisnis" : "Pribadi";
  const privacyStatus = info?.is_private ? "Privat" : "Terbuka";

  const profilePic =
    profile.avatar_url ||
    profile.avatar ||
    profile.hd_profile_pic_url_info?.url ||
    profile.hd_profile_pic_versions?.[0]?.url ||
    info?.hd_profile_pic_url_info?.url ||
    info?.hd_profile_pic_versions?.[0]?.url ||
    "";

  const getProfilePicSrc = (url) => {
    if (!url) return "/file.svg";
    return url.replace(/\.heic(\?|$)/, ".jpg$1");
  };

  const hashtagMap = {};
  const mentionMap = {};
  const lineData = [];
  const typeMap = {};
  const heatmap = {};
  const buckets = ["0-5", "6-11", "12-17", "18-23"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  sortedPosts.forEach((p) => {
    const eng =
      ((p.like_count + p.comment_count + p.share_count) / profile.followers) *
      100;
    lineData.push({
      date: new Date(p.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      rate: parseFloat(eng.toFixed(2)),
    });

    if (!typeMap[p.type]) typeMap[p.type] = { total: 0, count: 0 };
    typeMap[p.type].total += eng;
    typeMap[p.type].count += 1;

    const captionText = typeof p.caption === "string" ? p.caption : "";
    const tags = captionText.match(/#\w+/g) || [];
    tags.forEach((t) => {
      hashtagMap[t] = (hashtagMap[t] || 0) + 1;
    });
    const mentions = captionText.match(/@\w+/g) || [];
    mentions.forEach((m) => {
      mentionMap[m] = (mentionMap[m] || 0) + 1;
    });

    const d = new Date(p.created_at);
    const day = dayNames[d.getDay()];
    const bucket = buckets[Math.floor(d.getHours() / 6)];
    if (!heatmap[day]) heatmap[day] = {};
    if (!heatmap[day][bucket]) heatmap[day][bucket] = 0;
    heatmap[day][bucket] += eng / 10;
  });

  const typeData = Object.entries(typeMap).map(([type, v]) => ({
    type,
    engagement: parseFloat((v.total / v.count).toFixed(2)),
  }));

  const topHashtags = Object.entries(hashtagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const topMentions = Object.entries(mentionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const wordMap = {};
  filteredPosts.forEach((p) => {
    const words =
      (typeof p.caption === "string" ? p.caption : "")
        .toLowerCase()
        .match(/\b\w+\b/g) || [];
    words.forEach((w) => {
      if (w.length > 3) {
        wordMap[w] = (wordMap[w] || 0) + 1;
      }
    });
  });
  const cloudWords = Object.entries(wordMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([text, value]) => ({ text, value }));

  const formatNumber = (value) => {
    if (value === undefined || value === null || Number.isNaN(Number(value))) {
      return "-";
    }
    return Number(value).toLocaleString("id-ID");
  };

  const scopeLabel = ditbinmasScope === "all" ? " (Satker Jajaran)" : "";

  const rekapSummary = {
    totalPosts: sortedPosts.length,
    postingFrequency: Number(postingFreq),
    avgLikes: avgLikesAll,
    avgComments: avgCommentsAll,
    avgShares: avgSharesAll,
    avgViews: avgViewsAll,
    engagementRate: engagementRateValue,
    followerRatio: Number(followerRatio) || 0,
  };

  function handleCopyRekap() {
    const message = buildTiktokPostRekap(rekapSummary, sortedPosts, {
      clientName: clientName || profile?.full_name || profile?.username,
      periodeLabel: reportPeriodeLabel,
      scope: ditbinmasScope,
    });

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(message).then(() => {
        showToast("Rekap disalin ke clipboard", "success");
      });
    } else {
      showToast(message, "info");
    }
  }

  const heroContent = (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-sky-100/70 bg-white/60 p-4 shadow-inner backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Periode data
            </span>
            <div className="text-lg font-semibold text-slate-800">
              {startDate} - {endDate}
            </div>
          </div>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
          >
            <RefreshCw className="h-4 w-4" />
            Muat ulang data
          </button>
        </div>
        <div className="mt-3">
          <FilterBar
            startDate={startDate}
            endDate={endDate}
            search={search}
            setStartDate={setStartDate}
            setEndDate={setEndDate}
            setSearch={setSearch}
          />
        </div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {canSelectScope && (
            <div className="flex items-center gap-2 rounded-xl border border-sky-100/80 bg-white/70 px-3 py-2 text-sm text-slate-700 shadow-inner">
              <span className="font-semibold text-slate-800">Lingkup:</span>
              <select
                value={ditbinmasScope}
                onChange={handleDitbinmasScopeChange}
                className="rounded-lg border border-sky-100 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm focus:border-sky-300 focus:outline-none"
              >
                {ditbinmasScopeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={handleCopyRekap}
            className="inline-flex items-center gap-2 rounded-2xl border border-teal-300/60 bg-teal-200/50 px-4 py-2 text-sm font-semibold text-teal-700 shadow-[0_0_25px_rgba(45,212,191,0.35)] transition-colors hover:border-teal-400/70 hover:bg-teal-200/70"
          >
            <Copy className="h-4 w-4 text-teal-600" />
            Salin Rekap
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-sky-100/80 bg-white/70 p-4 shadow-inner backdrop-blur">
        <div className="flex items-start gap-4">
          {profilePic && (
            <img
              src={getProfilePicSrc(profilePic)}
              alt="profile"
              loading="lazy"
              className="h-20 w-20 flex-shrink-0 rounded-full object-cover shadow"
              onError={(e) => {
                e.currentTarget.src = "/file.svg";
              }}
            />
          )}
          <div className="flex flex-col gap-1">
            <div className="text-lg font-semibold text-slate-800">
              {profile.full_name || profile.username}
            </div>
            <div className="text-sm text-slate-600">@{profile.username}</div>
            {profile.category && (
              <div className="text-xs text-slate-500">{profile.category}</div>
            )}
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1">{accountType}</span>
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1">{privacyStatus}</span>
              {totalPosts !== undefined ? (
                <span className="rounded-full border border-teal-100 bg-teal-50 px-3 py-1">
                  Total Posts: {formatNumber(totalPosts)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <InsightLayout
      title="TikTok Post Insight"
      description="Analisis performa postingan TikTok dengan tampilan seragam insight/rekap."
      tabs={DEFAULT_INSIGHT_TABS}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      heroContent={heroContent}
    >
      {activeTab === "insight" && (
        <div className="flex flex-col gap-10">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <InsightSummaryCard
              title="Followers"
              value={formatNumber(profile.followers)}
              helper="Total pengikut akun klien"
              icon={<Users className="h-5 w-5" />}
              tone="blue"
            />
            <InsightSummaryCard
              title="Follower/Following"
              value={followerRatio}
              helper="Rasio audience terhadap akun diikuti"
              icon={<Activity className="h-5 w-5" />}
              tone="purple"
            />
            <InsightSummaryCard
              title="Post / Hari (periode)"
              value={postingFreq}
              helper="Frekuensi unggahan selama rentang terpilih"
              icon={<PlayCircle className="h-5 w-5" />}
              tone="teal"
            />
            <InsightSummaryCard
              title="Engagement Rate"
              value={`${engagementRate}%`}
              helper="Rata-rata likes + komentar dibanding followers"
              icon={<Heart className="h-5 w-5" />}
              tone="blue"
            />
            <InsightSummaryCard
              title="Rata-rata Likes (12 post)"
              value={avgLikesClient.toFixed(1)}
              helper="Dari 12 posting terakhir"
              icon={<Heart className="h-5 w-5" />}
              tone="purple"
            />
            <InsightSummaryCard
              title="Rata-rata Views (12 post)"
              value={avgViewsClient.toFixed(1)}
              helper="Dari 12 posting terakhir"
              icon={<Eye className="h-5 w-5" />}
              tone="teal"
            />
          </div>

          <InsightSectionCard
            title="Perbandingan Akun"
            description="Bandingkan 12 posting terakhir klien dengan akun pembanding."
          >
            <form onSubmit={handleCompare} className="flex flex-col gap-3 md:flex-row md:items-center">
              <input
                type="text"
                placeholder="Link akun pembanding"
                value={compareLink}
                onChange={(e) => setCompareLink(e.target.value)}
                className="flex-1 rounded-xl border border-sky-100 bg-white px-3 py-2 text-sm shadow focus:border-sky-300 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-sky-700"
              >
                Bandingkan
              </button>
            </form>
            {compareError && <div className="text-sm font-semibold text-rose-600">{compareError}</div>}
            {compareLoading && <Loader />}
            {compareStats && (
              <div className="flex flex-col gap-4">
                <PostCompareChart
                  client={{
                    username: profile.username,
                    followers: profile.followers,
                    following: profile.following,
                    followerRatio: parseFloat(followerRatio),
                    postRate: parseFloat(latestPostRate),
                    avgLikes: avgLikesClient,
                    avgComments: avgCommentsClient,
                    avgShares: avgSharesClient,
                    avgViews: avgViewsClient,
                  }}
                  competitor={compareStats}
                />
                <Narrative>
                  {`Dalam 12 posting terakhir, ${profile.username} rata-rata memperoleh ${avgLikesClient.toFixed(1)} likes, ${avgCommentsClient.toFixed(1)} komentar, ${avgSharesClient.toFixed(1)} share, dan ${avgViewsClient.toFixed(1)} views dengan frekuensi ${latestPostRate} posting per hari serta rasio follower/following ${followerRatio}. `}
                  {`Sementara ${compareStats.username} rata-rata ${compareStats.avgLikes.toFixed(1)} likes, ${compareStats.avgComments.toFixed(1)} komentar, ${compareStats.avgShares.toFixed(1)} share, dan ${compareStats.avgViews.toFixed(1)} views dengan frekuensi ${compareStats.postRate} posting per hari serta rasio ${compareStats.followerRatio}.`}
                </Narrative>
              </div>
            )}
          </InsightSectionCard>

          <InsightSectionCard
            title="Tren Engagement"
            description="Pergerakan engagement rate per posting yang dinormalisasi dengan jumlah followers."
          >
            <EngagementLineChart data={lineData} />
            <Narrative>
              {`Rata-rata engagement keseluruhan ${engagementRate}% dengan konten terbaru memproduksi ${avgLikesClient.toFixed(1)} likes dan ${avgCommentsClient.toFixed(1)} komentar per posting.`}
            </Narrative>
          </InsightSectionCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <InsightSectionCard title="Post Metrics Comparison">
              <PostMetricsChart posts={sortedPosts} />
            </InsightSectionCard>
            <InsightSectionCard title="Engagement by Content Type">
              <EngagementByTypeChart data={typeData} />
            </InsightSectionCard>
          </div>

          {cloudWords.length > 0 && (
            <InsightSectionCard
              title="Word Cloud"
              description="Kata yang paling sering muncul dalam caption postingan terfilter."
            >
              <WordCloudChart words={cloudWords} />
            </InsightSectionCard>
          )}

          <InsightSectionCard
            title="Posting Time Heatmap"
            description="Jam tayang yang paling sering menghasilkan engagement."
          >
            <HeatmapTable data={heatmap} days={dayNames} buckets={buckets} />
          </InsightSectionCard>
        </div>
      )}

      <section
        ref={rekapSectionRef}
        id="rekap-detail"
        className="relative overflow-hidden rounded-3xl border border-blue-200/70 bg-white/90 p-4 shadow-[0_24px_60px_rgba(59,130,246,0.12)] backdrop-blur"
      >
        <div className="pointer-events-none absolute -top-16 left-0 h-40 w-40 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 right-6 h-44 w-44 rounded-full bg-sky-200/45 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col gap-2 border-b border-blue-100/80 pb-4">
            <h2 className="text-2xl font-semibold text-blue-900">Rekap Detail TikTok</h2>
            <p className="text-sm text-blue-700/80">
              Bio, kontak, dan daftar postingan tampil dalam satu tab tanpa meninggalkan dashboard insight.
            </p>
          </div>
          {activeTab === "rekap" && (
            <div className="pt-4 flex flex-col gap-6">
              <InsightSectionCard title="Ringkasan Rekap Post" className="h-full">
                <div className="flex flex-col gap-4">
                  <Narrative>
                    {`Periode ${reportPeriodeLabel}${scopeLabel} mencatat ${rekapSummary.totalPosts} postingan untuk ${clientName || profile.username}. Frekuensi unggahan ${postingFreq} post/hari dengan rata-rata ${rekapSummary.avgViews.toFixed(1)} views, ${rekapSummary.avgLikes.toFixed(1)} likes, ${rekapSummary.avgComments.toFixed(1)} komentar, dan ${rekapSummary.avgShares.toFixed(1)} share.`}
                    {` Engagement rate berada di ${engagementRate}% dan rasio follower/following ${Number(followerRatio).toFixed(2)}, memberikan konteks cepat sebelum menelusuri tabel detail.`}
                  </Narrative>
                  <RekapTiktokPosts
                    posts={sortedPosts}
                    summary={rekapSummary}
                    clientName={(clientName || profile.username) + scopeLabel}
                    reportContext={{ periodeLabel: reportPeriodeLabel }}
                  />
                </div>
              </InsightSectionCard>
              <div className="grid gap-6 lg:grid-cols-2">
                <InsightSectionCard title="Profil & Bio" className="h-full">
                  {biography ? (
                    <p className="whitespace-pre-line text-sm text-slate-700">{biography}</p>
                  ) : (
                    <p className="text-sm text-slate-500">Tidak ada bio yang ditulis.</p>
                  )}
                  {bioLink && (
                    <a
                      href={bioLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-sky-700 underline"
                    >
                      {bioLink}
                    </a>
                  )}
                  {posts.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                      <li>Avg Likes: {avgLikesAll.toFixed(1)}</li>
                      <li>Avg Comments: {avgCommentsAll.toFixed(1)}</li>
                      <li>Avg Views: {avgViewsAll.toFixed(1)}</li>
                      {totalLikes !== undefined ? (
                        <li>Total Likes: {formatNumber(totalLikes)}</li>
                      ) : null}
                      <li>Engagement Rate: {engagementRate}%</li>
                    </ul>
                  )}
                </InsightSectionCard>

                <InsightSectionCard title="Kontak & Status Akun" className="h-full">
                  <ul className="list-disc pl-5 text-sm text-slate-700">
                    <li>{accountType}</li>
                    <li>{privacyStatus}</li>
                  </ul>
                  {(info?.address || info?.public_phone_number || info?.public_email) && (
                    <div className="text-sm text-slate-700">
                      {info?.address && <div>{info.address}</div>}
                      {info?.public_phone_number && <div>WA: {info.public_phone_number}</div>}
                      {info?.public_email && <div>Email: {info.public_email}</div>}
                    </div>
                  )}
                </InsightSectionCard>
              </div>

              <InsightSectionCard title="Top Hashtags & Mentions">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Top Hashtags</h4>
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                      {topHashtags.map(([t, c]) => (
                        <li key={t}>
                          {t} - {c}x
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">Top Mentions</h4>
                    <ul className="list-disc pl-5 text-sm text-slate-700">
                      {topMentions.map(([m, c]) => (
                        <li key={m}>
                          {m} - {c}x
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </InsightSectionCard>

              <InsightSectionCard title="Posts Overview" className="lg:col-span-2">
                <TiktokPostsGrid posts={sortedPosts} />
              </InsightSectionCard>
            </div>
          )}
        </div>
      </section>
    </InsightLayout>
  );
}
