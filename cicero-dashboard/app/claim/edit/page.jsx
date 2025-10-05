"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getClaimUserData, updateUserViaClaim } from "@/utils/api";

export function extractInstagramUsername(url) {
  if (!url) return "";
  const link = url.trim();
  if (!link) return "";

  const lower = link.toLowerCase();
  if (/^[a-z]+:\/\//i.test(link) && !lower.includes("instagram.com")) {
    return "";
  }
  if (lower.includes("instagram.com")) {
    const withProtocol = /^[a-z]+:\/\//i.test(link) ? link : `https://${link}`;
    try {
      const u = new URL(withProtocol);
      if (!u.hostname.includes("instagram.com")) return "";
      const segments = u.pathname.split("/").filter(Boolean);
      const username = segments[0] ? segments[0].replace(/^@/, "") : "";
      return username.split(/[?#]/)[0];
    } catch {
      // Fallback to string manipulation below
    }
  }

  let normalized = link
    .replace(/^[a-z]+:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^instagram\.com\/?/i, "")
    .replace(/^@/, "");

  normalized = normalized.split(/[/?#]/)[0];
  return normalized || "";
}

export function extractTiktokUsername(url) {
  if (!url) return "";
  const link = url.trim();
  if (!link) return "";

  const lower = link.toLowerCase();
  if (/^[a-z]+:\/\//i.test(link) && !lower.includes("tiktok.com")) {
    return "";
  }
  if (lower.includes("tiktok.com")) {
    const withProtocol = /^[a-z]+:\/\//i.test(link) ? link : `https://${link}`;
    try {
      const u = new URL(withProtocol);
      if (!u.hostname.includes("tiktok.com")) return "";
      const segments = u.pathname.split("/").filter(Boolean);
      const usernameSegment = segments[0] || "";
      const username = usernameSegment.replace(/^@/, "");
      return username.split(/[?#]/)[0];
    } catch {
      // Fallback to string manipulation below
    }
  }

  let normalized = link
    .replace(/^[a-z]+:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/^tiktok\.com\/?/i, "")
    .replace(/^@/, "");

  normalized = normalized.split(/[/?#]/)[0];
  return normalized || "";
}

function isValidInstagram(url) {
  if (!url) return true;
  return !!extractInstagramUsername(url);
}

function isValidTiktok(url) {
  if (!url) return true;
  return !!extractTiktokUsername(url);
}

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
    const instaUsername = extractInstagramUsername(insta);
    if (insta && !instaUsername) {
      setError("Link Instagram tidak valid");
      return;
    }
    const tiktokUsername = extractTiktokUsername(tiktok);
    if (tiktok && !tiktokUsername) {
      setError("Link TikTok tidak valid");
      return;
    }
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
            type="text"
            value={insta}
            onChange={(e) => setInsta(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Link Profile TikTok</label>
          <input
            type="text"
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
