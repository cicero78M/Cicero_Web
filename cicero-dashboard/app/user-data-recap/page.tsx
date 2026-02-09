"use client";
import { useEffect, useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  getUserDirectory,
  getClientProfile,
  extractUserDirectoryUsers,
} from "@/utils/api";
import {
  filterUserDirectoryByScope,
  getUserDirectoryFetchScope,
  normalizeDirectoryRole,
} from "@/utils/userDirectoryScope";
import {
  categorizeUsers,
  getUserDataStats,
  isUserDataComplete,
  isUserDataIncomplete,
  shouldExcludeUser,
} from "@/utils/userDataCompleteness";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { showToast } from "@/utils/showToast";
import { Users, CheckCircle, AlertCircle, ClipboardList } from "lucide-react";

type TabType = "semua" | "lengkap" | "kurang";

function UserDataRecapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    token,
    clientId,
    effectiveClientType,
    role,
    effectiveRole,
    regionalId,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("semua");
  const [search, setSearch] = useState("");

  // Get tab from URL params
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "lengkap" || tabParam === "kurang" || tabParam === "semua") {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const normalizedRole = normalizeDirectoryRole(effectiveRole || role || undefined);
  const normalizedScope = String(effectiveClientType || "")
    .trim()
    .toUpperCase();
  const profileRequestContext = {
    role: normalizedRole || undefined,
    scope: normalizedScope || undefined,
    regional_id: regionalId ? String(regionalId) : undefined,
  };

  const { data, error, isLoading } = useSWR(
    token && clientId
      ? ["user-data-recap", token, clientId, regionalId]
      : null,
    async ([_, tk, cid]) => {
      if (!tk) throw new Error("Token tidak ditemukan. Silakan login ulang.");
      if (!cid) throw new Error("Client ID tidak ditemukan.");
      
      const profileRes = await getClientProfile(tk, cid, undefined, profileRequestContext);
      const profile = profileRes.client || profileRes.profile || profileRes || {};
      
      const resolvedRegionalId =
        regionalId ??
        profile.regional_id ??
        profile.regionalId ??
        profile.regionalID ??
        profile.regional;
      const normalizedRegionalId = resolvedRegionalId
        ? String(resolvedRegionalId)
        : undefined;
      
      const rawClientType = (profile.client_type || "").toUpperCase();
      const scope = getUserDirectoryFetchScope({
        role: normalizedRole || undefined,
        clientType: rawClientType,
      });
      
      const directoryRes = await getUserDirectory(tk, cid, {
        role: normalizedRole || undefined,
        scope,
        regional_id: normalizedRegionalId,
      });
      
      return { directoryRes, profile };
    },
    {
      refreshInterval: 30000,
    }
  );

  const allUsers = useMemo(() => {
    if (!data?.directoryRes) return [];
    return extractUserDirectoryUsers(data.directoryRes);
  }, [data]);

  const categories = useMemo(() => categorizeUsers(allUsers), [allUsers]);
  const stats = useMemo(() => getUserDataStats(allUsers), [allUsers]);

  // Filter users based on active tab
  const displayedUsers = useMemo(() => {
    let users = categories[activeTab] || [];
    
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (user) =>
          user.nama?.toLowerCase().includes(searchLower) ||
          user.nrp_nip?.toLowerCase().includes(searchLower) ||
          user.satfung?.toLowerCase().includes(searchLower) ||
          user.instagram_username?.toLowerCase().includes(searchLower) ||
          user.tiktok_username?.toLowerCase().includes(searchLower)
      );
    }
    
    return users;
  }, [categories, activeTab, search]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.push(`?tab=${tab}`, { scroll: false });
  };

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-lg bg-red-50 p-6 text-red-800 dark:bg-red-900/20 dark:text-red-200">
          <p className="font-medium">Error: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-sky-100 p-3 dark:bg-sky-500/20">
            <ClipboardList className="h-8 w-8 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 md:text-3xl">
              Rekap Data User
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Rekapitulasi kelengkapan data media sosial pengguna
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Pengguna</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Data Lengkap</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {stats.lengkap}{" "}
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    ({stats.lengkapPercent}%)
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-lg dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Data Kurang</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {stats.kurang}{" "}
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    ({stats.kurangPercent}%)
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 rounded-lg bg-white p-2 shadow-lg dark:bg-slate-800">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleTabChange("semua")}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                activeTab === "semua"
                  ? "bg-sky-500 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="h-4 w-4" />
                <span>Semua ({categories.semua.length})</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange("lengkap")}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                activeTab === "lengkap"
                  ? "bg-green-500 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Lengkap ({categories.lengkap.length})</span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange("kurang")}
              className={`flex-1 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                activeTab === "kurang"
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Kurang ({categories.kurang.length})</span>
              </div>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Cari berdasarkan nama, NRP/NIP, satfung, atau username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>

        {/* Note about exclusions */}
        <div className="mb-4 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Catatan:</strong> Pengguna dengan satfung "SAT INTELKAM" dan client_id
            "DIREKTORAT" tidak dihitung dalam statistik.
          </p>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                    No
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Pangkat
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                    NRP/NIP
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Satfung
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Instagram
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                    TikTok
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {displayedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                      Tidak ada data pengguna
                    </td>
                  </tr>
                ) : (
                  displayedUsers.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100">
                        {user.nama}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {user.pangkat || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {user.nrp_nip}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                        {user.satfung || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.instagram_username ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-200">
                            <CheckCircle className="h-3 w-3" />
                            {user.instagram_username}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                            <AlertCircle className="h-3 w-3" />
                            Kosong
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {user.tiktok_username ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-200">
                            <CheckCircle className="h-3 w-3" />
                            {user.tiktok_username}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                            <AlertCircle className="h-3 w-3" />
                            Kosong
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {isUserDataComplete(user) ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white">
                            <CheckCircle className="h-3 w-3" />
                            Lengkap
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-2 py-1 text-xs font-medium text-white">
                            <AlertCircle className="h-3 w-3" />
                            Kurang
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
          Menampilkan {displayedUsers.length} dari {categories[activeTab].length} pengguna
        </div>
      </div>
    </div>
  );
}

export default function UserDataRecapPage() {
  useRequireAuth();
  
  return (
    <Suspense fallback={<Loader />}>
      <UserDataRecapContent />
    </Suspense>
  );
}
