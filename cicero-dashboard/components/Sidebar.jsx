"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { label: "Dashboard", path: "/dashboard", icon: "🏠" },
  { label: "User Directory", path: "/users", icon: "👤" },
  { label: "Social Media Content Manager", path: "/content", icon: "🗂️" },
  { label: "Instagram Likes Tracking", path: "/likes/instagram", icon: "❤️" },
  { label: "TikTok Comments Tracking", path: "/comments/tiktok", icon: "💬" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-white shadow-md min-h-screen w-64 p-6 flex flex-col">
      <div className="text-2xl font-bold text-blue-700 mb-10 tracking-wide">
        CICERO Dashboard
      </div>
      <nav className="flex flex-col gap-1">
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
    </aside>
  );
}
