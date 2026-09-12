"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-rose-600">CICERO</p>
        <h1 className="mt-3 text-2xl font-semibold">Halaman mengalami kendala</h1>
        <p className="mt-2 text-sm text-slate-600">Muat ulang halaman untuk mencoba kembali.</p>
        <button type="button" onClick={reset} className="mt-6 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2">
          Coba lagi
        </button>
      </section>
    </main>
  );
}
