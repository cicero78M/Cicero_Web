import Link from "next/link";
import SectionHeading from "@/components/landing/SectionHeading";
import SectionShell from "@/components/landing/SectionShell";

export default function SecondaryPathsSection({ items }) {
  return (
    <SectionShell id="jalur-sekunder" className="bg-white">
      <SectionHeading
        eyebrow="Jalur Sekunder"
        title="Semua route publik yang perlu dipertahankan tetap terlihat."
        description="Pengunjung yang butuh akses spesifik bisa langsung menuju route yang sesuai tanpa menggeser CTA konsultasi sebagai fokus utama landing page."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {items.map((item) => (
          <article key={item.href} className="flex h-full flex-col rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
            <Link
              href={item.href}
              className="mt-5 inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              {item.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
