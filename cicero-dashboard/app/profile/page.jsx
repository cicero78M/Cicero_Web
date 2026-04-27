"use client";

import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";

export default function ProfilePage() {
  useRequireAuth();
  const { profile, username, clientId, role, premiumTier, premiumExpiry } = useAuth();

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Informasi akun dashboard Anda.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama" value={profile?.nama || profile?.client_name || username || "-"} />
          <Field label="Client ID" value={clientId || profile?.client_id || "-"} />
          <Field label="Role" value={role || "-"} />
          <Field label="Client Type" value={profile?.client_type || "-"} />
          <Field label="Premium Tier" value={premiumTier || "-"} />
          <Field label="Premium Expiry" value={premiumExpiry || profile?.premium_expires_at || "-"} />
        </dl>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/70">
      <dt className="text-xs uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}
