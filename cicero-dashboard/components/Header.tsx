"use client";
import Link from "next/link";
import Image from "next/image";
import useAuth from "@/hooks/useAuth";
import DarkModeToggle from "./DarkModeToggle";
import { usePathname, useRouter } from "next/navigation";
import ClientProfileMenu from "./ClientProfileMenu";

export default function Header() {
  const { setAuth } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    setAuth(null, null, null, null);
    router.replace("/login");
  };

  if (pathname === "/" || pathname === "/login") return null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sky-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border-slate-800/60 dark:bg-slate-950/90 dark:supports-[backdrop-filter]:bg-slate-950/70">
      <div className="relative flex h-20 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.32),_transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(125,211,252,0.18),_rgba(59,130,246,0.12),_rgba(99,102,241,0.22))] opacity-80 dark:bg-[linear-gradient(120deg,_rgba(129,140,248,0.18),_rgba(56,189,248,0.08),_rgba(59,130,246,0.24))]" />
        </div>
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 font-semibold text-sky-600 dark:text-sky-100"
        >
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-sky-300/80 bg-white/90 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-shadow group-hover:shadow-[0_0_32px_rgba(125,211,252,0.6)] dark:border-sky-200/70 dark:bg-slate-100/90">
            <Image
              src="/CICERO.png"
              alt="CICERO Logo"
              fill
              sizes="40px"
              className="h-6 w-6 object-contain p-2"
              priority
            />
          </span>
          <span className="text-lg tracking-[0.35em] text-sky-600 dark:text-sky-100">CICERO</span>
        </Link>
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-200">
          <DarkModeToggle />
          <ClientProfileMenu />
          <button
            onClick={handleLogout}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500 transition-colors hover:text-rose-400 dark:text-rose-300 dark:hover:text-rose-200"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
