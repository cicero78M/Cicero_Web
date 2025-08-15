"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu as IconMenu,
  X as IconX,
  Home,
  Users,
  BarChart3,
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
import { useAuth } from "@/context/AuthContext";
import { getClientProfile } from "@/utils/api";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { token, clientId } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      if (!token || !clientId) return;
      try {
        const res = await getClientProfile(token, clientId);
        setProfile(res.client || res.profile || res);
      } catch (err) {
        console.error(err);
      }
    }
    fetchProfile();
  }, [token, clientId]);
  function isActive(val) {
    return val === true || val === "true" || val === 1 || val === "1";
  }

  function getStatus(obj, key) {
    return (
      obj?.[key] ??
      obj?.parent?.[key] ??
      obj?.parent_client?.[key] ??
      obj?.parentClient?.[key] ??
      obj?.parent_profile?.[key]
    );
  }

  const instagramEnabled = isActive(getStatus(profile, "client_insta_status"));
  const amplifyEnabled = isActive(getStatus(profile, "client_amplify_status"));
  const tiktokEnabled = isActive(getStatus(profile, "client_tiktok_status"));

  const menu = [
    { label: "Dashboard", path: "/dashboard", icon: Home },
    { label: "User Directory", path: "/users", icon: Users },
    { label: "User Insight", path: "/user-insight", icon: BarChart3 },
    ...(instagramEnabled
      ? [
          { label: "Instagram Post Analysis", path: "/instagram", icon: Instagram },
          { label: "Instagram Engagement Insight", path: "/likes/instagram", icon: Heart },
        ]
      : []),
    ...(amplifyEnabled
      ? [{ label: "Diseminasi Insight", path: "/amplify", icon: LinkIcon }]
      : []),
    ...(tiktokEnabled
      ? [
          { label: "TikTok Post Analysis", path: "/tiktok", icon: Music },
          { label: "TikTok Engagement Insight", path: "/comments/tiktok", icon: MessageCircle },
        ]
      : []),
  ];

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
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname.startsWith(item.path)
                  ? "bg-blue-100 text-blue-700"
                  : isSheet
                  ? "text-blue-700 hover:bg-blue-50"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              } ${isCollapsed ? "justify-center" : ""}`}
              {...(isSheet ? { onClick: () => setOpen(false) } : {})}
            >
              <ItemIcon className={`${isSheet ? 'w-7 h-7 text-blue-700' : 'w-5 h-5'}`} />
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
        <SheetContent side="left" className="w-20 p-4 flex flex-col md:hidden">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {navLinks(true, true)}
        </SheetContent>
      </Sheet>

      <div
        className={`hidden md:flex ${collapsed ? "md:w-20" : "md:w-64"} md:flex-col md:border-r md:bg-white md:shadow-sm md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:overflow-y-auto transition-all`}
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
