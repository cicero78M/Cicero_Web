"use client";
import InstagramInfoPage from "../info/instagram/page";
import InstagramPostAnalysisPage from "../posts/instagram/page";
import useRequireAuth from "@/hooks/useRequireAuth";

export default function InstagramCombinedPage() {
  useRequireAuth();
  return (
    <>
      <InstagramInfoPage />
      <InstagramPostAnalysisPage />
    </>
  );
}
