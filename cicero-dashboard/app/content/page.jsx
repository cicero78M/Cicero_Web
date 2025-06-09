"use client";
export default function SocialMediaContentManagerPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">Social Media Content Manager</h1>
        <p className="text-gray-600 mb-4">
          Manage and monitor content for both Instagram and TikTok. Upload, schedule, and review posts from a single dashboard.
        </p>
        {/* TODO: Tambahkan tab/kartu untuk Instagram & TikTok */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 bg-sky-50 rounded-lg border border-sky-200 p-6 text-center">
            <span className="text-lg font-semibold text-sky-700">Instagram Content</span>
            {/* TODO: Daftar/Upload konten IG */}
          </div>
          <div className="flex-1 bg-fuchsia-50 rounded-lg border border-fuchsia-200 p-6 text-center">
            <span className="text-lg font-semibold text-fuchsia-700">TikTok Content</span>
            {/* TODO: Daftar/Upload konten TikTok */}
          </div>
        </div>
      </div>
    </div>
  );
}
