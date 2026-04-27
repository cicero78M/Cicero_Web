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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 shadow-[0_6px_20px_rgba(15,23,42,0.06)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 w-full max-w-[1800px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <Image
              src="/CICERO.png"
              alt="CICERO Logo"
              fill
              sizes="36px"
              className="object-contain p-1.5"
              priority
            />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-[0.18em] text-slate-800 dark:text-slate-100">
              CICERO
            </p>
            <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-400">
              Enterprise Analytics Dashboard
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <DarkModeToggle />
          <ClientProfileMenu onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
}
