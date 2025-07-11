"use client";
import { useEffect, useState } from "react";
import CardStat from "@/components/CardStat";
import Loader from "@/components/Loader";
import Narrative from "@/components/Narrative";
import InstagramCompareChart from "@/components/InstagramCompareChart";
import {
  getInstagramProfileViaBackend,
  getInstagramInfoViaBackend,
  getInstagramPostsViaBackend,
  getClientProfile,
} from "@/utils/api";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function InstagramInfoPage() {
  useRequireAuth();
  const [profile, setProfile] = useState(null);
  const [info, setInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compareLink, setCompareLink] = useState("");
  const [compareStats, setCompareStats] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("cicero_token")
        : null;
    const clientId =
      typeof window !== "undefined" ? localStorage.getItem("client_id") : null;

    if (!token || !clientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const clientProfileRes = await getClientProfile(token, clientId);
        const clientData =
          clientProfileRes.client || clientProfileRes.profile || clientProfileRes;

        const username =
          clientData.client?.client_insta?.replace(/^@/, "") ||
          clientData.client_insta?.replace(/^@/, "") ||
          process.env.NEXT_PUBLIC_INSTAGRAM_USER ||
          "instagram";

        const profileRes = await getInstagramProfileViaBackend(token, username);
        setProfile(profileRes);

        const infoRes = await getInstagramInfoViaBackend(token, username);
        const infoData = infoRes.data || infoRes.info || infoRes;
        setInfo(infoData);

        const postsRes = await getInstagramPostsViaBackend(token, username, 20);
        const postsData = postsRes.data || postsRes.posts || postsRes;
        setPosts(Array.isArray(postsData) ? postsData : []);

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
      const infoRes = await getInstagramInfoViaBackend(token, username);
      const infoData = infoRes.data || infoRes.info || infoRes;
      const postsRes = await getInstagramPostsViaBackend(token, username, 20);
      const postsData = postsRes.data || postsRes.posts || postsRes;
      const avgLikes =
        postsData.reduce((s, p) => s + (p.like_count || 0), 0) /
        (postsData.length || 1);
      const avgComments =
        postsData.reduce((s, p) => s + (p.comment_count || 0), 0) /
        (postsData.length || 1);
      const avgViews =
        postsData.reduce((s, p) => s + (p.view_count || 0), 0) /
        (postsData.length || 1);
      const engagement = profileRes.followers
        ? (((avgLikes + avgComments) / profileRes.followers) * 100).toFixed(2)
        : "0";
      setCompareStats({
        username: profileRes.username,
        followers: profileRes.followers,
        following: profileRes.following,
        engagementRate: engagement,
        avgLikes,
        avgComments,
        avgViews,
        totalPosts: infoData?.media_count ?? infoData?.post_count,
        totalIgtv: infoData?.total_igtv_videos,
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

  const stats = [
    { title: "Followers", value: profile.followers },
    { title: "Following", value: profile.following },
    { title: "Total Posts", value: info?.media_count ?? info?.post_count },
    { title: "Total IG-TV", value: info?.total_igtv_videos },

  ];

  const profilePic =
    profile?.profile_pic_url_hd ||
    profile?.profile_pic_url ||
    profile?.hd_profile_pic_url_info?.url ||
    info?.hd_profile_pic_url_info?.url ||
    info?.hd_profile_pic_versions?.[0]?.url ||
    "";

  const getProfilePicSrc = (url) => {
    if (!url) return "/file.svg";
    return url.replace(/\.heic(\?|$)/, ".jpg$1");
  };

  const biography = profile.bio || info?.biography || "";

  const bioLink =
    (info?.bio_links && (info.bio_links[0]?.link || info.bio_links[0]?.url)) ||
    info?.external_url ||
    "";

  const profileDetails = [
    { label: "Full Name", value: info?.full_name || "-" },
    { label: "User ID", value: info?.id || "-" },
    { label: "Verified", value: info?.is_verified ? "Yes" : "No" },
    { label: "Business Email", value: info?.public_email || "-" },
    { label: "Phone", value: info?.public_phone_number || "-" },
  ];

  const avgLikes =
    posts.reduce((sum, p) => sum + (p.like_count || 0), 0) / (posts.length || 1);
  const avgComments =
    posts.reduce((sum, p) => sum + (p.comment_count || 0), 0) /
    (posts.length || 1);
  const avgViews =
    posts.reduce((sum, p) => sum + (p.view_count || 0), 0) /
    (posts.length || 1);
  const engagementRate = profile.followers
    ? (((avgLikes + avgComments) / profile.followers) * 100).toFixed(2)
    : "0";

  const accountType =
    info?.is_business || info?.is_professional ? "Bisnis" : "Pribadi";
  const privacyStatus = info?.is_private ? "Privat" : "Terbuka";


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-blue-700">Instagram Info</h1>
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
            <div className="flex items-center gap-2">
              <div className="text-lg font-semibold">
                {info?.full_name || profile.username}
              </div>
              {info?.is_verified && (
                <span className="text-blue-500" title="Verified">
                  ✔
                </span>
              )}
            </div>
            <div className="text-gray-500">@{profile.username}</div>
            <div className="text-gray-500 text-sm">{info?.category || "-"}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <CardStat key={s.title} title={s.title} value={s.value ?? "-"} />
          ))}
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
              <li>Avg Likes: {avgLikes.toFixed(1)}</li>
              <li>Avg Comments: {avgComments.toFixed(1)}</li>
              <li>Avg Views: {avgViews.toFixed(1)}</li>
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

        {(info?.public_phone_number || bioLink) && (
          <div className="bg-white p-4 rounded-xl shadow text-center">
            {info?.public_phone_number && (
              <a
                href={`https://wa.me/${info.public_phone_number}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mr-4"
              >
                Hubungi WhatsApp
              </a>
            )}
            {bioLink && (
              <a
                href={bioLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Kunjungi Link
              </a>
            )}
          </div>
        )}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Profile Details</h2>
          <div className="flex flex-col gap-1 text-sm">
            {profileDetails.map((row) => (
              <Row key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </div>

        {compareLoading && <Loader />}
        {compareStats && (
          <div className="bg-white p-4 rounded-xl shadow flex flex-col gap-4">
            <h2 className="font-semibold">Perbandingan dengan {compareStats.username}</h2>
            <div className="flex-1">
              <InstagramCompareChart
                client={{
                  username: profile.username,
                  followers: profile.followers,
                  following: profile.following,
                  avgLikes,
                  avgComments,
                  avgViews,
                  engagementRate,
                  totalPosts: info?.media_count ?? info?.post_count,
                  totalIgtv: info?.total_igtv_videos,
                }}
                competitor={compareStats}
              />
            </div>
            <Narrative>
              {`Akun ${profile.username} memiliki ${profile.followers} followers dan mengikuti ${profile.following} akun. `}
              {`Rata-rata mendapat ${avgLikes.toFixed(1)} likes, ${avgComments.toFixed(1)} komentar, dan ${avgViews.toFixed(1)} views per posting dengan engagement rate ${engagementRate}%. `}
              {`Total posting sebanyak ${info?.media_count ?? info?.post_count} dan ${info?.total_igtv_videos || 0} IG-TV. `}
              {`Sebagai pembanding, akun ${compareStats.username} memiliki ${compareStats.followers} followers dan mengikuti ${compareStats.following} akun. `}
              {`Rata-rata ${compareStats.avgLikes.toFixed(1)} likes, ${compareStats.avgComments.toFixed(1)} komentar, serta ${compareStats.avgViews.toFixed(1)} views tiap posting dengan engagement rate ${compareStats.engagementRate}%. `}
              {`Total posting ${compareStats.totalPosts || 0} dan ${compareStats.totalIgtv || 0} IG-TV.`}
            </Narrative>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start py-1 gap-2">
      <div className="w-24 text-gray-500 flex-shrink-0">{label}</div>
      <div className="text-gray-300 select-none">:</div>
      <div className="flex-1 break-all">{value}</div>
    </div>
  );
}
