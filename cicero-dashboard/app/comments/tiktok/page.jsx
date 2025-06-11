"use client";
import { useEffect, useState } from "react";
import { getTikTokComments } from "@/utils/api";
import Loader from "@/components/Loader";
import TikTokCommentsTable from "@/components/TikTokCommentsTable";

export default function TikTokCommentsTrackingPage() {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }

    async function fetchComments() {
      try {
        const res = await getTikTokComments(token);
        const data = res.data || res.comments || res;
        setComments(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
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
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">TikTok Comments Tracking</h1>
        <p className="text-gray-600 mb-4">
          Monitor TikTok comments activity, track engagement, and review comment compliance from your team.
        </p>
        <TikTokCommentsTable comments={comments} />
      </div>
    </div>
  );
}
