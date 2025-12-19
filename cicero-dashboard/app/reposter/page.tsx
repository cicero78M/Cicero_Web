import Link from "next/link";
import ReposterFrame from "./ReposterFrame";
import { buildReposterUrl } from "./reposterUrl";

export default function ReposterPage() {
  const deepLinks = [
    {
      label: "Profil pengguna",
      href: buildReposterUrl("/profile"),
    },
    {
      label: "Tugas official",
      href: buildReposterUrl("/tasks/official"),
    },
    {
      label: "Tugas khusus",
      href: buildReposterUrl("/tasks/special"),
    },
  ];

  return (
    <ReposterFrame
      title="Kelola konten ulang (Reposter)"
      description="Modul reposter dijalankan sebagai layanan terpisah dan ditampilkan di dashboard melalui iframe. Atur URL layanan dengan variabel lingkungan NEXT_PUBLIC_REPOSTER_URL."
    >
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        {deepLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-200 bg-white px-3 py-1 font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-200"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </ReposterFrame>
  );
}
