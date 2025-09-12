"use client";

import { useEffect, useState } from "react";
import DashboardStats from "@/components/DashboardStats";
import SocialCardsClient from "@/components/SocialCardsClient";
import { useAuth } from "@/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function DashboardPage() {
  const { token } = useAuth();
  const [igProfile, setIgProfile] = useState<any>(null);
  const [igPosts, setIgPosts] = useState<any[]>([]);
  const [tiktokProfile, setTiktokProfile] = useState<any>(null);
  const [tiktokPosts, setTiktokPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!token) return;

    async function fetchData() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/aggregator?periode=harian`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch aggregator data");
        const json = await res.json();
        const data = json.data || json;
        setIgProfile(data.igProfile ?? null);
        setIgPosts(Array.isArray(data.igPosts) ? data.igPosts : []);
        setTiktokProfile(data.tiktokProfile ?? null);
        setTiktokPosts(Array.isArray(data.tiktokPosts) ? data.tiktokPosts : []);
      } catch (err) {
        console.error("Failed to fetch aggregator data", err);
      }
    }
    fetchData();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-6xl space-y-6">
        <DashboardStats
          igProfile={igProfile}
          igPosts={igPosts}
          tiktokProfile={tiktokProfile}
          tiktokPosts={tiktokPosts}
        />
        <SocialCardsClient
          igProfile={igProfile}
          igPosts={igPosts}
          tiktokProfile={tiktokProfile}
          tiktokPosts={tiktokPosts}
        />
      </div>
    </div>
  );
}

