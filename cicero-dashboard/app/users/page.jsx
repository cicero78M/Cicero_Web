"use client";
import { useEffect, useState, useMemo } from "react";
import { getUserDirectory } from "@/utils/api";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";

const PAGE_SIZE = 50;

export default function UserDirectoryPage() {
  useRequireAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  // Ambil client_id dari localStorage (atau sesuaikan kebutuhanmu)
  const client_id =
    typeof window !== "undefined"
      ? localStorage.getItem("client_id") || "BOJONEGORO"
      : "BOJONEGORO";

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("cicero_token") : null;
    if (!token) {
      setError("Token tidak ditemukan. Silakan login ulang.");
      setLoading(false);
      return;
    }
    if (!client_id) {
      setError("Client ID tidak ditemukan.");
      setLoading(false);
      return;
    }

    async function fetchUsers() {
      try {
        const res = await getUserDirectory(token, client_id);
        const data = res.data || res.users || res;
        setUsers(Array.isArray(data) ? data : []);
      } catch (err) {
        setError("Gagal mengambil data: " + (err.message || err));
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client_id]);

  // Filter: tidak tampilkan user dengan exception
  const filtered = useMemo(
    () =>
      users
        .filter((u) => !u.exception)
        .filter(
          (u) =>
            (u.nama || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.title || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.user_id || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.divisi || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.insta || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.tiktok || "").toLowerCase().includes(search.toLowerCase()) ||
            (String(u.status)).toLowerCase().includes(search.toLowerCase())
        ),
    [users, search]
  );

  // Paging logic
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const currentRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset ke halaman 1 saat search berubah
  useEffect(() => setPage(1), [search]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white rounded-lg shadow-md p-6 text-red-500 font-bold">
          {error}
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-12">
      <div className="max-w-6xl w-full bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-blue-700 mb-6">User Directory</h1>
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Cari pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm shadow focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-2 text-left">No</th>
                <th className="py-2 px-2 text-left">Nama</th>
                <th className="py-2 px-2 text-left">NRP/NIP</th>
                <th className="py-2 px-2 text-left">Satfung</th>
                <th className="py-2 px-2 text-left">Username IG</th>
                <th className="py-2 px-2 text-left">Username TikTok</th>
                <th className="py-2 px-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((u, idx) => (
                <tr key={u.user_id || idx} className="border-t">
                  <td className="py-1 px-2">{(page - 1) * PAGE_SIZE + idx + 1}</td>
                  <td className="py-1 px-2">
                    {(u.title ? `${u.title} ` : "") + (u.nama || "-")}
                  </td>
                  <td className="py-1 px-2 font-mono">{u.user_id || "-"}</td>
                  <td className="py-1 px-2">{u.divisi || "-"}</td>
                  <td className="py-1 px-2 font-mono text-blue-700">
                    {u.insta ? `@${u.insta}` : "-"}
                  </td>
                  <td className="py-1 px-2 font-mono text-pink-700">{u.tiktok || "-"}</td>
                  <td className="py-1 px-2">
                    {u.status === true || u.status === "true"
                      ? (
                        <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs">Aktif</span>
                      )
                      : (
                        <span className="inline-block px-2 py-1 rounded bg-gray-200 text-gray-700 text-xs">Nonaktif</span>
                      )
                    }
                  </td>
                </tr>
              ))}
              {currentRows.length === 0 && (
                <tr>
                  <td colSpan="8" className="py-4 text-center text-gray-500">
                    Tidak ada pengguna
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Paging Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span className="text-sm text-gray-600">
              Halaman <b>{page}</b> dari <b>{totalPages}</b>
            </span>
            <button
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold disabled:opacity-50"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
