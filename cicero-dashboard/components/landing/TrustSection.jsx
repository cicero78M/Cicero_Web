import SectionHeading from "@/components/landing/SectionHeading";
import SectionShell from "@/components/landing/SectionShell";

export default function TrustSection({ items }) {
  return (
    <SectionShell id="trust-assets" className="bg-slate-950 text-white">
      <SectionHeading
        eyebrow="Trust"
        title="Kredibilitas dibangun dari route nyata dan interaksi yang jujur."
        description="Kami hanya menampilkan referensi yang bisa ditelusuri ke implementasi atau halaman publik yang memang tersedia di aplikasi saat ini."
        tone="inverse"
      />
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <span className="inline-flex rounded-2xl bg-white/10 p-3 text-sky-200">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{item.description}</p>
            </article>
          );
        })}
      </div>
    </SectionShell>
  );
}
