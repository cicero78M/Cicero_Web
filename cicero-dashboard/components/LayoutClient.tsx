"use client";
import { usePathname } from "next/navigation";
import SidebarWrapper from "./SidebarWrapper";
import DarkModeToggle from "./DarkModeToggle";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Landing and login pages render without sidebar
  if (pathname === "/" || pathname === "/login") {
    return (
      <main id="main-content" className="min-h-screen">
        {children}
      </main>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 relative">
      <div className="absolute top-4 right-4 z-50">
        <DarkModeToggle />
      </div>
      <aside aria-label="Sidebar navigation">
        <SidebarWrapper />
      </aside>
      <main
        id="main-content"
        className="flex-1 min-h-screen p-4 md:p-8"
      >
        {children}
      </main>
    </div>
  );
}
