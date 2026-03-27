import SectionHeading from "@/components/landing/SectionHeading";
import SectionShell from "@/components/landing/SectionShell";

export default function UseCaseSection({ items }) {
  return (
    <SectionShell id="alur-evaluasi" className="bg-[linear-gradient(180deg,_rgba(248,250,252,1)_0%,_rgba(240,249,255,0.86)_100%)]">
      <SectionHeading
        eyebrow="Penggunaan"
        title="Disusun untuk evaluator, koordinator, dan tim yang sedang menilai kesiapan Cicero."
        description="Urutan konten dibangun agar pengunjung cepat memahami konteks penggunaan, jalur masuk yang tepat, dan area mana yang perlu dibahas lebih lanjut dengan tim Cicero."
      />
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {items.map((item, index) => (
          <article key={item.title} className="rounded-[1.75rem] border border-sky-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-sky-700">0{index + 1}</p>
            <h3 className="mt-4 text-xl font-semibold text-slate-950">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}
