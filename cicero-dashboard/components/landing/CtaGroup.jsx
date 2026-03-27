import Link from "next/link";

export default function CtaGroup({ primary, secondary }) {
  const PrimaryIcon = primary.icon;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <a
        href={primary.href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950"
      >
        {primary.label}
        <PrimaryIcon className="h-4 w-4" aria-hidden="true" />
      </a>
      {secondary.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}
