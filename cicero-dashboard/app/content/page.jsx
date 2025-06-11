"use client";
import { useEffect, useState } from "react";
import InstagramPostAnalysisTable from "@/components/InstagramPostAnalysisTable";
import Loader from "@/components/Loader";
import { getClientProfile } from "@/utils/api";
import { dummyInstagramPosts } from "@/utils/dummyClientInsta";

export default function SocialMediaContentManagerPage() {
  const [igPosts, setIgPosts] = useState([]);
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
        await getClientProfile(token, client_id);
        setIgPosts(dummyInstagramPosts);
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
        <h1 className="text-2xl font-bold text-blue-700">Instagram Content Manager</h1>
        <p className="text-gray-600">
          Analisa performa dan jadwalkan konten Instagram Anda.
        </p>
        <InstagramPostAnalysisTable posts={igPosts} />
      </div>
    </div>
  );
}
