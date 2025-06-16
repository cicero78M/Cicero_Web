"use client";
import { useEffect, useState } from "react";
import {
  getClientProfile,
  getInstagramProfileViaBackend,
  getInstagramPostsViaBackend,
  getTiktokProfileViaBackend,
  getTiktokPostsViaBackend,
} from "@/utils/api";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function DashboardPage() {
  useRequireAuth();
  const [clientProfile, setClientProfile] = useState(null);
  const [igProfile, setIgProfile] = useState(null);
  const [igPosts, setIgPosts] = useState([]);
  const [tiktokProfile, setTiktokProfile] = useState(null);
  const [tiktokPosts, setTiktokPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const profileRes = await getClientProfile(token, clientId);
        const client = profileRes.client || profileRes.profile || profileRes;
        setClientProfile(client);

        const igUser =
          client.client?.client_insta?.replace(/^@/, "") ||
          client.client_insta?.replace(/^@/, "");
        if (igUser) {
          try {
            const igProf = await getInstagramProfileViaBackend(token, igUser);
            setIgProfile(igProf);
            const postsRes = await getInstagramPostsViaBackend(token, igUser, 3);
            const postsData = postsRes.data || postsRes.posts || postsRes;
            setIgPosts(Array.isArray(postsData) ? postsData : []);
          } catch (err) {
            console.error(err);
          }
        }

        const ttUser =
          client.client?.client_tiktok?.replace(/^@/, "") ||
          client.client_tiktok?.replace(/^@/, "");
        if (ttUser) {
          try {
            const ttProf = await getTiktokProfileViaBackend(token, ttUser);
            setTiktokProfile(ttProf);
            const ttRes = await getTiktokPostsViaBackend(token, clientId, 3);
            const ttData = ttRes.data || ttRes.posts || ttRes;
            setTiktokPosts(Array.isArray(ttData) ? ttData : []);
          } catch (err) {
            console.error(err);
          }
        }
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-fuchsia-50 to-white flex items-center justify-center overflow-hidden">
        <div className="bg-white rounded-2xl shadow-lg text-center text-red-500 font-bold max-w-sm w-full p-6">{error}</div>
      </div>
    );

  if (!clientProfile)
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-fuchsia-50 to-white flex items-center justify-center overflow-hidden">
        <div className="bg-white rounded-2xl shadow-lg text-center text-gray-600 font-bold max-w-sm w-full p-6">
          Data profil client tidak tersedia.
        </div>
      </div>
    );


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <ClientCard profile={clientProfile} />
        <SocialCard platform="instagram" profile={igProfile} posts={igPosts} />
        <SocialCard platform="tiktok" profile={tiktokProfile} posts={tiktokPosts} />
      </div>
    </div>
  );
}

// Row dengan padding atas bawah seperti sebelumnya
function Row({ label, value, status }) {
  return (
    <div className="flex items-center py-2 px-2 gap-2 w-full">
      <div className="w-28 text-gray-500 font-medium flex-shrink-0">{label}</div>
      <div className="text-gray-300 select-none">:</div>
      <div className="flex-1 text-gray-800 flex flex-wrap items-center gap-1 break-all">{value}{status && status}</div>
    </div>
  );
}

function ClientCard({ profile }) {
  const igUsername = profile.client_insta?.replace(/^@/, "");
  const tiktokUsername = profile.client_tiktok?.replace(/^@/, "");
  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
      <h2 className="font-semibold text-blue-700 text-center mb-2">Client Profile</h2>
      <Row label="ID" value={profile.client_id} />
      <Row label="Nama" value={profile.nama || "-"} />
      <Row label="Tipe" value={profile.client_type || "-"} />
      <Row
        label="Instagram"
        value={
          igUsername ? (
            <a
              href={`https://instagram.com/${igUsername}`}
              className="text-pink-600 underline font-semibold hover:text-pink-800 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              {profile.client_insta}
            </a>
          ) : (
            "-"
          )
        }
        status={
          profile.client_insta_status !== undefined && (
            profile.client_insta_status ? (
              <svg className="w-4 h-4 ml-1 text-green-600 inline" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-1 text-red-500 inline" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )
          )
        }
      />
      <Row
        label="TikTok"
        value={
          tiktokUsername ? (
            <a
              href={`https://www.tiktok.com/@${tiktokUsername}`}
              className="text-blue-600 underline font-semibold hover:text-blue-800 transition"
              target="_blank"
              rel="noopener noreferrer"
            >
              {profile.client_tiktok}
            </a>
          ) : (
            "-"
          )
        }
        status={
          profile.client_tiktok_status !== undefined && (
            profile.client_tiktok_status ? (
              <svg className="w-4 h-4 ml-1 text-green-600 inline" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 ml-1 text-red-500 inline" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )
          )
        }
      />
      <Row label="Administrator" value={profile.client_super || "-"} />
      <Row label="Operator" value={profile.client_operator || "-"} />
      <Row label="Group" value={profile.client_group || "-"} />
    </div>
  );
}

function SocialCard({ platform, profile, posts }) {
  const getThumb = (url) => {
    if (!url) return null;
    return url.replace(/\.heic(\?|$)/, ".jpg$1");
  };
  if (!profile)
    return (
      <div className="bg-white rounded-xl shadow p-4 flex items-center justify-center">
        <h2 className="font-semibold capitalize">{platform} Profile</h2>
      </div>
    );

  const avatar =
    profile.avatar_url ||
    profile.avatar ||
    profile.hd_profile_pic_url_info?.url ||
    profile.hd_profile_pic_versions?.[0]?.url ||
    profile.profile_pic_url ||
    profile.profile_pic_url_hd ||
    "";

  const link =
    platform === "instagram"
      ? `https://instagram.com/${profile.username}`
      : `https://www.tiktok.com/@${profile.username}`;
  const avatarSrc = getThumb(avatar);

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col">
      <h2 className="font-semibold capitalize mb-2">{platform} Profile</h2>
      <div className="flex items-center gap-3 flex-wrap">
        {avatarSrc && (
          <img
            src={avatarSrc}
            alt="avatar"
            className="w-12 h-12 rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-blue-600 hover:underline"
        >
          @{profile.username}
        </a>
        <span className="text-sm text-gray-500">
          {profile.followers} followers
        </span>
        <span className="text-sm text-gray-500">
          {profile.following} following
        </span>
      </div>
      {profile.bio && (
        <div className="text-sm text-gray-500 whitespace-pre-line mt-1">
          {profile.bio}
        </div>
      )}
      {posts && posts.length > 0 && (
        <div className="flex gap-2 mt-4">
          {posts.slice(0, 3).map((p) => {
            const thumb = getThumb(p.thumbnail);
            return (
              thumb && (
                <img
                  key={p.id || p.post_id}
                  src={thumb}
                  alt="thumb"
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )
            );
          })}
        </div>
      )}
    </div>
  );
}
