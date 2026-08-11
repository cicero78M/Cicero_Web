"use client";

import { CheckCircle2, CircleHelp, ExternalLink, ShieldAlert, Sparkles } from "lucide-react";

const QUALITY_LABELS = {
  complete: "Lengkap",
  partial: "Perlu dilengkapi",
  limited: "Terbatas",
};

function accountAssessment(value, validation) {
  if (!value.trim()) {
    return { tone: "neutral", label: "Belum diisi", advice: "Tambahkan username akun yang aktif jika Anda memilikinya." };
  }
  if (!validation || validation.status === "loading") {
    return { tone: "neutral", label: validation?.status === "loading" ? "Sedang diperiksa" : "Belum diperiksa", advice: "Klik Periksa username untuk melihat kualitas data akun ini." };
  }
  if (validation.status === "error" || validation.status === "warning") {
    return { tone: "warning", label: "Perlu diperiksa ulang", advice: validation.message };
  }
  if (!validation.data?.found) {
    return { tone: "warning", label: "Username perlu diperbaiki", advice: "Pastikan ejaan username sesuai profil dan akun masih aktif, lalu periksa kembali." };
  }

  const profile = validation.data;
  const score = Number.isFinite(profile.data_quality?.score) ? profile.data_quality.score : null;
  if (profile.is_private) {
    return { tone: "warning", label: "Akun privat", score, advice: "Ubah akun menjadi publik agar informasi profil dapat diperiksa dengan lebih lengkap." };
  }
  if (["partial", "limited"].includes(profile.data_quality?.label) || (score !== null && score < 70)) {
    return {
      tone: "warning",
      label: QUALITY_LABELS[profile.data_quality?.label] || "Data akun terbatas",
      score,
      advice: profile.data_quality?.explanation || "Lengkapi profil dan pastikan akun dapat diakses publik, lalu periksa kembali.",
    };
  }
  return {
    tone: "good",
    label: QUALITY_LABELS[profile.data_quality?.label] || profile.data_quality?.label || "Profil ditemukan",
    score,
    advice: profile.data_quality?.explanation || "Data profil tersedia. Pastikan username tetap sesuai dengan akun aktif Anda.",
  };
}

function AccountRow({ platform, value, validation, index }) {
  const assessment = accountAssessment(value, validation);
  const good = assessment.tone === "good";
  const warning = assessment.tone === "warning";
  return (
    <li className="rounded-2xl border border-spirit-100 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-slate">{platform} {index + 1}</p>
          <p className="mt-1 break-all font-semibold text-neutral-navy">{value.trim() || "Belum ada username"}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${good ? "bg-emerald-100 text-emerald-700" : warning ? "bg-amber-100 text-amber-800" : "bg-neutral-100 text-neutral-slate"}`}>
          {assessment.label}{assessment.score !== undefined && assessment.score !== null ? ` · ${assessment.score}/100` : ""}
        </span>
      </div>
      <p className="mt-3 text-sm text-neutral-slate">{assessment.advice}</p>
    </li>
  );
}

export default function SocialAccountQualityCard({ instagramAccounts, tiktokAccounts, instagramValidations, tiktokValidations, onOpenProfile }) {
  const accounts = [
    ...instagramAccounts.map((value, index) => ({ platform: "Instagram", value, validation: instagramValidations[index], index })),
    ...tiktokAccounts.map((value, index) => ({ platform: "TikTok", value, validation: tiktokValidations[index], index })),
  ];

  return (
    <section aria-labelledby="social-quality-title" className="overflow-hidden rounded-3xl border border-spirit-200/80 bg-gradient-to-br from-white via-spirit-50/60 to-trust-50/70 shadow-sm">
      <div className="border-b border-spirit-100 px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-spirit-100 p-2.5 text-spirit-600"><Sparkles className="h-5 w-5" /></div>
          <div>
            <h2 id="social-quality-title" className="text-lg font-bold text-neutral-navy">Kualitas akun media sosial</h2>
            <p className="mt-1 text-sm text-neutral-slate">Periksa setiap username untuk mengetahui kelengkapan data profil dan langkah perbaikannya.</p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <ul className="grid gap-3 lg:grid-cols-2">
          {accounts.map((account) => <AccountRow key={`${account.platform}-${account.index}`} {...account} />)}
        </ul>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/70 p-4"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><p className="mt-2 font-semibold text-neutral-navy">Tulis dengan tepat</p><p className="mt-1 text-xs text-neutral-slate">Salin username langsung dari profil untuk menghindari salah eja.</p></div>
          <div className="rounded-2xl bg-white/70 p-4"><ShieldAlert className="h-5 w-5 text-amber-600" /><p className="mt-2 font-semibold text-neutral-navy">Gunakan akun publik</p><p className="mt-1 text-xs text-neutral-slate">Profil privat membatasi data yang dapat diperiksa oleh sistem.</p></div>
          <div className="rounded-2xl bg-white/70 p-4"><CircleHelp className="h-5 w-5 text-spirit-600" /><p className="mt-2 font-semibold text-neutral-navy">Periksa setelah mengubah</p><p className="mt-1 text-xs text-neutral-slate">Klik Periksa username lagi setelah memperbaiki username atau profil.</p></div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-spirit-200 bg-white/80 px-4 py-3">
          <p className="text-xs text-neutral-slate">Skor menunjukkan kelengkapan data yang tersedia, bukan keaslian atau kepemilikan akun.</p>
          <button type="button" onClick={onOpenProfile} className="inline-flex items-center gap-2 rounded-xl bg-spirit-600 px-4 py-2 text-sm font-semibold text-white hover:bg-spirit-700">
            Periksa dan perbaiki username <ExternalLink className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
