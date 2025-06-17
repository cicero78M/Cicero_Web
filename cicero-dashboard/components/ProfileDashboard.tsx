"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";

interface Stat {
  label: string;
  value: number | string;
}

interface Activity {
  id: string;
  text: string;
  date: string;
}

interface ProfileData {
  avatar: string;
  name: string;
  email: string;
  stats: Stat[];
  activity: Activity[];
}

// Placeholder fetch function - replace with real API call
async function fetchProfile(): Promise<ProfileData> {
  // Simulate network delay
  await new Promise((res) => setTimeout(res, 800));
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
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile()
      .then(setData)
      .catch(() => setError("Gagal memuat data"))
      .finally(() => setLoading(false));
  }, []);

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
        <section className="bg-white rounded-xl shadow p-6 flex flex-col items-center text-center gap-3">
          <img
            src={data.avatar}
            alt="Avatar pengguna"
            className="w-24 h-24 rounded-full object-cover"
          />
          <div className="font-semibold text-lg">{data.name}</div>
          <div className="text-sm text-gray-500">{data.email}</div>
          <div className="flex gap-2 mt-4">
            <Button aria-label="Edit profil" size="sm">Edit Profil</Button>
            <Button aria-label="Pengaturan" size="sm" variant="outline">
              Pengaturan
            </Button>
            <Button aria-label="Keluar" size="sm" variant="outline">
              Logout
            </Button>
          </div>
        </section>

        <section className="md:col-span-2 grid grid-cols-3 gap-4">
          {data.stats.map((s) => (
            <StatsCard key={s.label} label={s.label} value={s.value} />
          ))}
        </section>

        <section className="md:col-span-3 bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold mb-4 text-blue-700">Aktivitas Terbaru</h2>
          <ActivityList items={data.activity} />
        </section>
      </motion.div>
    </AnimatePresence>
  );
}

function StatsCard({ label, value }: Stat) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-xl shadow p-4 flex flex-col items-center"
    >
      <span className="text-xl font-bold">{value}</span>
      <span className="text-sm text-gray-500">{label}</span>
    </motion.div>
  );
}

function ActivityList({ items }: { items: Activity[] }) {
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id} className="flex justify-between border-b pb-2 last:border-b-0">
          <span className="text-sm">{a.text}</span>
          <span className="text-xs text-gray-500">{a.date}</span>
        </li>
      ))}
    </ul>
  );
}

