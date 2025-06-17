"use client";
import ProfileDashboard from "@/components/ProfileDashboard";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8">
      <div className="w-full max-w-6xl">
        <ProfileDashboard />
      </div>
    </div>
  );
}
