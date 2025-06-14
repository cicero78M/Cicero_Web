"use client";
import TiktokInfo from "@/components/tiktok/Info";
import TiktokPostAnalysis from "@/components/tiktok/PostAnalysis";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function TiktokCombinedPage() {
  useRequireAuth();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-blue-700">TikTok Analysis</h1>
        <p className="text-gray-600">Gabungan info profil dan analisis posting TikTok.</p>
        <TiktokInfo embedded hideHeader />
        <TiktokPostAnalysis embedded hideHeader />
      </div>
    </div>
  );
}
