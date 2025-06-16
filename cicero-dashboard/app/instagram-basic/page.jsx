"use client";
import { useEffect, useState } from "react";
import useRequireAuth from "@/hooks/useRequireAuth";
import { getInstagramBasicProfile, getInstagramBasicPosts } from "@/utils/api";
import Loader from "@/components/Loader";
import InstagramPostsGrid from "@/components/InstagramPostsGrid";
import Link from "next/link";

export default function InstagramBasicPage() {
  useRequireAuth();
  const [accessToken, setAccessToken] = useState("");
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored =
      typeof window !== "undefined" ? localStorage.getItem("ig_basic_token") : "";
    if (stored) setAccessToken(stored);
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    fetchData(accessToken);
  }, [accessToken]);

  async function fetchData(tokenVal) {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const profileRes = await getInstagramBasicProfile(token, tokenVal);
      const postsRes = await getInstagramBasicPosts(token, tokenVal, 12);
      const postsData = postsRes.data || postsRes.posts || postsRes;
      const mapped = Array.isArray(postsData)
        ? postsData.map((p) => ({
            id: p.id,
            caption: p.caption,
            type: p.media_type,
            created_at: p.timestamp,
            thumbnail: p.thumbnail_url || p.media_url,
          }))
        : [];
      setProfile(profileRes.data || profileRes.profile || profileRes);
      setPosts(mapped);
    } catch (err) {
      setError("Gagal mengambil data: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("ig_basic_token", accessToken);
    }
    fetchData(accessToken);
  }

  if (loading) return <Loader />;
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-blue-700">Instagram Basic</h1>
        {!accessToken && (
          <Link
            href="/instagram-basic/login"
            className="self-start bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg"
          >
            Login with Instagram
          </Link>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            placeholder="Access Token"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            Load
          </button>
        </form>
        {error && <div className="text-red-500 text-sm">{error}</div>}
        {profile && (
          <div className="bg-white p-4 rounded-xl shadow flex gap-4 items-center">
            <div className="flex-1">
              <div className="text-lg font-semibold">@{profile.username}</div>
              <div className="text-gray-500 text-sm">
                {profile.account_type} - {profile.media_count} posts
              </div>
            </div>
          </div>
        )}
        {posts.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow">
            <InstagramPostsGrid posts={posts} />
          </div>
        )}
      </div>
    </div>
  );
}
