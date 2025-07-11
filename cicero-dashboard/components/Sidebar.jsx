"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu as IconMenu,
  X as IconX,
  Home,
  Users,
  Instagram,
  Heart,
  Music,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

const menu = [
  { label: "Dashboard", path: "/dashboard", icon: Home },
  { label: "User Directory", path: "/users", icon: Users },
  { label: "Instagram Post Analysis", path: "/instagram", icon: Instagram },
  { label: "Instagram Likes Tracking", path: "/likes/instagram", icon: Heart },
  { label: "Link Amplification", path: "/amplify", icon: LinkIcon },
  { label: "TikTok Post Analysis", path: "/tiktok", icon: Music },
  { label: "TikTok Comments Tracking", path: "/comments/tiktok", icon: MessageCircle },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navLinks = (isSheet = false, isCollapsed = false) => (
    <>
      <div className="mb-6 px-4 flex justify-center">
        <Image
          src="/CICERO.png"
          alt="CICERO Logo"
          width={isCollapsed ? 32 : 150}
          height={40}
          priority
        />
      </div>
      <nav className="flex-1 space-y-1 px-2">
        {menu.map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${pathname.startsWith(item.path) ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"} ${isCollapsed ? "justify-center" : ""}`}
              {...(isSheet ? { onClick: () => setOpen(false) } : {})}
            >
              <ItemIcon className="w-5 h-5" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild className="md:hidden">
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
        <SheetContent side="left" className="w-64 p-4 flex flex-col md:hidden">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {navLinks(true, false)}
        </SheetContent>
      </Sheet>

      <div
        className={`hidden md:flex ${collapsed ? "md:w-20" : "md:w-64"} md:flex-col md:border-r md:bg-white md:shadow-sm md:min-h-screen transition-all`}
      >
        <div className="flex justify-end p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Toggle Sidebar"
          >
            {collapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>
        {navLinks(false, collapsed)}
      </div>
    </>
  );
}
