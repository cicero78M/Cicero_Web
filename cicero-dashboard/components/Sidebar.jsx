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
  BarChart3,
  Instagram,
  Heart,
  Music,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Link as LinkIcon,
  Book,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import useAuth from "@/hooks/useAuth";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { role, profile } = useAuth();
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
  const isOperator = role?.toLowerCase() === "operator";

  const menu = [
    { label: "Dashboard", path: "/dashboard", icon: Home },
    { label: "User Directory", path: "/users", icon: Users },
    { label: "User Insight", path: "/user-insight", icon: BarChart3 },
    ...(instagramEnabled
      ? [
          ...(isOperator
            ? [{
                label: "Instagram Post Analysis",
                path: "/instagram",
                icon: Instagram,
              }]
            : []),
          { label: "Instagram Engagement Insight", path: "/likes/instagram", icon: Heart },
        ]
      : []),
    ...(amplifyEnabled
      ? [{ label: "Diseminasi Insight", path: "/amplify", icon: LinkIcon }]
      : []),
    ...(tiktokEnabled
      ? [
          ...(isOperator
            ? [{
                label: "TikTok Post Analysis",
                path: "/tiktok",
                icon: Music,
              }]
            : []),
          {
            label: "TikTok Engagement Insight",
            path: "/comments/tiktok",
            icon: MessageCircle,
          },
        ]
      : []),
    { label: "Panduan & SOP", path: "/panduan-sop", icon: Book },
  ];

  const navLinks = (isSheet = false, isCollapsed = false) => (
    <>
      <div className="mb-6 px-4 flex justify-center">
        <div className="rounded-xl bg-white/90 px-3 py-2 shadow-[0_0_20px_rgba(56,189,248,0.35)] backdrop-blur">
          <Image
            src="/CICERO.png"
            alt="CICERO Logo"
            width={isCollapsed ? 32 : 150}
            height={40}
            priority
          />
        </div>
      </div>
      <nav
        className={`flex-1 space-y-1 px-2 ${
          isSheet
            ? ""
            : "[&>*]:shadow-[0_0_10px_rgba(56,189,248,0.15)]"
        }`}
      >
        {menu.map((item) => {
          const ItemIcon = item.icon;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                pathname.startsWith(item.path)
                  ? "bg-gradient-to-r from-cyan-400/30 via-sky-500/30 to-indigo-500/30 text-sky-100 ring-1 ring-cyan-400/60"
                  : isSheet
                  ? "text-slate-100 hover:bg-white/10"
                  : "text-slate-300 hover:bg-white/10 hover:text-slate-100"
              } ${isCollapsed ? "justify-center" : ""}`}
              {...(isSheet ? { onClick: () => setOpen(false) } : {})}
            >
              <ItemIcon
                className={`${
                  isSheet
                    ? "h-7 w-7 text-sky-300"
                    : pathname.startsWith(item.path)
                    ? "h-5 w-5 text-cyan-300 drop-shadow-[0_0_4px_rgba(34,211,238,0.9)]"
                    : "h-5 w-5 text-slate-400 group-hover:text-cyan-200"
                }`}
              />
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
            className="fixed z-50 top-4 left-4 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-500/40 bg-slate-900/80 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.45)] transition-all hover:bg-cyan-500/40 hover:text-white focus:outline-none"
          >
            {open ? (
              <IconX size={28} strokeWidth={2.5} />
            ) : (
              <IconMenu size={28} strokeWidth={2.5} />
            )}
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="flex w-24 flex-col bg-slate-950/95 p-4 text-slate-100 backdrop-blur-xl md:hidden"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {navLinks(true, true)}
        </SheetContent>
      </Sheet>

      <div
        className={`hidden md:sticky md:top-16 md:flex ${
          collapsed ? "md:w-20" : "md:w-64"
        } md:h-[calc(100vh-4rem)] md:flex-col md:overflow-y-auto border-r border-cyan-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 shadow-[0_0_35px_rgba(15,23,42,0.6)] transition-all`}
      >
        <div className="flex justify-end p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-full bg-white/5 p-1 text-slate-400 transition hover:bg-cyan-500/30 hover:text-white"
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
