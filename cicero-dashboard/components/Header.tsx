"use client";
import Link from "next/link";
import Image from "next/image";
import useAuth from "@/hooks/useAuth";
import DarkModeToggle from "./DarkModeToggle";
import { usePathname, useRouter } from "next/navigation";
import ClientProfileMenu from "./ClientProfileMenu";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Users", path: "/users" },
  { label: "Instagram", path: "/instagram" },
  { label: "TikTok", path: "/tiktok" },
];

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
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/60 bg-slate-950/90 backdrop-blur supports-[backdrop-filter]:bg-slate-950/70">
      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.32),_transparent_55%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(120deg,_rgba(129,140,248,0.18),_rgba(56,189,248,0.08),_rgba(59,130,246,0.24))] opacity-80" />
        </div>
        <Link
          href="/dashboard"
          className="group flex items-center gap-3 font-semibold text-sky-100"
        >
          <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-sky-400/50 bg-slate-950/80 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-shadow group-hover:shadow-[0_0_32px_rgba(125,211,252,0.6)]">
            <Image
              src="/CICERO.png"
              alt="CICERO Logo"
              fill
              sizes="40px"
              className="h-6 w-6 object-contain p-2"
              priority
            />
          </span>
          <span className="text-lg tracking-[0.35em] text-sky-100">CICERO</span>
        </Link>
        <nav className="hidden gap-6 md:flex">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={isActive ? "page" : undefined}
                className={`group relative text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 transition-colors duration-200 hover:text-sky-200 ${isActive ? "text-sky-300" : ""}`}
              >
                <span className="relative z-10">{item.label}</span>
                <span
                  aria-hidden
                  className={`absolute inset-x-0 -bottom-2 h-0.5 origin-center rounded-full bg-sky-300/80 transition-transform duration-200 ease-out ${isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`}
                />
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3 text-slate-200">
          <DarkModeToggle />
          <ClientProfileMenu />
          <button
            onClick={handleLogout}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-300 transition-colors hover:text-rose-200"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
