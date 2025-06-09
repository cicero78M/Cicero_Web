"use client";
export default function InstagramLikesTrackingPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">Instagram Likes Tracking</h1>
        <p className="text-gray-600 mb-4">
          Track and analyze Instagram post likes. View user activity and generate rekap reports.
        </p>
        {/* TODO: Integrasi komponen rekap likes IG */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 text-center py-12 text-slate-400">
          <span>Instagram likes data visualization will appear here.</span>
        </div>
      </div>
    </div>
  );
}
