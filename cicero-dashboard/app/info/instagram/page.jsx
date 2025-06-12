"use client";
import { useEffect, useState } from "react";
import CardStat from "@/components/CardStat";
import InstagramPostsGrid from "@/components/InstagramPostsGrid";
import Loader from "@/components/Loader";
import PostMetricsChart from "@/components/PostMetricsChart";
import {
  getInstagramProfileViaBackend,
  getInstagramPostsViaBackend,
  getInstagramInfoViaBackend,
  getClientProfile,
} from "@/utils/api";

export default function InstagramInfoPage() {
  const [profile, setProfile] = useState(null);
  const [info, setInfo] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        const clientProfile = await getClientProfile(token, clientId);
        const username =
          clientProfile.client?.client_insta?.replace(/^@/, "") ||
          clientProfile.client_insta?.replace(/^@/, "") ||
          process.env.NEXT_PUBLIC_INSTAGRAM_USER ||
          "instagram";

        const profileRes = await getInstagramProfileViaBackend(token, username);
        setProfile(profileRes);

        const infoRes = await getInstagramInfoViaBackend(token, username);
        const infoData = infoRes.data || infoRes.info || infoRes;
        setInfo(infoData);

        const postRes = await getInstagramPostsViaBackend(token, username, 5);
        const postData = postRes.data || postRes.posts || postRes;
        setPosts(Array.isArray(postData) ? postData : []);
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

  if (!profile) return null;

  const stats = [
    { title: "Followers", value: profile.followers },
    { title: "Following", value: profile.following },
    { title: "Total Posts", value: info?.post_count },
    { title: "Account Type", value: info?.account_type || "-" },
  ];

  const sortedPosts = [...posts].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at),
  );
  const latestPost = sortedPosts[0];
  const otherPosts = sortedPosts.slice(1);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-blue-700">Instagram Info</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => (
            <CardStat key={s.title} title={s.title} value={s.value ?? "-"} />
          ))}
        </div>
        {latestPost && (
          <div className="bg-white p-4 rounded-xl shadow">
            <h2 className="font-semibold mb-2">Latest Post</h2>
            {latestPost.thumbnail && (
              <img
                src={latestPost.thumbnail}
                alt={latestPost.caption || "thumbnail"}
                className="w-full max-h-64 object-cover rounded"
              />
            )}
            <p className="mt-2 text-sm">{latestPost.caption || "-"}</p>
          </div>
        )}
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Other Recent Posts</h2>
          <InstagramPostsGrid posts={otherPosts} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold mb-2">Post Metrics Comparison</h2>
          <PostMetricsChart posts={sortedPosts} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow overflow-x-auto text-sm">
          <h2 className="font-semibold mb-2">Raw Info</h2>
          <pre>{JSON.stringify(info, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
