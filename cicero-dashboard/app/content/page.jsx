"use client";
import { useEffect, useState } from "react";
import InstagramPostsGrid from "@/components/InstagramPostsGrid";
import Loader from "@/components/Loader";
import { getInstagramPostsViaBackend, getClientProfile } from "@/utils/api";

export default function SocialMediaContentManagerPage() {
  const [igPosts, setIgPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPosts() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
        const clientId =
          typeof window !== "undefined" ? localStorage.getItem("client_id") : null;

        if (!token || !clientId) {
          setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
          setLoading(false);
          return;
        }

        const profile = await getClientProfile(token, clientId);
        const username =
          profile.client?.client_insta?.replace(/^@/, "") ||
          profile.client_insta?.replace(/^@/, "") ||
          process.env.NEXT_PUBLIC_INSTAGRAM_USER ||
          "instagram";

        const igRes = await getInstagramPostsViaBackend(token, username, 12);
        const igData = igRes.data || igRes.posts || igRes;
        setIgPosts(Array.isArray(igData) ? igData : []);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
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
        <h1 className="text-2xl font-bold text-blue-700">Social Media Content Manager</h1>
        <p className="text-gray-600">Kumpulan posting Instagram terbaru.</p>
        <InstagramPostsGrid posts={igPosts} />
      </div>
    </div>
  );
}
