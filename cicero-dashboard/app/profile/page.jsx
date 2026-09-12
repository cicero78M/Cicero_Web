"use client";

import { useEffect, useState } from "react";
import useRequireAuth from "@/hooks/useRequireAuth";
import useAuth from "@/hooks/useAuth";
import { confirmDashboardVerificationOtp, getDashboardSatfungOptions, requestDashboardVerificationOtp, updateDashboardProfile } from "@/utils/api";

const fields = [["nama", "Nama Personil"], ["pangkat", "Pangkat"], ["nrp", "NRP"], ["satfung", "Satfung Utama / POLSEK"], ["email", "Email"], ["whatsapp", "WhatsApp"]];

export default function ProfilePage() {
  useRequireAuth();
  const { profile, token, username, clientId, role, mergeProfile } = useAuth();
  const [form, setForm] = useState({ nama: "", pangkat: "", nrp: "", satfung: "", email: "", whatsapp: "" });
  const [otp, setOtp] = useState({ email: "", whatsapp: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [satfungOptions, setSatfungOptions] = useState([]);

  useEffect(() => setForm((current) => ({ ...current, ...Object.fromEntries(fields.map(([name]) => [name, profile?.[name] || ""])) })), [profile]);
  useEffect(() => { let active = true; if (!token) return undefined; getDashboardSatfungOptions(token).then((options) => { if (active) setSatfungOptions(options); }).catch(() => {}); return () => { active = false; }; }, [token]);
  const change = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  const save = async (event) => {
    event.preventDefault(); setBusy("save"); setError(""); setMessage("");
    try {
      const updated = await updateDashboardProfile(token, form);
      mergeProfile(updated || form);
      setForm((current) => ({ ...current, ...form }));
      setMessage("Profil berhasil diperbarui. Perubahan email/WhatsApp memerlukan OTP baru.");
    }
    catch (err) { setError(err.message); } finally { setBusy(""); }
  };
  const sendOtp = async (channel) => {
    setBusy(`send-${channel}`); setError(""); setMessage("");
    try { await requestDashboardVerificationOtp(token, channel); setMessage(`OTP ${channel} berhasil dikirim.`); }
    catch (err) { setError(err.message); } finally { setBusy(""); }
  };
  const verify = async (channel) => {
    setBusy(`verify-${channel}`); setError(""); setMessage("");
    try {
      const updated = await confirmDashboardVerificationOtp(token, channel, otp[channel]);
      mergeProfile(updated?.data || updated || { [`${channel}_verified`]: true });
      setOtp((current) => ({ ...current, [channel]: "" }));
      setMessage(`Validasi ${channel} berhasil.`);
    }
    catch (err) { setError(err.message); } finally { setBusy(""); }
  };
  return <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h1 className="text-2xl font-semibold">Profile</h1><p className="mt-1 text-sm text-slate-500">Kelola data operator dan validasi kontak akun.</p></div>
    {message && <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}{error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    <form onSubmit={save} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="grid gap-4 sm:grid-cols-2"><label htmlFor="profile-username" className="text-sm font-medium text-slate-700">Username Login<input id="profile-username" value={username || "-"} readOnly className="mt-1 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-slate-500" /><span className="mt-1 block text-xs font-normal text-slate-500">Username login tidak dapat diubah.</span></label>{fields.map(([name, label]) => <label key={name} htmlFor={`profile-${name}`} className="text-sm font-medium text-slate-700">{label}{name === "satfung" ? <select id="profile-satfung" name="satfung" value={form.satfung} onChange={change} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2"><option value="">Pilih Satfung</option>{[...new Set([form.satfung, ...satfungOptions].filter(Boolean))].map((option) => <option key={option} value={option}>{option}</option>)}</select> : <input id={`profile-${name}`} name={name} value={form[name]} onChange={change} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />}</label>)}</div><div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><b>Informasi Organisasi</b><br />Nama Satker / Polres: {profile?.client_name || profile?.name_client || clientId || "-"}<br />Client ID: {clientId || "-"} · Role: {role || "-"}</div><button type="submit" disabled={busy === "save"} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Simpan data</button></form>
    <div className="grid gap-4 md:grid-cols-2">{["email", "whatsapp"].map((channel) => { const verified = Boolean(profile?.[`${channel}_verified`]); return <section key={channel} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="font-semibold">Validasi {channel === "email" ? "Email" : "WhatsApp"}</h2><p className="mt-1 text-sm">Status: <b>{verified ? "Tervalidasi" : "Belum tervalidasi"}</b></p>{!verified && <><div className="mt-3 flex gap-2"><button type="button" onClick={() => sendOtp(channel)} disabled={busy === `send-${channel}`} className="rounded-lg bg-slate-800 px-3 py-2 text-sm text-white">Kirim OTP</button><input inputMode="numeric" maxLength={6} value={otp[channel]} onChange={(e) => setOtp((current) => ({ ...current, [channel]: e.target.value.replace(/\D/g, "") }))} placeholder="6 digit OTP" className="min-w-0 flex-1 rounded-lg border px-3" /></div><button type="button" onClick={() => verify(channel)} disabled={busy === `verify-${channel}`} className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Validasi OTP</button></>}</section>; })}</div>
  </div>;
}
