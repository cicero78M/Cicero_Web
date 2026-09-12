"use client";
import Link from "next/link";
import { useState } from "react";
import useAuth from "@/hooks/useAuth";

export default function VerificationNotice() {
  const { profile } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  if (!profile || (profile.email_verified && profile.whatsapp_verified)) return null;
  if (dismissed) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900"
    >
      <span className="min-w-0 flex-1">
        Email dan WhatsApp wajib divalidasi dengan OTP.{" "}
        <Link className="font-semibold underline underline-offset-2" href="/profile">
          Buka Profile untuk memvalidasi
        </Link>
        .
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="rounded-md px-2 py-1 font-semibold underline underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-700"
        aria-label="Tutup pemberitahuan validasi"
      >
        Tutup
      </button>
    </div>
  );
}
