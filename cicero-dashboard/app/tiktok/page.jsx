"use client";
import TiktokInfo from "@/components/tiktok/Info";
import TiktokPostAnalysis from "@/components/tiktok/PostAnalysis";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function TiktokCombinedPage() {
  useRequireAuth();
  return (
    <>
      <TiktokInfo />
      <TiktokPostAnalysis />
    </>
  );
}
