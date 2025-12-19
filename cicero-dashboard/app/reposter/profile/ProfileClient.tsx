"use client";

import { useMemo } from "react";
import useReposterAuth from "@/hooks/useReposterAuth";
import {
  decodeJwtPayload,
  mergeReposterProfiles,
} from "@/utils/reposterProfile";

const fallbackInitials = (value: string) =>
  value
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function ProfileClient() {
  const { token, profile, isHydrating } = useReposterAuth();

  const mergedProfile = useMemo(() => {
    const tokenProfile = token ? decodeJwtPayload(token) : null;
    return mergeReposterProfiles([profile, tokenProfile]);
  }, [profile, token]);

  if (isHydrating) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!mergedProfile) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
        Data profil belum tersedia. Silakan login ulang agar profil tersimpan.
      </div>
    );
  }

  const displayName = mergedProfile.name || mergedProfile.nrp || "User";
  const avatarInitials = fallbackInitials(displayName);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/40 md:flex-row md:items-center">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-xl font-semibold text-sky-700 dark:bg-cyan-900/40 dark:text-cyan-200">
          {mergedProfile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mergedProfile.avatarUrl}
              alt={displayName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{avatarInitials}</span>
          )}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Profil Reposter
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-800 dark:text-white">
            {displayName}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-300">
            NRP: {mergedProfile.nrp || "-"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Nama Lengkap", value: mergedProfile.name },
          { label: "NRP", value: mergedProfile.nrp },
          { label: "Jabatan", value: mergedProfile.role },
          { label: "Kesatuan", value: mergedProfile.unit },
          { label: "Pangkat", value: mergedProfile.rank },
          { label: "WhatsApp", value: mergedProfile.whatsapp },
          { label: "Email", value: mergedProfile.email },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              {item.label}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-100">
              {item.value || "-"}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
        Data profil diambil dari sesi login reposter yang sedang aktif.
      </div>
    </div>
  );
}
