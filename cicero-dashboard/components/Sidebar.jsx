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
  FilePieChart,
  Book,
  Workflow,
  Shield,
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
  const { role, profile, clientId } = useAuth();
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
  const hasDitbinmasAccess =
    clientId?.toLowerCase() === "ditbinmas" && role?.toLowerCase() === "ditbinmas";
  const canSeeExecutiveSummary = hasDitbinmasAccess;
  const canSeeSatbinmasOfficial = hasDitbinmasAccess;

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
    ...(canSeeExecutiveSummary
      ? [{ label: "Executive Summary", path: "/executive-summary", icon: FilePieChart }]
      : []),
    ...(canSeeSatbinmasOfficial
      ? [
          {
            label: "Satbinmas Official",
            path: "/satbinmas-official",
            icon: Shield,
          },
        ]
      : []),
    {
      label: "Mekanisme Sistem Absensi",
      path: "/mekanisme-absensi",
      icon: Workflow,
    },
    { label: "Panduan & SOP", path: "/panduan-sop", icon: Book },
  ];

  const navLinks = (isSheet = false, isCollapsed = false) => (
    <>
      <div className="mb-6 px-4 flex justify-center">
        <div className="rounded-xl bg-white/90 px-3 py-2 shadow-[0_12px_32px_rgba(56,189,248,0.18)] backdrop-blur dark:bg-slate-900/90 dark:shadow-[0_0_20px_rgba(56,189,248,0.35)]">
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
            : "[&>*]:shadow-[0_10px_24px_rgba(56,189,248,0.12)]"
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
                  ? "bg-gradient-to-r from-sky-100 via-sky-200 to-indigo-100 text-sky-700 ring-1 ring-sky-200 dark:from-cyan-400/30 dark:via-sky-500/30 dark:to-indigo-500/30 dark:text-sky-100 dark:ring-cyan-400/60"
                  : isSheet
                  ? "text-slate-600 hover:bg-sky-50/80 hover:text-sky-700 dark:text-slate-100 dark:hover:bg-white/10"
                  : "text-slate-600 hover:bg-sky-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-100"
              } ${isCollapsed ? "justify-center" : ""}`}
              {...(isSheet ? { onClick: () => setOpen(false) } : {})}
            >
              <ItemIcon
                className={`${
                  isSheet
                    ? "h-7 w-7 text-sky-500 dark:text-sky-300"
                    : pathname.startsWith(item.path)
                    ? "h-5 w-5 text-sky-600 drop-shadow-[0_0_6px_rgba(56,189,248,0.55)] dark:text-cyan-300"
                    : "h-5 w-5 text-slate-400 group-hover:text-sky-500 dark:text-slate-400 dark:group-hover:text-cyan-200"
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
            className="fixed z-50 top-4 left-4 flex h-12 w-12 items-center justify-center rounded-full border border-sky-300/70 bg-white/90 text-sky-600 shadow-[0_12px_32px_rgba(56,189,248,0.25)] transition-all hover:bg-sky-100 hover:text-sky-800 focus:outline-none dark:border-cyan-500/40 dark:bg-slate-900/80 dark:text-sky-200 dark:hover:bg-cyan-500/40 dark:hover:text-white"
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
          className="flex w-24 flex-col bg-white/90 p-4 text-slate-700 backdrop-blur-xl md:hidden dark:bg-slate-950/95 dark:text-slate-100"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {navLinks(true, true)}
        </SheetContent>
      </Sheet>

      <div
        className={`hidden md:sticky md:top-16 md:flex ${
          collapsed ? "md:w-20" : "md:w-64"
        } md:h-[calc(100vh-4rem)] md:flex-col md:overflow-y-auto border-r border-sky-100 bg-white/90 text-slate-700 shadow-[0_20px_45px_rgba(56,189,248,0.18)] transition-all dark:border-cyan-500/40 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-slate-100 dark:shadow-[0_0_35px_rgba(15,23,42,0.6)]`}
      >
        <div className="flex justify-end p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-full bg-sky-100/80 p-1 text-slate-500 transition hover:bg-sky-200 hover:text-sky-700 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-cyan-500/30 dark:hover:text-white"
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
