"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Edit3, Info, TriangleAlert } from "lucide-react";

import ClaimLayout from "@/components/claim/ClaimLayout";
import { getClaimUserData, updateUserViaClaim } from "@/utils/api";
import {
  extractInstagramUsername,
  extractTiktokUsername,
  isValidInstagram,
  isValidTiktok,
} from "./socialUtils";

export default function EditUserPage() {
  const [nrp, setNrp] = useState("");
  const [email, setEmail] = useState("");
  const [kesatuan, setKesatuan] = useState("");
  const [nama, setNama] = useState("");
  const [pangkat, setPangkat] = useState("");
  const [satfung, setSatfung] = useState("");
  const [jabatan, setJabatan] = useState("");
  const [desa, setDesa] = useState("");
  const [insta, setInsta] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    insta: "",
    tiktok: "",
  });
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const n = sessionStorage.getItem("claim_nrp");
      const w = sessionStorage.getItem("claim_email");
      if (!n || !w) {
        router.replace("/claim");
        return;
      }
      setNrp(n);
      setEmail(w);
      loadUser(n, w);
    }
  }, [router]);

  async function loadUser(n, w) {
    try {
      const res = await getClaimUserData(n, w);
      const user = res.data || res.user || res;
      setKesatuan(user.nama_client || user.client_name || user.client_id || "");
      setNama(user.nama || "");
      setPangkat(user.title || "");
      setSatfung(user.divisi || "");
      setJabatan(user.jabatan || "");
      setDesa(user.desa || "");
      const instaUsername = extractInstagramUsername(user.insta);
      setInsta(
        instaUsername ? `https://www.instagram.com/${instaUsername}` : "",
      );
      const tiktokUsername = extractTiktokUsername(user.tiktok);
      setTiktok(tiktokUsername ? `https://tiktok.com/${tiktokUsername}` : "");
    } catch (err) {
      const message = err?.message?.trim()
        ? err.message
        : "Gagal mengambil data user";
      setError(message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    const nextFieldErrors = {
      insta: "",
      tiktok: "",
    };

    if (insta && !isValidInstagram(insta)) {
      nextFieldErrors.insta =
        "Gunakan format https://www.instagram.com/nama_pengguna (contoh: https://www.instagram.com/polri)";
    }

    if (tiktok && !isValidTiktok(tiktok)) {
      nextFieldErrors.tiktok =
        "Gunakan format https://www.tiktok.com/@nama_pengguna (contoh: https://www.tiktok.com/@polri)";
    }

    setFieldErrors(nextFieldErrors);

    if (nextFieldErrors.insta || nextFieldErrors.tiktok) {
      return;
    }
    const instaUsername = extractInstagramUsername(insta);
    const tiktokUsername = extractTiktokUsername(tiktok);
    setLoading(true);
    try {
      const res = await updateUserViaClaim({
        nrp,
        email,
        nama: nama.trim(),
        title: pangkat.trim(),
        divisi: satfung.trim(),
        jabatan: jabatan.trim(),
        desa: desa.trim(),
        insta: instaUsername,
        tiktok: tiktokUsername,
      });
      if (res.success) {
        setMessage("Data berhasil diperbarui");
      } else {
        setError(res.message || "Gagal memperbarui data");
      }
    } catch (err) {
      if (err instanceof TypeError) {
        setError("Gagal terhubung ke server");
      } else {
        const message = err?.message?.trim()
          ? err.message
          : "Gagal memperbarui data";
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ClaimLayout
      stepLabel="Langkah 3 dari 3"
      title="Perbarui & Sempurnakan Data Profil"
      description="Periksa kembali detailmu, tambahkan tautan media sosial aktif, dan simpan pembaruan agar profilmu tampil optimal."
      icon={<Edit3 className="h-5 w-5" />}
      infoTitle="Selesaikan pembaruan dengan penuh semangat"
      infoDescription="Langkah terakhir ini memastikan informasi pribadimu konsisten dan siap ditampilkan kepada publik."
      infoHighlights={[
        "Pastikan nama dan jabatan sesuai dokumen resmi.",
        "Gunakan tautan media sosial yang mudah diakses dan akurat.",
        "Simpan perubahan untuk memperbarui profil secara realtime.",
      ]}
      cardAccent="spirit"
    >
      <div className="space-y-8">
        <section className="rounded-3xl border border-spirit-200/80 bg-gradient-to-br from-white/80 via-spirit-50/70 to-trust-50/70 px-6 py-5 text-sm text-neutral-slate shadow-inner">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-5 w-5 text-spirit-500" />
            <div className="space-y-3">
              <p className="text-neutral-navy">
                Verifikasi kembali nama, pangkat, satfung, dan jabatan sesuai data resmi sebelum menyimpan perubahan.
              </p>
              <p>
                Untuk Instagram, buka profilmu lalu ketuk tombol bagikan dan salin tautan penuh dengan format <span className="font-medium text-spirit-600">https://www.instagram.com/nama_pengguna</span>.
              </p>
              <p>
                Untuk TikTok, buka profil di aplikasi atau web, pilih bagikan profil, kemudian salin tautan dengan format <span className="font-medium text-spirit-600">https://www.tiktok.com/@nama_pengguna</span>.
              </p>
              <p>
                Pastikan kedua akun disetel publik agar tim kami dapat melakukan verifikasi.
              </p>
              <p>
                Setelah menyesuaikan data dan menempelkan tautan, klik tombol <span className="font-medium text-spirit-600">Simpan</span> agar sistem memperbarui profilmu.
              </p>
            </div>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 text-sm text-red-600 shadow-sm">
              <TriangleAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {message && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-600 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{message}</span>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">Kesatuan</label>
              <input
                type="text"
                value={kesatuan}
                readOnly
                className="w-full rounded-2xl border border-spirit-200/60 bg-neutral-50 px-4 py-3 text-sm text-neutral-navy shadow-inner focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">NRP</label>
              <input
                type="text"
                value={nrp}
                readOnly
                className="w-full rounded-2xl border border-spirit-200/60 bg-neutral-50 px-4 py-3 text-sm text-neutral-navy shadow-inner focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">Nama</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">Pangkat</label>
              <input
                type="text"
                value={pangkat}
                onChange={(e) => setPangkat(e.target.value)}
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">Satfung</label>
              <input
                type="text"
                value={satfung}
                onChange={(e) => setSatfung(e.target.value)}
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-navy">Jabatan</label>
              <input
                type="text"
                value={jabatan}
                onChange={(e) => setJabatan(e.target.value)}
                className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-navy">Desa Binaan</label>
            <input
              type="text"
              value={desa}
              onChange={(e) => setDesa(e.target.value)}
              className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-navy">Link Profil Instagram</label>
            <input
              type="text"
              value={insta}
              onChange={(e) => {
                const value = e.target.value;
                setInsta(value);
                if (!value || isValidInstagram(value)) {
                  setFieldErrors((prev) => ({ ...prev, insta: "" }));
                }
              }}
              placeholder="https://www.instagram.com/nama_pengguna"
              className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
            />
            {fieldErrors.insta && (
              <p className="text-xs text-red-500">{fieldErrors.insta}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-navy">Link Profil TikTok</label>
            <input
              type="text"
              value={tiktok}
              onChange={(e) => {
                const value = e.target.value;
                setTiktok(value);
                if (!value || isValidTiktok(value)) {
                  setFieldErrors((prev) => ({ ...prev, tiktok: "" }));
                }
              }}
              placeholder="https://www.tiktok.com/@nama_pengguna"
              className="w-full rounded-2xl border border-spirit-200/80 bg-white px-4 py-3 text-sm text-neutral-navy shadow-inner focus:border-spirit-400 focus:outline-none focus:ring-2 focus:ring-spirit-200"
            />
            {fieldErrors.tiktok && (
              <p className="text-xs text-red-500">{fieldErrors.tiktok}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-spirit-400 via-consistency-300 to-trust-300 px-6 py-3 text-sm font-semibold text-neutral-navy shadow-md transition-all hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-spirit-200 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </div>
    </ClaimLayout>
  );
}
