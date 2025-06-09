"use client";
export default function UserDirectoryPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">User Directory</h1>
        <p className="text-gray-600 mb-4">
          Manage, search, and view all users registered in the system. Add, edit, or remove user accounts as needed.
        </p>
        {/* TODO: Tambahkan table/list pengguna di sini */}
        <div className="bg-slate-50 rounded-lg border border-slate-200 text-center py-12 text-slate-400">
          <span>User management table will appear here.</span>
        </div>
      </div>
    </div>
  );
}
