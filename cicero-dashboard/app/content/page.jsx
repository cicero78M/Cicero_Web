"use client";
import { useEffect, useState } from "react";
import SocialMediaContentTable from "@/components/SocialMediaContentTable";
import Loader from "@/components/Loader";
import { getInstagramPosts, getTiktokPosts } from "@/utils/api";

export default function SocialMediaContentManagerPage() {
  const [igPosts, setIgPosts] = useState([]);
  const [tiktokPosts, setTiktokPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    const client_id =
      typeof window !== "undefined" ? localStorage.getItem("client_id") : null;

    if (!token || !client_id) {
      setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchPosts() {
      try {
        const igRes = await getInstagramPosts(token, client_id);
        const igData = igRes.data || igRes.posts || igRes;
        setIgPosts(Array.isArray(igData) ? igData : []);

        const ttRes = await getTiktokPosts(token, client_id);
        const ttData = ttRes.data || ttRes.posts || ttRes;
        setTiktokPosts(Array.isArray(ttData) ? ttData : []);
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
        <p className="text-gray-600">
          Manage and schedule posts for Instagram and TikTok in one place.
        </p>
        <div className="flex flex-col md:flex-row gap-6">
          <SocialMediaContentTable platform="Instagram" initialPosts={igPosts} />
          <SocialMediaContentTable platform="TikTok" initialPosts={tiktokPosts} />
        </div>
      </div>
    </div>
  );
}
