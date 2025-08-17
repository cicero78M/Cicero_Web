"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
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
    setAuth(null, null, null);
    router.replace("/login");
  };

  if (pathname === "/" || pathname === "/login") return null;

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center font-bold text-blue-700 dark:text-blue-300"
        >
          <Image
            src="/CICERO.png"
            alt="CICERO Logo"
            width={24}
            height={24}
            className="mr-2"
            priority
          />
          CICERO
        </Link>
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${pathname.startsWith(item.path) ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <DarkModeToggle />
          <ClientProfileMenu />
          <button
            onClick={handleLogout}
            className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
