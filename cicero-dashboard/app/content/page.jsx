"use client";
import { useEffect, useState } from "react";
import SocialMediaContentTable from "@/components/SocialMediaContentTable";
import SocialMediaPosts from "@/components/SocialMediaPosts";
import Loader from "@/components/Loader";
import {
  getClientProfile,
  getInstagramPostsByUsername,
  getTiktokPostsByUsername,
} from "@/utils/api";

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
        const profileRes = await getClientProfile(token, client_id);
        const profile = profileRes.client || profileRes.profile || profileRes;
        const igUsername = profile.client_insta?.replace(/^@/, "");
        const ttUsername = profile.client_tiktok?.replace(/^@/, "");

        if (igUsername) {
          const igRes = await getInstagramPostsByUsername(igUsername);
          const igData = igRes.data || igRes.posts || igRes;
          setIgPosts(Array.isArray(igData) ? igData : []);
        }

        if (ttUsername) {
          const ttRes = await getTiktokPostsByUsername(ttUsername);
          const ttData = ttRes.data || ttRes.posts || ttRes;
          setTiktokPosts(Array.isArray(ttData) ? ttData : []);
        }
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
        <div className="flex flex-col gap-6">
          <SocialMediaPosts platform="Instagram" posts={igPosts} />
          <SocialMediaPosts platform="TikTok" posts={tiktokPosts} />
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <SocialMediaContentTable platform="Instagram" initialPosts={[]} />
          <SocialMediaContentTable platform="TikTok" initialPosts={[]} />
        </div>
      </div>
    </div>
  );
}
