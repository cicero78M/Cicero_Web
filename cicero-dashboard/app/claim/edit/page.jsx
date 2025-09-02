"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserById, updateUserViaClaim } from "@/utils/api";

function isValidInstagram(url) {
  if (!url) return true;
  return /^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+\/?$/.test(url);
}

function isValidTiktok(url) {
  if (!url) return true;
  return /^https?:\/\/(www\.)?tiktok\.com\/@[A-Za-z0-9._-]+\/?$/.test(url);
}

export default function EditUserPage() {
  const [nrp, setNrp] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
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
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const n = sessionStorage.getItem("claim_nrp");
      const w = sessionStorage.getItem("claim_whatsapp");
      if (!n || !w) {
        router.replace("/claim");
        return;
      }
      setNrp(n);
      setWhatsapp(w);
      loadUser(n);
    }
  }, [router]);

  async function loadUser(n) {
    try {
      const res = await getUserById(n);
      const user = res.data || res.user || res;
      setKesatuan(
        user.nama_client || user.client_name || user.client_id || ""
      );
      setNama(user.nama || "");
      setPangkat(user.title || "");
      setSatfung(user.divisi || "");
      setJabatan(user.jabatan || "");
      setDesa(user.desa || "");
      setInsta(user.insta || "");
      setTiktok(user.tiktok || "");
    } catch (err) {
      setError("Gagal mengambil data user");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!isValidInstagram(insta)) {
      setError("Link Instagram tidak valid");
      return;
    }
    if (!isValidTiktok(tiktok)) {
      setError("Link TikTok tidak valid");
      return;
    }
    setLoading(true);
    try {
      const res = await updateUserViaClaim({
        nrp,
        whatsapp,
        nama: nama.trim(),
        title: pangkat.trim(),
        divisi: satfung.trim(),
        jabatan: jabatan.trim(),
        desa: desa.trim(),
        insta: insta.trim(),
        tiktok: tiktok.trim(),
      });
      if (res.success) {
        setMessage("Data berhasil diperbarui");
      } else {
        setError(res.message || "Gagal memperbarui data");
      }
    } catch (err) {
      setError("Gagal terhubung ke server");
    }
    setLoading(false);
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
            type="url"
            value={insta}
            onChange={(e) => setInsta(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Link Profile TikTok</label>
          <input
            type="url"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
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
