"use client";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { Check, X, RefreshCw, AlertCircle } from "lucide-react";
import Loader from "@/components/Loader";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { getPendingApprovals, approveUser, rejectUser } from "@/utils/api";
import { showToast } from "@/utils/showToast";
import { notifyAdminNewUser, isTelegramConfigured } from "@/utils/telegram";

interface PendingUser {
  user_id: string;
  nama: string;
  title: string;
  divisi: string;
  client_id: string;
  client_name?: string;
  created_at?: string;
  insta?: string;
  tiktok?: string;
  email?: string;
}

export default function PendingApprovalsPage() {
  useRequireAuth();
  const { token, clientId, role, effectiveRole } = useAuth();
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PendingUser | null>(null);

  const {
    data: pendingData,
    error,
    isLoading,
    mutate,
  } = useSWR(
    token ? ["pending-approvals", clientId] : null,
    () => getPendingApprovals(token!, clientId || undefined),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  const pendingUsers: PendingUser[] = pendingData?.users || [];
  const telegramConfigured = isTelegramConfigured();

  const handleApprove = async (user: PendingUser) => {
    if (!token) return;
    
    setApproving(user.user_id);
    try {
      const result = await approveUser(token, user.user_id);
      
      if (result.success) {
        showToast(`User ${user.nama} berhasil disetujui`, "success");
        mutate();
      } else {
        showToast(result.error || "Gagal menyetujui user", "error");
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Terjadi kesalahan",
        "error"
      );
    } finally {
      setApproving(null);
    }
  };

  const openRejectModal = (user: PendingUser) => {
    setRejectTarget(user);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!token || !rejectTarget) return;
    
    setRejecting(rejectTarget.user_id);
    try {
      const result = await rejectUser(
        token,
        rejectTarget.user_id,
        rejectReason.trim() || undefined
      );
      
      if (result.success) {
        showToast(`User ${rejectTarget.nama} ditolak`, "success");
        setShowRejectModal(false);
        setRejectTarget(null);
        setRejectReason("");
        mutate();
      } else {
        showToast(result.error || "Gagal menolak user", "error");
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Terjadi kesalahan",
        "error"
      );
    } finally {
      setRejecting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-semibold">Error loading pending approvals</p>
          <p className="text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Persetujuan User Baru
        </h1>
        <p className="mt-2 text-gray-600">
          Kelola permohonan pendaftaran user yang menunggu persetujuan
        </p>
      </div>

      {!telegramConfigured && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900">
                Telegram Bot Belum Dikonfigurasi
              </h3>
              <p className="mt-1 text-sm text-amber-800">
                Notifikasi Telegram tidak aktif. Tambahkan{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
                  NEXT_PUBLIC_TELEGRAM_BOT_TOKEN
                </code>{" "}
                dan{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-xs">
                  NEXT_PUBLIC_TELEGRAM_ADMIN_CHAT_ID
                </code>{" "}
                ke file <code className="font-mono">.env.local</code> untuk
                mengaktifkan notifikasi otomatis.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                Menunggu Persetujuan
              </p>
              <p className="mt-1 text-3xl font-bold text-blue-700">
                {pendingUsers.length}
              </p>
            </div>
            <RefreshCw className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {pendingUsers.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-12 text-center">
          <Check className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Tidak Ada User Pending
          </h3>
          <p className="mt-2 text-gray-600">
            Semua permohonan pendaftaran telah diproses
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingUsers.map((user) => (
            <div
              key={user.user_id}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.title} {user.nama}
                    </h3>
                    <p className="text-sm text-gray-600">
                      NRP/NIP: {user.user_id}
                    </p>
                  </div>
                  
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <span className="text-xs font-medium text-gray-500">
                        Satfung:
                      </span>
                      <p className="text-sm font-medium text-gray-900">
                        {user.divisi || "-"}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-gray-500">
                        Client:
                      </span>
                      <p className="text-sm font-medium text-gray-900">
                        {user.client_name || user.client_id || "-"}
                      </p>
                    </div>
                    {user.email && (
                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Email:
                        </span>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.email}
                        </p>
                      </div>
                    )}
                  </div>

                  {(user.insta || user.tiktok) && (
                    <div className="flex gap-4 text-sm">
                      {user.insta && (
                        <div>
                          <span className="font-medium text-gray-500">IG:</span>{" "}
                          <span className="text-gray-900">@{user.insta}</span>
                        </div>
                      )}
                      {user.tiktok && (
                        <div>
                          <span className="font-medium text-gray-500">
                            TikTok:
                          </span>{" "}
                          <span className="text-gray-900">@{user.tiktok}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {user.created_at && (
                    <p className="text-xs text-gray-500">
                      Diajukan:{" "}
                      {new Date(user.created_at).toLocaleString("id-ID")}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 lg:flex-col">
                  <button
                    onClick={() => handleApprove(user)}
                    disabled={approving === user.user_id || rejecting !== null}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300 lg:flex-initial lg:px-6"
                  >
                    {approving === user.user_id ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Setujui
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openRejectModal(user)}
                    disabled={rejecting !== null || approving !== null}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300 lg:flex-initial lg:px-6"
                  >
                    <X className="h-4 w-4" />
                    Tolak
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRejectModal && rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900">
              Tolak Permohonan User
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              User: <span className="font-medium">{rejectTarget.nama}</span>
            </p>
            <p className="text-sm text-gray-600">
              NRP/NIP: <span className="font-medium">{rejectTarget.user_id}</span>
            </p>

            <div className="mt-4">
              <label
                htmlFor="reject-reason"
                className="block text-sm font-medium text-gray-700"
              >
                Alasan Penolakan (Opsional)
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                rows={3}
                placeholder="Masukkan alasan penolakan..."
              />
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectTarget(null);
                  setRejectReason("");
                }}
                disabled={rejecting !== null}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={rejecting !== null}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {rejecting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Tolak User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
