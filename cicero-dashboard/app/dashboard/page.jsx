"use client";
import { useEffect, useState } from "react";
import {
  getClientProfile,
  getInstagramProfileViaBackend,
  getInstagramPostsViaBackend,
  getTiktokProfileViaBackend,
  getTiktokPostsViaBackend,
} from "@/utils/api";
import DashboardStats from "@/components/DashboardStats";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import { useAuth } from "@/context/AuthContext";
import { Check, X } from "lucide-react";

export default function DashboardPage() {
  useRequireAuth();
  const { token, clientId, role } = useAuth();
  const specialRoles = ["ditbinmas", "ditlantas", "bidhumas"];
  const targetClientId =
    role && specialRoles.includes(role.toLowerCase())
      ? role.toLowerCase()
      : clientId;
  const [clientProfile, setClientProfile] = useState(null);
  const [igProfile, setIgProfile] = useState(null);
  const [igPosts, setIgPosts] = useState([]);
  const [tiktokProfile, setTiktokProfile] = useState(null);
  const [tiktokPosts, setTiktokPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token || !targetClientId) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const profileRes = await getClientProfile(token, targetClientId);
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
            const ttRes = await getTiktokPostsViaBackend(token, targetClientId, 3);
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
  }, [token, targetClientId]);

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
      <div className="w-full max-w-6xl space-y-6">
        <DashboardStats
          igProfile={igProfile}
          igPosts={igPosts}
          tiktokProfile={tiktokProfile}
          tiktokPosts={tiktokPosts}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SocialCard platform="instagram" profile={igProfile} posts={igPosts} />
          <SocialCard
            platform="tiktok"
            profile={tiktokProfile}
            posts={tiktokPosts}
          />
        </div>
      </div>
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
    profile.profile_pic_url_hd ||
    profile.profile_pic_url ||
    profile.avatar_url ||
    profile.avatar ||
    profile.hd_profile_pic_url_info?.url ||
    profile.hd_profile_pic_versions?.[0]?.url ||
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
            loading="lazy"
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
                  loading="lazy"
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
