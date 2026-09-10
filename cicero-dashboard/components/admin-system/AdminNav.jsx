"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  ["/admin-system", "Overview"],
  ["/admin-system/analysis", "System Analysis"],
  ["/admin-system/clients", "Clients"],
  ["/admin-system/payments", "Payments"],
  ["/admin-system/funds", "Funds"],
];

export default function AdminNav() {
  const pathname = usePathname();
  return <nav aria-label="Admin system navigation" className="admin-nav overflow-x-auto rounded-xl border border-cyan-400/15 bg-slate-900/80 p-2 shadow-lg shadow-cyan-950/10"><div className="flex min-w-max items-center gap-1">{items.map(([href, label]) => { const active = href === "/admin-system" ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active ? "bg-cyan-400 text-slate-950 shadow-[0_0_18px_rgba(34,211,238,0.25)]" : "text-slate-400 hover:bg-slate-800 hover:text-cyan-200"}`}>{label}</Link>; })}</div></nav>;
}
