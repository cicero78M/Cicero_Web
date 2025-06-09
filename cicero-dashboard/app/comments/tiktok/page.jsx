"use client";
export default function TikTokCommentsTrackingPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">TikTok Comments Tracking</h1>
        <p className="text-gray-600 mb-4">
          Monitor TikTok comments activity, track engagement, and review comment compliance from your team.
        </p>
        {/* TODO: Integrasi komponen absensi komentar TikTok */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 text-center py-12 text-slate-400">
          <span>TikTok comments report and analytics will appear here.</span>
        </div>
      </div>
    </div>
  );
}
