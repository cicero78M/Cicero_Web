"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";
import { getClientProfile } from "@/utils/api";
import useAuth from "@/hooks/useAuth";
import ProfileHeader from "../molecules/ProfileHeader";
import StatsGrid from "../molecules/StatsGrid";
import ActivityList from "../molecules/ActivityList";
import { ProfileData } from "../types";

// Temporary placeholder while API fields are mapped
async function fetchProfileFallback(): Promise<ProfileData> {
  await new Promise((r) => setTimeout(r, 800));
  return {
    avatar: "/avatar.png",
    name: "John Doe",
    email: "john@example.com",
    stats: [
      { label: "Postingan", value: 120 },
      { label: "Followers", value: 5300 },
      { label: "Engagement", value: "4.5%" },
    ],
    activity: [
      { id: "1", text: "Mengunggah foto baru", date: "2024-05-20" },
      { id: "2", text: "Membalas komentar", date: "2024-05-18" },
      { id: "3", text: "Mengupdate bio", date: "2024-05-15" },
    ],
  };
}

export default function ProfileDashboard() {
  const { token, clientId } = useAuth();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      if (!token || !clientId) {
        setError("Token / Client ID tidak ditemukan. Silakan login ulang.");
        setLoading(false);
        return;
      }
      try {
        const res = await getClientProfile(token, clientId);
        const profile = res.client || res.profile || res;
        setData({
          avatar: "/avatar.png",
          name: profile.nama || "John Doe",
          email: profile.email || "john@example.com",
          stats: [
            { label: "Postingan", value: profile.total_post ?? 120 },
            { label: "Followers", value: profile.followers ?? 5300 },
            { label: "Engagement", value: profile.engagement ?? "4.5%" },
          ],
          activity: [
            { id: "1", text: "Mengunggah foto baru", date: "2024-05-20" },
            { id: "2", text: "Membalas komentar", date: "2024-05-18" },
            { id: "3", text: "Mengupdate bio", date: "2024-05-15" },
          ],
        });
      } catch (err) {
        // Fallback to placeholder data
        const fallback = await fetchProfileFallback();
        setData(fallback);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [token, clientId]);

  if (loading) return <Loader />;
  if (error) return <div className="p-4 text-red-500 font-semibold">{error}</div>;
  if (!data) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="grid gap-6 md:grid-cols-3"
      >
        <ProfileHeader avatar={data.avatar} name={data.name} email={data.email} />
        <StatsGrid stats={data.stats} />
        <ActivityList items={data.activity} />
      </motion.div>
    </AnimatePresence>
  );
}
