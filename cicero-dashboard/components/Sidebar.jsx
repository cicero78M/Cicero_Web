"use client";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu as IconMenu, X as IconX } from "lucide-react"; // Import lucide icons

const menu = [
  { label: "Dashboard", path: "/dashboard", icon: "🏠" },
  { label: "User Directory", path: "/users", icon: "👤" },
  { label: "Social Media Content Manager", path: "/content", icon: "🗂️" },
  { label: "Instagram Likes Tracking", path: "/likes/instagram", icon: "❤️" },
  { label: "TikTok Comments Tracking", path: "/comments/tiktok", icon: "💬" },
];

export default function ProSidebarWrapper() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Logout logic
  const handleLogout = () => {
    localStorage.removeItem("cicero_token");
    localStorage.removeItem("client_id");
    router.replace("/login");
  };

  return (
    <div>
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className={`
          fixed z-50 top-4 left-4 flex items-center justify-center
          bg-white shadow-lg border border-blue-200 text-blue-700
          rounded-full w-12 h-12 transition-all
          hover:bg-blue-700 hover:text-white group
          focus:outline-none
        `}
        aria-label={collapsed ? "Tampilkan Sidebar" : "Sembunyikan Sidebar"}
        style={{
          left: collapsed ? "16px" : "272px",
        }}
      >
        {collapsed ? (
          <IconMenu size={28} strokeWidth={2.5} className="transition-all group-hover:scale-110" />
        ) : (
          <IconX size={28} strokeWidth={2.5} className="transition-all group-hover:scale-110" />
        )}
      </button>

      {/* Sidebar dari react-pro-sidebar */}
      <Sidebar
        collapsed={collapsed}
        breakPoint="md"
        backgroundColor="#fff"
        className="!fixed !left-0 !top-0 !h-screen !z-40"
        width="256px"
        rootStyles={{
          minHeight: "100dvh",
          boxShadow: "0 0 24px #0001",
        }}
      >
        <div className="text-2xl font-bold text-blue-700 mb-6 mt-8 px-6 tracking-wide">
          {collapsed ? "🟦" : "CICERO Dashboard"}
        </div>
        <Menu>
          {menu.map((item) => (
            <MenuItem
              key={item.path}
              component={<Link href={item.path} />}
              active={pathname.startsWith(item.path)}
              icon={<span className="text-xl">{item.icon}</span>}
              className={
                pathname.startsWith(item.path)
                  ? "!bg-blue-100 !text-blue-700 font-semibold"
                  : "hover:!bg-blue-50 hover:!text-blue-700"
              }
            >
              {collapsed ? "" : item.label}
            </MenuItem>
          ))}
        </Menu>
        <div className="flex-1" />
        <div className="px-4 mt-8 mb-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-100 hover:bg-red-200 text-red-700 font-semibold p-4 rounded-xl transition-all"
          >
            {collapsed ? <span className="text-xl">🚪</span> : "Logout"}
          </button>
        </div>
      </Sidebar>
    </div>
  );
}
