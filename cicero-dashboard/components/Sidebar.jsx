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
  Sparkles,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import useAuth from "@/hooks/useAuth";
import { hasActivePremiumSubscription, isPremiumTierAllowedForAnev } from "@/utils/premium";
import { getUserDirectoryFetchScope } from "@/utils/userDirectoryScope";

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const {
    role,
    effectiveRole,
    profile,
    clientId,
    effectiveClientType,
    premiumTier,
    premiumExpiry,
  } = useAuth();
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

  const instagramEnabledRaw = isActive(getStatus(profile, "client_insta_status"));
  const amplifyEnabled = isActive(getStatus(profile, "client_amplify_status"));
  const tiktokEnabledRaw = isActive(getStatus(profile, "client_tiktok_status"));
  const normalizedEffectiveRole = effectiveRole?.toLowerCase();
  const normalizedEffectiveClientType = effectiveClientType?.toLowerCase();
  const isOrgClient = normalizedEffectiveClientType === "org";
  const isOperator = normalizedEffectiveRole === "operator";
  const isOrgOperator = isOrgClient && isOperator;
  const normalizedClientId = clientId?.toLowerCase();
  const hasEngagementAccessOverride =
    normalizedEffectiveClientType === "org" &&
    normalizedEffectiveRole === "bidhumas";
  const instagramEnabled = instagramEnabledRaw || hasEngagementAccessOverride;
  const tiktokEnabled = tiktokEnabledRaw || hasEngagementAccessOverride;
  const hasDitbinmasAccess =
    normalizedClientId === "ditbinmas" && normalizedEffectiveRole === "ditbinmas";
  const canSeeExecutiveSummary = hasDitbinmasAccess;
  const canSeeSatbinmasOfficial = hasDitbinmasAccess;
  const hasPremiumAnevAccess = isPremiumTierAllowedForAnev(premiumTier, effectiveClientType, effectiveRole);
  const hasPremiumStatus = Boolean(
    isActive(getStatus(profile, "premium_status")) ||
      isActive(getStatus(profile, "is_premium")) ||
      isActive(getStatus(profile, "premiumStatus")),
  );
  const hasPremiumAccess = hasActivePremiumSubscription(
    premiumTier,
    premiumExpiry || getStatus(profile, "premium_expires_at") || null,
    hasPremiumStatus,
  );
  const anevPolresPath = "/anev/polres";
  
  // Get client_type from profile to determine original directorate scope
  const rawClientType = profile?.client_type || profile?.parent?.client_type || profile?.parent_client?.client_type;
  const userDirectoryScope = getUserDirectoryFetchScope({
    role: effectiveRole,
    clientType: rawClientType,
  });
  const isOriginalDirectorateScope = userDirectoryScope === "DIREKTORAT";

  const menu = [
    { label: "Dashboard", path: "/dashboard", icon: Home },
    { label: "User Directory", path: "/users", icon: Users },
    { label: "User Insight", path: "/user-insight", icon: BarChart3 },
    ...(instagramEnabled
      ? [
          ...(!isOrgOperator && isOperator
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
          ...(!isOrgOperator && isOperator
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
    ...(hasPremiumAnevAccess
      ? [
          {
            label: "Anev Polres",
            path: anevPolresPath,
            icon: FilePieChart,
          },
        ]
      : !isOriginalDirectorateScope
      ? [
          {
            label: "Anev Polres (Premium)",
            path: anevPolresPath,
            icon: Sparkles,
          },
        ]
      : []),
    {
      label: "Mekanisme Sistem Absensi",
      path: "/mekanisme-absensi",
      icon: Workflow,
    },
    ...(isOrgClient && !isOrgOperator && !hasPremiumAccess
      ? [{ label: "Premium", path: "/premium", icon: Sparkles }]
      : []),
    { label: "Panduan & SOP", path: "/panduan-sop", icon: Book },
  ];

  const isNavItemActive = (itemPath) => {
    if (itemPath === "/premium") {
      return pathname === "/premium" || pathname.startsWith("/premium/register");
    }

    return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
  };

  const navLinks = (isSheet = false, isCollapsed = false) => (
    <>
      <div className={`mb-5 ${isCollapsed ? "px-2" : "px-3"} flex justify-center`}>
        <div className="w-full rounded-2xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/CICERO.png"
              alt="CICERO Logo"
              width={isCollapsed ? 26 : 30}
              height={30}
              priority
            />
            {!isCollapsed && (
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 dark:text-slate-200">
                CICERO
              </span>
            )}
          </div>
        </div>
      </div>
      <nav className={`flex-1 space-y-1.5 ${isCollapsed ? "px-2" : "px-3"}`}>
        {menu.map((item) => {
          const ItemIcon = item.icon;
          const active = isNavItemActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-cyan-500/60 dark:bg-cyan-500/10 dark:text-cyan-200"
                  : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
              } ${isCollapsed ? "justify-center" : ""}`}
              {...(isSheet ? { onClick: () => setOpen(false) } : {})}
            >
              <ItemIcon
                className={`h-[18px] w-[18px] ${
                  active
                    ? "text-sky-600 dark:text-cyan-300"
                    : "text-slate-400 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-200"
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
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
            className="fixed left-3 top-[4.65rem] z-30 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-md transition-colors hover:bg-slate-50 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
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
          className="flex w-[280px] flex-col border-r border-slate-200 bg-white p-4 text-slate-700 md:hidden dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {navLinks(true, false)}
        </SheetContent>
      </Sheet>

      <div
        className={`hidden md:sticky md:top-16 md:flex ${
          collapsed ? "md:w-20" : "md:w-72"
        } md:h-[calc(100vh-4rem)] md:flex-col md:overflow-y-auto border-r border-slate-200 bg-white text-slate-700 transition-all dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          {!collapsed && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
              Main Navigation
            </span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="rounded-lg border border-slate-200 bg-white p-1 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
