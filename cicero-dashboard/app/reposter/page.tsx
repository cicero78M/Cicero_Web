import Link from "next/link";
import ReposterShell from "./ReposterShell";

export default function ReposterPage() {
  const quickLinks = [
    {
      label: "Profil pengguna",
      href: "/reposter/profile",
      description: "Ringkasan data akun reposter yang sedang login.",
    },
    {
      label: "Tugas official",
      href: "/reposter/tasks/official",
      description: "Pantau tugas resmi yang perlu ditindaklanjuti.",
    },
    {
      label: "Tugas khusus",
      href: "/reposter/tasks/special",
      description: "Kelola kampanye tematik dan tugas khusus.",
    },
  ];

  return (
    <ReposterShell
      title="Kelola konten ulang (Reposter)"
      description="Pilih modul yang ingin dikelola untuk memastikan tugas reposter berjalan konsisten."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-100 dark:hover:border-cyan-400"
          >
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
              {link.label}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              {link.description}
            </p>
          </Link>
        ))}
      </div>
    </ReposterShell>
  );
}
