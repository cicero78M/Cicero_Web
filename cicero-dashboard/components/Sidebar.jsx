"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const menu = [
  { label: "Dashboard", path: "/dashboard", icon: "🏠" },
  { label: "User Directory", path: "/users", icon: "👤" },
  { label: "Social Media Content Manager", path: "/content", icon: "🗂️" },
  { label: "Instagram Likes Tracking", path: "/likes/instagram", icon: "❤️" },
  { label: "TikTok Comments Tracking", path: "/comments/tiktok", icon: "💬" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(true);

  // Logout logic
  const handleLogout = () => {
    localStorage.removeItem("cicero_token");
    localStorage.removeItem("client_id");
    router.replace("/login");
  };

  return (
    <>
      {/* Tombol Sembunyikan/Tampilkan Sidebar (mobile only) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="
          fixed z-40 top-4 left-4 bg-blue-800 text-white rounded-full p-2 shadow-lg md:hidden
        "
        aria-label={open ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
      >
        {open ? (
          // Icon X (close)
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 18L18 6M6 6l12 12"/></svg>
        ) : (
          // Icon Hamburger (menu)
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h18M4 13h18M4 19h18"/></svg>
        )}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          ${open ? "translate-x-0" : "-translate-x-full"}
          fixed md:static z-30 left-0 top-0 h-full w-64 bg-white shadow-md p-6 flex flex-col transition-transform duration-300
        `}
        style={{
          minHeight: "100dvh",
          maxHeight: "100dvh",
        }}
      >
        <div className="text-2xl font-bold text-blue-700 mb-10 tracking-wide">
          CICERO Dashboard
        </div>
        <nav className="flex flex-col gap-1 flex-1">
          {menu.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium
                ${pathname.startsWith(item.path)
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"}
              `}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        {/* Tombol Logout di bawah */}
        <button
          onClick={handleLogout}
          className="w-full mt-8 bg-red-100 hover:bg-red-200 text-red-700 font-semibold p-4 rounded-t-xl transition-all"
        >
          Logout
        </button>
      </aside>

      {/* Overlay ketika sidebar terbuka di mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
