"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
      setError("Gagal mengambil data user");
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
    <main className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md"
      >
        <h2 className="text-xl font-semibold text-center mb-4">
          Edit Data User
        </h2>
        {error && (
          <p className="mb-2 text-red-500 text-sm text-center">{error}</p>
        )}
        {message && (
          <p className="mb-2 text-green-600 text-sm text-center">{message}</p>
        )}
        <div className="mb-3">
          <label className="block text-sm mb-1">Kesatuan</label>
          <input
            type="text"
            value={kesatuan}
            readOnly
            className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-100"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">Nama</label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
            required
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">Pangkat</label>
          <input
            type="text"
            value={pangkat}
            onChange={(e) => setPangkat(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">NRP</label>
          <input
            type="text"
            value={nrp}
            readOnly
            className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-100"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">Satfung</label>
          <input
            type="text"
            value={satfung}
            onChange={(e) => setSatfung(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">Jabatan</label>
          <input
            type="text"
            value={jabatan}
            onChange={(e) => setJabatan(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">Desa Binaan</label>
          <input
            type="text"
            value={desa}
            onChange={(e) => setDesa(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">Link Profile Instagram</label>
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
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
          {fieldErrors.insta && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.insta}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Link Profile TikTok</label>
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
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
          {fieldErrors.tiktok && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.tiktok}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </form>
    </main>
  );
}
