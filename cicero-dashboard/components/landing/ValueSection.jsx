import SectionHeading from "@/components/landing/SectionHeading";
import SectionShell from "@/components/landing/SectionShell";

export default function ValueSection({ items }) {
  return (
    <SectionShell id="nilai-cicero" className="bg-white">
      <SectionHeading
        eyebrow="Nilai Utama"
        title="Fokus pada alur kerja yang memang tersedia hari ini."
        description="Landing page ini menyorot kapabilitas dan route publik yang sudah ada, sehingga pengunjung bisa memahami peran Cicero tanpa dibebani narasi promosi yang sulit diverifikasi."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <span className="inline-flex rounded-2xl bg-sky-100 p-3 text-sky-700">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
            </article>
          );
        })}
      </div>
    </SectionShell>
  );
}
