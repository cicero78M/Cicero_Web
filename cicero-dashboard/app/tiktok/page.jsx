"use client";
import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import TikTokPostTable from "@/components/TikTokPostTable";
import { getClientProfile, fetchTikTokPosts } from "@/utils/api";

export default function TikTokContentManagerPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const client_id = typeof window !== "undefined" ? localStorage.getItem("client_id") : null;

    if (!token || !client_id) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchData() {
      try {
        const profile = await getClientProfile(token, client_id);
        const username = (profile.client?.client_tiktok || profile.client_tiktok || "").replace(/^@/, "");
        if (!username) {
          throw new Error("Username TikTok tidak tersedia pada profil client.");
        }
        const data = await fetchTikTokPosts(username);
        const postsArr = data?.data || data?.posts || data || [];
        setPosts(Array.isArray(postsArr) ? postsArr : []);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6 text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-pink-700">TikTok Content Manager</h1>
        <p className="text-gray-600">Analisa performa konten TikTok Anda.</p>
        <TikTokPostTable posts={posts} />
      </div>
    </div>
  );
}
