"use client";
import SocialMediaContentTable from "@/components/SocialMediaContentTable";

export default function SocialMediaContentManagerPage() {
  const igPosts = [
    { caption: "Promo terbaru", schedule: "2025-06-21 10:00", status: "Scheduled" },
  ];
  const tiktokPosts = [
    { caption: "Behind the scenes", schedule: "2025-06-22 12:00", status: "Scheduled" },
  ];
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
