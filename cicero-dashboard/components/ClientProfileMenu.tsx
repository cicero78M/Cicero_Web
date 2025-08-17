"use client";
import { useState, useEffect, useRef } from "react";
import { getClientProfile } from "@/utils/api";
import { useAuth } from "@/context/AuthContext";

export default function ClientProfileMenu() {
  const { token, clientId } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!token || !clientId) return;
      try {
        const res = await getClientProfile(token, clientId);
        setProfile(res.client || res.profile || res);
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, [token, clientId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!profile) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600"
      >
        {profile.nama || "Profile"}
      </button>
      {open && (
        <ul className="absolute right-0 mt-2 bg-white dark:bg-gray-800 text-sm border border-gray-200 dark:border-gray-700 rounded shadow-md w-52 p-2 z-50">
          <li className="py-1"><span className="font-semibold">ID:</span> {profile.client_id}</li>
          <li className="py-1"><span className="font-semibold">Nama:</span> {profile.nama || "-"}</li>
          <li className="py-1"><span className="font-semibold">Tipe:</span> {profile.client_type || "-"}</li>
          {profile.client_insta && (
            <li className="py-1"><span className="font-semibold">Instagram:</span> {profile.client_insta}</li>
          )}
          {profile.client_tiktok && (
            <li className="py-1"><span className="font-semibold">TikTok:</span> {profile.client_tiktok}</li>
          )}
        </ul>
      )}
    </div>
  );
}
