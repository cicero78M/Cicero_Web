"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Menu as IconMenu, X as IconX } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";

const menu = [
  { label: "Dashboard", path: "/dashboard", icon: "🏠" },
  { label: "Profile", path: "/profile", icon: "🙍" },
  { label: "User Directory", path: "/users", icon: "👤" },
  { label: "Instagram Post Analysis", path: "/instagram", icon: "📸" },
  { label: "Instagram Likes Tracking", path: "/likes/instagram", icon: "❤️" },
  { label: "TikTok Post Analysis", path: "/tiktok", icon: "🎵" },
  { label: "TikTok Comments Tracking", path: "/comments/tiktok", icon: "💬" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { setAuth } = useAuth();

  const handleLogout = () => {
    setAuth(null, null);
    router.replace("/login");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label={open ? "Tutup Sidebar" : "Buka Sidebar"}
          className="fixed z-50 top-4 left-4 flex items-center justify-center bg-white shadow-lg border border-blue-200 text-blue-700 rounded-full w-12 h-12 transition-all hover:bg-blue-700 hover:text-white focus:outline-none"
        >
          {open ? (
            <IconX size={28} strokeWidth={2.5} />
          ) : (
            <IconMenu size={28} strokeWidth={2.5} />
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-6 flex flex-col">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <div className="text-2xl font-bold text-blue-700 mb-6">CICERO Dashboard</div>
        <nav className="flex-1 space-y-2">
          {menu.map((item) => (
            <SheetClose asChild key={item.path}>
              <Link
                href={item.path}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-blue-50 hover:text-blue-700 ${pathname.startsWith(item.path) ? "bg-blue-100 text-blue-700" : "text-gray-700"}`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-4 w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2 rounded-lg"
        >
          Logout
        </button>
      </SheetContent>
    </Sheet>
  );
}
