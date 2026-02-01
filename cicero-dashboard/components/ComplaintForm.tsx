"use client";

import { useState } from "react";
import { postComplaintInstagram, postComplaintTiktok } from "@/utils/api";
import useAuth from "@/hooks/useAuth";
import { showToast } from "@/utils/showToast";

type Platform = "instagram" | "tiktok";

export default function ComplaintForm() {
  const { token } = useAuth();
  const [nrp, setNrp] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nrp.trim()) {
      showToast("NRP wajib diisi", "error");
      return;
    }

    if (!token) {
      showToast("Anda harus login terlebih dahulu", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = { nrp: nrp.trim() };

      if (platform === "instagram") {
        const result = await postComplaintInstagram(token, payload);
        showToast(result.message || "Komplain Instagram berhasil dikirim", "success");
      } else {
        const result = await postComplaintTiktok(token, payload);
        showToast(result.message || "Komplain TikTok berhasil dikirim", "success");
      }

      // Reset form after successful submission
      setNrp("");
      setPlatform("instagram");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Terjadi kesalahan saat mengirim komplain";
      showToast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-[2.25rem] border border-sky-200/70 bg-white/80 p-8 shadow-[0_36px_80px_-24px_rgba(14,165,233,0.45)] backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-900/70">
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
            Formulir Komplain
          </h3>
          <p className="text-sm text-sky-700 dark:text-slate-300">
            Laporkan kendala akun Instagram atau TikTok dengan memasukkan NRP dan memilih platform
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NRP Input */}
          <div className="space-y-2">
            <label
              htmlFor="nrp"
              className="block text-sm font-medium text-slate-900 dark:text-slate-100"
            >
              NRP <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nrp"
              value={nrp}
              onChange={(e) => setNrp(e.target.value)}
              placeholder="Masukkan NRP"
              className="w-full rounded-xl border border-sky-200/70 bg-white/90 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300/50 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/30"
              disabled={isSubmitting}
            />
          </div>

          {/* Platform Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Platform <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-sky-200/70 bg-white/90 px-4 py-3 transition hover:border-sky-400 dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-cyan-400">
                <input
                  type="radio"
                  name="platform"
                  value="instagram"
                  checked={platform === "instagram"}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="h-4 w-4 text-sky-600 focus:ring-2 focus:ring-sky-300 dark:text-cyan-400 dark:focus:ring-cyan-400/30"
                  disabled={isSubmitting}
                />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Instagram
                </span>
              </label>

              <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-sky-200/70 bg-white/90 px-4 py-3 transition hover:border-sky-400 dark:border-slate-700/60 dark:bg-slate-900/60 dark:hover:border-cyan-400">
                <input
                  type="radio"
                  name="platform"
                  value="tiktok"
                  checked={platform === "tiktok"}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                  className="h-4 w-4 text-sky-600 focus:ring-2 focus:ring-sky-300 dark:text-cyan-400 dark:focus:ring-cyan-400/30"
                  disabled={isSubmitting}
                />
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  TikTok
                </span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-sky-700 hover:to-cyan-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 dark:from-sky-500 dark:to-cyan-500 dark:hover:from-sky-600 dark:hover:to-cyan-600"
          >
            {isSubmitting ? "Mengirim..." : "Kirim Komplain"}
          </button>
        </form>
      </div>
    </div>
  );
}
