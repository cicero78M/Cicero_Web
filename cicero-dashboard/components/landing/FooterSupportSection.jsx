import Link from "next/link";
import { primaryContactHref } from "@/lib/landingPageContent";

export default function FooterSupportSection({ content }) {
  return (
    <footer className="w-full border-t border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,1)_0%,_rgba(248,250,252,1)_100%)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 md:px-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-700">Penutup</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">{content.title}</h2>
          <p className="mt-4 text-sm leading-6 text-slate-600 md:text-base">{content.description}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <a
            href={primaryContactHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
          >
            Hubungi tim Cicero
          </a>
          <div className="flex flex-wrap gap-4 text-slate-600">
            <Link href="/terms-of-service" className="transition hover:text-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">
              Ketentuan Layanan
            </Link>
            <Link href="/privacy-policy" className="transition hover:text-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">
              Kebijakan Privasi
            </Link>
          </div>
          <p className="text-xs text-slate-500">Landing page publik ini sengaja menghindari klaim harga, KPI, dan testimoni yang belum tervalidasi secara publik.</p>
        </div>
      </div>
    </footer>
  );
}
