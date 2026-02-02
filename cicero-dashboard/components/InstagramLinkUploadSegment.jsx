"use client";

import { useState } from "react";
import { Link as LinkIcon, Upload, CheckCircle, AlertCircle } from "lucide-react";
import useAuth from "@/hooks/useAuth";
import { submitReposterReportLinks } from "@/utils/api";
import { showToast } from "@/utils/showToast";

/**
 * InstagramLinkUploadSegment Component
 * 
 * A segment for uploading Instagram links for special tasks (Tugas Khusus) 
 * directly from the Amplifikasi Khusus Insight page.
 */
export default function InstagramLinkUploadSegment() {
  const { token, profile, clientId } = useAuth();
  const [instagramLink, setInstagramLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const userId = profile?.user_id || profile?.userId || profile?.id || profile?.nrp || "";

  /**
   * Extract Instagram shortcode from URL
   */
  const extractInstagramShortcode = (url) => {
    const trimmed = url.trim();
    if (!trimmed) return "";
    try {
      const urlObj = new URL(trimmed);
      const match = urlObj.pathname.match(/\/(p|reel|reels|tv)\/([^/?#]+)/i);
      return match?.[2] ?? "";
    } catch {
      return "";
    }
  };

  /**
   * Validate Instagram link
   */
  const validateInstagramLink = (url) => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (!trimmed.startsWith("http")) return false;
    try {
      const urlObj = new URL(trimmed);
      const host = urlObj.hostname.toLowerCase();
      return (
        host === "instagram.com" ||
        host.endsWith(".instagram.com") ||
        host === "instagr.am" ||
        host.endsWith(".instagr.am") ||
        host === "ig.me" ||
        host.endsWith(".ig.me")
      );
    } catch {
      return false;
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      showToast("Token tidak tersedia. Silakan login ulang.", "error");
      return;
    }

    if (!userId) {
      showToast("User ID tidak ditemukan. Silakan login ulang.", "error");
      return;
    }

    const trimmedLink = instagramLink.trim();
    if (!trimmedLink) {
      showToast("Link Instagram tidak boleh kosong.", "error");
      return;
    }

    if (!validateInstagramLink(trimmedLink)) {
      showToast("Format link Instagram tidak valid. Pastikan link berasal dari instagram.com", "error");
      return;
    }

    const shortcode = extractInstagramShortcode(trimmedLink);
    if (!shortcode) {
      showToast("Tidak dapat mengekstrak shortcode dari link Instagram.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReposterReportLinks(
        token,
        {
          shortcode: shortcode,
          userId: userId,
          clientId: clientId || null,
          instagramLink: trimmedLink,
          facebookLink: "",
          twitterLink: "",
        },
        { isSpecial: true }
      );

      showToast("Link Instagram berhasil diunggah.", "success");
      setShowSuccess(true);
      setInstagramLink("");
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      showToast(error.message || "Gagal mengunggah link Instagram.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/50 via-white to-sky-50/50 p-6 shadow-[0_4px_20px_rgba(99,102,241,0.08)] backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 shadow-lg">
          <LinkIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">Upload Link Tugas Khusus</h3>
          <p className="text-sm text-slate-600">Unggah link Instagram untuk tugas khusus Anda</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="instagram-link" className="mb-2 block text-sm font-medium text-slate-700">
            Link Instagram <span className="text-red-500">*</span>
          </label>
          <input
            id="instagram-link"
            type="text"
            value={instagramLink}
            onChange={(e) => setInstagramLink(e.target.value)}
            placeholder="https://www.instagram.com/p/ABC123xyz/"
            className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-500"
            disabled={isSubmitting}
            required
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Contoh: https://www.instagram.com/p/ABC123xyz/ atau https://www.instagram.com/reel/DEF456/
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !instagramLink.trim()}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 via-indigo-600 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-md"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Mengunggah...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Link
              </>
            )}
          </button>

          {showSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" />
              Berhasil diunggah!
            </div>
          )}
        </div>
      </form>

      <div className="mt-4 rounded-lg bg-sky-50 p-3 text-xs text-slate-600">
        <div className="mb-1 flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-600" />
          <div>
            <p className="font-medium text-sky-800">Petunjuk:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-slate-600">
              <li>Salin link post Instagram Anda (bisa berupa post, reel, atau IGTV)</li>
              <li>Pastikan link berasal dari instagram.com</li>
              <li>Link akan otomatis tervalidasi sebelum diunggah</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
