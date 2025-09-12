import DashboardStats from "@/components/DashboardStats";
import SocialCardsClient from "@/components/SocialCardsClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default async function DashboardPage() {
  let igProfile: any = null;
  let igPosts: any[] = [];
  let tiktokProfile: any = null;
  let tiktokPosts: any[] = [];

  try {
    const res = await fetch(`${API_BASE_URL}/api/aggregator?periode=harian`, {
      next: { revalidate: 60 },
    });
    if (res.ok) {
      const data = await res.json();
      igProfile = data.igProfile ?? null;
      igPosts = data.igPosts ?? [];
      tiktokProfile = data.tiktokProfile ?? null;
      tiktokPosts = data.tiktokPosts ?? [];
    }
  } catch (err) {
    console.error("Failed to fetch aggregator data", err);
  }

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

