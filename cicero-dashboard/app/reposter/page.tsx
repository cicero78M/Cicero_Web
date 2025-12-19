import Link from "next/link";

const DEFAULT_REPOSTER_URL = "http://localhost:5173";

export default function ReposterPage() {
  const reposterUrl =
    process.env.NEXT_PUBLIC_REPOSTER_URL ?? DEFAULT_REPOSTER_URL;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col gap-4 bg-slate-50 px-4 py-6 text-slate-700 dark:bg-slate-950 dark:text-slate-100 md:px-8">
      <div className="flex flex-col gap-2">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
          Reposter
        </p>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">
          Kelola konten ulang (Reposter)
        </h1>
        <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-300">
          Modul reposter dijalankan sebagai layanan terpisah dan ditampilkan di
          dashboard melalui iframe. Atur URL layanan dengan variabel lingkungan
          <span className="font-semibold"> NEXT_PUBLIC_REPOSTER_URL</span>.
        </p>
        <Link
          href={reposterUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-sky-600 underline-offset-4 hover:underline dark:text-cyan-300"
        >
          Buka reposter di tab baru
        </Link>
      </div>

      <div className="flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_40px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900/70">
        <iframe
          title="Reposter"
          src={reposterUrl}
          className="h-[calc(100vh-14rem)] w-full"
          allow="clipboard-read; clipboard-write;"
        />
      </div>
    </div>
  );
}
