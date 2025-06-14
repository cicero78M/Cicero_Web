"use client";
import TiktokInfo from "@/components/tiktok/Info";
import TiktokPostAnalysis from "@/components/tiktok/PostAnalysis";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function TiktokCombinedPage() {
  useRequireAuth();
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-5xl flex flex-col gap-8">
        <TiktokInfo embedded />
        <TiktokPostAnalysis embedded />
      </div>
    </div>
  );
}
