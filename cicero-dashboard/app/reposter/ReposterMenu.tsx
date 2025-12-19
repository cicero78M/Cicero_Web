"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU_ITEMS = [
  {
    label: "Profil",
    href: "/reposter/profile",
    description: "Data akun dan identitas reposter.",
  },
  {
    label: "Tugas Official",
    href: "/reposter/tasks/official",
    description: "Daftar tugas resmi yang harus dikerjakan.",
  },
  {
    label: "Tugas Khusus",
    href: "/reposter/tasks/special",
    description: "Kampanye tematik atau tugas khusus.",
  },
];

export default function ReposterMenu() {
  const pathname = usePathname();

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {MENU_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-2xl border p-4 transition ${
              isActive
                ? "border-sky-400 bg-sky-50 text-sky-700 shadow-sm dark:border-cyan-400/70 dark:bg-cyan-950/40 dark:text-cyan-100"
                : "border-slate-200 bg-white text-slate-700 hover:border-sky-300 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-cyan-400"
            }`}
          >
            <p className="text-sm font-semibold">{item.label}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              {item.description}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
