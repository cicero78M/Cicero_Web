import Link from "next/link";

export default function LoginUpdatePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-100 via-indigo-50 to-violet-100 px-6 py-12 text-slate-900">
      <div className="w-full max-w-2xl rounded-3xl border border-indigo-200/50 bg-white/80 p-10 text-center shadow-xl shadow-indigo-100/70 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
          Login Update
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
          Pilih akses untuk klaim & repost
        </h1>
        <p className="mt-3 text-base text-slate-600">
          Gunakan akses claim untuk memproses permintaan update atau lanjutkan ke
          login reposter untuk mengelola repost konten.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/claim"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 via-indigo-400 to-violet-500 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-violet-200/80 transition hover:scale-[1.03] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          >
            Login Claim
          </Link>
          <Link
            href="/reposter/login"
            className="inline-flex items-center justify-center rounded-full border border-indigo-200/70 bg-white/70 px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-violet-300 hover:text-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
          >
            Login Reposter
          </Link>
        </div>
      </div>
    </div>
  );
}
