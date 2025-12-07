import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white p-8 text-center text-slate-800">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-rose-600">
          404
        </p>
        <h1 className="text-3xl font-bold">Halaman tidak ditemukan</h1>
        <p className="text-base text-slate-600">
          Kami tidak dapat menemukan halaman yang Anda cari. Silakan kembali ke
          beranda atau gunakan navigasi untuk melanjutkan.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-700"
      >
        Kembali ke dashboard
      </Link>
    </main>
  );
}
