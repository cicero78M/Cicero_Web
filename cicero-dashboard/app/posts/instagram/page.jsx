"use client";
import { useEffect, useState } from "react";
import CardStat from "@/components/CardStat";
import EngagementLineChart from "@/components/EngagementLineChart";
import EngagementByTypeChart from "@/components/EngagementByTypeChart";
import HeatmapTable from "@/components/HeatmapTable";
import PostMetricsChart from "@/components/PostMetricsChart";
import InstagramPostsGrid from "@/components/InstagramPostsGrid";
import FilterBar from "@/components/FilterBar";
import WordCloudChart from "@/components/WordCloudChart";
import Loader from "@/components/Loader";
import Narrative from "@/components/Narrative";
import PostCompareChart from "@/components/PostCompareChart";
import useRequireAuth from "@/hooks/useRequireAuth";
import {
  getInstagramProfileViaBackend,
  getInstagramPostsViaBackend,
  getInstagramInfoViaBackend,
  getClientProfile,
} from "@/utils/api";

export default function InstagramPostAnalysisPage() {
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const clientId =
      typeof window !== "undefined" ? localStorage.getItem("client_id") : null;

    if (!token || !clientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const clientProfile = await getClientProfile(token, clientId);
        const username =
          clientProfile.client?.client_insta?.replace(/^@/, "") ||
          clientProfile.client_insta?.replace(/^@/, "") ||
          process.env.NEXT_PUBLIC_INSTAGRAM_USER ||
          "instagram";

        const profileRes = await getInstagramProfileViaBackend(token, username);
        setProfile(profileRes.data || profileRes.profile || profileRes);

        const infoRes = await getInstagramInfoViaBackend(token, username);
        const infoData = infoRes.data || infoRes.info || infoRes;
        setInfo(infoData);

        const postRes = await getInstagramPostsViaBackend(token, username, 50);
        const postData = postRes.data || postRes.posts || postRes;
        setPosts(Array.isArray(postData) ? postData : []);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  function extractUsername(url) {
    if (!url) return "";
    return url
      .replace(/https?:\/\/(www\.)?instagram.com\//i, "")
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
      const profileRes = await getInstagramProfileViaBackend(token, username);
      const postsRes = await getInstagramPostsViaBackend(token, username, 12);
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

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6 text-red-500 font-bold">
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
  const avgViewsAll =
    sortedPosts.reduce((s, p) => s + (p.view_count || 0), 0) /
    (sortedPosts.length || 1);
  const engagementRate = profile.followers
    ? (((avgLikesAll + avgCommentsAll) / profile.followers) * 100).toFixed(2)
    : "0";

  const totalPosts = info?.media_count ?? info?.post_count;
  const totalIgtv = info?.total_igtv_videos;

  const biography = profile.bio || info?.biography || "";
  const bioLink =
    (info?.bio_links && (info.bio_links[0]?.link || info.bio_links[0]?.url)) ||
    info?.external_url ||
    "";

  const accountType =
    info?.is_business || info?.is_professional ? "Bisnis" : "Pribadi";
  const privacyStatus = info?.is_private ? "Privat" : "Terbuka";

  const profilePic =
    profile.hd_profile_pic_url_info?.url ||
    profile.hd_profile_pic_versions?.[0]?.url ||
    profile.profile_pic_url ||
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

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-blue-700">Instagram Post Analysis</h1>
        <p className="text-gray-600">Analisis performa postingan Instagram.</p>

        <div className="bg-white p-4 rounded-xl shadow flex gap-4 items-start">
          {profilePic && (
            <img
              src={getProfilePicSrc(profilePic)}
              alt="profile"
              className="w-24 h-24 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                e.currentTarget.src = "/file.svg";
              }}
            />
          )}
          <div className="flex-1">
            <div className="text-lg font-semibold">
              {profile.full_name || profile.username}
            </div>
            <div className="text-gray-500">@{profile.username}</div>
            {profile.category && (
              <div className="text-gray-500 text-sm">{profile.category}</div>
            )}
          </div>
        </div>

        <form onSubmit={handleCompare} className="flex gap-2">
          <input
            type="text"
            placeholder="Link akun pembanding"
            value={compareLink}
            onChange={(e) => setCompareLink(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Bandingkan
          </button>
        </form>
        {compareError && (
          <div className="text-red-500 text-sm">{compareError}</div>
        )}

        
        {compareLoading && <Loader />}
        {compareStats && (
          <div className="bg-white p-4 rounded-xl shadow flex flex-col gap-4">
            <h3 className="font-semibold">Perbandingan dengan {compareStats.username}</h3>
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

        <FilterBar
          startDate={startDate}
          endDate={endDate}
          search={search}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setSearch={setSearch}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CardStat title="Followers" value={profile.followers} />
          <CardStat title="Following" value={profile.following} />
          <CardStat title="Follower/Following" value={followerRatio} />
          <CardStat title="Posts / Day" value={postingFreq} />
          {totalPosts !== undefined && (
            <CardStat title="Total Posts" value={totalPosts} />
          )}
          {totalIgtv !== undefined && (
            <CardStat title="Total IG-TV" value={totalIgtv} />
          )}
        </div>

        {biography && (
          <div className="bg-white p-4 rounded-xl shadow text-sm whitespace-pre-line">
            {biography}
            {bioLink && (
              <div className="mt-2">
                <a
                  href={bioLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline break-all"
                >
                  {bioLink}
                </a>
              </div>
            )}
          </div>
        )}

        {(info?.address || info?.public_phone_number || info?.public_email) && (
          <div className="bg-white p-4 rounded-xl shadow text-sm">
            {info?.address && <div>{info.address}</div>}
            {info?.public_phone_number && <div>WA: {info.public_phone_number}</div>}
            {info?.public_email && <div>Email: {info.public_email}</div>}
          </div>
        )}

        {posts.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow text-sm">
            <h2 className="font-semibold mb-2">Summary Engagement</h2>
            <ul className="list-disc ml-5">
              <li>Avg Likes: {avgLikesAll.toFixed(1)}</li>
              <li>Avg Comments: {avgCommentsAll.toFixed(1)}</li>
              <li>Avg Views: {avgViewsAll.toFixed(1)}</li>
              <li>Engagement Rate: {engagementRate}%</li>
            </ul>
          </div>
        )}

        <div className="bg-white p-4 rounded-xl shadow text-sm">
          <h2 className="font-semibold mb-2">Fitur dan Status Akun</h2>
          <ul className="list-disc ml-5">
            <li>{accountType}</li>
            <li>{privacyStatus}</li>
          </ul>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Engagement Trend</h2>
          <EngagementLineChart data={lineData} />
        </div>

                <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Post Metrics Comparison</h3>
          <PostMetricsChart posts={sortedPosts} />
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Engagement by Content Type</h2>
          <EngagementByTypeChart data={typeData} />
        </div>

        {cloudWords.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2">Word Cloud</h3>
            <WordCloudChart words={cloudWords} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2">Top Hashtags</h3>
            <ul className="list-disc ml-5 text-sm">
              {topHashtags.map(([t, c]) => (
                <li key={t}>{t} - {c}x</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <h3 className="font-semibold mb-2">Top Mentions</h3>
            <ul className="list-disc ml-5 text-sm">
              {topMentions.map(([m, c]) => (
                <li key={m}>{m} - {c}x</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Posting Time Heatmap</h3>
          <HeatmapTable data={heatmap} days={dayNames} buckets={buckets} />
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="font-semibold mb-2">Posts Overview</h3>
          <InstagramPostsGrid posts={sortedPosts} />
        </div>



      </div>
    </div>
  );
}
